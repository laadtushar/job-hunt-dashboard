import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { AIService } from "@/services/ai";
import { NextResponse } from "next/server";
import { addDays, formatDistanceToNow, isBefore, isAfter } from "date-fns";

export const maxDuration = 60;

export async function GET() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const jobs = await prisma.jobApplication.findMany({
            where: {
                userId: session.user.id,
                isIgnored: false,
            },
            select: {
                id: true,
                company: true,
                role: true,
                status: true,
                source: true,
                appliedDate: true,
                lastUpdate: true,
                interviewDate: true,
                offerDeadline: true,
                recruiterName: true,
                nextSteps: true,
                feedback: true,
                sentimentScore: true,
                rejectionReason: true,
                emailLogs: {
                    orderBy: { receivedDate: "desc" },
                    take: 1,
                    select: { subject: true, snippet: true, receivedDate: true },
                },
            },
            orderBy: { lastUpdate: "desc" },
        });

        const now = new Date();
        const insights: any[] = [];

        // --- DETERMINISTIC INSIGHTS ---

        // 1. Expiring offers
        const expiringOffers = jobs.filter(
            (j) =>
                j.offerDeadline &&
                isBefore(new Date(j.offerDeadline), addDays(now, 3)) &&
                isAfter(new Date(j.offerDeadline), now)
        );
        expiringOffers.forEach((job) => {
            insights.push({
                id: `deadline-${job.id}`,
                category: "URGENT",
                title: `Offer from ${job.company} expiring soon`,
                description: `Your offer expires in ${formatDistanceToNow(new Date(job.offerDeadline!))}. Make your decision before it's too late.`,
                priority: 1,
            });
        });

        // 2. Upcoming interviews
        const upcomingInterviews = jobs.filter(
            (j) =>
                j.interviewDate &&
                isAfter(new Date(j.interviewDate), now) &&
                isBefore(new Date(j.interviewDate), addDays(now, 3))
        );
        upcomingInterviews.forEach((job) => {
            insights.push({
                id: `interview-${job.id}`,
                category: "URGENT",
                title: `Interview with ${job.company} coming up`,
                description: `Prepare for your upcoming ${job.role} interview. Research the company and review your notes.`,
                priority: 1,
            });
        });

        // 3. Stale screenings / potential ghosts
        const staleScreens = jobs.filter((j) => {
            const daysSinceUpdate = Math.floor(
                (now.getTime() - new Date(j.lastUpdate).getTime()) / 86400000
            );
            return j.status === "SCREEN" && daysSinceUpdate > 10;
        });
        if (staleScreens.length > 0) {
            insights.push({
                id: "stale-screens",
                category: "FOLLOW_UP",
                title: `${staleScreens.length} screening${staleScreens.length > 1 ? "s" : ""} with no update`,
                description: `${staleScreens.slice(0, 3).map((j) => j.company).join(", ")}${staleScreens.length > 3 ? ` and ${staleScreens.length - 3} more` : ""} haven't responded in over 10 days. Consider following up.`,
                priority: 2,
            });
        }

        // 4. Application velocity
        const recentApps = jobs.filter(
            (j) => new Date(j.appliedDate) > addDays(now, -7)
        ).length;
        if (recentApps > 0) {
            insights.push({
                id: "velocity",
                category: "TREND",
                title: `${recentApps} application${recentApps > 1 ? "s" : ""} this week`,
                description:
                    recentApps >= 5
                        ? "Great momentum! You're maintaining a strong outbound pace."
                        : recentApps >= 2
                            ? "Steady progress. Consider increasing volume for better odds."
                            : "Consider ramping up your applications this week for better coverage.",
                priority: 3,
            });
        }

        // 5. Response rate
        const totalApps = jobs.length;
        const responded = jobs.filter((j) =>
            ["SCREEN", "INTERVIEW", "OFFER"].includes(j.status)
        ).length;
        const responseRate = totalApps > 0 ? Math.round((responded / totalApps) * 100) : 0;
        if (totalApps >= 5) {
            insights.push({
                id: "response-rate",
                category: "TREND",
                title: `${responseRate}% response rate`,
                description:
                    responseRate >= 20
                        ? `Your ${responseRate}% response rate is above average. Your targeting strategy is working well.`
                        : `Your ${responseRate}% response rate suggests room for improvement. Consider tailoring resumes more closely to each role.`,
                priority: 3,
            });
        }

        // 6. Pending next steps
        const withNextSteps = jobs.filter(
            (j) => j.nextSteps && j.nextSteps.length > 5 && !["REJECTED", "GHOSTED"].includes(j.status)
        );
        if (withNextSteps.length > 0) {
            const top = withNextSteps[0];
            insights.push({
                id: `nextstep-${top.id}`,
                category: "TODO",
                title: `Action needed for ${top.company}`,
                description: top.nextSteps!.substring(0, 150) + (top.nextSteps!.length > 150 ? "..." : ""),
                priority: 2,
            });
        }

        // --- AI STRATEGY INSIGHTS ---
        // Build a concise portfolio summary for the AI
        const statusCounts: Record<string, number> = {};
        jobs.forEach((j) => {
            statusCounts[j.status] = (statusCounts[j.status] || 0) + 1;
        });

        const portfolioSummary = [
            `Total applications: ${totalApps}`,
            `Status breakdown: ${Object.entries(statusCounts).map(([k, v]) => `${k}: ${v}`).join(", ")}`,
            `Response rate: ${responseRate}%`,
            `Applications this week: ${recentApps}`,
            `Stale screenings (10+ days): ${staleScreens.length}`,
            `Active offers: ${jobs.filter((j) => j.status === "OFFER").length}`,
            `Top companies in pipeline: ${jobs.slice(0, 10).map((j) => `${j.company} (${j.status})`).join(", ")}`,
        ].join("\n");

        try {
            const ai = new AIService();
            const aiInsights = await ai.generateStrategyInsights(portfolioSummary);
            insights.push(...aiInsights);
        } catch (e) {
            console.error("[Strategy] AI insights failed, returning deterministic only:", e);
        }

        // Sort by priority and return
        insights.sort((a: any, b: any) => a.priority - b.priority);

        return NextResponse.json({ insights });
    } catch (error: any) {
        console.error("[Strategy API] Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

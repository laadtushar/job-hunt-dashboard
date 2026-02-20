import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { AIService } from "@/services/ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const ai = new AIService();

        // 1. Get recent ignored emails
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const ignoredEmails = await prisma.emailLog.findMany({
            where: {
                isIgnored: true,
                createdAt: { gte: sevenDaysAgo }
            },
            take: 20 // Limit scan for performance
        });

        // 2. Get active applications
        const activeApps = await prisma.jobApplication.findMany({
            where: {
                userId: session.user.id,
                status: { notIn: ["REJECTED", "OFFER", "GHOSTED"] }
            }
        });

        const corrections: any[] = [];

        // 3. Reflexion Loop: Re-evaluate emails against context
        for (const email of ignoredEmails) {
            // Find potentially related app by company name match in subject/sender
            const candidateApp = activeApps.find(app =>
                (email.subject?.toLowerCase().includes(app.company.toLowerCase())) ||
                (email.sender?.toLowerCase().includes(app.company.toLowerCase()))
            );

            if (candidateApp) {
                const result = await ai.reClassifyEmail(email, candidateApp);
                if (result.shouldReclassify && result.newStatus && result.newStatus !== candidateApp.status) {
                    // Correct the status
                    await prisma.jobApplication.update({
                        where: { id: candidateApp.id },
                        data: { status: result.newStatus }
                    });

                    // Update EmailLog
                    await prisma.emailLog.update({
                        where: { id: email.id },
                        data: { isIgnored: false, applicationId: candidateApp.id }
                    });

                    corrections.push({
                        company: candidateApp.company,
                        oldStatus: candidateApp.status,
                        newStatus: result.newStatus,
                        reasoning: result.reasoning
                    });
                }
            }
        }

        if (corrections.length > 0) {
            await prisma.agentAuditLog.create({
                data: {
                    userId: session.user.id,
                    type: "DRIFT_CORRECT",
                    payload: JSON.stringify({ corrections }),
                    reflection: `Auto-corrected ${corrections.length} status drifts detected from recently ignored emails.`,
                    status: "COMPLETED"
                }
            });
        }

        return NextResponse.json({
            message: `Scanned ${ignoredEmails.length} emails, made ${corrections.length} corrections.`,
            corrections
        });

    } catch (error: any) {
        console.error("Drift Scan Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

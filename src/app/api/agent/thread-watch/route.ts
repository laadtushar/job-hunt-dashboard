import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { AIService } from "@/services/ai";
import { GmailService } from "@/services/gmail";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const ai = new AIService();

        // 1. Get account for Gmail API
        const account = await prisma.account.findFirst({
            where: { userId: session.user.id, provider: "google" },
        });

        if (!account?.access_token) {
            return NextResponse.json({ error: "Gmail access not found." }, { status: 403 });
        }

        const gmail = new GmailService(account.access_token, account.refresh_token as string);

        // 2. Get active applications in late stages
        const activeApps = await prisma.jobApplication.findMany({
            where: {
                userId: session.user.id,
                status: { in: ["SCREEN", "INTERVIEW", "OFFER"] }
            },
            include: { emailLogs: { orderBy: { receivedDate: 'desc' }, take: 1 } }
        });

        const threadCandidates: any[] = [];

        // 3. For each app, check the last email status
        for (const app of activeApps) {
            const lastLog = app.emailLogs[0];
            if (lastLog) {
                // If last email was more than 24h ago
                const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
                if (lastLog.receivedDate < oneDayAgo) {
                    threadCandidates.push({
                        company: app.company,
                        role: app.role,
                        lastSender: lastLog.sender,
                        lastDate: lastLog.receivedDate.toISOString(),
                        threadId: lastLog.threadId
                    });
                }
            }
        }

        if (threadCandidates.length === 0) {
            return NextResponse.json({ message: "No unanswered threads detected.", alerts: [] });
        }

        // 4. Use AI to assess urgency
        const alerts = await ai.assessUnansweredThreads(threadCandidates);

        // 5. Log to AgentAuditLog
        if (alerts.length > 0) {
            await prisma.agentAuditLog.create({
                data: {
                    userId: session.user.id,
                    type: "THREAD_WATCH",
                    payload: JSON.stringify({ alerts }),
                    reflection: `Identified ${alerts.length} threads requiring user attention due to inactivity.`,
                    status: "COMPLETED"
                }
            });

            // Create Tasks for URGENT/HIGH alerts
            for (const alert of alerts) {
                if (alert.urgency === "URGENT" || alert.urgency === "HIGH") {
                    await prisma.task.create({
                        data: {
                            userId: session.user.id,
                            title: `Reply to ${alert.company}`,
                            description: `AI detected an unanswered message from ${alert.company} regarding the ${alert.role} role. Reasoning: ${alert.reasoning}`,
                            priority: alert.urgency,
                            category: "FOLLOW_UP",
                            source: "THREAD_WATCH"
                        }
                    });
                }
            }
        }

        return NextResponse.json({
            message: `Scanned active threads, found ${alerts.length} needing attention.`,
            alerts
        });

    } catch (error: any) {
        console.error("Thread Watch Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

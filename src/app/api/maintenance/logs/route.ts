import { auth } from "@/auth";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const logs = await prisma.emailLog.findMany({
            take: 50,
            orderBy: { receivedDate: 'desc' },
            include: {
                application: {
                    select: { id: true, company: true, role: true, status: true }
                }
            }
        });

        // Parse AI output for frontend display if needed, or send raw
        const sanitizedLogs = logs.map(log => {
            let parsedAi = null;
            try {
                if (log.aiOutput) parsedAi = JSON.parse(log.aiOutput);
            } catch (e) { }

            return {
                id: log.id,
                receivedDate: log.receivedDate,
                sender: log.sender || "Unknown",
                subject: log.subject || "No Subject",
                isIgnored: log.isIgnored,
                applicationId: log.applicationId,
                application: log.application,
                aiSummary: parsedAi ? {
                    isJobRelated: parsedAi.isJobRelated,
                    company: parsedAi.company,
                    role: parsedAi.role,
                    confidence: parsedAi.sentimentScore
                } : null
            };
        });

        return NextResponse.json({ logs: sanitizedLogs });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

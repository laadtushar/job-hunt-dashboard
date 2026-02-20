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

        // 1. Query for stale applications (APPLIED or SCREEN, no update in 14 days)
        const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
        const staleApps = await prisma.jobApplication.findMany({
            where: {
                userId: session.user.id,
                status: { in: ["APPLIED", "SCREEN"] },
                lastUpdate: { lt: fourteenDaysAgo }
            }
        });

        if (staleApps.length === 0) {
            return NextResponse.json({ message: "No stale applications found.", ghostedApps: [] });
        }

        // 2. Call AI to detect ghosting probability
        const evaluations = await ai.detectGhostApplications(staleApps);

        const ghostedApps = evaluations.filter(e => e.isGhosted);

        // 3. Log findings to AgentAuditLog
        if (ghostedApps.length > 0) {
            await prisma.agentAuditLog.create({
                data: {
                    userId: session.user.id,
                    type: "GHOST_DETECT",
                    payload: JSON.stringify({
                        evaluatedCount: staleApps.length,
                        ghostedCount: ghostedApps.length,
                        details: ghostedApps
                    }),
                    reflection: `Identified ${ghostedApps.length} potential ghosted applications from ${staleApps.length} stale ones.`,
                    status: "COMPLETED"
                }
            });

            // Optionally: Auto-update status to GHOSTED? 
            // For now, let's keep it as a detection and let the chat flow handle it or nudge user.
        }

        return NextResponse.json({
            message: `Scanned ${staleApps.length} applications, found ${ghostedApps.length} potential ghosts.`,
            ghostedApps
        });

    } catch (error: any) {
        console.error("Ghost Scan Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

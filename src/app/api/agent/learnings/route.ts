import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        // 1. Get recent search logs
        const searchLogs = await prisma.agentSearchLog.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: 'desc' },
            take: 10
        });

        // 2. Get recent audit logs
        const auditLogs = await prisma.agentAuditLog.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: 'desc' },
            take: 20
        });

        // 3. Aggregate data
        const stats = {
            totalSearches: searchLogs.length,
            ghostsDetected: auditLogs.filter(l => l.type === "GHOST_DETECT").length,
            driftsCorrected: auditLogs.filter(l => l.type === "DRIFT_CORRECT").length,
            duplicatesFound: auditLogs.filter(l => l.type === "DUPLICATE_SCAN").length,
            threadsFlagged: auditLogs.filter(l => l.type === "THREAD_WATCH").length
        };

        const recentLearnings = [
            ...searchLogs.map(l => ({ date: l.createdAt, category: "SEARCH", reflection: l.reflection })),
            ...auditLogs.map(l => ({ date: l.createdAt, category: l.type, reflection: l.reflection }))
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 15);

        return NextResponse.json({
            stats,
            recentLearnings
        });

    } catch (error: any) {
        console.error("Learnings Fetch Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

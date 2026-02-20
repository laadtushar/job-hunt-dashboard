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

        // 1. Get all active applications (not rejected/ghosted/offered recently)
        const activeApps = await prisma.jobApplication.findMany({
            where: {
                userId: session.user.id,
                status: { notIn: ["REJECTED", "GHOSTED"] }
            },
            take: 50 // Safety limit for large candidate lists
        });

        if (activeApps.length < 2) {
            return NextResponse.json({ message: "Not enough applications to find duplicates.", duplicates: [] });
        }

        // 2. Call AI to detect potential duplicates
        const evaluations = await ai.detectDuplicates(activeApps);

        // 3. Filter high-confidence duplicates
        const potentialDuplicates = evaluations.filter(e => e.confidence > 0.6);

        // 4. Log to AgentAuditLog
        if (potentialDuplicates.length > 0) {
            await prisma.agentAuditLog.create({
                data: {
                    userId: session.user.id,
                    type: "DUPLICATE_SCAN",
                    payload: JSON.stringify({
                        evaluatedCount: activeApps.length,
                        duplicateCount: potentialDuplicates.length,
                        details: potentialDuplicates
                    }),
                    reflection: `Found ${potentialDuplicates.length} potential duplicate application pairs across ${activeApps.length} active jobs.`,
                    status: "COMPLETED"
                }
            });
        }

        return NextResponse.json({
            message: `Scanned ${activeApps.length} applications, found ${potentialDuplicates.length} potential duplicate pairs.`,
            duplicates: potentialDuplicates
        });

    } catch (error: any) {
        console.error("Duplicate Scan Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { ExtractedJobData } from "@/services/ai";

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { jobs } = await req.json() as { jobs: ExtractedJobData[] };
        let savedCount = 0;

        for (const job of jobs) {
            // Skip invalid entries or "not job related" if any slipped through
            if (job.isJobRelated === false) continue;

            try {
                await prisma.jobApplication.create({
                    data: {
                        userId: session.user.id,
                        company: job.company || "Unknown Company",
                        role: job.role || "Unknown Role",
                        status: job.status || "APPLIED",
                        jobId: job.jobId || null,
                        location: job.location || null,
                        appliedDate: new Date(),
                        source: "MANUAL",
                        salaryRange: job.salary ? JSON.stringify(job.salary) : null,
                        rejectionReason: job.rejectionReason || null,
                        // Store the full extracted object as initial analysis
                        analysis: JSON.stringify(job)
                    }
                });
                savedCount++;
            } catch (e) {
                console.error(`Failed to save job ${job.company} - ${job.role}`, e);
            }
        }

        return NextResponse.json({ success: true, count: savedCount });
    } catch (e: any) {
        console.error("Bulk Save Route Error:", e);
        return NextResponse.json({ error: e.message || "Failed to save jobs" }, { status: 500 });
    }
}

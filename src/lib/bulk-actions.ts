"use server";

import { AIService, ExtractedJobData } from "@/services/ai";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function processBulkImport(rawText: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const ai = new AIService();
    const jobs = await ai.parseBulkJobs(rawText);
    return jobs;
}

export async function saveBulkJobs(jobs: ExtractedJobData[]) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

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
                    salary: job.salary ? JSON.stringify(job.salary) : null,
                    // Store the full extracted object as initial analysis
                    analysis: JSON.stringify(job)
                }
            });
            savedCount++;
        } catch (e) {
            console.error(`Failed to save job ${job.company} - ${job.role}`, e);
        }
    }

    revalidatePath("/");
    return { success: true, count: savedCount };
}


import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { aiService } from "@/services/ai";

export async function POST(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await context.params;

        // 1. Fetch the Job and its original Email Source
        const job = await prisma.jobApplication.findUnique({
            where: { id },
            include: {
                emailLogs: {
                    orderBy: { receivedDate: 'asc' }, // Get the first/original email
                    take: 1
                }
            }
        });

        if (!job) {
            return NextResponse.json({ error: "Job not found" }, { status: 404 });
        }

        const originalEmail = job.emailLogs[0]; // Changed from 'logs' to 'emailLogs'
        if (!originalEmail) {
            return NextResponse.json({
                error: "No original email found for this job. Cannot re-analyze."
            }, { status: 400 });
        }

        // 2. Prepare context for AI Reflexion
        // We use the current job data as the "Previous Incorrect Output"
        const previousOutput = {
            company: job.company,
            role: job.role,
            status: job.status,
            receivedDate: job.appliedDate, // or updatedAt
            description: "User flagged this as incorrect."
        };

        // 3. Call AI Service with Reflexion Pattern
        console.log(`[Re-analyze] Job ${id} - Triggering AI Reflexion...`);
        const emailBody = (originalEmail as any).body || "";
        const emailSubject = (originalEmail as any).subject || "";
        const emailSender = (originalEmail as any).sender || "";

        const improvedData = await aiService.reanalyzeEmail(
            emailBody,
            emailSubject,
            emailSender,
            previousOutput
        );

        if (!improvedData.isJobRelated) {
            // AI decided it's actually NOT a job.
            // We could delete it, but for now let's just flag it or return a specific status
            // For safety, we will just update the status to "REJECTED" or keep it but mark feedback
        }

        // 4. Update the Job Application
        const updatedJob = await prisma.jobApplication.update({
            where: { id },
            data: {
                company: improvedData.company || job.company,
                role: improvedData.role || job.role,
                status: improvedData.status || job.status,
                // Only update fields if AI is confident
                salaryRange: improvedData.salary ? JSON.stringify(improvedData.salary) : job.salaryRange, // Changed from 'salary' to 'salaryRange'
                location: improvedData.location || job.location,
            }
        });

        // 5. Coactive Learning: Log this re-analysis as implicit feedback
        // The user's action of clicking "Re-analyze" implies the previous data was wrong.
        // We store the *correction* event.
        try {
            // @ts-ignore
            await (prisma as any).userFeedback.create({
                data: {
                    type: "REFLEXION_CORRECTION",
                    input: JSON.stringify({
                        jobId: id,
                        before: previousOutput,
                        after: improvedData,
                        reason: improvedData.thoughtProcess
                    })
                }
            });
        } catch (e) {
            console.warn("Failed to log user feedback", e);
        }

        return NextResponse.json({
            success: true,
            job: updatedJob,
            thoughtProcess: improvedData.thoughtProcess
        });

    } catch (error: any) {
        console.error("[Re-analyze API] Error:", error);
        return NextResponse.json(
            { error: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}

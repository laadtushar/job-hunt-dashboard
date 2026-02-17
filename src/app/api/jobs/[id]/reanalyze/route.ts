
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { AIService } from "@/services/ai";
import { GmailService } from "@/services/gmail";

export async function POST(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await context.params;
        const { feedback } = await req.json().catch(() => ({}));

        // 1. Fetch Job, Tokens, and Original Email
        const job = await prisma.jobApplication.findUnique({
            where: { id },
            include: {
                emailLogs: {
                    orderBy: { receivedDate: 'asc' },
                    take: 1
                }
            }
        });

        if (!job) {
            return NextResponse.json({ error: "Job not found" }, { status: 404 });
        }

        const account = await prisma.account.findFirst({
            where: { userId: session.user.id, provider: "google" },
        });

        if (!account?.access_token) {
            return NextResponse.json({ error: "No linked Google account found" }, { status: 400 });
        }

        // 2. Initialize Services
        const aiService = new AIService();
        const gmailService = new GmailService(account.access_token!, account.refresh_token as string || "");

        // 3. Deep Gmail Search Strategy
        const originalEmail = job.emailLogs[0];
        const searchTerms = [
            `"${job.company}" "${job.role}"`, // Exact match
            `"${job.company}"`, // Broad match
            `subject:${job.company}`,
            feedback ? `${job.company} ${feedback.split(' ').slice(0, 3).join(' ')}` : null // AI hint
        ].filter(Boolean) as string[];

        const uniqueEmails = new Map<string, any>();

        // Always include original email if exists
        if (originalEmail) {
            uniqueEmails.set(originalEmail.gmailId, {
                subject: (originalEmail as any).subject || "No Subject",
                body: (originalEmail as any).body || "",
                sender: (originalEmail as any).sender || "Unknown",
                date: originalEmail.receivedDate.toISOString()
            });
        }

        console.log(`[Re-analyze] Deep Search for Job ${id} (${job.company})...`);

        // Execute searches in parallel-ish (sequential to respect rate limits ok for now)
        for (const term of searchTerms) {
            try {
                const messages = await gmailService.listEmails(session.user.id, term, 5); // Limit 5 per term
                for (const msg of messages) {
                    if (!msg.id) continue;
                    if (uniqueEmails.has(msg.id)) continue;

                    const details = await gmailService.getEmailDetails(msg.id);
                    if (!details || !details.payload) continue;

                    const body = GmailService.getBody(details.payload) || "";
                    const subject = details.payload.headers?.find((h: any) => h.name === "Subject")?.value || "No Subject";
                    const sender = details.payload.headers?.find((h: any) => h.name === "From")?.value || "Unknown";
                    const date = details.internalDate ? new Date(parseInt(details.internalDate)).toISOString() : new Date().toISOString();

                    uniqueEmails.set(msg.id, { subject, body, sender, date });
                }
            } catch (e) {
                console.warn(`[Re-analyze] Search failed for term '${term}':`, e);
            }
        }

        // Convert Map to Array, excluding the original email from "additional" list if we want (but AI service handles it)
        // Actually ai.ts treats first args as "primary" and list as "context".
        // Let's use the ORIGINAL email as primary if available, else the first found one.

        const allFound = Array.from(uniqueEmails.values());
        const primary = originalEmail
            ? {
                body: (originalEmail as any).body || "",
                subject: (originalEmail as any).subject || "No Subject",
                sender: (originalEmail as any).sender || "Unknown"
            }
            : (allFound[0] || { body: "", subject: "No Subject", sender: "Unknown" });

        if (!primary && allFound.length === 0) {
            return NextResponse.json({ error: "No emails found to analyze." }, { status: 404 });
        }

        const additional = allFound.filter(e => e.body !== primary.body); // Simple dedup

        // 4. AI Reflexion
        const previousOutput = {
            company: job.company,
            role: job.role,
            status: job.status,
            receivedDate: job.appliedDate,
            description: "User flagged this as incorrect."
        };

        const improvedData = await aiService.reanalyzeEmail(
            primary.body,
            primary.subject,
            primary.sender,
            previousOutput,
            additional,
            feedback
        );

        // 5. Update Job
        if (improvedData.isJobRelated) {
            await prisma.jobApplication.update({
                where: { id },
                data: {
                    company: improvedData.company || job.company,
                    role: improvedData.role || job.role,
                    status: improvedData.status || job.status,
                    salaryRange: improvedData.salary ? JSON.stringify(improvedData.salary) : job.salaryRange,
                    location: improvedData.location || job.location,
                    rejectionReason: improvedData.rejectionReason || job.rejectionReason,
                    // We don't overwrite source, but we could update 'lastUpdate'
                    updatedAt: new Date()
                }
            });
        }

        // 6. Log Feedback (Coactive Learning)
        if (feedback) {
            try {
                // @ts-ignore
                await (prisma as any).userFeedback.create({
                    data: {
                        type: "REFLEXION_CORRECTION",
                        input: JSON.stringify({
                            jobId: id,
                            userFeedback: feedback,
                            before: previousOutput,
                            after: improvedData,
                            reason: improvedData.thoughtProcess
                        })
                    }
                });
            } catch (e) { console.warn("Failed to log feedback", e); }
        }

        return NextResponse.json({
            success: true,
            thoughtProcess: improvedData.thoughtProcess,
            contextCount: allFound.length
        });

    } catch (error: any) {
        console.error("[Re-analyze API] Error:", error);
        return NextResponse.json(
            { error: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}

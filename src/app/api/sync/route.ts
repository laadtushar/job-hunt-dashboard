
import { auth } from "@/auth";
import { GmailService } from "@/services/gmail";
import { AIService } from "@/services/ai";
import { JobService } from "@/services/job";
import { GoogleSheetsService } from "@/services/sheets";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const maxDuration = 60; // Allow 60 seconds for sync

export async function POST(req: Request) {
    const session = await auth();
    if (!session || !session.user || !session.user.email || !session.user.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const account = await prisma.account.findFirst({
        where: { userId: session.user.id, provider: "google" },
    });

    if (!account || !account.access_token) {
        return NextResponse.json({ error: "No Google account linked" }, { status: 400 });
    }

    // 1. Fetch Request Config
    const { limit } = await req.json().catch(() => ({}));
    const syncLimit = limit ? parseInt(limit) : 50;

    const userId = session.user.id!; // Capture userId for closure usage

    const encoder = new TextEncoder();

    // Create a streaming response
    const stream = new ReadableStream({
        async start(controller) {
            const sendLog = (message: string, type: 'info' | 'success' | 'error' = 'info', data?: any) => {
                const payload = JSON.stringify({ message, type, data });
                controller.enqueue(encoder.encode(payload + "\n"));
            };

            try {
                sendLog("Initializing services...", "info");

                const gmailService = new GmailService(account.access_token!, account.refresh_token as string);
                const aiService = new AIService();
                const jobService = new JobService();

                sendLog(`Fetching last ${syncLimit} emails...`, "info");
                const messages = await gmailService.listEmails(userId, "label:inbox subject:application OR subject:job OR subject:interview after:2024/01/01", syncLimit);

                sendLog(`Found ${messages.length} potential emails. Processing...`, "info");

                let processedCount = 0;
                let newJobsCount = 0;

                for (const [index, msg] of messages.entries()) {
                    if (!msg.id || !msg.threadId) continue;

                    // Quick check if already processed
                    const existingLog = await prisma.emailLog.findUnique({ where: { gmailId: msg.id } });
                    if (existingLog) {
                        // sendLog(`Skipping ${index + 1}/${messages.length} (Already processed)`, "info");
                        continue;
                    }

                    // Get details
                    const fullMsg = await gmailService.getEmailDetails(msg.id);
                    if (!fullMsg || !fullMsg.payload) continue;

                    const subjectHeader = fullMsg.payload.headers?.find((h: any) => h.name === "Subject");
                    const subject = subjectHeader?.value || "No Subject";
                    const fromHeader = fullMsg.payload.headers?.find((h: any) => h.name === "From");
                    const sender = fromHeader?.value || "";
                    const body = GmailService.getBody(fullMsg.payload) || "";

                    sendLog(`${index + 1}/${messages.length}: Analyzing "${subject.substring(0, 40)}..."`, "info");


                    // AI Parse
                    const extractedData = await aiService.parseEmail(body, subject || "No Subject", sender);

                    if (extractedData.isJobRelated) {
                        sendLog(`  ✨ Job Found: ${extractedData.company} - ${extractedData.status}`, "success");

                        // Save Job
                        try {
                            const savedJob = await jobService.createOrUpdateApplication(userId, extractedData, msg.threadId, aiService);

                            // Log Email
                            await prisma.emailLog.create({
                                data: {
                                    gmailId: msg.id,
                                    threadId: msg.threadId,
                                    receivedDate: new Date(parseInt(fullMsg.internalDate || "0")),
                                    snippet: fullMsg.snippet || null,
                                    body: body,
                                    applicationId: savedJob.id,
                                    aiModel: extractedData._meta?.model,
                                    aiProvider: extractedData._meta?.provider,
                                    aiOutput: JSON.stringify(extractedData)
                                }
                            });
                            newJobsCount++;
                        } catch (e) {
                            console.error("Failed to save job:", e);
                            sendLog(`  ❌ Failed to save job: ${e}`, "error");
                        }

                    } else {
                        if (extractedData.feedback && extractedData.feedback.includes("OpenRouter API Error")) {
                            sendLog(`  ❌ AI Error: ${extractedData.feedback}`, "error");
                        } else if (extractedData.feedback) {
                            // Optional: log other feedback if needed, currently just OpenRouter errors are critical
                            // sendLog(`  ℹ️ Skipped: ${extractedData.feedback}`, "info");
                        }
                    }
                    processedCount++;
                }

                sendLog(`Sync Complete! Processed ${processedCount} emails. Found ${newJobsCount} new job updates.`, "success");

            } catch (error: any) {
                console.error("Sync Error:", error);
                sendLog(`Sync Failed: ${error.message}`, "error");
            } finally {
                controller.close();
            }
        }
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Transfer-Encoding': 'chunked',
        },
    });
}

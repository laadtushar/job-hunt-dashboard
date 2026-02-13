
import { auth } from "@/auth";
import { GmailService } from "@/services/gmail";
import { AIService } from "@/services/ai";
import { JobService } from "@/services/job";
import { GoogleSheetsService } from "@/services/sheets";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const maxDuration = 300; // Allow 5 minutes for sync

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

                sendLog(`Found ${messages.length} potential emails. Checking existing logs...`, "info");

                // Bulk check for existing logs to save DB calls
                const gmailIds = messages.map(m => m.id).filter((id): id is string => !!id);
                const existingLogs = await prisma.emailLog.findMany({
                    where: { gmailId: { in: gmailIds } },
                    select: { gmailId: true }
                });
                const existingIdsSet = new Set(existingLogs.map(l => l.gmailId));

                sendLog(`Processing ${messages.length - existingIdsSet.size} new emails...`, "info");

                const startTime = Date.now();
                const TIME_LIMIT = 55000; // 55 seconds (safe margin for 60s limit)

                let processedCount = 0;
                let newJobsCount = 0;

                const newMessages = messages.filter(m => m.id && m.threadId && !existingIdsSet.has(m.id));
                const BATCH_SIZE = 5;

                for (let i = 0; i < newMessages.length; i += BATCH_SIZE) {
                    // Check if we are approaching the time limit
                    if (Date.now() - startTime > TIME_LIMIT) {
                        sendLog(`Stopping early to avoid timeout. ${newMessages.length - i} emails remaining. Please sync again.`, "info");
                        break;
                    }

                    const batch = newMessages.slice(i, i + BATCH_SIZE);
                    sendLog(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1} (${batch.length} emails)...`, "info");

                    const results = await Promise.all(batch.map(async (msg) => {
                        try {
                            const fullMsg = await gmailService.getEmailDetails(msg.id!);
                            if (!fullMsg || !fullMsg.payload) return null;

                            const subjectHeader = fullMsg.payload.headers?.find((h: any) => h.name === "Subject");
                            const subject = subjectHeader?.value || "No Subject";
                            const fromHeader = fullMsg.payload.headers?.find((h: any) => h.name === "From");
                            const sender = fromHeader?.value || "";
                            const body = GmailService.getBody(fullMsg.payload) || "";

                            // AI Parse
                            const extractedData = await aiService.parseEmail(body, subject, sender);

                            if (extractedData.isJobRelated) {
                                // Save Job
                                const savedJob = await jobService.createOrUpdateApplication(userId, extractedData, msg.threadId!, aiService);

                                // Log Email
                                await prisma.emailLog.create({
                                    data: {
                                        gmailId: msg.id!,
                                        threadId: msg.threadId!,
                                        receivedDate: new Date(parseInt(fullMsg.internalDate || "0")),
                                        snippet: fullMsg.snippet || null,
                                        body: body,
                                        applicationId: savedJob.id,
                                        aiModel: extractedData._meta?.model,
                                        aiProvider: extractedData._meta?.provider,
                                        aiOutput: JSON.stringify(extractedData),
                                        sender: sender,
                                        subject: subject
                                    }
                                });
                                return { success: true, company: extractedData.company, status: extractedData.status };
                            }

                            // If not job related, we still log it as ignored to avoid re-processing
                            await prisma.emailLog.create({
                                data: {
                                    gmailId: msg.id!,
                                    threadId: msg.threadId!,
                                    receivedDate: new Date(parseInt(fullMsg.internalDate || "0")),
                                    snippet: fullMsg.snippet || null,
                                    body: body,
                                    isIgnored: true,
                                    aiOutput: JSON.stringify(extractedData),
                                    sender: sender,
                                    subject: subject
                                }
                            });
                            return { success: false };
                        } catch (e: any) {
                            console.error(`Error processing email ${msg.id}:`, e);
                            return { error: e.message };
                        }
                    }));

                    for (const res of results) {
                        if (res?.success) {
                            newJobsCount++;
                            sendLog(`  ✨ Found: ${res.company} (${res.status})`, "success");
                        } else if (res?.error) {
                            sendLog(`  ❌ Error: ${res.error}`, "error");
                        }
                        processedCount++;
                    }
                }

                sendLog(`Sync Complete! Found ${newJobsCount} new job updates.`, "success");

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

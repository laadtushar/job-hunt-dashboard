
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

    const userId = session.user.id!;
    const account = await prisma.account.findFirst({
        where: { userId: userId, provider: "google" },
    });

    if (!account || !account.access_token) {
        return NextResponse.json({ error: "No Google account linked" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));

    // Mode 1: PREPARE (Fetch List)
    if (body.action === 'prepare') {
        const gmailService = new GmailService(account.access_token!, account.refresh_token as string);
        const limit = body.limit || 365;
        const messages = await gmailService.listEmails(userId, "label:inbox subject:application OR subject:job OR subject:interview after:2024/01/01", limit);

        // Return only IDs not processed yet
        const gmailIds = messages.map(m => m.id).filter((id): id is string => !!id);
        const existingLogs = await prisma.emailLog.findMany({
            where: { gmailId: { in: gmailIds } },
            select: { gmailId: true }
        });
        const existingIdsSet = new Set(existingLogs.map(l => l.gmailId));
        const filteredMessages = messages.filter(m => m.id && !existingIdsSet.has(m.id));

        return NextResponse.json({ messages: filteredMessages });
    }

    // Mode 2: PROCESS (Process specific IDs)
    const { messageIds } = body;
    if (!messageIds || !Array.isArray(messageIds)) {
        return NextResponse.json({ error: "No message IDs provided" }, { status: 400 });
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
        async start(controller) {
            const sendLog = (message: string, type: 'info' | 'success' | 'error' = 'info', data?: any) => {
                const payload = JSON.stringify({ message, type, data });
                controller.enqueue(encoder.encode(payload + "\n"));
            };

            try {
                const gmailService = new GmailService(account.access_token!, account.refresh_token as string);
                const aiService = new AIService();
                const jobService = new JobService();

                // Process these specific IDs in batches of 10 within this request
                const BATCH_SIZE = 10;
                let newJobsCount = 0;

                for (let i = 0; i < messageIds.length; i += BATCH_SIZE) {
                    const batch = messageIds.slice(i, i + BATCH_SIZE);

                    await Promise.all(batch.map(async (msgId) => {
                        try {
                            const fullMsg = await gmailService.getEmailDetails(msgId);
                            if (!fullMsg || !fullMsg.payload) return;

                            const subjectHeader = fullMsg.payload.headers?.find((h: any) => h.name === "Subject");
                            const subject = subjectHeader?.value || "No Subject";
                            const fromHeader = fullMsg.payload.headers?.find((h: any) => h.name === "From");
                            const sender = fromHeader?.value || "";
                            const emailBody = GmailService.getBody(fullMsg.payload) || "";

                            const extractedData = await aiService.parseEmail(emailBody, subject, sender);

                            if (extractedData.isJobRelated) {
                                const savedJob = await jobService.createOrUpdateApplication(userId, extractedData, fullMsg.threadId!, aiService);
                                await prisma.emailLog.create({
                                    data: {
                                        gmailId: msgId,
                                        threadId: fullMsg.threadId!,
                                        receivedDate: new Date(parseInt(fullMsg.internalDate || "0")),
                                        snippet: fullMsg.snippet || null,
                                        body: emailBody,
                                        applicationId: savedJob.id,
                                        aiModel: extractedData._meta?.model,
                                        aiProvider: extractedData._meta?.provider,
                                        aiOutput: JSON.stringify(extractedData),
                                        sender: sender,
                                        subject: subject
                                    }
                                });
                                newJobsCount++;
                                sendLog(`✨ Found: ${extractedData.company}`, "success");
                            } else {
                                await prisma.emailLog.create({
                                    data: {
                                        gmailId: msgId,
                                        threadId: fullMsg.threadId!,
                                        receivedDate: new Date(parseInt(fullMsg.internalDate || "0")),
                                        snippet: fullMsg.snippet || null,
                                        body: emailBody,
                                        isIgnored: true,
                                        aiOutput: JSON.stringify(extractedData),
                                        sender: sender,
                                        subject: subject
                                    }
                                });
                            }
                        } catch (e: any) {
                            console.error(`Error processing ${msgId}:`, e);
                            sendLog(`❌ Error: ${e.message}`, "error");
                        }
                    }));
                }

                sendLog(`Batch Complete!`, "success", { count: newJobsCount });
            } catch (error: any) {
                sendLog(`Process Error: ${error.message}`, "error");
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

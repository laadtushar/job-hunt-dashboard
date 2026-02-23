
import { auth } from "@/auth";
import { GmailService } from "@/services/gmail";
import { AIService } from "@/services/ai";
import { JobService } from "@/services/job";
import { EmbeddingService } from "@/services/embedding";
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
        const afterDate = body.after || "2024/01/01";
        const beforeDate = body.before;

        // Extensive Keyword List to capture all missed emails
        const subjectKeywords = [
            "application", "job", "interview", "offer", "hiring",
            "career", "position", "vacancy", "candidacy", "status",
            "update", "qualifications", "recruiting", "talent",
            "assessment", "referral", "opportunity", "candidature",
            "submission", "competency"
        ];

        // Specific phrases often found in body of rejection/update emails
        const bodyPhrases = [
            "\"thank you for applying\"",
            "\"thank you for your interest\"",
            "\"not moving forward\"",
            "\"unable to offer\"",
            "\"pursuing other candidates\"",
            "\"schedule a chat\"",
            "\"availability\"",
            "\"interview invite\"",
            "\"hiring team\"",
            "\"talent acquisition\"",
            "\"human resources\""
        ];

        // Senders that are likely relevant (generic)
        const senderKeywords = [
            "no-reply", "noreply", "talent", "careers",
            "recruiting", "recruitment", "hiring", "jobs", "people"
        ];

        const subjectQuery = `subject:(${subjectKeywords.join(" OR ")})`;
        const bodyQuery = bodyPhrases.join(" OR "); // Body search doesn't need "body:" prefix in Gmail, just the terms
        const senderQuery = `from:(${senderKeywords.join(" OR ")})`;

        // Combined Query: 
        // We use grouping () to ensure label:inbox applies to the whole set
        // Logic: INBOX AND (SubjectMatch OR BodyMatch OR SenderMatch)
        let query = `label:inbox (${subjectQuery} OR ${bodyQuery} OR ${senderQuery}) after:${afterDate}`;

        if (beforeDate) query += ` before:${beforeDate}`;

        console.log(`[Gmail Service] Generated Query: ${query}`);

        const messages = await gmailService.listEmails(userId, query, limit);

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
                const embeddingService = new EmbeddingService();

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
                                const emailLog = await prisma.emailLog.upsert({
                                    where: { gmailId: msgId },
                                    update: {
                                        applicationId: savedJob.id,
                                        aiOutput: JSON.stringify(extractedData),
                                        receivedDate: new Date(parseInt(fullMsg.internalDate || "0")),
                                    },
                                    create: {
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

                                // --- Add Email Embedding ---
                                try {
                                    const text = EmbeddingService.formatEmailForEmbedding(emailLog);
                                    const vector = await embeddingService.embed(text);
                                    if (vector.length > 0) {
                                        await prisma.$executeRaw`
                                            INSERT INTO "EmailEmbedding" ("id", "emailId", "vector", "content", "type", "createdAt")
                                            VALUES (gen_random_uuid(), ${emailLog.id}, ${vector}::vector, ${text}, 'POSITIVE', NOW())
                                            ON CONFLICT ("emailId") DO UPDATE SET "vector" = ${vector}::vector, "content" = ${text}, "type" = 'POSITIVE';
                                        `;
                                    }
                                } catch (e) {
                                    console.error(`Failed to embed email ${msgId}`, e);
                                }

                                newJobsCount++;
                                sendLog(`✨ Found: ${extractedData.company}`, "success");
                            } else {
                                const emailLog = await prisma.emailLog.upsert({
                                    where: { gmailId: msgId },
                                    update: {
                                        aiOutput: JSON.stringify(extractedData),
                                        isIgnored: true
                                    },
                                    create: {
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

                                // --- Add Email Embedding (Ignored) ---
                                try {
                                    const text = EmbeddingService.formatEmailForEmbedding(emailLog);
                                    const vector = await embeddingService.embed(text);
                                    if (vector.length > 0) {
                                        await prisma.$executeRaw`
                                            INSERT INTO "EmailEmbedding" ("id", "emailId", "vector", "content", "type", "createdAt")
                                            VALUES (gen_random_uuid(), ${emailLog.id}, ${vector}::vector, ${text}, 'NEGATIVE', NOW())
                                            ON CONFLICT ("emailId") DO UPDATE SET "vector" = ${vector}::vector, "content" = ${text}, "type" = 'NEGATIVE';
                                        `;
                                    }
                                } catch (e) {
                                    console.error(`Failed to embed ignored email ${msgId}`, e);
                                }
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

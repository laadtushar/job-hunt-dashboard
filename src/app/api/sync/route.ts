
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

    // TODO: Get tokens from session or database. NextAuth with Google provider usually stores them in Account model.
    // We need to fetch the tokens associated with this user.
    const account = await prisma.account.findFirst({
        where: { userId: session.user.id, provider: "google" },
    });

    if (!account || !account.access_token) {
        return NextResponse.json({ error: "No Google account linked" }, { status: 400 });
    }

    const gmailService = new GmailService(account.access_token, account.refresh_token as string);
    const aiService = new AIService();
    const jobService = new JobService();
    // Optional: Get sheet ID from user input or DB
    const sheetsService = new GoogleSheetsService(account.access_token, account.refresh_token as string, "YOUR_SHEET_ID_HERE");

    try {
        // 1. Fetch recent emails (e.g., last 7 days or since last sync)
        const { limit } = await req.json().catch(() => ({}));
        const syncLimit = limit ? parseInt(limit) : 50;

        // 1. Fetch recent emails (e.g., last 7 days or since last sync)
        const messages = await gmailService.listEmails(session.user.id, "label:inbox subject:application OR subject:job OR subject:interview after:2024/01/01", syncLimit);
        // ^ Refine query for production

        let processedCount = 0;
        const results = [];

        for (const msg of messages) {
            // Check if already processed
            if (!msg.id || !msg.threadId) continue;
            const existingLog = await prisma.emailLog.findUnique({ where: { gmailId: msg.id } });
            if (existingLog) continue;

            // 2. Get full details
            const fullMsg = await gmailService.getEmailDetails(msg.id);
            if (!fullMsg || !fullMsg.payload || !fullMsg.internalDate) continue;

            const subjectHeader = fullMsg.payload.headers?.find((h: any) => h.name === "Subject");
            const subject = subjectHeader ? subjectHeader.value : "No Subject";
            const body = GmailService.getBody(fullMsg.payload) || "";

            // 3. AI Parse
            const extractedData = await aiService.parseEmail(body, subject || "No Subject");

            if (extractedData.isJobRelated) {
                // 4. Create/Update Job
                // Pass threadId for smart grouping
                const savedJob = await jobService.createOrUpdateApplication(session.user.id, extractedData, msg.threadId);

                // 5. Append to Sheets (Fire and forget or await?)
                try {
                    // await sheetsService.appendApplication(extractedData);
                    // TODO: Enable this after user configures sheet ID
                } catch (e) {
                    console.error("Sheets sync error", e);
                }

                // 6. Log email
                await prisma.emailLog.create({
                    data: {
                        gmailId: msg.id,
                        threadId: msg.threadId,
                        receivedDate: new Date(parseInt(fullMsg.internalDate || "0")),
                        snippet: fullMsg.snippet || null,
                        applicationId: savedJob.id
                    }
                });

                results.push({ subject, company: extractedData.company, status: extractedData.status });
                processedCount++;
            }
        }

        return NextResponse.json({ success: true, processed: processedCount, results });
    } catch (error) {
        console.error("Sync Error:", error);
        return NextResponse.json({ error: "Failed to sync emails" }, { status: 500 });
    }
}

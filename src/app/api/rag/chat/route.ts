
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { EmbeddingService } from "@/services/embedding";
import { AIService } from "@/services/ai";
import { GmailService } from "@/services/gmail";
import { JobService } from "@/services/job";
import { AgentService } from "@/services/agent";
import { NextResponse } from "next/server";

export const maxDuration = 60;

export async function POST(req: Request) {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { message, previousMessages = [] } = body;

        if (!message) return NextResponse.json({ error: "Message is required" }, { status: 400 });

        // 1. Generate Embedding for Query
        const embeddingService = new EmbeddingService();
        const ai = new AIService();
        const agentService = new AgentService();

        // ** AGENTIC STEP 1: Detect Intent **
        const { intent, company } = await ai.detectIntent(message);

        if (intent === 'MISSING_JOB' && company) {
            // Find account
            const account = await prisma.account.findFirst({
                where: { userId: session.user.id, provider: "google" },
            });

            if (account?.access_token) {
                const gmail = new GmailService(account.access_token, account.refresh_token as string);
                const jobService = new JobService();

                // Agentic Step 2: High-Precision Search
                const gmailQuery = await ai.generateGmailQuery(company, message);
                const messages = await gmail.listEmails(session.user.id, gmailQuery, 5);

                const foundEmails: any[] = [];
                const foundJobs: any[] = [];

                if (messages.length > 0) {
                    for (const m of messages) {
                        try {
                            const fullMsg = await gmail.getEmailDetails(m.id!);
                            const subjectHeader = fullMsg.payload?.headers?.find((h: any) => h.name === "Subject");
                            const fromHeader = fullMsg.payload?.headers?.find((h: any) => h.name === "From");
                            const subject = subjectHeader?.value || "No Subject";
                            const sender = fromHeader?.value || "Unknown";
                            const bodyText = GmailService.getBody(fullMsg.payload) || "";

                            foundEmails.push({ subject, sender, body: bodyText });

                            const extracted = await ai.parseEmail(bodyText, subject, sender);
                            if (extracted.isJobRelated) {
                                const saved = await jobService.createOrUpdateApplication(session.user.id, extracted, fullMsg.threadId!, ai);
                                foundJobs.push(saved);

                                // Log Email
                                await prisma.emailLog.upsert({
                                    where: { gmailId: m.id! },
                                    update: { applicationId: saved.id },
                                    create: {
                                        gmailId: m.id!,
                                        threadId: fullMsg.threadId!,
                                        receivedDate: new Date(parseInt(fullMsg.internalDate || "0")),
                                        snippet: fullMsg.snippet || null,
                                        body: bodyText,
                                        applicationId: saved.id,
                                        sender,
                                        subject
                                    }
                                });
                            }
                        } catch (e) {
                            console.error("[Agent Sync] Item Error:", e);
                        }
                    }
                }

                // Agentic Step 3: Self-Reflection
                const reflection = await ai.reflectOnSearch(message, foundEmails, foundJobs);

                // Agentic Step 4: Persistent Log
                await prisma.agentSearchLog.create({
                    data: {
                        userId: session.user.id,
                        userMessage: message,
                        detectedIntent: intent,
                        detectedCompany: company,
                        gmailQuery,
                        foundEmailsCount: foundEmails.length,
                        foundJobsCount: foundJobs.length,
                        reflection,
                        status: 'COMPLETED'
                    }
                });

                return NextResponse.json({
                    answer: reflection,
                    suggestedQuestions: ["Show me my new jobs", "What did you learn?"]
                });
            }
        }

        // ** HANDLERS FOR AGENTIC INTENTS — Direct Service Calls (no fetch) **

        if (intent === 'CHECK_GHOSTS') {
            const data = await agentService.ghostScan(session.user.id);
            const answer = data.ghostedApps.length > 0
                ? `I analyzed your stale applications and found ${data.ghostedApps.length} potential ghosts:\n\n` +
                data.ghostedApps.map((g: any) => `- **${g.company}** (${g.role}): ${g.reasoning}`).join('\n')
                : "I checked your stale applications, and everyone seems to be within standard processing times! No ghosts detected.";
            return NextResponse.json({ answer, suggestedQuestions: ["How do I follow up?", "Check my status drift"] });
        }

        if (intent === 'CHECK_DRIFT') {
            const data = await agentService.driftScan(session.user.id);
            const answer = data.corrections.length > 0
                ? `I found and corrected ${data.corrections.length} status discrepancies by re-evaluating ignored emails:\n\n` +
                data.corrections.map((c: any) => `- **${c.company}**: ${c.oldStatus} → **${c.newStatus}** (${c.reasoning})`).join('\n')
                : "I re-evaluated your recently ignored emails and everything looks accurate. No status drift detected!";
            return NextResponse.json({ answer, suggestedQuestions: ["Show me recent emails", "Any ghost jobs?"] });
        }

        if (intent === 'CHECK_DUPLICATES') {
            const data = await agentService.duplicateScan(session.user.id);
            const answer = data.duplicates.length > 0
                ? `I identified ${data.duplicates.length} potential duplicate application pairs:\n\n` +
                data.duplicates.map((d: any) => `- Pair: IDs ${d.id1} and ${d.id2}\n  Reasoning: ${d.reasoning} (Confidence: ${Math.round(d.confidence * 100)}%)`).join('\n') +
                "\n\nShould I merge any of these for you?"
                : "Your application list looks clean! No duplicates found.";
            return NextResponse.json({ answer, suggestedQuestions: ["Merge all duplicates", "Check for ghosts"] });
        }

        if (intent === 'CHECK_THREADS') {
            const account = await prisma.account.findFirst({
                where: { userId: session.user.id, provider: "google" },
            });

            if (!account?.access_token) {
                return NextResponse.json({
                    answer: "I can't check your threads because Gmail access isn't connected. Please sign in with Google first.",
                    suggestedQuestions: ["Check for ghosts", "Show latest intelligence report"]
                });
            }

            const data = await agentService.threadWatch(session.user.id, account.access_token, account.refresh_token as string);
            const answer = data.alerts.length > 0
                ? `I found ${data.alerts.length} conversations where they're waiting for your reply:\n\n` +
                data.alerts.map((a: any) => `- **${a.company}** (${a.urgency}): ${a.reasoning}`).join('\n')
                : "You're all caught up! No unanswered recruiter messages detected.";
            return NextResponse.json({ answer, suggestedQuestions: ["Draft a follow-up for Stripe", "What else should I do?"] });
        }

        if (intent === 'SHOW_LEARNINGS') {
            const data = await agentService.getLearnings(session.user.id);
            const answer = `### Agent Intelligence Report\n\n**Stats:**\n- Ghosts Detected: ${data.stats.ghostsDetected}\n- Drifts Corrected: ${data.stats.driftsCorrected}\n- Duplicates Identified: ${data.stats.duplicatesFound}\n\n**Recent Reflections:**\n` +
                data.recentLearnings.map((l: any) => `- [${l.category}] ${l.reflection}`).join('\n');
            return NextResponse.json({ answer, suggestedQuestions: ["How do you learn?", "Run all scans"] });
        }

        // ** GENERAL RAG SEARCH **
        const vector = await embeddingService.embed(message);

        if (vector.length === 0) {
            return NextResponse.json({ error: "Failed to understand query" }, { status: 500 });
        }

        // 2. Retrieve Relevant Context (Vector Search)
        const vectorString = `[${vector.join(",")}]`;

        // Search Jobs
        const jobResults: any[] = await prisma.$queryRaw`
            SELECT j.company, j.role, j.status, j."jobDescription", j.feedback, e.vector <=> ${vectorString}::vector as distance
            FROM "JobApplication" j
            JOIN "JobEmbedding" e ON j.id = e."jobId"
            WHERE j."userId" = ${session.user.id}
            ORDER BY distance ASC
            LIMIT 5;
        `;

        // Search Emails
        const emailResults: any[] = await prisma.$queryRaw`
            SELECT el.subject, el.sender, el.snippet, e.type, e.vector <=> ${vectorString}::vector as distance
            FROM "EmailLog" el
            JOIN "EmailEmbedding" e ON el.id = e."emailId"
            JOIN "JobApplication" j ON el."applicationId" = j.id
            WHERE e.type = 'POSITIVE' AND j."userId" = ${session.user.id}
            ORDER BY distance ASC
            LIMIT 3;
        `;

        // Fallback: Recent Jobs for general questions
        const recentJobs = await prisma.jobApplication.findMany({
            where: { userId: session.user.id },
            orderBy: { appliedDate: 'desc' },
            take: 15,
            select: { company: true, role: true, status: true, feedback: true, appliedDate: true }
        });

        // 3. Format Context
        let contextText = "";

        if (jobResults.length > 0) {
            contextText += "--- SEMANTIC MATCHES (Job Descriptions) ---\n";
            jobResults.forEach((j: any) => {
                if (j.distance < 0.6) { // Only include relevant matches
                    contextText += `- [Status: ${j.status}] ${j.role} at ${j.company}. Notes: ${j.feedback || "None"}. Description Snippet: ${(j.jobDescription || "").substring(0, 200)}...\n`;
                }
            });
        }

        if (recentJobs.length > 0) {
            contextText += "\n--- YOUR RECENT APPLICATIONS (General Context) ---\n";
            recentJobs.forEach((j: any) => {
                contextText += `- [Status: ${j.status}] ${j.role} at ${j.company} (Applied: ${j.appliedDate.toISOString().split('T')[0]}). Notes: ${j.feedback || "None"}\n`;
            });
        }

        if (emailResults.length > 0) {
            contextText += "\n--- RECENT EMAILS ---\n";
            emailResults.forEach((e: any) => {
                if (e.distance < 0.6) {
                    contextText += `- From: ${e.sender}, Subject: "${e.subject}". Snippet: ${e.snippet}\n`;
                }
            });
        }

        if (!contextText) {
            contextText = "No direct matches found in database.";
        }

        // 4. Generate Answer
        const response = await ai.answerQuestion(message, contextText);

        return NextResponse.json({ ...response });

    } catch (error: any) {
        console.error("Chat Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

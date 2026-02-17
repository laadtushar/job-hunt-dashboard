
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { EmbeddingService } from "@/services/embedding";
import { AIService } from "@/services/ai";
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
        const vector = await embeddingService.embed(message);

        if (vector.length === 0) {
            return NextResponse.json({ error: "Failed to understand query" }, { status: 500 });
        }

        // 2. Retrieve Relevant Context (Hybrid Search: Vector + Keyword? Just Vector for now)
        const vectorString = `[${vector.join(",")}]`;

        // Search Jobs
        const jobResults: any[] = await prisma.$queryRaw`
            SELECT j.company, j.role, j.status, j."jobDescription", j.feedback, e.vector <=> ${vectorString}::vector as distance
            FROM "JobApplication" j
            JOIN "JobEmbedding" e ON j.id = e."jobId"
            ORDER BY distance ASC
            LIMIT 5;
        `;

        // Search Emails (optional, if relevant?)
        // Let's mix them or just use jobs for now as per task.
        // But the plan mentioned Email Classification RAG. 
        // For "Ask Dashboard", emails might be useful context (e.g. "Did Google reply?").
        const emailResults: any[] = await prisma.$queryRaw`
            SELECT el.subject, el.sender, el.snippet, e.type, e.vector <=> ${vectorString}::vector as distance
            FROM "EmailLog" el
            JOIN "EmailEmbedding" e ON el.id = e."emailId"
            WHERE e.type = 'POSITIVE'
            ORDER BY distance ASC
            LIMIT 3;
        `;

        // 3. Format Context
        let contextText = "";

        if (jobResults.length > 0) {
            contextText += "--- JOB APPLICATIONS ---\n";
            jobResults.forEach((j: any) => {
                if (j.distance < 0.6) { // Only include relevant matches
                    contextText += `- [Status: ${j.status}] ${j.role} at ${j.company}. Notes: ${j.feedback || "None"}. Description Snippet: ${(j.jobDescription || "").substring(0, 200)}...\n`;
                }
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
        const ai = new AIService();
        const response = await ai.answerQuestion(message, contextText);

        return NextResponse.json({ ...response });

    } catch (error: any) {
        console.error("Chat Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

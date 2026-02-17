
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { EmbeddingService } from "@/services/embedding";
import { NextResponse } from "next/server";

export const maxDuration = 300; // 5 minutes

export async function POST(req: Request) {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { type = "jobs", limit = 50 } = body;
        const embeddingService = new EmbeddingService();
        let processed = 0;

        if (type === "jobs") {
            // 1. Find jobs without embeddings
            const jobs = await prisma.jobApplication.findMany({
                where: {
                    // @ts-ignore
                    embedding: { is: null },
                    // Optional: exclude rejected? No, we want to search everything
                },
                take: limit,
                orderBy: { createdAt: 'desc' }
            });

            console.log(`[RAG Ingest] Found ${jobs.length} jobs to embed.`);

            for (const job of jobs) {
                try {
                    const text = EmbeddingService.formatJobForEmbedding(job);
                    const vector = await embeddingService.embed(text);

                    if (vector.length > 0) {
                        // Use raw query for vector insertion because Prisma doesn't support vector literals fully in creates yet 
                        // OR use the raw $executeRaw if typed client isn't fully ready. 
                        // Actually, with recent Prisma versions and pgvector, we might need to cast.
                        // Ideally: await prisma.$executeRaw`INSERT INTO "JobEmbedding" ...`

                        // Let's use the model create if possible, but passing vector as raw might be tricky.
                        // Standard workaround for pgvector in Prisma:
                        await prisma.$executeRaw`
                            INSERT INTO "JobEmbedding" ("id", "jobId", "vector", "content", "createdAt")
                            VALUES (gen_random_uuid(), ${job.id}, ${vector}::vector, ${text}, NOW())
                            ON CONFLICT ("jobId") DO UPDATE SET "vector" = ${vector}::vector, "content" = ${text};
                        `;
                        processed++;
                    }
                } catch (e) {
                    console.error(`Failed to embed job ${job.id}`, e);
                }
            }
        }
        else if (type === "emails") {
            // 2. Find emails without embeddings (limit to last 30 days maybe? or all)
            const emails = await prisma.emailLog.findMany({
                where: {
                    // @ts-ignore
                    embedding: { is: null },
                    snippet: { not: null }
                },
                take: limit,
                orderBy: { receivedDate: 'desc' }
            });

            console.log(`[RAG Ingest] Found ${emails.length} emails to embed.`);

            for (const email of emails) {
                try {
                    const text = EmbeddingService.formatEmailForEmbedding(email);
                    const vector = await embeddingService.embed(text);

                    // Determine type (POSITIVE/NEGATIVE)
                    // If it is linked to an application -> POSITIVE
                    // If it is ignored -> NEGATIVE (mostly)
                    // If neither -> UNKNOWN (skip or label negative?)
                    let type = "UNKNOWN";
                    if (email.applicationId) type = "POSITIVE";
                    else if (email.isIgnored) type = "NEGATIVE";

                    if (vector.length > 0 && type !== "UNKNOWN") {
                        await prisma.$executeRaw`
                            INSERT INTO "EmailEmbedding" ("id", "emailId", "vector", "content", "type", "createdAt")
                            VALUES (gen_random_uuid(), ${email.id}, ${vector}::vector, ${text}, ${type}, NOW())
                            ON CONFLICT ("emailId") DO UPDATE SET "vector" = ${vector}::vector, "content" = ${text}, "type" = ${type};
                        `;
                        processed++;
                    }
                } catch (e) {
                    console.error(`Failed to embed email ${email.id}`, e);
                }
            }
        }

        return NextResponse.json({ success: true, processed, type });

    } catch (error: any) {
        console.error("Ingest Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

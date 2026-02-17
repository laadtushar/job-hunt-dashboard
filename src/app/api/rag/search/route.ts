
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { EmbeddingService } from "@/services/embedding";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { query, type = "jobs", limit = 10, threshold = 0.5 } = body;

        if (!query) return NextResponse.json({ error: "Query is required" }, { status: 400 });

        const embeddingService = new EmbeddingService();
        const vector = await embeddingService.embed(query);

        if (vector.length === 0) {
            return NextResponse.json({ error: "Failed to generate embedding" }, { status: 500 });
        }

        let results: any[] = [];

        if (type === "jobs") {
            // PGVector similarity search (cosine distance)
            // Operator <=> is cosine distance. 
            // We want closest distance => Order By ... ASC
            // Prisma doesn't support ORDER BY vector operator directly yet in typed client.
            // Using raw query.

            // Note: vector can be passed as string "[1,2,3...]" or using casting.
            const vectorString = `[${vector.join(",")}]`;

            // Query: Find jobs, join with embedding to get distance
            // We need to allow some distance threshold.
            // distance < 1 - threshold ? (Assuming cosine similarity 1 is identical, 0 is opposite? No, cosine distance 0 is identical, 2 is opposite (1 - cos(theta) sometimes))
            // pgvector <=> operator returns: 1 - cosine_similarity. So 0 is match, 1 is orthogonal, 2 is opposite.
            // So if threshold is 0.7 similarity, we want distance < 1 - 0.7 = 0.3.

            // Let's just return top N by distance.

            results = await prisma.$queryRaw`
                SELECT j.*, e.vector <=> ${vectorString}::vector as distance
                FROM "JobApplication" j
                JOIN "JobEmbedding" e ON j.id = e."jobId"
                ORDER BY distance ASC
                LIMIT ${limit};
            `;
        }
        else if (type === "emails") {
            const vectorString = `[${vector.join(",")}]`;
            results = await prisma.$queryRaw`
                SELECT el.*, e.vector <=> ${vectorString}::vector as distance, e.type as classification
                FROM "EmailLog" el
                JOIN "EmailEmbedding" e ON el.id = e."emailId"
                ORDER BY distance ASC
                LIMIT ${limit};
            `;
        }

        return NextResponse.json({ success: true, results });

    } catch (error: any) {
        console.error("Search Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

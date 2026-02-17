
import { EmbeddingService } from "../src/services/embedding";
import prisma from "../src/lib/prisma";

async function main() {
    console.log("--- Starting RAG Verification ---");

    // 1. Test Embedding Service
    console.log("1. Testing Embedding Service...");
    const service = new EmbeddingService();
    const text = "Software Engineer at Google";
    try {
        const vector = await service.embed(text);
        console.log(`- Generated vector of length: ${vector.length}`);
        if (vector.length !== 768) {
            console.error("ERROR: Expected 768 dimensions (Gemini 1.5/2.0)");
        } else {
            console.log("- Embedding Dimensions OK");
        }

        // 2. Test Vector Insert (Raw)
        console.log("2. Testing Vector Insert (Simulated)...");
        // We won't insert to avoid polluting DB with dummy data unless we clean up.
        // But we can check if we can query existing embeddings if any.

        // Let's try to query generic matches for "Engineer"
        console.log("3. Testing Search (Querying 'Engineer')...");
        const queryVector = await service.embed("Engineer");
        const vectorString = `[${queryVector.join(",")}]`;

        const results: any[] = await prisma.$queryRaw`
            SELECT j.role, j.company, e.vector <=> ${vectorString}::vector as distance
            FROM "JobApplication" j
            JOIN "JobEmbedding" e ON j.id = e."jobId"
            ORDER BY distance ASC
            LIMIT 3;
        `;

        console.log(`- Found ${results.length} results.`);
        results.forEach(r => console.log(`  - ${r.role} @ ${r.company} (Dist: ${r.distance})`));

    } catch (e) {
        console.error("Verification Failed:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();

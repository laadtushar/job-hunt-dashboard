import { EmbeddingService } from "../src/services/embedding";
import * as dotenv from "dotenv";

dotenv.config();

async function testLocalEmbedding() {
    process.env.EMBEDDING_PROVIDER = "HUGGINGFACE"; // Mapped to local Xenova pipeline
    // process.env.HUGGINGFACE_API_KEY = "hf_..."; 

    console.log("Testing Local Embedding Service (@xenova/transformers)...");
    const service = new EmbeddingService();

    try {
        const text = "This is a test sentence to verify the Xenova/bge-large-en-v1.5 model.";
        console.log(`Embedding text: "${text}"`);

        const embedding = await service.embed(text);

        console.log("--------------------------------------------------");
        console.log(`Success! Embedding generated.`);
        console.log(`Dimensions: ${embedding.length}`);
        console.log(`Sample values: [${embedding.slice(0, 5).join(", ")}...]`);

        if (embedding.length === 1024) {
            console.log("✅ Verification Passed: Dimensions match 1024.");
        } else {
            console.error(`❌ Verification Failed: Expected 1024 dimensions, got ${embedding.length}.`);
        }

    } catch (error) {
        console.error("❌ Test Failed:", error);
    }
}

testLocalEmbedding();

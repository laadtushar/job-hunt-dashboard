
import { GoogleGenerativeAI } from "@google/generative-ai";

export class EmbeddingService {
    private genAI: GoogleGenerativeAI;
    private model: any;
    private provider: 'GEMINI' | 'OPENROUTER' | 'HUGGINGFACE';

    constructor() {
        this.provider = (process.env.EMBEDDING_PROVIDER as 'GEMINI' | 'OPENROUTER' | 'HUGGINGFACE') ||
            (process.env.AI_PROVIDER as 'GEMINI' | 'OPENROUTER' | 'HUGGINGFACE') ||
            'GEMINI';
        const apiKey = process.env.GEMINI_API_KEY;

        if (this.provider === 'GEMINI') {
            if (!apiKey) {
                console.warn("GEMINI_API_KEY is missing but provider is set to GEMINI.");
                // Initialize dummy to prevent crash, calls will fail later
                this.genAI = new GoogleGenerativeAI("missing_key");
            } else {
                this.genAI = new GoogleGenerativeAI(apiKey);
                this.model = this.genAI.getGenerativeModel({ model: "text-embedding-004" });
            }
        } else {
            // For OPENROUTER and HUGGINGFACE, we don't need GoogleGenerativeAI initialization
            this.genAI = new GoogleGenerativeAI("dummy");
        }
    }

    async embed(text: string): Promise<number[]> {
        if (!text) return [];
        const cleanText = text.replace(/\n/g, " ").substring(0, 8000); // reduced slightly for safety

        if (this.provider === 'OPENROUTER') {
            return await this.embedWithOpenRouter(cleanText);
        } else if (this.provider === 'HUGGINGFACE') {
            return await this.embedWithHuggingFace(cleanText);
        } else {
            return await this.embedWithGemini(cleanText);
        }
    }

    private async embedWithGemini(text: string): Promise<number[]> {
        if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY missing");
        try {
            const result = await this.model.embedContent(text);
            return result.embedding.values;
        } catch (error: any) {
            if (error.status === 404 || error.message?.includes("404")) {
                console.warn("Gemini text-embedding-004 not found. Trying models/embedding-001...");
                const fallback = this.genAI.getGenerativeModel({ model: "models/embedding-001" });
                const res = await fallback.embedContent(text);
                return res.embedding.values;
            }
            throw error;
        }
    }

    private async embedWithOpenRouter(text: string): Promise<number[]> {
        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) throw new Error("OPENROUTER_API_KEY is not set");

        // Default to a free or low-cost model. 
        // Valid OpenRouter embedding models as of Feb 2026:
        // - openai/text-embedding-3-small (Standard, cheap)
        // - openai/text-embedding-3-large (High precision)
        // - qwen/qwen-embedding-v1 (Often free)
        const model = process.env.OPENROUTER_EMBEDDING_MODEL || "openai/text-embedding-3-small";

        const response = await fetch("https://openrouter.ai/api/v1/embeddings", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "https://jobhunt-dashboard.local",
                "X-Title": "Job Hunt Dashboard",
            },
            body: JSON.stringify({
                "model": model,
                "input": text
            })
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`OpenRouter Embedding Error: ${response.status} - ${err}`);
        }

        const data = await response.json();
        // OpenRouter (OpenAI compatible) returns data[0].embedding
        if (data?.data?.[0]?.embedding) {
            return data.data[0].embedding;
        }
        throw new Error("Invalid response structure from OpenRouter");
    }

    // Singleton pipeline instance to avoid reloading model on every request
    private static pipelineInstance: any = null;

    private async getPipeline() {
        if (!EmbeddingService.pipelineInstance) {
            const { pipeline } = await import('@xenova/transformers');
            // 'Xenova/bge-large-en-v1.5' is a high-quality 1024-dimension model
            // It runs locally in the node process.
            console.log("Loading local embedding model (Xenova/bge-large-en-v1.5)...");
            EmbeddingService.pipelineInstance = await pipeline('feature-extraction', 'Xenova/bge-large-en-v1.5');
        }
        return EmbeddingService.pipelineInstance;
    }

    private async embedWithHuggingFace(text: string): Promise<number[]> {
        try {
            const pipe = await this.getPipeline();

            // Generate embedding
            const output = await pipe(text, { pooling: 'mean', normalize: true });

            // Output is a Tensor, we need to convert to array
            // output.data is a Float32Array
            if (output && output.data) {
                return Array.from(output.data);
            }

            throw new Error(`Invalid local embedding output`);

        } catch (error: any) {
            console.error("Local Embedding Error:", error);
            throw new Error(`Local Embedding Error: ${error.message}`);
        }
    }

    // Helper to format Job Data into a single chunk
    static formatJobForEmbedding(job: any): string {
        return `
        Role: ${job.role}
        Company: ${job.company}
        Description: ${job.jobDescription || "No description"}
        Status: ${job.status}
        Location: ${job.location || ""}
        Note: ${job.feedback || ""}
        `.trim();
    }

    // Helper to format Email Data
    static formatEmailForEmbedding(email: any): string {
        return `
        Subject: ${email.subject}
        Sender: ${email.sender}
        Body: ${email.snippet || email.body?.substring(0, 200)}
        `.trim();
    }
}

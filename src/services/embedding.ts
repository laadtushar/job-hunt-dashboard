
import { GoogleGenerativeAI } from "@google/generative-ai";

export class EmbeddingService {
    private genAI: GoogleGenerativeAI;
    private model: any;
    private provider: 'GEMINI' | 'OPENROUTER';

    constructor() {
        this.provider = (process.env.AI_PROVIDER as 'GEMINI' | 'OPENROUTER') || 'GEMINI';
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
            // If provider is OPENROUTER, we don't need GoogleGenerativeAI initialization here
            // Initialize dummy to satisfy TypeScript, as genAI is not used for OpenRouter
            this.genAI = new GoogleGenerativeAI("dummy");
        }
    }

    async embed(text: string): Promise<number[]> {
        if (!text) return [];
        const cleanText = text.replace(/\n/g, " ").substring(0, 9000);

        if (this.provider === 'OPENROUTER') {
            return await this.embedWithOpenRouter(cleanText);
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

        // Default to a free model if not specified. 
        // Note: Check OpenRouter for the latest free embedding model.
        const model = process.env.OPENROUTER_EMBEDDING_MODEL || "google/text-embedding-004"; // Gemini 004 is often free/low cost on Google directly, check OpenRouter availability.
        // If the user wants a definitely free "OpenAI compatible" one:
        // const model = process.env.OPENROUTER_EMBEDDING_MODEL || "jinaai/jina-embeddings-v2-base-en"; 

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

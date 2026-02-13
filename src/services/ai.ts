
import { GoogleGenerativeAI } from "@google/generative-ai";
import prisma from "@/lib/prisma";

export interface ExtractedJobData {
    isJobRelated: boolean;
    company?: string;
    role?: string;
    jobId?: string;
    status?: string;
    location?: string;
    salary?: { base?: string; bonus?: string; equity?: string };
    dates?: { interview?: string; offerDeadline?: string };
    people?: { recruiterName?: string; recruiterEmail?: string; hiringManager?: string };
    companyInfo?: { domain?: string; linkedIn?: string; portalUrl?: string };
    urls?: { jobPost?: string };
    nextSteps?: string;
    sentiment?: string; // positive, negative, neutral
    sentimentScore?: number; // 0-1
    feedback?: string;
    receivedDate?: string; // ISO Date of the email
    _meta?: {
        model: string;
        provider: string;
    };
}


export class AIService {
    private genAI?: GoogleGenerativeAI;
    private model?: any;
    private provider: 'GEMINI' | 'OPENROUTER';

    constructor() {
        this.provider = (process.env.AI_PROVIDER as 'GEMINI' | 'OPENROUTER') || 'GEMINI';

        if (this.provider === 'GEMINI') {
            const apiKey = process.env.GEMINI_API_KEY;
            if (!apiKey) {
                console.warn("GEMINI_API_KEY is not set. AI parsing will fail.");
            } else {
                this.genAI = new GoogleGenerativeAI(apiKey);
                this.model = this.genAI.getGenerativeModel({
                    model: "gemini-2.0-flash",
                    generationConfig: { responseMimeType: "application/json" }
                });
            }
        }
    }

    private async _generateJson<T>(prompt: string): Promise<T> {
        let jsonString = "";

        if (this.provider === 'GEMINI') {
            if (!this.model) throw new Error("Gemini Model not initialized");
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            jsonString = response.text();
        } else if (this.provider === 'OPENROUTER') {
            const apiKey = process.env.OPENROUTER_API_KEY;
            if (!apiKey) throw new Error("OPENROUTER_API_KEY is not set");

            const model = process.env.OPENROUTER_MODEL || "google/gemini-2.0-flash-lite-001";

            let retries = 5;
            let attempt = 0;
            let delay = 2000;

            while (attempt < retries) {
                try {
                    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                        method: "POST",
                        headers: {
                            "Authorization": `Bearer ${apiKey}`,
                            "Content-Type": "application/json",
                            "HTTP-Referer": "https://jobhunt-dashboard.local",
                            "X-Title": "Job Hunt Dashboard",
                        },
                        body: JSON.stringify({
                            "model": model,
                            "messages": [{ "role": "user", "content": prompt }],
                            "response_format": { "type": "json_object" }
                        })
                    });

                    if (!response.ok) {
                        if (response.status === 429 || response.status === 503) {
                            const errText = await response.text();
                            let waitTime = delay;
                            try {
                                const errJson = JSON.parse(errText);
                                if (errJson.error?.metadata?.retry_after_seconds) {
                                    waitTime = errJson.error.metadata.retry_after_seconds * 1000;
                                }
                            } catch (e) { }

                            attempt++;
                            console.warn(`[AIService] OpenRouter ${response.status} (Attempt ${attempt}/${retries}). Retrying in ${waitTime}ms...`);

                            if (attempt >= retries) throw new Error(`OpenRouter API Error: ${response.status} - ${errText}`);
                            await new Promise(resolve => setTimeout(resolve, waitTime + 500));
                            delay *= 1.5;
                            continue;
                        }
                        const errText = await response.text();
                        throw new Error(`OpenRouter API Error: ${response.status} - ${errText}`);
                    }

                    const data = await response.json();
                    jsonString = data.choices?.[0]?.message?.content || "";
                    break;

                } catch (e: any) {
                    if (attempt < retries - 1 && (e.cause?.code === 'ECONNRESET' || e.message.includes('fetch failed'))) {
                        attempt++;
                        console.warn(`[AIService] Network Error (Attempt ${attempt}/${retries}). Retrying...`);
                        await new Promise(resolve => setTimeout(resolve, delay));
                        delay *= 2;
                        continue;
                    }
                    throw e;
                }
            }
        }

        const cleanText = jsonString.replace(/```json\s*/g, "").replace(/```\s*/g, "");
        try {
            return JSON.parse(cleanText) as T;
        } catch (e) {
            try {
                const fixed = cleanText.replace(/[\u0000-\u001F]+/g, "");
                return JSON.parse(fixed) as T;
            } catch (e2) {
                throw new Error(`Failed to parse JSON: ${jsonString.substring(0, 100)}...`);
            }
        }
    }

    async parseEmail(emailBody: string, subject: string, sender: string | undefined, receivedDate?: Date): Promise<ExtractedJobData> {
        // Fetch USER FEEDBACK for False Positives
        let feedbackContext = "";
        try {
            const falsePositives = await prisma.userFeedback.findMany({
                where: { type: "FALSE_POSITIVE" },
                take: 20
            });
            if (falsePositives.length > 0) {
                const examples = falsePositives.map((fp: any) => {
                    try {
                        const input = JSON.parse(fp.input);
                        return `- Sender: "${input.sender}", Subject: "${input.subject}" -> NOT JOB RELATED`;
                    } catch (e) { return ""; }
                }).filter((s: string) => s).join("\n");

                if (examples) {
                    feedbackContext = `
                    USER FEEDBACK (LEARNED RULES):
                    The user has explicitly marked similar emails as NOT job related. Review these patterns:
                    ${examples}
                    
                    If the current email matches any of these patterns, set "isJobRelated": false.
                    `;
                }
            }
        } catch (e) {
            console.warn("Failed to fetch user feedback:", e);
        }

        const prompt = `
        Analyze the following email and extract job application details.
        ${feedbackContext}

        STRICT RULES:
        1.  **Is this job related?** Set "isJobRelated": true ONLY if it is a confirmation, update, interview invite, rejection, or offer. Marketing spam = false.
        2.  **Job ID**: Look for "Job ID", "Ref", "Requisition ID", or codes in footers (e.g., "ID: 30883532").
        3.  **Status**: "APPLIED", "SCREEN", "INTERVIEW", "OFFER", "REJECTED".
        4.  **Company**: Extract the CLEAR company name.
        5.  **Role**: precise job title.
        6.  **Salary**: Extract ranges if available.
        7.  **Next Steps**: Summarize strict next actions.
        8.  **Sender Domain**: Use the Sender email to infer company domain if it's a corporate address (not gmail/yahoo).
        
        
        Sender: ${sender || "Unknown"}
        Subject: ${subject}
        Received Date: ${receivedDate ? receivedDate.toISOString().split('T')[0] : "Unknown"}
        Body: ${emailBody.substring(0, 8000)} 
        
        Return ONLY valid JSON:
        {
            "isJobRelated": boolean,
            "company": "string",
            "role": "string",
            "jobId": "string | null",
            "status": "APPLIED" | "SCREEN" | "INTERVIEW" | "OFFER" | "REJECTED" | "GHOSTED",
            "location": "string | null",
            "salary": { "base": "string", "bonus": "string", "equity": "string" },
            "urls": { "jobPost": "string", "applicationStatus": "string" },
            "people": { "recruiterName": "string", "recruiterEmail": "string", "hiringManager": "string" },
            "companyInfo": { "domain": "string", "linkedIn": "string" },
            "nextSteps": "string",
            "sentimentScore": number (0-1),
            "feedback": "string"
        }
        `;

        try {
            const result = await this._generateJson<ExtractedJobData>(prompt);
            result.receivedDate = receivedDate ? receivedDate.toISOString() : undefined;
            result._meta = {
                provider: this.provider,
                model: this.provider === 'GEMINI' ? 'gemini-2.0-flash' : (process.env.OPENROUTER_MODEL || 'unknown')
            };
            return result;
        } catch (error: any) {
            console.error('AI Service Error:', error.message);
            return { isJobRelated: false, feedback: error.message };
        }
    }

    async resolveIdentity(newJob: ExtractedJobData, candidates: { id: string, role: string, company: string, status: string, appliedDate: Date }[]): Promise<string | null> {
        if (!candidates || candidates.length === 0) return null;

        // Fetch USER FEEDBACK for Merging
        let feedbackContext = "";
        try {
            const mergePatterns = await prisma.userFeedback.findMany({
                where: { type: "MERGE_PATTERN" },
                take: 20
            });
            if (mergePatterns.length > 0) {
                const examples = mergePatterns.map((mp: any) => {
                    try {
                        const input = JSON.parse(mp.input);
                        // input might be { roleA: "...", roleB: "...", company: "..." }
                        return `- At "${input.company}", "${input.roleA}" IS THE SAME AS "${input.roleB}"`;
                    } catch (e) { return ""; }
                }).filter((s: string) => s).join("\n");

                if (examples) {
                    feedbackContext = `
                    USER FEEDBACK (LEARNED EQUIVALENCES):
                    The user has explicitly confirmed these are the SAME application:
                    ${examples}
                    `;
                }
            }
        } catch (e) {
            console.warn("Failed to fetch user feedback:", e);
        }

        const candidatesDesc = candidates.map((c, i) =>
            `${i + 1}. ID: ${c.id}\n   Role: ${c.role}\n   Company: ${c.company}\n   Status: ${c.status}\n   Date: ${c.appliedDate.toISOString().split('T')[0]}`
        ).join("\n");

        const prompt = `
        You are an expert HR Data Auditor. Task: Determine if a new job update refers to an existing application.
        ${feedbackContext}

        NEW UPDATE:
        Company: ${newJob.company}
        Role: ${newJob.role}
        Status: ${newJob.status}
        Date: ${newJob.receivedDate ? newJob.receivedDate.split('T')[0] : "Unknown"}
        
        EXISTING CANDIDATES:
        ${candidatesDesc}
        
        INSTRUCTIONS:
        - Analyze semantic similarity. "Senior Engineer" == "SDE III".
        - If the new update is just a status change (e.g. "We are moving forward" email) for a candidate, MATCH IT.
        - If roles are different (e.g. "Product Manager" vs "Engineer"), DO NOT MATCH.
        - If the candidate is old (> 6 months) and this looks like a new application (based on Date), DO NOT MATCH.
        
        Return JSON:
        {
            "matchId": "ID_OF_MATCH" | null,
            "reason": "Brief explanation"
        }
        `;

        try {
            const result = await this._generateJson<{ matchId: string | null, reason: string }>(prompt);
            console.log(`[AI Judge] Decision: ${result.matchId} (${result.reason})`);
            return result.matchId;
        } catch (error) {
            console.error('[AI Judge] Failed:', error);
            return null; // Fallback to safe "No Match"
        }
    }
}

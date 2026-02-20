
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
    thoughtProcess?: string; // Explain your critique and correction (Reflexion)
    receivedDate?: string; // ISO Date of the email
    analysis?: string; // Raw AI extraction JSON
    rejectionReason?: string; // Concise reason if rejected
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
            const falsePositives = await (prisma as any).userFeedback.findMany({
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
        1.  **Is this job related?** Set "isJobRelated": true ONLY if it is a confirmation, update, interview invite, rejection, or offer. 
            - **CRITICAL**: ID generic marketing emails (newsletters, "join our talent community", "webinar invite") as "isJobRelated": false.
        2.  **Job ID / Reference**: Look for "Job ID", "Ref", "Requisition ID", or codes in footers (e.g., "ID: 30883532").
            - **JOB BOARDS**: If email is from Indeed, CV Library, etc., look for their unique "Ref: 12345" identifiers.
        3.  **Status**: "APPLIED", "SCREEN", "INTERVIEW", "OFFER", "REJECTED".
            - **HIERARCHY**: OFFER > INTERVIEW > SCREEN > APPLIED > REJECTED.
            - "Scheduling a chat" = SCREEN or INTERVIEW.
            - "Not moving forward" = REJECTED.
            - "Thanks for applying" = APPLIED.
        4.  **Company**: Extract the CLEAR company name.
            - **HIDDEN COMPANIES**: If company is generic (e.g. "Confidential Application", "A Leading Tech Firm" via CV Library), set company to "Confidential (via [BoardName])".
        5.  **Role**: precise job title.
        6.  **Salary**: Extract ranges if available.
        7.  **Next Steps**: Summarize strict next actions.
        8.  **Sender Domain**: Use the Sender email to infer company domain if it's a corporate address (not gmail/yahoo).
        9.  **Rejection Reason**: If the status is "REJECTED", extract a VERY CONCISE reason (max 10 words). Examples: "Generic rejection", "Role closed", "Skills mismatch", "Position put on hold", "Not specifying". If not rejected, leave null.
        
        
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
            "rejectionReason": "string | null",
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
        
        EXISTING CANDIDATES (Sorted by freshness):
        ${candidatesDesc}
        
        INSTRUCTIONS - FOLLOW STEP-BY-STEP:
        1.  **Company Check**: Must be the same company (fuzzy match ok, e.g. "Google" == "Google Inc").
        2.  **Role Check**: Analyze semantic role similarity. 
            - "Software Engineer" == "SDE" == "Dev" (MATCH). 
            - "Product Manager" != "Software Engineer" (NO MATCH).
        3.  **Date & Status Logic**:
            - Calculate days difference between NEW Date and CANDIDATE Date.
            - **Scenario A (Status Update)**: If NEW status is "INTERVIEW", "OFFER", "REJECTED" -> It is an update to the *most recent* compatible role. MATCH IT.
            - **Scenario B (Re-Application)**: If NEW status is "APPLIED" and gap is > 4 months (120 days) -> It is likely a fresh application. DO NOT MATCH.
            - **Scenario C (Duplicate)**: If NEW status is "APPLIED" and gap is < 4 months -> It is a duplicate/reminder. MATCH IT.
        4.  **JOB BOARD LOGIC (CRITICAL)**:
            - If Company is "Confidential (via ...)" or generic (e.g. "CV Library", "Indeed"):
            - **STRICTLY REQUIRE** a matching "jobId" / "Ref" number OR a near-identical Role Title to merge.
            - If Reference IDs differ, treat as SEPARATE jobs.
        
        Return JSON:
        {
            "thoughtProcess": "Brief negotiation of steps 1-3...",
            "matchId": "ID_OF_MATCH" | null,
            "confidence": "HIGH" | "MEDIUM" | "LOW"
        }
        `;

        try {
            const result = await this._generateJson<{ matchId: string | null, thoughtProcess: string }>(prompt);
            console.log(`[AI Judge] Decision: ${result.matchId} (${result.thoughtProcess})`);
            return result.matchId;
        } catch (error) {
            console.error('[AI Judge] Failed:', error);
            return null; // Fallback to safe "No Match"
        }
    }

    // REFLEXION PATTERN: Re-evaluate based on user signal
    async reanalyzeEmail(
        body: string,
        subject: string,
        sender: string,
        previousOutput: any,
        additionalEmails: { subject: string, body: string, sender: string, date: string }[] = [],
        userFeedbackInput: string = ""
    ): Promise<ExtractedJobData> {
        let feedbackContext = "";

        // 1. Incorporate Direct User Instructions (highest priority)
        if (userFeedbackInput) {
            feedbackContext += `
            USER DIRECTIVE (GROUND TRUTH):
            The user explicitly stated: "${userFeedbackInput}"
            You MUST trust this feedback. If they say "It's an interview", it IS an interview.
            `;
        }

        try {
            // Fetch relevant false positive patterns to avoid making the same mistake twice if it matches a known pattern
            // @ts-ignore - Prisma client regeneration sometimes lags in older VSCode sessions
            const falsePositives = await (prisma as any).userFeedback.findMany({
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
                    feedbackContext += `
                    KNOWN FALSE POSITIVES (System Knowledge):
                    ${examples}
                    `;
                }
            }
        } catch (e) { }

        // 2. Prepare Additional Email Context
        let additionalContext = "";
        if (additionalEmails.length > 0) {
            additionalContext = `
            ADDITIONAL RELATED EMAILS FOUND (Chronological Order):
            ${additionalEmails.map((email, i) => `
            --- EMAIL #${i + 1} ---
            Date: ${email.date}
            From: ${email.sender}
            Subject: ${email.subject}
            Body: ${(email.body || "").substring(0, 5000)}
            `).join("\n")}
            `;
        }

        const prompt = `
        You are an expert HR Data Auditor. 
        
        CRITICAL TASK: FIX A PREVIOUS ERROR
        The user has flagged a previous extraction as INCORRECT. You need to re-examine the email(s) and correct the data.
        
        ${feedbackContext}

        --------------------------------------------------
        ORIGINAL EMAIL CONTEXT:
        Subject: "${subject}"
        Sender: "${sender}"
        Body:
        ${(body || "").substring(0, 10000)}
        
        ${additionalContext}
        --------------------------------------------------
        
        PREVIOUS (INCORRECT) EXTRACTION:
        ${JSON.stringify(previousOutput, null, 2)}
        
        --------------------------------------------------
        YOUR INSTRUCTION:
        1.  Critique the Previous Extraction: Why might the user have flagged this?
        2.  Analyze ALL emails provided (Original + Additional). 
            - Look for "hidden" updates in the thread (e.g. a reply causing a status change).
            - Note dates: A later email overrides an earlier one.
        3.  Strictly follow these rules:
            - STATUS HIERARCHY: OFFER > INTERVIEW > SCREEN > APPLIED > REJECTED.
            - "Scheduling a chat" = SCREEN or INTERVIEW.
            - "Not moving forward" = REJECTED.
            - "Thanks for applying" = APPLIED.
            - IF User Directive says "Status is X", then Status IS X.
            - IF Status is REJECTED, identify the "rejectionReason" (concise, max 10 words).
            
        4.  Return the CORRECTED JSON.
        
        Output JSON format:
        {
            "isJobRelated": boolean,
            "company": "string",
            "role": "string",
            "status": "APPLIED" | "SCREEN" | "INTERVIEW" | "OFFER" | "REJECTED" | "GHOSTED",
            "nextSteps": "string",
            "rejectionReason": "string | null",
            "salary": { "base": "string", "bonus": "string", "equity": "string" },
            "location": "string | null",
            "confidence": number (0-1),
            "thoughtProcess": "string (Explain your critique and correction)"
        }
        `;

        try {
            const result = await this._generateJson<ExtractedJobData>(prompt);
            return {
                ...result,
                receivedDate: previousOutput.receivedDate, // Preserve original date
                _meta: {
                    model: this.provider === 'GEMINI' ? 'gemini-2.0-flash' : (process.env.OPENROUTER_MODEL || 'unknown'),
                    provider: this.provider
                }
            };
        } catch (e) {
            console.error("Re-analysis failed", e);
            throw e;
        }
    }

    async answerQuestion(query: string, context: string): Promise<{ answer: string, suggestedQuestions?: string[] }> {
        const prompt = `
        You are an intelligent Job Hunt Assistant. 
        Your goal is to answer the user's question based STRICTLY on the provided context (their job applications and emails).
        
        USER QUESTION: "${query}"
        
        CONTEXT (Retrieved from Database):
        ${context}
        
        INSTRUCTIONS:
        1. Answer the question clearly and concisely.
        2. Cite specific companies or roles if mentioned in the context.
        3. If the context doesn't contain the answer, say "I couldn't find information about that in your tracked jobs."
        4. Be encouraging and professional.
        5. (Optional) formatting: Use Markdown (bolding, lists) for readability.
        
        Return JSON:
        {
            "answer": "markdown string",
            "suggestedQuestions": ["follow up 1", "follow up 2"]
        }
        `;

        try {
            return await this._generateJson(prompt);
        } catch (e: any) {
            console.error("RAG Answer Error:", e);
            return { answer: "Sorry, I encountered an error while analyzing your data.", suggestedQuestions: [] };
        }
    }

    // BULK IMPORT
    async parseBulkJobs(rawText: string): Promise<ExtractedJobData[]> {
        const prompt = `
        You are a Data Parsing Specialist.
        Convert the following unstructured text into a structured list of Job Applications.
        The text might be a copy-paste from Excel, a LinkedIn list, or an email summary.

        RAW TEXT:
        "${rawText.substring(0, 15000)}"

        INSTRUCTIONS:
        1. Identify individual job entries.
        2. Extract: Company, Role, Status (default to APPLIED if unknown), Location, Salary.
        3. If data is missing (e.g. Salary), leave it null.
        4. Clean up company names (remove "Inc.", "Ltd." unless necessary).
        5. Infer Status from context (e.g. "Interviewed last week" -> INTERVIEW).

        Return JSON Array:
        [
            {
                "isJobRelated": true,
                "company": "string",
                "role": "string",
                "status": "APPLIED" | "SCREEN" | "INTERVIEW" | "OFFER" | "REJECTED",
                "location": "string | null",
                "salary": { "base": "string" },
                "rejectionReason": "string | null",
                "notes": "string (any extra info found)"
            }
        ]
        `;

        try {
            const result = await this._generateJson<{ jobs: ExtractedJobData[] } | ExtractedJobData[]>(prompt);
            // Handle both object wrapper or direct array
            if (Array.isArray(result)) return result;
            if ('jobs' in result && Array.isArray((result as any).jobs)) return (result as any).jobs;
            return [];
        } catch (e: any) {
            console.error("Bulk Parsing Error:", e);
            return [];
        }
    }

    // TASK GENERATION
    async generateTasks(applications: {
        id: string;
        company: string;
        role: string;
        status: string;
        lastUpdate: Date;
        nextSteps?: string | null;
        feedback?: string | null;
        interviewDate?: Date | null;
        offerDeadline?: Date | null;
        recruiterName?: string | null;
        recruiterEmail?: string | null;
        emailLogs?: { subject?: string | null; snippet?: string | null; receivedDate: Date }[];
    }[]): Promise<{
        title: string;
        description: string;
        priority: string;
        category: string;
        dueDate: string | null;
        applicationId: string | null;
    }[]> {
        const today = new Date().toISOString().split('T')[0];
        const appSummaries = applications.slice(0, 30).map(app => {
            const recentEmail = app.emailLogs?.[0];
            return `- ID: ${app.id} | ${app.company} (${app.role}) | Status: ${app.status} | Last Update: ${app.lastUpdate.toISOString().split('T')[0]}${app.nextSteps ? ` | Next Steps: ${app.nextSteps}` : ''}${app.interviewDate ? ` | Interview: ${app.interviewDate.toISOString().split('T')[0]}` : ''}${app.offerDeadline ? ` | Offer Deadline: ${app.offerDeadline.toISOString().split('T')[0]}` : ''}${recentEmail ? ` | Latest Email: "${recentEmail.subject}" (${recentEmail.receivedDate.toISOString().split('T')[0]})` : ''}`;
        }).join('\n');

        const prompt = `
        You are a career coach AI. Today is ${today}.
        Based on the following job applications, generate a list of specific, actionable tasks the job seeker should do.

        APPLICATIONS:
        ${appSummaries}

        TASK GENERATION RULES:
        1. Generate 5-15 tasks total. Focus on the most impactful actions.
        2. For INTERVIEW status: create "Prepare for interview at [Company]" tasks (HIGH priority).
        3. For OFFER status: create "Review and respond to offer from [Company]" tasks (URGENT priority).
        4. For SCREEN status: create "Research [Company] before screening call" tasks (MEDIUM priority).
        5. For APPLIED (no update in 7+ days): create "Follow up with [Company] on [Role] application" tasks (LOW priority).
        6. For REJECTED: create "Send thank-you / request feedback from [Company]" tasks (LOW priority).
        7. If an interview date is set, create a preparation task due 1 day before.
        8. If an offer deadline is set, create a decision task due on that date.
        9. Do NOT create tasks for GHOSTED applications older than 30 days.
        10. Deduplicate — don't create multiple identical tasks for the same company.

        CATEGORIES: FOLLOW_UP, INTERVIEW_PREP, APPLICATION, RESEARCH, NETWORKING
        PRIORITIES: LOW, MEDIUM, HIGH, URGENT

        Return ONLY valid JSON array:
        [
            {
                "title": "string (concise, action-oriented)",
                "description": "string (1-2 sentences with specific context)",
                "priority": "LOW" | "MEDIUM" | "HIGH" | "URGENT",
                "category": "FOLLOW_UP" | "INTERVIEW_PREP" | "APPLICATION" | "RESEARCH" | "NETWORKING",
                "dueDate": "YYYY-MM-DD or null",
                "applicationId": "string (the application ID from above) or null"
            }
        ]
        `;

        try {
            const result = await this._generateJson<{ tasks: any[] } | any[]>(prompt);
            if (Array.isArray(result)) return result;
            if ('tasks' in result && Array.isArray((result as any).tasks)) return (result as any).tasks;
            return [];
        } catch (e: any) {
            console.error("Task Generation Error:", e);
            return [];
        }
    }

    // MISSING JOB SYNC AGENT LOGIC
    async detectIntent(message: string): Promise<{ intent: 'MISSING_JOB' | 'CHECK_GHOSTS' | 'CHECK_DRIFT' | 'CHECK_DUPLICATES' | 'CHECK_THREADS' | 'SHOW_LEARNINGS' | 'GENERAL', company?: string }> {
        const prompt = `
        Analyze the user message and determine their intent.
        
        INTENTS:
        - MISSING_JOB: Reporting a sync error or missing application. (e.g., "I applied to Stripe but it's not here")
        - CHECK_GHOSTS: Asking to check for stale/ghosted applications. (e.g., "Check for ghost jobs", "Any companies ghosting me?")
        - CHECK_DRIFT: Asking to re-validate status or find missed emails. (e.g., "Check my status drift", "Did I miss any interview emails?")
        - CHECK_DUPLICATES: Asking to find duplicates. (e.g., "Any duplicate applications?", "Merge duplicates")
        - CHECK_THREADS: Asking about unanswered messages. (e.g., "Who haven't I replied to?", "Check my thread watch")
        - SHOW_LEARNINGS: Asking what the agent has learned. (e.g., "What have you learned?", "Show me your agent learnings")
        - GENERAL: Any other question about jobs or status.
        
        Message: "${message}"
        
        Return JSON:
        {
            "intent": "MISSING_JOB" | "CHECK_GHOSTS" | "CHECK_DRIFT" | "CHECK_DUPLICATES" | "CHECK_THREADS" | "SHOW_LEARNINGS" | "GENERAL",
            "company": "string | null (only for MISSING_JOB)"
        }
        `;
        try {
            const res = await this._generateJson<any>(prompt);
            const validIntents = ['MISSING_JOB', 'CHECK_GHOSTS', 'CHECK_DRIFT', 'CHECK_DUPLICATES', 'CHECK_THREADS', 'SHOW_LEARNINGS', 'GENERAL'];
            return {
                intent: validIntents.includes(res.intent) ? res.intent : 'GENERAL',
                company: res.company || undefined
            };
        } catch (e) {
            return { intent: 'GENERAL' };
        }
    }

    async generateGmailQuery(company: string, userMessage: string): Promise<string> {
        const prompt = `
        Generate a high-precision Gmail search query to find job application emails for a specific company based on the user's report.
        User said: "${userMessage}"
        Company: "${company}"
        
        Rules:
        1. Use "subject:(...)" for company name and job keywords.
        2. Include common job-related terms to avoid noise.
        3. Exclude query labels if not sure, but use "after:2024/01/01" as a baseline.
        
        Return JSON:
        { "query": "string" }
        `;
        try {
            const res = await this._generateJson<any>(prompt);
            return res.query || `subject:(${company}) label:inbox after:2024/01/01`;
        } catch (e) {
            return `subject:(${company}) label:inbox after:2024/01/01`;
        }
    }

    async reflectOnSearch(userMessage: string, foundEmails: any[], foundJobs: any[]): Promise<string> {
        const emailSummaries = foundEmails.map(e => `Subject: ${e.subject} | From: ${e.sender}`).join('\n');
        const jobSummaries = foundJobs.map(j => `Company: ${j.company} | Role: ${j.role} | Status: ${j.status}`).join('\n');

        const prompt = `
        You are a self-reflecting AI Agent. A user reported a missing job sync: "${userMessage}".
        You searched Gmail and found:
        
        EMAILS FOUND:
        ${emailSummaries || "None"}
        
        JOBS SUCCESSFULLY INGESTED:
        ${jobSummaries || "None"}
        
        TASK:
        Provide a detailed, helpful, and transparent reflection to the user.
        1. If found: Explain what you found and that it's now synced.
        2. If not found: Explain that you searched but couldn't find a clear match, and why (e.g., maybe the company name in the email is different).
        3. Self-reflection: Mention what you learned (e.g., "I missed this earlier because the sender was generic") or how you will improve.
        4. Be supportive.
        
        Return JSON:
        { "reflection": "markdown string" }
        `;
        try {
            const res = await this._generateJson<any>(prompt);
            return res.reflection || "I've searched your Gmail but couldn't find any new matching applications. I'll continue to improve my detection logic.";
        } catch (e) {
            return "Search complete. No new applications were found that matched your request.";
        }
    }

    async detectGhostApplications(apps: any[]): Promise<any[]> {
        const appInfo = apps.map(app => `- ${app.company} (${app.role}) | Applied: ${app.appliedDate.toISOString().split('T')[0]} | Last Update: ${app.lastUpdate.toISOString().split('T')[0]}`).join('\n');
        const prompt = `
        Analyze the following stale job applications and determine which ones are likely "ghost jobs" (no activity for 2+ weeks).
        Today is ${new Date().toISOString().split('T')[0]}.
        
        APPLICATIONS:
        ${appInfo}
        
        For each application, decide if it's GHOSTED, and provide a short reasoning.
        Reasoning could be: "High probability of ghosting due to 3+ weeks silence", "Standard processing time for this sector", etc.
        
        Return JSON array:
        [
            {
                "company": "string",
                "role": "string",
                "isGhosted": boolean,
                "reasoning": "string"
            }
        ]
        `;
        try {
            return await this._generateJson<any[]>(prompt);
        } catch (e) {
            console.error("Ghost Detection Error:", e);
            return [];
        }
    }

    async reClassifyEmail(email: any, app: any): Promise<{ shouldReclassify: boolean, reasoning: string, newStatus?: string }> {
        const prompt = `
        Reflexion Loop: A previously ignored email might be relevant to a job application.
        
        APPLICATION:
        Company: ${app.company} | Role: ${app.role} | Current Status: ${app.status}
        
        EMAIL:
        Subject: ${email.subject} | From: ${email.sender} | Snippet: ${email.snippet}
        
        TASK:
        Determine if this email is actually job-related and if it should change the application status.
        Specifically, look for interview invites, rejections, or requests for more info.
        
        Return JSON:
        {
            "shouldReclassify": boolean,
            "reasoning": "string",
            "newStatus": "APPLIED" | "SCREEN" | "INTERVIEW" | "OFFER" | "REJECTED" | null
        }
        `;
        try {
            return await this._generateJson<any>(prompt);
        } catch (e) {
            return { shouldReclassify: false, reasoning: "Error in reclassification logic." };
        }
    }

    async detectDuplicates(apps: any[]): Promise<any[]> {
        const appInfo = apps.map(app => `- [ID: ${app.id}] ${app.company} | ${app.role} | Applied: ${app.appliedDate.toISOString().split('T')[0]}`).join('\n');
        const prompt = `
        Fuzzy Matching: Identify potential duplicate job applications from the list below.
        Applications might have slightly different names (e.g., "Google" vs "Alphabet") or roles (e.g., "SDE" vs "Software Engineer").
        
        APPLICATIONS:
        ${appInfo}
        
        Return JSON array of duplicate pairs:
        [
            {
                "id1": "string",
                "id2": "string",
                "reasoning": "string",
                "confidence": number (0-1)
            }
        ]
        `;
        try {
            const res = await this._generateJson<any[]>(prompt);
            return Array.isArray(res) ? res : [];
        } catch (e) {
            return [];
        }
    }

    async assessUnansweredThreads(threads: any[]): Promise<any[]> {
        const threadInfo = threads.map(t => `- Company: ${t.company} | Role: ${t.role} | Last Sender: ${t.lastSender} | Last Message Date: ${t.lastDate}`).join('\n');
        const prompt = `
        Proactive Thread Analysis: Identify threads where the user HAS NOT replied to a company message and it's been > 24h.
        
        THREADS:
        ${threadInfo}
        
        Return JSON array of threads needing attention:
        [
            {
                "company": "string",
                "role": "string",
                "urgency": "LOW" | "MEDIUM" | "HIGH" | "URGENT",
                "reasoning": "string"
            }
        ]
        `;
        try {
            return await this._generateJson<any[]>(prompt);
        } catch (e) {
            return [];
        }
    }
}

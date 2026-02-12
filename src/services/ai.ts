
import { GoogleGenerativeAI } from "@google/generative-ai";

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
}

export class AIService {
    private genAI: GoogleGenerativeAI;
    private model: any;

    constructor() {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.warn("GEMINI_API_KEY is not set. AI parsing will fail.");
        }
        this.genAI = new GoogleGenerativeAI(apiKey || "");
        // "gemini-2.5-flash-lite" is the cost-effective model requested by user
        this.model = this.genAI.getGenerativeModel({
            model: "gemini-2.5-flash-lite",
            generationConfig: { responseMimeType: "application/json" }
        });
    }

    async parseEmail(emailBody: string, subject: string): Promise<ExtractedJobData> {
        const prompt = `
        Analyze the following email and extract job application details.
        
        STRICT RULES:
        1.  **Is this job related?** Set "isJobRelated": true ONLY if it is a confirmation, update, interview invite, rejection, or offer. Marketing spam = false.
        2.  **Job ID**: Look for "Job ID", "Ref", "Requisition ID", or codes in footers (e.g., "ID: 30883532").
        3.  **Status**:
            - "APPLIED": "Application received", "Thank you for applying", "We have received your application".
            - "SCREEN": "assessment", "online test", "hiring manager review".
            - "INTERVIEW": "interview", "chat", "availability", "schedule a time".
            - "OFFER": "offer", "congratulations".
            - "REJECTED": "unfortunately", "not moving forward", "pursuing other candidates".
        4.  **Company**: Extract the CLEAR company name. If the email is from a recruiting agency (e.g., "ApplyGateway"), try to find the *actual* hiring company in the body. If not found, use the agency name.
        5.  **Role**: precise job title (e.g., "Senior Software Engineer").
        6.  **Salary**: Look for "£", "$", "salary", "annum". Extract ranges if available.
        7.  **Next Steps**: Summarize strict next actions (e.g., "Complete coding test by Friday").
        
        Subject: ${subject}
        Body: ${emailBody.substring(0, 5000)} // Truncate to avoid token limits
        
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
            "people": { "recruiterName": "string", "recruiterEmail": "string" },
            "nextSteps": "string",
            "sentimentScore": number (0-100),
            "feedback": "string"
        }
        `;

        try {
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            let cleanText = text.replace(/```json\s*/g, "").replace(/```\s*/g, "");

            // Try to parse clean text
            try {
                return JSON.parse(cleanText) as ExtractedJobData;
            } catch (e) {
                // Second attempt: aggressive escape of control chars if first parse fails
                try {
                    // Remove all control characters (incl. newlines) which might break JSON strings
                    // This is valid because we only want data, formatting inside strings is secondary
                    const fixed = cleanText.replace(/[\u0000-\u001F]+/g, "");
                    return JSON.parse(fixed) as ExtractedJobData;
                } catch (e2) {
                    console.error('AI Parsing Failed. Raw text:', text);
                    return { isJobRelated: false };
                }
            }

        } catch (error) {
            console.error('AI Service Error:', error);
            return { isJobRelated: false };
        }
    }
}

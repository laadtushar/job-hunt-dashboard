
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
      Analyze the following email to determine if it is related to a job application or recruitment process.
      
      Subject: ${subject}
      Body: ${emailBody}
      
      If it is NOT job-related, return {"isJobRelated": false}.
      
      If it IS job-related, extract as much data as possible into the following JSON format:
      {
        "isJobRelated": true,
        "company": "Company Name",
        "role": "Job Title",
        "jobId": "Job ID or Reference Number if found",
        "status": "One of: APPLIED, SCREEN, INTERVIEW, OFFER, REJECTED, GHOSTED",
        "location": "City, State or Remote/Hybrid",
        "salary": { "base": "amount", "bonus": "amount", "equity": "amount" },
        "dates": { "interview": "ISO string", "offerDeadline": "ISO string" },
        "people": { "recruiterName": "Name", "recruiterEmail": "Email", "hiringManager": "Name" },
        "companyInfo": { "domain": "company.com", "linkedIn": "linkedin url", "portalUrl": "application portal url" },
        "urls": { "jobPost": "url to job posting" },
        "nextSteps": "What the user needs to do next",
        "sentiment": "positive/negative/neutral",
        "sentimentScore": 0.0 to 1.0 (1.0 being most positive),
        "feedback": "Any specific feedback given"
      }
      
      Be aggressive in extracting details. Infer company domain from email sender if possible.
    `;

        try {
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            if (!text) throw new Error('No content from Gemini');

            return JSON.parse(text) as ExtractedJobData;
        } catch (error) {
            console.error('AI Parsing Error:', error);
            return { isJobRelated: false };
        }
    }
}

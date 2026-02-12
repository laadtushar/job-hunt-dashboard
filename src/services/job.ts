import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { ExtractedJobData } from './ai';

export class JobService {

    // Find application by email thread ID (Strongest link)
    async findByThreadId(threadId: string) {
        if (!threadId) return null;

        const log = await prisma.emailLog.findFirst({
            where: { threadId },
            include: { application: true }
        });

        return log?.application || null;
    }

    // Smart deduplication logic
    async findExistingApplication(data: ExtractedJobData, threadId?: string) {
        // 1. Check Thread ID (High Confidence)
        if (threadId) {
            const byThread = await this.findByThreadId(threadId);
            if (byThread) return byThread;
        }

        // 2. Check Job ID + Company (High Confidence)
        if (data.jobId && data.company) {
            const byJobId = await prisma.jobApplication.findFirst({
                where: {
                    company: { contains: data.company.trim() },
                    jobId: data.jobId.trim()
                }
            });
            if (byJobId) return byJobId;
        }

        // 3. Fuzzy match (Legacy/Last Resort)
        // Only if we fail to match thread or ID. 
        return this.findDuplicate(data.company, data.role);
    }

    // Fuzzy deduplication logic (Helper)
    async findDuplicate(company: string | undefined | null, role: string | undefined | null) {
        // Simple exact match for now, could be enhanced with fuzzy search if database supports it
        // or by normalizing strings (lowercase, remove punctuation)
        // For SQLite, we can use raw query or simple findFirst

        const safeCompany = company || "Unknown Company";
        const safeRole = role || "Unknown Role";

        // Normalize logic in code for better control
        const normalizedCompany = safeCompany.toLowerCase().trim();
        const normalizedRole = safeRole.toLowerCase().trim();

        // Efficiently fetch potentially similar records
        const candidates = await prisma.jobApplication.findMany({
            where: {
                company: { contains: normalizedCompany }, // naive approach
            }
        });

        // In-memory strict check? Or just trust the query?
        // Let's stick to "Company Name" and "Role" should match reasonably well
        // If Role is completely different, treated as new application
        return candidates.find((c: any) =>
            c.company.toLowerCase().includes(normalizedCompany) &&
            c.role.toLowerCase().includes(normalizedRole)
        );
    }

    async createOrUpdateApplication(userId: string, data: ExtractedJobData, threadId?: string, source: string = 'GMAIL') {
        const existing = await this.findExistingApplication(data, threadId);

        if (existing) {
            // Update logic
            return await prisma.jobApplication.update({
                where: { id: existing.id },
                data: {
                    status: data.status || existing.status,
                    lastUpdate: new Date(),
                    // Update rich data if missing
                    jobId: existing.jobId || data.jobId,
                    salaryRange: !existing.salaryRange ? (data.salary ? JSON.stringify(data.salary) : null) : existing.salaryRange,
                    nextSteps: data.nextSteps || existing.nextSteps,
                }
            });
        }

        // Create new
        return await prisma.jobApplication.create({
            data: {
                userId,
                company: data.company || "Unknown Company",
                role: data.role || "Unknown Role",
                jobId: data.jobId,
                status: data.status || "APPLIED",
                source: source,
                appliedDate: new Date(),
                // Map other fields
                location: data.location,
                salaryRange: data.salary ? JSON.stringify(data.salary) : null,
                companyDomain: data.companyInfo?.domain,
                companyLinkedIn: data.companyInfo?.linkedIn,
                jobPostUrl: data.urls?.jobPost,
                recruiterName: data.people?.recruiterName,
                recruiterEmail: data.people?.recruiterEmail,
                hiringManager: data.people?.hiringManager,
                nextSteps: data.nextSteps,
                sentimentScore: data.sentimentScore,
                feedback: data.feedback,
            }
        });
    }
}

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

    // --- Advanced Matching Helpers ---

    private normalizeString(str: string): string {
        return str.toLowerCase().trim().replace(/[^\w\s]/g, ''); // Remove punctuation
    }

    private cleanCompanyName(name: string): string {
        return this.normalizeString(name)
            .replace(/\b(inc|llc|ltd|corp|corporation|gmbh|co|company)\b/g, '')
            .trim();
    }

    private cleanRoleTitle(title: string): string {
        return this.normalizeString(title)
            .replace(/\b(senior|junior|lead|principal|staff|intern|ii|iii|iv)\b/g, '') // Levels
            .replace(/\b(remote|hybrid|onsite|full time|contract)\b/g, '') // Type/Location
            .replace(/\b(m\/f\/d|f\/m\/d)\b/g, '') // Gender markers
            .trim();
    }

    // Jaccard Similarity (Token Overlap)
    // Returns 0 to 1
    private calculateSimilarity(str1: string, str2: string): number {
        const set1 = new Set(str1.split(/\s+/));
        const set2 = new Set(str2.split(/\s+/));

        const intersection = new Set([...set1].filter(x => set2.has(x)));
        const union = new Set([...set1, ...set2]);

        return intersection.size / union.size;
    }

    // --- Main Logic ---

    async findExistingApplication(data: ExtractedJobData, threadId?: string) {
        // 1. Thread ID (Absolute Link)
        if (threadId) {
            const byThread = await this.findByThreadId(threadId);
            if (byThread) return byThread;
        }

        const safeCompany = data.company || "";
        const safeRole = data.role || "";
        const safeJobId = data.jobId ? data.jobId.trim() : null;

        // 2. Job ID + Company (Strong Link)
        if (safeJobId && safeCompany) {
            // Try strict match on Job ID first
            const byJobId = await prisma.jobApplication.findFirst({
                where: {
                    jobId: safeJobId,
                    // Optional: stricter verification with company check
                    // company: { contains: safeCompany } 
                }
            });
            if (byJobId) return byJobId;
        }

        // 3. Domain Match (Medium-Strong Link)
        // If we have a domain, find jobs with same domain and check role similarity
        if (data.companyInfo?.domain) {
            const domainCandidates = await prisma.jobApplication.findMany({
                where: { companyDomain: data.companyInfo.domain }
            });

            // Check role similarity
            const match = domainCandidates.find(c => {
                const sim = this.calculateSimilarity(
                    this.cleanRoleTitle(c.role),
                    this.cleanRoleTitle(safeRole)
                );
                return sim > 0.6; // Threshold for "Software Engineer" vs "Senior Software Engineer" ~ 0.66
            });
            if (match) return match;
        }

        // 4. Fuzzy Name Match (Fallback)
        const cleanedInputCompany = this.cleanCompanyName(safeCompany);

        // Fetch candidates with somewhat matching company names to reduce in-memory processing
        const candidates = await prisma.jobApplication.findMany({
            where: {
                OR: [
                    { company: { contains: cleanedInputCompany } },
                    { company: { contains: safeCompany } }
                ]
            }
        });

        return candidates.find(c => {
            const dbCleanCompany = this.cleanCompanyName(c.company);
            const companyMatch = dbCleanCompany.includes(cleanedInputCompany) || cleanedInputCompany.includes(dbCleanCompany);

            if (!companyMatch) return false;

            // Check Role Similarity
            const roleSim = this.calculateSimilarity(
                this.cleanRoleTitle(c.role),
                this.cleanRoleTitle(safeRole)
            );

            return roleSim > 0.5; // Lower threshold if company matches well
        });
    }

    async createOrUpdateApplication(userId: string, data: ExtractedJobData, threadId?: string, source: string = 'GMAIL') {
        const existing = await this.findExistingApplication(data, threadId);

        if (existing) {
            console.log(`[JobService] Merging with existing job: ${existing.id} (${existing.company} - ${existing.role})`);

            // Smart Merge Logic
            return await prisma.jobApplication.update({
                where: { id: existing.id },
                data: {
                    status: data.status || existing.status,
                    lastUpdate: new Date(),
                    // Update rich data if missing or likely better?
                    // Prefer keeping existing valid data unless new data fills gaps
                    jobId: existing.jobId || data.jobId,
                    salaryRange: existing.salaryRange || (data.salary ? JSON.stringify(data.salary) : null),

                    // Domain enrichment
                    companyDomain: existing.companyDomain || data.companyInfo?.domain,
                    companyLinkedIn: existing.companyLinkedIn || data.companyInfo?.linkedIn,
                    jobPostUrl: existing.jobPostUrl || data.urls?.jobPost,

                    // Always append next steps if new one exists? Or replace? 
                    // Let's replace for now, maybe append in future logic
                    nextSteps: data.nextSteps || existing.nextSteps,

                    // People - merge or overwrite?
                    recruiterName: existing.recruiterName || data.people?.recruiterName,
                    recruiterEmail: existing.recruiterEmail || data.people?.recruiterEmail,
                    hiringManager: existing.hiringManager || data.people?.hiringManager,

                    sentimentScore: data.sentimentScore ?? existing.sentimentScore,
                }
            });
        }

        console.log(`[JobService] Creating new application: ${data.company} - ${data.role}`);

        return await prisma.jobApplication.create({
            data: {
                userId,
                company: data.company || "Unknown Company",
                role: data.role || "Unknown Role",
                jobId: data.jobId,
                status: data.status || "APPLIED",
                source: source,
                appliedDate: new Date(),
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

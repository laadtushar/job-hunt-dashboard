import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { ExtractedJobData, AIService } from './ai';
import { Normalizer } from '@/lib/normalize';
import { UrlUtils } from '@/lib/url';
import { EmbeddingService } from './embedding';

export class JobService {

    // --- Layer 1: Deterministic Identity ---

    async findByThreadId(threadId: string) {
        if (!threadId) return null;
        const log = await prisma.emailLog.findFirst({
            where: { threadId },
            include: { application: true }
        });
        return log?.application || null;
    }

    async findByJobId(jobId: string, company: string) {
        if (!jobId) return null;
        // Strict match on Job ID, ensuring company context is somewhat similar or strictly same
        // For now, assume Job ID is unique enough if we have it
        return await prisma.jobApplication.findFirst({
            where: {
                jobId: jobId,
                company: { contains: company } // Weak check to prevent cross-company ID collisions
            }
        });
    }

    // --- Layer 3: Heuristic Retrieval (Blocking) ---

    private async getCandidates(companyName: string, domain?: string): Promise<any[]> {
        const cleanName = Normalizer.cleanCompanyName(companyName);
        if (cleanName.length < 2 && !domain) return [];

        // Find jobs with matching domain OR similar company name
        // We fetch a bit more to let AI filter
        const candidates = await prisma.jobApplication.findMany({
            where: {
                OR: [
                    domain ? { companyDomain: domain } : {},
                    { company: { contains: cleanName } },
                    { company: { contains: companyName } }
                ],
                // Filter out very old jobs (e.g. > 180 days) to allow re-applications?
                // For now, let's keep all and let AI decide, or limit to 1 year
                updatedAt: { gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) }
            },
            take: 5,
            orderBy: { updatedAt: 'desc' }
        });

        return candidates;
    }

    // --- Main Logic ---

    async findExistingApplication(data: ExtractedJobData, threadId?: string, aiService?: AIService) {
        const { company, role, jobId, urls, companyInfo } = data;
        const cleanTitle = Normalizer.cleanJobTitle(role || "");

        // 1. Layer 1: Hard Links (Thread, JobID, Canonical URL)

        // A. Thread ID
        if (threadId) {
            const byThread = await this.findByThreadId(threadId);
            if (byThread) {
                console.log(`[JobService] L1 Match: Thread ID ${threadId}`);
                return byThread;
            }
        }

        // B. Job Reference ID
        if (jobId && company) {
            const byJobId = await this.findByJobId(jobId, company);
            if (byJobId) {
                console.log(`[JobService] L1 Match: Job ID ${jobId}`);
                return byJobId;
            }
        }

        // C. Clean URL Match (TODO: Add canonicalUrl field to DB to make this efficient)
        // For now, skip expensive full table scan for URLs. 

        // 2. Layer 2: Domain Identity (High Confidence)
        if (companyInfo?.domain && cleanTitle) {
            const domainMatch = await prisma.jobApplication.findFirst({
                where: {
                    companyDomain: companyInfo.domain,
                    // We don't have normalizedTitle in DB yet, so we fetch candidates and check in memory
                    // optimized by domain
                }
            });

            // If domain matches, check title strictness
            if (domainMatch) {
                // Checking if any job in this domain has the same normalized title
                // Actually, let's defer this to Layer 3/4 flow for simplicity
            }
        }

        // 3. Layer 3: Retrieval
        const candidates = await this.getCandidates(company || "", companyInfo?.domain);

        if (candidates.length === 0) return null;

        // 4. Layer 4: AI Judge
        if (aiService) {
            console.log(`[JobService] L3: Found ${candidates.length} candidates. Asking AI Judge...`);
            const matchId = await aiService.resolveIdentity(data, candidates);
            if (matchId) {
                return candidates.find(c => c.id === matchId) || null;
            }
        } else {
            // Fallback if no AI Service provided (shouldn't happen in sync flow)
            // Simple fallback: First candidate with same normalized title
            const manualMatch = candidates.find(c => Normalizer.cleanJobTitle(c.role) === cleanTitle);
            if (manualMatch) {
                console.log(`[JobService] Fallback Match: Normalized Title`);
                return manualMatch;
            }
        }

        return null; // Treated as new
    }

    async createOrUpdateApplication(userId: string, data: ExtractedJobData, threadId?: string, aiService?: AIService, source: string = 'GMAIL') {
        const existing = await this.findExistingApplication(data, threadId, aiService);
        let savedJob;

        if (existing) {
            console.log(`[JobService] Merging with existing job: ${existing.id} (${existing.company} - ${existing.role})`);

            // Merge Logic
            savedJob = await prisma.jobApplication.update({
                where: { id: existing.id },
                data: {
                    status: data.status || existing.status,
                    lastUpdate: new Date(),
                    // Prefer keeping existing strong data, add new if missing
                    jobId: existing.jobId || data.jobId,
                    salaryRange: existing.salaryRange || (data.salary ? JSON.stringify(data.salary) : null),
                    companyDomain: existing.companyDomain || data.companyInfo?.domain,
                    companyLinkedIn: existing.companyLinkedIn || data.companyInfo?.linkedIn,
                    jobPostUrl: existing.jobPostUrl || data.urls?.jobPost,
                    nextSteps: data.nextSteps || existing.nextSteps, // Overwrite next steps usually? Or keep old? Let's overwrite for latest context.
                    recruiterName: existing.recruiterName || data.people?.recruiterName,
                    recruiterEmail: existing.recruiterEmail || data.people?.recruiterEmail,
                    hiringManager: existing.hiringManager || data.people?.hiringManager,
                    sentimentScore: data.sentimentScore ?? existing.sentimentScore,
                    rejectionReason: data.rejectionReason || existing.rejectionReason,
                    feedback: data.feedback // Update feedback only if new one exists? 
                }
            });
        } else {
            console.log(`[JobService] Creating new application: ${data.company} - ${data.role}`);

            savedJob = await prisma.jobApplication.create({
                data: {
                    userId,
                    company: data.company || "Unknown Company",
                    role: data.role || "Unknown Role",
                    jobId: data.jobId,
                    status: data.status || "APPLIED",
                    source: source,
                    appliedDate: data.receivedDate ? new Date(data.receivedDate) : new Date(),
                    location: data.location,
                    salaryRange: data.salary ? JSON.stringify(data.salary) : null,
                    companyDomain: data.companyInfo?.domain,
                    companyLinkedIn: data.companyInfo?.linkedIn,
                    jobPostUrl: data.urls?.jobPost,
                    recruiterName: data.people?.recruiterName,
                    recruiterEmail: data.people?.recruiterEmail,
                    hiringManager: data.people?.hiringManager,
                    nextSteps: data.nextSteps,
                    rejectionReason: data.rejectionReason,
                    sentimentScore: data.sentimentScore,
                    feedback: data.feedback,
                }
            });
        }

        // --- Layer 5: Neural Indexing (RAG) ---
        try {
            const embeddingService = new EmbeddingService();
            const text = EmbeddingService.formatJobForEmbedding(savedJob);
            const vector = await embeddingService.embed(text);

            if (vector.length > 0) {
                console.log(`[JobService] Upserting embedding for job: ${savedJob.id}`);
                await prisma.$executeRaw`
                    INSERT INTO "JobEmbedding" ("id", "jobId", "vector", "content", "createdAt")
                    VALUES (gen_random_uuid(), ${savedJob.id}, ${vector}::vector, ${text}, NOW())
                    ON CONFLICT ("jobId") DO UPDATE SET "vector" = ${vector}::vector, "content" = ${text};
                `;
            }
        } catch (e) {
            console.error(`[JobService] Failed to generate embedding for job ${savedJob.id}:`, e);
        }

        return savedJob;
    }

    async updateJobStatus(jobId: string, newStatus: string) {
        const updatedJob = await prisma.jobApplication.update({
            where: { id: jobId },
            data: { status: newStatus, lastUpdate: new Date() }
        });

        // Refresh Embedding
        try {
            const embeddingService = new EmbeddingService();
            const text = EmbeddingService.formatJobForEmbedding(updatedJob);
            const vector = await embeddingService.embed(text);

            if (vector.length > 0) {
                console.log(`[JobService] Refreshing embedding for job: ${updatedJob.id} due to status change to ${newStatus}`);
                await prisma.$executeRaw`
                    INSERT INTO "JobEmbedding" ("id", "jobId", "vector", "content", "createdAt")
                    VALUES (gen_random_uuid(), ${updatedJob.id}, ${vector}::vector, ${text}, NOW())
                    ON CONFLICT ("jobId") DO UPDATE SET "vector" = ${vector}::vector, "content" = ${text};
                `;
            }
        } catch (e) {
            console.error(`[JobService] Failed to refresh embedding for job ${updatedJob.id}:`, e);
        }

        return updatedJob;
    }
}

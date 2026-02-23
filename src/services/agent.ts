
import prisma from '@/lib/prisma';
import { AIService } from './ai';
import { JobService } from './job';
import { GmailService } from './gmail';

export class AgentService {
    private ai: AIService;
    private jobService: JobService;

    constructor() {
        this.ai = new AIService();
        this.jobService = new JobService();
    }

    /**
     * Ghost Scan: Detect applications that have gone silent (no updates in 14+ days).
     */
    async ghostScan(userId: string) {
        const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
        const staleApps = await prisma.jobApplication.findMany({
            where: {
                userId,
                status: { in: ["APPLIED", "SCREEN"] },
                lastUpdate: { lt: fourteenDaysAgo }
            }
        });

        if (staleApps.length === 0) {
            return { message: "No stale applications found.", ghostedApps: [] };
        }

        const evaluations = await this.ai.detectGhostApplications(staleApps);
        const ghostedApps = evaluations.filter(e => e.isGhosted);

        if (ghostedApps.length > 0) {
            await prisma.agentAuditLog.create({
                data: {
                    userId,
                    type: "GHOST_DETECT",
                    payload: JSON.stringify({
                        evaluatedCount: staleApps.length,
                        ghostedCount: ghostedApps.length,
                        details: ghostedApps
                    }),
                    reflection: `Identified ${ghostedApps.length} potential ghosted applications from ${staleApps.length} stale ones.`,
                    status: "COMPLETED"
                }
            });
        }

        return {
            message: `Scanned ${staleApps.length} applications, found ${ghostedApps.length} potential ghosts.`,
            ghostedApps
        };
    }

    /**
     * Drift Scan: Re-evaluate recently ignored emails to find misclassified statuses.
     */
    async driftScan(userId: string) {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const ignoredEmails = await prisma.emailLog.findMany({
            where: {
                isIgnored: true,
                createdAt: { gte: sevenDaysAgo }
            },
            take: 20
        });

        const activeApps = await prisma.jobApplication.findMany({
            where: {
                userId,
                status: { notIn: ["REJECTED", "OFFER", "GHOSTED"] }
            }
        });

        const corrections: any[] = [];

        for (const email of ignoredEmails) {
            const candidateApp = activeApps.find(app =>
                (email.subject?.toLowerCase().includes(app.company.toLowerCase())) ||
                (email.sender?.toLowerCase().includes(app.company.toLowerCase()))
            );

            if (candidateApp) {
                const result = await this.ai.reClassifyEmail(email, candidateApp);
                if (result.shouldReclassify && result.newStatus && result.newStatus !== candidateApp.status) {
                    await this.jobService.updateJobStatus(candidateApp.id, result.newStatus);

                    await prisma.emailLog.update({
                        where: { id: email.id },
                        data: { isIgnored: false, applicationId: candidateApp.id }
                    });

                    corrections.push({
                        company: candidateApp.company,
                        oldStatus: candidateApp.status,
                        newStatus: result.newStatus,
                        reasoning: result.reasoning
                    });
                }
            }
        }

        if (corrections.length > 0) {
            await prisma.agentAuditLog.create({
                data: {
                    userId,
                    type: "DRIFT_CORRECT",
                    payload: JSON.stringify({ corrections }),
                    reflection: `Auto-corrected ${corrections.length} status drifts detected from recently ignored emails.`,
                    status: "COMPLETED"
                }
            });
        }

        return {
            message: `Scanned ${ignoredEmails.length} emails, made ${corrections.length} corrections.`,
            corrections
        };
    }

    /**
     * Duplicate Scan: Detect potential duplicate job applications using AI.
     */
    async duplicateScan(userId: string) {
        const activeApps = await prisma.jobApplication.findMany({
            where: {
                userId,
                status: { notIn: ["REJECTED", "GHOSTED"] }
            },
            take: 50
        });

        if (activeApps.length < 2) {
            return { message: "Not enough applications to find duplicates.", duplicates: [] };
        }

        const evaluations = await this.ai.detectDuplicates(activeApps);
        const potentialDuplicates = evaluations.filter(e => e.confidence > 0.6);

        if (potentialDuplicates.length > 0) {
            await prisma.agentAuditLog.create({
                data: {
                    userId,
                    type: "DUPLICATE_SCAN",
                    payload: JSON.stringify({
                        evaluatedCount: activeApps.length,
                        duplicateCount: potentialDuplicates.length,
                        details: potentialDuplicates
                    }),
                    reflection: `Found ${potentialDuplicates.length} potential duplicate application pairs across ${activeApps.length} active jobs.`,
                    status: "COMPLETED"
                }
            });
        }

        return {
            message: `Scanned ${activeApps.length} applications, found ${potentialDuplicates.length} potential duplicate pairs.`,
            duplicates: potentialDuplicates
        };
    }

    /**
     * Thread Watch: Find unanswered recruiter messages across active applications.
     */
    async threadWatch(userId: string, accessToken: string, refreshToken: string) {
        const activeApps = await prisma.jobApplication.findMany({
            where: {
                userId,
                status: { in: ["SCREEN", "INTERVIEW", "OFFER"] }
            },
            include: { emailLogs: { orderBy: { receivedDate: 'desc' }, take: 1 } }
        });

        const threadCandidates: any[] = [];

        for (const app of activeApps) {
            const lastLog = app.emailLogs[0];
            if (lastLog) {
                const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
                if (lastLog.receivedDate < oneDayAgo) {
                    threadCandidates.push({
                        company: app.company,
                        role: app.role,
                        lastSender: lastLog.sender,
                        lastDate: lastLog.receivedDate.toISOString(),
                        threadId: lastLog.threadId
                    });
                }
            }
        }

        if (threadCandidates.length === 0) {
            return { message: "No unanswered threads detected.", alerts: [] };
        }

        const alerts = await this.ai.assessUnansweredThreads(threadCandidates);

        if (alerts.length > 0) {
            await prisma.agentAuditLog.create({
                data: {
                    userId,
                    type: "THREAD_WATCH",
                    payload: JSON.stringify({ alerts }),
                    reflection: `Identified ${alerts.length} threads requiring user attention due to inactivity.`,
                    status: "COMPLETED"
                }
            });

            for (const alert of alerts) {
                if (alert.urgency === "URGENT" || alert.urgency === "HIGH") {
                    await prisma.task.create({
                        data: {
                            userId,
                            title: `Reply to ${alert.company}`,
                            description: `AI detected an unanswered message from ${alert.company} regarding the ${alert.role} role. Reasoning: ${alert.reasoning}`,
                            priority: alert.urgency,
                            category: "FOLLOW_UP",
                            source: "THREAD_WATCH"
                        }
                    });
                }
            }
        }

        return {
            message: `Scanned active threads, found ${alerts.length} needing attention.`,
            alerts
        };
    }

    /**
     * Get Learnings: Aggregate agent activity logs into an intelligence report.
     */
    async getLearnings(userId: string) {
        const searchLogs = await prisma.agentSearchLog.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 10
        });

        const auditLogs = await prisma.agentAuditLog.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 20
        });

        const stats = {
            totalSearches: searchLogs.length,
            ghostsDetected: auditLogs.filter(l => l.type === "GHOST_DETECT").length,
            driftsCorrected: auditLogs.filter(l => l.type === "DRIFT_CORRECT").length,
            duplicatesFound: auditLogs.filter(l => l.type === "DUPLICATE_SCAN").length,
            threadsFlagged: auditLogs.filter(l => l.type === "THREAD_WATCH").length
        };

        const recentLearnings = [
            ...searchLogs.map(l => ({ date: l.createdAt, category: "SEARCH", reflection: l.reflection })),
            ...auditLogs.map(l => ({ date: l.createdAt, category: l.type, reflection: l.reflection }))
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 15);

        return { stats, recentLearnings };
    }
}

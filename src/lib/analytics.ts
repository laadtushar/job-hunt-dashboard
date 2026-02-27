
import prisma from "@/lib/prisma";
import { auth } from "@/auth";

export async function getJobFunnelData() {
    const session = await auth();
    if (!session?.user?.id) return [];

    const statusCounts = await prisma.jobApplication.groupBy({
        by: ['status'],
        where: { userId: session.user.id },
        _count: { status: true },
    });

    // Normalize statuses to consistent casing if needed, but for now rely on DB
    // Standard JobStatus: APPLIED, SCREEN, INTERVIEW, OFFER, REJECTED, GHOSTED
    return statusCounts.map(item => ({
        status: item.status,
        count: item._count.status,
    }));
}

export async function getSankeyFunnelData() {
    const session = await auth();
    if (!session?.user?.id) return { nodes: [], links: [] };

    const applications = await prisma.jobApplication.findMany({
        where: { userId: session.user.id },
        select: { status: true, interviewDate: true, offerDeadline: true }
    });

    let applied = 0, screen = 0, interview = 0, offer = 0;
    let exitApplied = 0, exitScreen = 0, exitInterview = 0, exitOffer = 0;

    applications.forEach(app => {
        const status = app.status;
        const isExited = status === 'REJECTED' || status === 'GHOSTED';

        if (status === 'OFFER') {
            applied++; screen++; interview++; offer++;
        } else if (status === 'INTERVIEW') {
            applied++; screen++; interview++;
        } else if (status === 'SCREEN') {
            applied++; screen++;
        } else if (status === 'APPLIED') {
            applied++;
        } else if (isExited) {
            if (app.offerDeadline) {
                applied++; screen++; interview++; offer++; exitOffer++;
            } else if (app.interviewDate) {
                applied++; screen++; interview++; exitInterview++;
            } else {
                applied++; exitApplied++; // Or maybe they exited after screen, but we don't have a screenDate. We'll be conservative.
            }
        }
    });

    const nodes = [
        { name: 'Applications', color: '#6366f1' },       // 0: Indigo-500
        { name: 'Screen', color: '#3b82f6' },             // 1: Blue-500
        { name: 'Interview', color: '#8b5cf6' },          // 2: Violet-500
        { name: 'Offer', color: '#eab308' },              // 3: Yellow-500
        { name: 'Exited', color: '#ef4444' },             // 4: Red-500
        { name: 'Active/No Response', color: '#94a3b8' }, // 5: Slate-400
    ];

    // Calculate currently active at each stage
    const activeApplied = applied - screen - exitApplied;
    const activeScreen = screen - interview - exitScreen;
    const activeInterview = interview - offer - exitInterview;
    const activeOffer = offer - exitOffer; // Assuming an offer is active until accepted/rejected, but we don't track accepted yet.

    const links = [
        // Progression
        { source: 0, target: 1, value: screen },
        { source: 1, target: 2, value: interview },
        { source: 2, target: 3, value: offer },

        // Exits
        { source: 0, target: 4, value: exitApplied },
        { source: 1, target: 4, value: exitScreen },
        { source: 2, target: 4, value: exitInterview },
        { source: 3, target: 4, value: exitOffer },

        // Active / No Response
        { source: 0, target: 5, value: activeApplied },
        { source: 1, target: 5, value: activeScreen },
        { source: 2, target: 5, value: activeInterview },
        { source: 3, target: 5, value: activeOffer },
    ].filter(l => l.value > 0);

    return { nodes, links };
}

export async function getApplicationActivity() {
    const session = await auth();
    if (!session?.user?.id) return [];

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const applications = await prisma.jobApplication.findMany({
        where: {
            userId: session.user.id,
            appliedDate: { gte: thirtyDaysAgo },
        },
        select: { appliedDate: true },
    });

    // Aggregate by date (YYYY-MM-DD)
    const activityMap = new Map<string, number>();
    applications.forEach(app => {
        // Handle potentially null appliedDate (though schema says default now())
        const date = (app.appliedDate || new Date()).toISOString().split('T')[0];
        activityMap.set(date, (activityMap.get(date) || 0) + 1);
    });

    // Fill in missing dates
    const result = [];
    for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        result.push({
            date: dateStr,
            count: activityMap.get(dateStr) || 0,
        });
    }

    return result;
}

export async function getKeyMetrics() {
    const funnelData = await getJobFunnelData();

    const total = funnelData.reduce((acc, curr) => acc + curr.count, 0);
    const interviews = funnelData.find(d => d.status === 'INTERVIEW')?.count || 0;
    const offers = funnelData.find(d => d.status === 'OFFER')?.count || 0;
    const screens = funnelData.find(d => d.status === 'SCREEN')?.count || 0;

    // simplistic funnel for now
    const interviewRate = total > 0 ? (interviews / total) * 100 : 0;
    const offerRate = interviews > 0 ? (offers / interviews) * 100 : 0;

    return {
        totalApplications: total,
        interviewRate: interviewRate.toFixed(1),
        offerRate: offerRate.toFixed(1),
        activeProcesses: (interviews + screens),
    };
}

export async function getSourceDistribution() {
    const session = await auth();
    if (!session?.user?.id) return [];

    const sourceCounts = await prisma.jobApplication.groupBy({
        by: ['source'],
        where: { userId: session.user.id },
        _count: { source: true },
    });

    return sourceCounts.map(item => ({
        source: item.source || "UNKNOWN",
        count: item._count.source,
    }));
}

export async function getMomentumScore() {
    const session = await auth();
    if (!session?.user?.id) return { score: 0, streak: 0, trend: 'cold' };

    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const applications = await prisma.jobApplication.findMany({
        where: {
            userId: session.user.id,
            lastUpdate: { gte: fourteenDaysAgo },
        },
        select: { status: true }
    });

    let score = 0;
    applications.forEach(app => {
        score += 10; // Base points for recent activity
        if (app.status === 'SCREEN') score += 50;
        if (app.status === 'INTERVIEW') score += 100;
        if (app.status === 'OFFER') score += 300;
    });

    // Proxy for streak based on score velocity
    const streak = Math.floor(score / 50);

    return {
        score,
        streak: streak > 14 ? 14 : streak,
        trend: score > 200 ? 'hot' : score > 50 ? 'warm' : 'cold'
    };
}

export async function getSalaryHeatmapData() {
    const session = await auth();
    if (!session?.user?.id) return [];

    const applications = await prisma.jobApplication.findMany({
        where: {
            userId: session.user.id,
            salaryMin: { not: null }
        },
        select: {
            id: true,
            company: true,
            role: true,
            status: true,
            salaryMin: true,
            salaryMax: true,
        }
    });

    const data = applications.filter(app => app.salaryMin).map(app => {
        const min = app.salaryMin || 0;
        const max = app.salaryMax || min;
        const avg = (min + max) / 2;

        return {
            id: app.id,
            company: app.company,
            role: app.role,
            status: app.status,
            min,
            max,
            avg
        }
    });

    return data;
}

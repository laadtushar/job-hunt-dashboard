
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

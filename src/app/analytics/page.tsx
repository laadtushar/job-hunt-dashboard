
import { auth } from "@/auth";
import { getApplicationActivity, getJobFunnelData, getKeyMetrics } from "@/lib/analytics";
import { ActivityChart } from "@/components/analytics/ActivityChart";
import { SankeyChart } from "@/components/analytics/SankeyChart";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import { ArrowLeft, TrendingUp, Users, CheckCircle, Clock } from "lucide-react";
import Link from "next/link";

export default async function AnalyticsPage() {
    const session = await auth();
    if (!session?.user) redirect("/");

    const [funnelData, activityData, metrics] = await Promise.all([
        getJobFunnelData(),
        getApplicationActivity(),
        getKeyMetrics(),
    ]);

    // Transform Funnel Data for Sankey
    const getCount = (status: string) => funnelData.find(d => d.status === status)?.count || 0;

    const applied = getCount('APPLIED');
    const ghosted = getCount('GHOSTED');
    const rejected = getCount('REJECTED');
    const screen = getCount('SCREEN');
    const interview = getCount('INTERVIEW');
    const offer = getCount('OFFER');

    const noResponse = applied + ghosted;
    const active = screen + interview + offer;
    const total = noResponse + active + rejected;

    // Nodes
    // 0: Applications, 1: No Response, 2: Active Process, 3: Rejected
    // 4: Screen, 5: Interview, 6: Offer
    const nodes = [
        { name: 'Applications', color: '#6366f1' },       // Indigo-500
        { name: 'No Response', color: '#94a3b8' },        // Slate-400
        { name: 'Active', color: '#22c55e' },             // Green-500
        { name: 'Rejected', color: '#ef4444' },           // Red-500
        { name: 'Screen', color: '#3b82f6' },             // Blue-500
        { name: 'Interview', color: '#8b5cf6' },          // Violet-500
        { name: 'Offer', color: '#eab308' },              // Yellow-500
    ];

    const links = [
        { source: 0, target: 1, value: noResponse },
        { source: 0, target: 2, value: active },
        { source: 0, target: 3, value: rejected },
        { source: 2, target: 4, value: screen },
        { source: 2, target: 5, value: interview },
        { source: 2, target: 6, value: offer },
    ].filter(l => l.value > 0);

    // If total is 0, provide dummy data or empty state handled by component,
    // but filtering logic above handles zero values somewhat.
    // If 'active' is 0, links from 2->X will be empty, which is correct.

    const sankeyData = { nodes, links };


    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-8">
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/" className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
                        <ArrowLeft className="h-6 w-6 text-slate-500" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Analytics Dashboard</h1>
                        <p className="text-slate-500 dark:text-slate-400">Insights into your job hunt performance</p>
                    </div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{metrics.totalApplications}</div>
                            <p className="text-xs text-muted-foreground">All time tracked</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active Processes</CardTitle>
                            <Clock className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{metrics.activeProcesses}</div>
                            <p className="text-xs text-muted-foreground">Screening or Interviewing</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Interview Rate</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{metrics.interviewRate}%</div>
                            <p className="text-xs text-muted-foreground">Applications to Interview</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Offer Rate</CardTitle>
                            <CheckCircle className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{metrics.offerRate}%</div>
                            <p className="text-xs text-muted-foreground">Interviews to Offer</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Activity Chart */}
                    <Card className="col-span-1 lg:col-span-1">
                        <CardHeader>
                            <CardTitle>Application Activity</CardTitle>
                            <CardDescription>Applications sent over the last 30 days</CardDescription>
                        </CardHeader>
                        <CardContent className="pl-0">
                            <ActivityChart data={activityData} />
                        </CardContent>
                    </Card>

                    {/* Funnel / Sankey */}
                    <Card className="col-span-1 lg:col-span-1">
                        <CardHeader>
                            <CardTitle>Job Hunt Funnel</CardTitle>
                            <CardDescription>Flow of applications through different stages</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <SankeyChart data={sankeyData} />
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}

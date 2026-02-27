
import { auth } from "@/auth";
import { getApplicationActivity, getJobFunnelData, getKeyMetrics, getSourceDistribution, getSankeyFunnelData, getSalaryHeatmapData } from "@/lib/analytics";
import { ActivityChart } from "@/components/analytics/ActivityChart";
import { SankeyChart } from "@/components/analytics/SankeyChart";
import { StatusDistributionChart } from "@/components/analytics/StatusDistributionChart";
import { SourceBreakdownChart } from "@/components/analytics/SourceBreakdownChart";
import { SalaryHeatmap } from "@/components/analytics/SalaryHeatmap";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import { ArrowLeft, TrendingUp, Users, CheckCircle, Clock } from "lucide-react";
import Link from "next/link";

export default async function AnalyticsPage() {
    const session = await auth();
    if (!session?.user) redirect("/");

    const [funnelData, sankeyData, activityData, metrics, sourceData, heatmapData] = await Promise.all([
        getJobFunnelData(),
        getSankeyFunnelData(),
        getApplicationActivity(),
        getKeyMetrics(),
        getSourceDistribution(),
        getSalaryHeatmapData()
    ]);

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
                    {[
                        { title: "Total Applications", value: metrics.totalApplications, sub: "All time tracked", icon: Users },
                        { title: "Active Processes", value: metrics.activeProcesses, sub: "In Screening/Interview", icon: Clock },
                        { title: "Interview Rate", value: `${metrics.interviewRate}%`, sub: "Applications to Interview", icon: TrendingUp },
                        { title: "Offer Rate", value: `${metrics.offerRate}%`, sub: "Interviews to Offer", icon: CheckCircle },
                    ].map((m, i) => (
                        <Card key={i} className="border-none shadow-xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm rounded-3xl overflow-hidden group">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-[10px] font-black tracking-widest uppercase text-slate-400">{m.title}</CardTitle>
                                <m.icon className="h-4 w-4 text-slate-300 group-hover:text-primary transition-colors" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-black tracking-tighter">{m.value}</div>
                                <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold tracking-tight">{m.sub}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Activity Chart */}
                    <Card className="col-span-1 border-none shadow-xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm rounded-3xl">
                        <CardHeader>
                            <CardTitle>Application Activity</CardTitle>
                            <CardDescription>Applications sent over the last 30 days</CardDescription>
                        </CardHeader>
                        <CardContent className="pl-0">
                            <ActivityChart data={activityData} />
                        </CardContent>
                    </Card>

                    {/* Funnel / Sankey */}
                    <Card className="col-span-1 border-none shadow-xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm rounded-3xl">
                        <CardHeader>
                            <CardTitle>Job Hunt Funnel</CardTitle>
                            <CardDescription>Flow of applications through different stages</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <SankeyChart data={sankeyData} />
                        </CardContent>
                    </Card>

                    {/* Status Distribution (Pie) */}
                    <Card className="col-span-1 border-none shadow-xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm rounded-3xl">
                        <CardHeader>
                            <CardTitle>Status Distribution</CardTitle>
                            <CardDescription>Current state of all applications</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <StatusDistributionChart data={funnelData} />
                        </CardContent>
                    </Card>

                    {/* Source Breakdown (Bar) */}
                    <Card className="col-span-1 border-none shadow-xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm rounded-3xl">
                        <CardHeader>
                            <CardTitle>Source Breakdown</CardTitle>
                            <CardDescription>Where your applications are coming from</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <SourceBreakdownChart data={sourceData} />
                        </CardContent>
                    </Card>

                    {/* Salary Heatmap */}
                    <SalaryHeatmap data={heatmapData} />
                </div>
            </main>
        </div>
    );
}

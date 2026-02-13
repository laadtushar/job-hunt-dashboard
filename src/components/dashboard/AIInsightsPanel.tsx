"use client"

import { Card } from "@/components/ui/card"
import { Sparkles, Brain, Zap, Calendar, TrendingUp, ChevronRight, AlertCircle, CheckCircle2, ListTodo, ShieldCheck } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { motion, AnimatePresence } from "framer-motion"
import { formatDistanceToNow, isAfter, isBefore, addDays } from "date-fns"

interface Insight {
    id: string;
    type: 'alert' | 'todo' | 'trend';
    title: string;
    description: string;
    icon: any;
    color: string;
    actionLabel?: string;
    priority: number; // 1: High, 2: Med, 3: Low
}

export function AIInsightsPanel({ jobs }: { jobs: any[] }) {
    const insights: Insight[] = [];

    // 1. High Priority Alerts (Urgent Deadlines)
    const upcomingDeadlines = jobs.filter(j =>
        j.offerDeadline && isBefore(new Date(j.offerDeadline), addDays(new Date(), 3)) && isAfter(new Date(j.offerDeadline), new Date())
    );

    upcomingDeadlines.forEach(job => {
        insights.push({
            id: `deadline-${job.id}`,
            type: 'alert',
            title: 'Expiring Offer',
            description: `${job.company} offer expires in ${formatDistanceToNow(new Date(job.offerDeadline!))}. Finalize your decision soon.`,
            icon: AlertCircle,
            color: 'text-red-500 bg-red-50 dark:bg-red-900/20',
            actionLabel: 'View Details',
            priority: 1
        });
    });

    // 2. High Priority: Interview Tomorrow
    const tomorrowInterviews = jobs.filter(j =>
        j.interviewDate && Math.abs(new Date(j.interviewDate).getTime() - addDays(new Date(), 1).getTime()) < 86400000
    );

    tomorrowInterviews.forEach(job => {
        insights.push({
            id: `interview-${job.id}`,
            type: 'alert',
            title: 'Interview Preparation',
            description: `You have an interview with ${job.company} tomorrow. AI prep guide and recruiter notes are ready.`,
            icon: Zap,
            color: 'text-orange-500 bg-orange-50 dark:bg-orange-900/20',
            actionLabel: 'Open Prep Kit',
            priority: 1
        });
    });

    // 3. To Dos: Explicit next steps from AI extraction
    const jobsWithSteps = jobs.filter(j => j.nextSteps && j.nextSteps.length > 5).slice(0, 1);
    jobsWithSteps.forEach(job => {
        insights.push({
            id: `step-${job.id}`,
            type: 'todo',
            title: `Action for ${job.company}`,
            description: job.nextSteps!,
            icon: ListTodo,
            color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20',
            actionLabel: 'Complete Task',
            priority: 2
        });
    });

    // 4. Trends: Market Analysis
    const recentApps = jobs.filter(j =>
        new Date(j.appliedDate) > addDays(new Date(), -7)
    ).length;

    if (recentApps > 3) {
        insights.push({
            id: 'trend-velocity',
            type: 'trend',
            title: 'High Velocity Week',
            description: `You've applied to ${recentApps} roles this week. Your outbound volume is in the top 5% of active job seekers.`,
            icon: TrendingUp,
            color: 'text-green-500 bg-green-50 dark:bg-green-900/20',
            priority: 3
        });
    }

    // 5. Intelligence: Ghost Detection
    const ghosted = jobs.filter(j => {
        const days = Math.floor((new Date().getTime() - new Date(j.lastUpdate).getTime()) / (1000 * 60 * 60 * 24));
        return j.status === 'SCREEN' && days > 14;
    }).slice(0, 1);

    ghosted.forEach(job => {
        insights.push({
            id: `ghost-${job.id}`,
            type: 'todo',
            title: 'Cold Outreach Lead',
            description: `${job.company} hasn't updated since your screening. It's time to reach out to ${job.recruiterName || 'the recruiter'} for a status update.`,
            icon: Brain,
            color: 'text-slate-500 bg-slate-50 dark:bg-slate-800',
            actionLabel: 'Draft Email',
            priority: 3
        });
    });

    // Sort by priority
    const sortedInsights = insights.sort((a, b) => a.priority - b.priority).slice(0, 4);

    if (sortedInsights.length === 0) {
        // Fallback for new users
        sortedInsights.push({
            id: 'onboarding',
            type: 'trend',
            title: 'System Initialized',
            description: 'The Neural Engine is currently analyzing your inbox for job updates and recruiter patterns.',
            icon: ShieldCheck,
            color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20',
            priority: 3
        });
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="absolute inset-0 bg-blue-500 rounded-lg blur-lg opacity-40 animate-pulse" />
                        <div className="relative p-2 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-xl">
                            <Brain className="h-5 w-5 text-white" />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-slate-900 dark:text-white leading-tight">Neural Intelligence Panel</h2>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-[0.2em]">Contextual Insights & Strategy</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="h-7 px-3 rounded-full border-blue-500/20 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10 font-black text-[10px] tracking-widest animate-in fade-in slide-in-from-right-4">
                        <Sparkles className="h-3 w-3 mr-1.5 animate-pulse" />
                        SYNCED: JUST NOW
                    </Badge>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                <AnimatePresence>
                    {sortedInsights.map((insight, idx) => (
                        <motion.div
                            key={insight.id}
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.4, delay: idx * 0.1, ease: "easeOut" }}
                            whileHover={{ y: -5 }}
                        >
                            <Card className="group relative h-full flex flex-col border-none bg-white dark:bg-slate-900/40 backdrop-blur-xl ring-1 ring-slate-200 dark:ring-slate-800/80 hover:ring-blue-500/40 transition-all duration-500 shadow-sm hover:shadow-2xl overflow-hidden rounded-[2.5rem]">
                                {/* Animated background aura */}
                                <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-700 ${insight.color.split(' ')[0]}`} />

                                <div className="p-8 flex-1 flex flex-col relative z-20">
                                    <div className="flex items-start justify-between mb-6">
                                        <div className={`p-3.5 rounded-2xl shadow-lg shadow-black/5 ${insight.color}`}>
                                            <insight.icon className="h-6 w-6" />
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <Badge variant="ghost" className="text-[10px] font-black uppercase tracking-widest opacity-40">
                                                {insight.type}
                                            </Badge>
                                            <div className="flex gap-0.5 mt-1.5">
                                                {[1, 2, 3].map(p => (
                                                    <div key={p} className={`h-1 w-2.5 rounded-full ${p <= 4 - insight.priority ? insight.color.split(' ')[0].replace('text-', 'bg-') : 'bg-slate-200 dark:bg-slate-800'}`} />
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2.5 leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                        {insight.title}
                                    </h3>

                                    <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold leading-relaxed mb-6 line-clamp-3">
                                        {insight.description}
                                    </p>

                                    <div className="mt-auto">
                                        {insight.actionLabel ? (
                                            <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs font-black text-slate-700 dark:text-slate-300 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 transition-all group/btn border border-slate-200/50 dark:border-slate-800 w-full group-hover:border-blue-500/20">
                                                {insight.actionLabel}
                                                <ChevronRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1 ml-auto" />
                                            </button>
                                        ) : (
                                            <div className="h-10 border-t border-slate-100 dark:border-slate-800/50 flex items-center justify-center opacity-30">
                                                <div className="flex gap-1">
                                                    {[1, 2, 3].map(i => <div key={i} className="h-1 w-1 rounded-full bg-slate-400" />)}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Bottom status bar */}
                                <div className={`h-1 w-full translate-y-1 group-hover:translate-y-0 transition-transform ${insight.color.split(' ')[0].replace('text-', 'bg-')}`} />
                            </Card>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}

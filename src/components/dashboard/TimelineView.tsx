"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { format, parseISO } from "date-fns";
import { Clock, Briefcase, ChevronRight, CheckCircle2, XCircle } from "lucide-react";
import { Normalizer } from "@/lib/normalize";
import { JobDetailsDialog } from "@/components/dashboard/JobDetailsDialog";

export function TimelineView({ jobs }: { jobs: any[] }) {
    // Sort jobs backwards (oldest to newest) to show a left-to-right progression
    const sortedJobs = useMemo(() => {
        return [...jobs].sort((a, b) => new Date(a.appliedDate).getTime() - new Date(b.appliedDate).getTime());
    }, [jobs]);

    // Group by Month-Year
    const groups = useMemo(() => {
        const result: { [key: string]: any[] } = {};
        sortedJobs.forEach(job => {
            const dateStr = format(parseISO(job.appliedDate), "MMMM yyyy");
            if (!result[dateStr]) result[dateStr] = [];
            result[dateStr].push(job);
        });
        return result;
    }, [sortedJobs]);

    const getStatusStyles = (s: string) => {
        switch (s) {
            case 'OFFER': return 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.5)]';
            case 'INTERVIEW': return 'bg-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.5)]';
            case 'REJECTED': return 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]';
            case 'SCREEN': return 'bg-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.5)]';
            case 'GHOSTED': return 'bg-slate-500 shrink-0 opacity-50';
            default: return 'bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]';
        }
    }

    if (jobs.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-white/40 dark:bg-slate-900/40 rounded-3xl border border-slate-200/60 dark:border-slate-800/60">
                <Clock className="h-12 w-12 text-slate-300 mb-4" />
                <p className="text-slate-500 font-medium">No timeline data available.</p>
            </div>
        )
    }

    return (
        <div className="bg-white/40 dark:bg-slate-900/40 p-8 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 shadow-inner overflow-x-auto custom-scrollbar">
            <div className="inline-flex min-w-full pb-8 pt-4">
                <div className="flex flex-row gap-12 items-start relative pb-12">
                    {/* The continuous connecting line running horizontally */}
                    <div className="absolute top-[38px] left-[100px] right-[100px] h-1 bg-gradient-to-r from-slate-200 via-blue-200 to-slate-200 dark:from-slate-800 dark:via-blue-900 dark:to-slate-800 z-0 rounded-full" />

                    {Object.entries(groups).map(([monthStr, monthJobs], mIdx) => (
                        <div key={monthStr} className="flex flex-col items-center z-10">

                            {/* Month Label */}
                            <div className="mb-10 px-4 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] rounded-full border border-slate-200/50 dark:border-slate-700/50 shrink-0">
                                {monthStr}
                            </div>

                            <div className="flex flex-row gap-12">
                                {monthJobs.map((job, jIdx) => (
                                    <div key={job.id} className="relative group flex flex-col items-center w-32 shrink-0">

                                        {/* Status Node */}
                                        <div className="relative z-10 shrink-0 mb-6">
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 transition-all duration-300 group-hover:scale-125 ${getStatusStyles(job.status)}`}>
                                                {job.status === 'OFFER' && <CheckCircle2 className="h-3 w-3 text-white" />}
                                                {job.status === 'REJECTED' && <XCircle className="h-3 w-3 text-white" />}
                                            </div>
                                        </div>

                                        {/* Job Glassmorphic Card */}
                                        <JobDetailsDialog job={job}>
                                            <motion.div
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: (mIdx * 0.1) + (jIdx * 0.05) }}
                                                className="w-[180px] cursor-pointer bg-white/70 dark:bg-slate-800/70 backdrop-blur-md rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 flex flex-col items-center text-center"
                                            >
                                                <div className="h-10 w-10 mb-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-1.5 flex items-center justify-center shadow-sm">
                                                    <img
                                                        src={`https://img.logo.dev/name/${encodeURIComponent(Normalizer.cleanCompanyName(job.company))}?token=${process.env.NEXT_PUBLIC_LOGO_DEV_TOKEN}`}
                                                        alt=""
                                                        className="h-full w-full object-contain filter dark:brightness-95"
                                                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                                    />
                                                </div>
                                                <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate w-full group-hover:text-blue-600 transition-colors">
                                                    {job.company}
                                                </h3>
                                                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 truncate w-full mt-0.5">
                                                    {job.role}
                                                </p>
                                                <div className="mt-3 text-[10px] font-bold text-slate-400 tracking-wider">
                                                    {format(parseISO(job.appliedDate), "MMM dd")}
                                                </div>
                                            </motion.div>
                                        </JobDetailsDialog>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

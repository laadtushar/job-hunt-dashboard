"use client"

import { Normalizer } from "@/lib/normalize"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, MapPin, DollarSign, Calendar, Trash2, RefreshCw, AlertCircle, Clock, Sparkles } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { JobDetailsDialog } from "./JobDetailsDialog"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface JobCardProps {
    job: any;
}

export function JobCard({ job }: JobCardProps) {
    const router = useRouter();
    const [isIgnored, setIsIgnored] = useState(false);
    const [isReanalyzing, setIsReanalyzing] = useState(false);
    const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
    const [feedback, setFeedback] = useState("");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const status = job.status || "APPLIED";
    const daysSinceUpdate = Math.floor((new Date().getTime() - new Date(job.lastUpdate).getTime()) / (1000 * 60 * 60 * 24));
    const isStale = daysSinceUpdate > 14 && ['APPLIED', 'SCREEN'].includes(status);

    const getStatusStyles = (s: string) => {
        switch (s) {
            case 'OFFER': return 'bg-green-100/50 dark:bg-green-900/30 text-green-700 dark:text-green-400 ring-green-500/20';
            case 'INTERVIEW': return 'bg-orange-100/50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 ring-orange-500/20';
            case 'REJECTED': return 'bg-red-100/50 dark:bg-red-900/30 text-red-700 dark:text-red-400 ring-red-500/20';
            case 'SCREEN': return 'bg-purple-100/50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 ring-purple-500/20';
            case 'GHOSTED': return 'bg-slate-100 dark:bg-slate-800 text-slate-500 ring-slate-400/20';
            default: return 'bg-blue-100/50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 ring-blue-500/20';
        }
    }

    const handleIgnore = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!confirm("Are you sure this is not a job? This will delete the entry and mark emails as invalid.")) return;
        try {
            setIsIgnored(true);
            await fetch('/api/feedback/ignore', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ applicationId: job.id })
            });
            router.refresh();
        } catch (error) {
            console.error(error);
            setIsIgnored(false);
        }
    };

    const handleIgnoreOffer = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!confirm("Ignore this offer? It will be hidden from your active list.")) return;
        try {
            setIsIgnored(true);
            await fetch(`/api/jobs/${job.id}/ignore`, {
                method: 'POST'
            });
            router.refresh();
        } catch (error) {
            console.error(error);
            setIsIgnored(false);
        }
    };

    const handleReanalyze = async (e?: React.MouseEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        try {
            setIsReanalyzing(true);
            // Don't close immediately so user sees "Scanning..." if we have a state for it
            await fetch(`/api/jobs/${job.id}/reanalyze`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ feedback })
            });
            setIsFeedbackOpen(false);
            router.refresh();
        } catch (err) {
            console.error(err);
        } finally {
            setIsReanalyzing(false);
            setFeedback("");
        }
    };

    const onOpenFeedback = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsFeedbackOpen(true);
    };

    if (isIgnored) return null;

    return (
        <>
            <Dialog open={isFeedbackOpen} onOpenChange={setIsFeedbackOpen}>
                <DialogContent className="sm:max-w-md rounded-3xl cursor-default" onClick={(e) => e.stopPropagation()}>
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">Improve Data Accuracy</DialogTitle>
                        <DialogDescription>
                            Deep-scanning your inbox for updates. Add a hint to help the AI.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-2">
                        <Textarea
                            placeholder="e.g. 'Got an interview invite today' or 'Salary is $120k'"
                            className="rounded-2xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:ring-blue-500/20"
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                        />
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="ghost" className="rounded-xl" onClick={() => setIsFeedbackOpen(false)}>Cancel</Button>
                        <Button className="rounded-xl bg-blue-600 hover:bg-blue-700" onClick={handleReanalyze} disabled={isReanalyzing}>
                            {isReanalyzing ? "Scanning..." : "Sync Updates"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <JobDetailsDialog job={job}>
                <Card className={`group relative transition-all duration-500 cursor-pointer border-none ring-1 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-1 overflow-hidden ${status === 'OFFER' ? 'bg-gradient-to-br from-white to-green-50/20 dark:from-slate-900 dark:to-green-950/10 ring-green-500/20' :
                    status === 'INTERVIEW' ? 'bg-gradient-to-br from-white to-orange-50/20 dark:from-slate-900 dark:to-orange-950/10 ring-orange-500/20' :
                        status === 'REJECTED' ? 'bg-gradient-to-br from-white to-red-50/20 dark:from-slate-900 dark:to-red-950/10 ring-red-500/20' :
                            'bg-white dark:bg-slate-900/40 backdrop-blur-sm ring-slate-200/60 dark:ring-slate-800/60'
                    }`}>
                    <div className={`absolute top-0 left-0 w-1.5 h-full transition-all duration-500 group-hover:w-2 ${status === 'OFFER' ? 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)]' :
                        status === 'INTERVIEW' ? 'bg-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.3)]' :
                            status === 'REJECTED' ? 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]' :
                                'bg-blue-600 opacity-0 group-hover:opacity-100'
                        }`} />

                    <CardHeader className="flex flex-row items-center justify-between space-y-0 p-6 pb-2">
                        <div className="flex gap-4 min-w-0">
                            <div className="relative shrink-0 transition-transform group-hover:scale-105 duration-500">
                                <div className="h-14 w-14 rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-50 dark:border-slate-800 p-2 flex items-center justify-center shadow-sm overflow-hidden ring-1 ring-slate-200/20 dark:ring-white/5">
                                    <img
                                        src={`https://img.logo.dev/name/${encodeURIComponent(Normalizer.cleanCompanyName(job.company))}?token=${process.env.NEXT_PUBLIC_LOGO_DEV_TOKEN}`}
                                        alt=""
                                        className="h-full w-full object-contain filter dark:brightness-95"
                                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                    />
                                    <span className="absolute text-xl font-black text-slate-200 dark:text-slate-700 -z-10">{job.company[0]}</span>
                                </div>
                                {job.source === 'GMAIL' && (
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div className="absolute -bottom-1.5 -right-1.5 h-6 w-6 rounded-full bg-white dark:bg-slate-900 flex items-center justify-center shadow-lg ring-2 ring-white dark:ring-slate-900 cursor-help">
                                                    <Mail className="h-3 w-3 text-red-500" />
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent className="rounded-xl font-bold text-[10px] uppercase tracking-widest bg-slate-900 border-slate-800 text-white px-3 py-1.5 shadow-2xl">
                                                Synced from Gmail
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                )}
                            </div>
                            <div className="min-w-0 pt-1">
                                <CardTitle className="text-xl font-bold truncate text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                    {job.company}
                                </CardTitle>
                                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                    {job.role}
                                </p>
                            </div>
                        </div>
                        {isStale && (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="h-8 w-8 rounded-full bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center animate-in fade-in zoom-in cursor-help">
                                            <AlertCircle className="h-4 w-4 text-amber-500" />
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent className="rounded-xl font-bold text-xs bg-amber-600 text-white border-none px-3 py-1.5 shadow-xl">
                                        Stale: No activity for 14+ days
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}
                    </CardHeader>

                    <CardContent className="px-6 pb-6 pt-4">
                        <div className="flex flex-wrap gap-2 mb-6">
                            {status === 'REJECTED' && job.rejectionReason ? (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <span className={`px-4 py-1.5 rounded-xl text-[11px] font-bold tracking-tight ring-1 cursor-help ${getStatusStyles(status)}`}>
                                                {status}
                                            </span>
                                        </TooltipTrigger>
                                        <TooltipContent className="rounded-xl font-bold text-xs bg-red-600 text-white border-none px-3 py-1.5 shadow-xl max-w-[200px]">
                                            {job.rejectionReason}
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            ) : (
                                <span className={`px-4 py-1.5 rounded-xl text-[11px] font-bold tracking-tight ring-1 ${getStatusStyles(status)}`}>
                                    {status}
                                </span>
                            )}
                            {job.location && (
                                <span className="px-4 py-1.5 rounded-xl text-[11px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100/50 dark:bg-slate-800/80 ring-1 ring-slate-200 dark:ring-slate-700">
                                    {job.location}
                                </span>
                            )}
                        </div>
                        {status === 'OFFER' && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full h-10 rounded-xl border-green-500/30 text-green-600 dark:text-green-400 bg-green-50/50 dark:bg-green-900/10 font-bold text-xs hover:bg-green-600 hover:text-white transition-all shadow-sm mb-4"
                                onClick={handleIgnoreOffer}
                            >
                                <Trash2 className="h-3.5 w-3.5 mr-2" />
                                IGNORE THIS OFFER
                            </Button>
                        )}

                        <div className="flex items-center justify-between pt-5 border-t border-slate-100 dark:border-slate-800/80">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
                                    <Clock className="h-3.5 w-3.5" />
                                    <span className="text-xs font-bold tabular-nums">
                                        {daysSinceUpdate === 0 ? 'Today' : `${daysSinceUpdate}d ago`}
                                    </span>
                                </div>
                                {job.salaryRange && (() => {
                                    try {
                                        // Handle cases where salaryRange might be stored as a JSON string from AI extraction
                                        if (job.salaryRange.startsWith('{')) {
                                            const parsed = JSON.parse(job.salaryRange);
                                            // Format as "Min - Max" if available, else skip JSON dump
                                            if (parsed.min || parsed.max) {
                                                const label = parsed.min && parsed.max
                                                    ? `${parsed.min}-${parsed.max}`
                                                    : parsed.min || parsed.max;
                                                return (
                                                    <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                                                        <DollarSign className="h-3.5 w-3.5 text-green-500" />
                                                        <span className="text-xs font-black">{label}</span>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }
                                        return (
                                            <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                                                <DollarSign className="h-3.5 w-3.5 text-green-500" />
                                                <span className="text-xs font-black">{job.salaryRange}</span>
                                            </div>
                                        );
                                    } catch (e) {
                                        return null;
                                    }
                                })()}
                            </div>

                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                                                onClick={onOpenFeedback}
                                            >
                                                <Sparkles className="h-4 w-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent className="rounded-xl font-bold text-[10px] uppercase tracking-widest bg-slate-900 border-slate-800 text-white px-3 py-1.5 shadow-2xl">
                                            Improve AI detection
                                        </TooltipContent>
                                    </Tooltip>

                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                                                onClick={handleIgnore}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent className="rounded-xl font-bold text-[10px] uppercase tracking-widest bg-red-600 text-white border-none px-3 py-1.5 shadow-2xl">
                                            Delete (False positive)
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </JobDetailsDialog>
        </>
    )
}

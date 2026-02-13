"use client"

import { Normalizer } from "@/lib/normalize"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, MapPin, DollarSign, Calendar, Trash2, RefreshCw, AlertCircle, Clock } from "lucide-react"
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

    const statusColors: Record<string, string> = {
        APPLIED: "bg-blue-100 text-blue-800 border-blue-200",
        SCREEN: "bg-purple-100 text-purple-800 border-purple-200",
        INTERVIEW: "bg-orange-100 text-orange-800 border-orange-200",
        OFFER: "bg-green-100 text-green-800 border-green-200",
        REJECTED: "bg-red-100 text-red-800 border-red-200",
        GHOSTED: "bg-gray-100 text-gray-800 border-gray-200",
    }

    const status = job.status || "APPLIED";
    const daysSinceUpdate = Math.floor((new Date().getTime() - new Date(job.lastUpdate).getTime()) / (1000 * 60 * 60 * 24));
    const isStale = daysSinceUpdate > 14 && ['APPLIED', 'SCREEN'].includes(status);

    const handleIgnore = async (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();

        if (!confirm("Are you sure this is not a job? It will be removed and used to train the AI.")) return;

        try {
            setIsIgnored(true); // Optimistic UI
            await fetch('/api/feedback/ignore', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ applicationId: job.id })
            });
            router.refresh();
        } catch (error) {
            console.error("Failed to ignore job:", error);
            setIsIgnored(false);
            alert("Failed to ignore job.");
        }
    };

    const handleReanalyzeClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        setIsFeedbackOpen(true);
    };

    const confirmReanalysis = async () => {
        try {
            setIsReanalyzing(true);
            setIsFeedbackOpen(false); // Close dialog immediately

            await fetch(`/api/jobs/${job.id}/reanalyze`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ feedback })
            });

            router.refresh();
        } catch (err) {
            console.error(err);
            alert("Re-analysis failed");
        } finally {
            setIsReanalyzing(false);
            setFeedback(""); // Reset feedback
        }
    };

    if (isIgnored) return null;

    return (
        <>
            <Dialog open={isFeedbackOpen} onOpenChange={(open) => {
                if (!open) setIsFeedbackOpen(false);
            }}>
                <DialogContent className="sm:max-w-[425px]" onClick={(e) => e.stopPropagation()}>
                    <DialogHeader>
                        <DialogTitle>Re-analyze with AI</DialogTitle>
                        <DialogDescription>
                            The AI will deep-search your emails to find updates.
                            Help it by detecting what's wrong.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="feedback">Optional Feedback / Hint</Label>
                            <Textarea
                                id="feedback"
                                placeholder="e.g. 'I received an interview invite yesterday' or 'The salary is actually $120k'"
                                value={feedback}
                                onChange={(e) => setFeedback(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={(e) => {
                            e.stopPropagation();
                            setIsFeedbackOpen(false);
                        }}>
                            Cancel
                        </Button>
                        <Button onClick={(e) => {
                            e.stopPropagation();
                            confirmReanalysis();
                        }} disabled={isReanalyzing}>
                            {isReanalyzing ? "Analyzing..." : "Start Re-analysis"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <JobDetailsDialog job={job}>
                <Card className={`group relative hover:shadow-lg transition-all duration-300 cursor-pointer border-l-4 ${status === 'OFFER' ? 'border-l-green-500' :
                    status === 'INTERVIEW' ? 'border-l-orange-500' :
                        status === 'REJECTED' ? 'border-l-red-500' :
                            'border-l-transparent hover:border-l-blue-500'
                    }`}>
                    <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4 pt-6 px-6">
                        <div className="flex gap-4 w-full">
                            <div className="relative shrink-0">
                                <img
                                    src={`https://img.logo.dev/name/${encodeURIComponent(Normalizer.cleanCompanyName(job.company))}?token=${process.env.NEXT_PUBLIC_LOGO_DEV_TOKEN}`}
                                    alt={`${job.company} logo`}
                                    className="h-14 w-14 rounded-xl object-contain bg-white border border-gray-100 p-1.5 shadow-sm"
                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                />
                                {job.source && job.source !== 'GMAIL' && (
                                    <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 border shadow-sm" title={`Via ${job.source}`}>
                                        <Badge variant="outline" className="text-[9px] h-4.5 px-1.5 py-0 flex items-center justify-center font-bold bg-slate-50 text-slate-600 border-slate-200">
                                            {job.source.substring(0, 1)}
                                        </Badge>
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col w-full min-w-0">
                                <div className="flex items-center justify-between">
                                    <CardTitle className={`text-base md:text-lg font-bold truncate pr-2 ${job.company.toLowerCase().includes('confidential') ? 'italic text-muted-foreground font-semibold' : ''}`}>
                                        {job.company}
                                    </CardTitle>
                                    {isStale && (
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger>
                                                    <AlertCircle className="h-4 w-4 text-amber-500 opacity-60 hover:opacity-100" />
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>No activity for {daysSinceUpdate} days</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    )}
                                </div>
                                <div className="font-semibold text-sm text-slate-600 truncate mb-2">
                                    {job.role}
                                </div>

                                <div className="flex items-center gap-2 flex-wrap">
                                    <Badge className={`${statusColors[status] || "bg-gray-100 text-gray-800"} border px-2.5 py-0.5 text-[10px] font-semibold rounded-full shadow-none hover:bg-opacity-80`}>
                                        {status}
                                    </Badge>
                                    {job.jobId && (
                                        <span className="text-[10px] font-mono font-medium text-slate-400">
                                            #{job.jobId}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="px-6 pb-6 pt-2">
                        <div className="grid grid-cols-1 gap-2 text-[13px] text-muted-foreground mb-5">
                            {job.location && (
                                <div className="flex items-center truncate">
                                    <MapPin className="h-3.5 w-3.5 mr-2 shrink-0 opacity-70" />
                                    <span className="truncate">{job.location}</span>
                                </div>
                            )}
                            {job.salaryRange && (
                                <div className="flex items-center truncate text-slate-700 font-semibold">
                                    <DollarSign className="h-3.5 w-3.5 mr-2 shrink-0 opacity-70" />
                                    <span className="truncate">
                                        {job.salaryRange.includes('{') ? "Salary Data Available" : job.salaryRange}
                                    </span>
                                </div>
                            )}
                            {job.people?.recruiterName && (
                                <div className="flex items-center truncate" title="Recruiter">
                                    <Mail className="h-3.5 w-3.5 mr-2 shrink-0 opacity-70" />
                                    {job.people.recruiterName}
                                </div>
                            )}
                            {job.dates?.interview && (
                                <div className="flex items-center text-orange-600 font-semibold">
                                    <Calendar className="h-3.5 w-3.5 mr-2 shrink-0 opacity-70" />
                                    Interview: {mounted ? new Date(job.dates.interview).toLocaleDateString('en-US') : "..."}
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center text-[11px] font-medium text-slate-400" title={mounted ? `Last updated: ${new Date(job.lastUpdate).toLocaleString()}` : ""}>
                                    <Clock className="h-3.5 w-3.5 mr-1.5" />
                                    {daysSinceUpdate > 0 ? `${daysSinceUpdate}d ago` : 'Today'}
                                </div>
                                {job.emailLogs && job.emailLogs.length > 1 && (
                                    <Badge variant="secondary" className="text-[11px] h-5.5 px-2 font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 border-none transition-colors">
                                        <Mail className="h-3 w-3 mr-1.5" />
                                        {job.emailLogs.length}
                                    </Badge>
                                )}
                            </div>

                            <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full"
                                                onClick={handleReanalyzeClick}
                                                disabled={isReanalyzing}
                                            >
                                                <RefreshCw className={`h-4 w-4 ${isReanalyzing ? "animate-spin" : ""}`} />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Re-analyze with AI</TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>

                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full"
                                                onClick={handleIgnore}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Not a Job / Spam</TooltipContent>
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

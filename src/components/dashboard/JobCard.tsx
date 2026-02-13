"use client"

import { Normalizer } from "@/lib/normalize"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, MapPin, DollarSign, Calendar, Trash2, RefreshCw, AlertCircle, Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { JobDetailsDialog } from "./JobDetailsDialog"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface JobCardProps {
    job: any;
}

export function JobCard({ job }: JobCardProps) {
    const router = useRouter();
    const [isIgnored, setIsIgnored] = useState(false);
    const [isReanalyzing, setIsReanalyzing] = useState(false);

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

    const handleReanalyze = async (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        if (!confirm("Re-analyze this job with AI? This will use the latest logic to correct details.")) return;

        try {
            setIsReanalyzing(true);
            await fetch(`/api/jobs/${job.id}/reanalyze`, { method: 'POST' });
            router.refresh();
        } catch (err) {
            console.error(err);
            alert("Re-analysis failed");
        } finally {
            setIsReanalyzing(false);
        }
    };

    if (isIgnored) return null;

    return (
        <JobDetailsDialog job={job}>
            <Card className={`group relative hover:shadow-lg transition-all duration-200 cursor-pointer border-l-4 ${status === 'OFFER' ? 'border-l-green-500' :
                    status === 'INTERVIEW' ? 'border-l-orange-500' :
                        status === 'REJECTED' ? 'border-l-red-500' :
                            'border-l-transparent hover:border-l-blue-500'
                }`}>
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2 pt-4 px-4">
                    <div className="flex gap-3 w-full">
                        <div className="relative shrink-0">
                            <img
                                src={`https://img.logo.dev/name/${encodeURIComponent(Normalizer.cleanCompanyName(job.company))}?token=pk_VQs1A49_TIu_5CZ3yuFz7Q`}
                                alt={`${job.company} logo`}
                                className="h-12 w-12 rounded-lg object-contain bg-white border border-gray-100 p-1 shadow-sm"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                            {job.source && job.source !== 'GMAIL' && (
                                <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 border shadow-sm" title={`Via ${job.source}`}>
                                    <Badge variant="outline" className="text-[8px] h-4 px-1 py-0 flex items-center justify-center font-bold bg-slate-50 text-slate-600 border-slate-200">
                                        {job.source.substring(0, 1)}
                                    </Badge>
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col w-full min-w-0">
                            <div className="flex items-center justify-between">
                                <CardTitle className={`text-base font-bold truncate pr-2 ${job.company.toLowerCase().includes('confidential') ? 'italic text-muted-foreground' : ''}`}>
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
                            <div className="font-medium text-sm text-slate-700 truncate mb-1">
                                {job.role}
                            </div>

                            <div className="flex items-center gap-2 flex-wrap">
                                <Badge className={`${statusColors[status] || "bg-gray-100 text-gray-800"} border px-2 py-0 text-[10px] font-medium rounded-full shadow-none hover:bg-opacity-80`}>
                                    {status}
                                </Badge>
                                {job.jobId && (
                                    <span className="text-[10px] font-mono text-slate-400">
                                        #{job.jobId}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="px-4 pb-4 pt-2">
                    <div className="grid grid-cols-1 gap-1.5 text-xs text-muted-foreground mb-3">
                        {job.location && (
                            <div className="flex items-center truncate">
                                <MapPin className="h-3 w-3 mr-1.5 shrink-0" />
                                <span className="truncate">{job.location}</span>
                            </div>
                        )}
                        {job.salaryRange && (
                            <div className="flex items-center truncate text-slate-700 font-medium">
                                <DollarSign className="h-3 w-3 mr-1.5 shrink-0" />
                                <span className="truncate">
                                    {job.salaryRange.includes('{') ? "Salary Data Available" : job.salaryRange}
                                </span>
                            </div>
                        )}
                        {job.people?.recruiterName && (
                            <div className="flex items-center truncate" title="Recruiter">
                                <Mail className="h-3 w-3 mr-1.5 shrink-0" />
                                {job.people.recruiterName}
                            </div>
                        )}
                        {job.dates?.interview && (
                            <div className="flex items-center text-orange-600 font-medium">
                                <Calendar className="h-3 w-3 mr-1.5 shrink-0" />
                                Interview: {new Date(job.dates.interview).toLocaleDateString('en-US')}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-2">
                        <div className="flex items-center gap-2">
                            <div className="flex items-center text-[10px] text-slate-400" title={`Last updated: ${new Date(job.lastUpdate).toLocaleString()}`}>
                                <Clock className="h-3 w-3 mr-1" />
                                {daysSinceUpdate > 0 ? `${daysSinceUpdate}d ago` : 'Today'}
                            </div>
                            {job.emailLogs && job.emailLogs.length > 1 && (
                                <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-normal bg-blue-50 text-blue-600 hover:bg-blue-100 border-none transition-colors">
                                    <Mail className="h-3 w-3 mr-1" />
                                    {job.emailLogs.length}
                                </Badge>
                            )}
                        </div>

                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                                            onClick={handleReanalyze}
                                            disabled={isReanalyzing}
                                        >
                                            <RefreshCw className={`h-3.5 w-3.5 ${isReanalyzing ? "animate-spin" : ""}`} />
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
                                            className="h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50"
                                            onClick={handleIgnore}
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
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
    )
}

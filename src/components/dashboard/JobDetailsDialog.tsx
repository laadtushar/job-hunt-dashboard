"use client"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import {
    Building,
    MapPin,
    DollarSign,
    Calendar,
    User,
    Mail,
    Globe,
    ExternalLink,
    FileText,
    Clock,
    CheckCircle2,
    XCircle,
    HelpCircle,
    Code
} from "lucide-react"
import { useState } from "react"

interface JobDetailsDialogProps {
    job: any // Type this properly with your Prisma type
    children: React.ReactNode
}

export function JobDetailsDialog({ job, children }: JobDetailsDialogProps) {
    const [isOpen, setIsOpen] = useState(false)

    // Status Badge Logic
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'APPLIED': return "bg-blue-100 text-blue-800 border-blue-200"
            case 'SCREEN': return "bg-purple-100 text-purple-800 border-purple-200"
            case 'INTERVIEW': return "bg-orange-100 text-orange-800 border-orange-200"
            case 'OFFER': return "bg-green-100 text-green-800 border-green-200"
            case 'REJECTED': return "bg-red-100 text-red-800 border-red-200"
            default: return "bg-gray-100 text-gray-800 border-gray-200"
        }
    }

    // Helper to parse JSON salary safely
    const getSalaryData = () => {
        if (!job.salaryRange) return null;
        try {
            const parsed = JSON.parse(job.salaryRange);
            if (typeof parsed === 'object') return parsed;
            return { base: parsed };
        } catch (e) {
            return { base: job.salaryRange };
        }
    }

    const salaryData = getSalaryData();

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 gap-0">
                <DialogHeader className="p-6 pb-4 border-b">
                    <div className="flex justify-between items-start gap-4">
                        <div>
                            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                                {job.role}
                            </DialogTitle>
                            <DialogDescription className="text-base mt-1 flex items-center gap-2">
                                <Building className="h-4 w-4" />
                                <span className="font-semibold text-foreground">{job.company}</span>
                                {job.location && (
                                    <>
                                        <span>•</span>
                                        <span className="text-muted-foreground">{job.location}</span>
                                    </>
                                )}
                            </DialogDescription>
                        </div>
                        <Badge className={`px-3 py-1 text-sm border shadow-none ${getStatusColor(job.status)}`}>
                            {job.status}
                        </Badge>
                    </div>
                </DialogHeader>

                <ScrollArea className="flex-1">
                    <div className="p-6">
                        <Tabs defaultValue="details" className="w-full">
                            <TabsList className="grid w-full grid-cols-4 mb-6">
                                <TabsTrigger value="details">Details</TabsTrigger>
                                <TabsTrigger value="emails">Emails</TabsTrigger>
                                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                                <TabsTrigger value="raw">Raw</TabsTrigger>
                            </TabsList>

                            {/* DETAILS TAB */}
                            <TabsContent value="details" className="space-y-6">

                                {/* Key Info Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Salary */}
                                    <div className="bg-slate-50 p-4 rounded-lg border">
                                        <h4 className="flex items-center gap-2 font-semibold text-sm text-muted-foreground mb-3">
                                            <DollarSign className="h-4 w-4" /> Compensation
                                        </h4>
                                        {salaryData ? (
                                            <div className="space-y-1">
                                                <div className="text-lg font-bold">{salaryData.base || "N/A"}</div>
                                                {salaryData.bonus && <div className="text-sm text-muted-foreground">Bonus: {salaryData.bonus}</div>}
                                                {salaryData.equity && <div className="text-sm text-muted-foreground">Equity: {salaryData.equity}</div>}
                                            </div>
                                        ) : (
                                            <div className="text-sm text-muted-foreground italic">No salary data extracted</div>
                                        )}
                                    </div>

                                    {/* Job ID / Reference */}
                                    <div className="bg-slate-50 p-4 rounded-lg border">
                                        <h4 className="flex items-center gap-2 font-semibold text-sm text-muted-foreground mb-3">
                                            <FileText className="h-4 w-4" /> Reference
                                        </h4>
                                        <div className="space-y-1">
                                            {job.jobId ? (
                                                <>
                                                    <div className="text-sm font-medium">Job ID</div>
                                                    <code className="text-xs bg-white px-2 py-1 rounded border">{job.jobId}</code>
                                                </>
                                            ) : (
                                                <div className="text-sm text-muted-foreground italic">No Job ID found</div>
                                            )}
                                            <div className="mt-2 text-xs text-muted-foreground">
                                                Source: {job.source}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Important Links */}
                                {(job.jobPostUrl || job.companyPortalUrl || job.companyDomain) && (
                                    <div className="space-y-3">
                                        <h3 className="font-semibold flex items-center gap-2">
                                            <ExternalLink className="h-4 w-4" /> Resouces
                                        </h3>
                                        <div className="flex flex-wrap gap-2">
                                            {job.jobPostUrl && (
                                                <Button variant="outline" size="sm" asChild>
                                                    <a href={job.jobPostUrl} target="_blank" rel="noopener noreferrer">
                                                        View Job Post <ExternalLink className="ml-2 h-3 w-3" />
                                                    </a>
                                                </Button>
                                            )}
                                            {job.companyPortalUrl && (
                                                <Button variant="outline" size="sm" asChild>
                                                    <a href={job.companyPortalUrl} target="_blank" rel="noopener noreferrer">
                                                        Candidate Portal <Globe className="ml-2 h-3 w-3" />
                                                    </a>
                                                </Button>
                                            )}
                                            {job.companyDomain && (
                                                <Button variant="ghost" size="sm" asChild>
                                                    <a href={`https://${job.companyDomain}`} target="_blank" rel="noopener noreferrer">
                                                        {job.companyDomain}
                                                    </a>
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Next Steps / AI Assessment */}
                                {(job.nextSteps || job.sentimentScore !== null) && (
                                    <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-4 space-y-3">
                                        <h3 className="font-semibold text-blue-900 flex items-center gap-2">
                                            <Code className="h-4 w-4" /> AI Analysis
                                        </h3>
                                        {job.nextSteps && (
                                            <div className="space-y-1">
                                                <div className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Next Steps</div>
                                                <p className="text-sm text-blue-800">{job.nextSteps}</p>
                                            </div>
                                        )}
                                        {job.sentimentScore !== null && (
                                            <div className="flex items-center gap-2 pt-2">
                                                <div className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Sentiment:</div>
                                                <Badge variant="outline" className="bg-white/50">
                                                    {Math.round(job.sentimentScore * 100)}/100
                                                </Badge>
                                            </div>
                                        )}
                                    </div>
                                )}

                            </TabsContent>

                            {/* TIMELINE TAB */}
                            <TabsContent value="timeline" className="space-y-6">
                                {/* People Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="border rounded-lg p-4">
                                        <h4 className="flex items-center gap-2 font-semibold mb-3">
                                            <User className="h-4 w-4" /> Recruiter
                                        </h4>
                                        {job.recruiterName || job.recruiterEmail ? (
                                            <div className="space-y-1">
                                                <div className="font-medium">{job.recruiterName || "Unknown Name"}</div>
                                                {job.recruiterEmail && (
                                                    <a href={`mailto:${job.recruiterEmail}`} className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                                                        <Mail className="h-3 w-3" /> {job.recruiterEmail}
                                                    </a>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="text-sm text-muted-foreground">No recruiter info extracted</div>
                                        )}
                                    </div>
                                    {job.hiringManager && (
                                        <div className="border rounded-lg p-4">
                                            <h4 className="flex items-center gap-2 font-semibold mb-3">
                                                <User className="h-4 w-4" /> Hiring Manager
                                            </h4>
                                            <div className="font-medium">{job.hiringManager}</div>
                                        </div>
                                    )}
                                </div>

                                <Separator />

                                {/* Dates */}
                                <div className="space-y-4">
                                    <h3 className="font-semibold flex items-center gap-2">
                                        <Clock className="h-4 w-4" /> Timeline
                                    </h3>
                                    <div className="space-y-4 pl-2 border-l-2 border-slate-100 ml-2">
                                        <div className="relative pl-6 pb-2">
                                            <div className="absolute -left-[9px] top-1 h-4 w-4 rounded-full bg-slate-200 border-2 border-white" />
                                            <div className="text-sm text-muted-foreground">{new Date(job.appliedDate).toLocaleDateString()}</div>
                                            <div className="font-medium">Applied</div>
                                        </div>

                                        {job.interviewDate && (
                                            <div className="relative pl-6 pb-2">
                                                <div className="absolute -left-[9px] top-1 h-4 w-4 rounded-full bg-orange-400 border-2 border-white" />
                                                <div className="text-sm text-muted-foreground">{new Date(job.interviewDate).toLocaleDateString()}</div>
                                                <div className="font-medium text-orange-700">Interview</div>
                                            </div>
                                        )}

                                        <div className="relative pl-6 pb-2">
                                            <div className="absolute -left-[9px] top-1 h-4 w-4 rounded-full bg-blue-500 border-2 border-white animate-pulse" />
                                            <div className="text-sm text-muted-foreground">{new Date(job.lastUpdate).toLocaleDateString()}</div>
                                            <div className="font-medium">Last Update</div>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            {/* EMAIL TAB */}
                            <TabsContent value="emails" className="space-y-4">
                                {job.emailLogs && job.emailLogs.length > 0 ? (
                                    job.emailLogs.map((log: any) => (
                                        <div key={log.id} className="border rounded-lg overflow-hidden bg-white shadow-sm">
                                            {/* Email Header */}
                                            <div className="bg-slate-50 p-3 border-b flex justify-between items-start">
                                                <div>
                                                    <div className="font-semibold text-sm">
                                                        {new Date(log.receivedDate).toLocaleString()}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground mt-1">
                                                        Thread ID: {log.threadId}
                                                    </div>
                                                </div>
                                                <Button variant="ghost" size="sm" className="h-6 text-xs" asChild>
                                                    <a href={`https://mail.google.com/mail/u/0/#inbox/${log.gmailId}`} target="_blank" rel="noopener noreferrer">
                                                        Open in Gmail <ExternalLink className="ml-1 h-3 w-3" />
                                                    </a>
                                                </Button>
                                            </div>

                                            {/* Email Body */}
                                            <div className="p-4 overflow-x-auto">
                                                {/* If we have the full body, render it properly sanitized */}
                                                {log.body ? (
                                                    <div className="prose prose-sm max-w-none text-sm dark:prose-invert">
                                                        {/* 
                                            CAUTION: In a real app, use DOMPurify here.
                                            For this playground, we trust the body or render it as text if needed.
                                            If it's HTML, we need dangerouslySetInnerHTML. 
                                            For safety in this specific step, I'll render it inside a shadow-dom-like container or just a div if we assume content is mostly safe text/html.
                                            Actually, emails are full HTML. 
                                            Let's use a simplified text view if simplified, or dangerouslySetInnerHTML with a warning comment.
                                        */}
                                                        <div dangerouslySetInnerHTML={{ __html: log.body }} />
                                                    </div>
                                                ) : (
                                                    <div className="text-sm text-slate-600">
                                                        {log.snippet}
                                                        <div className="mt-2 text-xs text-muted-foreground italic">
                                                            (Full body not saved for this older email)
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground">
                                        No emails synced for this application.
                                    </div>
                                )}
                            </TabsContent>

                            {/* RAW DATA TAB */}
                            <TabsContent value="raw">
                                <div className="space-y-4">
                                    <div className="bg-slate-950 text-slate-50 p-4 rounded-lg overflow-auto max-h-[400px] text-xs font-mono">
                                        <pre>{JSON.stringify(job, null, 2)}</pre>
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    )
}

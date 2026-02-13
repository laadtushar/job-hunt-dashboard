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
                <DialogHeader className="p-6 pb-4 border-b shrink-0">
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

                <div className="flex-1 overflow-hidden flex flex-col">
                    <Tabs defaultValue="details" className="flex-1 flex flex-col min-h-0">
                        <div className="px-6 pt-6 shrink-0">
                            <TabsList className="grid w-full grid-cols-4">
                                <TabsTrigger value="details">Details</TabsTrigger>
                                <TabsTrigger value="emails">Emails</TabsTrigger>
                                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                                <TabsTrigger value="raw">Raw</TabsTrigger>
                            </TabsList>
                        </div>

                        <div className="flex-1 overflow-hidden min-h-0">
                            {/* DETAILS TAB */}
                            <TabsContent value="details" className="h-full m-0 overflow-y-auto p-6 custom-scrollbar">
                                <div className="space-y-6">
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
                                                <ExternalLink className="h-4 w-4" /> Resources
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
                                </div>
                            </TabsContent>

                            {/* TIMELINE TAB */}
                            <TabsContent value="timeline" className="h-full m-0 overflow-y-auto p-6 custom-scrollbar">
                                <div className="space-y-6">
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
                                </div>
                            </TabsContent>

                            {/* EMAIL TAB */}
                            <TabsContent value="emails" className="h-full m-0 overflow-y-auto p-6 custom-scrollbar">
                                {job.emailLogs && job.emailLogs.length > 0 ? (
                                    <div className="space-y-4 pb-8">
                                        {job.emailLogs.map((log: any, i: number) => (
                                            <div key={log.id || i} className="border rounded-lg overflow-hidden bg-white shadow-sm transition-shadow hover:shadow-md">
                                                <div className="bg-slate-50 p-4 border-b flex justify-between items-start gap-4">
                                                    <div className="space-y-1 overflow-hidden">
                                                        <div className="flex items-baseline gap-2">
                                                            <span className="font-semibold text-sm truncate text-slate-900">
                                                                {log.sender?.split('<')[0].replace(/"/g, '').trim() || log.sender}
                                                            </span>
                                                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                                {new Date(log.receivedDate).toLocaleString(undefined, {
                                                                    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
                                                                })}
                                                            </span>
                                                        </div>
                                                        <div className="text-xs font-medium text-slate-700 truncate">
                                                            {log.subject || "(No Subject)"}
                                                        </div>
                                                    </div>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-blue-600" asChild title="Open in Gmail">
                                                        <a
                                                            href={`https://mail.google.com/mail/u/0/#search/rfc822msgid:${encodeURIComponent(log.gmailId)}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                        >
                                                            <ExternalLink className="h-4 w-4" />
                                                        </a>
                                                    </Button>
                                                </div>

                                                <div className="p-4 text-sm bg-white overflow-x-auto">
                                                    {log.body ? (
                                                        <div className="prose prose-sm max-w-none dark:prose-invert">
                                                            <div dangerouslySetInnerHTML={{ __html: log.body }} />
                                                        </div>
                                                    ) : (
                                                        <div className="bg-slate-50 border-l-4 border-slate-300 p-4 italic text-muted-foreground rounded-r">
                                                            <div className="flex items-center gap-2 mb-2 not-italic font-medium text-slate-700">
                                                                <Mail className="h-3 w-3" /> Email Snippet
                                                            </div>
                                                            "{log.snippet}"
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 text-muted-foreground bg-slate-50 rounded-lg border border-dashed">
                                        <Mail className="h-8 w-8 mx-auto mb-2 opacity-20" />
                                        <p>No synced emails found for this application.</p>
                                    </div>
                                )}
                            </TabsContent>

                            {/* RAW DATA TAB */}
                            <TabsContent value="raw" className="h-full m-0 overflow-y-auto p-6 bg-slate-950 custom-scrollbar">
                                <div className="text-slate-50 text-xs font-mono h-full">
                                    <pre className="whitespace-pre-wrap break-all">{JSON.stringify(job, null, 2)}</pre>
                                </div>
                            </TabsContent>
                        </div>
                    </Tabs>
                </div>
            </DialogContent>
        </Dialog>
    )
}

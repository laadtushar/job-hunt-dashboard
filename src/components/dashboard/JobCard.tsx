"use client"

import { Normalizer } from "@/lib/normalize"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, MapPin, DollarSign, Calendar, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { JobDetailsDialog } from "./JobDetailsDialog"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useState } from "react"

interface JobCardProps {
    job: any;
}

export function JobCard({ job }: JobCardProps) {
    const router = useRouter();
    const [isIgnored, setIsIgnored] = useState(false);

    const statusColors: Record<string, string> = {
        APPLIED: "bg-blue-100 text-blue-800",
        SCREEN: "bg-purple-100 text-purple-800",
        INTERVIEW: "bg-orange-100 text-orange-800",
        OFFER: "bg-green-100 text-green-800",
        REJECTED: "bg-red-100 text-red-800",
        GHOSTED: "bg-gray-100 text-gray-800",
    }

    const status = job.status || "APPLIED";

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

    if (isIgnored) return null;

    return (
        <JobDetailsDialog job={job}>
            <Card className="mb-4 hover:shadow-lg transition-shadow duration-200 cursor-pointer group relative">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="flex items-center gap-3">
                        <img
                            src={`https://img.logo.dev/name/${encodeURIComponent(Normalizer.cleanCompanyName(job.company))}?token=pk_VQs1A49_TIu_5CZ3yuFz7Q`}
                            alt={`${job.company} logo`}
                            className="h-10 w-10 rounded-md object-contain bg-white border border-gray-100 p-1"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                                <CardTitle className="text-lg font-bold group-hover:text-blue-600 transition-colors">{job.company}</CardTitle>
                                <Badge className={`${statusColors[status] || "bg-gray-100 text-gray-800"} border-0`}>
                                    {status}
                                </Badge>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                        <div className="text-sm text-muted-foreground">
                            {new Date(job.lastUpdate).toLocaleDateString('en-US')}
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2"
                            onClick={handleIgnore}
                            title="Not a Job / Spam"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-md font-semibold mb-2">{job.role}</div>

                    <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground mb-4">
                        {job.location && (
                            <div className="flex items-center">
                                <MapPin className="h-4 w-4 mr-1" /> {job.location}
                            </div>
                        )}
                        {job.salaryRange && (
                            <div className="flex items-center">
                                <DollarSign className="h-4 w-4 mr-1" />
                                {/* Parse if it's JSON or just show string */}
                                {job.salaryRange.includes('{') ? "Salary Data" : job.salaryRange}
                            </div>
                        )}
                        {job.people?.recruiterName && (
                            <div className="flex items-center">
                                <Mail className="h-4 w-4 mr-1" /> {job.people.recruiterName}
                            </div>
                        )}
                        {job.dates?.interview && (
                            <div className="flex items-center text-orange-600 font-medium">
                                <Calendar className="h-4 w-4 mr-1" /> Interview: {new Date(job.dates.interview).toLocaleDateString('en-US')}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-4 border-t text-xs text-muted-foreground">
                        <div className="flex gap-2">
                            {job.emailLogs && job.emailLogs.length > 1 && (
                                <Badge variant="outline" className="text-xs font-normal bg-blue-50 text-blue-700 border-blue-200">
                                    <Mail className="h-3 w-3 mr-1" />
                                    {job.emailLogs.length} emails
                                </Badge>
                            )}
                        </div>
                        <div>
                            Updated {new Date(job.lastUpdate).toLocaleDateString()}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </JobDetailsDialog>
    )
}

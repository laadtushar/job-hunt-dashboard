
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ExternalLink, Mail, MapPin, DollarSign, Calendar, Building } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface JobCardProps {
    job: any; // Type strictly later
}

export function JobCard({ job }: JobCardProps) {
    const statusColors: Record<string, string> = {
        APPLIED: "bg-blue-100 text-blue-800",
        SCREEN: "bg-purple-100 text-purple-800",
        INTERVIEW: "bg-orange-100 text-orange-800",
        OFFER: "bg-green-100 text-green-800",
        REJECTED: "bg-red-100 text-red-800",
        GHOSTED: "bg-gray-100 text-gray-800",
    }

    const status = job.status || "APPLIED";

    return (
        <Card className="mb-4 hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center space-x-2">
                    <CardTitle className="text-lg font-bold">{job.company}</CardTitle>
                    <Badge className={statusColors[status] || "bg-gray-100 text-gray-800"}>
                        {status}
                    </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                    {new Date(job.lastUpdate).toLocaleDateString('en-US')}
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

                <div className="flex gap-2 mt-4">
                    {job.urls?.jobPost && (
                        <a href={job.urls.jobPost} target="_blank" rel="noopener noreferrer" className="text-xs flex items-center text-blue-600 hover:underline">
                            <ExternalLink className="h-3 w-3 mr-1" /> Job Post
                        </a>
                    )}
                    {job.companyInfo?.domain && (
                        <a href={`https://${job.companyInfo.domain}`} target="_blank" rel="noopener noreferrer" className="text-xs flex items-center text-blue-600 hover:underline">
                            <Building className="h-3 w-3 mr-1" /> Website
                        </a>
                    )}
                </div>

                {job.nextSteps && (
                    <div className="mt-3 text-xs bg-yellow-50 p-2 rounded border border-yellow-100">
                        <span className="font-semibold">Next:</span> {job.nextSteps}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

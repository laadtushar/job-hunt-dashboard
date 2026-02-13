"use client"

import { useState } from "react"
import { JobCard } from "@/components/dashboard/JobCard"
import { DashboardHeader } from "@/components/dashboard/DashboardHeader"
import { DashboardToolbar } from "@/components/dashboard/DashboardToolbar"
import { SyncLogs } from "@/components/dashboard/SyncLogs"

export default function DashboardClient({ jobs }: { jobs: any[] }) {
    const [syncLimit, setSyncLimit] = useState(50)
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState("ALL")
    const [sortOrder, setSortOrder] = useState("NEWEST")
    const [isSyncing, setIsSyncing] = useState(false)
    const [syncLogs, setSyncLogs] = useState<{ message: string, type: 'info' | 'success' | 'error' }[]>([])

    const handleSync = async () => {
        setIsSyncing(true)
        setSyncLogs([])
        try {
            const res = await fetch('/api/sync', {
                method: 'POST',
                body: JSON.stringify({ limit: syncLimit })
            })

            if (!res.body) return;
            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                buffer += chunk;

                const lines = buffer.split("\n");
                buffer = lines.pop() || "";

                for (const line of lines) {
                    if (line.trim()) {
                        try {
                            const parsed = JSON.parse(line);
                            setSyncLogs(prev => [...prev, parsed]);
                        } catch (e) {
                            console.error("Parse error", line);
                        }
                    }
                }
            }

            // Reload after short delay if successful
            setTimeout(() => window.location.reload(), 2000);

        } catch (e) {
            console.error(e)
            setSyncLogs(prev => [...prev, { message: "Failed to connect to sync service", type: 'error' }]);
        } finally {
            setIsSyncing(false)
        }
    }

    const filteredJobs = jobs.filter(job => {
        const matchesSearch = (job.company?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
            (job.role?.toLowerCase() || "").includes(searchTerm.toLowerCase())
        const matchesStatus = statusFilter === "ALL" || job.status === statusFilter

        return matchesSearch && matchesStatus
    }).sort((a, b) => {
        switch (sortOrder) {
            case "NEWEST":
                const getEmailDate = (j: any) => {
                    // Start of discussion on email date vs applied date
                    // We prioritize the most recent email received date
                    if (j.emailLogs && j.emailLogs.length > 0) {
                        // Find the max receivedDate
                        const dates = j.emailLogs.map((l: any) => new Date(l.receivedDate).getTime());
                        return Math.max(...dates);
                    }
                    return new Date(j.appliedDate).getTime();
                }
                return getEmailDate(b) - getEmailDate(a);
            case "OLDEST":
                return new Date(a.appliedDate).getTime() - new Date(b.appliedDate).getTime();
            case "UPDATED":
                return new Date(b.lastUpdate).getTime() - new Date(a.lastUpdate).getTime();
            case "COMPANY":
                return (a.company || "").localeCompare(b.company || "");
            default:
                return 0;
        }
    })

    const stats = {
        total: jobs.length,
        active: jobs.filter(j => ['APPLIED', 'SCREEN', 'INTERVIEW', 'OFFER'].includes(j.status)).length,
        interviews: jobs.filter(j => j.status === 'INTERVIEW').length,
        offers: jobs.filter(j => j.status === 'OFFER').length
    }

    return (
        <div className="space-y-6">
            <DashboardHeader stats={stats} />

            <div className="space-y-4">
                <DashboardToolbar
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    statusFilter={statusFilter}
                    setStatusFilter={setStatusFilter}
                    sortOrder={sortOrder}
                    setSortOrder={setSortOrder}
                    syncLimit={syncLimit}
                    setSyncLimit={setSyncLimit}
                    isSyncing={isSyncing}
                    handleSync={handleSync}
                />

                <SyncLogs logs={syncLogs} isSyncing={isSyncing} />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredJobs.map((job) => (
                    <JobCard key={job.id} job={job} />
                ))}
                {filteredJobs.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center py-16 text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
                        <div className="text-4xl mb-2">🔍</div>
                        <p className="text-lg font-medium">No applications found</p>
                        <p className="text-sm">Try adjusting your filters or search.</p>
                    </div>
                )}
            </div>
        </div>
    )
}

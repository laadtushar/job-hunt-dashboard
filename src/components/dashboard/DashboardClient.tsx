"use client"

import { useState } from "react"
import { JobCard } from "@/components/dashboard/JobCard"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { RefreshCw, Plus, Search } from "lucide-react"

export default function DashboardClient({ jobs }: { jobs: any[] }) {
    const [syncLimit, setSyncLimit] = useState(50)
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState("ALL")
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
    })

    const stats = {
        total: jobs.length,
        active: jobs.filter(j => ['APPLIED', 'SCREEN', 'INTERVIEW', 'OFFER'].includes(j.status)).length,
        intervious: jobs.filter(j => j.status === 'INTERVIEW').length,
        offers: jobs.filter(j => j.status === 'OFFER').length
    }

    return (
        <div className="space-y-6">
            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-card p-4 rounded-xl border shadow-sm">
                    <div className="text-muted-foreground text-sm">Total Applications</div>
                    <div className="text-2xl font-bold">{stats.total}</div>
                </div>
                <div className="bg-card p-4 rounded-xl border shadow-sm">
                    <div className="text-muted-foreground text-sm">Active Processes</div>
                    <div className="text-2xl font-bold text-blue-600">{stats.active}</div>
                </div>
                <div className="bg-card p-4 rounded-xl border shadow-sm">
                    <div className="text-muted-foreground text-sm">Interviews</div>
                    <div className="text-2xl font-bold text-purple-600">{stats.intervious}</div>
                </div>
                <div className="bg-card p-4 rounded-xl border shadow-sm">
                    <div className="text-muted-foreground text-sm">Offers</div>
                    <div className="text-2xl font-bold text-green-600">{stats.offers}</div>
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col gap-4 bg-card p-4 rounded-xl border shadow-sm">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="flex gap-2 w-full md:w-auto">
                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search companies or roles..."
                                className="pl-8"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[140px]">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">All Status</SelectItem>
                                <SelectItem value="APPLIED">Applied</SelectItem>
                                <SelectItem value="SCREEN">Screening</SelectItem>
                                <SelectItem value="INTERVIEW">Interview</SelectItem>
                                <SelectItem value="OFFER">Offer</SelectItem>
                                <SelectItem value="REJECTED">Rejected</SelectItem>
                                <SelectItem value="GHOSTED">Ghosted</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex gap-2 items-center w-full md:w-auto">
                        <div className="flex items-center gap-2 mr-2">
                            <span className="text-sm text-muted-foreground whitespace-nowrap">Sync Limit:</span>
                            <Input
                                type="number"
                                className="w-20"
                                value={syncLimit}
                                onChange={(e) => setSyncLimit(Number(e.target.value))}
                                min={1}
                                max={500}
                            />
                        </div>
                        <Button
                            onClick={handleSync}
                            disabled={isSyncing}
                            className={isSyncing ? "opacity-80" : ""}
                        >
                            <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                            {isSyncing ? 'Syncing...' : 'Sync Emails'}
                        </Button>
                    </div>
                </div>

                {/* Live Sync Logs */}
                {(isSyncing || syncLogs.length > 0) && (
                    <div className="mt-4 bg-muted/50 rounded-lg p-3 max-h-48 overflow-y-auto font-mono text-xs">
                        {syncLogs.length === 0 && <div className="text-muted-foreground animate-pulse">Connecting to sync service...</div>}
                        {syncLogs.map((log, i) => (
                            <div key={i} className={`mb-1 ${log.type === 'error' ? 'text-red-500' :
                                    log.type === 'success' ? 'text-green-600 font-semibold' :
                                        'text-muted-foreground'
                                }`}>
                                <span className="opacity-50 mr-2">[{new Date().toLocaleTimeString()}]</span>
                                {log.message}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* List */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredJobs.map((job) => (
                    <JobCard key={job.id} job={job} />
                ))}
                {filteredJobs.length === 0 && (
                    <div className="col-span-full text-center py-12 text-muted-foreground">
                        No applications found matching your criteria.
                    </div>
                )}
            </div>
        </div>
    )
}

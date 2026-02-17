"use client"

import { useState } from "react"
import { JobCard } from "@/components/dashboard/JobCard"
import { DashboardHeader } from "@/components/dashboard/DashboardHeader"
import { DashboardToolbar } from "@/components/dashboard/DashboardToolbar"
import { SyncLogs } from "@/components/dashboard/SyncLogs"
import { AIInsightsPanel } from "@/components/dashboard/AIInsightsPanel"
import { AskAI } from "@/components/dashboard/AskAI"
import { JobGridView } from "@/components/dashboard/JobGridView"
import KanbanBoard from "@/components/kanban/KanbanBoard"

export default function DashboardClient({
    jobs,
    initialView = 'BOARD'
}: {
    jobs: any[],
    initialView?: 'BOARD' | 'GRID' | 'PIPELINE'
}) {
    const [viewMode, setViewMode] = useState<'BOARD' | 'GRID' | 'PIPELINE'>(initialView)
    const [syncLimit, setSyncLimit] = useState(50)
    const [afterDate, setAfterDate] = useState("2024-01-01")
    const [beforeDate, setBeforeDate] = useState("")
    const [searchTerm, setSearchTerm] = useState("")
    const [statusFilter, setStatusFilter] = useState("ALL")
    const [sortOrder, setSortOrder] = useState("NEWEST")
    const [isSyncing, setIsSyncing] = useState(false)
    const [syncLogs, setSyncLogs] = useState<{ message: string, type: 'info' | 'success' | 'error' }[]>([])

    const handleSync = async () => {
        setIsSyncing(true)
        setSyncLogs([{ message: "Starting Neural Pipeline...", type: 'info' }])

        try {
            // Step 1: Prepare (Get IDs)
            setSyncLogs(prev => [...prev, { message: "Identifying pending job updates (Last 365 days)...", type: 'info' }]);
            const prepareRes = await fetch('/api/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'prepare',
                    limit: syncLimit,
                    after: afterDate.replace(/-/g, '/'),
                    before: beforeDate ? beforeDate.replace(/-/g, '/') : undefined
                })
            });
            const { messages } = await prepareRes.json();

            if (!messages || messages.length === 0) {
                setSyncLogs(prev => [...prev, { message: "No new job updates found. Your pipeline is up to date.", type: 'success' }]);
                setTimeout(() => window.location.reload(), 2000);
                return;
            }

            setSyncLogs(prev => [...prev, { message: `Found ${messages.length} new items. Initiating parallel neural processing...`, type: 'info' }]);

            // Step 2: Batch and Process in Parallel
            const BATCH_SIZE = 25;
            const messageIds = messages.map((m: any) => m.id);
            const batches = [];
            for (let i = 0; i < messageIds.length; i += BATCH_SIZE) {
                batches.push(messageIds.slice(i, i + BATCH_SIZE));
            }

            // Run batches in parallel
            await Promise.all(batches.map(async (batchIds, batchIndex) => {
                const res = await fetch('/api/sync', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ messageIds: batchIds })
                });

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
                                // Prepend batch info to message to distinguish logs
                                setSyncLogs(prev => [...prev, {
                                    ...parsed,
                                    message: `[Batch ${batchIndex + 1}] ${parsed.message}`
                                }]);
                            } catch (e) { }
                        }
                    }
                }
            }));

            setSyncLogs(prev => [...prev, { message: "Sync Pulse Complete.", type: 'success' }]);
            setTimeout(() => window.location.reload(), 1500);

        } catch (e) {
            console.error(e)
            setSyncLogs(prev => [...prev, { message: "Neural Link Failed: Connection Interrupted", type: 'error' }]);
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
        <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
            <AIInsightsPanel jobs={jobs} />
            <DashboardHeader stats={stats} />

            <div className="space-y-6">
                <DashboardToolbar
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    statusFilter={statusFilter}
                    setStatusFilter={setStatusFilter}
                    sortOrder={sortOrder}
                    setSortOrder={setSortOrder}
                    viewMode={viewMode}
                    setViewMode={setViewMode}
                    syncLimit={syncLimit}
                    setSyncLimit={setSyncLimit}
                    afterDate={afterDate}
                    setAfterDate={setAfterDate}
                    beforeDate={beforeDate}
                    setBeforeDate={setBeforeDate}
                    isSyncing={isSyncing}
                    handleSync={handleSync}
                />

                <SyncLogs logs={syncLogs} isSyncing={isSyncing} />
            </div>

            {viewMode === 'BOARD' ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {filteredJobs.map((job) => (
                        <JobCard key={job.id} job={job} />
                    ))}
                    {filteredJobs.length === 0 && (
                        <div className="col-span-full flex flex-col items-center justify-center py-20 px-4 text-center bg-white/50 backdrop-blur-sm rounded-3xl border-2 border-dashed border-slate-200">
                            <div className="h-20 w-20 rounded-full bg-slate-50 flex items-center justify-center mb-6 shadow-inner">
                                <span className="text-4xl text-slate-300">📁</span>
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">No results matching your pulse</h3>
                            <p className="text-slate-500 max-w-sm mx-auto leading-relaxed">
                                We couldn't find any job applications that match your current search or filters.
                                Try broadening your scope or syncing new roles!
                            </p>
                        </div>
                    )}
                </div>
            ) : viewMode === 'GRID' ? (
                <JobGridView jobs={filteredJobs} />
            ) : (
                <div className="bg-white/40 dark:bg-slate-900/40 p-4 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 shadow-inner">
                    <KanbanBoard initialJobs={filteredJobs} />
                </div>
            )}

            <AskAI />
        </div>
    )
}

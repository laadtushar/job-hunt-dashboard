
"use client"

import { useState } from "react"
import { JobCard } from "@/components/dashboard/JobCard"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
// Correct import paths for shadcn/ui components
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

    const handleSync = async () => {
        setIsSyncing(true)
        try {
            const res = await fetch('/api/sync', {
                method: 'POST',
                body: JSON.stringify({ limit: syncLimit })
            })
            const data = await res.json()
            if (data.success) {
                window.location.reload()
            }
        } catch (e) {
            console.error(e)
        } finally {
            setIsSyncing(false)
        }
    }

    const filteredJobs = jobs.filter(job => {
        const matchesSearch = job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
            job.role.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesStatus = statusFilter === "ALL" || job.status === statusFilter

        return matchesSearch && matchesStatus
    })

    // Group stats
    const stats = {
        total: jobs.length,
        interview: jobs.filter(j => j.status === 'INTERVIEW').length,
        offer: jobs.filter(j => j.status === 'OFFER').length,
        responseRate: jobs.length > 0 ? Math.round((jobs.filter(j => j.status !== 'APPLIED' && j.status !== 'GHOSTED').length / jobs.length) * 100) : 0
    }

    return (
        <div className="container mx-auto py-8 px-4">
            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border">
                    <div className="text-sm text-gray-500 font-medium">Total Applications</div>
                    <div className="text-3xl font-bold mt-2">{stats.total}</div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border">
                    <div className="text-sm text-gray-500 font-medium">Active Interviews</div>
                    <div className="text-3xl font-bold text-orange-600 mt-2">{stats.interview}</div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border">
                    <div className="text-sm text-gray-500 font-medium">Offers Received</div>
                    <div className="text-3xl font-bold text-green-600 mt-2">{stats.offer}</div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border">
                    <div className="text-sm text-gray-500 font-medium">Response Rate</div>
                    <div className="text-3xl font-bold text-blue-600 mt-2">{stats.responseRate}%</div>
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-4 mb-6 justify-between items-center bg-white p-4 rounded-lg border shadow-sm sticky top-0 z-10">
                <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto items-center">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search companies, roles..."
                            className="pl-8"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full md:w-[180px]">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Statuses</SelectItem>
                            <SelectItem value="APPLIED">Applied</SelectItem>
                            <SelectItem value="SCREEN">Screening</SelectItem>
                            <SelectItem value="INTERVIEW">Interview</SelectItem>
                            <SelectItem value="OFFER">Offer</SelectItem>
                            <SelectItem value="REJECTED">Rejected</SelectItem>
                            <SelectItem value="GHOSTED">Ghosted</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex gap-2 w-full md:w-auto items-center">
                    <div className="flex items-center gap-2 mr-2">
                        <span className="text-sm text-gray-500 whitespace-nowrap">Check last:</span>
                        <Input
                            type="number"
                            className="w-16 h-9"
                            value={syncLimit}
                            onChange={(e) => setSyncLimit(Number(e.target.value))}
                            min={1}
                            max={500}
                        />
                        <span className="text-sm text-gray-500">emails</span>
                    </div>
                    <Button variant="outline" onClick={handleSync} disabled={isSyncing} className="w-full md:w-auto">
                        <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                        {isSyncing ? 'Syncing...' : 'Sync Gmail'}
                    </Button>
                    <Button className="w-full md:w-auto">
                        <Plus className="mr-2 h-4 w-4" /> Add Application
                    </Button>
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredJobs.map(job => (
                    <JobCard key={job.id} job={job} />
                ))}
            </div>

            {filteredJobs.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400 border-2 border-dashed rounded-xl bg-slate-50">
                    <Search className="h-10 w-10 mb-4 opacity-20" />
                    <p>No applications found matching your criteria.</p>
                    <Button variant="link" onClick={handleSync}>Try syncing with Gmail</Button>
                </div>
            )}
        </div>
    )
}

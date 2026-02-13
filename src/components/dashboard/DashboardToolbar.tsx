
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { RefreshCw, Search } from "lucide-react"
import { MaintenanceControls } from "@/components/dashboard/MaintenanceControls"

interface DashboardToolbarProps {
    searchTerm: string
    setSearchTerm: (term: string) => void
    statusFilter: string
    setStatusFilter: (status: string) => void
    sortOrder: string
    setSortOrder: (order: string) => void
    syncLimit: number
    setSyncLimit: (limit: number) => void
    isSyncing: boolean
    handleSync: () => void
}

export function DashboardToolbar({
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    sortOrder,
    setSortOrder,
    syncLimit,
    setSyncLimit,
    isSyncing,
    handleSync
}: DashboardToolbarProps) {
    return (
        <div className="flex flex-col gap-4 bg-card p-4 rounded-xl border shadow-sm">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                {/* Search & Filter Group */}
                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
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
                        <SelectTrigger className="w-full sm:w-[140px]">
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
                    <Select value={sortOrder} onValueChange={setSortOrder}>
                        <SelectTrigger className="w-full sm:w-[140px]">
                            <SelectValue placeholder="Sort By" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="NEWEST">Newest First</SelectItem>
                            <SelectItem value="OLDEST">Oldest First</SelectItem>
                            <SelectItem value="UPDATED">Last Updated</SelectItem>
                            <SelectItem value="COMPANY">Company (A-Z)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Sync & Maintenance Actions */}
                <div className="flex flex-col sm:flex-row gap-2 items-center w-full md:w-auto">
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        <span className="text-sm text-muted-foreground whitespace-nowrap">Limit:</span>
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
                        className={`w-full sm:w-auto ${isSyncing ? "opacity-80" : ""}`}
                    >
                        <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                        {isSyncing ? 'Syncing...' : 'Sync Emails'}
                    </Button>
                    <div className="w-full sm:w-auto flex justify-end">
                        <MaintenanceControls />
                    </div>
                </div>
            </div>
        </div>
    )
}

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { RefreshCw, Search, LayoutGrid, List } from "lucide-react"
import { MaintenanceControls } from "@/components/dashboard/MaintenanceControls"

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface DashboardToolbarProps {
    searchTerm: string
    setSearchTerm: (term: string) => void
    statusFilter: string
    setStatusFilter: (status: string) => void
    sortOrder: string
    setSortOrder: (order: string) => void
    viewMode: 'BOARD' | 'GRID'
    setViewMode: (mode: 'BOARD' | 'GRID') => void
    syncLimit: number
    setSyncLimit: (limit: number) => void
    afterDate: string
    setAfterDate: (date: string) => void
    beforeDate: string
    setBeforeDate: (date: string) => void
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
    viewMode,
    setViewMode,
    syncLimit,
    setSyncLimit,
    afterDate,
    setAfterDate,
    beforeDate,
    setBeforeDate,
    isSyncing,
    handleSync
}: DashboardToolbarProps) {
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return (
            <div className="mb-10 p-6 rounded-3xl bg-white/50 border border-dashed animate-pulse" />
        )
    }

    return (
        <div className="mb-10 space-y-4">
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 bg-white/60 dark:bg-slate-900/40 p-3 md:p-2 rounded-3xl md:rounded-[3rem] border border-slate-200/60 dark:border-slate-800/60 backdrop-blur-xl shadow-2xl shadow-blue-500/5 transition-all duration-500">
                {/* Search - Primary focus */}
                <div className="relative flex-1 group min-w-0">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 transition-colors group-focus-within:text-blue-500" />
                    <Input
                        placeholder="Search applications..."
                        className="pl-12 h-14 md:h-12 bg-white dark:bg-slate-950 border-none rounded-2xl md:rounded-[2rem] focus:ring-4 focus:ring-blue-500/10 placeholder:text-slate-400 font-medium transition-all shadow-inner"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Filters & Actions Group */}
                <div className="relative flex flex-wrap items-center gap-3 overflow-x-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent">
                    {/* Status Filter */}
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="flex-1 md:flex-none w-full md:w-[150px] h-14 md:h-12 bg-white dark:bg-slate-950 border-none rounded-2xl md:rounded-[2rem] shadow-inner font-bold text-slate-600 dark:text-slate-300">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-slate-200 dark:border-slate-800">
                            <SelectItem value="ALL">All Status</SelectItem>
                            <SelectItem value="APPLIED">Applied</SelectItem>
                            <SelectItem value="SCREEN">Screening</SelectItem>
                            <SelectItem value="INTERVIEW">Interview</SelectItem>
                            <SelectItem value="OFFER">Offer</SelectItem>
                            <SelectItem value="REJECTED">Rejected</SelectItem>
                            <SelectItem value="GHOSTED">Ghosted</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Sort Order */}
                    <Select value={sortOrder} onValueChange={setSortOrder}>
                        <SelectTrigger className="flex-1 md:flex-none w-full md:w-[150px] h-14 md:h-12 bg-white dark:bg-slate-950 border-none rounded-2xl md:rounded-[2rem] shadow-inner font-bold text-slate-600 dark:text-slate-300">
                            <SelectValue placeholder="Sort By" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-slate-200 dark:border-slate-800">
                            <SelectItem value="NEWEST">Newest First</SelectItem>
                            <SelectItem value="OLDEST">Oldest First</SelectItem>
                            <SelectItem value="UPDATED">Last Updated</SelectItem>
                            <SelectItem value="COMPANY">Company Name</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* View Toggle */}
                    <div className="flex items-center gap-1 bg-white dark:bg-slate-950 p-1 rounded-2xl md:rounded-[2rem] shadow-inner h-14 md:h-12">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setViewMode('BOARD')}
                            className={`rounded-xl md:rounded-full h-10 w-10 transition-all ${viewMode === 'BOARD' ? 'bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}
                        >
                            <LayoutGrid className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setViewMode('GRID')}
                            className={`rounded-xl md:rounded-full h-10 w-10 transition-all ${viewMode === 'GRID' ? 'bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}
                        >
                            <List className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Date Range & Limit Group */}
                    <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto no-scrollbar py-2 md:py-0">
                        <TooltipProvider>
                            {/* After (From) */}
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="flex items-center gap-2 bg-white dark:bg-slate-950 px-3 h-14 md:h-12 rounded-2xl md:rounded-[2rem] shadow-inner min-w-[140px]">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">From</span>
                                        <Input
                                            type="date"
                                            className="border-none bg-transparent shadow-none focus:ring-0 p-0 font-bold text-slate-700 dark:text-slate-300 text-xs w-full"
                                            value={afterDate}
                                            onChange={(e) => setAfterDate(e.target.value)}
                                        />
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent className="rounded-xl font-bold text-xs bg-slate-900 text-white border-none px-3 py-1.5 shadow-xl">
                                    Start scanning from this date
                                </TooltipContent>
                            </Tooltip>

                            {/* Before (To) */}
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="flex items-center gap-2 bg-white dark:bg-slate-950 px-3 h-14 md:h-12 rounded-2xl md:rounded-[2rem] shadow-inner min-w-[140px]">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">To</span>
                                        <Input
                                            type="date"
                                            className="border-none bg-transparent shadow-none focus:ring-0 p-0 font-bold text-slate-700 dark:text-slate-300 text-xs w-full"
                                            value={beforeDate}
                                            onChange={(e) => setBeforeDate(e.target.value)}
                                            placeholder="Optional"
                                        />
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent className="rounded-xl font-bold text-xs bg-slate-900 text-white border-none px-3 py-1.5 shadow-xl">
                                    End scan at this date (Optional)
                                </TooltipContent>
                            </Tooltip>

                            {/* Sync Limit */}
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="flex items-center gap-3 bg-white dark:bg-slate-950 px-4 h-14 md:h-12 rounded-2xl md:rounded-[2rem] shadow-inner flex-1 md:flex-none cursor-help">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Limit</span>
                                        <Input
                                            type="number"
                                            className="w-10 h-8 border-none bg-transparent shadow-none focus:ring-0 p-0 font-black text-blue-600 dark:text-blue-400 text-center text-sm"
                                            value={syncLimit}
                                            onChange={(e) => setSyncLimit(Number(e.target.value))}
                                            min={1}
                                            max={1000}
                                        />
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent className="rounded-xl font-bold text-xs bg-slate-900 text-white border-none px-3 py-1.5 shadow-xl">
                                    Max emails to fetch from Gmail
                                </TooltipContent>
                            </Tooltip>

                            <MaintenanceControls />

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        disabled={isSyncing}
                                        className={`h-14 md:h-12 px-6 md:px-8 rounded-2xl md:rounded-[2rem] font-black text-xs md:text-sm uppercase tracking-wider gap-2 shadow-xl transition-all active:scale-95 flex-1 md:flex-none ${isSyncing
                                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                                            : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-blue-500/25'
                                            }`}
                                        onClick={handleSync}
                                    >
                                        <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                                        {isSyncing ? 'Syncing...' : 'Sync Gmail'}
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent className="rounded-xl font-bold text-xs bg-indigo-600 text-white border-none px-3 py-1.5 shadow-xl">
                                    Trigger AI inbox scan
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                </div>
            </div>
        </div>
    )
}

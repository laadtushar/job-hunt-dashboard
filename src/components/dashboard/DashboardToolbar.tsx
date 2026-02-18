import * as React from "react"
import { DateRangePicker } from "@/components/dashboard/DateRangePicker"
import { format } from "date-fns"
import { DateRange } from "react-day-picker"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { RefreshCw, Search, LayoutGrid, List, KanbanSquare, SlidersHorizontal, Filter } from "lucide-react"
import { MaintenanceControls } from "@/components/dashboard/MaintenanceControls"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"

interface DashboardToolbarProps {
    searchTerm: string
    setSearchTerm: (term: string) => void
    statusFilter: string
    setStatusFilter: (status: string) => void
    sortOrder: string
    setSortOrder: (order: string) => void
    viewMode: 'BOARD' | 'GRID' | 'PIPELINE'
    setViewMode: (mode: 'BOARD' | 'GRID' | 'PIPELINE') => void
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

    const handleDateRangeChange = (newDate: DateRange | undefined) => {
        if (newDate?.from) {
            setAfterDate(format(newDate.from, 'yyyy-MM-dd'))
        }
        if (newDate?.to) {
            setBeforeDate(format(newDate.to, 'yyyy-MM-dd'))
        } else {
            setBeforeDate('')
        }
    }

    const dateRange = {
        from: afterDate ? new Date(afterDate) : undefined,
        to: beforeDate ? new Date(beforeDate) : undefined
    }

    // Active filters count for the badge
    const activeFiltersCount = [
        statusFilter !== 'ALL',
        afterDate,
        beforeDate
    ].filter(Boolean).length

    if (!mounted) {
        return (
            <div className="mb-8 p-6 rounded-3xl bg-white/50 border border-dashed animate-pulse h-32" />
        )
    }

    return (
        <div className="mb-8 space-y-4">
            <div className="flex flex-col gap-4 bg-white/60 dark:bg-slate-900/40 p-4 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 backdrop-blur-xl shadow-sm transition-all duration-500">

                {/* Top Row: Search & View Toggles (Desktop) / Mobile Header */}
                <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                    {/* Search - Full width on mobile, expanded on desktop */}
                    <div className="relative w-full md:max-w-xl group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 transition-colors group-focus-within:text-blue-500" />
                        <Input
                            placeholder="Search applications..."
                            className="pl-11 h-12 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder:text-slate-400 font-medium transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Desktop Actions Row */}
                    <div className="hidden md:flex items-center gap-3">
                        {/* View Toggle */}
                        <div className="flex items-center gap-1 bg-white dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 h-10">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setViewMode('BOARD')}
                                className={`rounded-lg h-8 px-3 transition-all ${viewMode === 'BOARD' ? 'bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 font-medium' : 'text-slate-400'}`}
                            >
                                <LayoutGrid className="h-4 w-4 mr-1.5" />
                                Board
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setViewMode('GRID')}
                                className={`rounded-lg h-8 px-3 transition-all ${viewMode === 'GRID' ? 'bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 font-medium' : 'text-slate-400'}`}
                            >
                                <List className="h-4 w-4 mr-1.5" />
                                Grid
                            </Button>
                        </div>

                        <MaintenanceControls />
                    </div>
                </div>

                {/* Secondary Row: Filters (Desktop) & Mobile Actions */}
                <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">

                    {/* Mobile Only: Action Bar */}
                    <div className="flex md:hidden items-center gap-2">
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="outline" className="flex-1 h-11 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300">
                                    <SlidersHorizontal className="h-4 w-4 mr-2" />
                                    Filters
                                    {activeFiltersCount > 0 && (
                                        <Badge variant="secondary" className="ml-2 h-5 min-w-5 px-1 rounded-full text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                            {activeFiltersCount}
                                        </Badge>
                                    )}
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="bottom" className="rounded-t-[2rem] h-[85vh] p-6 max-w-none sm:max-w-none">
                                <SheetHeader className="mb-6 text-left">
                                    <SheetTitle className="text-2xl font-bold">Filters & Options</SheetTitle>
                                    <SheetDescription>
                                        Refine your job applications view
                                    </SheetDescription>
                                </SheetHeader>

                                <div className="space-y-6 overflow-y-auto pb-20">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-500 uppercase tracking-wider">View Mode</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <Button
                                                variant={viewMode === 'BOARD' ? 'default' : 'outline'}
                                                onClick={() => setViewMode('BOARD')}
                                                className="h-12 rounded-xl justify-start"
                                            >
                                                <LayoutGrid className="h-4 w-4 mr-2" /> Board
                                            </Button>
                                            <Button
                                                variant={viewMode === 'GRID' ? 'default' : 'outline'}
                                                onClick={() => setViewMode('GRID')}
                                                className="h-12 rounded-xl justify-start"
                                            >
                                                <List className="h-4 w-4 mr-2" /> Grid
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-500 uppercase tracking-wider">Status</label>
                                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                                            <SelectTrigger className="h-12 rounded-xl bg-slate-50 dark:bg-slate-900 border-transparent">
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

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-500 uppercase tracking-wider">Sort By</label>
                                        <Select value={sortOrder} onValueChange={setSortOrder}>
                                            <SelectTrigger className="h-12 rounded-xl bg-slate-50 dark:bg-slate-900 border-transparent">
                                                <SelectValue placeholder="Sort By" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="NEWEST">Newest First</SelectItem>
                                                <SelectItem value="OLDEST">Oldest First</SelectItem>
                                                <SelectItem value="UPDATED">Last Updated</SelectItem>
                                                <SelectItem value="COMPANY">Company Name</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-500 uppercase tracking-wider">Date Range</label>
                                        <DateRangePicker
                                            date={dateRange}
                                            setDate={handleDateRangeChange}
                                            className="w-full"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-500 uppercase tracking-wider">Sync Limit</label>
                                        <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900 px-4 h-12 rounded-xl border border-transparent">
                                            <span className="text-sm text-slate-500">Max emails:</span>
                                            <Input
                                                type="number"
                                                className="w-20 h-8 border-none bg-transparent shadow-none focus:ring-0 p-0 font-bold"
                                                value={syncLimit}
                                                onChange={(e) => setSyncLimit(Number(e.target.value))}
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                                        <MaintenanceControls />
                                    </div>
                                </div>
                            </SheetContent>
                        </Sheet>

                        <Button
                            disabled={isSyncing}
                            size="icon"
                            className={`h-11 w-11 rounded-xl shadow-md transition-all active:scale-95 shrink-0 ${isSyncing
                                ? 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                                }`}
                            onClick={handleSync}
                        >
                            <RefreshCw className={`h-5 w-5 ${isSyncing ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>

                    {/* Desktop Filters Row */}
                    <div className="hidden md:flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2">
                            <Filter className="h-4 w-4 text-slate-400" />

                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-[140px] h-10 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-lg text-sm font-medium shadow-sm hover:bg-slate-50 transition-colors">
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
                                <SelectTrigger className="w-[140px] h-10 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-lg text-sm font-medium shadow-sm hover:bg-slate-50 transition-colors">
                                    <SelectValue placeholder="Sort By" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="NEWEST">Newest First</SelectItem>
                                    <SelectItem value="OLDEST">Oldest First</SelectItem>
                                    <SelectItem value="UPDATED">Last Updated</SelectItem>
                                    <SelectItem value="COMPANY">Company Name</SelectItem>
                                </SelectContent>
                            </Select>

                            <DateRangePicker
                                date={dateRange}
                                setDate={handleDateRangeChange}
                                className="h-10"
                            />
                        </div>

                        <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-2" />

                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="flex items-center gap-2 bg-white dark:bg-slate-950 px-3 h-10 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Limit</span>
                                        <Input
                                            type="number"
                                            className="w-12 h-6 border-none bg-transparent shadow-none focus:ring-0 p-0 font-bold text-slate-700 dark:text-slate-300 text-right text-sm"
                                            value={syncLimit}
                                            onChange={(e) => setSyncLimit(Number(e.target.value))}
                                            min={1}
                                            max={1000}
                                        />
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent>Max emails to fetch</TooltipContent>
                            </Tooltip>

                            <Button
                                disabled={isSyncing}
                                className={`h-10 px-4 rounded-lg font-medium text-sm transition-all shadow-sm ${isSyncing
                                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                    }`}
                                onClick={handleSync}
                            >
                                <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                                {isSyncing ? 'Syncing...' : 'Sync'}
                            </Button>
                        </TooltipProvider>
                    </div>
                </div>
            </div>
        </div>
    )
}

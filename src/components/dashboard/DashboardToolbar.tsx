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
import { RefreshCw, Search, LayoutGrid, List, SlidersHorizontal, Filter, X, EyeOff, Plus } from "lucide-react"
import { MaintenanceControls } from "@/components/dashboard/MaintenanceControls"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

const STATUS_OPTIONS = [
    { value: "APPLIED", label: "Applied", color: "bg-blue-500" },
    { value: "SCREEN", label: "Screening", color: "bg-purple-500" },
    { value: "INTERVIEW", label: "Interview", color: "bg-cyan-500" },
    { value: "OFFER", label: "Offer", color: "bg-green-500" },
    { value: "REJECTED", label: "Rejected", color: "bg-red-500" },
    { value: "GHOSTED", label: "Ghosted", color: "bg-amber-500" },
]

interface DashboardToolbarProps {
    searchTerm: string
    setSearchTerm: (term: string) => void
    statusFilters: string[]
    setStatusFilters: (filters: string[]) => void
    sourceFilter: string
    setSourceFilter: (source: string) => void
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
    hiddenCount: number
    onClearHidden: () => void
}

export function DashboardToolbar({
    searchTerm,
    setSearchTerm,
    statusFilters,
    setStatusFilters,
    sourceFilter,
    setSourceFilter,
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
    handleSync,
    hiddenCount,
    onClearHidden
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

    const toggleStatus = (status: string) => {
        if (statusFilters.includes(status)) {
            setStatusFilters(statusFilters.filter((s) => s !== status))
        } else {
            setStatusFilters([...statusFilters, status])
        }
    }

    // Active filters count for the badge
    const activeFiltersCount = [
        statusFilters.length > 0,
        sourceFilter !== "ALL",
        afterDate && afterDate !== "2024-01-01",
        beforeDate,
        hiddenCount > 0,
    ].filter(Boolean).length

    const clearAllFilters = () => {
        setStatusFilters([])
        setSourceFilter("ALL")
        setSortOrder("NEWEST")
        setSearchTerm("")
        onClearHidden()
    }

    if (!mounted) {
        return (
            <div className="mb-8 p-6 rounded-3xl bg-white/50 border border-dashed animate-pulse h-32" />
        )
    }

    return (
        <div className="mb-8 space-y-4">
            <div className="flex flex-col gap-4 bg-white/60 dark:bg-slate-900/40 p-4 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 backdrop-blur-xl shadow-sm transition-all duration-500">

                {/* Top Row: Search & View Toggles */}
                <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                    {/* Search */}
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

                {/* Multi-select Status Pills */}
                <div className="flex flex-wrap gap-2 items-center">
                    <Filter className="h-4 w-4 text-slate-400 shrink-0" />
                    {STATUS_OPTIONS.map((opt) => {
                        const isActive = statusFilters.includes(opt.value)
                        return (
                            <button
                                key={opt.value}
                                onClick={() => toggleStatus(opt.value)}
                                className={`
                                    flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border
                                    ${isActive
                                        ? `${opt.color} text-white border-transparent shadow-sm`
                                        : 'bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                                    }
                                `}
                            >
                                <div className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-white/60' : opt.color}`} />
                                {opt.label}
                            </button>
                        )
                    })}

                    {/* Divider */}
                    <div className="h-5 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

                    {/* Source Filter */}
                    <Select value={sourceFilter} onValueChange={setSourceFilter}>
                        <SelectTrigger className="w-[120px] h-8 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium shadow-sm">
                            <SelectValue placeholder="Source" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Sources</SelectItem>
                            <SelectItem value="GMAIL">Gmail</SelectItem>
                            <SelectItem value="MANUAL">Manual</SelectItem>
                            <SelectItem value="LINKEDIN">LinkedIn</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Sort */}
                    <Select value={sortOrder} onValueChange={setSortOrder}>
                        <SelectTrigger className="w-[130px] h-8 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium shadow-sm">
                            <SelectValue placeholder="Sort By" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="NEWEST">Newest First</SelectItem>
                            <SelectItem value="OLDEST">Oldest First</SelectItem>
                            <SelectItem value="UPDATED">Last Updated</SelectItem>
                            <SelectItem value="COMPANY">Company Name</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Date Range */}
                    <DateRangePicker
                        date={dateRange}
                        setDate={handleDateRangeChange}
                        className="h-8"
                    />

                    {/* Hidden count */}
                    {hiddenCount > 0 && (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button
                                        onClick={onClearHidden}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
                                    >
                                        <EyeOff className="h-3 w-3" />
                                        {hiddenCount} hidden
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent className="rounded-xl font-bold text-xs bg-amber-600 text-white border-none px-3 py-1.5 shadow-xl">
                                    Click to unhide all
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}

                    {/* Clear All */}
                    {activeFiltersCount > 0 && (
                        <button
                            onClick={clearAllFilters}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[10px] font-bold text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                            <X className="h-3 w-3" />
                            Clear all
                        </button>
                    )}

                    <div className="h-5 w-px bg-slate-200 dark:bg-slate-800 mx-1 hidden md:block" />

                    {/* Sync Controls (Desktop) */}
                    <div className="hidden md:flex items-center gap-2">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="flex items-center gap-2 bg-white dark:bg-slate-950 px-3 h-8 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
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
                                className={`h-8 px-4 rounded-xl font-medium text-xs transition-all shadow-sm ${isSyncing
                                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                    }`}
                                onClick={handleSync}
                            >
                                <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isSyncing ? 'animate-spin' : ''}`} />
                                {isSyncing ? 'Syncing...' : 'Sync'}
                            </Button>
                        </TooltipProvider>

                        <Link href="/import">
                            <Button
                                className="h-8 px-4 rounded-xl font-medium text-xs transition-all shadow-sm bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 dark:text-slate-900 text-white"
                            >
                                <Plus className="h-3.5 w-3.5 mr-1.5" />
                                Paste Job
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Mobile Actions */}
                <div className="flex md:hidden items-center gap-2">
                    <MaintenanceControls />
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="outline" className="flex-1 h-11 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300">
                                <SlidersHorizontal className="h-4 w-4 mr-2" />
                                More Options
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

                    <Link href="/import" className="shrink-0">
                        <Button
                            size="icon"
                            className="h-11 w-11 rounded-xl shadow-md transition-all active:scale-95 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 dark:text-slate-900 text-white"
                        >
                            <Plus className="h-5 w-5" />
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    )
}

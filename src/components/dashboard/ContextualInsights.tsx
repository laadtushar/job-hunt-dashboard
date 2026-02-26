"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    AlertCircle, TrendingUp, Target, Lightbulb,
    Clock, MessageSquareWarning, CheckCircle2, BarChart3,
    ChevronRight, RefreshCw, Sparkles
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { motion, Variants } from "framer-motion"

interface Insight {
    id: string
    category: string
    title: string
    description: string
    priority: number
}

const CATEGORY_CONFIG: Record<string, { icon: any; color: string; bg: string; ring: string; tooltipBg: string; label: string }> = {
    URGENT: {
        icon: AlertCircle,
        color: "text-red-500 dark:text-red-400",
        bg: "bg-red-50 dark:bg-red-900/20",
        ring: "ring-red-500/10 dark:ring-red-500/20",
        tooltipBg: "bg-red-600",
        label: "Urgent"
    },
    FOLLOW_UP: {
        icon: MessageSquareWarning,
        color: "text-amber-500 dark:text-amber-400",
        bg: "bg-amber-50 dark:bg-amber-900/20",
        ring: "ring-amber-500/10 dark:ring-amber-500/20",
        tooltipBg: "bg-amber-600",
        label: "Follow Up"
    },
    TODO: {
        icon: CheckCircle2,
        color: "text-indigo-500 dark:text-indigo-400",
        bg: "bg-indigo-50 dark:bg-indigo-900/20",
        ring: "ring-indigo-500/10 dark:ring-indigo-500/20",
        tooltipBg: "bg-indigo-600",
        label: "To Do"
    },
    TREND: {
        icon: TrendingUp,
        color: "text-green-500 dark:text-green-400",
        bg: "bg-green-50 dark:bg-green-900/20",
        ring: "ring-green-500/10 dark:ring-green-500/20",
        tooltipBg: "bg-green-600",
        label: "Trend"
    },
    STRATEGY: {
        icon: Target,
        color: "text-blue-500 dark:text-blue-400",
        bg: "bg-blue-50 dark:bg-blue-900/20",
        ring: "ring-blue-500/10 dark:ring-blue-500/20",
        tooltipBg: "bg-blue-600",
        label: "Strategy"
    },
    MARKET: {
        icon: BarChart3,
        color: "text-violet-500 dark:text-violet-400",
        bg: "bg-violet-50 dark:bg-violet-900/20",
        ring: "ring-violet-500/10 dark:ring-violet-500/20",
        tooltipBg: "bg-violet-600",
        label: "Market"
    },
    OPTIMIZATION: {
        icon: Lightbulb,
        color: "text-cyan-500 dark:text-cyan-400",
        bg: "bg-cyan-50 dark:bg-cyan-900/20",
        ring: "ring-cyan-500/10 dark:ring-cyan-500/20",
        tooltipBg: "bg-cyan-600",
        label: "Optimization"
    }
}

const DEFAULT_CONFIG = {
    icon: Sparkles,
    color: "text-slate-500 dark:text-slate-400",
    bg: "bg-slate-50 dark:bg-slate-800",
    ring: "ring-slate-200 dark:ring-slate-800",
    tooltipBg: "bg-slate-600",
    label: "Insight"
}

export function ContextualInsights() {
    const [insights, setInsights] = useState<Insight[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)

    const fetchInsights = async () => {
        setLoading(true)
        setError(false)
        try {
            const res = await fetch("/api/insights/strategy")
            if (!res.ok) throw new Error("Failed to fetch")
            const data = await res.json()
            setInsights(data.insights || [])
        } catch {
            setError(true)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchInsights()
    }, [])

    // Loading skeleton
    if (loading) {
        return (
            <div className="space-y-5">
                <div className="flex items-center gap-3 px-1">
                    <div className="h-10 w-10 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
                    <div className="space-y-1.5">
                        <div className="h-4 w-48 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
                        <div className="h-3 w-32 rounded bg-slate-100 dark:bg-slate-800/50 animate-pulse" />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-48 rounded-3xl bg-white/50 dark:bg-slate-900/30 ring-1 ring-slate-200 dark:ring-slate-800 animate-pulse" />
                    ))}
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex items-center justify-center py-8 text-sm text-slate-400 gap-2">
                <AlertCircle className="h-4 w-4" />
                Failed to load insights.
                <Button variant="ghost" size="sm" onClick={fetchInsights} className="ml-2 h-7 text-xs">
                    Retry
                </Button>
            </div>
        )
    }

    if (insights.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="h-14 w-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                    <Sparkles className="h-6 w-6 text-slate-300 dark:text-slate-600" />
                </div>
                <p className="text-sm text-slate-500 font-medium">No insights yet. Sync your emails to get started.</p>
            </div>
        )
    }

    const container: Variants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    }

    const itemVariant: Variants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { type: "spring", bounce: 0.4 } }
    }

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="absolute inset-0 bg-blue-500 rounded-lg blur-lg opacity-30 animate-pulse" />
                        <div className="relative p-2.5 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-xl">
                            <Target className="h-5 w-5 text-white" />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-slate-900 dark:text-white leading-tight">Insights & Strategy</h2>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-[0.15em]">AI-Powered Recommendations</p>
                    </div>
                </div>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-lg text-slate-400 hover:text-blue-500"
                                onClick={fetchInsights}
                            >
                                <RefreshCw className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent className="rounded-xl font-bold text-xs bg-slate-900 text-white border-none px-3 py-1.5 shadow-xl">
                            Refresh insights
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>

            {/* Insights Grid */}
            <motion.div
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                variants={container}
                initial="hidden"
                animate="show"
            >
                {insights.slice(0, 8).map((insight) => {
                    const config = CATEGORY_CONFIG[insight.category] || DEFAULT_CONFIG
                    const Icon = config.icon

                    return (
                        <motion.div key={insight.id} variants={itemVariant} className="h-full">
                            <Card
                                className={`group relative h-full flex flex-col border-none bg-white dark:bg-slate-900/40 backdrop-blur-xl ring-1 ${config.ring} hover:ring-blue-500/30 transition-all duration-500 shadow-sm hover:shadow-xl hover:-translate-y-1 overflow-hidden rounded-2xl`}
                            >
                                {/* Hover glow */}
                                <div className={`absolute -top-10 -right-10 w-28 h-28 rounded-full blur-3xl opacity-0 group-hover:opacity-15 transition-opacity duration-700 ${config.bg}`} />

                                <CardHeader className="p-5 pb-3 relative">
                                    <div className="flex items-start justify-between">
                                        <div className={`p-2.5 rounded-xl shadow-sm ${config.bg}`}>
                                            <Icon className={`h-5 w-5 ${config.color}`} />
                                        </div>
                                        <Badge
                                            variant="outline"
                                            className={`text-[9px] font-black uppercase tracking-widest border-none ${config.bg} ${config.color} px-2 py-0.5`}
                                        >
                                            {config.label}
                                        </Badge>
                                    </div>
                                </CardHeader>

                                <CardContent className="px-5 pb-5 flex-1 flex flex-col relative">
                                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1.5 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                        {insight.title}
                                    </h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-3 flex-1">
                                        {insight.description}
                                    </p>

                                    {/* Priority dots */}
                                    <div className="flex gap-0.5 mt-3">
                                        {[1, 2, 3].map((p) => (
                                            <div
                                                key={p}
                                                className={`h-1 w-2 rounded-full ${p <= (4 - insight.priority) ? config.color.replace("text-", "bg-") : "bg-slate-200 dark:bg-slate-800"}`}
                                            />
                                        ))}
                                    </div>
                                </CardContent>

                                {/* Bottom accent bar */}
                                <div className={`h-0.5 w-full translate-y-0.5 group-hover:translate-y-0 transition-transform ${config.color.replace("text-", "bg-")}`} />
                            </Card>
                        </motion.div>
                    )
                })}
            </motion.div>
        </div>
    )
}

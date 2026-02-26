import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Briefcase, Zap, Users, CheckCircle, Search, XCircle, Ghost, Phone, Send, Calendar } from "lucide-react"

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export interface DashboardStats {
    total: number
    applied: number
    screen: number
    interview: number
    offer: number
    rejected: number
    ghosted: number
}

export function DashboardHeader({ stats }: { stats: DashboardStats }) {
    const cards = [
        {
            title: "Total Jobs",
            value: stats.total,
            icon: Briefcase,
            tooltip: "Total applications detected in your ecosystem",
            // Slate
            theme: {
                ring: "ring-slate-200 dark:ring-slate-800",
                blur: "bg-slate-100 dark:bg-slate-800",
                title: "text-slate-400 dark:text-slate-500",
                iconBg: "bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700",
                iconText: "text-slate-400 dark:text-slate-500",
                valueText: "text-slate-900 dark:text-white",
                bar: "bg-slate-100 dark:bg-slate-800",
                tooltipBg: "bg-slate-900",
            }
        },
        {
            title: "Applied",
            value: stats.applied,
            icon: Send,
            tooltip: "Applications submitted, waiting for response",
            // Blue
            theme: {
                ring: "ring-blue-500/10 dark:ring-blue-500/20",
                blur: "bg-blue-500",
                title: "text-blue-500 dark:text-blue-400",
                iconBg: "bg-blue-50 dark:bg-blue-900/30 border-blue-100/30 dark:border-blue-800/50",
                iconText: "text-blue-600 dark:text-blue-400",
                valueText: "text-blue-700 dark:text-blue-400",
                bar: "bg-blue-100 dark:bg-blue-900/30",
                tooltipBg: "bg-blue-600",
            }
        },
        {
            title: "Screening",
            value: stats.screen,
            icon: Phone,
            tooltip: "Initial recruiter or phone screens",
            // Purple
            theme: {
                ring: "ring-purple-500/10 dark:ring-purple-500/20",
                blur: "bg-purple-500",
                title: "text-purple-500 dark:text-purple-400",
                iconBg: "bg-purple-50 dark:bg-purple-900/30 border-purple-100/30 dark:border-purple-800/50",
                iconText: "text-purple-600 dark:text-purple-400",
                valueText: "text-purple-700 dark:text-purple-400",
                bar: "bg-purple-100 dark:bg-purple-900/30",
                tooltipBg: "bg-purple-600",
            }
        },
        {
            title: "Interviews",
            value: stats.interview,
            icon: Calendar,
            tooltip: "Active technical or behavioral interviews",
            // Indigo/Cyan maybe? Let's use Cyan/Teal
            theme: {
                ring: "ring-cyan-500/10 dark:ring-cyan-500/20",
                blur: "bg-cyan-500",
                title: "text-cyan-500 dark:text-cyan-400",
                iconBg: "bg-cyan-50 dark:bg-cyan-900/30 border-cyan-100/30 dark:border-cyan-800/50",
                iconText: "text-cyan-600 dark:text-cyan-400",
                valueText: "text-cyan-700 dark:text-cyan-400",
                bar: "bg-cyan-100 dark:bg-cyan-900/30",
                tooltipBg: "bg-cyan-600",
            }
        },
        {
            title: "Offers",
            value: stats.offer,
            icon: CheckCircle,
            tooltip: "Job offers received",
            // Green
            theme: {
                ring: "ring-green-500/10 dark:ring-green-500/20",
                blur: "bg-green-500",
                title: "text-green-500 dark:text-green-400",
                iconBg: "bg-green-50 dark:bg-green-900/30 border-green-100/30 dark:border-green-800/50",
                iconText: "text-green-600 dark:text-green-400",
                valueText: "text-green-700 dark:text-green-400",
                bar: "bg-green-100 dark:bg-green-900/30",
                tooltipBg: "bg-green-600",
            }
        },
        {
            title: "Rejected",
            value: stats.rejected,
            icon: XCircle,
            tooltip: "Applications that ended in rejection",
            // Red
            theme: {
                ring: "ring-red-500/10 dark:ring-red-500/20",
                blur: "bg-red-500",
                title: "text-red-500 dark:text-red-400",
                iconBg: "bg-red-50 dark:bg-red-900/30 border-red-100/30 dark:border-red-800/50",
                iconText: "text-red-600 dark:text-red-400",
                valueText: "text-red-700 dark:text-red-400",
                bar: "bg-red-100 dark:bg-red-900/30",
                tooltipBg: "bg-red-600",
            }
        },
        {
            title: "Ghosted",
            value: stats.ghosted,
            icon: Ghost,
            tooltip: "Zero response after a significant time",
            // Orange/Amber
            theme: {
                ring: "ring-amber-500/10 dark:ring-amber-500/20",
                blur: "bg-amber-500",
                title: "text-amber-500 dark:text-amber-400",
                iconBg: "bg-amber-50 dark:bg-amber-900/30 border-amber-100/30 dark:border-amber-800/50",
                iconText: "text-amber-600 dark:text-amber-400",
                valueText: "text-amber-700 dark:text-amber-400",
                bar: "bg-amber-100 dark:bg-amber-900/30",
                tooltipBg: "bg-amber-600",
            }
        }
    ]

    return (
        <TooltipProvider>
            <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
                {cards.map((card, i) => {
                    const Icon = card.icon;
                    return (
                        <Tooltip key={i}>
                            <TooltipTrigger asChild>
                                <Card className={`overflow-hidden border-none shadow-xl bg-white dark:bg-slate-900/40 backdrop-blur-md relative group transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 ring-1 ${card.theme.ring} rounded-3xl cursor-help`}>
                                    <div className={`absolute -top-10 -right-10 h-32 w-32 rounded-full opacity-0 blur-3xl ${card.theme.blur} group-hover:opacity-10 transition-opacity duration-700`} />
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 p-5 pb-3 relative">
                                        <CardTitle className={`text-[10px] font-black tracking-[0.15em] uppercase ${card.theme.title}`}>
                                            {card.title}
                                        </CardTitle>
                                        <div className={`h-8 w-8 rounded-xl flex items-center justify-center border shadow-sm transition-transform group-hover:rotate-12 ${card.theme.iconBg}`}>
                                            <Icon className={`h-4 w-4 ${card.theme.iconText}`} />
                                        </div>
                                    </CardHeader>
                                    <CardContent className="px-5 pb-5 relative">
                                        <div className={`text-4xl font-black tracking-tighter tabular-nums leading-none ${card.theme.valueText}`}>
                                            {card.value}
                                        </div>
                                        <div className={`h-1.5 w-8 rounded-full mt-3 group-hover:w-full transition-all duration-700 ${card.theme.bar}`} />
                                    </CardContent>
                                </Card>
                            </TooltipTrigger>
                            <TooltipContent className={`rounded-xl font-bold text-xs text-white border-none px-3 py-1.5 shadow-xl ${card.theme.tooltipBg}`}>
                                {card.tooltip}
                            </TooltipContent>
                        </Tooltip>
                    )
                })}
            </div>
        </TooltipProvider>
    )
}

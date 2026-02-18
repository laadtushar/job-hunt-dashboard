"use client"

import { useState } from "react"
import { format } from "date-fns"
import {
    CheckCircle2, Circle, XCircle, Clock, Trash2, ChevronDown,
    Building2, Briefcase, AlertCircle, ArrowUp, ArrowRight, ArrowDown
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface TaskApplication {
    id: string
    company: string
    role: string
    status: string
}

export interface Task {
    id: string
    title: string
    description?: string | null
    priority: string
    status: string
    category?: string | null
    dueDate?: string | null
    aiGenerated: boolean
    completedAt?: string | null
    createdAt: string
    application?: TaskApplication | null
}

interface TaskCardProps {
    task: Task
    onStatusChange: (id: string, status: string) => void
    onDelete: (id: string) => void
}

const PRIORITY_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode; bar: string }> = {
    URGENT: {
        label: "Urgent",
        color: "text-red-600 dark:text-red-400",
        icon: <AlertCircle className="h-3.5 w-3.5" />,
        bar: "bg-red-500"
    },
    HIGH: {
        label: "High",
        color: "text-orange-600 dark:text-orange-400",
        icon: <ArrowUp className="h-3.5 w-3.5" />,
        bar: "bg-orange-500"
    },
    MEDIUM: {
        label: "Medium",
        color: "text-blue-600 dark:text-blue-400",
        icon: <ArrowRight className="h-3.5 w-3.5" />,
        bar: "bg-blue-500"
    },
    LOW: {
        label: "Low",
        color: "text-slate-500 dark:text-slate-400",
        icon: <ArrowDown className="h-3.5 w-3.5" />,
        bar: "bg-slate-400"
    },
}

const CATEGORY_CONFIG: Record<string, { label: string; color: string }> = {
    FOLLOW_UP: { label: "Follow Up", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" },
    INTERVIEW_PREP: { label: "Interview Prep", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
    APPLICATION: { label: "Application", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
    RESEARCH: { label: "Research", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" },
    NETWORKING: { label: "Networking", color: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300" },
}

const STATUS_APP_CONFIG: Record<string, string> = {
    APPLIED: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    SCREEN: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
    INTERVIEW: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
    OFFER: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    REJECTED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    GHOSTED: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
}

export function TaskCard({ task, onStatusChange, onDelete }: TaskCardProps) {
    const [loading, setLoading] = useState(false)
    const isDone = task.status === "DONE"
    const isDismissed = task.status === "DISMISSED"
    const priority = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.MEDIUM
    const category = task.category ? CATEGORY_CONFIG[task.category] : null

    const isOverdue = task.dueDate && !isDone && !isDismissed
        && new Date(task.dueDate) < new Date()

    const handleStatusToggle = async () => {
        setLoading(true)
        const newStatus = isDone ? "PENDING" : "DONE"
        await onStatusChange(task.id, newStatus)
        setLoading(false)
    }

    return (
        <div className={cn(
            "group relative flex gap-3 p-4 rounded-2xl border transition-all duration-200",
            isDone || isDismissed
                ? "bg-slate-50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800 opacity-60"
                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md"
        )}>
            {/* Priority bar */}
            <div className={cn("absolute left-0 top-3 bottom-3 w-1 rounded-full", priority.bar)} />

            {/* Status toggle */}
            <button
                onClick={handleStatusToggle}
                disabled={loading || isDismissed}
                className="shrink-0 mt-0.5 transition-transform hover:scale-110 disabled:opacity-50"
            >
                {isDone
                    ? <CheckCircle2 className="h-5 w-5 text-green-500" />
                    : isDismissed
                        ? <XCircle className="h-5 w-5 text-slate-400" />
                        : <Circle className="h-5 w-5 text-slate-300 dark:text-slate-600 hover:text-indigo-500" />
                }
            </button>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                    <p className={cn(
                        "font-semibold text-sm leading-snug",
                        isDone || isDismissed
                            ? "line-through text-slate-400"
                            : "text-slate-800 dark:text-slate-100"
                    )}>
                        {task.title}
                    </p>

                    {/* Actions */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 shrink-0"
                            >
                                <ChevronDown className="h-3.5 w-3.5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                            {!isDone && (
                                <DropdownMenuItem onClick={() => onStatusChange(task.id, "DONE")}>
                                    <CheckCircle2 className="h-3.5 w-3.5 mr-2 text-green-500" />
                                    Mark Done
                                </DropdownMenuItem>
                            )}
                            {task.status !== "IN_PROGRESS" && !isDone && !isDismissed && (
                                <DropdownMenuItem onClick={() => onStatusChange(task.id, "IN_PROGRESS")}>
                                    <Clock className="h-3.5 w-3.5 mr-2 text-blue-500" />
                                    In Progress
                                </DropdownMenuItem>
                            )}
                            {!isDismissed && (
                                <DropdownMenuItem onClick={() => onStatusChange(task.id, "DISMISSED")}>
                                    <XCircle className="h-3.5 w-3.5 mr-2 text-slate-400" />
                                    Dismiss
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                                onClick={() => onDelete(task.id)}
                                className="text-red-600 dark:text-red-400"
                            >
                                <Trash2 className="h-3.5 w-3.5 mr-2" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {task.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        {task.description}
                    </p>
                )}

                {/* Meta row */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    {/* Priority */}
                    <span className={cn("flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider", priority.color)}>
                        {priority.icon}
                        {priority.label}
                    </span>

                    {/* Category */}
                    {category && (
                        <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full", category.color)}>
                            {category.label}
                        </span>
                    )}

                    {/* AI badge */}
                    {task.aiGenerated && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                            ✦ AI
                        </span>
                    )}

                    {/* Due date */}
                    {task.dueDate && (
                        <span className={cn(
                            "flex items-center gap-1 text-[10px] font-semibold",
                            isOverdue ? "text-red-500" : "text-slate-400"
                        )}>
                            <Clock className="h-3 w-3" />
                            {isOverdue ? "Overdue · " : ""}
                            {format(new Date(task.dueDate), "MMM d")}
                        </span>
                    )}

                    {/* Linked application */}
                    {task.application && (
                        <span className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500 ml-auto">
                            <Building2 className="h-3 w-3" />
                            <span className="font-medium">{task.application.company}</span>
                            <span className={cn("px-1 py-0.5 rounded text-[9px] font-bold", STATUS_APP_CONFIG[task.application.status] || STATUS_APP_CONFIG.APPLIED)}>
                                {task.application.status}
                            </span>
                        </span>
                    )}
                </div>
            </div>
        </div>
    )
}

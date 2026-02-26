"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, MapPin } from "lucide-react";
import { JobApplication } from "@prisma/client";
import { motion } from "framer-motion";

interface KanbanCardProps {
    job: JobApplication;
}

export function KanbanCard({ job }: KanbanCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: job.id, data: { status: job.status } });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    // Stale check: if in APPLIED for > 14 days
    const isStale = job.status === "APPLIED" && job.appliedDate &&
        (new Date().getTime() - new Date(job.appliedDate).getTime() > 14 * 24 * 60 * 60 * 1000);

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="mb-3 touch-none">
            <motion.div layoutId={`job-card-${job.id}`}>
                <Card className={`cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow ${isStale ? "border-yellow-400 bg-yellow-50 dark:bg-yellow-900/10" : "bg-card"}`}>
                    <CardHeader className="p-3 pb-0 space-y-1">
                        <div className="flex justify-between items-start">
                            <CardTitle className="text-sm font-semibold truncate leading-tight">
                                {job.role}
                            </CardTitle>
                            {isStale && (
                                <span className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse" title="Stale: >14 days" />
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate font-medium">
                            {job.company}
                        </p>
                    </CardHeader>
                    <CardContent className="p-3 pt-2">
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                            {job.location && (
                                <div className="flex items-center gap-0.5">
                                    <MapPin className="h-3 w-3" />
                                    <span className="truncate max-w-[80px]">{job.location}</span>
                                </div>
                            )}
                            {job.appliedDate && (
                                <div className="flex items-center gap-0.5 ml-auto">
                                    <CalendarDays className="h-3 w-3" />
                                    <span>{new Date(job.appliedDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}

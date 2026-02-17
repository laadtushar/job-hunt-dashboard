"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { KanbanCard } from "./KanbanCard";
import { JobApplication } from "@prisma/client";
import { Badge } from "@/components/ui/badge";

interface KanbanColumnProps {
    id: string;
    title: string;
    jobs: JobApplication[];
    color: string;
}

export function KanbanColumn({ id, title, jobs, color }: KanbanColumnProps) {
    const { setNodeRef } = useDroppable({ id });

    return (
        <div className="flex flex-col h-full min-w-[280px] w-[300px] rounded-lg bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
            <div className={`p-4 font-semibold text-sm flex justify-between items-center border-b border-slate-200 dark:border-slate-800 ${color} bg-opacity-10 rounded-t-lg`}>
                <span className="uppercase tracking-wider">{title}</span>
                <Badge variant="secondary" className="font-mono text-xs">
                    {jobs.length}
                </Badge>
            </div>

            <div ref={setNodeRef} className="flex-1 p-2 overflow-y-auto">
                <SortableContext
                    id={id}
                    items={jobs.map(j => j.id)}
                    strategy={verticalListSortingStrategy}
                >
                    {jobs.map((job) => (
                        <KanbanCard key={job.id} job={job} />
                    ))}
                    {jobs.length === 0 && (
                        <div className="h-full flex items-center justify-center text-xs text-muted-foreground italic min-h-[100px] border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg m-2">
                            Drop items here
                        </div>
                    )}
                </SortableContext>
            </div>
        </div>
    );
}

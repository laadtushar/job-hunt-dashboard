"use client";

import { useState } from "react";
import { DndContext, DragOverlay, closestCorners, KeyboardSensor, PointerSensor, useSensor, useSensors, DragStartEvent, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { KanbanColumn } from "./KanbanColumn";
import { KanbanCard } from "./KanbanCard";
import { JobApplication } from "@prisma/client";
import { updateJobStatus } from "@/lib/actions";
import { useToast } from "@/components/ui/use-toast";

interface KanbanBoardProps {
    initialJobs: JobApplication[];
}

const COLUMNS = [
    { id: "APPLIED", title: "Applied", color: "border-indigo-500 text-indigo-700 bg-indigo-50" },
    { id: "SCREEN", title: "Screening", color: "border-blue-500 text-blue-700 bg-blue-50" },
    { id: "INTERVIEW", title: "Interview", color: "border-violet-500 text-violet-700 bg-violet-50" },
    { id: "OFFER", title: "Offer", color: "border-emerald-500 text-emerald-700 bg-emerald-50" },
    { id: "REJECTED", title: "Rejected", color: "border-red-500 text-red-700 bg-red-50" },
];

export default function KanbanBoard({ initialJobs }: KanbanBoardProps) {
    const [jobs, setJobs] = useState<JobApplication[]>(initialJobs);
    const [activeId, setActiveId] = useState<string | null>(null);
    const { toast } = useToast();

    // Sensors
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over) {
            setActiveId(null);
            return;
        }

        const activeId = active.id as string;
        // The over.id could be a container ID (status) OR another item ID
        let newStatus = over.id as string;

        // If dropped over a card, find that card's status
        const overJob = jobs.find(j => j.id === over.id);
        if (overJob) {
            newStatus = overJob.status;
        }

        const activeJob = jobs.find(j => j.id === activeId);

        if (activeJob && activeJob.status !== newStatus && COLUMNS.some(c => c.id === newStatus)) {
            // Optimistic Update
            setJobs(prev => prev.map(j =>
                j.id === activeId ? { ...j, status: newStatus } : j
            ));

            try {
                await updateJobStatus(activeId, newStatus);
                toast({
                    title: "Status Updated",
                    description: `Moved to ${newStatus}`,
                    duration: 2000,
                });
            } catch (e) {
                // Revert
                setJobs(prev => prev.map(j =>
                    j.id === activeId ? { ...j, status: activeJob.status } : j
                ));
                toast({
                    title: "Update Failed",
                    variant: "destructive",
                });
            }
        }

        setActiveId(null);
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="flex gap-4 h-[calc(100vh-200px)] overflow-x-auto pb-4">
                {COLUMNS.map((col) => (
                    <KanbanColumn
                        key={col.id}
                        id={col.id}
                        title={col.title}
                        jobs={jobs.filter(j => j.status === col.id)}
                        color={col.color}
                    />
                ))}
            </div>

            <DragOverlay>
                {activeId ? (
                    <KanbanCard job={jobs.find(j => j.id === activeId)!} />
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}

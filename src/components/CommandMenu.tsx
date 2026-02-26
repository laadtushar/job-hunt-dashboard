"use client";

import { useEffect, useState } from "react";
import { Command } from "cmdk";
import { useRouter } from "next/navigation";
import { Plus, LayoutDashboard, BarChart3, Settings, Calendar, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export function CommandMenu() {
    const [open, setOpen] = useState(false);
    const router = useRouter();

    // Toggle the menu when ⌘K is pressed
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };

        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    const runCommand = (command: () => unknown) => {
        setOpen(false);
        command();
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)}>
            <div className="w-full max-w-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                <Command>
                    <Command.Input
                        autoFocus
                        placeholder="Type a command or search..."
                        className="w-full border-none px-4 py-4 text-sm bg-transparent outline-none disabled:cursor-not-allowed disabled:opacity-50 text-slate-900 dark:text-slate-100 placeholder:text-slate-500"
                    />
                    <Command.List className="max-h-[300px] overflow-y-auto p-2 border-t border-slate-100 dark:border-slate-800">
                        <Command.Empty className="py-6 text-center text-sm text-slate-500">No results found.</Command.Empty>

                        <Command.Group heading="Navigation" className="px-2 py-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                            <Command.Item
                                onSelect={() => runCommand(() => router.push("/"))}
                                className="relative flex cursor-default select-none items-center rounded-sm px-2 py-2 text-sm outline-none aria-selected:bg-slate-100 aria-selected:text-slate-900 dark:aria-selected:bg-slate-800 dark:aria-selected:text-slate-50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                <LayoutDashboard className="mr-2 h-4 w-4" />
                                <span>Dashboard</span>
                            </Command.Item>
                            <Command.Item
                                onSelect={() => runCommand(() => router.push("/analytics"))}
                                className="relative flex cursor-default select-none items-center rounded-sm px-2 py-2 text-sm outline-none aria-selected:bg-slate-100 aria-selected:text-slate-900 dark:aria-selected:bg-slate-800 dark:aria-selected:text-slate-50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                <BarChart3 className="mr-2 h-4 w-4" />
                                <span>Analytics Pipeline</span>
                            </Command.Item>
                            <Command.Item
                                onSelect={() => runCommand(() => router.push("/kanban"))}
                                className="relative flex cursor-default select-none items-center rounded-sm px-2 py-2 text-sm outline-none aria-selected:bg-slate-100 aria-selected:text-slate-900 dark:aria-selected:bg-slate-800 dark:aria-selected:text-slate-50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                <LayoutDashboard className="mr-2 h-4 w-4" />
                                <span>Kanban Board</span>
                            </Command.Item>
                        </Command.Group>

                        <Command.Group heading="Actions" className="px-2 mt-2 py-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                            <Command.Item
                                onSelect={() => runCommand(() => router.push("/import"))}
                                className="relative flex cursor-default select-none items-center rounded-sm px-2 py-2 text-sm outline-none aria-selected:bg-slate-100 aria-selected:text-slate-900 dark:aria-selected:bg-slate-800 dark:aria-selected:text-slate-50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                <span>Paste Raw Jobs</span>
                            </Command.Item>
                            <Command.Item
                                onSelect={async () => runCommand(() => {
                                    toast.promise(fetch("/api/sync", { method: "POST", body: JSON.stringify({ action: "prepare" }) }), {
                                        loading: "Searching Gmail for updates...",
                                        success: "Sync triggered. Stand by.",
                                        error: "Failed to trigger sync",
                                    });
                                })}
                                className="relative flex cursor-default select-none items-center rounded-sm px-2 py-2 text-sm outline-none aria-selected:bg-slate-100 aria-selected:text-slate-900 dark:aria-selected:bg-slate-800 dark:aria-selected:text-slate-50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                <RefreshCw className="mr-2 h-4 w-4" />
                                <span>Sync Gmail Inbox Now</span>
                            </Command.Item>
                        </Command.Group>
                    </Command.List>
                </Command>
            </div>
        </div>
    );
}

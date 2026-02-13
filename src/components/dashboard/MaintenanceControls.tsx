"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { ShieldAlert, Terminal, Merge, CheckCircle2, RefreshCw, Mail, Settings2 } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export function MaintenanceControls() {
    const [isConsolidating, setIsConsolidating] = useState(false)
    const [logs, setLogs] = useState<string[]>([])
    const [isOpen, setIsOpen] = useState(false)

    // Audit State
    const [auditLogs, setAuditLogs] = useState<any[]>([])
    const [isLoadingAudit, setIsLoadingAudit] = useState(false)

    const fetchAuditLogs = async () => {
        setIsLoadingAudit(true);
        try {
            const res = await fetch('/api/maintenance/logs');
            const data = await res.json();
            setAuditLogs(data.logs || []);
        } catch (e) {
            console.error("Failed to fetch audit logs", e);
        } finally {
            setIsLoadingAudit(false);
        }
    };

    const handleIgnore = async (log: any) => {
        if (!log.applicationId) return;
        if (!confirm("Are you sure? This will remove the job and mark the email as 'Not a Job'. AI will learn from this.")) return;

        try {
            await fetch('/api/feedback/ignore', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ applicationId: log.applicationId })
            });
            setAuditLogs(prev => prev.map(p => p.id === log.id ? { ...p, isIgnored: true, applicationId: null, application: null } : p));
        } catch (e) {
            alert("Failed to mark as ignored");
        }
    };

    const handleConsolidate = async () => {
        if (!confirm("This will merge duplicate applications based on AI matching. Emails and analysis are PRESERVED. Proceed?")) return;

        setIsConsolidating(true)
        setLogs([])

        try {
            const res = await fetch('/api/maintenance/consolidate', { method: 'POST' })

            if (!res.body) return;
            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                buffer += chunk;

                const lines = buffer.split("\n");
                buffer = lines.pop() || "";

                for (const line of lines) {
                    if (line.trim()) {
                        setLogs(prev => [...prev, line]);
                    }
                }
            }
            setLogs(prev => [...prev, "✅ Consolidation Complete."]);
        } catch (error) {
            console.error(error);
            setLogs(prev => [...prev, "❌ Error executing consolidation."]);
        } finally {
            setIsConsolidating(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <DialogTrigger asChild>
                            <Button variant="ghost" className="h-12 px-5 rounded-[2rem] bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 font-bold gap-2 shadow-inner hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                                <Settings2 className="h-4 w-4" />
                                <span className="hidden sm:inline text-xs uppercase tracking-widest">Settings</span>
                            </Button>
                        </DialogTrigger>
                    </TooltipTrigger>
                    <TooltipContent className="rounded-xl font-bold text-xs bg-slate-900 text-white border-none px-3 py-1.5 shadow-xl">
                        System & Data Control
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
            <DialogContent className="sm:max-w-4xl h-[85vh] flex flex-col p-0 overflow-hidden bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl">
                <div className="bg-slate-50 dark:bg-slate-900/50 px-8 py-6 border-b border-slate-200 dark:border-slate-800">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                                <Settings2 className="h-6 w-6" />
                            </div>
                            System Intelligence
                        </DialogTitle>
                        <DialogDescription className="text-slate-500 dark:text-slate-400 font-medium">
                            Optimize your career pipeline with advanced extraction and consolidation tools.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <Tabs defaultValue="audit" className="flex-1 flex flex-col overflow-hidden">
                    <div className="px-8 pt-4">
                        <TabsList className="bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl grid w-full grid-cols-2">
                            <TabsTrigger value="audit" onClick={fetchAuditLogs} className="rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm font-bold text-xs uppercase tracking-wider">
                                System Audit Logs
                            </TabsTrigger>
                            <TabsTrigger value="consolidate" className="rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm font-bold text-xs uppercase tracking-wider">
                                Smart Consolidation
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="audit" className="flex-1 overflow-hidden flex flex-col p-8 pt-4 focus-visible:ring-0">
                        <div className="mb-4 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Recent Activity</h3>
                                <Badge className="bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 border-none px-2 py-0">LIVE</Badge>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="rounded-xl font-bold gap-2 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                onClick={fetchAuditLogs}
                            >
                                <RefreshCw className={`h-3.5 w-3.5 ${isLoadingAudit ? 'animate-spin' : ''}`} />
                                Refresh Database
                            </Button>
                        </div>
                        <div className="flex-1 overflow-hidden border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900/30 shadow-inner">
                            <ScrollArea className="h-full">
                                <table className="w-full text-sm text-left border-collapse">
                                    <thead className="bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10">
                                        <tr>
                                            <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 dark:border-slate-800">Status</th>
                                            <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 dark:border-slate-800">Interaction</th>
                                            <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 dark:border-slate-800">Neural Sync</th>
                                            <th className="px-6 py-4 text-right border-b border-slate-200 dark:border-slate-800"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                        {isLoadingAudit && <tr><td colSpan={4} className="p-16 text-center text-slate-400 animate-pulse font-medium">Synchronizing with system events...</td></tr>}
                                        {!isLoadingAudit && auditLogs.length === 0 && <tr><td colSpan={4} className="p-16 text-center text-slate-400 italic">No ecosystem activities recorded in this cycle.</td></tr>}

                                        {!isLoadingAudit && auditLogs.map((log) => (
                                            <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 group transition-all">
                                                <td className="px-6 py-5 whitespace-nowrap align-top">
                                                    <div className="flex flex-col gap-1.5">
                                                        <div className="text-[10px] text-slate-400 dark:text-slate-500 font-black tabular-nums uppercase">
                                                            {log.receivedDate ? formatDistanceToNow(new Date(log.receivedDate), { addSuffix: true }) : "Unknown"}
                                                        </div>
                                                        <Badge variant="outline" className={`text-[9px] w-fit font-bold rounded-md px-1.5 py-0 border-none bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400`}>
                                                            {log.isIgnored ? 'Filtered' : 'Analyzed'}
                                                        </Badge>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 max-w-[300px] align-top">
                                                    <div className="font-bold text-slate-900 dark:text-white truncate mb-1" title={log.subject}>{log.subject}</div>
                                                    <div className="text-[11px] text-slate-500 dark:text-slate-500 font-medium truncate flex items-center gap-1.5" title={log.sender}>
                                                        <Mail className="h-3 w-3 opacity-50" /> {log.sender?.split('<')[0].replace(/"/g, '').trim()}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 align-top">
                                                    {log.isIgnored ? (
                                                        <div className="text-xs text-red-500/80 font-bold flex items-center gap-1.5">
                                                            <div className="h-1.5 w-1.5 rounded-full bg-red-400/50" />
                                                            Spam Detection Loop
                                                        </div>
                                                    ) : log.application ? (
                                                        <div className="flex flex-col gap-1.5">
                                                            <div className="flex items-center gap-2 font-bold text-blue-600 dark:text-blue-400">
                                                                <div className="h-2 w-2 rounded-full bg-green-500" />
                                                                {log.application.company}
                                                            </div>
                                                            <div className="text-[10px] text-slate-400 font-black uppercase tracking-tight">{log.application.role}</div>
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col gap-2">
                                                            <div className="text-xs font-bold text-slate-400 italic">Unindexed Event</div>
                                                            {log.aiSummary && (
                                                                <div className="text-[10px] text-blue-500 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/10 p-2 rounded-lg border border-blue-100 dark:border-blue-900/30 font-bold">
                                                                    AI Match: {log.aiSummary.company}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-5 text-right align-top">
                                                    {!log.isIgnored && log.applicationId && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="rounded-xl text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 font-bold text-[11px] h-8 px-4 transition-all opacity-0 group-hover:opacity-100"
                                                            onClick={() => handleIgnore(log)}
                                                        >
                                                            Filter Out
                                                        </Button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </ScrollArea>
                        </div>
                    </TabsContent>

                    <TabsContent value="consolidate" className="flex-1 overflow-hidden flex flex-col p-8 pt-4 focus-visible:ring-0">
                        <div className="space-y-10 py-4 max-w-3xl mx-auto w-full">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-slate-50 dark:bg-slate-900/30 p-8 rounded-3xl border border-slate-200 dark:border-slate-800">
                                <div className="space-y-3">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest">
                                        Data Intelligence
                                    </div>
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                                        Smart Consolidation
                                    </h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                                        AI deep-links scattered applications. For example, merging "Google" and "Google Inc" into a single command command center.
                                        <span className="block mt-2 font-bold text-green-600 dark:text-green-400">All audit history is preserved.</span>
                                    </p>
                                </div>
                                <div className="flex flex-col gap-3">
                                    <Button
                                        size="lg"
                                        className={`rounded-2xl h-16 font-black text-lg shadow-xl transition-all active:scale-95 ${isConsolidating
                                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                                            : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 text-white shadow-blue-500/20'
                                            }`}
                                        onClick={handleConsolidate}
                                        disabled={isConsolidating}
                                    >
                                        {isConsolidating ? (
                                            <>
                                                <RefreshCw className="mr-3 h-5 w-5 animate-spin" />
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                <Merge className="mr-3 h-5 w-5" />
                                                Execute Linker
                                            </>
                                        )}
                                    </Button>
                                    <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest">Takes ~30 seconds depending on volume</p>
                                </div>
                            </div>

                            <div className="bg-slate-50 dark:bg-slate-950 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-inner relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
                                    <Terminal className="h-24 w-24 text-blue-500" />
                                </div>
                                <div className="flex items-center gap-3 text-slate-400 dark:text-slate-500 mb-4 border-b border-slate-200 dark:border-slate-800 pb-3">
                                    <Terminal className="h-4 w-4" />
                                    <span className="text-xs font-black uppercase tracking-[0.2em]">Neural Console Output</span>
                                </div>
                                <div className="h-48 overflow-y-auto font-mono text-[11px] leading-relaxed scrollbar-thin dark:scrollbar-thumb-slate-800">
                                    {logs.length === 0 && <span className="text-slate-400 dark:text-slate-600 italic">Awaiting neural commands...</span>}
                                    {logs.map((log, i) => (
                                        <div key={i} className={`mb-1.5 flex gap-3 ${log.includes('❌') ? 'text-red-500' : log.includes('✅') ? 'text-green-500 font-bold' : 'text-slate-600 dark:text-slate-400'}`}>
                                            <span className="opacity-30">[{i}]</span>
                                            <span>{log}</span>
                                        </div>
                                    ))}
                                    {isConsolidating && <div className="animate-pulse text-blue-500 ml-7">_</div>}
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}

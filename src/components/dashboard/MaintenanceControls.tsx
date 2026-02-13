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
import { ShieldAlert, Terminal, Merge, CheckCircle2, RefreshCw, Mail } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"

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
            // Update local state
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

            // Reload after short delay if currently on dashboard
            // setTimeout(() => window.location.reload(), 2000);

        } catch (error) {
            console.error("Consolidation failed", error);
            setLogs(prev => [...prev, "❌ Error executing consolidation."]);
        } finally {
            setIsConsolidating(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
                    <ShieldAlert className="h-4 w-4" />
                    Maintenance
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-4xl h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>System Maintenance</DialogTitle>
                    <DialogDescription>
                        Advanced tools for managing your job application data.
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="audit" className="flex-1 flex flex-col overflow-hidden">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="audit" onClick={fetchAuditLogs}>AI Audit & Logs</TabsTrigger>
                        <TabsTrigger value="consolidate">Consolidation</TabsTrigger>
                    </TabsList>

                    <TabsContent value="audit" className="flex-1 overflow-hidden flex flex-col mt-4">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-sm font-medium">Recent AI Activities</h3>
                            <Button variant="ghost" size="sm" onClick={fetchAuditLogs}>
                                <RefreshCw className="h-3 w-3 mr-1" /> Refresh
                            </Button>
                        </div>
                        <div className="border rounded-md flex-1 overflow-hidden bg-white">
                            <ScrollArea className="h-full">
                                <div className="p-0">
                                    <table className="w-full text-sm text-left">
                                        <thead className="text-[11px] text-muted-foreground bg-slate-50 uppercase sticky top-0 border-b font-semibold tracking-wider">
                                            <tr>
                                                <th className="px-6 py-4">Status</th>
                                                <th className="px-6 py-4">Email Interaction</th>
                                                <th className="px-6 py-4">AI Prediction</th>
                                                <th className="px-6 py-4 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {isLoadingAudit && <tr><td colSpan={4} className="p-8 text-center text-muted-foreground animate-pulse">Fetching system logs...</td></tr>}
                                            {!isLoadingAudit && auditLogs.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-muted-foreground italic">No logs found in this period.</td></tr>}

                                            {!isLoadingAudit && auditLogs.map((log) => (
                                                <tr key={log.id} className="hover:bg-slate-50/50 group transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap align-top">
                                                        <div className="flex flex-col">
                                                            <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">
                                                                {log.receivedDate ? formatDistanceToNow(new Date(log.receivedDate), { addSuffix: true }) : "Unknown"}
                                                            </div>
                                                            <Badge variant="outline" className={`mt-1 text-[10px] w-fit font-normal ${log.isIgnored ? 'border-red-200 text-red-600' : 'border-slate-200'}`}>
                                                                {log.isIgnored ? 'Ignored' : 'Processed'}
                                                            </Badge>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 max-w-[300px] align-top">
                                                        <div className="font-semibold text-slate-900 truncate" title={log.subject}>{log.subject}</div>
                                                        <div className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-0.5" title={log.sender}>
                                                            <Mail className="h-3 w-3 opacity-60" /> {log.sender?.split('<')[0].replace(/"/g, '').trim()}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 align-top">
                                                        {log.isIgnored ? (
                                                            <div className="text-xs text-red-500 font-medium">Marked as Spam/False Positive</div>
                                                        ) : log.application ? (
                                                            <div className="flex flex-col gap-1">
                                                                <div className="flex items-center gap-1.5 font-medium text-slate-900">
                                                                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                                                                    {log.application.company}
                                                                </div>
                                                                <span className="text-[10px] text-muted-foreground bg-slate-100 px-1.5 py-0.5 rounded-sm w-fit uppercase font-semibold">{log.application.role}</span>
                                                            </div>
                                                        ) : (
                                                            <div className="flex flex-col gap-1.5">
                                                                <div className="text-xs font-medium text-slate-500 italic">Unlinked Activity</div>
                                                                {log.aiSummary && (
                                                                    <div className="text-[10px] text-slate-400 bg-slate-50 p-1 rounded-sm border border-slate-100">
                                                                        AI Suggestion: {log.aiSummary.company}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-right align-top">
                                                        {!log.isIgnored && log.applicationId && (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="text-red-500 border-red-100 hover:text-red-700 hover:bg-red-50 hover:border-red-200 h-8 px-3 text-xs bg-red-50/30"
                                                                onClick={() => handleIgnore(log)}
                                                            >
                                                                Mark as Junk
                                                            </Button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </ScrollArea>
                        </div>
                    </TabsContent>

                    <TabsContent value="consolidate" className="flex-1 overflow-hidden flex flex-col mt-4">
                        <div className="space-y-6 py-4">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-sm font-medium flex items-center gap-2">
                                            <Merge className="h-4 w-4 text-blue-500" />
                                            Consolidate Duplicates
                                        </h3>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            Uses AI to detect and merge duplicate applications (e.g., "Google" vs "google inc").
                                            <br />
                                            <span className="text-xs font-semibold text-green-600">Safe Operation: Preserves all emails and AI analysis.</span>
                                        </p>
                                    </div>
                                    <Button
                                        onClick={handleConsolidate}
                                        disabled={isConsolidating}
                                        variant={isConsolidating ? "secondary" : "default"}
                                    >
                                        {isConsolidating ? "Running..." : "Run Consolidation"}
                                    </Button>
                                </div>
                            </div>

                            <div className="bg-black/90 rounded-md p-4 h-64 overflow-y-auto font-mono text-xs text-green-400 border border-gray-800 shadow-inner">
                                <div className="flex items-center gap-2 text-gray-500 mb-2 border-b border-gray-800 pb-2">
                                    <Terminal className="h-3 w-3" />
                                    <span>Console Output</span>
                                </div>
                                {logs.length === 0 && <span className="text-gray-600 italic">Ready for input...</span>}
                                {logs.map((log, i) => (
                                    <div key={i} className="whitespace-pre-wrap">{log}</div>
                                ))}
                                {isConsolidating && <div className="animate-pulse mt-1">_</div>}
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}

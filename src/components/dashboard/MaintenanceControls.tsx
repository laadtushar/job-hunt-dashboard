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
import { ShieldAlert, Terminal, Merge, CheckCircle2, RefreshCw } from "lucide-react"
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
                                        <thead className="text-xs text-gray-500 bg-gray-50 uppercase sticky top-0 border-b">
                                            <tr>
                                                <th className="px-4 py-3">Date</th>
                                                <th className="px-4 py-3">Email Context</th>
                                                <th className="px-4 py-3">AI Prediction</th>
                                                <th className="px-4 py-3 text-right">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {isLoadingAudit && <tr><td colSpan={4} className="p-4 text-center text-gray-500">Loading logs...</td></tr>}
                                            {!isLoadingAudit && auditLogs.length === 0 && <tr><td colSpan={4} className="p-4 text-center text-gray-500">No logs found.</td></tr>}

                                            {!isLoadingAudit && auditLogs.map((log) => (
                                                <tr key={log.id} className="hover:bg-gray-50 group">
                                                    <td className="px-4 py-3 whitespace-nowrap text-gray-500 text-xs align-top">
                                                        {log.receivedDate ? formatDistanceToNow(new Date(log.receivedDate), { addSuffix: true }) : "Unknown"}
                                                    </td>
                                                    <td className="px-4 py-3 max-w-[300px] align-top">
                                                        <div className="font-medium truncate" title={log.subject}>{log.subject}</div>
                                                        <div className="text-xs text-gray-400 truncate" title={log.sender}>{log.sender}</div>
                                                    </td>
                                                    <td className="px-4 py-3 align-top">
                                                        {log.isIgnored ? (
                                                            <Badge variant="outline" className="text-red-600 bg-red-50 border-red-200">Ignored (False Positive)</Badge>
                                                        ) : log.application ? (
                                                            <div className="flex flex-col gap-1">
                                                                <Badge variant="outline" className="w-fit border-green-200 bg-green-50 text-green-700">
                                                                    Matched: {log.application.company || "Unknown"}
                                                                </Badge>
                                                                <span className="text-xs text-gray-500">{log.application.role}</span>
                                                            </div>
                                                        ) : (
                                                            <div className="flex flex-col gap-1">
                                                                <Badge variant="secondary" className="w-fit">Unlinked / Skipped</Badge>
                                                                {log.aiSummary && (
                                                                    <span className="text-xs text-gray-400">
                                                                        AI thought: {log.aiSummary.company} ({log.aiSummary.role})
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-right align-top">
                                                        {!log.isIgnored && log.applicationId && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="text-red-500 hover:text-red-700 hover:bg-red-50 h-6 px-2 text-xs"
                                                                onClick={() => handleIgnore(log)}
                                                            >
                                                                Mark False Positive
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

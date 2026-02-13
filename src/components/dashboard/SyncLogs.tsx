
import { RefreshCw } from "lucide-react"

interface SyncLog {
    message: string
    type: 'info' | 'success' | 'error'
}

interface SyncLogsProps {
    logs: SyncLog[]
    isSyncing: boolean
}

export function SyncLogs({ logs, isSyncing }: SyncLogsProps) {
    if (!isSyncing && logs.length === 0) return null;

    return (
        <div className="mt-8 bg-white dark:bg-slate-900/30 rounded-3xl p-6 max-h-80 overflow-y-auto font-mono text-[11px] border border-slate-200 dark:border-slate-800 shadow-xl shadow-blue-500/5 relative group">
            <div className="flex items-center gap-2 mb-4 text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800 pb-3">
                <span className="text-[10px] font-black uppercase tracking-widest">Neural Sync Engine</span>
                {isSyncing && <div className="h-1 w-1 rounded-full bg-blue-500 animate-pulse" />}
            </div>

            {logs.length === 0 && (
                <div className="text-slate-500 dark:text-slate-400 animate-pulse flex items-center gap-3">
                    <div className="h-6 w-6 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                        <RefreshCw className="h-3 w-3 animate-spin text-blue-600 dark:text-blue-400" />
                    </div>
                    Handshaking with Gmail API...
                </div>
            )}

            <div className="space-y-2">
                {logs.map((log, i) => (
                    <div key={i} className={`flex items-start gap-4 transition-all duration-300 ${log.type === 'error' ? 'text-red-500 dark:text-red-400' :
                        log.type === 'success' ? 'text-green-600 dark:text-green-400 font-bold' :
                            'text-slate-600 dark:text-slate-400'
                        }`}>
                        <span className="opacity-30 shrink-0 font-sans tabular-nums font-bold">
                            [{new Date().toLocaleTimeString([], { hour12: false })}]
                        </span>
                        <span className="leading-relaxed flex-1">{log.message}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}

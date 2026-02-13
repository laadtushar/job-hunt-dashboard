
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
        <div className="mt-4 bg-muted/50 rounded-lg p-3 max-h-48 overflow-y-auto font-mono text-xs border border-border/50">
            {logs.length === 0 && (
                <div className="text-muted-foreground animate-pulse flex items-center gap-2">
                    <span className="h-2 w-2 bg-blue-500 rounded-full animate-bounce"></span>
                    Connecting to sync service...
                </div>
            )}
            {logs.map((log, i) => (
                <div key={i} className={`mb-1 flex items-start gap-2 ${log.type === 'error' ? 'text-red-500' :
                        log.type === 'success' ? 'text-green-600 font-semibold' :
                            'text-muted-foreground'
                    }`}>
                    <span className="opacity-50 shrink-0">[{new Date().toLocaleTimeString()}]</span>
                    <span>{log.message}</span>
                </div>
            ))}
        </div>
    )
}

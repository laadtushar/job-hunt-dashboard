import prisma from "@/lib/prisma";

export interface AdminActionLog {
    id: string;
    action: string;
    performedBy: string;
    targetEmail?: string;
    timestamp: Date;
    details?: string;
}

// Create a simple audit log model if needed, or use comments for now
export async function logAdminAction(
    action: string,
    performedBy: string,
    targetEmail?: string,
    details?: string
) {
    console.log('[AUDIT]', {
        action,
        performedBy,
        targetEmail,
        details,
        timestamp: new Date().toISOString()
    });

    // Future: Store in database
    // await prisma.auditLog.create({ })
}

import Navbar from "@/components/Navbar"
import TasksClient from "@/components/tasks/TasksClient"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export const metadata = {
    title: "Tasks | HyredLab",
    description: "AI-powered task management for your job search",
}

export default async function TasksPage() {
    const session = await auth()

    if (!session?.user) {
        redirect("/")
    }

    const SUPERADMIN_EMAIL = process.env.SUPERADMIN_EMAIL
    const isAllowed =
        session.user.email === SUPERADMIN_EMAIL ||
        (await prisma.allowedUser.findUnique({ where: { email: session.user.email || "" } }))

    if (!isAllowed) {
        redirect("/access-denied")
    }

    const tasks = await prisma.task.findMany({
        where: { userId: session.user.id },
        include: {
            application: {
                select: { id: true, company: true, role: true, status: true }
            }
        },
        orderBy: [
            { status: "asc" },
            { createdAt: "desc" }
        ]
    })

    // Serialize dates to strings for client component
    const serialized = tasks.map(t => ({
        ...t,
        dueDate: t.dueDate?.toISOString() ?? null,
        completedAt: t.completedAt?.toISOString() ?? null,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
    }))

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-500">
            <Navbar />
            <div className="max-w-4xl mx-auto p-6 lg:p-10">
                <TasksClient initialTasks={serialized} />
            </div>
        </div>
    )
}

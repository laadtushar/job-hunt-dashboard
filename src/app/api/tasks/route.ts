import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'

// GET /api/tasks — fetch all tasks for the current user
export async function GET() {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tasks = await prisma.task.findMany({
        where: { userId: session.user.id },
        include: {
            application: {
                select: { id: true, company: true, role: true, status: true }
            }
        },
        orderBy: [
            { status: 'asc' },
            { priority: 'desc' },
            { dueDate: 'asc' },
            { createdAt: 'desc' }
        ]
    })

    return NextResponse.json(tasks)
}

// POST /api/tasks — create a manual task
export async function POST(request: Request) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, priority, category, dueDate, applicationId } = body

    if (!title?.trim()) {
        return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const task = await prisma.task.create({
        data: {
            userId: session.user.id,
            title: title.trim(),
            description: description?.trim() || null,
            priority: priority || 'MEDIUM',
            category: category || null,
            dueDate: dueDate ? new Date(dueDate) : null,
            applicationId: applicationId || null,
            aiGenerated: false,
            source: 'MANUAL',
        },
        include: {
            application: {
                select: { id: true, company: true, role: true, status: true }
            }
        }
    })

    return NextResponse.json(task, { status: 201 })
}

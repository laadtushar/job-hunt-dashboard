import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'

// PATCH /api/tasks/[id] — update task status, priority, etc.
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const task = await prisma.task.findUnique({ where: { id } })
    if (!task || task.userId !== session.user.id) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const body = await request.json()
    const { title, description, status, priority, category, dueDate } = body

    const completedAt =
        status === 'DONE' && task.status !== 'DONE'
            ? new Date()
            : status !== 'DONE'
                ? null
                : task.completedAt

    const updated = await prisma.task.update({
        where: { id },
        data: {
            ...(title !== undefined && { title }),
            ...(description !== undefined && { description }),
            ...(status !== undefined && { status }),
            ...(priority !== undefined && { priority }),
            ...(category !== undefined && { category }),
            ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
            completedAt,
        },
        include: {
            application: {
                select: { id: true, company: true, role: true, status: true }
            }
        }
    })

    return NextResponse.json(updated)
}

// DELETE /api/tasks/[id]
export async function DELETE(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const task = await prisma.task.findUnique({ where: { id } })
    if (!task || task.userId !== session.user.id) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    await prisma.task.delete({ where: { id } })
    return NextResponse.json({ success: true })
}

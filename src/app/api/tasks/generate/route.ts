import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import { AIService } from '@/services/ai'

// POST /api/tasks/generate — AI generates tasks from current applications
export async function POST() {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch active applications with recent email logs
    const applications = await prisma.jobApplication.findMany({
        where: {
            userId: session.user.id,
            isIgnored: false,
            status: { not: 'GHOSTED' },
        },
        select: {
            id: true,
            company: true,
            role: true,
            status: true,
            lastUpdate: true,
            nextSteps: true,
            feedback: true,
            interviewDate: true,
            offerDeadline: true,
            recruiterName: true,
            recruiterEmail: true,
            emailLogs: {
                orderBy: { receivedDate: 'desc' },
                take: 1,
                select: { subject: true, snippet: true, receivedDate: true }
            }
        },
        orderBy: { lastUpdate: 'desc' },
        take: 40,
    })

    if (applications.length === 0) {
        return NextResponse.json({ tasks: [], message: 'No active applications found.' })
    }

    const aiService = new AIService()
    const generatedTasks = await aiService.generateTasks(applications)

    if (!generatedTasks || generatedTasks.length === 0) {
        return NextResponse.json({ tasks: [], message: 'AI did not generate any tasks.' })
    }

    // Bulk insert generated tasks
    const created = await prisma.$transaction(
        generatedTasks.map(t =>
            prisma.task.create({
                data: {
                    userId: session.user.id,
                    title: t.title,
                    description: t.description || null,
                    priority: t.priority || 'MEDIUM',
                    category: t.category || null,
                    dueDate: t.dueDate ? new Date(t.dueDate) : null,
                    applicationId: t.applicationId || null,
                    aiGenerated: true,
                    source: 'AI_SYNC',
                },
                include: {
                    application: {
                        select: { id: true, company: true, role: true, status: true }
                    }
                }
            })
        )
    )

    return NextResponse.json({ tasks: created, count: created.length })
}

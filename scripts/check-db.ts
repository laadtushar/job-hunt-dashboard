
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('--- Connecting to DB ---')
    try {
        const jobCount = await prisma.jobApplication.count()
        const emailCount = await prisma.emailLog.count()
        const embeddingCount = await prisma.jobEmbedding.count()
        const agentLogs = await prisma.agentSearchLog.findMany({
            take: 10,
            orderBy: { createdAt: 'desc' }
        })

        console.log('--- DB Stats ---')
        console.log('Job Applications:', jobCount)
        console.log('Email Logs:', emailCount)
        console.log('Job Embeddings:', embeddingCount)
        console.log('\n--- Recent Agent Logs ---')
        agentLogs.forEach(log => {
            console.log(`[${log.createdAt.toISOString()}] Intent: ${log.detectedIntent} | Company: ${log.detectedCompany} | Found Jobs: ${log.foundJobsCount}`)
            console.log(`  Message: ${log.userMessage}`)
            console.log(`  Reflection: ${log.reflection?.substring(0, 100)}...`)
        })
    } catch (err: any) {
        console.error('DB Error:', err.message)
        if (err.code === 'P2021') {
            console.error('Table not found. Have you run prisma migrate?')
        }
    }
}

main()
    .catch((e) => {
        console.error('Script Error:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })

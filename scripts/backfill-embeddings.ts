
import { PrismaClient } from '@prisma/client'
import { EmbeddingService } from '../src/services/embedding'

const prisma = new PrismaClient()

async function main() {
    const jobs = await prisma.jobApplication.findMany({
        include: {
            embedding: true
        }
    })

    // Filter for jobs without embeddings
    const jobsToEmbed = jobs.filter(j => !j.embedding)

    console.log(`Found ${jobs.length} total jobs, ${jobsToEmbed.length} need embeddings.`)

    if (jobsToEmbed.length === 0) {
        console.log('No jobs need backfilling.')
        return
    }

    const embeddingService = new EmbeddingService()

    let count = 0
    for (const job of jobsToEmbed) {
        count++
        try {
            console.log(`[${count}/${jobsToEmbed.length}] Embedding: ${job.company} - ${job.role}`)
            const text = EmbeddingService.formatJobForEmbedding(job)
            const vector = await embeddingService.embed(text)

            if (vector && vector.length > 0) {
                await prisma.$executeRaw`
            INSERT INTO "JobEmbedding" ("id", "jobId", "vector", "content", "createdAt")
            VALUES (gen_random_uuid(), ${job.id}, ${vector}::vector, ${text}, NOW())
            ON CONFLICT ("jobId") DO UPDATE SET "vector" = ${vector}::vector, "content" = ${text};
        `
            }
        } catch (err: any) {
            console.error(`Failed to embed job ${job.id}:`, err.message)
        }
    }

    console.log('Backfill complete!')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })

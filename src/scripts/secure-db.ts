
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const tables = [
        "User",
        "Account",
        "Session",
        "VerificationToken",
        "JobApplication",
        "EmailLog",
        "UserFeedback",
        "JobEmbedding",
        "EmailEmbedding",
        "InviteRequest",
        "AllowedUser",
        "Task"
    ]

    console.log("🔐 Enabling Row Level Security (RLS) on all tables...")

    for (const table of tables) {
        try {
            // Postgres case-sensitive quoting for PascalCase table names
            await prisma.$executeRawUnsafe(`ALTER TABLE "public"."${table}" ENABLE ROW LEVEL SECURITY;`)
            console.log(`✅ Enabled RLS for table: "${table}"`)
        } catch (error) {
            console.error(`❌ Failed to enable RLS for table: "${table}"`)
            console.error(error)
        }
    }

    console.log("\n⚠️  Note: RLS is now enabled. Since no policies were created, public access (via PostgREST/Supabase Client) is DENIED for all anonymous/authenticated users. Server-side Prisma (service_role) continues to have full access.")
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })

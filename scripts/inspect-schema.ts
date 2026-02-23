
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const table = 'JobEmbedding'
    const column = 'vector'

    const result: any[] = await prisma.$queryRaw`
    SELECT column_name, data_type, udt_name 
    FROM information_schema.columns 
    WHERE table_name = ${table} AND column_name = ${column};
  `

    console.log('--- Column Info ---')
    console.log(JSON.stringify(result, null, 2))

    // Try to get the dimension if it's a vector type
    try {
        const dimResult: any[] = await prisma.$queryRawUnsafe(`
      SELECT atttypmod 
      FROM pg_attribute 
      WHERE attrelid = '"${table}"'::regclass AND attname = '${column}';
    `)
        console.log('--- Dimension (atttypmod) ---', dimResult)
        // atttypmod for vector is the dimension
    } catch (e) {
        console.log('Failed to get dimension directly:', e)
    }
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })

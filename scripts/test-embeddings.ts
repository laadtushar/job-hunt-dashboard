
import { EmbeddingService } from '../src/services/embedding'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

async function main() {
    process.env.EMBEDDING_PROVIDER = 'GEMINI'
    const svc = new EmbeddingService()
    console.log('Testing GEMINI embedding...')
    const vector = await svc.embed('Test message')
    console.log('GEMINI Vector length:', vector.length)

    process.env.EMBEDDING_PROVIDER = 'OPENROUTER'
    const svc2 = new EmbeddingService()
    console.log('Testing OPENROUTER embedding...')
    const vector2 = await svc2.embed('Test message')
    console.log('OPENROUTER Vector length:', vector2.length)
}

main().catch(console.error)

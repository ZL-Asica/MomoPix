import { up } from '@auth/d1-adapter'
import { getCloudflareContext } from '@opennextjs/cloudflare'

export async function GET() {
  try {
    await up((await getCloudflareContext({ async: true })).env.DB)
  }
  catch (e: unknown) {
    if (e instanceof Error) {
      const causeMessage = e.cause instanceof Error ? e.cause.message : String(e.cause)
      console.error(causeMessage, e.message)
    }
  }
  return new Response('Migration completed')
}

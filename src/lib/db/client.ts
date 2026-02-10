import type { DrizzleD1Database } from 'drizzle-orm/d1'
import { drizzle } from 'drizzle-orm/d1'
import { getD1Binding } from '@/lib/cloudflare/bindings'
import * as schema from '@/lib/db/schema'

/**
 * Returns a typed Drizzle client backed by the Cloudflare D1 binding.
 */
export function getDb(): DrizzleD1Database<typeof schema> {
  return drizzle(getD1Binding(), { schema })
}

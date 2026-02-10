import { env } from 'cloudflare:workers'
import { assertBinding } from '@/lib/cloudflare/errors'

/**
 * Returns the configured D1 database used by MomoPix metadata storage.
 *
 * @throws {MissingBindingError} When `DB` is not bound in Cloudflare runtime.
 */
export function getD1Binding(): D1Database {
  return assertBinding(env.DB, 'DB')
}

/**
 * Returns the configured R2 bucket used by MomoPix image storage.
 *
 * @throws {MissingBindingError} When `R2_BUCKET` is not bound in Cloudflare runtime.
 */
export function getR2Binding(): R2Bucket {
  return assertBinding(env.R2_BUCKET, 'R2_BUCKET')
}

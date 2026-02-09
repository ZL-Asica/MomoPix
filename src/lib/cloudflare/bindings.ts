import { env } from 'cloudflare:workers'
import { assertBinding } from '@/lib/cloudflare/errors'

/**
 * Returns the configured KV namespace used by MomoPix metadata storage.
 *
 * @throws {MissingBindingError} When `KV` is not bound in Cloudflare runtime.
 */
export function getKVBinding(): KVNamespace {
  return assertBinding(env.KV, 'KV')
}

/**
 * Returns the configured R2 bucket used by MomoPix image storage.
 *
 * @throws {MissingBindingError} When `R2_BUCKET` is not bound in Cloudflare runtime.
 */
export function getR2Binding(): R2Bucket {
  return assertBinding(env.R2_BUCKET, 'R2_BUCKET')
}

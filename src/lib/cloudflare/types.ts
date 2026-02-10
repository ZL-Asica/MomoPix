/**
 * Cloudflare bindings required by MomoPix storage operations.
 */
export interface MomoPixStorageBindings {
  DB: D1Database
  R2_BUCKET: R2Bucket
  R2_PUBLIC_DOMAIN: string
}

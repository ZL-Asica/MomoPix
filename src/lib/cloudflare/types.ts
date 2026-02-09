/**
 * Cloudflare bindings required by MomoPix storage operations.
 */
export interface MomoPixStorageBindings {
  KV: KVNamespace
  R2_BUCKET: R2Bucket
}

/**
 * JSON-like value accepted by KV serialization helpers.
 */
export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue }

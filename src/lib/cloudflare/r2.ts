/**
 * Writes an object into R2.
 */
export async function putObject(
  bucket: R2Bucket,
  key: string,
  body: ArrayBuffer | ReadableStream | string,
  options?: R2PutOptions,
): Promise<void> {
  await bucket.put(key, body, options)
}

/**
 * Reads an object from R2.
 */
export async function getObject(bucket: R2Bucket, key: string): Promise<R2ObjectBody | null> {
  return bucket.get(key)
}

/**
 * Deletes an object from R2.
 */
export async function deleteObject(bucket: R2Bucket, key: string): Promise<void> {
  await bucket.delete(key)
}

/**
 * Creates a streaming image response from an R2 object body.
 *
 * @param object R2 object body from `bucket.get`.
 * @param contentType Fallback content type when object metadata is missing.
 * @param cacheControl Cache control value for browser/proxy caches.
 */
export function toImageResponse(
  object: R2ObjectBody,
  contentType: string,
  cacheControl = 'private, max-age=120',
): Response {
  const headers = new Headers()
  headers.set('Cache-Control', cacheControl)
  headers.set('Content-Type', object.httpMetadata?.contentType ?? contentType)
  headers.set('Content-Length', String(object.size))

  return new Response(object.body, {
    status: 200,
    headers,
  })
}

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
 * Deletes an object from R2.
 */
export async function deleteObject(bucket: R2Bucket, key: string): Promise<void> {
  await bucket.delete(key)
}

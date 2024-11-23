import type { Context } from 'hono'

const MAX_COUNT = 10
const MAX_SIZE_MB = 5

const uploadHandler = async (c: Context) => {
  try {
    const formData = await c.req.formData()

    const files: { key: string; blob: Blob }[] = []

    // eslint-disable-next-line unicorn/no-array-for-each
    formData.forEach((value, key) => {
      if (key === 'file' && value instanceof Blob) {
        const correspondingKey = formData.get('key') as string
        if (correspondingKey) {
          files.push({ key: correspondingKey, blob: value })
        }
      }
    })

    if (files.length > MAX_COUNT) {
      return c.json(
        {
          success: false,
          error: `Too many files. Maximum is ${MAX_COUNT}.`,
        },
        400
      )
    }

    const invalidFiles = files
      .filter((file) => file.blob.size > MAX_SIZE_MB * 1024 * 1024)
      .map((file) => ({
        key: file.key,
        success: false,
        error: `File exceeds size limit of ${MAX_SIZE_MB}MB`,
      }))

    if (invalidFiles.length > 0) {
      return c.json(
        {
          success: false,
          error: `Some files are invalid.`,
          failed: invalidFiles,
        },
        400
      )
    }

    // Upload files to R2
    const uploadResults = await Promise.allSettled(
      files.map(async ({ key, blob }) => {
        try {
          const arrayBuffer = await blob.arrayBuffer()
          await c.env.R2_BUCKET.put(key, new Uint8Array(arrayBuffer))
          return { key, success: true }
        } catch (error) {
          console.error(`Error uploading file ${key}:`, error)
          return { key, success: false, error: (error as Error).message }
        }
      })
    )

    // Process upload results
    const successUploads = uploadResults
      .filter((result) => result.status === 'fulfilled' && result.value.success)
      .map(
        (result) => (result as PromiseFulfilledResult<{ key: string }>).value
      )

    const failedUploads = uploadResults
      .filter(
        (result) => result.status === 'fulfilled' && !result.value.success
      )
      .map(
        (result) =>
          (result as PromiseFulfilledResult<{ key: string; error: string }>)
            .value
      )

    return c.json({
      success: true,
      uploaded: successUploads,
      failed: failedUploads,
    })
  } catch (error) {
    console.error('Unexpected error during upload:', error)
    return c.json(
      {
        success: false,
        error: 'Internal Server Error',
        details: (error as Error).message,
      },
      500
    )
  }
}

export default uploadHandler

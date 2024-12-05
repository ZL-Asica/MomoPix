import type { Context } from 'hono'

interface DeleteBody {
  keys: string[]
}

const deleteHandler = async (c: Context) => {
  try {
    const body: DeleteBody = await c.req.json()

    if (!body || !Array.isArray(body.keys)) {
      return c.json(
        {
          success: false,
          error: 'Invalid request body. Expected an array of keys.',
        },
        400
      )
    }

    const keysArray = body.keys

    if (keysArray.length === 0) {
      return c.json(
        {
          success: false,
          error: 'No keys provided for deletion.',
        },
        400
      )
    }

    // Delete files from R2
    const deleteResults = await Promise.allSettled(
      keysArray.map(async (key: string) => {
        try {
          const fileExists = await c.env.R2_BUCKET.get(key)
          if (!fileExists) {
            throw new Error(`File ${key} does not exist.`)
          }
          await c.env.R2_BUCKET.delete(key)
          return { key, success: true }
        } catch (error) {
          console.error(`Error deleting file ${key}:`, error)
          return {
            key,
            success: false,
            error: (error as Error).message,
          }
        }
      })
    )

    const successfulDeletes = deleteResults
      .filter((result) => result.status === 'fulfilled' && result.value.success)
      .map(
        (result) => (result as PromiseFulfilledResult<{ key: string }>).value
      )

    const failedDeletes = deleteResults
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
      deleted: successfulDeletes,
      failed: failedDeletes,
    })
  } catch (error) {
    console.error('Unexpected error during deletion:', error)
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

export default deleteHandler

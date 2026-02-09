export interface BulkOperationFailure<TItem> {
  item: TItem
  error: Error
}

export interface BulkOperationSuccess<TItem, TResult> {
  item: TItem
  result: TResult
}

export interface RunBulkOperationOptions {
  concurrency?: number
  timeoutMs?: number
}

function toError(value: unknown): Error {
  if (value instanceof Error) {
    return value
  }
  return new Error(String(value))
}

/**
 * Rejects when `promise` does not settle within `timeoutMs`.
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  message = `Operation timed out after ${timeoutMs}ms`,
): Promise<T> {
  if (timeoutMs <= 0 || !Number.isFinite(timeoutMs)) {
    return promise
  }

  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(message))
    }, timeoutMs)

    promise
      .then((value) => {
        clearTimeout(timer)
        resolve(value)
      })
      .catch((error) => {
        clearTimeout(timer)
        reject(error)
      })
  })
}

/**
 * Runs async work for items with bounded concurrency, collecting success and failure results.
 */
export async function runBulkOperation<TItem, TResult>(
  items: readonly TItem[],
  worker: (item: TItem, index: number) => Promise<TResult>,
  options?: RunBulkOperationOptions,
): Promise<{
  ok: BulkOperationSuccess<TItem, TResult>[]
  failed: BulkOperationFailure<TItem>[]
}> {
  if (items.length === 0) {
    return { ok: [], failed: [] }
  }

  const concurrency = Math.max(1, Math.floor(options?.concurrency ?? 4))
  const workerCount = Math.min(concurrency, items.length)
  const timeoutMs = options?.timeoutMs
  let nextIndex = 0

  const okRows: Array<BulkOperationSuccess<TItem, TResult> & { index: number }> = []
  const failedRows: Array<BulkOperationFailure<TItem> & { index: number }> = []

  const runWorker = async () => {
    while (true) {
      const index = nextIndex
      nextIndex += 1
      if (index >= items.length) {
        return
      }

      const item = items[index]
      try {
        const task = worker(item, index)
        const result = typeof timeoutMs === 'number'
          ? await withTimeout(task, timeoutMs)
          : await task
        okRows.push({ index, item, result })
      }
      catch (error) {
        failedRows.push({ index, item, error: toError(error) })
      }
    }
  }

  await Promise.all(Array.from({ length: workerCount }, async () => {
    await runWorker()
  }))

  okRows.sort((left, right) => left.index - right.index)
  failedRows.sort((left, right) => left.index - right.index)

  return {
    ok: okRows.map(({ item, result }) => ({ item, result })),
    failed: failedRows.map(({ item, error }) => ({ item, error })),
  }
}

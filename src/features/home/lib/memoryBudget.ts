/** Maximum source bytes retained by the in-browser transform queue. */
export const MAX_QUEUE_SOURCE_BYTES = 256 * 1024 * 1024

/** Maximum row count retained by the in-browser transform queue. */
export const MAX_QUEUE_ITEMS = 200

/** Largest aggregate output batch that may be duplicated into an in-memory ZIP. */
export const MAX_ZIP_INPUT_BYTES = 128 * 1024 * 1024

interface SizedValue {
  size: number
}

export interface QueueBudgetResult<T> {
  accepted: T[]
  rejected: T[]
  totalBytes: number
  totalItems: number
}

/** Greedily admits files that fit both the queue byte and row budgets. */
export function selectWithinQueueBudget<T extends SizedValue>(input: {
  currentBytes: number
  currentItems: number
  candidates: readonly T[]
}): QueueBudgetResult<T> {
  let totalBytes = Math.max(0, input.currentBytes)
  let totalItems = Math.max(0, input.currentItems)
  const accepted: T[] = []
  const rejected: T[] = []

  for (const candidate of input.candidates) {
    const nextBytes = totalBytes + Math.max(0, candidate.size)
    if (totalItems >= MAX_QUEUE_ITEMS || nextBytes > MAX_QUEUE_SOURCE_BYTES) {
      rejected.push(candidate)
      continue
    }
    accepted.push(candidate)
    totalItems += 1
    totalBytes = nextBytes
  }

  return { accepted, rejected, totalBytes, totalItems }
}

/** Returns the aggregate bytes that JSZip would need to duplicate. */
export function getZipInputBytes(files: readonly SizedValue[]): number {
  return files.reduce((total, file) => total + Math.max(0, file.size), 0)
}

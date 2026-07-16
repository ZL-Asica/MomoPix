import { useCallback, useEffect, useRef, useState } from 'react'
import { z } from 'zod'
import {
  listMissingThumbnailsFn,
  persistMissingThumbnailFn,
} from '@/functions/thumbnails'
import { generateImageThumbnail } from '@/lib/img'

const MAINTENANCE_PAGE_SIZE = 8

const maintenancePageSchema = z.object({
  items: z.array(z.object({
    objectKey: z.string(),
    storedName: z.string(),
    mime: z.string(),
    publicUrl: z.string().url(),
  })),
  missingCount: z.number().int().nonnegative(),
  nextCursor: z.string().nullable(),
})

async function loadMaintenancePage(input: {
  cursor?: string | null
  pageSize: number
}): Promise<z.infer<typeof maintenancePageSchema>> {
  const result: unknown = await listMissingThumbnailsFn({ data: input })
  return maintenancePageSchema.parse(result)
}

export interface ThumbnailMaintenanceProgress {
  total: number
  processed: number
  succeeded: number
  failed: number
  currentName: string | null
}

type MaintenanceState = 'loading' | 'idle' | 'running' | 'error'

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

/** Runs the resumable, browser-side thumbnail migration one image at a time. */
export function useThumbnailMaintenance(onUpdated: () => void) {
  const [state, setState] = useState<MaintenanceState>('loading')
  const [missingCount, setMissingCount] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState<ThumbnailMaintenanceProgress | null>(null)
  const runningRef = useRef(false)
  const abortRef = useRef<AbortController | null>(null)
  const mountedRef = useRef(true)

  const refresh = useCallback(async () => {
    setState('loading')
    setError(null)
    try {
      const page = await loadMaintenancePage({ pageSize: 1 })
      if (!mountedRef.current) {
        return
      }
      setMissingCount(page.missingCount)
      setState('idle')
    }
    catch (cause) {
      if (!mountedRef.current) {
        return
      }
      setError(errorMessage(cause))
      setState('error')
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true
    void refresh()
    return () => {
      mountedRef.current = false
      runningRef.current = false
      abortRef.current?.abort()
    }
  }, [refresh])

  const cancel = useCallback(() => {
    runningRef.current = false
    abortRef.current?.abort()
    abortRef.current = null
    setState('idle')
    setProgress(previous => previous === null ? null : { ...previous, currentName: null })
  }, [])

  const start = useCallback(async () => {
    if (runningRef.current) {
      return
    }
    runningRef.current = true
    setState('running')
    setError(null)
    const controller = new AbortController()
    abortRef.current = controller
    let cursor: string | null = null
    let processed = 0
    let succeeded = 0
    let failed = 0
    let total = missingCount
    setProgress({ total, processed, succeeded, failed, currentName: null })

    try {
      do {
        const page = await loadMaintenancePage({ cursor, pageSize: MAINTENANCE_PAGE_SIZE })
        total = Math.max(total, page.missingCount)
        setProgress({ total, processed, succeeded, failed, currentName: null })

        for (const candidate of page.items) {
          if (!runningRef.current) {
            break
          }
          let didFinishCandidate = false
          setProgress({
            total,
            processed,
            succeeded,
            failed,
            currentName: candidate.storedName,
          })

          try {
            const response = await fetch(candidate.publicUrl, {
              mode: 'cors',
              signal: controller.signal,
            })
            if (!response.ok) {
              throw new Error(`Image download failed (${response.status})`)
            }
            const sourceBlob = await response.blob()
            const sourceFile = new File([sourceBlob], candidate.storedName, {
              type: sourceBlob.type || candidate.mime,
            })
            const thumbnail = await generateImageThumbnail(sourceFile)
            if (!runningRef.current) {
              break
            }

            const formData = new FormData()
            formData.set('objectKey', candidate.objectKey)
            formData.set('thumbnail', new File(
              [thumbnail.blob],
              `${candidate.storedName}.thumbnail.webp`,
              { type: 'image/webp' },
            ))
            await persistMissingThumbnailFn({ data: formData })
            succeeded += 1
            didFinishCandidate = true
          }
          catch (cause) {
            if (controller.signal.aborted) {
              break
            }
            failed += 1
            didFinishCandidate = true
            console.error(`[thumbnail-maintenance] Failed ${candidate.objectKey}:`, cause)
          }
          finally {
            if (didFinishCandidate) {
              processed += 1
              setProgress({ total, processed, succeeded, failed, currentName: null })
            }
          }
        }

        cursor = page.nextCursor
      } while (runningRef.current && cursor !== null)
    }
    catch (cause) {
      if (!controller.signal.aborted) {
        setError(errorMessage(cause))
      }
    }
    finally {
      runningRef.current = false
      abortRef.current = null
      if (mountedRef.current) {
        if (succeeded > 0) {
          onUpdated()
        }
        try {
          const summary = await loadMaintenancePage({ pageSize: 1 })
          if (mountedRef.current) {
            setMissingCount(summary.missingCount)
          }
        }
        catch (cause) {
          if (mountedRef.current) {
            setError(errorMessage(cause))
          }
        }
        if (mountedRef.current) {
          setProgress(previous => previous === null ? null : { ...previous, currentName: null })
          setState('idle')
        }
      }
    }
  }, [missingCount, onUpdated])

  return {
    state,
    missingCount,
    progress,
    error,
    start,
    cancel,
    refresh,
  }
}

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { getCurrentUserFn } from '@/functions/auth'

/**
 * Loads viewer auth state for home-page upload and copy affordances.
 *
 * @returns Auth status and loading state for guarded home UI sections.
 */
export function useHomeAuth() {
  const [isAuthLoading, setIsAuthLoading] = useState(true)
  const [isAuthed, setIsAuthed] = useState(false)

  useEffect(() => {
    let cancelled = false

    void (async () => {
      try {
        const currentUser = await getCurrentUserFn()
        if (!cancelled) {
          setIsAuthed(currentUser !== null)
        }
      }
      catch (error) {
        if (!cancelled) {
          setIsAuthed(false)
          toast.error('Failed to load account data', {
            description: error instanceof Error ? error.message : String(error),
          })
        }
      }
      finally {
        if (!cancelled) {
          setIsAuthLoading(false)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  return {
    isAuthLoading,
    isAuthed,
  }
}

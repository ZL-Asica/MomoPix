import { redirect } from '@tanstack/react-router'
import { getAuthConfig } from '@/lib/auth/env'
import { getSession } from '@/lib/auth/session'

/**
 * Returns whether the current request is authenticated.
 */
export async function isAuthed(): Promise<boolean> {
  const { sessionSecret } = getAuthConfig()

  if (sessionSecret === undefined || sessionSecret.length === 0) {
    return false
  }

  const session = await getSession()
  return session.data.isAuthed === true
}

/**
 * Enforces authentication and redirects unauthenticated requests to `/login`.
 */
export async function requireAuth(): Promise<void> {
  if (!(await isAuthed())) {
    throw redirect({ to: '/login' })
  }
}

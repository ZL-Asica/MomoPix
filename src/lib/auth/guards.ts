import { redirect } from '@tanstack/react-router'
import { getAuthConfig } from '@/lib/auth/env'
import { getSession } from '@/lib/auth/session'

/**
 * Returns whether the current request is authenticated.
 */
export async function isAuthed(_request?: Request): Promise<boolean> {
  const authConfig = getAuthConfig()
  if (authConfig.sessionSecret === undefined || authConfig.sessionSecret.length === 0) {
    return false
  }

  const session = await getSession()
  return session.data.isAuthed === true
}

/**
 * Enforces authentication and redirects unauthenticated requests to `/login`.
 */
export async function requireAuth(_request?: Request): Promise<void> {
  const authed = await isAuthed()
  if (!authed) {
    throw redirect({ to: '/login' })
  }
}

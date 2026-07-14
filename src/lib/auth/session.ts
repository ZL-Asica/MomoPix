import { useSession as getStartSession } from '@tanstack/react-start/server'
import { getAuthConfig } from '@/lib/auth/env'
import { isProductionRuntime } from '@/lib/env'

/** Session payload stored in the encrypted cookie. */
export interface AppSessionData {
  isAuthed?: boolean
  authedAt?: number
}

/** Session cookie name for MomoPix auth state. */
export const APP_SESSION_COOKIE_NAME = 'momopix-user-session'

function getSessionSecret(): string {
  const { sessionSecret } = getAuthConfig()

  if (sessionSecret === undefined || sessionSecret.length === 0) {
    throw new Error('Auth session secret is not configured')
  }

  return sessionSecret
}

/**
 * Creates/reads the current TanStack Start session for this request context.
 */
export async function getSession() {
  return getStartSession<AppSessionData>({
    name: APP_SESSION_COOKIE_NAME,
    password: getSessionSecret(),
    cookie: {
      secure: isProductionRuntime(),
      sameSite: 'lax',
      httpOnly: true,
      path: '/',
    },
  })
}

export type AppSession = Awaited<ReturnType<typeof getSession>>

/**
 * Persists auth-related data to the current session cookie.
 */
export async function commitSession(
  session: AppSession,
  data: Partial<AppSessionData>,
) {
  await session.update(oldData => ({
    ...oldData,
    ...data,
  }))
}

/**
 * Clears the current session cookie.
 */
export async function destroySession(session: AppSession) {
  await session.clear()
}

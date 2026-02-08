import { useSession } from '@tanstack/react-start/server'
import { getAuthConfig } from '@/lib/auth/env'
import { isProductionRuntime } from '@/lib/env'

/** Session payload stored in the encrypted cookie. */
export interface AppSessionData {
  isAuthed?: boolean
  authedAt?: number
}

/** Session cookie name for MomoPix auth state. */
export const APP_SESSION_COOKIE_NAME = 'momopix-user-session'

/**
 * Creates/reads the current TanStack Start session for this request context.
 */
export async function getSession(_request?: Request) {
  const authConfig = getAuthConfig()

  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useSession<AppSessionData>({
    name: APP_SESSION_COOKIE_NAME,
    password: authConfig.sessionSecret ?? 'momopix-disabled-session-secret',
    cookie: {
      secure: isProductionRuntime(),
      sameSite: 'lax',
      httpOnly: true,
      path: '/',
    },
  })
}

/**
 * Persists auth-related data to the current session cookie.
 */
export async function commitSession(
  session: Awaited<ReturnType<typeof getSession>>,
  data: Partial<AppSessionData>,
) {
  await session.update(oldData => ({ ...oldData, ...data }))
}

/**
 * Clears the current session cookie.
 */
export async function destroySession(session: Awaited<ReturnType<typeof getSession>>) {
  await session.clear()
}

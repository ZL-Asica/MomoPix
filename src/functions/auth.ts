import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { getAuthConfig } from '@/lib/auth/env'
import { isAuthed } from '@/lib/auth/guards'
import { commitSession, destroySession, getSession } from '@/lib/auth/session'
import { verifyTurnstileToken } from '@/lib/turnstile-server'
import { toErr } from '@/utils/to-error'

interface SingleUser {
  id: 'single-user'
  name: 'Owner'
}

const turnstileTokenSchema = z
  .string()
  .min(1)
  .optional()

const loginInputSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  turnstileToken: turnstileTokenSchema,
})

/**
 * Returns the single local user when a valid auth session exists.
 */
export const getCurrentUserFn = createServerFn({ method: 'GET' })
  .handler(async (): Promise<SingleUser | null> => {
    const authed = await isAuthed()
    if (!authed) {
      return null
    }

    return {
      id: 'single-user',
      name: 'Owner',
    }
  })

/**
 * Returns whether login is enabled and which required env vars are missing.
 */
export const getAuthConfigFn = createServerFn({ method: 'GET' })
  .handler(async () => {
    const authConfig = getAuthConfig()
    return {
      enabled: authConfig.enabled,
      missing: authConfig.missing,
    }
  })

/**
 * Logs in using shared token + Turnstile verification.
 */
export const loginFn = createServerFn({ method: 'POST' })
  .inputValidator(loginInputSchema)
  .handler(async ({ data }) => {
    try {
      const authConfig = getAuthConfig()
      if (!authConfig.enabled) {
        return {
          error: `Login is disabled. Missing env vars: ${authConfig.missing.join(', ')}`,
        }
      }

      const turnstile = await verifyTurnstileToken(data.turnstileToken)
      if (!turnstile.ok) {
        return { error: turnstile.message ?? 'Turnstile verification failed' }
      }

      if (data.token !== authConfig.authToken) {
        return { error: 'Invalid auth token' }
      }

      const session = await getSession()
      await commitSession(session, {
        isAuthed: true,
        authedAt: Date.now(),
      })

      return true
    }
    catch (error) {
      return toErr(error)
    }
  })

/**
 * Clears the current login session.
 */
export const logoutFn = createServerFn({ method: 'POST' })
  .handler(async () => {
    try {
      const session = await getSession()
      await destroySession(session)
      return true
    }
    catch (error) {
      return toErr(error)
    }
  })

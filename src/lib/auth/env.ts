import { AUTH_TOKEN, SESSION_SECRET, TURNSTILE_SECRET_KEY, TURNSTILE_SITE_KEY } from '@/lib/env'

/** Structured runtime auth configuration for login/session availability. */
export interface AuthConfig {
  enabled: boolean
  missing: string[]
  authToken?: string
  sessionSecret?: string
  turnstileSiteKey?: string
  turnstileSecretKey?: string
}

/**
 * Returns auth runtime configuration and missing required env var names.
 *
 * Login is enabled only when `AUTH_TOKEN`, `SESSION_SECRET`,
 * `VITE_TURNSTILE_SITE_KEY`, and `TURNSTILE_SECRET_KEY` are all configured.
 */
export function getAuthConfig(): AuthConfig {
  const missing: string[] = []

  if (!AUTH_TOKEN) {
    missing.push('AUTH_TOKEN')
  }
  if (!SESSION_SECRET) {
    missing.push('SESSION_SECRET')
  }
  if (!TURNSTILE_SITE_KEY) {
    missing.push('VITE_TURNSTILE_SITE_KEY')
  }
  if (!TURNSTILE_SECRET_KEY) {
    missing.push('TURNSTILE_SECRET_KEY')
  }

  return {
    enabled: missing.length === 0,
    missing,
    authToken: AUTH_TOKEN || undefined,
    sessionSecret: SESSION_SECRET || undefined,
    turnstileSiteKey: TURNSTILE_SITE_KEY || undefined,
    turnstileSecretKey: TURNSTILE_SECRET_KEY || undefined,
  }
}

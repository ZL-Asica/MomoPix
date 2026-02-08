import process from 'node:process'

/**
 * Returns a trimmed environment variable value.
 */
function readEnv(name: keyof NodeJS.ProcessEnv): string {
  return process.env[name]?.trim() ?? ''
}

/** Shared auth token required to access the app. */
export const AUTH_TOKEN = readEnv('AUTH_TOKEN')

/** Secret used to encrypt/sign session cookies. */
export const SESSION_SECRET = readEnv('SESSION_SECRET')

/** Cloudflare Turnstile secret key used for server-side verification. */
export const TURNSTILE_SECRET_KEY = readEnv('TURNSTILE_SECRET_KEY')

/** Cloudflare Turnstile site key used by the client widget. */
export const TURNSTILE_SITE_KEY = readEnv('VITE_TURNSTILE_SITE_KEY')

/**
 * Throws when a required environment variable is not configured.
 */
export function requireEnv(value: string, name: string): string {
  if (value.length > 0) {
    return value
  }

  throw new Error(`${name} is not configured`)
}

/**
 * Whether current runtime is production.
 */
export function isProductionRuntime(): boolean {
  return readEnv('NODE_ENV') === 'production'
}

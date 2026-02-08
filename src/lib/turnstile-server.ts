import { TURNSTILE_SECRET_KEY } from '@/lib/env'

const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

interface TurnstileResponse {
  'success': boolean
  'error-codes'?: string[]
}

/** Result returned by Turnstile server-side verification. */
export interface TurnstileVerifyResult {
  ok: boolean
  message?: string
}

/**
 * Verifies a Cloudflare Turnstile token using Cloudflare's `siteverify` API.
 */
export async function verifyTurnstileToken(
  turnstileToken?: string | null,
): Promise<TurnstileVerifyResult> {
  if (!TURNSTILE_SECRET_KEY) {
    return { ok: false, message: 'TURNSTILE_SECRET_KEY is not configured' }
  }

  if (turnstileToken === null || turnstileToken === undefined || turnstileToken.trim() === '') {
    return { ok: false, message: 'Turnstile verification token is missing' }
  }

  try {
    const params = new URLSearchParams()
    params.append('secret', TURNSTILE_SECRET_KEY)
    params.append('response', turnstileToken)

    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      body: params,
    })

    if (!response.ok) {
      return {
        ok: false,
        message: 'Unable to verify Turnstile challenge, please try again',
      }
    }

    const result: TurnstileResponse = await response.json()

    if (!result.success) {
      return {
        ok: false,
        message: 'Turnstile verification failed, please try again',
      }
    }

    return { ok: true }
  }
  catch {
    return {
      ok: false,
      message: 'Unable to verify Turnstile challenge, please try again',
    }
  }
}

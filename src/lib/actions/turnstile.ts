'use server'

import { getCloudflareContext } from '@opennextjs/cloudflare'
import { headers } from 'next/headers'

export const verifyTurnstileToken = async (
  token?: string,
): Promise<boolean> => {
  // eslint-disable-next-line node/prefer-global/process
  if (token === undefined || token === null || (await getCloudflareContext({ async: true })).env.NEXTJS_ENV === 'development' || process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY === null || process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY === undefined || process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY === '') {
    // If even site key is not set, we will ignore human verification
    return true
  }

  const headersList = await headers()
  const ip = headersList.get('CF-Connecting-IP')
  if (ip === undefined || ip === null) {
    return false
  }

  const turnstileFormData = new FormData()
  const turnstileSecretKey = (await getCloudflareContext({ async: true })).env.TURNSTILE_SECRET_KEY
  if (turnstileSecretKey === undefined || turnstileSecretKey === null) {
    throw new Error('TURNSTILE_SECRET_KEY is not set')
  }
  turnstileFormData.append('secret', turnstileSecretKey)
  turnstileFormData.append('response', token)
  turnstileFormData.append('remoteip', ip)

  const url = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

  const result = await fetch(url, {
    body: turnstileFormData,
    method: 'POST',
  })

  const outcome: { success: boolean } = await result.json()

  return outcome.success
}

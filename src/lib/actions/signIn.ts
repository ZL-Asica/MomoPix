'use server'

import { signIn } from '@/app/auth'
import { signInSchema } from '@/schemas'
import { verifyTurnstileToken } from './turnstile'

const signInSuccessMessage = 'Check your email for a sign in link (also spam folder).'

export const signInWithResend = async (
  _: any,
  formData?: FormData,
): Promise<ActionResponse> => {
  const { success, data } = signInSchema.safeParse(Object.fromEntries(formData ?? []))
  if (!success) {
    return {
      success: false,
      message: 'Invalid email address',
    }
  }

  const turnstileValid = await verifyTurnstileToken(data.turnstileToken)
  if (!turnstileValid) {
    return {
      success: false,
      message: 'Human verification failed',
    }
  }

  try {
    await signIn('resend', { email: data.email, redirect: false })
    return {
      success: true,
      message: signInSuccessMessage,
    }
  }
  catch (error) {
    console.error('[SIGN_IN] Failed to sign in: ', error instanceof Error ? error.message : 'Unknown error')
    return {
      success: false,
      message: 'Failed to sign in',
    }
  }
}

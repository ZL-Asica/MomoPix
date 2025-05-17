import { z } from 'zod'

const turnstileTokenSchema = z.object({
  turnstileToken: z.string().optional().describe('The Turnstile token to verify'),
})

export const signInSchema = turnstileTokenSchema.extend({
  email: z.string().email().describe('The email address to sign in with'),
})

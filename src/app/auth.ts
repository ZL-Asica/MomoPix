import type { NextAuthResult } from 'next-auth'
import { D1Adapter } from '@auth/d1-adapter'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import NextAuth from 'next-auth'
import Resend from 'next-auth/providers/resend'

const authResult = async (): Promise<NextAuthResult> => {
  return NextAuth({
    providers: [
      Resend({
        apiKey: (await getCloudflareContext({ async: true })).env.AUTH_RESEND_KEY,
        from: (await getCloudflareContext({ async: true })).env.AUTH_EMAIL_FROM,
      }),
    ],
    adapter: D1Adapter((await getCloudflareContext({ async: true })).env.DB),
  })
}

// eslint-disable-next-line antfu/no-top-level-await
export const { handlers, signIn, signOut, auth } = await authResult()

import type { NextAuthResult } from 'next-auth'
import { D1Adapter } from '@auth/d1-adapter'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import NextAuth from 'next-auth'
import Resend from 'next-auth/providers/resend'
import { html, text } from '@/lib/authSendRequest'

const authResult = async (): Promise<NextAuthResult> => {
  return NextAuth({
    providers: [
      Resend({
        apiKey: (await getCloudflareContext({ async: true })).env.AUTH_RESEND_KEY,
        from: (await getCloudflareContext({ async: true })).env.AUTH_EMAIL_FROM,
        sendVerificationRequest: async (params) => {
          const { identifier: to, provider, url, theme } = params
          const { host } = new URL(url)
          const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${provider.apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: `MomoPix <${provider.from}>`,
              to,
              subject: `[MomoPix] Sign in to MomoPix`,
              html: html({ url, host, theme }),
              text: text({ url, host }),
            }),
          })
          if (!res.ok) {
            throw new Error(`Resend error: ${JSON.stringify(await res.json())}`)
          }
        },
      }),
    ],
    adapter: D1Adapter((await getCloudflareContext({ async: true })).env.DB),
  })
}

// eslint-disable-next-line antfu/no-top-level-await
export const { handlers, signIn, signOut, auth } = await authResult()

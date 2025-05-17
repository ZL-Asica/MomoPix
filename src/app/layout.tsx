import type { Metadata } from 'next'
import { SessionProvider } from 'next-auth/react'
import { Inter, Noto_Sans_SC } from 'next/font/google'
import { Toaster } from 'sonner'

import { Footer, Header, ScrollPositionBar } from '@/components/layout'
import './globals.css'

const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-roboto',
  display: 'swap',
  preload: true,
})

const notoSansSC = Noto_Sans_SC({
  subsets: ['latin', 'latin-ext', 'vietnamese'],
  variable: '--font-noto-sans-sc',
  display: 'swap',
  preload: true,
})

export const metadata: Metadata = {
  title: 'Momo Pix',
  description: 'Momo Pix',
  // ! Remove this when the site is ready
  robots: { index: false, follow: false },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${notoSansSC.variable} font-sans flex min-h-dvh flex-col antialiased`}
      >
        <Toaster position="top-center" richColors />
        <ScrollPositionBar />
        <SessionProvider>
          <Header />
          <main className="grow mt-24 px-4 sm:px-6 motion-safe:animate-mask-reveal">
            {children}
          </main>
          <Footer />
        </SessionProvider>
      </body>
    </html>
  )
}

import type { Metadata } from 'next'
import { Inter, JetBrains_Mono, Noto_Sans_SC } from 'next/font/google'
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

const jetBrainsMono = JetBrains_Mono({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
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
        className={`${inter.variable} ${notoSansSC.variable} ${jetBrainsMono.variable} font-sans flex max-h-full min-h-screen flex-col antialiased`}
      >
        <Toaster position="top-center" richColors />
        <ScrollPositionBar />
        <Header />
        <main className="grow mt-20 px-4 sm:px-6 motion-safe:animate-mask-reveal">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createRootRoute, HeadContent, Scripts } from '@tanstack/react-router'
import { lazy, Suspense, useState } from 'react'
import { Toaster } from 'sonner'
import { Footer, Header, ScrollPositionBar } from '@/components/layout'

import appCss from '../styles.css?url'

const DevelopmentDevtools = import.meta.env.DEV
  ? lazy(async () => ({
      default: (await import('@/components/devtools/DevelopmentDevtools')).DevelopmentDevtools,
    }))
  : null

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { name: 'robots', content: 'noindex, nofollow' },
      { title: 'Momo Pix - Your own image hosting on Edge' },
      { name: 'description', content: 'Momo Pix is a free and open-source image hosting service that leverages edge computing to provide fast and reliable image storage and delivery.' },
      { name: 'keywords', content: 'image hosting, edge computing, free image hosting, open-source image hosting, fast image delivery' },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
    ],
  }),

  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="font-sans flex min-h-dvh flex-col antialiased">
        <a
          href="#main-content"
          className="sr-only fixed left-4 top-4 z-100 rounded bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only"
        >
          Skip to main content
        </a>
        <QueryClientProvider client={queryClient}>
          <Toaster position="top-center" richColors />
          <ScrollPositionBar />
          <Header />
          <main
            id="main-content"
            tabIndex={-1}
            className="grow mt-24 px-4 sm:px-6 motion-safe:animate-mask-reveal"
          >
            {children}
          </main>
          <Footer />
          {DevelopmentDevtools !== null && (
            <Suspense fallback={null}>
              <DevelopmentDevtools />
            </Suspense>
          )}
          <Scripts />
        </QueryClientProvider>
      </body>
    </html>
  )
}

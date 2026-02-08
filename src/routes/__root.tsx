import { TanStackDevtools } from '@tanstack/react-devtools'
import { createRootRoute, HeadContent, Scripts } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { Toaster } from 'sonner'
import { Footer, Header, ScrollPositionBar } from '@/components/layout'

import appCss from '../styles.css?url'

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
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="font-sans flex min-h-dvh flex-col antialiased">
        <Toaster position="top-center" richColors />
        <ScrollPositionBar />
        <Header />
        <main
          id="main-content"
          className="grow mt-24 px-4 sm:px-6 motion-safe:animate-mask-reveal"
        >
          {children}
        </main>
        <Footer />
        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[{
            name: 'Tanstack Router',
            render: <TanStackRouterDevtoolsPanel />,
          }]}
        />
        <Scripts />
      </body>
    </html>
  )
}

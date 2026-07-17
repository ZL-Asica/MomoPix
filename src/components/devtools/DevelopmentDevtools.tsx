import { TanStackDevtools } from '@tanstack/react-devtools'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'

/** Development-only router/query inspection controls. */
export function DevelopmentDevtools() {
  return (
    <TanStackDevtools
      config={{ position: 'bottom-right' }}
      plugins={[{
        name: 'Tanstack Router',
        render: <TanStackRouterDevtoolsPanel />,
      }]}
    />
  )
}

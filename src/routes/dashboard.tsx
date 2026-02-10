import { createFileRoute, redirect } from '@tanstack/react-router'
import { DashboardFeature } from '@/features/dashboard/components/DashboardFeature'
import { getCurrentUserFn } from '@/functions/auth'

export const Route = createFileRoute('/dashboard')({
  beforeLoad: async () => {
    const user = await getCurrentUserFn()
    if (!user) {
      throw redirect({ to: '/login' })
    }
  },
  component: DashboardRoute,
})

function DashboardRoute() {
  return <DashboardFeature />
}

import { createFileRoute, redirect } from '@tanstack/react-router'
import { DashboardFeature } from '@/features/dashboard/components/DashboardFeature'
import { DASHBOARD_PAGE_SIZES, normalizeDashboardQuery } from '@/features/dashboard/lib/urlState'
import { getCurrentUserFn } from '@/functions/auth'

export const Route = createFileRoute('/dashboard')({
  validateSearch: (search: Record<string, unknown>) => {
    const query = typeof search.q === 'string' ? normalizeDashboardQuery(search.q) : undefined
    return {
      ...(typeof search.album === 'string' ? { album: search.album } : {}),
      ...(query === undefined ? {} : { q: query }),
      ...(typeof search.page === 'number' && Number.isInteger(search.page) && search.page > 0 ? { page: search.page } : {}),
      ...(DASHBOARD_PAGE_SIZES.includes(search.pageSize as typeof DASHBOARD_PAGE_SIZES[number])
        ? { pageSize: search.pageSize }
        : {}),
    }
  },
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

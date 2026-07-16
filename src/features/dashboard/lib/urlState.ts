export const DASHBOARD_PAGE_SIZES = [25, 50, 100, 200] as const

export interface DashboardUrlState {
  album?: string
  q?: string
  page: number
  pageSize: number
}

/**
 * Normalizes dashboard search input for the URL and server query contract.
 */
export function normalizeDashboardQuery(value: string): string | undefined {
  const normalized = value.trim().slice(0, 120)
  return normalized.length > 0 ? normalized : undefined
}

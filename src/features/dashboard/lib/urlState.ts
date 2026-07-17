import type { ImageDateFilter, ImageFormatFilter, ImageListSort, ImageOrientationFilter, ImageResolutionFilter } from '@/lib/storage/types'
import { IMAGE_LIST_SORTS } from '@/lib/storage/types'

export const DASHBOARD_PAGE_SIZES = [25, 50, 100, 200] as const
export const DASHBOARD_IMAGE_FORMATS = ['all', 'avif', 'bmp', 'gif', 'jpeg', 'png', 'webp'] as const
export const DASHBOARD_IMAGE_ORIENTATIONS = ['all', 'landscape', 'portrait', 'square'] as const
export const DASHBOARD_IMAGE_DATES = ['all', 'today', '7d', '30d', '1y'] as const
export const DASHBOARD_IMAGE_RESOLUTIONS = ['all', 'under-2mp', '2-12mp', '12-24mp', 'over-24mp'] as const
export const DASHBOARD_IMAGE_SCOPES = ['album', 'all'] as const
export type DashboardImageScope = typeof DASHBOARD_IMAGE_SCOPES[number]

export interface DashboardUrlState {
  album?: string
  q?: string
  page: number
  pageSize: number
  sort: ImageListSort
  format: ImageFormatFilter
  orientation: ImageOrientationFilter
  date: ImageDateFilter
  resolution: ImageResolutionFilter
  scope: DashboardImageScope
}

export function isDashboardImageSort(value: unknown): value is ImageListSort {
  return IMAGE_LIST_SORTS.includes(value as ImageListSort)
}

export function isDashboardImageFormat(value: unknown): value is ImageFormatFilter {
  return DASHBOARD_IMAGE_FORMATS.includes(value as ImageFormatFilter)
}

export function isDashboardImageOrientation(value: unknown): value is ImageOrientationFilter {
  return DASHBOARD_IMAGE_ORIENTATIONS.includes(value as ImageOrientationFilter)
}

export function isDashboardImageDate(value: unknown): value is ImageDateFilter {
  return DASHBOARD_IMAGE_DATES.includes(value as ImageDateFilter)
}

export function isDashboardImageResolution(value: unknown): value is ImageResolutionFilter {
  return DASHBOARD_IMAGE_RESOLUTIONS.includes(value as ImageResolutionFilter)
}

export function isDashboardImageScope(value: unknown): value is DashboardImageScope {
  return DASHBOARD_IMAGE_SCOPES.includes(value as DashboardImageScope)
}

/**
 * Normalizes dashboard search input for the URL and server query contract.
 */
export function normalizeDashboardQuery(value: string): string | undefined {
  const normalized = value.trim().slice(0, 120)
  return normalized.length > 0 ? normalized : undefined
}

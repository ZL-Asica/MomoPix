import type { AlbumImageListItem } from '@/lib/storage/types'

/**
 * Returns the images that are safe to render for the active dashboard album/search view.
 *
 * The `images` array only represents one loaded view at a time, so rows are renderable only
 * when that loaded payload belongs to the currently selected view key.
 */
export function getRenderableImages(input: {
  images: AlbumImageListItem[]
  hasCurrentViewData: boolean
}): AlbumImageListItem[] {
  return input.hasCurrentViewData ? input.images : []
}

/**
 * Computes whether the dashboard should show the initial loading skeleton for the active view.
 *
 * The skeleton is shown whenever the active view does not yet have rows bound to it and a fetch
 * (or transition-triggered fetch) is in progress.
 */
export function getIsInitialImagesLoading(input: {
  hasCurrentViewData: boolean
  isFetching: boolean
  imagesState: 'idle' | 'loading' | 'success' | 'error'
}): boolean {
  if (input.hasCurrentViewData) {
    return false
  }

  return input.isFetching || input.imagesState === 'loading'
}

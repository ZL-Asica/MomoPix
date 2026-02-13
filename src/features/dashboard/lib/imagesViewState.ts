import type { AlbumImageListItem } from '@/lib/storage/types'

/**
 * Returns the images that are safe to render for the active dashboard album/search view.
 *
 * When the active view has not been loaded yet, this returns an empty list to prevent
 * rendering stale rows from a previously selected album while the new request is pending.
 */
export function getRenderableImages(input: {
  images: AlbumImageListItem[]
  hasLoadedCurrentView: boolean
}): AlbumImageListItem[] {
  return input.hasLoadedCurrentView ? input.images : []
}

/**
 * Computes whether the dashboard should show the initial loading skeleton for the active view.
 *
 * The skeleton is shown for views that have not loaded successfully yet and are currently
 * transitioning/fetching.
 */
export function getIsInitialImagesLoading(input: {
  hasLoadedCurrentView: boolean
  isFetching: boolean
  imagesState: 'idle' | 'loading' | 'success' | 'error'
}): boolean {
  if (input.hasLoadedCurrentView) {
    return false
  }

  return input.isFetching || input.imagesState === 'loading'
}

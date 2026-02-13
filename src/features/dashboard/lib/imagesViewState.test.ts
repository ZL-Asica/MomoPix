import { describe, expect, it } from 'vitest'
import { getIsInitialImagesLoading, getRenderableImages } from './imagesViewState'

describe('getRenderableImages', () => {
  it('returns empty list when current view has not loaded to avoid stale album rows', () => {
    const previousAlbumRows: Array<{ objectKey: string }> = [
      { objectKey: 'a' },
      { objectKey: 'b' },
    ]

    expect(getRenderableImages({ images: previousAlbumRows, hasLoadedCurrentView: false })).toEqual([])
  })

  it('returns existing rows once the current view has loaded', () => {
    const currentAlbumRows: Array<{ objectKey: string }> = [{ objectKey: 'album-b-1' }]

    expect(getRenderableImages({ images: currentAlbumRows, hasLoadedCurrentView: true })).toBe(currentAlbumRows)
  })
})

describe('getIsInitialImagesLoading', () => {
  it('returns true for an unloaded view while fetching', () => {
    expect(getIsInitialImagesLoading({
      hasLoadedCurrentView: false,
      isFetching: true,
      imagesState: 'idle',
    })).toBe(true)
  })

  it('returns true for an unloaded view in loading state', () => {
    expect(getIsInitialImagesLoading({
      hasLoadedCurrentView: false,
      isFetching: false,
      imagesState: 'loading',
    })).toBe(true)
  })

  it('returns false once current view has loaded even if a refetch is pending', () => {
    expect(getIsInitialImagesLoading({
      hasLoadedCurrentView: true,
      isFetching: true,
      imagesState: 'loading',
    })).toBe(false)
  })
})

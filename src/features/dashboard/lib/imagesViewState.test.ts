import { describe, expect, it } from 'vitest'
import { getIsInitialImagesLoading, getRenderableImages } from './imagesViewState'

describe('getRenderableImages', () => {
  it('returns empty list when current rows belong to a different view', () => {
    const previousAlbumRows = [
      { objectKey: 'a' },
      { objectKey: 'b' },
    ] as any

    expect(getRenderableImages({ images: previousAlbumRows, hasCurrentViewData: false })).toEqual([])
  })

  it('returns existing rows once rows belong to the active view key', () => {
    const currentAlbumRows = [{ objectKey: 'album-b-1' }] as any

    expect(getRenderableImages({ images: currentAlbumRows, hasCurrentViewData: true })).toBe(currentAlbumRows)
  })
})

describe('getIsInitialImagesLoading', () => {
  it('returns true when active view has no bound rows and fetch is pending', () => {
    expect(getIsInitialImagesLoading({
      hasCurrentViewData: false,
      isFetching: true,
      imagesState: 'idle',
    })).toBe(true)
  })

  it('returns true when active view has no bound rows and state is loading', () => {
    expect(getIsInitialImagesLoading({
      hasCurrentViewData: false,
      isFetching: false,
      imagesState: 'loading',
    })).toBe(true)
  })

  it('returns false when active view already has bound rows', () => {
    expect(getIsInitialImagesLoading({
      hasCurrentViewData: true,
      isFetching: true,
      imagesState: 'loading',
    })).toBe(false)
  })
})

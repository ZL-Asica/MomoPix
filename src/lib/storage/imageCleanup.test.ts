import { beforeEach, describe, expect, it, vi } from 'vitest'
import { deleteImageSafely, reconcilePendingImageDeletes } from './imageCleanup'

const mocks = vi.hoisted(() => ({
  deleteImageObject: vi.fn(),
  deleteImageRecords: vi.fn(),
  listImagesPendingDeletion: vi.fn(),
  markImageForDeletion: vi.fn(),
  recordImageCleanupFailure: vi.fn(),
}))

vi.mock('@/lib/storage/imagesRepo', () => ({
  deleteImageRecords: mocks.deleteImageRecords,
  listImagesPendingDeletion: mocks.listImagesPendingDeletion,
  markImageForDeletion: mocks.markImageForDeletion,
  recordImageCleanupFailure: mocks.recordImageCleanupFailure,
}))

vi.mock('@/lib/storage/r2Repo', () => ({
  deleteImageObject: mocks.deleteImageObject,
}))

const image = {
  objectKey: '2026/07/15/image.webp',
  albumId: 'album-1',
  name: 'image',
  originalName: 'image.webp',
  storedName: 'image.webp',
  ext: 'webp',
  mime: 'image/webp',
  sizeBytes: 100,
  width: 10,
  height: 10,
  createdAt: '2026-07-15T00:00:00.000Z',
  updatedAt: '2026-07-15T00:00:00.000Z',
  source: 'dashboard-upload' as const,
}

const bindings = {
  db: {} as D1Database,
  r2: {} as R2Bucket,
}

describe('imageCleanup', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('tombstones before deleting the matching R2 object', async () => {
    await expect(deleteImageSafely({ ...bindings, image })).resolves.toEqual({
      image,
      cleanupPending: false,
    })

    expect(mocks.markImageForDeletion).toHaveBeenCalledWith(bindings.db, image.objectKey)
    expect(mocks.deleteImageObject).toHaveBeenCalledWith(bindings.r2, image.objectKey)
    expect(mocks.deleteImageRecords).toHaveBeenCalledWith(bindings.db, image)
    expect(mocks.recordImageCleanupFailure).not.toHaveBeenCalled()
  })

  it('retains a tombstone when R2 cleanup fails', async () => {
    mocks.deleteImageObject.mockRejectedValueOnce(new Error('R2 unavailable'))

    await expect(deleteImageSafely({ ...bindings, image })).resolves.toEqual({
      image,
      cleanupPending: true,
    })

    expect(mocks.deleteImageRecords).not.toHaveBeenCalled()
    expect(mocks.recordImageCleanupFailure).toHaveBeenCalledWith(bindings.db, {
      objectKey: image.objectKey,
      message: 'R2 unavailable',
    })
  })

  it('retries each pending tombstone and leaves failed ones for later', async () => {
    const failedImage = { ...image, objectKey: '2026/07/15/failed.webp' }
    mocks.listImagesPendingDeletion.mockResolvedValueOnce([image, failedImage])
    mocks.deleteImageObject
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('transient failure'))

    await expect(reconcilePendingImageDeletes({ ...bindings, limit: 2 })).resolves.toEqual({
      reconciled: 1,
      pending: 1,
    })

    expect(mocks.deleteImageRecords).toHaveBeenCalledTimes(1)
    expect(mocks.deleteImageRecords).toHaveBeenCalledWith(bindings.db, image)
    expect(mocks.recordImageCleanupFailure).toHaveBeenCalledWith(bindings.db, {
      objectKey: failedImage.objectKey,
      message: 'transient failure',
    })
  })
})

import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  getDb: vi.fn(),
  buildThumbnailR2ObjectKey: vi.fn(() => 'thumbnails/2026/07/16/thumb.webp'),
  putImageObject: vi.fn(),
  cleanupUncommittedUpload: vi.fn(),
  releaseStorageReservation: vi.fn(),
}))

vi.mock('@/lib/db/client', () => ({ getDb: mocks.getDb }))
vi.mock('@/lib/storage/r2Repo', () => ({
  buildThumbnailR2ObjectKey: mocks.buildThumbnailR2ObjectKey,
  putImageObject: mocks.putImageObject,
}))
vi.mock('@/lib/storage/uploadReconciliation', () => ({
  cleanupUncommittedUpload: mocks.cleanupUncommittedUpload,
  releaseStorageReservation: mocks.releaseStorageReservation,
}))

function selectChain(result: unknown, rejection?: Error) {
  const chain = {
    from: vi.fn(),
    where: vi.fn(),
    limit: vi.fn(),
  }
  chain.from.mockReturnValue(chain)
  chain.where.mockReturnValue(chain)
  chain.limit.mockImplementation(async () => {
    if (rejection !== undefined) {
      throw rejection
    }
    return result
  })
  return chain
}

function createDb(input: {
  storedRows?: unknown[][]
  updateError?: Error
  updatedRows?: unknown[]
}) {
  const storedRows = input.storedRows ?? [[{ objectKey: null }]]
  const select = vi.fn()
  for (const rows of storedRows) {
    select.mockReturnValueOnce(selectChain(rows))
  }
  select.mockReturnValueOnce(selectChain([{
    albumId: 'album-1',
    source: 'dashboard-upload',
  }]))

  const insertValues = vi.fn().mockResolvedValue(undefined)
  const insert = vi.fn(() => ({ values: insertValues }))
  const returning = input.updateError === undefined
    ? vi.fn().mockResolvedValue(input.updatedRows ?? [{ id: 'image-1' }])
    : vi.fn().mockRejectedValue(input.updateError)
  const updateChain = {
    set: vi.fn(),
    where: vi.fn(),
    returning,
  }
  updateChain.set.mockReturnValue(updateChain)
  updateChain.where.mockReturnValue(updateChain)
  const update = vi.fn(() => updateChain)

  return { select, insert, update, insertValues }
}

const bindings = {
  db: {} as D1Database,
  r2: {} as R2Bucket,
}

describe('persistMissingThumbnail', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mocks.buildThumbnailR2ObjectKey.mockReturnValue('thumbnails/2026/07/16/thumb.webp')
    mocks.putImageObject.mockResolvedValue(undefined)
    mocks.cleanupUncommittedUpload.mockResolvedValue(undefined)
    mocks.releaseStorageReservation.mockResolvedValue(undefined)
  })

  it('reserves, writes, and atomically attaches a thumbnail', async () => {
    const db = createDb({})
    mocks.getDb.mockReturnValue(db)
    const { persistMissingThumbnail } = await import('./thumbnailMaintenance')

    const result = await persistMissingThumbnail({
      ...bindings,
      objectKey: 'image-1',
      bytes: new Uint8Array([1, 2, 3]).buffer,
      width: 48,
      height: 32,
    })

    expect(db.insertValues).toHaveBeenCalledWith(expect.objectContaining({
      objectKey: 'thumbnails/2026/07/16/thumb.webp',
      bytesReserved: 3,
    }))
    expect(mocks.putImageObject).toHaveBeenCalledWith(bindings.r2, expect.objectContaining({
      key: 'thumbnails/2026/07/16/thumb.webp',
      mime: 'image/webp',
    }))
    expect(result).toMatchObject({ alreadyPresent: false, thumbnail: { width: 48, height: 32 } })
    expect(mocks.cleanupUncommittedUpload).not.toHaveBeenCalled()
  })

  it('cleans the reserved object when the R2 write fails', async () => {
    const db = createDb({})
    mocks.getDb.mockReturnValue(db)
    mocks.putImageObject.mockRejectedValueOnce(new Error('R2 unavailable'))
    const { persistMissingThumbnail } = await import('./thumbnailMaintenance')

    await expect(persistMissingThumbnail({
      ...bindings,
      objectKey: 'image-1',
      bytes: new Uint8Array([1]).buffer,
      width: 1,
      height: 1,
    })).rejects.toThrow('R2 unavailable')

    expect(mocks.cleanupUncommittedUpload).toHaveBeenCalledOnce()
  })

  it('retains the object and reservation when D1 commit state is unknown', async () => {
    const db = createDb({
      storedRows: [
        [{ objectKey: null }],
        [],
      ],
      updateError: new Error('D1 response lost'),
    })
    // The state check after the failed UPDATE must itself be unavailable.
    db.select.mockReset()
    db.select
      .mockReturnValueOnce(selectChain([{ objectKey: null }]))
      .mockReturnValueOnce(selectChain([{ albumId: 'album-1', source: 'dashboard-upload' }]))
      .mockReturnValueOnce(selectChain([], new Error('D1 unavailable')))
    mocks.getDb.mockReturnValue(db)
    const { persistMissingThumbnail } = await import('./thumbnailMaintenance')

    await expect(persistMissingThumbnail({
      ...bindings,
      objectKey: 'image-1',
      bytes: new Uint8Array([1]).buffer,
      width: 1,
      height: 1,
    })).rejects.toThrow('D1 response lost')

    expect(mocks.cleanupUncommittedUpload).not.toHaveBeenCalled()
    expect(mocks.releaseStorageReservation).not.toHaveBeenCalled()
  })
})

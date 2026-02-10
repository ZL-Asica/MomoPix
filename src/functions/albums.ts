import { createServerFn } from '@tanstack/react-start'
import { requireAuth } from '@/lib/auth/guards'
import { getD1Binding } from '@/lib/cloudflare/bindings'
import { createAlbumRecord, ensureStorageBootstrap, listAlbumRecords, moveAlbumRecord, renameAlbumRecord, setDefaultAlbum } from '@/lib/storage/albumsRepo'
import { createAlbumSchema, moveAlbumSchema, renameAlbumSchema, setDefaultAlbumSchema } from '@/lib/storage/validators'

/**
 * Returns the full album tree and storage meta for dashboard/index use.
 */
export const listAlbumsFn = createServerFn({ method: 'GET' })
  .handler(async () => {
    await requireAuth()
    const db = getD1Binding()
    const { meta } = await ensureStorageBootstrap(db)
    const albums = await listAlbumRecords(db)
    return {
      meta,
      albums,
    }
  })

/**
 * Creates a new album under the requested parent and returns refreshed snapshots.
 */
export const createAlbumFn = createServerFn({ method: 'POST' })
  .inputValidator(createAlbumSchema)
  .handler(async ({ data }) => {
    await requireAuth()
    const db = getD1Binding()
    const album = await createAlbumRecord(db, data)
    const albums = await listAlbumRecords(db)
    const { meta } = await ensureStorageBootstrap(db)
    return { album, albums, meta }
  })

/**
 * Renames an existing album and returns refreshed snapshots.
 */
export const renameAlbumFn = createServerFn({ method: 'POST' })
  .inputValidator(renameAlbumSchema)
  .handler(async ({ data }) => {
    await requireAuth()
    const db = getD1Binding()
    const album = await renameAlbumRecord(db, data)
    const albums = await listAlbumRecords(db)
    const { meta } = await ensureStorageBootstrap(db)
    return { album, albums, meta }
  })

/**
 * Moves an album in the tree and returns refreshed snapshots.
 */
export const moveAlbumFn = createServerFn({ method: 'POST' })
  .inputValidator(moveAlbumSchema)
  .handler(async ({ data }) => {
    await requireAuth()
    const db = getD1Binding()
    const movedAlbum = await moveAlbumRecord(db, data)
    const albums = await listAlbumRecords(db)
    const { meta } = await ensureStorageBootstrap(db)
    return { movedAlbum, albums, meta }
  })

/**
 * Updates the default upload destination album.
 */
export const setDefaultAlbumFn = createServerFn({ method: 'POST' })
  .inputValidator(setDefaultAlbumSchema)
  .handler(async ({ data }) => {
    await requireAuth()
    const db = getD1Binding()
    const meta = await setDefaultAlbum(db, data)
    return { meta }
  })

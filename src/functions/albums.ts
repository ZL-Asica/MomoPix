import { createServerFn } from '@tanstack/react-start'
import { requireAuth } from '@/lib/auth/guards'
import { getKVBinding } from '@/lib/cloudflare/bindings'
import { createAlbumRecord, ensureStorageBootstrap, listAlbumRecords, moveAlbumRecord, renameAlbumRecord, setDefaultAlbum } from '@/lib/storage/albumsRepo'
import { recountUsage } from '@/lib/storage/usage'
import { createAlbumSchema, moveAlbumSchema, renameAlbumSchema, setDefaultAlbumSchema } from '@/lib/storage/validators'

/**
 * Returns the full album tree and storage meta for dashboard/index use.
 */
export const listAlbumsFn = createServerFn({ method: 'GET' })
  .handler(async () => {
    await requireAuth()
    const kv = getKVBinding()
    const { meta } = await ensureStorageBootstrap(kv)

    if (meta.needsRecount) {
      await recountUsage(kv)
    }

    const refreshed = await ensureStorageBootstrap(kv)
    const albums = await listAlbumRecords(kv)
    return {
      meta: refreshed.meta,
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
    const kv = getKVBinding()
    const album = await createAlbumRecord(kv, data)
    const albums = await listAlbumRecords(kv)
    const { meta } = await ensureStorageBootstrap(kv)
    return { album, albums, meta }
  })

/**
 * Renames an existing album and returns refreshed snapshots.
 */
export const renameAlbumFn = createServerFn({ method: 'POST' })
  .inputValidator(renameAlbumSchema)
  .handler(async ({ data }) => {
    await requireAuth()
    const kv = getKVBinding()
    const album = await renameAlbumRecord(kv, data)
    const albums = await listAlbumRecords(kv)
    const { meta } = await ensureStorageBootstrap(kv)
    return { album, albums, meta }
  })

/**
 * Moves an album in the tree and returns refreshed snapshots.
 */
export const moveAlbumFn = createServerFn({ method: 'POST' })
  .inputValidator(moveAlbumSchema)
  .handler(async ({ data }) => {
    await requireAuth()
    const kv = getKVBinding()
    const movedAlbum = await moveAlbumRecord(kv, data)
    const albums = await listAlbumRecords(kv)
    const { meta } = await ensureStorageBootstrap(kv)
    return { movedAlbum, albums, meta }
  })

/**
 * Updates the default upload destination album.
 */
export const setDefaultAlbumFn = createServerFn({ method: 'POST' })
  .inputValidator(setDefaultAlbumSchema)
  .handler(async ({ data }) => {
    await requireAuth()
    const kv = getKVBinding()
    const meta = await setDefaultAlbum(kv, data)
    return { meta }
  })

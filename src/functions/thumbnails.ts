import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { requireAuth } from '@/lib/auth/guards'
import { getD1Binding, getR2Binding } from '@/lib/cloudflare/bindings'
import { buildPublicImageUrl, getR2PublicDomain } from '@/lib/cloudflare/publicUrl'
import { validateUploadImage } from '@/lib/images/uploadValidation'
import {
  persistMissingThumbnail,
} from '@/lib/storage/thumbnailMaintenance'
import { listMissingThumbnailCandidates } from '@/lib/storage/thumbnailMaintenanceRepo'

const listMissingThumbnailsSchema = z.object({
  cursor: z.string().min(1).nullable().optional(),
  pageSize: z.number().int().min(1).max(20).optional(),
})

const MAX_THUMBNAIL_UPLOAD_BYTES = 1024 * 1024

function validateThumbnailPayload(input: unknown): FormData {
  if (input instanceof FormData) {
    return input
  }
  throw new Error('Invalid thumbnail payload')
}

/** Lists a bounded, resumable page of legacy images needing thumbnails. */
export const listMissingThumbnailsFn = createServerFn({ method: 'POST' })
  .validator(listMissingThumbnailsSchema)
  .handler(async ({ data }) => {
    await requireAuth()
    const page = await listMissingThumbnailCandidates(getD1Binding(), data)
    const publicDomain = getR2PublicDomain()
    return {
      ...page,
      items: page.items.map(item => ({
        objectKey: item.objectKey,
        storedName: item.storedName,
        mime: item.mime,
        publicUrl: buildPublicImageUrl(item.objectKey, publicDomain),
      })),
    }
  })

/** Validates and stores one browser-generated legacy thumbnail. */
export const persistMissingThumbnailFn = createServerFn({ method: 'POST' })
  .validator(validateThumbnailPayload)
  .handler(async ({ data }) => {
    await requireAuth()
    const objectKey = z.string().min(1).max(512).parse(data.get('objectKey'))
    const thumbnailEntry = data.get('thumbnail')
    if (!(thumbnailEntry instanceof File)) {
      throw new TypeError('WebP thumbnail is required')
    }
    if (thumbnailEntry.size > MAX_THUMBNAIL_UPLOAD_BYTES) {
      throw new Error('Thumbnail must not exceed 1 MiB')
    }

    const thumbnail = await validateUploadImage(thumbnailEntry)
    if (thumbnail.mime !== 'image/webp') {
      throw new Error('Thumbnail must be WebP')
    }
    if (thumbnail.width > 512 || thumbnail.height > 512) {
      throw new Error('Thumbnail dimensions must not exceed 512 pixels')
    }

    return persistMissingThumbnail({
      db: getD1Binding(),
      r2: getR2Binding(),
      objectKey,
      bytes: thumbnail.bytes,
      width: thumbnail.width,
      height: thumbnail.height,
    })
  })

import { z } from 'zod'
import { ROOT_ALBUM_ID } from '@/lib/storage/types'

/**
 * Shared validator for album identifiers.
 */
export const albumIdSchema = z.string().min(1)
export const imageNameSchema = z.string().trim().min(1).max(120)

/**
 * Payload schema for album creation.
 */
export const createAlbumSchema = z.object({
  name: z.string().trim().min(1).max(64),
  parentId: albumIdSchema.nullable().default(ROOT_ALBUM_ID),
})

/**
 * Payload schema for album renaming.
 */
export const renameAlbumSchema = z.object({
  albumId: albumIdSchema,
  name: z.string().trim().min(1).max(64),
})

/**
 * Payload schema for moving an album under a new parent.
 */
export const moveAlbumSchema = z.object({
  albumId: albumIdSchema,
  parentId: albumIdSchema.nullable(),
})

/**
 * Payload schema for changing the default album.
 */
export const setDefaultAlbumSchema = z.object({
  albumId: albumIdSchema,
})

/** Payload schema for deleting an album after migrating its contents. */
export const deleteAlbumSchema = z.object({
  albumId: albumIdSchema,
  targetAlbumId: albumIdSchema,
})

/**
 * Payload schema for listing album images.
 */
export const listImagesSchema = z.object({
  albumId: albumIdSchema,
  cursor: z.string().min(1).nullable().optional(),
  pageSize: z.number().int().min(10).max(200).optional(),
  sort: z.literal('createdAt-desc').optional(),
  query: z.string().trim().max(120).optional(),
})

/**
 * Payload schema for moving one image between albums.
 */
export const moveImageSchema = z.object({
  objectKey: z.string().min(1),
  targetAlbumId: albumIdSchema,
})

/**
 * Payload schema for moving multiple images between albums.
 */
export const moveImagesSchema = z.object({
  objectKeys: z.array(z.string().min(1)).min(1),
  targetAlbumId: albumIdSchema,
})

/**
 * Payload schema for deleting one image.
 */
export const deleteImageSchema = z.object({
  objectKey: z.string().min(1),
})

/**
 * Payload schema for deleting multiple images.
 */
export const deleteImagesSchema = z.object({
  objectKeys: z.array(z.string().min(1)).min(1),
})

/**
 * Payload schema for renaming one image.
 */
export const renameImageSchema = z.object({
  objectKey: z.string().min(1),
  name: imageNameSchema,
})

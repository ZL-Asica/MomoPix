import type { AnySQLiteColumn } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'
import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'

export const albumsTable = sqliteTable('albums', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  parentId: text('parent_id').references((): AnySQLiteColumn => albumsTable.id, {
    onUpdate: 'cascade',
    onDelete: 'restrict',
  }),
  isDefault: integer('is_default').notNull().default(0),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
}, table => [
  index('idx_albums_parent_id').on(table.parentId),
  uniqueIndex('ux_albums_single_default').on(table.isDefault).where(sql`${table.isDefault} = 1`),
])

export const imagesTable = sqliteTable('images', {
  id: text('id').primaryKey(),
  albumId: text('album_id').notNull().references(() => albumsTable.id, {
    onUpdate: 'cascade',
    onDelete: 'restrict',
  }),
  name: text('name').notNull(),
  nameLower: text('name_lower').notNull(),
  ext: text('ext').notNull(),
  bytes: integer('bytes').notNull(),
  width: integer('width'),
  height: integer('height'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
  originalName: text('original_name').notNull(),
  storedName: text('stored_name').notNull(),
  mime: text('mime').notNull(),
  source: text('source', {
    enum: ['index-compressed', 'dashboard-upload'],
  }).notNull(),
  deletedAt: integer('deleted_at'),
  cleanupAttempts: integer('cleanup_attempts').notNull().default(0),
  cleanupError: text('cleanup_error'),
  originalObjectKey: text('original_object_key'),
  originalBytes: integer('original_bytes'),
  originalExt: text('original_ext'),
  originalMime: text('original_mime'),
  originalWidth: integer('original_width'),
  originalHeight: integer('original_height'),
  thumbnailObjectKey: text('thumbnail_object_key'),
  thumbnailBytes: integer('thumbnail_bytes'),
  thumbnailMime: text('thumbnail_mime'),
  thumbnailWidth: integer('thumbnail_width'),
  thumbnailHeight: integer('thumbnail_height'),
}, table => [
  index('idx_images_album_created_desc').on(table.albumId, table.createdAt, table.id),
  index('idx_images_album_name_lower').on(table.albumId, table.nameLower),
  index('idx_images_album_name_sort').on(table.albumId, table.nameLower, table.id),
  index('idx_images_album_bytes_sort').on(table.albumId, table.bytes, table.id),
  index('idx_images_album_ext_sort').on(table.albumId, table.ext, table.id),
  index('idx_images_name_sort').on(table.nameLower, table.id),
  index('idx_images_bytes_sort').on(table.bytes, table.id),
  index('idx_images_ext_sort').on(table.ext, table.id),
  index('idx_images_created_desc').on(table.createdAt, table.id),
  index('idx_images_pending_cleanup').on(table.deletedAt, table.id),
  uniqueIndex('ux_images_original_object_key').on(table.originalObjectKey),
  uniqueIndex('ux_images_thumbnail_object_key').on(table.thumbnailObjectKey),
])

export const storageQuotaTable = sqliteTable('storage_quota', {
  id: integer('id').primaryKey(),
  bytesUsed: integer('bytes_used').notNull(),
})

export const orphanImageCleanupTable = sqliteTable('orphan_image_cleanup', {
  objectKey: text('object_key').primaryKey(),
  cleanupAttempts: integer('cleanup_attempts').notNull().default(0),
  cleanupError: text('cleanup_error'),
  createdAt: integer('created_at').notNull(),
})

export const storageReservationsTable = sqliteTable('storage_reservations', {
  objectKey: text('object_key').primaryKey(),
  bytesReserved: integer('bytes_reserved').notNull(),
  assetKeysJson: text('asset_keys_json').notNull().default('[]'),
  createdAt: integer('created_at').notNull(),
})

export type AlbumRow = typeof albumsTable.$inferSelect
export type ImageRow = typeof imagesTable.$inferSelect
export type StorageQuotaRow = typeof storageQuotaTable.$inferSelect

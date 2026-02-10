import type { AnySQLiteColumn } from 'drizzle-orm/sqlite-core'
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

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
}, table => [
  index('idx_images_album_created_desc').on(table.albumId, table.createdAt, table.id),
  index('idx_images_album_name_lower').on(table.albumId, table.nameLower),
  index('idx_images_created_desc').on(table.createdAt, table.id),
])

export type AlbumRow = typeof albumsTable.$inferSelect
export type ImageRow = typeof imagesTable.$inferSelect

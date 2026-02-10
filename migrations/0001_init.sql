PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS albums (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  parent_id TEXT NULL REFERENCES albums(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  is_default INTEGER NOT NULL DEFAULT 0 CHECK (is_default IN (0, 1)),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_albums_single_default
  ON albums(is_default)
  WHERE is_default = 1;

CREATE INDEX IF NOT EXISTS idx_albums_parent_id
  ON albums(parent_id);

CREATE TABLE IF NOT EXISTS images (
  id TEXT PRIMARY KEY,
  album_id TEXT NOT NULL REFERENCES albums(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  name TEXT NOT NULL,
  name_lower TEXT NOT NULL,
  ext TEXT NOT NULL,
  bytes INTEGER NOT NULL CHECK (bytes >= 0),
  width INTEGER NULL,
  height INTEGER NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  original_name TEXT NOT NULL,
  stored_name TEXT NOT NULL,
  mime TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('index-compressed', 'dashboard-upload'))
);

CREATE INDEX IF NOT EXISTS idx_images_album_created_desc
  ON images(album_id, created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_images_album_name_lower
  ON images(album_id, name_lower);

CREATE INDEX IF NOT EXISTS idx_images_created_desc
  ON images(created_at DESC, id DESC);

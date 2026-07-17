CREATE INDEX IF NOT EXISTS idx_images_album_name_sort
  ON images(album_id, name_lower, id);

CREATE INDEX IF NOT EXISTS idx_images_album_bytes_sort
  ON images(album_id, bytes, id);

CREATE INDEX IF NOT EXISTS idx_images_album_ext_sort
  ON images(album_id, ext, id);

CREATE INDEX IF NOT EXISTS idx_images_name_sort
  ON images(name_lower, id);

CREATE INDEX IF NOT EXISTS idx_images_bytes_sort
  ON images(bytes, id);

CREATE INDEX IF NOT EXISTS idx_images_ext_sort
  ON images(ext, id);

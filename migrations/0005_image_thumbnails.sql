ALTER TABLE images ADD COLUMN thumbnail_object_key TEXT NULL;
ALTER TABLE images ADD COLUMN thumbnail_bytes INTEGER NULL;
ALTER TABLE images ADD COLUMN thumbnail_mime TEXT NULL;
ALTER TABLE images ADD COLUMN thumbnail_width INTEGER NULL;
ALTER TABLE images ADD COLUMN thumbnail_height INTEGER NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ux_images_thumbnail_object_key
  ON images(thumbnail_object_key)
  WHERE thumbnail_object_key IS NOT NULL;

ALTER TABLE storage_reservations
  ADD COLUMN asset_keys_json TEXT NOT NULL DEFAULT '[]';

DROP TRIGGER IF EXISTS trg_images_quota_before_insert_original_bytes;
DROP TRIGGER IF EXISTS trg_images_quota_before_insert;
DROP TRIGGER IF EXISTS trg_images_quota_after_insert;
DROP TRIGGER IF EXISTS trg_images_quota_before_update;
DROP TRIGGER IF EXISTS trg_images_quota_before_update_limit;
DROP TRIGGER IF EXISTS trg_images_quota_after_update;
DROP TRIGGER IF EXISTS trg_images_quota_after_delete;

CREATE TRIGGER trg_images_assets_before_insert
BEFORE INSERT ON images
WHEN COALESCE(NEW.original_bytes, 0) < 0
  OR NEW.thumbnail_object_key IS NULL
  OR NEW.thumbnail_bytes IS NULL
  OR NEW.thumbnail_bytes < 1
  OR NEW.thumbnail_mime <> 'image/webp'
  OR NEW.thumbnail_width IS NULL
  OR NEW.thumbnail_width < 1
  OR NEW.thumbnail_height IS NULL
  OR NEW.thumbnail_height < 1
BEGIN
  SELECT RAISE(ABORT, 'Image asset metadata is invalid');
END;

CREATE TRIGGER trg_images_quota_before_insert
BEFORE INSERT ON images
WHEN (SELECT bytes_used FROM storage_quota WHERE id = 1)
  + NEW.bytes
  + NEW.thumbnail_bytes
  + COALESCE(NEW.original_bytes, 0)
  - COALESCE((SELECT bytes_reserved FROM storage_reservations WHERE object_key = NEW.id), 0) > 5368709120
BEGIN
  SELECT RAISE(ABORT, 'Storage quota exceeded');
END;

CREATE TRIGGER trg_images_quota_after_insert
AFTER INSERT ON images
BEGIN
  UPDATE storage_quota
  SET bytes_used = bytes_used
    + NEW.bytes
    + NEW.thumbnail_bytes
    + COALESCE(NEW.original_bytes, 0)
  WHERE id = 1;
  DELETE FROM storage_reservations WHERE object_key = NEW.id;
END;

CREATE TRIGGER trg_images_assets_before_update
BEFORE UPDATE OF bytes, original_bytes, thumbnail_bytes, thumbnail_object_key,
  thumbnail_mime, thumbnail_width, thumbnail_height ON images
WHEN COALESCE(NEW.original_bytes, 0) < 0
  OR NEW.thumbnail_object_key IS NULL
  OR NEW.thumbnail_bytes IS NULL
  OR NEW.thumbnail_bytes < 1
  OR NEW.thumbnail_mime <> 'image/webp'
  OR NEW.thumbnail_width IS NULL
  OR NEW.thumbnail_width < 1
  OR NEW.thumbnail_height IS NULL
  OR NEW.thumbnail_height < 1
BEGIN
  SELECT RAISE(ABORT, 'Image asset metadata is invalid');
END;

CREATE TRIGGER trg_images_quota_before_update_limit
BEFORE UPDATE OF bytes, original_bytes, thumbnail_bytes ON images
WHEN (SELECT bytes_used FROM storage_quota WHERE id = 1)
  + (NEW.bytes + NEW.thumbnail_bytes + COALESCE(NEW.original_bytes, 0))
  - (OLD.bytes + COALESCE(OLD.thumbnail_bytes, 0) + COALESCE(OLD.original_bytes, 0)) > 5368709120
BEGIN
  SELECT RAISE(ABORT, 'Storage quota exceeded');
END;

CREATE TRIGGER trg_images_quota_after_update
AFTER UPDATE OF bytes, original_bytes, thumbnail_bytes ON images
BEGIN
  UPDATE storage_quota
  SET bytes_used = bytes_used
    + (NEW.bytes + NEW.thumbnail_bytes + COALESCE(NEW.original_bytes, 0))
    - (OLD.bytes + COALESCE(OLD.thumbnail_bytes, 0) + COALESCE(OLD.original_bytes, 0))
  WHERE id = 1;
END;

CREATE TRIGGER trg_images_quota_after_delete
AFTER DELETE ON images
BEGIN
  UPDATE storage_quota
  SET bytes_used = MAX(
    0,
    bytes_used
      - OLD.bytes
      - COALESCE(OLD.thumbnail_bytes, 0)
      - COALESCE(OLD.original_bytes, 0)
  )
  WHERE id = 1;
END;

CREATE TABLE IF NOT EXISTS storage_quota (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  bytes_used INTEGER NOT NULL CHECK (bytes_used >= 0)
);

CREATE TABLE IF NOT EXISTS orphan_image_cleanup (
  object_key TEXT PRIMARY KEY,
  cleanup_attempts INTEGER NOT NULL DEFAULT 0,
  cleanup_error TEXT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS storage_reservations (
  object_key TEXT PRIMARY KEY,
  bytes_reserved INTEGER NOT NULL CHECK (bytes_reserved > 0),
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_storage_reservations_created_at
  ON storage_reservations(created_at ASC, object_key ASC);

CREATE INDEX IF NOT EXISTS idx_orphan_image_cleanup_created_at
  ON orphan_image_cleanup(created_at ASC, object_key ASC);

INSERT OR IGNORE INTO storage_quota (id, bytes_used)
SELECT 1, COALESCE(SUM(bytes + COALESCE(original_bytes, 0)), 0)
FROM images
;

CREATE TRIGGER IF NOT EXISTS trg_images_quota_before_insert_original_bytes
BEFORE INSERT ON images
WHEN COALESCE(NEW.original_bytes, 0) < 0
BEGIN
  SELECT RAISE(ABORT, 'Original image bytes must be non-negative');
END;

CREATE TRIGGER IF NOT EXISTS trg_images_quota_before_insert
BEFORE INSERT ON images
WHEN (SELECT bytes_used FROM storage_quota WHERE id = 1)
  + NEW.bytes + COALESCE(NEW.original_bytes, 0)
  - COALESCE((SELECT bytes_reserved FROM storage_reservations WHERE object_key = NEW.id), 0) > 5368709120
BEGIN
  SELECT RAISE(ABORT, 'Storage quota exceeded');
END;

CREATE TRIGGER IF NOT EXISTS trg_images_quota_after_insert
AFTER INSERT ON images
BEGIN
  UPDATE storage_quota
  SET bytes_used = bytes_used + NEW.bytes + COALESCE(NEW.original_bytes, 0)
  WHERE id = 1;
  -- The temporary reservation has already been counted. Removing it after
  -- adding the durable image bytes preserves the same total.
  DELETE FROM storage_reservations WHERE object_key = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_images_quota_before_update
BEFORE UPDATE OF bytes, original_bytes ON images
WHEN COALESCE(NEW.original_bytes, 0) < 0
BEGIN
  SELECT RAISE(ABORT, 'Original image bytes must be non-negative');
END;

CREATE TRIGGER IF NOT EXISTS trg_images_quota_before_update_limit
BEFORE UPDATE OF bytes, original_bytes ON images
WHEN (SELECT bytes_used FROM storage_quota WHERE id = 1)
  + (NEW.bytes + COALESCE(NEW.original_bytes, 0))
  - (OLD.bytes + COALESCE(OLD.original_bytes, 0)) > 5368709120
BEGIN
  SELECT RAISE(ABORT, 'Storage quota exceeded');
END;

CREATE TRIGGER IF NOT EXISTS trg_images_quota_after_update
AFTER UPDATE OF bytes, original_bytes ON images
BEGIN
  UPDATE storage_quota
  SET bytes_used = bytes_used
    + (NEW.bytes + COALESCE(NEW.original_bytes, 0))
    - (OLD.bytes + COALESCE(OLD.original_bytes, 0))
  WHERE id = 1;
END;

CREATE TRIGGER IF NOT EXISTS trg_images_quota_after_delete
AFTER DELETE ON images
BEGIN
  UPDATE storage_quota
  SET bytes_used = MAX(0, bytes_used - OLD.bytes - COALESCE(OLD.original_bytes, 0))
  WHERE id = 1;
END;

CREATE TRIGGER IF NOT EXISTS trg_reservations_quota_before_insert
BEFORE INSERT ON storage_reservations
WHEN (SELECT bytes_used FROM storage_quota WHERE id = 1) + NEW.bytes_reserved > 5368709120
BEGIN
  SELECT RAISE(ABORT, 'Storage quota exceeded');
END;

CREATE TRIGGER IF NOT EXISTS trg_reservations_quota_after_insert
AFTER INSERT ON storage_reservations
BEGIN
  UPDATE storage_quota SET bytes_used = bytes_used + NEW.bytes_reserved WHERE id = 1;
END;

CREATE TRIGGER IF NOT EXISTS trg_reservations_quota_after_delete
AFTER DELETE ON storage_reservations
BEGIN
  UPDATE storage_quota SET bytes_used = MAX(0, bytes_used - OLD.bytes_reserved) WHERE id = 1;
END;

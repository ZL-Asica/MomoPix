DROP TRIGGER IF EXISTS trg_images_quota_before_update_limit;
DROP TRIGGER IF EXISTS trg_images_quota_after_update;

CREATE TRIGGER trg_images_quota_before_update_limit
BEFORE UPDATE OF bytes, original_bytes, thumbnail_bytes ON images
WHEN (SELECT bytes_used FROM storage_quota WHERE id = 1)
  + (NEW.bytes + NEW.thumbnail_bytes + COALESCE(NEW.original_bytes, 0))
  - (OLD.bytes + COALESCE(OLD.thumbnail_bytes, 0) + COALESCE(OLD.original_bytes, 0))
  - COALESCE((
    SELECT bytes_reserved
    FROM storage_reservations
    WHERE object_key = NEW.thumbnail_object_key
  ), 0) > 5368709120
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
  DELETE FROM storage_reservations WHERE object_key = NEW.thumbnail_object_key;
END;

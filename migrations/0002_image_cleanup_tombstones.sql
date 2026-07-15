ALTER TABLE images ADD COLUMN deleted_at INTEGER NULL;
ALTER TABLE images ADD COLUMN cleanup_attempts INTEGER NOT NULL DEFAULT 0;
ALTER TABLE images ADD COLUMN cleanup_error TEXT NULL;

CREATE INDEX IF NOT EXISTS idx_images_pending_cleanup
  ON images(deleted_at ASC, id ASC)
  WHERE deleted_at IS NOT NULL;

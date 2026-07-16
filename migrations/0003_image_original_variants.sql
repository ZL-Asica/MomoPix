ALTER TABLE images ADD COLUMN original_object_key TEXT NULL;
ALTER TABLE images ADD COLUMN original_bytes INTEGER NULL;
ALTER TABLE images ADD COLUMN original_ext TEXT NULL;
ALTER TABLE images ADD COLUMN original_mime TEXT NULL;
ALTER TABLE images ADD COLUMN original_width INTEGER NULL;
ALTER TABLE images ADD COLUMN original_height INTEGER NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ux_images_original_object_key
  ON images(original_object_key)
  WHERE original_object_key IS NOT NULL;

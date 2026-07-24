ALTER TABLE products ADD COLUMN IF NOT EXISTS content_blocks jsonb;
ALTER TABLE products ADD COLUMN IF NOT EXISTS content_updated_at timestamp;

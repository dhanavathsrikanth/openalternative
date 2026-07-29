-- 0026_update_product_status_enum.sql
--
-- Expand product_status enum to: draft | scheduled | pending_review | published | rejected | delisted
-- Add publishAt timestamp column for scheduled products

-- 1. New enum type
CREATE TYPE product_status_v2 AS ENUM (
    'draft',
    'scheduled',
    'pending_review',
    'published',
    'rejected',
    'delisted'
);

-- 2. Add publishAt column
ALTER TABLE products ADD COLUMN publish_at TIMESTAMP;

-- 3. Migrate existing data - keep existing values (draft, published) as-is
--    The existing values are already valid in the new enum

-- 4. Swap column type
ALTER TABLE products
    ALTER COLUMN status DROP DEFAULT,
    ALTER COLUMN status TYPE product_status_v2 USING status::text::product_status_v2,
    ALTER COLUMN status SET DEFAULT 'draft';

-- 5. Drop old enum and rename new one
DROP TYPE product_status;
ALTER TYPE product_status_v2 RENAME TO product_status;

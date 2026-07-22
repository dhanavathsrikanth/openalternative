-- Drop the old unique index that prevented multiple contributors per product
DROP INDEX IF EXISTS reviews_product_idx;

-- Add composite unique constraint: one review per contributor per product
ALTER TABLE reviews ADD CONSTRAINT reviews_product_contributor_unique UNIQUE (product_id, contributor_id);

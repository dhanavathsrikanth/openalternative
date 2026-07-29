-- Add usable_today and review_flags columns to products
-- usable_today: staff attestation that the product is in a usable state
-- review_flags: automated validation flags from submission checks

ALTER TABLE products ADD COLUMN usable_today BOOLEAN;
ALTER TABLE products ADD COLUMN review_flags JSONB;

-- 0028_add_delist_reason_and_delisted_at.sql
--
-- Add delist_reason and delisted_at columns to products table
-- for tracking why a product was delisted and when

ALTER TABLE products ADD COLUMN delist_reason TEXT;
ALTER TABLE products ADD COLUMN delisted_at TIMESTAMP;

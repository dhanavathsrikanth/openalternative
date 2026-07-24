-- 0025_update_report_reason_enum.sql
--
-- Simplify report_reason enum to the four lightweight categories:
--   broken_link, wrong_category, outdated, other
--
-- PostgreSQL doesn't support DROP VALUE on enums, so we:
--   1. Create the new enum type
--   2. Migrate data (map old values to new ones where needed)
--   3. Swap the column type
--   4. Drop the old enum type

-- 1. New enum type
CREATE TYPE report_reason_v2 AS ENUM (
    'broken_link',
    'wrong_category',
    'outdated',
    'other'
);

-- 2. Migrate existing data: map old values to the closest new category
--    'incorrect' → 'wrong_category'
--    'spam'      → 'other'
--    'inappropriate' → 'other'
--    'broken_link', 'outdated', 'other' stay the same
UPDATE reports SET reason = 'wrong_category' WHERE reason = 'incorrect';
UPDATE reports SET reason = 'other'          WHERE reason IN ('spam', 'inappropriate');

-- 3. Swap column type
ALTER TABLE reports
    ALTER COLUMN reason DROP DEFAULT,
    ALTER COLUMN reason TYPE report_reason_v2 USING reason::text::report_reason_v2,
    ALTER COLUMN reason SET DEFAULT 'pending';

-- 4. Drop old enum and rename new one
DROP TYPE report_reason;
ALTER TYPE report_reason_v2 RENAME TO report_reason;

-- Restore the correct default (the ENUM default, not 'pending')
ALTER TABLE reports ALTER COLUMN reason SET DEFAULT 'broken_link';

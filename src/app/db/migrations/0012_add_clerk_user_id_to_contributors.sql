-- Add clerk_user_id column to contributors for proper Clerk ↔ DB mapping
ALTER TABLE contributors ADD COLUMN IF NOT EXISTS clerk_user_id text;

-- Index for fast lookups by Clerk user ID (used in reviews, contributions, dashboard)
CREATE UNIQUE INDEX IF NOT EXISTS contributors_clerk_user_id_idx ON contributors (clerk_user_id)
  WHERE clerk_user_id IS NOT NULL;

-- Backfill: copy existing email values that look like Clerk user IDs (no @) into clerk_user_id
UPDATE contributors
SET clerk_user_id = email
WHERE email NOT LIKE '%@%'
  AND clerk_user_id IS NULL;

-- Validate email format on all rows going forward (application-level check added in code)
-- Any rows with invalid emails after backfill will need manual correction.

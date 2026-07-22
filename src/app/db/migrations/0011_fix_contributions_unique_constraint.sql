-- Drop the old unique index that limited one contribution per product
DROP INDEX IF EXISTS contributions_product_idx;

-- Partial unique index: prevent same contributor from having two pending
-- contributions on the same product simultaneously.
-- Approved/rejected contributions are history and don't block future submissions.
CREATE UNIQUE INDEX IF NOT EXISTS contributions_pending_per_contributor_idx
ON contributions (product_id, contributor_id)
WHERE status = 'pending';

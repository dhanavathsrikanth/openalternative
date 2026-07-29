-- Indexes to support product sort ORDER BY clauses.
-- Each index covers one sort key so the planner can use an index scan
-- instead of a full table sort.

-- stars DESC (Most stars)
CREATE INDEX IF NOT EXISTS products_stars_idx ON products (stars DESC NULLS LAST);

-- forks DESC (Most forks)
CREATE INDEX IF NOT EXISTS products_forks_idx ON products (forks DESC NULLS LAST);

-- last_pushed_at DESC NULLS LAST (Most active / Last commit)
CREATE INDEX IF NOT EXISTS products_last_pushed_at_idx ON products (last_pushed_at DESC NULLS LAST);

-- created_at for Latest / Newest / Oldest sorts
CREATE INDEX IF NOT EXISTS products_created_at_idx ON products (created_at);

-- name for Name A-Z / Z-A sorts
CREATE INDEX IF NOT EXISTS products_name_idx ON products (name);

-- status filter used in every product listing query
CREATE INDEX IF NOT EXISTS products_status_idx ON products (status);

-- Add new GitHub metadata columns to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS open_issues integer;
ALTER TABLE products ADD COLUMN IF NOT EXISTS watchers integer;
ALTER TABLE products ADD COLUMN IF NOT EXISTS topics text[];
ALTER TABLE products ADD COLUMN IF NOT EXISTS repo_size integer;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_archived boolean NOT NULL DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_fork boolean NOT NULL DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS last_pushed_at timestamp;
ALTER TABLE products ADD COLUMN IF NOT EXISTS default_branch text;

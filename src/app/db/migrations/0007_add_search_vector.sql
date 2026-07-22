-- ── Full-text search: tsvector column + GIN index + auto-update trigger ──
--
-- Adds a generated tsvector column on products that combines name, description,
-- license, and primary_language.  A trigger keeps it in sync on INSERT/UPDATE.

ALTER TABLE products ADD COLUMN IF NOT EXISTS search_vector tsvector;

CREATE INDEX IF NOT EXISTS products_search_idx ON products USING GIN (search_vector);

-- Populate from existing rows
UPDATE products SET search_vector =
  setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
  setweight(to_tsvector('english', coalesce(license, '')), 'C') ||
  setweight(to_tsvector('english', coalesce(primary_language, '')), 'C');

-- Trigger to keep search_vector in sync
CREATE OR REPLACE FUNCTION products_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.license, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(NEW.primary_language, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_products_search_vector ON products;
CREATE TRIGGER trg_products_search_vector
  BEFORE INSERT OR UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION products_search_vector_update();

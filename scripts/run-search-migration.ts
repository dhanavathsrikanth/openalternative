/**
 * scripts/run-search-migration.ts
 *
 * Executes the raw SQL to add the search_vector column, GIN index,
 * and trigger to the products table on the Neon dev branch.
 */

import 'dotenv/config'
import { db } from '../src/app/db'
import { sql } from 'drizzle-orm'

// Each statement is individually executed; PL/pgSQL blocks are kept whole
// (no splitting inside $$ delimiters).
const STATEMENTS = [
  // 1. Add column (idempotent)
  `DO $$ BEGIN
    ALTER TABLE products ADD COLUMN search_vector tsvector;
  EXCEPTION
    WHEN duplicate_column THEN null;
  END $$`,

  // 2. GIN index
  `CREATE INDEX IF NOT EXISTS products_search_idx ON products USING GIN (search_vector)`,

  // 3. Populate existing rows
  `UPDATE products SET search_vector =
    setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(license, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(primary_language, '')), 'C')`,

  // 4. Trigger function
  `CREATE OR REPLACE FUNCTION products_search_vector_update() RETURNS trigger AS $$
  BEGIN
    NEW.search_vector :=
      setweight(to_tsvector('english', coalesce(NEW.name, '')), 'A') ||
      setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B') ||
      setweight(to_tsvector('english', coalesce(NEW.license, '')), 'C') ||
      setweight(to_tsvector('english', coalesce(NEW.primary_language, '')), 'C');
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql`,

  // 5. Drop existing trigger (idempotent)
  `DROP TRIGGER IF EXISTS trg_products_search_vector ON products`,

  // 6. Create trigger
  `CREATE TRIGGER trg_products_search_vector
    BEFORE INSERT OR UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION products_search_vector_update()`,
]

async function main() {
  console.log('Running search_vector migration on Neon dev...\n')

  for (let i = 0; i < STATEMENTS.length; i++) {
    const stmt = STATEMENTS[i]
    const preview = stmt.substring(0, 70).replace(/\n/g, ' ')
    try {
      await db.execute(sql.raw(stmt))
      console.log(`  ✓ [${i + 1}/${STATEMENTS.length}] ${preview}...`)
    } catch (err) {
      console.error(`  ✗ [${i + 1}/${STATEMENTS.length}] ${preview}...`)
      console.error(`    ${err}`)
    }
  }

  console.log('\nDone!')
  process.exit(0)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})

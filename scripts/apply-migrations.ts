import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config({ path: '.env.local' });

const connStr = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
if (!connStr) throw new Error('No DB connection string found');

const sql = neon(connStr);

function splitStatements(raw: string): string[] {
  // First split on explicit drizzle statement-breakpoint markers
  const parts = raw.split(/--> statement-breakpoint/);
  const stmts: string[] = [];
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    // If the part contains multiple semicolons (no breakpoint markers), split on semicolons
    if (trimmed.includes(';')) {
      // Simple semicolon split, but handle dollar-quoted PL/pgSQL blocks
      let current = '';
      let inDollarQuote = false;
      let dollarTag = '';
      for (let i = 0; i < trimmed.length; i++) {
        const ch = trimmed[i];
        if (ch === '$' && !inDollarQuote) {
          // Check for dollar-quoted tag
          let tag = '$';
          let j = i + 1;
          while (j < trimmed.length && trimmed[j] !== '$') {
            tag += trimmed[j];
            j++;
          }
          if (j < trimmed.length) {
            tag += '$';
            inDollarQuote = true;
            dollarTag = tag;
            current += tag;
            i = j;
            continue;
          }
        } else if (inDollarQuote && trimmed.substring(i).startsWith(dollarTag)) {
          current += dollarTag;
          i += dollarTag.length - 1;
          inDollarQuote = false;
          dollarTag = '';
          continue;
        }
        if (ch === ';' && !inDollarQuote) {
          const s = current.trim();
          if (s) stmts.push(s);
          current = '';
        } else {
          current += ch;
        }
      }
      const s = current.trim();
      if (s) stmts.push(s);
    } else {
      stmts.push(trimmed);
    }
  }
  return stmts;
}

const migrations = [
  '0007_add_search_vector.sql',
  '0009_tiresome_mojo.sql',
  '0010_fix_reviews_unique_constraint.sql',
  '0010_analytics_events.sql',
  '0011_fix_contributions_unique_constraint.sql',
  '0011_announcements_notifications.sql',
  '0012_add_clerk_user_id_to_contributors.sql',
  '0012_product_assets.sql',
  '0013_add_legacy_image_columns.sql',
  '0013_drop_starter_element_tables.sql',
  '0014_add_organizations_table.sql',
  '0014_drop_legacy_image_columns.sql',
  '0015_add_claim_requests.sql',
  '0016_add_dashboard_fields.sql',
  '0017_staff_flag_and_audit_logs.sql',
  '0018_seo_overrides.sql',
  '0019_add_stars_forks.sql',
  '0020_product_content.sql',
  '0021_tech_stack_detected.sql',
  '0023_add_content_blocks.sql',
  '0026_update_product_status_enum.sql',
  '0027_add_usable_today_and_review_flags.sql',
  '0030_add_proprietary_tools_and_alternatives.sql',
  '0032_add_proprietary_tools_slug.sql',
];

const skipCodes = new Set([
  '42710', '42P07', '42701', '42P16', '23505', '42P01', '42704',
]);

async function main() {
  const dir = path.join(__dirname, '..', 'src', 'app', 'db', 'migrations');

  for (const file of migrations) {
    const filePath = path.join(dir, file);
    if (!fs.existsSync(filePath)) {
      console.log(`  ⚠ ${file} not found, skipping`);
      continue;
    }
    const raw = fs.readFileSync(filePath, 'utf8');
    const stmts = splitStatements(raw);

    console.log(`\n>>> ${file} (${stmts.length} stmts)`);
    for (const stmt of stmts) {
      try {
        await sql(stmt);
      } catch (err: any) {
        if (skipCodes.has(err.code)) {
          // silently skip already-exists errors
        } else {
          console.error(`    ✗ ${err.code}: ${err.message?.slice(0, 120)}`);
          console.error(`      ${stmt.slice(0, 120)}...`);
        }
      }
    }
    console.log(`    ✓ done`);
  }
  console.log('\nAll migrations processed.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

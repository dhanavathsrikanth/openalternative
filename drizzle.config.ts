import type { Config } from 'drizzle-kit';
import * as dotenv from "dotenv";

dotenv.config({ path: '.env.local' });

// drizzle-kit runs DDL (migrations, push) which should use the direct
// (non-pooled) endpoint to avoid holding a pooled connection for the
// duration of schema changes.  See db/README.md for the full policy.
const connectionString = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL_UNPOOLED (or DATABASE_URL) not found in environment');

export default {
  schema: './src/app/db/schema.ts',
  out: './src/app/db/migrations',
  driver: 'pg',
  dbCredentials: {
    connectionString,
  }
} satisfies Config;

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

// DATABASE_URL must point to the Neon -pooler endpoint (transaction-mode pooling).
// Direct connections (DATABASE_URL_UNPOOLED) are reserved for drizzle-kit migrations
// and one-off scripts — see db/README.md for the full policy.
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error('DATABASE_URL not found in environment');
}

const sql = neon<boolean, boolean>(DATABASE_URL);
export const db = drizzle(sql);

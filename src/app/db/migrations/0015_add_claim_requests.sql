ALTER TABLE "products" ADD COLUMN "claimed_by_org_id" integer REFERENCES "organizations"("id") ON DELETE set null;

CREATE TYPE "claim_method" AS ENUM ('dns_txt', 'github_org');
CREATE TYPE "claim_status" AS ENUM ('pending', 'verified', 'failed');

CREATE TABLE IF NOT EXISTS "claim_requests" (
  "id" serial PRIMARY KEY,
  "product_id" integer NOT NULL REFERENCES "products"("id") ON DELETE cascade,
  "organization_id" integer NOT NULL REFERENCES "organizations"("id") ON DELETE cascade,
  "method" "claim_method" NOT NULL,
  "status" "claim_status" NOT NULL DEFAULT 'pending',
  "verification_token" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

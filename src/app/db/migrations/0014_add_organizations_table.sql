CREATE TABLE IF NOT EXISTS "organizations" (
  "id" serial PRIMARY KEY,
  "clerk_org_id" text NOT NULL,
  "name" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "organizations_clerk_org_id_unique" UNIQUE ("clerk_org_id")
);

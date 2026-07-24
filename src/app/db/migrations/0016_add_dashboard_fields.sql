ALTER TABLE "organizations" ADD COLUMN "slug" text NOT NULL;
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_slug_unique" UNIQUE ("slug");

ALTER TABLE "products" ADD COLUMN "tagline" text;
ALTER TABLE "products" ADD COLUMN "docs_url" text;
ALTER TABLE "products" ADD COLUMN "changelog_url" text;
ALTER TABLE "products" ADD COLUMN "community_url" text;
ALTER TABLE "products" ADD COLUMN "faq" jsonb;

CREATE TABLE IF NOT EXISTS "product_edits" (
  "id" serial PRIMARY KEY,
  "product_id" integer NOT NULL REFERENCES "products"("id") ON DELETE cascade,
  "organization_id" integer NOT NULL REFERENCES "organizations"("id") ON DELETE cascade,
  "editor_id" text NOT NULL,
  "field" text NOT NULL,
  "old_value" text,
  "new_value" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);

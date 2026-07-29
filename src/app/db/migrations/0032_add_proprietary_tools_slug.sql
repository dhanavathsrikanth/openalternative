-- Add slug column to proprietary_tools for SEO-friendly URLs
ALTER TABLE "proprietary_tools" ADD COLUMN "slug" text;

-- Backfill slugs from existing names using kebab-case
UPDATE "proprietary_tools" SET "slug" = lower(regexp_replace("name", '[^a-zA-Z0-9]+', '-', 'g'));
UPDATE "proprietary_tools" SET "slug" = regexp_replace("slug", '^-|-$', '', 'g');

-- Make slug NOT NULL after backfill
ALTER TABLE "proprietary_tools" ALTER COLUMN "slug" SET NOT NULL;

-- Add unique index
CREATE UNIQUE INDEX "proprietary_tools_slug_idx" ON "proprietary_tools" ("slug");

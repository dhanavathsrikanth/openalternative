-- Add repository metadata columns for the sidebar info blocks.
-- contributors_count: denormalized count of GitHub contributors
-- first_release_year: year of the earliest GitHub release
-- latest_version: latest release tag name (e.g. "v2.1.0")

ALTER TABLE "products"
  ADD COLUMN "contributors_count" integer,
  ADD COLUMN "first_release_year" integer,
  ADD COLUMN "latest_version" text;

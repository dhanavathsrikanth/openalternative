ALTER TABLE "products" ADD COLUMN "seo_title" text;
ALTER TABLE "products" ADD COLUMN "seo_description" text;
ALTER TABLE "products" ADD COLUMN "seo_canonical_url" text;

ALTER TABLE "categories" ADD COLUMN "seo_title" text;
ALTER TABLE "categories" ADD COLUMN "seo_description" text;
ALTER TABLE "categories" ADD COLUMN "seo_canonical_url" text;

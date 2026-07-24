CREATE TYPE "product_asset_type" AS ENUM('screenshot', 'logo');--> statement-breakpoint
CREATE TABLE "product_assets" (
  "id" serial PRIMARY KEY,
  "product_id" integer NOT NULL,
  "type" "product_asset_type" NOT NULL,
  "url" text NOT NULL,
  "asset_id" text NOT NULL,
  "uploaded_by_org_id" integer,
  "created_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "product_assets" ADD CONSTRAINT "product_assets_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_assets" ADD CONSTRAINT "product_assets_uploaded_by_org_id_organizations_id_fk" FOREIGN KEY ("uploaded_by_org_id") REFERENCES "organizations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "product_assets_product_id_idx" ON "product_assets" ("product_id");--> statement-breakpoint
CREATE INDEX "product_assets_type_idx" ON "product_assets" ("type");

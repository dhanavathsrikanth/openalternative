-- Add body, status, and related_product_id to guides table
ALTER TABLE "guides" ADD COLUMN "body" text;--> statement-breakpoint
ALTER TABLE "guides" ADD COLUMN "status" "product_status" DEFAULT 'draft' NOT NULL;--> statement-breakpoint
ALTER TABLE "guides" ADD COLUMN "related_product_id" integer;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "guides" ADD CONSTRAINT "guides_related_product_id_products_id_fk" FOREIGN KEY ("related_product_id") REFERENCES "products"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

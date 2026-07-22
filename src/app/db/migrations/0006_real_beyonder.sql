CREATE TABLE IF NOT EXISTS "comparisons" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_a_id" integer NOT NULL,
	"product_b_id" integer NOT NULL,
	"feature_matrix" jsonb NOT NULL,
	"generated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "comparisons_pair_idx" ON "comparisons" ("product_a_id","product_b_id");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "comparisons" ADD CONSTRAINT "comparisons_product_a_id_products_id_fk" FOREIGN KEY ("product_a_id") REFERENCES "products"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "comparisons" ADD CONSTRAINT "comparisons_product_b_id_products_id_fk" FOREIGN KEY ("product_b_id") REFERENCES "products"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

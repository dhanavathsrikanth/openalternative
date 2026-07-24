CREATE TYPE "review_status" AS ENUM ('draft', 'approved', 'rejected');
--> statement-breakpoint
CREATE TABLE "product_content" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"content_type" text NOT NULL,
	"generated_prompt" text,
	"output" jsonb NOT NULL,
	"model" text,
	"review_status" "review_status" DEFAULT 'draft' NOT NULL,
	"generated_by_staff_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "product_content_product_id_product_type_unique" UNIQUE ("product_id","content_type")
);
--> statement-breakpoint
ALTER TABLE "product_content" ADD CONSTRAINT "product_content_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE cascade ON UPDATE no action;
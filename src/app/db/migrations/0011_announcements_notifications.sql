CREATE TABLE "announcements" (
  "id" serial PRIMARY KEY,
  "product_id" integer NOT NULL,
  "organization_id" integer NOT NULL,
  "title" text NOT NULL,
  "body" text NOT NULL,
  "published_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "announcements_product_id_idx" ON "announcements" ("product_id");--> statement-breakpoint
CREATE INDEX "announcements_org_id_idx" ON "announcements" ("organization_id");--> statement-breakpoint
CREATE TABLE "notifications" (
  "id" serial PRIMARY KEY,
  "organization_id" integer NOT NULL,
  "recipient_id" text NOT NULL,
  "event_type" text NOT NULL,
  "title" text NOT NULL,
  "body" text,
  "metadata" jsonb,
  "read_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "notifications_recipient_id_idx" ON "notifications" ("recipient_id");--> statement-breakpoint
CREATE INDEX "notifications_org_id_idx" ON "notifications" ("organization_id");--> statement-breakpoint
CREATE INDEX "notifications_read_at_idx" ON "notifications" ("read_at");

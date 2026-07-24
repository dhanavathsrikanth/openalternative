CREATE TABLE "analytics_events" (
  "id" serial PRIMARY KEY,
  "product_id" integer NOT NULL,
  "event_type" text NOT NULL,
  "occurred_at" timestamp DEFAULT now() NOT NULL,
  "metadata" jsonb
);--> statement-breakpoint
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "analytics_events_product_id_idx" ON "analytics_events" ("product_id");--> statement-breakpoint
CREATE INDEX "analytics_events_event_type_idx" ON "analytics_events" ("event_type");--> statement-breakpoint
CREATE INDEX "analytics_events_occurred_at_idx" ON "analytics_events" ("occurred_at");

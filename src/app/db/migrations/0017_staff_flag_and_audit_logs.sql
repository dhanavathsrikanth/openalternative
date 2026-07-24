ALTER TABLE "users" ADD COLUMN "staff" boolean DEFAULT false NOT NULL;

CREATE TABLE IF NOT EXISTS "audit_logs" (
  "id" serial PRIMARY KEY,
  "actor_id" text NOT NULL,
  "action" text NOT NULL,
  "entity_type" text NOT NULL,
  "entity_id" text NOT NULL,
  "before" jsonb,
  "after" jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL
);

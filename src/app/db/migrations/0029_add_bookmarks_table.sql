-- Bookmarks: personal per-user product saves
CREATE TABLE IF NOT EXISTS "bookmarks" (
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "product_id" integer NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "bookmarks_pkey" PRIMARY KEY ("user_id", "product_id")
);

CREATE INDEX IF NOT EXISTS "bookmarks_user_id_idx" ON "bookmarks" ("user_id");
CREATE INDEX IF NOT EXISTS "bookmarks_product_id_idx" ON "bookmarks" ("product_id");

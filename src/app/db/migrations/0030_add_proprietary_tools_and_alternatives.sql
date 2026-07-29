-- Create proprietary_tools reference table
CREATE TABLE "proprietary_tools" (
  "id" serial PRIMARY KEY,
  "name" text NOT NULL,
  "url" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Create product_alternatives join table
CREATE TABLE "product_alternatives" (
  "product_id" integer NOT NULL REFERENCES "products"("id") ON DELETE cascade,
  "proprietary_tool_id" integer NOT NULL REFERENCES "proprietary_tools"("id") ON DELETE cascade,
  CONSTRAINT "product_alternatives_pkey" PRIMARY KEY ("product_id", "proprietary_tool_id")
);

-- Index for lookups by proprietary tool (e.g. "find all products that replace X")
CREATE INDEX "product_alternatives_tool_idx" ON "product_alternatives" ("proprietary_tool_id");

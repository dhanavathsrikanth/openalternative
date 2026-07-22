import {
  boolean,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  unique,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';
import { eq } from 'drizzle-orm';

// ── Enums ────────────────────────────────────────────────────────────────

export const sourceEnum = pgEnum('source', ['github', 'npm', 'pypi', 'crates']);
export const productStatusEnum = pgEnum('product_status', ['draft', 'published']);
export const curationTypeEnum = pgEnum('curation_type', ['manual', 'score_assisted']);
export const contributionStatusEnum = pgEnum('contribution_status', ['pending', 'approved', 'rejected']);

// ── Starter tables (from Neon–Clerk template) ────────────────────────────

export const Users = pgTable('users', {
  id: text('id').primaryKey().notNull(),
  clerkCreateTs: timestamp('clerk_create_ts').notNull(),
  createTs: timestamp('create_ts').defaultNow().notNull(),
});

export const Elements = pgTable('element', {
  name: text('name').notNull(),
  symbol: varchar('symbol', { length: 3 }).notNull(),
  atomicNumber: integer('atomic_number').notNull().primaryKey(),
});

export const ElementVotes = pgTable('element_votes', {
  elementId: integer('element_id').references(() => Elements.atomicNumber).notNull(),
  userId: text('user_id').references(() => Users.id, { onDelete: 'cascade' }).unique().notNull(),
  createTs: timestamp('create_ts').defaultNow().notNull(),
});

// ── Forklane tables ──────────────────────────────────────────────────────

export const RawSignals = pgTable('raw_signals', {
  id: serial('id').primaryKey(),
  source: sourceEnum('source').notNull(),
  repoIdentifier: text('repo_identifier').notNull(),
  fetchedAt: timestamp('fetched_at').defaultNow().notNull(),
  payload: jsonb('payload').notNull(),
  processed: boolean('processed').default(false).notNull(),
});

export const Categories = pgTable(
  'categories',
  {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    description: text('description'),
  },
  (t) => [uniqueIndex('categories_slug_idx').on(t.slug)],
);

export const Tags = pgTable(
  'tags',
  {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
  },
  (t) => [uniqueIndex('tags_slug_idx').on(t.slug)],
);

export const Products = pgTable(
  'products',
  {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    description: text('description').notNull(),
    license: text('license'),
    primaryLanguage: text('primary_language'),
    deploymentMethods: text('deployment_methods').array(),
    githubUrl: text('github_url'),
    homepageUrl: text('homepage_url'),
    confidenceScore: numeric('confidence_score'),
    scoreBreakdown: jsonb('score_breakdown'),
    status: productStatusEnum('status').default('draft').notNull(),
    lastVerifiedAt: timestamp('last_verified_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex('products_slug_idx').on(t.slug),
  ],
);

export const ProductCategories = pgTable(
  'product_categories',
  {
    productId: integer('product_id')
      .references(() => Products.id, { onDelete: 'cascade' })
      .notNull(),
    categoryId: integer('category_id')
      .references(() => Categories.id, { onDelete: 'cascade' })
      .notNull(),
  },
  (t) => [primaryKey({ columns: [t.productId, t.categoryId] })],
);

export const ProductTags = pgTable(
  'product_tags',
  {
    productId: integer('product_id')
      .references(() => Products.id, { onDelete: 'cascade' })
      .notNull(),
    tagId: integer('tag_id')
      .references(() => Tags.id, { onDelete: 'cascade' })
      .notNull(),
  },
  (t) => [primaryKey({ columns: [t.productId, t.tagId] })],
);

export const Comparisons = pgTable(
  'comparisons',
  {
    id: serial('id').primaryKey(),
    productAId: integer('product_a_id')
      .references(() => Products.id, { onDelete: 'cascade' })
      .notNull(),
    productBId: integer('product_b_id')
      .references(() => Products.id, { onDelete: 'cascade' })
      .notNull(),
    featureMatrix: jsonb('feature_matrix').notNull(),
    generatedAt: timestamp('generated_at').defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex('comparisons_pair_idx').on(t.productAId, t.productBId),
  ],
);

// ── Collections ───────────────────────────────────────────────────────────

export const Collections = pgTable(
  'collections',
  {
    id: serial('id').primaryKey(),
    title: text('title').notNull(),
    slug: text('slug').notNull(),
    description: text('description'),
    curationType: curationTypeEnum('curation_type').notNull().default('manual'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [uniqueIndex('collections_slug_idx').on(t.slug)],
);

export const CollectionProducts = pgTable(
  'collection_products',
  {
    collectionId: integer('collection_id')
      .references(() => Collections.id, { onDelete: 'cascade' })
      .notNull(),
    productId: integer('product_id')
      .references(() => Products.id, { onDelete: 'cascade' })
      .notNull(),
    addedAt: timestamp('added_at').defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.collectionId, t.productId] })],
);

// ── Contributors & Contributions ──────────────────────────────────────────

export const Contributors = pgTable(
  'contributors',
  {
    id: serial('id').primaryKey(),
    clerkUserId: text('clerk_user_id'),
    email: text('email').notNull(),
    displayName: text('display_name').notNull(),
    reputationPoints: integer('reputation_points').notNull().default(0),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex('contributors_clerk_user_id_idx').on(t.clerkUserId),
    uniqueIndex('contributors_email_idx').on(t.email),
  ],
);

export const Contributions = pgTable(
  'contributions',
  {
    id: serial('id').primaryKey(),
    productId: integer('product_id')
      .references(() => Products.id, { onDelete: 'cascade' })
      .notNull(),
    contributorId: integer('contributor_id')
      .references(() => Contributors.id, { onDelete: 'cascade' })
      .notNull(),
    changes: jsonb('changes').notNull(),
    sourceUrl: text('source_url').notNull(),
    status: contributionStatusEnum('status').notNull().default('pending'),
    reviewerId: integer('reviewer_id'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [
    // Prevent the same contributor from having two pending suggestions on the same product.
    // Approved/rejected contributions are history and must not block future submissions.
    uniqueIndex('contributions_pending_per_contributor_idx')
      .on(t.productId, t.contributorId)
      .where(eq(t.status, 'pending')),
  ],
);

// ── Guides (MDX editorial content) ───────────────────────────────────────

export const Guides = pgTable(
  'guides',
  {
    id: serial('id').primaryKey(),
    title: text('title').notNull(),
    slug: text('slug').notNull(),
    description: text('description'),
    authorName: text('author_name').notNull(),
    authorBio: text('author_bio'),
    authorAvatarUrl: text('author_avatar_url'),
    coverImageUrl: text('cover_image_url'),
    tags: text('tags').array(),
    publishedAt: timestamp('published_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [uniqueIndex('guides_slug_idx').on(t.slug)],
);

// ── Reviews ──────────────────────────────────────────────────────────────

export const Reviews = pgTable(
  'reviews',
  {
    id: serial('id').primaryKey(),
    productId: integer('product_id')
      .references(() => Products.id, { onDelete: 'cascade' })
      .notNull(),
    contributorId: integer('contributor_id')
      .references(() => Contributors.id, { onDelete: 'cascade' })
      .notNull(),
    rating: integer('rating').notNull(),
    body: text('body').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [
    unique('reviews_product_contributor_unique').on(t.productId, t.contributorId),
  ],
);

// ── Newsletter subscribers ───────────────────────────────────────────────

export const NewsletterSubscribers = pgTable(
  'newsletter_subscribers',
  {
    id: serial('id').primaryKey(),
    email: text('email').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [uniqueIndex('newsletter_email_idx').on(t.email)],
);

// ── Types ────────────────────────────────────────────────────────────────

export type User = typeof Users.$inferSelect;
export type Element = typeof Elements.$inferSelect;
export type ElementVote = typeof ElementVotes.$inferSelect;
export type RawSignal = typeof RawSignals.$inferSelect;
export type Category = typeof Categories.$inferSelect;
export type Tag = typeof Tags.$inferSelect;
export type Product = typeof Products.$inferSelect;
export type Comparison = typeof Comparisons.$inferSelect;
export type Collection = typeof Collections.$inferSelect;
export type Contributor = typeof Contributors.$inferSelect;
export type Contribution = typeof Contributions.$inferSelect;
export type Guide = typeof Guides.$inferSelect;
export type Review = typeof Reviews.$inferSelect;
export type NewsletterSubscriber = typeof NewsletterSubscribers.$inferSelect;

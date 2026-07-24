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
export const claimMethodEnum = pgEnum('claim_method', ['dns_txt', 'github_org']);
export const claimStatusEnum = pgEnum('claim_status', ['pending', 'verified', 'failed']);
export const reviewStatusEnum = pgEnum('review_status', ['draft', 'approved', 'rejected']);
export const reportStatusEnum = pgEnum('report_status', ['pending', 'resolved', 'dismissed']);
export const reportReasonEnum = pgEnum('report_reason', ['broken_link', 'wrong_category', 'outdated', 'other']);

// ── Core tables ─────────────────────────────────────────────────────────

export const Users = pgTable('users', {
  id: text('id').primaryKey().notNull(),
  staff: boolean('staff').default(false).notNull(),
  clerkCreateTs: timestamp('clerk_create_ts').notNull(),
  createTs: timestamp('create_ts').defaultNow().notNull(),
});

export const Organizations = pgTable('organizations', {
  id: serial('id').primaryKey(),
  clerkOrgId: text('clerk_org_id').notNull().unique(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
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
    seoTitle: text('seo_title'),
    seoDescription: text('seo_description'),
    seoCanonicalUrl: text('seo_canonical_url'),
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
    tagline: text('tagline'),
    license: text('license'),
    primaryLanguage: text('primary_language'),
    deploymentMethods: text('deployment_methods').array(),
    githubUrl: text('github_url'),
    homepageUrl: text('homepage_url'),
    docsUrl: text('docs_url'),
    changelogUrl: text('changelog_url'),
    communityUrl: text('community_url'),
    faq: jsonb('faq'),
    stars: integer('stars'),
    forks: integer('forks'),
    openIssues: integer('open_issues'),
    watchers: integer('watchers'),
    topics: text('topics').array(),
    repoSize: integer('repo_size'),
    isArchived: boolean('is_archived').default(false).notNull(),
    isFork: boolean('is_fork').default(false).notNull(),
    confidenceScore: numeric('confidence_score'),
    scoreBreakdown: jsonb('score_breakdown'),
    techStackDetected: jsonb('tech_stack_detected'),
    status: productStatusEnum('status').default('draft').notNull(),
    claimedByOrgId: integer('claimed_by_org_id').references(() => Organizations.id, { onDelete: 'set null' }),
    lastPushedAt: timestamp('last_pushed_at'),
    defaultBranch: text('default_branch'),
    lastVerifiedAt: timestamp('last_verified_at'),
    seoTitle: text('seo_title'),
    seoDescription: text('seo_description'),
    seoCanonicalUrl: text('seo_canonical_url'),
    contentBlocks: jsonb('content_blocks'),
    contentUpdatedAt: timestamp('content_updated_at'),
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
    body: text('body'),
    status: productStatusEnum('status').default('draft').notNull(),
    authorName: text('author_name').notNull(),
    authorBio: text('author_bio'),
    authorAvatarUrl: text('author_avatar_url'),
    coverImageUrl: text('cover_image_url'),
    relatedProductId: integer('related_product_id').references(() => Products.id, { onDelete: 'set null' }),
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

// ── Reports ──────────────────────────────────────────────────────────────

export const Reports = pgTable(
  'reports',
  {
    id: serial('id').primaryKey(),
    productId: integer('product_id')
      .references(() => Products.id, { onDelete: 'cascade' })
      .notNull(),
    reporterId: integer('reporter_id').references(() => Contributors.id, { onDelete: 'set null' }),
    reason: reportReasonEnum('reason').notNull(),
    detail: text('detail'),
    status: reportStatusEnum('status').notNull().default('pending'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    resolvedAt: timestamp('resolved_at'),
    resolverId: text('resolver_id'),
  },
  (t) => [
    // Prevent duplicate pending reports from same reporter on same product for same reason
    uniqueIndex('reports_pending_unique_idx').on(t.productId, t.reporterId, t.reason).where(eq(t.status, 'pending')),
  ],
);

// ── Claim Requests ───────────────────────────────────────────────────────

export const ClaimRequests = pgTable('claim_requests', {
  id: serial('id').primaryKey(),
  productId: integer('product_id')
    .references(() => Products.id, { onDelete: 'cascade' })
    .notNull(),
  organizationId: integer('organization_id')
    .references(() => Organizations.id, { onDelete: 'cascade' })
    .notNull(),
  method: claimMethodEnum('method').notNull(),
  status: claimStatusEnum('status').notNull().default('pending'),
  verificationToken: text('verification_token').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ── Product Edits (vendor activity log) ──────────────────────────────────

export const ProductEdits = pgTable('product_edits', {
  id: serial('id').primaryKey(),
  productId: integer('product_id')
    .references(() => Products.id, { onDelete: 'cascade' })
    .notNull(),
  organizationId: integer('organization_id')
    .references(() => Organizations.id, { onDelete: 'cascade' })
    .notNull(),
  editorId: text('editor_id').notNull(),
  field: text('field').notNull(),
  oldValue: text('old_value'),
  newValue: text('new_value'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ── Audit Logs ────────────────────────────────────────────────────────

export const AuditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  actorId: text('actor_id').notNull(),
  action: text('action').notNull(),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id').notNull(),
  before: jsonb('before'),
  after: jsonb('after'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

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

// ── Analytics Events ───────────────────────────────────────────────────

export const AnalyticsEvents = pgTable('analytics_events', {
  id: serial('id').primaryKey(),
  productId: integer('product_id')
    .references(() => Products.id, { onDelete: 'cascade' })
    .notNull(),
  eventType: text('event_type').notNull(),
  occurredAt: timestamp('occurred_at').defaultNow().notNull(),
  metadata: jsonb('metadata'),
});

export const productAssetTypeEnum = pgEnum('product_asset_type', ['screenshot', 'logo']);

// ── Product Assets (images uploaded via Cloudflare Images) ───────────────

export const ProductAssets = pgTable('product_assets', {
  id: serial('id').primaryKey(),
  productId: integer('product_id')
    .references(() => Products.id, { onDelete: 'cascade' })
    .notNull(),
  type: productAssetTypeEnum('type').notNull(),
  url: text('url').notNull(),
  assetId: text('asset_id').notNull(),
  uploadedByOrgId: integer('uploaded_by_org_id')
    .references(() => Organizations.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ── Announcements ─────────────────────────────────────────────────────

export const Announcements = pgTable('announcements', {
  id: serial('id').primaryKey(),
  productId: integer('product_id')
    .references(() => Products.id, { onDelete: 'cascade' })
    .notNull(),
  organizationId: integer('organization_id')
    .references(() => Organizations.id, { onDelete: 'cascade' })
    .notNull(),
  title: text('title').notNull(),
  body: text('body').notNull(),
  publishedAt: timestamp('published_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ── Notifications ─────────────────────────────────────────────────────

export const Notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  organizationId: integer('organization_id')
    .references(() => Organizations.id, { onDelete: 'cascade' })
    .notNull(),
  recipientId: text('recipient_id').notNull(),
  eventType: text('event_type').notNull(),
  title: text('title').notNull(),
  body: text('body'),
  metadata: jsonb('metadata'),
  readAt: timestamp('read_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ── AI-generated product content ─────────────────────────────────────────

export const ProductContent = pgTable('product_content', {
  id: serial('id').primaryKey(),
  productId: integer('product_id')
    .references(() => Products.id, { onDelete: 'cascade' })
    .notNull(),
  contentType: text('content_type').notNull(),
  generatedPrompt: text('generated_prompt'),
  output: jsonb('output').notNull(),
  model: text('model'),
  reviewStatus: reviewStatusEnum('review_status').default('draft').notNull(),
  generatedByStaffId: text('generated_by_staff_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => [
  unique('product_content_product_type_unique').on(t.productId, t.contentType),
]);

// ── Types ────────────────────────────────────────────────────────────────

export type User = typeof Users.$inferSelect;
export type Organization = typeof Organizations.$inferSelect;
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
export type ClaimRequest = typeof ClaimRequests.$inferSelect;
export type ProductEdit = typeof ProductEdits.$inferSelect;
export type NewsletterSubscriber = typeof NewsletterSubscribers.$inferSelect;
export type AnalyticsEvent = typeof AnalyticsEvents.$inferSelect;
export type Announcement = typeof Announcements.$inferSelect;
export type Notification = typeof Notifications.$inferSelect;
export type ProductAsset = typeof ProductAssets.$inferSelect;
export type AuditLog = typeof AuditLogs.$inferSelect;
export type ProductContent = typeof ProductContent.$inferSelect;
export type Report = typeof Reports.$inferSelect;

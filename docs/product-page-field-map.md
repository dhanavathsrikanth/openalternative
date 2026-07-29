# Product Page Field Map

Every visible section on `/products/[slug]`, its data source, and how it gets populated.

---

## Public Page Sections

### Hero / Screenshot Banner

| Field | DB Source | Editable From | Auto-populated By |
|---|---|---|---|
| Screenshot image | `ProductAssets.url` WHERE `type='screenshot'` | Admin Asset Manager (edit mode) | Ingestion (repo screenshot) |
| Logo image | `ProductAssets.url` WHERE `type='logo'` | Admin Asset Manager (edit mode) | Ingestion (GitHub org avatar) |
| Product name | `Products.name` | Admin Details tab | Submission flow |
| Verified badge | `Products.claimedByOrgId IS NOT NULL` | N/A (auto) | User claim flow |
| Tagline | `Products.tagline` | Admin Details tab | Ingestion (repo description) |
| Description | `Products.description` | Admin Details tab | Ingestion (AI-generated) |

Component: `ScreenshotBanner.tsx`, `ProductHeaderActions.tsx`

### Stat Pills (below hero)

| Field | DB Source | Editable From | Auto-populated By |
|---|---|---|---|
| Stars count | `Products.stars` | N/A | Ingestion (GitHub API) |
| License badge | `Products.license` | Admin Details tab | Ingestion (GitHub/npm/PyPI) |
| Primary language | `Products.primaryLanguage` | Admin Details tab | Ingestion (GitHub/npm/PyPI) |
| Last pushed date | `Products.lastPushedAt` | N/A | Ingestion (GitHub API) |

Component: `StatPills.tsx`

### CTA Buttons

| Field | DB Source | Editable From | Auto-populated By |
|---|---|---|---|
| Visit Website URL | `Products.homepageUrl` | Admin Details tab | Ingestion (GitHub/npm/PyPI) |
| GitHub repo URL | `Products.githubUrl` | Admin Details tab | Ingestion (GitHub API) |
| Report button | `Reports` table (user action) | N/A | N/A |
| Share button | N/A (client-side) | N/A | N/A |
| Embed button | N/A (client-side, from `slug`/`name`) | N/A | N/A |

Component: `ProductHeaderActions.tsx`

### Alternative-to Chips

| Field | DB Source | Editable From | Auto-populated By |
|---|---|---|---|
| Proprietary tool names | `ProductAlternatives` → `ProprietaryTools.name` | Admin Details tab ("Open Source Alternatives To" combobox) | N/A |

Component: `ProductHeaderActions.tsx`

### Categories & Tags (hero pills)

| Field | DB Source | Editable From | Auto-populated By |
|---|---|---|---|
| Category chips | `ProductCategories` → `Categories.name` | Admin Details tab (multi-select) | N/A |
| Tag chips | `ProductTags` → `Tags.name` | Admin Details tab (multi-select) | N/A |

Component: `ProductHeaderActions.tsx`

### Full Description

| Field | DB Source | Editable From | Auto-populated By |
|---|---|---|---|
| Description text | `Products.description` | Admin Details tab (textarea) | Ingestion (AI-generated) |

Component: `ProductPage.tsx` (inline)

### Table of Contents (sticky sidebar)

| Field | DB Source | Editable From | Auto-populated By |
|---|---|---|---|
| TOC entries | Computed from which content sections are present | N/A (auto) | N/A |

Component: `StickyToc.tsx`

---

## Content Sections (Block Editor / Ingestion)

These sections render from `ProductContent` (AI-generated, review_status='approved') when no content blocks exist on the Product row, or from `Products.contentBlocks` (BlockNote JSON) when the editor has saved content.

### TL;DR

| Field | DB Source | Editable From | Auto-populated By |
|---|---|---|---|
| TL;DR text | `contentBlocks[0].text` OR `ProductContent` WHERE `type='tldr'` | Admin Content editor (BlockNote) | Ingestion: `ContentGenerator` |

Component: `TldrSection.tsx`

### Who It's For

| Field | DB Source | Editable From | Auto-populated By |
|---|---|---|---|
| Target persona text | `contentBlocks[1].text` OR `ProductContent` WHERE `type='who'` | Admin Content editor (BlockNote) | Ingestion: `ContentGenerator` |

Component: `WhoItsForSection.tsx`

### Problem

| Field | DB Source | Editable From | Auto-populated By |
|---|---|---|---|
| Problem statement text | `contentBlocks[2].text` OR `ProductContent` WHERE `type='problem'` | Admin Content editor (BlockNote) | Ingestion: `ContentGenerator` |

Component: `ProblemSection.tsx`

### Solution

| Field | DB Source | Editable From | Auto-populated By |
|---|---|---|---|
| Solution text | `contentBlocks[3].text` OR `ProductContent` WHERE `type='solution'` | Admin Content editor (BlockNote) | Ingestion: `ContentGenerator` |

Component: `SolutionSection.tsx`

### Strengths & Trade-offs

| Field | DB Source | Editable From | Auto-populated By |
|---|---|---|---|
| Strengths list | `contentBlocks[4].strengths` OR `ProductContent` WHERE `type='strengths'` | Admin Content editor (BlockNote) | Ingestion: `ContentGenerator` |
| Trade-offs list | `contentBlocks[4].tradeoffs` OR `ProductContent` WHERE `type='tradeoffs'` | Admin Content editor (BlockNote) | Ingestion: `ContentGenerator` |

Component: `StrengthsTradeoffsSection.tsx`

### Versus Alternatives

| Field | DB Source | Editable From | Auto-populated By |
|---|---|---|---|
| Comparison text | `contentBlocks[5].text` OR `ProductContent` WHERE `type='versus'` | Admin Content editor (BlockNote) | Ingestion: `ContentGenerator` |
| Compared product links | `ProductAlternatives` → `ProprietaryTools` | Admin Details tab | N/A |

Component: `VersusAlternativesSection.tsx`

### Install Methods

| Field | DB Source | Editable From | Auto-populated By |
|---|---|---|---|
| Install methods JSON | `Products.installMethods` JSONB | Admin Content editor | Ingestion: `content-gen/install-methods` |

Component: `InstallMethodsSection.tsx`

### Tech Stack

| Field | DB Source | Editable From | Auto-populated By |
|---|---|---|---|
| Detected tech stack | `Products.techStackDetected` JSONB | N/A | Ingestion: `content-gen/tech-detect` |

Component: `TechStackSection.tsx`

---

## Auto-generated Sections (derived from DB fields)

### FAQ

| Field | DB Source | Editable From | Auto-populated By |
|---|---|---|---|
| Custom FAQ entries | `Products.faq` JSONB | Admin Details tab ("Custom FAQ" section) | N/A |
| Auto-generated Q&A | `Products.name`, `.tagline`, `.description`, `.stars`, `.forks`, `.license`, `.primaryLanguage`, `.lastPushedAt`, `.githubUrl`, `.docsUrl`, `.changelogUrl`, `.communityUrl`, `ProductAlternatives`, `ProductCategories`, `ProductTags` | N/A (auto) | N/A |

Component: `ProductQA.tsx`

### Similar Tools

| Field | DB Source | Editable From | Auto-populated By |
|---|---|---|---|
| Similar product cards | SQL query: products in same categories OR referenced in `versusAlternatives` content blocks | N/A (auto) | N/A |

Component: `SimilarToolsSection.tsx`

---

## Sidebar Sections

### Bookmark

| Field | DB Source | Editable From | Auto-populated By |
|---|---|---|---|
| Saved/bookmarked state | `Bookmarks` table | N/A (user action) | N/A |

Component: `ProductHeaderActions.tsx`

### Confidence Gauge

| Field | DB Source | Editable From | Auto-populated By |
|---|---|---|---|
| Confidence score (0-100) | `Products.confidenceScore` | N/A | Ingestion: `computeConfidenceScore()` |

Component: `ConfidenceGauge.tsx`

### Deployment Methods

| Field | DB Source | Editable From | Auto-populated By |
|---|---|---|---|
| Deployment method labels | `Products.deploymentMethods` text[] | N/A | Ingestion: `detectDeploymentMethods()` |

Component: `DeploymentMethods.tsx`

### Repository Stats

| Field | DB Source | Editable From | Auto-populated By |
|---|---|---|---|
| Stars | `Products.stars` | N/A | Ingestion (GitHub API) |
| Forks | `Products.forks` | N/A | Ingestion (GitHub API) |
| License | `Products.license` | Admin Details tab | Ingestion (GitHub/npm/PyPI) |
| Last pushed | `Products.lastPushedAt` | N/A | Ingestion (GitHub API) |
| Last verified | `Products.lastVerifiedAt` | N/A | Ingestion (GitHub API) |

Component: `RepositoryStats.tsx`

### Additional Details

| Field | DB Source | Editable From | Auto-populated By |
|---|---|---|---|
| Primary language | `Products.primaryLanguage` | Admin Details tab | Ingestion (GitHub/npm/PyPI) |
| Open issues | `Products.openIssues` | N/A | Ingestion (GitHub API) |
| Contributors count | `Products.contributorsCount` | N/A | Ingestion (GitHub API) |
| First release year | `Products.firstReleaseYear` | N/A | Ingestion (GitHub API) |
| Latest version | `Products.latestVersion` | N/A | Ingestion (GitHub/npm/PyPI) |
| Size | `Products.size` | N/A | Ingestion (GitHub API) |
| Default branch | `Products.defaultBranch` | N/A | Ingestion (GitHub API) |

Component: `AdditionalDetails.tsx`

### Categories (sidebar)

| Field | DB Source | Editable From | Auto-populated By |
|---|---|---|---|
| Category list with links | `ProductCategories` → `Categories` | Admin Details tab | N/A |

Component: `SidebarCategories.tsx`

### Tags (sidebar)

| Field | DB Source | Editable From | Auto-populated By |
|---|---|---|---|
| Tag list with links | `ProductTags` → `Tags` | Admin Details tab | N/A |

Component: `SidebarTags.tsx`

### Links (sidebar)

| Field | DB Source | Editable From | Auto-populated By |
|---|---|---|---|
| Homepage URL | `Products.homepageUrl` | Admin Details tab | Ingestion (GitHub/npm/PyPI) |
| Docs URL | `Products.docsUrl` | Admin Details tab | N/A |
| Changelog URL | `Products.changelogUrl` | Admin Details tab | N/A |
| Community URL | `Products.communityUrl` | Admin Details tab | N/A |

Component: `SidebarLinks.tsx`

### Suggest Edit (sidebar)

| Field | DB Source | Editable From | Auto-populated By |
|---|---|---|---|
| Edit suggestion | `ProductSuggestions` table | N/A (user action) | N/A |

Component: `ProductHeaderActions.tsx`

### Report (sidebar)

| Field | DB Source | Editable From | Auto-populated By |
|---|---|---|---|
| Report submission | `Reports` table | N/A (user action) | N/A |

Component: `ProductHeaderActions.tsx`

### Claim Product (sidebar)

| Field | DB Source | Editable From | Auto-populated By |
|---|---|---|---|
| Claim request | `ClaimRequests` table | N/A (user action) | N/A |

Component: `ProductHeaderActions.tsx`

### Announcements (sidebar)

| Field | DB Source | Editable From | Auto-populated By |
|---|---|---|---|
| Announcement entries | `Announcements` table WHERE `productId` | Admin Dashboard | N/A |

Component: `ProductHeaderActions.tsx`

---

## Reviews

| Field | DB Source | Editable From | Auto-populated By |
|---|---|---|---|
| Review text | `Reviews.body` | N/A (user-submitted) | N/A |
| Review rating | `Reviews.rating` | N/A (user-submitted) | N/A |
| Review author | `Reviews.authorName` | N/A (user-submitted) | N/A |

Component: `ReviewForm.tsx`

---

## Admin Preview Tabs

The admin has two independent preview mechanisms:

1. **Details tab live preview card** — Shows a simplified card with logo, name, tagline, description, stars, forks, tags. Uses `ProductAssets` for logo URL directly from the `initialAssets` prop.

2. **Content tab Preview tab** — Shows a content-blocks-only preview in a desktop/mobile frame. Uses `ContentPreview.tsx` which receives `logoUrl` from `initialAssets` (passed via `ProductEditorTabs`).

These are intentionally simplified previews. The full public page includes additional sections (screenshot banner, stat pills, CTA buttons, sidebar, FAQ, similar tools, reviews) not shown in the admin preview.

---

## Data Flow Summary

```
Submission (public) / Create (admin)
  → Products row (minimal fields: name, slug, tagline, description, URLs, license, language, categories, tags)
  → Status: pending_review

Ingestion (normalize cron)
  → GitHub API: stars, forks, lastPushedAt, lastVerifiedAt, contributorsCount, etc.
  → tech-detect: techStackDetected, primaryLanguage
  → install-methods: installMethods
  → confidence: confidenceScore
  → content-gen: content blocks → ProductContent (review_status='pending')

Admin Content Editor (BlockNote)
  → Products.contentBlocks (JSONB) — takes precedence over ProductContent when present

Admin Publish
  → Products.status = 'published'
  → Triggers ISR revalidation
```

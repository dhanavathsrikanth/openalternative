# Search

## Current Implementation: Postgres Full-Text Search

Forklane uses Postgres native full-text search (FTS) powered by a `tsvector` column on the `products` table.

### Architecture

- **Column**: `search_vector tsvector` — a generated column that combines weighted text from `name` (weight A), `description` (weight B), `license` (weight C), and `primary_language` (weight C).
- **Index**: GIN index on `search_vector` for fast lookups.
- **Trigger**: `trg_products_search_vector` keeps the column in sync on INSERT/UPDATE.
- **Ranking**: `ts_rank(search_vector, plainto_tsquery('english', query))` returns a relevance score.
- **Filters**: License, language, and deployment method are combined as additional WHERE clauses.

### Query Flow

1. User submits search query via the hero bar or `/search` page.
2. `GET /api/search?q=...&license=MIT&language=TypeScript` is called.
3. The API builds a `plainto_tsquery` from the query, filters by `search_vector @@ tsquery`, applies optional filters, and orders by `ts_rank`.
4. Results are returned as JSON with `rank` scores.

### Performance

- GIN index ensures sub-millisecond lookups even at 10k+ products.
- `ts_rank` is computed in-memory during the query — acceptable for catalog sizes under 50k rows.
- ISR caching (24h) on product/category pages reduces DB load.

## Upgrade Path: When to Move Beyond Postgres FTS

Postgres FTS is excellent for early-stage catalogs but has limitations at scale:

| Limitation | Threshold | Impact |
|---|---|---|
| No typo tolerance | Any scale | Users must type exact matches |
| No faceted search | >100 categories | Cannot filter by multiple dimensions simultaneously |
| No synonyms | >1k products | "JS" doesn't match "JavaScript" |
| Ranking quality | >10k products | `ts_rank` is bag-of-words, misses semantic relevance |
| Index rebuild time | >50k products | GIN index updates become noticeable |

### Recommended: Typesense or Meilisearch

Both are purpose-built search engines that solve these problems:

#### Typesense

```bash
npm install typesense
```

- Typo-tolerant out of the box
- Faceted search with numeric sorting
- synonyms, prefixes, and vector search
- Easy self-hosting or cloud (Typesense Cloud)

**Integration sketch:**

```typescript
import Typesense from 'typesense'

const client = new Typesense.Client({
  nodes: [{ host: 'localhost', port: '8108', protocol: 'http' }],
  apiKey: 'xyz',
})

// Search with facets
const results = await client.collections('products').documents().search({
  q: 'nextjs',
  query_by: 'name,description',
  filter_by: 'license:MIT && primary_language:TypeScript',
  sort_by: 'confidence_score:desc',
  facet_by: 'license,primary_language,deployment_methods',
  max_facet_values: 20,
})
```

#### Meilisearch

```bash
npm install meilisearch
```

- Typo-tolerant with instant results
- Filterable and sortable attributes
- Synonyms and stop words
- Multi-index search

**Integration sketch:**

```typescript
import { MeiliSearch } from 'meilisearch'

const client = new MeiliSearch({
  host: 'http://localhost:7700',
  apiKey: 'masterKey',
})

// Configure index
await client.index('products').updateSettings({
  searchableAttributes: ['name', 'description', 'license', 'primary_language'],
  filterableAttributes: ['license', 'primary_language', 'deployment_methods'],
  sortableAttributes: ['confidence_score'],
  synonyms: {
    js: ['javascript'],
    ts: ['typescript'],
    py: ['python'],
  },
})

// Search with filters
const results = await client.index('products').search('framework', {
  filter: 'license = "MIT"',
  sort: ['confidence_score:desc'],
  limit: 20,
})
```

### Migration Steps

1. **Add Typesense/Meilisearch as a Docker service** or use cloud hosting.
2. **Create a sync script** that reads from `products` and indexes into the search engine.
3. **Replace the `/api/search` route** to query Typesense/Meilisearch instead of Postgres.
4. **Add a webhook** to the `normalize` cron to trigger re-indexing when products change.
5. **Remove the `search_vector` column** and GIN index once the migration is verified.

### When to Migrate

- **Now**: If you need typo tolerance or faceted search for a better UX.
- **At 5k products**: When `ts_rank` quality becomes a user-facing problem.
- **At 10k products**: When you need synonyms, stemmization, or multi-language support.
- **At 50k products**: When GIN index maintenance becomes a performance concern.

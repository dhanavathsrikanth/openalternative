import { sql, desc, asc, SQL } from 'drizzle-orm'
import { Products } from '@/app/db/schema'

export type SortOption = {
  value: string
  label: string
}

/** Sort options shown on /products (all listing pages). */
export const PRODUCT_SORT_OPTIONS: SortOption[] = [
  { value: 'latest', label: 'Latest' },
  { value: 'name_asc', label: 'Name A–Z' },
  { value: 'name_desc', label: 'Name Z–A' },
  { value: 'stars_desc', label: 'Most stars' },
  { value: 'forks_desc', label: 'Most forks' },
  { value: 'active', label: 'Most active' },
  { value: 'last_commit', label: 'Last commit' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'newest', label: 'Newest first' },
]

/** Extra sort option only available on category pages. */
export const CATEGORY_SORT_OPTIONS: SortOption[] = [
  { value: 'tools_in_category', label: 'Most tools in category' },
]

export const DEFAULT_SORT = 'latest'

/**
 * Return the SQL ORDER BY expression for a given sort key.
 * Every branch is a real column-level sort — never client-side.
 */
export function orderBySort(sort: string): SQL {
  switch (sort) {
    case 'name_asc':
      return asc(Products.name)
    case 'name_desc':
      return desc(Products.name)
    case 'stars_desc':
      return sql`COALESCE(${Products.stars}, 0) DESC`
    case 'forks_desc':
      return sql`COALESCE(${Products.forks}, 0) DESC`
    case 'active':
      return sql`COALESCE(${Products.lastPushedAt}, ${Products.updatedAt}) DESC`
    case 'last_commit':
      return sql`${Products.lastPushedAt} DESC NULLS LAST`
    case 'oldest':
      return asc(Products.createdAt)
    case 'newest':
      return desc(Products.createdAt)
    case 'latest':
    default:
      return desc(Products.createdAt)
  }
}

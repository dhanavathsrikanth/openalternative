import { z } from 'zod'

// ── Shared product validation ──────────────────────────────────────────
//
// A single source of truth for what a "valid" product looks like.
// Used by:
//   • Admin PATCH (publish gate)
//   • Cron normalize (auto-publish gate)
//   • Dashboard profile editor (draft saves)
//
// Drafts can be messy; publish is blocked until the product passes.

const TAGLINE_MAX = 80
const DESCRIPTION_MAX = 200

/**
 * Full shape of editable product fields that the system cares about
 * for validation purposes.  Categories and tags are validated at the
 * API layer (where their IDs are resolved to join-table rows).
 */
export const productPublishableSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required'),
  tagline: z
    .string()
    .min(1, 'Tagline is required for publishing')
    .max(TAGLINE_MAX, `Tagline must be ${TAGLINE_MAX} characters or fewer to fit on a card`),
  description: z
    .string()
    .min(1, 'Description is required for publishing')
    .max(DESCRIPTION_MAX, `Description must be ${DESCRIPTION_MAX} characters or fewer to fit on a card`),
  logoUrl: z
    .string()
    .min(1, 'A logo is required before a product can be published'),
})

export type ProductPublishable = z.infer<typeof productPublishableSchema>

/**
 * Validate that a product (plus its categories/tags/logo) is ready to
 * be published.  Returns either `true` or a list of human-readable
 * error strings describing what's missing.
 *
 * Call this before writing `status: 'published'` anywhere.
 */
export function validatePublishable(product: {
  name: string | null
  slug: string | null
  tagline: string | null
  description: string | null
  logoUrl: string | null
  categoryCount: number
  tagCount: number
}): string[] | true {
  const errors: string[] = []

  // Core field validation (name, slug, tagline, description, logo)
  const result = productPublishableSchema.safeParse({
    name: product.name ?? '',
    slug: product.slug ?? '',
    tagline: product.tagline ?? '',
    description: product.description ?? '',
    logoUrl: product.logoUrl ?? '',
  })

  if (!result.success) {
    for (const issue of result.error.issues) {
      errors.push(issue.message)
    }
  }

  // Category / tag requirements (not in the zod schema because they
  // live in join tables, not on the product row itself)
  if (product.categoryCount < 1) {
    errors.push('At least one category is required')
  }
  if (product.tagCount < 1) {
    errors.push('At least one tag is required')
  }

  return errors.length === 0 ? true : errors
}

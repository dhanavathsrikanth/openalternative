import { z } from 'zod'

// ── Newsletter ──────────────────────────────────────────────────────────

export const newsletterSchema = z.object({
  email: z.string().email('Valid email is required'),
})

export type NewsletterInput = z.infer<typeof newsletterSchema>

// ── Reviews ─────────────────────────────────────────────────────────────

export const createReviewSchema = z.object({
  productId: z.number().int().positive(),
  rating: z.number().int().min(1, 'Rating must be between 1 and 5').max(5, 'Rating must be between 1 and 5'),
  reviewBody: z.string().min(10, 'Review must be at least 10 characters'),
})

export type CreateReviewInput = z.infer<typeof createReviewSchema>

export const getReviewsSchema = z.object({
  productId: z.string().regex(/^\d+$/, 'productId must be a number'),
})

export type GetReviewsInput = z.infer<typeof getReviewsSchema>

// ── Contributions ───────────────────────────────────────────────────────

const ALLOWED_FIELDS = ['description', 'license', 'homepageUrl', 'primaryLanguage'] as const

export const createContributionSchema = z.object({
  productId: z.number().int().positive(),
  changes: z
    .array(
      z.object({
        field: z.string().refine((f) => (ALLOWED_FIELDS as readonly string[]).includes(f), {
          message: `Field must be one of: ${ALLOWED_FIELDS.join(', ')}`,
        }),
        value: z.string(),
      }),
    )
    .min(1, 'At least one change is required'),
  sourceUrl: z.string().url('Invalid source URL'),
})

export type CreateContributionInput = z.infer<typeof createContributionSchema>

export const moderateContributionSchema = z.object({
  status: z.enum(['approved', 'rejected'], {
    errorMap: () => ({ message: 'Status must be "approved" or "rejected"' }),
  }),
})

export type ModerateContributionInput = z.infer<typeof moderateContributionSchema>

export const contributionIdSchema = z.object({
  id: z.string().regex(/^\d+$/, 'Invalid contribution ID'),
})

export type ContributionIdInput = z.infer<typeof contributionIdSchema>

// ── Shared helper ───────────────────────────────────────────────────────

export function formatZodError(error: z.ZodError) {
  const issues = error.issues.map((i) => i.message)
  return issues.length === 1 ? issues[0] : issues.join('; ')
}

// ── Claims ──────────────────────────────────────────────────────────────

export const initiateClaimSchema = z.object({
  productId: z.number().int().positive(),
  method: z.enum(['dns_txt', 'github_org']),
})

export type InitiateClaimInput = z.infer<typeof initiateClaimSchema>

export const verifyClaimSchema = z.object({
  claimRequestId: z.number().int().positive(),
})

export type VerifyClaimInput = z.infer<typeof verifyClaimSchema>

// ── Announcements ─────────────────────────────────────────────────────

export const createAnnouncementSchema = z.object({
  productId: z.number().int().positive(),
  title: z.string().min(1, 'Title is required').max(200),
  body: z.string().min(1, 'Body is required'),
})

export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>

export const updateAnnouncementSchema = z.object({
  id: z.number().int().positive(),
  title: z.string().min(1).max(200).optional(),
  body: z.string().min(1).optional(),
})

export type UpdateAnnouncementInput = z.infer<typeof updateAnnouncementSchema>

// ── Reports ──────────────────────────────────────────────────────────────

export const reportReasonEnum = z.enum(['broken_link', 'wrong_category', 'outdated', 'other'])

export const createReportSchema = z.object({
  productId: z.number().int().positive(),
  reason: reportReasonEnum,
  detail: z.string().optional(),
})

export type CreateReportInput = z.infer<typeof createReportSchema>

export const moderateReportSchema = z.object({
  status: z.enum(['resolved', 'dismissed'], {
    errorMap: () => ({ message: 'Status must be "resolved" or "dismissed"' }),
  }),
})

export type ModerateReportInput = z.infer<typeof moderateReportSchema>

export const reportIdSchema = z.object({
  id: z.string().regex(/^\d+$/, 'Invalid report ID'),
})

export type ReportIdInput = z.infer<typeof reportIdSchema>

// ── Notifications ─────────────────────────────────────────────────────

export const markNotificationReadSchema = z.object({
  id: z.number().int().positive(),
})

export type MarkNotificationReadInput = z.infer<typeof markNotificationReadSchema>

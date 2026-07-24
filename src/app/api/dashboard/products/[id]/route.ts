import { NextResponse } from 'next/server'
import { db } from '@/app/db'
import {
  Products,
  Organizations,
  ProductCategories,
  ProductTags,
  ProductEdits,
} from '@/app/db/schema'
import { requireSession, AuthError } from '@/lib/auth'
import { withAudit } from '@/lib/audit'
import { eq, and } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

type RouteContext = { params: Promise<{ id: string }> }

const EDITABLE_FIELDS = [
  'description',
  'tagline',
  'docsUrl',
  'changelogUrl',
  'communityUrl',
  'faq',
  'categories',
  'tags',
] as const

export async function PATCH(req: Request, { params }: RouteContext): Promise<NextResponse> {
  let ctx
  try {
    ctx = await requireSession()
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof AuthError ? e.message : 'unauthorized' },
      { status: 401 }
    )
  }

  const { id: idParam } = await params
  const productId = parseInt(idParam)
  if (isNaN(productId)) {
    return NextResponse.json({ error: 'invalid product id' }, { status: 400 })
  }

  // Check role >= editor
  const hierarchy: Record<string, number> = {
    'org:owner': 50, 'org:admin': 40, 'org:editor': 30, 'org:marketing': 20, 'org:viewer': 10,
  }
  if ((hierarchy[ctx.orgRole] ?? 0) < 30) {
    return NextResponse.json({ error: 'editor role or higher required' }, { status: 403 })
  }

  // Look up org
  const orgRows = await db
    .select()
    .from(Organizations)
    .where(eq(Organizations.clerkOrgId, ctx.orgId))
    .limit(1)

  if (orgRows.length === 0) {
    return NextResponse.json({ error: 'organization not found' }, { status: 404 })
  }

  const orgId = orgRows[0].id

  // Verify product is claimed by this org
  const productRows = await db
    .select()
    .from(Products)
    .where(and(eq(Products.id, productId), eq(Products.claimedByOrgId, orgId)))
    .limit(1)

  if (productRows.length === 0) {
    return NextResponse.json(
      { error: 'product not found or not claimed by your organization' },
      { status: 404 }
    )
  }

  const product = productRows[0]

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 })
  }

  const updates: Record<string, unknown> = {}
  const edits: Array<{ field: string; oldValue: string | null; newValue: string | null }> = []

  for (const field of ['description', 'tagline', 'docsUrl', 'changelogUrl', 'communityUrl'] as const) {
    if (field in body) {
      const snake = field.replace(/([A-Z])/g, '_$1').toLowerCase()
      const newVal = body[field] === null ? null : String(body[field])
      const oldVal = product[field as keyof typeof product] as string | null
      if (oldVal !== newVal) {
        updates[snake] = newVal
        edits.push({ field, oldValue: oldVal, newValue: newVal })
      }
    }
  }

  if ('faq' in body) {
    const newVal = body.faq === null ? null : JSON.stringify(body.faq)
    const oldVal = product.faq ? JSON.stringify(product.faq) : null
    if (oldVal !== newVal) {
      updates.faq = body.faq
      edits.push({ field: 'faq', oldValue: oldVal, newValue: newVal })
    }
  }

  if (Object.keys(updates).length > 0) {
    updates.updated_at = new Date()
    await withAudit(
      ctx.userId,
      'product.profile_updated',
      'product',
      String(productId),
      async () => {
        const rows = await db.select().from(Products).where(eq(Products.id, productId)).limit(1)
        return rows[0] ?? null
      },
      async (tx) => {
        await tx.update(Products).set(updates).where(eq(Products.id, productId))
      },
    )
  }

  // Category assignment
  if ('categoryIds' in body && Array.isArray(body.categoryIds)) {
    const newCatIds: number[] = body.categoryIds.map(Number)
    await db.delete(ProductCategories).where(eq(ProductCategories.productId, productId))
    if (newCatIds.length > 0) {
      await db.insert(ProductCategories).values(
        newCatIds.map((categoryId) => ({ productId, categoryId }))
      )
    }
    edits.push({ field: 'categories', oldValue: null, newValue: newCatIds.join(',') })
  }

  // Tag assignment
  if ('tagIds' in body && Array.isArray(body.tagIds)) {
    const newTagIds: number[] = body.tagIds.map(Number)
    await db.delete(ProductTags).where(eq(ProductTags.productId, productId))
    if (newTagIds.length > 0) {
      await db.insert(ProductTags).values(
        newTagIds.map((tagId) => ({ productId, tagId }))
      )
    }
    edits.push({ field: 'tags', oldValue: null, newValue: newTagIds.join(',') })
  }

  // Log edits
  if (edits.length > 0) {
    await db.insert(ProductEdits).values(
      edits.map((e) => ({
        productId,
        organizationId: orgId,
        editorId: ctx.userId,
        field: e.field,
        oldValue: e.oldValue,
        newValue: e.newValue,
      }))
    )
  }

  // On-demand ISR revalidation
  revalidatePath(`/products/${product.slug}`)

  return NextResponse.json({ message: 'Profile updated', edits: edits.length })
}

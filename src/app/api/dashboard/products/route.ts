import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/app/db'
import { Products, Organizations } from '@/app/db/schema'
import { eq } from 'drizzle-orm'
import { requireSession } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireSession()

    const orgRows = await db
      .select()
      .from(Organizations)
      .where(eq(Organizations.clerkOrgId, ctx.orgId))
      .limit(1)

    if (orgRows.length === 0) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    const products = await db
      .select({ id: Products.id, name: Products.name, slug: Products.slug })
      .from(Products)
      .where(eq(Products.claimedByOrgId, orgRows[0].id))

    return NextResponse.json({ products })
  } catch (e) {
    if (e instanceof Error && e.name === 'AuthError') {
      return NextResponse.json({ error: e.message }, { status: 401 })
    }
    throw e
  }
}

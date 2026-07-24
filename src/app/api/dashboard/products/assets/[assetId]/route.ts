import { NextRequest, NextResponse } from 'next/server'
import { requireOrgRole } from '@/lib/auth'
import { db } from '@/app/db'
import { ProductAssets, Organizations } from '@/app/db/schema'
import { eq, and } from 'drizzle-orm'

const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID
const CF_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN

type RouteContext = { params: Promise<{ assetId: string }> }

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  try {
    const ctx = await requireOrgRole('org:editor')
    const { assetId: assetIdParam } = await params
    const assetId = parseInt(assetIdParam)

    if (isNaN(assetId)) {
      return NextResponse.json({ error: 'Invalid asset ID.' }, { status: 400 })
    }

    // Find the asset
    const rows = await db
      .select()
      .from(ProductAssets)
      .where(eq(ProductAssets.id, assetId))
      .limit(1)

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Asset not found.' }, { status: 404 })
    }

    const asset = rows[0]

    // Verify the uploading org matches (or use role-based check)
    const orgRows = await db
      .select({ id: Organizations.id })
      .from(Organizations)
      .where(eq(Organizations.clerkOrgId, ctx.orgId))
      .limit(1)

    if (orgRows.length === 0 || asset.uploadedByOrgId !== orgRows[0].id) {
      return NextResponse.json({ error: 'You can only delete assets uploaded by your organization.' }, { status: 403 })
    }

    // Delete from Cloudflare Images
    if (CF_ACCOUNT_ID && CF_API_TOKEN && asset.assetId) {
      try {
        await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/images/v1/${asset.assetId}`,
          {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${CF_API_TOKEN}` },
          },
        )
      } catch {
        // Best-effort — still delete the DB record even if CF deletion fails
      }
    }

    // Delete from database
    await db.delete(ProductAssets).where(eq(ProductAssets.id, assetId))

    return NextResponse.json({ message: 'Asset deleted.' })
  } catch (e) {
    if (e instanceof Error && e.name === 'AuthError') {
      return NextResponse.json({ error: e.message }, { status: 401 })
    }
    throw e
  }
}

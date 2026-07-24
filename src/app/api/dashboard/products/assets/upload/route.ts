import { NextRequest, NextResponse } from 'next/server'
import { requireOrgRole } from '@/lib/auth'
import { db } from '@/app/db'
import { ProductAssets, Organizations } from '@/app/db/schema'
import { eq, and } from 'drizzle-orm'
import sharp, { type Metadata } from 'sharp'

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

const DIMENSION_LIMITS: Record<string, { minW: number; minH: number; maxW: number; maxH: number }> = {
  logo:     { minW: 128,  minH: 128,  maxW: 2048, maxH: 2048 },
  screenshot: { minW: 640,  minH: 480,  maxW: 7680, maxH: 4320 },
}

const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID
const CF_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN
const CF_ACCOUNT_HASH = process.env.CLOUDFLARE_ACCOUNT_HASH

function imageUrl(imageId: string, variant: string) {
  return `https://imagedelivery.net/${CF_ACCOUNT_HASH}/${imageId}/${variant}`
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireOrgRole('org:editor')

    if (!CF_ACCOUNT_ID || !CF_API_TOKEN || !CF_ACCOUNT_HASH) {
      return NextResponse.json(
        { error: 'Cloudflare Images is not configured. Set CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN, and CLOUDFLARE_ACCOUNT_HASH.' },
        { status: 503 },
      )
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const productIdRaw = formData.get('productId') as string | null
    const assetType = formData.get('type') as string | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 })
    }
    if (!productIdRaw) {
      return NextResponse.json({ error: 'Missing productId.' }, { status: 400 })
    }
    if (assetType !== 'logo' && assetType !== 'screenshot') {
      return NextResponse.json({ error: 'Type must be "logo" or "screenshot".' }, { status: 400 })
    }

    const productId = parseInt(productIdRaw)
    if (isNaN(productId)) {
      return NextResponse.json({ error: 'Invalid productId.' }, { status: 400 })
    }

    // --- File type validation ---
    if (!(ALLOWED_TYPES as readonly string[]).includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type "${file.type}". Allowed: PNG, JPEG, WebP.` },
        { status: 400 },
      )
    }

    // --- File size validation ---
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum is 10 MB.` },
        { status: 400 },
      )
    }

    // --- Read file bytes and validate/strip with sharp ---
    const arrayBuffer = await file.arrayBuffer()
    const inputBuffer = Buffer.from(arrayBuffer)

    let metadata: Metadata
    try {
      metadata = await sharp(inputBuffer).metadata()
    } catch {
      return NextResponse.json({ error: 'Could not read image. Ensure it is a valid PNG, JPEG, or WebP file.' }, { status: 400 })
    }

    if (!metadata.width || !metadata.height) {
      return NextResponse.json({ error: 'Could not determine image dimensions.' }, { status: 400 })
    }

    const limits = assetType === 'logo'
      ? { minW: 128, minH: 128, maxW: 2048, maxH: 2048 }
      : { minW: 640, minH: 480, maxW: 7680, maxH: 4320 }

    if (metadata.width < limits.minW || metadata.height < limits.minH) {
      return NextResponse.json(
        { error: `Image too small (${metadata.width}x${metadata.height}). Minimum for ${assetType} is ${limits.minW}x${limits.minH}.` },
        { status: 400 },
      )
    }
    if (metadata.width > limits.maxW || metadata.height > limits.maxH) {
      return NextResponse.json(
        { error: `Image too large (${metadata.width}x${metadata.height}). Maximum for ${assetType} is ${limits.maxW}x${limits.maxH}.` },
        { status: 400 },
      )
    }

    // --- Strip EXIF metadata and convert to WebP for smaller uploads ---
    const cleanBuffer = await sharp(inputBuffer)
      .rotate() // auto-rotate based on EXIF, then strip all metadata
      .webp({ quality: 90 })
      .toBuffer()

    // --- Verify the org owns this product ---
    const orgRows = await db
      .select({ id: Organizations.id })
      .from(Organizations)
      .where(eq(Organizations.clerkOrgId, ctx.orgId))
      .limit(1)

    if (orgRows.length === 0) {
      return NextResponse.json({ error: 'Organization not found.' }, { status: 404 })
    }

    // --- Upload to Cloudflare Images ---
    const cfForm = new FormData()
    cfForm.append('file', new Blob([cleanBuffer], { type: 'image/webp' }), 'image.webp')

    const cfRes = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/images/v1`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${CF_API_TOKEN}` },
        body: cfForm,
      },
    )

    const cfData = await cfRes.json() as {
      success: boolean
      errors: { code: number; message: string }[]
      result?: { id: string }
    }

    if (!cfData.success || !cfData.result?.id) {
      const msg = cfData.errors?.[0]?.message ?? 'Cloudflare upload failed'
      return NextResponse.json({ error: msg }, { status: 502 })
    }

    const cloudflareImageId = cfData.result.id
    const fullUrl = imageUrl(cloudflareImageId, 'public')

    // --- Insert into database ---
    const [asset] = await db
      .insert(ProductAssets)
      .values({
        productId,
        type: assetType,
        url: fullUrl,
        assetId: cloudflareImageId,
        uploadedByOrgId: orgRows[0].id,
      })
      .returning()

    return NextResponse.json({
      asset: {
        id: asset.id,
        type: asset.type,
        url: asset.url,
        assetId: asset.assetId,
        createdAt: asset.createdAt,
      },
    }, { status: 201 })
  } catch (e) {
    if (e instanceof Error && e.name === 'AuthError') {
      return NextResponse.json({ error: e.message }, { status: 401 })
    }
    throw e
  }
}

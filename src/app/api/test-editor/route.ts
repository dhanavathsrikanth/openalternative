import { NextResponse } from 'next/server';
import { db } from '@/app/db';
import { Products } from '@/app/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { validateContentBlocks } from '@/lib/validation/content-blocks';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const productId = parseInt(searchParams.get('productId') ?? '1');

  if (isNaN(productId)) {
    return NextResponse.json({ error: 'invalid productId' }, { status: 400 });
  }

  const rows = await db
    .select({ contentBlocks: Products.contentBlocks, name: Products.name })
    .from(Products)
    .where(and(eq(Products.id, productId), inArray(Products.status, ['published', 'delisted'])))
    .limit(1);

  if (rows.length === 0) {
    return NextResponse.json({ error: 'product not found' }, { status: 404 });
  }

  return NextResponse.json({
    contentBlocks: rows[0].contentBlocks ?? null,
    name: rows[0].name,
  });
}

export async function POST(req: Request) {
  const body = await req.json();
  const { productId = 1, contentBlocks } = body as {
    productId?: number;
    contentBlocks: unknown;
  };

  if (contentBlocks != null) {
    const validation = validateContentBlocks(contentBlocks);
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Invalid content blocks', details: validation.errors },
        { status: 422 },
      );
    }
  }

  const rows = await db
    .update(Products)
    .set({
      contentBlocks,
      contentUpdatedAt: new Date(),
    })
    .where(eq(Products.id, productId))
    .returning({ id: Products.id });

  if (rows.length === 0) {
    return NextResponse.json({ error: 'product not found' }, { status: 404 });
  }

  return NextResponse.json({ ok: true, productId: rows[0].id });
}

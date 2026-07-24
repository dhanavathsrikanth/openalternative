'use client'

import { useCallback, useRef, useState } from 'react'
import type { Product } from '@/app/db/schema'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { ProductDetailsForm } from './ProductDetailsForm'
import { ContentEditor } from './[id]/ContentEditor'
import { ContentPreview } from './ContentPreview'

// ── Types ─────────────────────────────────────────────────────────────────

interface Category { id: number; name: string; slug: string }
interface Tag { id: number; name: string; slug: string }
interface Asset { id: number; type: 'logo' | 'screenshot'; url: string; assetId: string; createdAt: string }

export interface ProductEditorTabsProps {
  mode: 'create' | 'edit'
  initialProduct?: Product
  initialCategoryIds?: number[]
  initialTagIds?: number[]
  initialAssets?: Asset[]
  allCategories: Category[]
  allTags: Tag[]
  initialContentBlocks?: unknown[] | null
}

// ── Component ─────────────────────────────────────────────────────────────

export function ProductEditorTabs({
  mode,
  initialProduct,
  initialCategoryIds = [],
  initialTagIds = [],
  initialAssets = [],
  allCategories,
  allTags,
  initialContentBlocks = null,
}: ProductEditorTabsProps) {
  const isEdit = mode === 'edit'
  const [errors, setErrors] = useState<string[]>([])
  const [success, setSuccess] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)

  // Live blocks state for preview (updated on every editor change)
  const [liveBlocks, setLiveBlocks] = useState<unknown[]>(
    (initialContentBlocks as unknown[]) ?? []
  )

  // Refs to coordinate saves between tabs
  const detailsFormRef = useRef<{
    getPayload: () => Record<string, unknown> | null
    validate: () => string[]
  } | null>(null)

  const contentEditorRef = useRef<{
    saveImmediately: () => Promise<void>
    getBlocks: () => unknown[]
  } | null>(null)

  // ── Create mode: track the new product ID after first save ─────────
  const [createdProductId, setCreatedProductId] = useState<number | null>(
    initialProduct?.id ?? null
  )

  // ── Unified Save Draft ──────────────────────────────────────────────
  const handleSaveDraft = useCallback(async () => {
    setSaving(true)
    setErrors([])
    setSuccess(null)

    try {
      // 1. Save details
      const detailsPayload = detailsFormRef.current?.getPayload()
      if (!detailsPayload) {
        setErrors(['Could not read form data'])
        return
      }

      const url = isEdit
        ? `/api/admin/products/${initialProduct?.id}`
        : '/api/admin/products'
      const method = isEdit ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(detailsPayload),
      })

      const data = await res.json()
      if (!res.ok) {
        setErrors(data.missing ?? [data.error ?? 'Save failed'])
        return
      }

      const productId = isEdit ? initialProduct?.id : data.product?.id
      if (!isEdit && data.product?.id) {
        setCreatedProductId(data.product.id)
      }

      // 2. Save content (if we have a product ID)
      if (productId && contentEditorRef.current) {
        await contentEditorRef.current.saveImmediately()
      }

      setSuccess(isEdit ? 'Saved!' : 'Created!')
    } catch {
      setErrors(['Network error'])
    } finally {
      setSaving(false)
    }
  }, [isEdit, initialProduct?.id])

  // ── Publish ─────────────────────────────────────────────────────────
  const handlePublish = useCallback(async () => {
    setPublishing(true)
    setErrors([])
    setSuccess(null)

    // Validate details tab
    const validationErrors = detailsFormRef.current?.validate() ?? []
    if (validationErrors.length > 0) {
      setErrors(validationErrors)
      setPublishing(false)
      return
    }

    try {
      // 1. Save details with status: published
      const detailsPayload = detailsFormRef.current?.getPayload()
      if (!detailsPayload) {
        setErrors(['Could not read form data'])
        return
      }

      const productId = isEdit ? initialProduct?.id : createdProductId
      const url = productId
        ? `/api/admin/products/${productId}`
        : '/api/admin/products'
      const method = productId && isEdit ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...detailsPayload, status: 'published' }),
      })

      const data = await res.json()
      if (!res.ok) {
        setErrors(data.missing ?? [data.error ?? 'Save failed'])
        return
      }

      const finalId = isEdit ? initialProduct?.id : data.product?.id

      // 2. Save content
      if (finalId && contentEditorRef.current) {
        await contentEditorRef.current.saveImmediately()
      }

      // 3. Trigger publish endpoint for ISR
      if (finalId) {
        await fetch(`/api/admin/products/${finalId}/publish`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'published' }),
        })
      }

      setSuccess('Published!')
      if (!isEdit && data.product?.id) {
        setCreatedProductId(data.product.id)
      }
    } catch {
      setErrors(['Network error during publish'])
    } finally {
      setPublishing(false)
    }
  }, [isEdit, initialProduct?.id, createdProductId])

  const effectiveProductId = createdProductId

  return (
    <Tabs defaultValue="details" className="space-y-4">
      {/* ── Status messages ──────────────────────────────────────────── */}
      {errors.length > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="mb-2 text-sm font-medium text-red-800">Please fix the following:</p>
          <ul className="list-disc space-y-1 pl-5 text-sm text-red-700">
            {errors.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          {success}
        </div>
      )}

      {/* ── Tab bar with actions ─────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleSaveDraft}
            disabled={saving || publishing}
            variant="secondary"
            size="sm"
          >
            {saving ? 'Saving…' : isEdit ? 'Save Draft' : 'Create Draft'}
          </Button>
          <Button
            onClick={handlePublish}
            disabled={saving || publishing}
            size="sm"
          >
            {publishing ? 'Publishing…' : 'Publish'}
          </Button>
        </div>
      </div>

      {/* ── Tab content ──────────────────────────────────────────────── */}
      <TabsContent value="details">
        <ProductDetailsForm
          ref={detailsFormRef}
          mode={mode}
          initialProduct={initialProduct}
          initialCategoryIds={initialCategoryIds}
          initialTagIds={initialTagIds}
          initialAssets={initialAssets}
          allCategories={allCategories}
          allTags={allTags}
        />
      </TabsContent>

      <TabsContent value="content">
        <ContentEditor
          productId={effectiveProductId}
          initialContentBlocks={initialContentBlocks}
          onBlocksChange={setLiveBlocks}
        />
      </TabsContent>

      <TabsContent value="preview">
        <ContentPreview
          product={initialProduct}
          blocks={liveBlocks}
        />
      </TabsContent>
    </Tabs>
  )
}

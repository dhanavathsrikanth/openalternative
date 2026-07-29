'use client'

import { useCallback, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Product } from '@/app/db/schema'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { ProductDetailsForm } from './ProductDetailsForm'
import { ContentEditor } from './[id]/ContentEditor'
import { ContentPreview } from './ContentPreview'

// ── Types ─────────────────────────────────────────────────────────────────

interface Category { id: number; name: string; slug: string }
interface Tag { id: number; name: string; slug: string }
interface ProprietaryTool { id: number; name: string; url: string | null }
interface Asset { id: number; type: 'logo' | 'screenshot'; url: string; assetId: string; createdAt: string }

export interface ProductEditorTabsProps {
  mode: 'create' | 'edit'
  initialProduct?: Product
  initialCategoryIds?: number[]
  initialTagIds?: number[]
  initialProprietaryToolIds?: number[]
  initialAssets?: Asset[]
  allCategories: Category[]
  allTags: Tag[]
  allProprietaryTools: ProprietaryTool[]
  initialContentBlocks?: unknown[] | null
}

// ── Component ─────────────────────────────────────────────────────────────

export function ProductEditorTabs({
  mode,
  initialProduct,
  initialCategoryIds = [],
  initialTagIds = [],
  initialProprietaryToolIds = [],
  initialAssets = [],
  allCategories,
  allTags,
  allProprietaryTools,
  initialContentBlocks = null,
}: ProductEditorTabsProps) {
  const router = useRouter()
  const isEdit = mode === 'edit'
  const [errors, setErrors] = useState<string[]>([])
  const [success, setSuccess] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [targetStatus, setTargetStatus] = useState<string>('published')
  const [usableToday, setUsableToday] = useState<boolean | null>(
    initialProduct?.usableToday ?? null
  )
  const [reviewFlags] = useState<string[] | null>(
    (initialProduct?.reviewFlags as string[] | null) ?? null
  )

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
    saveImmediately: (overrideProductId?: number) => Promise<void>
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
        body: JSON.stringify({ ...detailsPayload, usableToday }),
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
        await contentEditorRef.current.saveImmediately(productId)
      }

      setSuccess(isEdit ? 'Saved!' : 'Created!')

      // 3. In create mode, navigate to the edit URL so that:
      //    - subsequent saves use PATCH (no duplicate products on re-save)
      //    - the asset manager becomes available (logo upload required for publish)
      if (!isEdit && data.product?.id) {
        router.replace(`/admin/products/${data.product.id}`)
      }
    } catch {
      setErrors(['Network error'])
    } finally {
      setSaving(false)
    }
  }, [isEdit, initialProduct?.id, router])

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
        body: JSON.stringify({ ...detailsPayload, status: targetStatus, usableToday }),
      })

      const data = await res.json()
      if (!res.ok) {
        setErrors(data.missing ?? [data.error ?? 'Save failed'])
        return
      }

      const finalId = isEdit ? initialProduct?.id : data.product?.id

      // 2. Save content
      if (finalId && contentEditorRef.current) {
        await contentEditorRef.current.saveImmediately(finalId)
      }

      // 3. Trigger publish endpoint for ISR
      if (finalId && targetStatus === 'published') {
        await fetch(`/api/admin/products/${finalId}/publish`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'published' }),
        })
      }

      setSuccess(targetStatus === 'published' ? 'Published!' : targetStatus === 'pending_review' ? 'Submitted for review!' : 'Saved!')
      if (!isEdit && data.product?.id) {
        setCreatedProductId(data.product.id)
        // Navigate to the edit page for the freshly created product so that
        // the user lands on the canonical editor (asset manager, PATCH saves).
        router.replace(`/admin/products/${data.product.id}`)
      }
    } catch {
      setErrors(['Network error during publish'])
    } finally {
      setPublishing(false)
    }
  }, [isEdit, initialProduct?.id, createdProductId, targetStatus, router])

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
          <select
            value={targetStatus}
            onChange={(e) => setTargetStatus(e.target.value)}
            className="h-8 rounded-md border bg-transparent px-2 text-xs"
          >
            <option value="published">Publish</option>
            <option value="pending_review">Submit for Review</option>
            <option value="scheduled">Schedule</option>
            <option value="rejected">Reject</option>
          </select>
          <Button
            onClick={handlePublish}
            disabled={saving || publishing}
            size="sm"
          >
            {publishing ? 'Saving…' : targetStatus === 'published' ? 'Publish' : targetStatus === 'pending_review' ? 'Submit' : 'Save'}
          </Button>
        </div>
      </div>

      {/* Usable Today checkbox + Review Flags */}
      {isEdit && (
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={usableToday === true}
              onChange={(e) => setUsableToday(e.target.checked)}
              className="h-4 w-4 rounded border"
            />
            Product is usable today
          </label>
          {reviewFlags && reviewFlags.length > 0 && (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs text-amber-700">
              {reviewFlags.length} review flag{reviewFlags.length !== 1 ? 's' : ''}: {reviewFlags[0]}{reviewFlags.length > 1 ? ` (+${reviewFlags.length - 1} more)` : ''}
            </div>
          )}
        </div>
      )}

      {/* ── Tab content ──────────────────────────────────────────────── */}
      <TabsContent value="details">
        <ProductDetailsForm
          ref={detailsFormRef}
          mode={mode}
          initialProduct={initialProduct}
          initialCategoryIds={initialCategoryIds}
          initialTagIds={initialTagIds}
          initialProprietaryToolIds={initialProprietaryToolIds}
          initialAssets={initialAssets}
          allCategories={allCategories}
          allTags={allTags}
          allProprietaryTools={allProprietaryTools}
        />
      </TabsContent>

      {/* ContentEditor is a client-only BlockNote component.
          Direct import is safe here because ProductEditorTabs is already
          a 'use client' component — SSR is not attempted for this tree. */}
      <TabsContent value="content">
        <ContentEditor
          ref={contentEditorRef}
          productId={effectiveProductId}
          initialContentBlocks={initialContentBlocks}
          onBlocksChange={setLiveBlocks}
        />
      </TabsContent>

      <TabsContent value="preview">
        <ContentPreview
          product={initialProduct}
          blocks={liveBlocks}
          logoUrl={initialAssets.find((a) => a.type === 'logo')?.url ?? null}
        />
      </TabsContent>
    </Tabs>
  )
}

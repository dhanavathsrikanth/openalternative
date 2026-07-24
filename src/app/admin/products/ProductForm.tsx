'use client'

import { useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import type { Product } from '@/app/db/schema'
import { validatePublishable } from '@/lib/validation/product'
import { ProductAssetManager } from '@/components/ProductAssetManager'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

// ── Types ─────────────────────────────────────────────────────────────────

interface Category { id: number; name: string; slug: string }
interface Tag { id: number; name: string; slug: string }
interface Asset { id: number; type: 'logo' | 'screenshot'; url: string; assetId: string; createdAt: string }
interface FaqEntry { question: string; answer: string }

interface Props {
  mode: 'create' | 'edit'
  initialProduct?: Product
  initialCategoryIds?: number[]
  initialTagIds?: number[]
  initialAssets?: Asset[]
  allCategories: Category[]
  allTags: Tag[]
}

// ── Helpers ───────────────────────────────────────────────────────────────

function toSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function formatStat(n: number | null | undefined): string {
  if (n == null || n === 0) return '0'
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}K`
  return n.toLocaleString()
}

// ── Component ─────────────────────────────────────────────────────────────

export function ProductForm({
  mode,
  initialProduct,
  initialCategoryIds = [],
  initialTagIds = [],
  initialAssets = [],
  allCategories,
  allTags,
}: Props) {
  const router = useRouter()
  const isEdit = mode === 'edit'

  // ── Form state ────────────────────────────────────────────────────────
  const [name, setName] = useState(initialProduct?.name ?? '')
  const [slug, setSlug] = useState(initialProduct?.slug ?? '')
  const [slugEdited, setSlugEdited] = useState(false)
  const [tagline, setTagline] = useState(initialProduct?.tagline ?? '')
  const [description, setDescription] = useState(initialProduct?.description ?? '')
  const [githubUrl, setGithubUrl] = useState(initialProduct?.githubUrl ?? '')
  const [homepageUrl, setHomepageUrl] = useState(initialProduct?.homepageUrl ?? '')
  const [docsUrl, setDocsUrl] = useState(initialProduct?.docsUrl ?? '')
  const [changelogUrl, setChangelogUrl] = useState(initialProduct?.changelogUrl ?? '')
  const [communityUrl, setCommunityUrl] = useState(initialProduct?.communityUrl ?? '')
  const [license, setLicense] = useState(initialProduct?.license ?? '')
  const [primaryLanguage, setPrimaryLanguage] = useState(initialProduct?.primaryLanguage ?? '')
  const [categoryIds, setCategoryIds] = useState<number[]>(initialCategoryIds)
  const [tagIds, setTagIds] = useState<number[]>(initialTagIds)
  const [faq, setFaq] = useState<FaqEntry[]>((initialProduct?.faq as FaqEntry[] | null) ?? [])
  const [seoTitle, setSeoTitle] = useState(initialProduct?.seoTitle ?? '')
  const [seoDescription, setSeoDescription] = useState(initialProduct?.seoDescription ?? '')
  const [seoCanonicalUrl, setSeoCanonicalUrl] = useState(initialProduct?.seoCanonicalUrl ?? '')

  // ── UI state ──────────────────────────────────────────────────────────
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [success, setSuccess] = useState<string | null>(null)
  const [fetchedInfo, setFetchedInfo] = useState<string | null>(null)

  // ── Assets state ──────────────────────────────────────────────────────
  const [assets, setAssets] = useState<Asset[]>(initialAssets)
  const logoUrl = assets.find((a) => a.type === 'logo')?.url ?? null
  const screenshotUrls = assets.filter((a) => a.type === 'screenshot').map((a) => a.url)

  // ── Auto-generate slug from name ──────────────────────────────────────
  const onNameChange = useCallback((val: string) => {
    setName(val)
    if (!slugEdited) {
      setSlug(toSlug(val))
    }
  }, [slugEdited])

  // ── Toggle helpers ────────────────────────────────────────────────────
  const toggleCategoryId = useCallback((id: number) => {
    setCategoryIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])
  }, [])

  const toggleTagId = useCallback((id: number) => {
    setTagIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])
  }, [])

  // ── Fetch from GitHub ────────────────────────────────────────────────
  const handleFetchGithub = useCallback(async () => {
    const url = githubUrl.trim()
    if (!url) {
      setErrors(['Enter a GitHub URL first'])
      return
    }

    setFetching(true)
    setErrors([])
    setSuccess(null)
    setFetchedInfo(null)

    try {
      const res = await fetch('/api/admin/products/fetch-github', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.error ?? `Failed to fetch (${res.status})`)
      }

      // Auto-fill only empty fields (don't overwrite what admin already typed)
      if (data.name && !name) {
        setName(data.name)
        if (!slugEdited) setSlug(toSlug(data.name))
      }
      if (data.description && !description) setDescription(data.description)
      if (data.homepage && !homepageUrl) setHomepageUrl(data.homepage)
      if (data.license && !license) setLicense(data.license)
      if (data.language && !primaryLanguage) setPrimaryLanguage(data.language)

      setFetchedInfo(`${data.stars.toLocaleString()} stars · ${data.forks.toLocaleString()} forks · ${data.license || 'No license'}`)
      setSuccess('GitHub data fetched successfully')
    } catch (err) {
      setErrors([err instanceof Error ? err.message : 'Failed to fetch from GitHub'])
    } finally {
      setFetching(false)
    }
  }, [githubUrl, name, slugEdited, description, homepageUrl, license, primaryLanguage])

  // ── FAQ helpers ───────────────────────────────────────────────────────
  const addFaqEntry = useCallback(() => {
    setFaq((prev) => [...prev, { question: '', answer: '' }])
  }, [])

  const updateFaqEntry = useCallback((index: number, field: 'question' | 'answer', value: string) => {
    setFaq((prev) => prev.map((e, i) => i === index ? { ...e, [field]: value } : e))
  }, [])

  const removeFaqEntry = useCallback((index: number) => {
    setFaq((prev) => prev.filter((_, i) => i !== index))
  }, [])

  // ── Build payload ─────────────────────────────────────────────────────
  const buildPayload = useCallback(() => ({
    name: name.trim(),
    slug: slug.trim(),
    tagline: tagline.trim() || null,
    description: description.trim(),
    githubUrl: githubUrl.trim() || null,
    homepageUrl: homepageUrl.trim() || null,
    docsUrl: docsUrl.trim() || null,
    changelogUrl: changelogUrl.trim() || null,
    communityUrl: communityUrl.trim() || null,
    license: license.trim() || null,
    primaryLanguage: primaryLanguage.trim() || null,
    categoryIds,
    tagIds,
    faq: faq.filter((e) => e.question && e.answer),
    seoTitle: seoTitle.trim() || null,
    seoDescription: seoDescription.trim() || null,
    seoCanonicalUrl: seoCanonicalUrl.trim() || null,
  }), [name, slug, tagline, description, githubUrl, homepageUrl, docsUrl, changelogUrl, communityUrl, license, primaryLanguage, categoryIds, tagIds, faq, seoTitle, seoDescription, seoCanonicalUrl])

  // ── Client-side validation ────────────────────────────────────────────
  const runValidation = useCallback((): string[] => {
    const result = validatePublishable({
      name,
      slug,
      tagline,
      description,
      logoUrl,
      categoryCount: categoryIds.length,
      tagCount: tagIds.length,
    })
    return result === true ? [] : result
  }, [name, slug, tagline, description, logoUrl, categoryIds, tagIds])

  // ── Save (draft) ──────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    setSaving(true)
    setErrors([])
    setSuccess(null)

    try {
      const payload = buildPayload()
      const url = isEdit ? `/api/admin/products/${initialProduct?.id}` : '/api/admin/products'
      const method = isEdit ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok) {
        setErrors(data.missing ?? [data.error ?? 'Save failed'])
        return
      }

      setSuccess(isEdit ? 'Saved!' : 'Created!')
      if (!isEdit && data.product?.id) {
        setTimeout(() => router.push(`/admin/products/${data.product.id}`), 600)
      }
    } catch {
      setErrors(['Network error'])
    } finally {
      setSaving(false)
    }
  }, [buildPayload, isEdit, initialProduct?.id, router])

  // ── Publish ───────────────────────────────────────────────────────────
  const handlePublish = useCallback(async () => {
    setPublishing(true)
    setErrors([])
    setSuccess(null)

    // Client-side validation first
    const validationErrors = runValidation()
    if (validationErrors.length > 0) {
      setErrors(validationErrors)
      setPublishing(false)
      return
    }

    try {
      const payload = buildPayload()

      // Save all fields first
      const saveUrl = isEdit ? `/api/admin/products/${initialProduct?.id}` : '/api/admin/products'
      const saveMethod = isEdit ? 'PATCH' : 'POST'
      const saveRes = await fetch(saveUrl, {
        method: saveMethod,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, status: 'published' }),
      })

      const saveData = await saveRes.json()
      if (!saveRes.ok) {
        setErrors(saveData.missing ?? [saveData.error ?? 'Save failed'])
        return
      }

      // If we have a product ID, also trigger the publish endpoint for ISR
      const productId = isEdit ? initialProduct?.id : saveData.product?.id
      if (productId) {
        await fetch(`/api/admin/products/${productId}/publish`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'published' }),
        })
      }

      setSuccess('Published!')
      if (!isEdit && saveData.product?.id) {
        setTimeout(() => router.push(`/admin/products/${saveData.product.id}`), 600)
      }
    } catch {
      setErrors(['Network error during publish'])
    } finally {
      setPublishing(false)
    }
  }, [runValidation, buildPayload, isEdit, initialProduct?.id, router])

  // ── Live preview data ─────────────────────────────────────────────────
  const previewProduct = useMemo(() => ({
    id: initialProduct?.id ?? 0,
    name: name || 'Product Name',
    slug: slug || 'product-slug',
    description: description || 'Product description will appear here.',
    tagline: tagline || null,
    license: license || null,
    primaryLanguage: primaryLanguage || null,
    confidenceScore: initialProduct?.confidenceScore ?? null,
  }), [name, slug, description, tagline, license, primaryLanguage, initialProduct?.confidenceScore])

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
      {/* ── Left: Form ──────────────────────────────────────────────── */}
      <div className="space-y-8">
        {/* Status messages */}
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

        {/* ── Basic Info ──────────────────────────────────────────────── */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold border-b pb-2">Basic Information</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="text-sm font-medium">Name *</label>
              <Input value={name} onChange={(e) => onNameChange(e.target.value)} placeholder="e.g. Supabase" className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Slug *</label>
              <Input
                value={slug}
                onChange={(e) => { setSlug(e.target.value); setSlugEdited(true) }}
                placeholder="auto-generated"
                className="mt-1"
              />
              <p className="mt-1 text-xs text-muted-foreground">Auto-generated from name. Edit to customize.</p>
            </div>
            <div>
              <label className="text-sm font-medium">Primary Language</label>
              <Input value={primaryLanguage} onChange={(e) => setPrimaryLanguage(e.target.value)} placeholder="e.g. TypeScript" className="mt-1" />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Tagline * <span className="text-muted-foreground font-normal">(max 80 chars)</span></label>
            <Input value={tagline} onChange={(e) => setTagline(e.target.value)} maxLength={80} placeholder="Short punchy one-liner" className="mt-1" />
            <p className="mt-1 text-xs text-muted-foreground">{tagline.length}/80</p>
          </div>

          <div>
            <label className="text-sm font-medium">Description * <span className="text-muted-foreground font-normal">(max 200 chars)</span></label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={200}
              rows={3}
              className="mt-1 w-full rounded-md border bg-transparent px-3 py-2 text-sm"
              placeholder="One or two sentences describing the product"
            />
            <p className="mt-1 text-xs text-muted-foreground">{description.length}/200</p>
          </div>
        </section>

        {/* ── Links ───────────────────────────────────────────────────── */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold border-b pb-2">Links</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium">GitHub URL</label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  placeholder="https://github.com/..."
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleFetchGithub}
                  disabled={fetching || !githubUrl.trim()}
                  className="shrink-0"
                >
                  {fetching ? 'Fetching…' : 'Fetch'}
                </Button>
              </div>
              {fetchedInfo && (
                <p className="mt-1 text-xs text-muted-foreground">{fetchedInfo}</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium">Homepage URL</label>
              <Input value={homepageUrl} onChange={(e) => setHomepageUrl(e.target.value)} placeholder="https://..." className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Docs URL</label>
              <Input value={docsUrl} onChange={(e) => setDocsUrl(e.target.value)} placeholder="https://docs..." className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Changelog URL</label>
              <Input value={changelogUrl} onChange={(e) => setChangelogUrl(e.target.value)} placeholder="https://..." className="mt-1" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-medium">Community URL</label>
              <Input value={communityUrl} onChange={(e) => setCommunityUrl(e.target.value)} placeholder="https://discord.gg/..." className="mt-1" />
            </div>
          </div>
        </section>

        {/* ── License ─────────────────────────────────────────────────── */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold border-b pb-2">License</h2>
          <div>
            <label className="text-sm font-medium">License Identifier</label>
            <Input value={license} onChange={(e) => setLicense(e.target.value)} placeholder="e.g. MIT, Apache-2.0, GPL-3.0" className="mt-1" />
          </div>
        </section>

        {/* ── Categories & Tags ───────────────────────────────────────── */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold border-b pb-2">Categories & Tags</h2>

          <div>
            <label className="text-sm font-medium">Categories * <span className="text-muted-foreground font-normal">(at least 1 required for publishing)</span></label>
            <div className="mt-2 flex flex-wrap gap-2">
              {allCategories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => toggleCategoryId(cat.id)}
                  className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    categoryIds.includes(cat.id)
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-muted-foreground/25 text-muted-foreground hover:border-muted-foreground/50'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
              {allCategories.length === 0 && (
                <span className="text-xs text-muted-foreground">No categories created yet.</span>
              )}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Tags * <span className="text-muted-foreground font-normal">(at least 1 required for publishing)</span></label>
            <div className="mt-2 flex flex-wrap gap-2">
              {allTags.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTagId(tag.id)}
                  className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    tagIds.includes(tag.id)
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-muted-foreground/25 text-muted-foreground hover:border-muted-foreground/50'
                  }`}
                >
                  #{tag.name}
                </button>
              ))}
              {allTags.length === 0 && (
                <span className="text-xs text-muted-foreground">No tags created yet.</span>
              )}
            </div>
          </div>
        </section>

        {/* ── Assets (upload) ─────────────────────────────────────────── */}
        {isEdit && initialProduct && (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold border-b pb-2">Logo & Screenshots</h2>
            <ProductAssetManager
              productId={initialProduct.id}
              initialAssets={initialAssets}
            />
          </section>
        )}

        {/* ── FAQ ─────────────────────────────────────────────────────── */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <h2 className="text-lg font-semibold">Custom FAQ</h2>
            <Button type="button" variant="secondary" size="sm" onClick={addFaqEntry}>
              + Add Entry
            </Button>
          </div>
          {faq.length === 0 && (
            <p className="text-sm text-muted-foreground">No custom FAQ entries. Auto-generated FAQ is always included on the public page.</p>
          )}
          <div className="space-y-3">
            {faq.map((entry, i) => (
              <div key={i} className="rounded-lg border bg-card p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Question {i + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeFaqEntry(i)}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
                <Input
                  value={entry.question}
                  onChange={(e) => updateFaqEntry(i, 'question', e.target.value)}
                  placeholder="Question"
                />
                <textarea
                  value={entry.answer}
                  onChange={(e) => updateFaqEntry(i, 'answer', e.target.value)}
                  placeholder="Answer"
                  rows={2}
                  className="w-full rounded-md border bg-transparent px-3 py-2 text-sm"
                />
              </div>
            ))}
          </div>
        </section>

        {/* ── SEO ─────────────────────────────────────────────────────── */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold border-b pb-2">SEO</h2>
          <div>
            <label className="text-sm font-medium">SEO Title</label>
            <Input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} placeholder="Override the default title tag" className="mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium">SEO Description</label>
            <textarea
              value={seoDescription}
              onChange={(e) => setSeoDescription(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-md border bg-transparent px-3 py-2 text-sm"
              placeholder="Override the default meta description"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Canonical URL</label>
            <Input value={seoCanonicalUrl} onChange={(e) => setSeoCanonicalUrl(e.target.value)} placeholder="https://..." className="mt-1" />
          </div>
        </section>

        {/* ── Actions ─────────────────────────────────────────────────── */}
        <section className="flex items-center gap-3 border-t pt-6">
          <Button onClick={handleSave} disabled={saving || publishing} variant="secondary">
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Draft'}
          </Button>
          <Button onClick={handlePublish} disabled={saving || publishing}>
            {publishing ? 'Publishing…' : 'Publish'}
          </Button>
        </section>
      </div>

      {/* ── Right: Live preview ────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="sticky top-6">
          <h3 className="mb-3 text-sm font-medium text-muted-foreground">Live Preview</h3>
          <div className="rounded-2xl border border-card-border bg-card p-5 shadow-sm">
            {/* Logo + Name */}
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted text-muted-foreground">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="h-full w-full object-cover" />
                ) : (
                  <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                    <path d="M9 18c-4.51 2-5-2-7-2" />
                  </svg>
                )}
              </div>
              <h3 className="truncate text-lg font-semibold text-foreground">
                {previewProduct.name}
              </h3>
            </div>

            {/* Stat row */}
            <div className="mb-3 flex gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-card-border bg-secondary/50 px-2.5 py-0.5 text-xs text-muted-foreground">
                <svg className="size-3.5 shrink-0 text-yellow-500" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                <span className="font-medium uppercase tracking-wide">Stars</span>
                <span className="tabular-nums">{formatStat(initialProduct?.stars)}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-card-border bg-secondary/50 px-2.5 py-0.5 text-xs text-muted-foreground">
                <svg className="size-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="18" r="3" /><circle cx="6" cy="6" r="3" /><circle cx="18" cy="6" r="3" />
                  <path d="M18 9v2c0 .6-.4 1-1 1H7c-.6 0-1-.4-1-1V9" /><path d="M12 12v3" />
                </svg>
                <span className="font-medium uppercase tracking-wide">Forks</span>
                <span className="tabular-nums">{formatStat(initialProduct?.forks)}</span>
              </span>
            </div>

            {/* Tagline */}
            {previewProduct.tagline && (
              <p className="mb-2 line-clamp-2 text-sm font-medium text-foreground/80">
                {previewProduct.tagline}
              </p>
            )}

            {/* Description */}
            <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
              {previewProduct.description}
            </p>

            {/* Tags preview */}
            {tagIds.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tagIds.slice(0, 3).map((id) => {
                  const tag = allTags.find((t) => t.id === id)
                  return tag ? (
                    <span key={id} className="inline-flex items-center rounded-full border border-card-border bg-secondary/30 px-2 py-0.5 text-xs text-muted-foreground">
                      #{tag.name}
                    </span>
                  ) : null
                })}
                {tagIds.length > 3 && (
                  <span className="inline-flex items-center rounded-full border border-card-border bg-secondary/30 px-2 py-0.5 text-xs text-muted-foreground">
                    +{tagIds.length - 3}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Validation checklist */}
          <div className="mt-4 rounded-lg border bg-card p-4">
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Publish Readiness</h4>
            <ul className="space-y-1 text-xs">
              <CheckItem checked={name.trim().length > 0} label="Name" />
              <CheckItem checked={tagline.trim().length > 0 && tagline.length <= 80} label="Tagline (1-80 chars)" />
              <CheckItem checked={description.trim().length > 0 && description.length <= 200} label="Description (1-200 chars)" />
              <CheckItem checked={!!logoUrl} label="Logo uploaded" />
              <CheckItem checked={categoryIds.length > 0} label={`${categoryIds.length} categor${categoryIds.length === 1 ? 'y' : 'ies'}`} />
              <CheckItem checked={tagIds.length > 0} label={`${tagIds.length} tag${tagIds.length === 1 ? '' : 's'}`} />
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

function CheckItem({ checked, label }: { checked: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2">
      {checked ? (
        <svg className="size-3.5 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M20 6L9 17l-5-5" />
        </svg>
      ) : (
        <svg className="size-3.5 text-muted-foreground/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
        </svg>
      )}
      <span className={checked ? 'text-foreground' : 'text-muted-foreground'}>{label}</span>
    </li>
  )
}

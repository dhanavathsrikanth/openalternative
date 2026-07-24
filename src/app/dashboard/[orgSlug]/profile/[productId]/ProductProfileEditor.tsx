'use client'

import { useState } from 'react'
import { ProductAssetManager } from '@/components/ProductAssetManager'

interface FaqEntry {
  question: string
  answer: string
}

interface Asset {
  id: number
  type: 'screenshot' | 'logo'
  url: string
  assetId: string
  createdAt: string
}

interface Props {
  productId: number
  productSlug: string
  initialData: {
    name: string
    description: string
    tagline: string | null
    homepageUrl: string | null
    docsUrl: string | null
    changelogUrl: string | null
    communityUrl: string | null
    faq: FaqEntry[] | null
  }
  categories: { id: number; name: string; slug: string }[]
  assignedCategoryIds: number[]
  tags: { id: number; name: string; slug: string }[]
  assignedTagIds: number[]
  assets: Asset[]
}

const EDITABLE_FIELDS = [
  'description',
  'tagline',
  'docsUrl',
  'changelogUrl',
  'communityUrl',
  'faq',
] as const

export function ProductProfileEditor({
  productId,
  productSlug,
  initialData,
  categories,
  assignedCategoryIds,
  tags,
  assignedTagIds,
  assets,
}: Props) {
  const [description, setDescription] = useState(initialData.description)
  const [tagline, setTagline] = useState(initialData.tagline ?? '')
  const [docsUrl, setDocsUrl] = useState(initialData.docsUrl ?? '')
  const [changelogUrl, setChangelogUrl] = useState(initialData.changelogUrl ?? '')
  const [communityUrl, setCommunityUrl] = useState(initialData.communityUrl ?? '')
  const [faq, setFaq] = useState<FaqEntry[]>(initialData.faq ?? [])
  const [selectedCats, setSelectedCats] = useState<number[]>(assignedCategoryIds)
  const [selectedTags, setSelectedTags] = useState<number[]>(assignedTagIds)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function addFaq() {
    setFaq([...faq, { question: '', answer: '' }])
  }

  function updateFaq(index: number, key: 'question' | 'answer', value: string) {
    const updated = [...faq]
    updated[index] = { ...updated[index], [key]: value }
    setFaq(updated)
  }

  function removeFaq(index: number) {
    setFaq(faq.filter((_, i) => i !== index))
  }

  async function save() {
    setSaving(true)
    setError(null)
    setSaved(false)

    try {
      const res = await fetch(`/api/dashboard/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description,
          tagline: tagline || null,
          docsUrl: docsUrl || null,
          changelogUrl: changelogUrl || null,
          communityUrl: communityUrl || null,
          faq: faq.length > 0 ? faq : null,
          categoryIds: selectedCats,
          tagIds: selectedTags,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to save')
        return
      }
      setSaved(true)
    } catch {
      setError('Network error')
    } finally {
      setSaving(false)
    }
  }

  function toggleCategory(id: number) {
    setSelectedCats((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    )
  }

  function toggleTag(id: number) {
    setSelectedTags((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}
      {saved && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          Saved. Changes will appear on the public page shortly.
        </div>
      )}

      {/* Images */}
      <div>
        <label className="text-sm font-medium">Product Images</label>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Upload a logo and screenshots. Images are optimized and served via Cloudflare Images.
        </p>
        <div className="mt-3">
          <ProductAssetManager productId={productId} initialAssets={assets} />
        </div>
      </div>

      {/* Tagline */}
      <Field label="Tagline" hint="One-line summary shown on the product card">
        <input
          type="text"
          value={tagline}
          onChange={(e) => setTagline(e.target.value)}
          placeholder="e.g. The open-source alternative to X"
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
        />
      </Field>

      {/* Description */}
      <Field label="Description">
        <textarea
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
        />
      </Field>

      {/* Categories */}
      <Field label="Categories">
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => toggleCategory(cat.id)}
              className={`rounded-full px-3 py-0.5 text-xs font-medium transition-colors ${
                selectedCats.includes(cat.id)
                  ? 'bg-green-600 text-white'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </Field>

      {/* Tags */}
      <Field label="Tags">
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => toggleTag(tag.id)}
              className={`rounded-full px-3 py-0.5 text-xs font-medium transition-colors ${
                selectedTags.includes(tag.id)
                  ? 'bg-green-600 text-white'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              {tag.name}
            </button>
          ))}
        </div>
      </Field>

      {/* URLs */}
      <Field label="Docs URL">
        <input type="url" value={docsUrl} onChange={(e) => setDocsUrl(e.target.value)} placeholder="https://docs.example.com" className="w-full rounded-lg border bg-background px-3 py-2 text-sm" />
      </Field>
      <Field label="Changelog URL">
        <input type="url" value={changelogUrl} onChange={(e) => setChangelogUrl(e.target.value)} placeholder="https://changelog.example.com" className="w-full rounded-lg border bg-background px-3 py-2 text-sm" />
      </Field>
      <Field label="Community URL">
        <input type="url" value={communityUrl} onChange={(e) => setCommunityUrl(e.target.value)} placeholder="https://discord.gg/example" className="w-full rounded-lg border bg-background px-3 py-2 text-sm" />
      </Field>

      {/* FAQ */}
      <div>
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Custom FAQ</label>
          <button type="button" onClick={addFaq} className="text-xs text-green-600 hover:underline">
            + Add entry
          </button>
        </div>
        <div className="mt-2 space-y-3">
          {faq.map((entry, i) => (
            <div key={i} className="rounded-lg border bg-card p-3 space-y-2">
              <div className="flex items-start gap-2">
                <input
                  type="text"
                  value={entry.question}
                  onChange={(e) => updateFaq(i, 'question', e.target.value)}
                  placeholder="Question"
                  className="flex-1 rounded border bg-background px-2 py-1.5 text-sm"
                />
                <button type="button" onClick={() => removeFaq(i)} className="text-xs text-red-500 hover:underline">
                  Remove
                </button>
              </div>
              <textarea
                rows={2}
                value={entry.answer}
                onChange={(e) => updateFaq(i, 'answer', e.target.value)}
                placeholder="Answer"
                className="w-full rounded border bg-background px-2 py-1.5 text-sm"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Save */}
      <div className="flex items-center gap-3 border-t pt-4">
        <button
          onClick={save}
          disabled={saving}
          className="rounded-lg bg-green-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
        <a
          href={`/products/${productSlug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
        >
          View public page →
        </a>
      </div>
    </div>
  )
}

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
      <div className="mt-1.5">{children}</div>
    </div>
  )
}

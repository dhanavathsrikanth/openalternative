'use client'

import { useState } from 'react'

interface CategoryRow {
  id: number
  name: string
  slug: string
  description: string | null
  seoTitle: string | null
  seoDescription: string | null
  seoCanonicalUrl: string | null
  productCount: number
}

type Props = { categories: CategoryRow[] }

interface Form {
  name: string
  slug: string
  description: string
  seoTitle: string
  seoDescription: string
  seoCanonicalUrl: string
}

const emptyForm: Form = {
  name: '',
  slug: '',
  description: '',
  seoTitle: '',
  seoDescription: '',
  seoCanonicalUrl: '',
}

export function CategoryManager({ categories: initial }: Props) {
  const [categories, setCategories] = useState(initial)
  const [form, setForm] = useState<Form>(emptyForm)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)

  async function handleCreate() {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        const created = await res.json()
        setCategories((prev) => [{ ...created, productCount: 0 }, ...prev])
        setForm(emptyForm)
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleUpdate(id: number) {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        setCategories((prev) =>
          prev.map((c) =>
            c.id === id
              ? {
                  ...c,
                  name: form.name,
                  slug: form.slug,
                  description: form.description || null,
                  seoTitle: form.seoTitle || null,
                  seoDescription: form.seoDescription || null,
                  seoCanonicalUrl: form.seoCanonicalUrl || null,
                }
              : c,
          ),
        )
        setEditingId(null)
        setForm(emptyForm)
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this category?')) return
    const res = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setCategories((prev) => prev.filter((c) => c.id !== id))
    }
  }

  function startEdit(c: CategoryRow) {
    setEditingId(c.id)
    setForm({
      name: c.name,
      slug: c.slug,
      description: c.description ?? '',
      seoTitle: c.seoTitle ?? '',
      seoDescription: c.seoDescription ?? '',
      seoCanonicalUrl: c.seoCanonicalUrl ?? '',
    })
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-card p-4">
        <h2 className="text-sm font-medium mb-3">
          {editingId ? 'Edit Category' : 'New Category'}
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <input
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
          <input
            placeholder="Slug"
            value={form.slug}
            onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
            className="flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
          <input
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className="col-span-2 flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
          <input
            placeholder="SEO Title"
            value={form.seoTitle}
            onChange={(e) => setForm((f) => ({ ...f, seoTitle: e.target.value }))}
            className="flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
          <input
            placeholder="SEO Description"
            value={form.seoDescription}
            onChange={(e) => setForm((f) => ({ ...f, seoDescription: e.target.value }))}
            className="flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
          <input
            placeholder="SEO Canonical URL"
            value={form.seoCanonicalUrl}
            onChange={(e) => setForm((f) => ({ ...f, seoCanonicalUrl: e.target.value }))}
            className="col-span-2 flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        </div>
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => (editingId ? handleUpdate(editingId) : handleCreate())}
            disabled={saving}
            className="inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding px-2.5 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/80 h-8 disabled:opacity-50"
          >
            {saving ? 'Saving...' : editingId ? 'Update' : 'Create'}
          </button>
          {editingId && (
            <button
              onClick={() => { setEditingId(null); setForm(emptyForm) }}
              className="inline-flex shrink-0 items-center justify-center rounded-lg border bg-transparent px-2.5 text-sm font-medium text-muted-foreground hover:bg-muted h-8"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="p-3 font-medium">ID</th>
              <th className="p-3 font-medium">Name</th>
              <th className="p-3 font-medium">Slug</th>
              <th className="p-3 font-medium">Description</th>
              <th className="p-3 font-medium">Products</th>
              <th className="p-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.id} className="border-b last:border-0">
                <td className="p-3">{c.id}</td>
                <td className="p-3 font-medium">{c.name}</td>
                <td className="p-3 text-muted-foreground">{c.slug}</td>
                <td className="p-3 text-muted-foreground max-w-[200px] truncate">
                  {c.description ?? '—'}
                </td>
                <td className="p-3">{c.productCount}</td>
                <td className="p-3 flex gap-2">
                  <button
                    onClick={() => startEdit(c)}
                    className="inline-flex shrink-0 items-center justify-center rounded-lg border bg-transparent px-2.5 text-sm font-medium text-muted-foreground hover:bg-muted h-8"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding px-2.5 text-sm font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 h-8"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

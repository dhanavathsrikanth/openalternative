'use client'

import { useState } from 'react'

interface CollectionRow {
  id: number
  title: string
  slug: string
  curationType: string
  productCount: number
  createdAt: Date
}

type Props = { collections: CollectionRow[] }

const emptyForm = { title: '', slug: '', description: '', curationType: 'manual' }

export function CollectionManager({ collections: initial }: Props) {
  const [collections, setCollections] = useState(initial)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)

  async function handleCreate() {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        const created = await res.json()
        setCollections((prev) => [{ ...created, productCount: 0 }, ...prev])
        setForm(emptyForm)
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleUpdate(id: number) {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/collections/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        setCollections((prev) =>
          prev.map((c) => (c.id === id ? { ...c, ...form } : c)),
        )
        setEditingId(null)
        setForm(emptyForm)
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this collection?')) return
    const res = await fetch(`/api/admin/collections/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setCollections((prev) => prev.filter((c) => c.id !== id))
    }
  }

  function startEdit(c: CollectionRow) {
    setEditingId(c.id)
    setForm({ title: c.title, slug: c.slug, description: '', curationType: c.curationType })
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-card p-4">
        <h2 className="text-sm font-medium mb-3">
          {editingId ? 'Edit Collection' : 'New Collection'}
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <input
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
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
            className="flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
          <select
            value={form.curationType}
            onChange={(e) => setForm((f) => ({ ...f, curationType: e.target.value }))}
            className="flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="manual">Manual</option>
            <option value="score_assisted">Score Assisted</option>
          </select>
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
              <th className="p-3 font-medium">Title</th>
              <th className="p-3 font-medium">Slug</th>
              <th className="p-3 font-medium">Curation</th>
              <th className="p-3 font-medium">Products</th>
              <th className="p-3 font-medium">Created</th>
              <th className="p-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {collections.map((c) => (
              <tr key={c.id} className="border-b last:border-0">
                <td className="p-3">{c.id}</td>
                <td className="p-3 font-medium">{c.title}</td>
                <td className="p-3 text-muted-foreground">{c.slug}</td>
                <td className="p-3 text-muted-foreground">{c.curationType}</td>
                <td className="p-3">{c.productCount}</td>
                <td className="p-3 text-muted-foreground">
                  {c.createdAt.toLocaleDateString()}
                </td>
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

'use client'

import { useState } from 'react'

interface TagRow {
  id: number
  name: string
  slug: string
  productCount: number
}

type Props = { tags: TagRow[] }

export function TagManager({ tags: initial }: Props) {
  const [tags, setTags] = useState(initial)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)

  async function handleCreate() {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, slug }),
      })
      if (res.ok) {
        const created = await res.json()
        setTags((prev) => [{ ...created, productCount: 0 }, ...prev])
        setName('')
        setSlug('')
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleUpdate(id: number) {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/tags/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, slug }),
      })
      if (res.ok) {
        setTags((prev) =>
          prev.map((t) => (t.id === id ? { ...t, name, slug } : t)),
        )
        setEditingId(null)
        setName('')
        setSlug('')
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this tag?')) return
    const res = await fetch(`/api/admin/tags/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setTags((prev) => prev.filter((t) => t.id !== id))
    }
  }

  function startEdit(t: TagRow) {
    setEditingId(t.id)
    setName(t.name)
    setSlug(t.slug)
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-card p-4">
        <h2 className="text-sm font-medium mb-3">
          {editingId ? 'Edit Tag' : 'New Tag'}
        </h2>
        <div className="flex gap-3">
          <input
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex h-9 w-full max-w-[200px] rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
          <input
            placeholder="Slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="flex h-9 w-full max-w-[200px] rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
          <button
            onClick={() => (editingId ? handleUpdate(editingId) : handleCreate())}
            disabled={saving}
            className="inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding px-2.5 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/80 h-8 disabled:opacity-50"
          >
            {saving ? 'Saving...' : editingId ? 'Update' : 'Create'}
          </button>
          {editingId && (
            <button
              onClick={() => { setEditingId(null); setName(''); setSlug('') }}
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
              <th className="p-3 font-medium">Products</th>
              <th className="p-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tags.map((t) => (
              <tr key={t.id} className="border-b last:border-0">
                <td className="p-3">{t.id}</td>
                <td className="p-3 font-medium">{t.name}</td>
                <td className="p-3 text-muted-foreground">{t.slug}</td>
                <td className="p-3">{t.productCount}</td>
                <td className="p-3 flex gap-2">
                  <button
                    onClick={() => startEdit(t)}
                    className="inline-flex shrink-0 items-center justify-center rounded-lg border bg-transparent px-2.5 text-sm font-medium text-muted-foreground hover:bg-muted h-8"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(t.id)}
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

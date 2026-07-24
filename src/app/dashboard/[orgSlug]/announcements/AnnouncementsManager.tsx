'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'

interface Announcement {
  id: number
  title: string
  body: string
  publishedAt: string | null
  createdAt: string
  productId: number
  productName: string
}

interface Product {
  id: number
  name: string
}

export function AnnouncementsManager({ orgSlug }: { orgSlug: string }) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formProductId, setFormProductId] = useState<number | null>(null)
  const [formTitle, setFormTitle] = useState('')
  const [formBody, setFormBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [annRes, dashRes] = await Promise.all([
        fetch('/api/announcements'),
        fetch(`/api/dashboard/products/${orgSlug}`),
      ])
      if (annRes.ok) {
        const data = await annRes.json()
        setAnnouncements(data.announcements ?? [])
      }
      if (dashRes.ok) {
        const data = await dashRes.json()
        setProducts(data.products ?? [])
        if (data.products?.length > 0 && formProductId === null) {
          setFormProductId(data.products[0].id)
        }
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [orgSlug, formProductId])

  useEffect(() => { fetchData() }, [fetchData])

  async function handlePublish(e: React.FormEvent) {
    e.preventDefault()
    if (!formProductId || !formTitle.trim() || !formBody.trim()) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: formProductId, title: formTitle, body: formBody }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to publish')
      }
      setFormTitle('')
      setFormBody('')
      setShowForm(false)
      await fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Announcements</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Publish changelog-style posts for your claimed products.
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'New Announcement'}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardContent>
            <form onSubmit={handlePublish} className="space-y-4">
              <div>
                <Label className="mb-1 block">Product</Label>
                <select
                  value={formProductId ?? ''}
                  onChange={(e) => setFormProductId(Number(e.target.value))}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="mb-1 block">Title</Label>
                <Input
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. v2.1.0 — New dashboard"
                  required
                />
              </div>
              <div>
                <Label className="mb-1 block">Body</Label>
                <Textarea
                  rows={6}
                  value={formBody}
                  onChange={(e) => setFormBody(e.target.value)}
                  placeholder="What changed, why it matters, migration notes..."
                  required
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Publishing...' : 'Publish Announcement'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-radius-card border bg-card p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && announcements.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No announcements yet. Click &quot;New Announcement&quot; to publish your first one.
        </p>
      )}

      <div className="space-y-3">
        {announcements.map((a) => (
          <Card key={a.id}>
            <CardContent>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold">{a.title}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {a.productName} ·{' '}
                    {a.publishedAt
                      ? new Date(a.publishedAt).toLocaleDateString()
                      : 'Draft'}
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-foreground/80">
                    {a.body}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

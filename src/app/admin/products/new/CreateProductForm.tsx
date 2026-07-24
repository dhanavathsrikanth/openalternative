'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

interface GithubData {
  name: string
  description: string
  homepage: string
  license: string
  language: string
  stars: number
  forks: number
}

export function CreateProductForm() {
  const router = useRouter()

  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugEdited, setSlugEdited] = useState(false)
  const [description, setDescription] = useState('')
  const [githubUrl, setGithubUrl] = useState('')
  const [homepageUrl, setHomepageUrl] = useState('')
  const [license, setLicense] = useState('')
  const [primaryLanguage, setPrimaryLanguage] = useState('')
  const [saving, setSaving] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [fetchedData, setFetchedData] = useState<GithubData | null>(null)

  const handleNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newName = e.target.value
      setName(newName)
      if (!slugEdited) {
        setSlug(toSlug(newName))
      }
    },
    [slugEdited],
  )

  const handleSlugChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSlugEdited(true)
    setSlug(toSlug(e.target.value))
  }, [])

  async function handleFetchGithub() {
    const url = githubUrl.trim()
    if (!url) {
      setFeedback({ type: 'error', message: 'Enter a GitHub URL first' })
      return
    }

    setFetching(true)
    setFeedback(null)

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

      // Auto-fill form fields
      if (data.name && !name) setName(data.name)
      if (data.name && !slugEdited) setSlug(toSlug(data.name))
      if (data.description && !description) setDescription(data.description)
      if (data.homepage && !homepageUrl) setHomepageUrl(data.homepage)
      if (data.license && !license) setLicense(data.license)
      if (data.language && !primaryLanguage) setPrimaryLanguage(data.language)

      setFetchedData(data)
      setFeedback({ type: 'success', message: `Fetched: ${data.stars.toLocaleString()} stars, ${data.forks.toLocaleString()} forks` })
    } catch (err) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Failed to fetch' })
    } finally {
      setFetching(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setFeedback(null)

    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          slug: slug || undefined,
          description,
          githubUrl: githubUrl || undefined,
          homepageUrl: homepageUrl || undefined,
          license: license || undefined,
          primaryLanguage: primaryLanguage || undefined,
        }),
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(data?.error ?? `Request failed (${res.status})`)
      }

      setFeedback({ type: 'success', message: `Created — redirecting to /${data.product.slug}…` })
      setTimeout(() => router.push(`/admin/products/${data.product.id}`), 800)
    } catch (err) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Unexpected error' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-md border p-4">
      <div className="space-y-1.5">
        <label htmlFor="name" className="text-sm font-medium">
          Product Name <span className="text-destructive">*</span>
        </label>
        <Input
          id="name"
          value={name}
          onChange={handleNameChange}
          placeholder="e.g. Next.js"
          required
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="slug" className="text-sm font-medium">
          Slug
        </label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">/</span>
          <Input
            id="slug"
            value={slug}
            onChange={handleSlugChange}
            placeholder="auto-generated from name"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Auto-generated from the name. Edit to customize.
        </p>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="description" className="text-sm font-medium">
          Description
        </label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Short description of the product"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="githubUrl" className="text-sm font-medium">
            GitHub URL
          </label>
          <div className="flex gap-2">
            <Input
              id="githubUrl"
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
          {fetchedData && (
            <p className="text-xs text-muted-foreground">
              {fetchedData.stars.toLocaleString()} stars · {fetchedData.forks.toLocaleString()} forks · {fetchedData.license || 'No license'}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="homepageUrl" className="text-sm font-medium">
            Homepage URL
          </label>
          <Input
            id="homepageUrl"
            value={homepageUrl}
            onChange={(e) => setHomepageUrl(e.target.value)}
            placeholder="https://..."
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="license" className="text-sm font-medium">
            License
          </label>
          <Input
            id="license"
            value={license}
            onChange={(e) => setLicense(e.target.value)}
            placeholder="e.g. MIT"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="primaryLanguage" className="text-sm font-medium">
            Primary Language
          </label>
          <Input
            id="primaryLanguage"
            value={primaryLanguage}
            onChange={(e) => setPrimaryLanguage(e.target.value)}
            placeholder="e.g. TypeScript"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={saving || !name.trim()}>
          {saving ? 'Creating…' : 'Create Product'}
        </Button>
        {feedback && (
          <Badge variant={feedback.type === 'success' ? 'success' : 'destructive'}>
            {feedback.message}
          </Badge>
        )}
      </div>
    </form>
  )
}

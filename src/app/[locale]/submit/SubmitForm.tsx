'use client'

import { useState, useCallback } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useTranslations } from 'next-intl'
import Link from 'next/link'

interface Category { id: number; name: string }
interface Tag { id: number; name: string }

export function SubmitForm({ categories, tags }: { categories: Category[]; tags: Tag[] }) {
  const { isSignedIn } = useAuth()
  const tCommon = useTranslations('Common')
  const tSubmit = useTranslations('Submit')

  const [name, setName] = useState('')
  const [tagline, setTagline] = useState('')
  const [description, setDescription] = useState('')
  const [githubUrl, setGithubUrl] = useState('')
  const [homepageUrl, setHomepageUrl] = useState('')
  const [license, setLicense] = useState('')
  const [primaryLanguage, setPrimaryLanguage] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<number[]>([])
  const [selectedTags, setSelectedTags] = useState<number[]>([])

  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [success, setSuccess] = useState<string | null>(null)
  const [reviewFlags, setReviewFlags] = useState<string[]>([])

  const toggleCategory = useCallback((id: number) => {
    setSelectedCategories((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])
  }, [])

  const toggleTag = useCallback((id: number) => {
    setSelectedTags((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])
  }, [])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setErrors([])
    setSuccess(null)
    setReviewFlags([])

    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, tagline, description, githubUrl, homepageUrl,
          license, primaryLanguage,
          categoryIds: selectedCategories,
          tagIds: selectedTags,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setErrors(data.details ?? [data.error ?? tSubmit('form.networkError')])
        return
      }

      setSuccess(tSubmit('form.success'))
      if (data.reviewFlags?.length > 0) {
        setReviewFlags(data.reviewFlags)
      }
      setName('')
      setTagline('')
      setDescription('')
      setGithubUrl('')
      setHomepageUrl('')
      setLicense('')
      setPrimaryLanguage('')
      setSelectedCategories([])
      setSelectedTags([])
    } catch {
      setErrors([tSubmit('form.networkError')])
    } finally {
      setSubmitting(false)
    }
  }, [name, tagline, description, githubUrl, homepageUrl, license, primaryLanguage, selectedCategories, selectedTags, tSubmit])

  if (!isSignedIn) {
    return (
<main className="mx-auto max-w-3xl px-6 lg:px-8 py-12 pt-[var(--header-height)]">
        <nav className="mb-8 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">{tCommon('brand')}</Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">{tSubmit('heading')}</span>
        </nav>
        <h1 className="mb-4 text-3xl font-bold tracking-tight">{tSubmit('heading')}</h1>
        <p className="mb-8 text-muted-foreground">
          {tSubmit('authRequired.before')}{' '}
          <Link href="/contributor/sign-in" className="text-primary underline-offset-4 hover:underline">
            {tSubmit('authRequired.link')}
          </Link>{' '}
          {tSubmit('authRequired.after')}
        </p>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-3xl px-6 lg:px-8 py-12 pt-[var(--header-height)]">
      <nav className="mb-8 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">{tCommon('brand')}</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{tSubmit('heading')}</span>
      </nav>

      <h1 className="mb-2 text-3xl font-bold tracking-tight">{tSubmit('heading')}</h1>
      <p className="mb-8 text-muted-foreground">
        {tSubmit('description')}
      </p>

      {/* ── Submission Rules ─────────────────────────────────────────── */}
      <section className="mb-10 rounded-lg border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold">{tSubmit('guidelines.heading')}</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          {tSubmit('guidelines.intro')}
        </p>

        <div className="space-y-4 text-sm">
          <div>
            <h3 className="font-medium text-foreground">{tSubmit('guidelines.rule1.title')}</h3>
            <p className="mt-1 text-muted-foreground">
              {tSubmit('guidelines.rule1.description')}
            </p>
          </div>

          <div>
            <h3 className="font-medium text-foreground">{tSubmit('guidelines.rule2.title')}</h3>
            <p className="mt-1 text-muted-foreground">
              {tSubmit('guidelines.rule2.description')}
            </p>
          </div>

          <div>
            <h3 className="font-medium text-foreground">{tSubmit('guidelines.rule3.title')}</h3>
            <p className="mt-1 text-muted-foreground">
              {tSubmit('guidelines.rule3.description')}
            </p>
          </div>

          <div>
            <h3 className="font-medium text-foreground">{tSubmit('guidelines.rule4.title')}</h3>
            <p className="mt-1 text-muted-foreground">
              {tSubmit('guidelines.rule4.description')}
            </p>
          </div>

          <div>
            <h3 className="font-medium text-foreground">{tSubmit('guidelines.rule5.title')}</h3>
            <p className="mt-1 text-muted-foreground">
              {tSubmit('guidelines.rule5.description')}
            </p>
          </div>
        </div>
      </section>

      {/* ── Status messages ───────────────────────────────────────────── */}
      {errors.length > 0 && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="mb-2 text-sm font-medium text-red-800">{tSubmit('form.errorHeader')}</p>
          <ul className="list-disc space-y-1 pl-5 text-sm text-red-700">
            {errors.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        </div>
      )}
      {success && (
        <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4">
          <p className="text-sm font-medium text-green-800">{success}</p>
          {reviewFlags.length > 0 && (
            <div className="mt-2">
              <p className="text-sm text-green-700">{tSubmit('form.reviewFlags')}</p>
              <ul className="list-disc space-y-1 pl-5 text-sm text-amber-700">
                {reviewFlags.map((f, i) => <li key={i}>{f}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* ── Submission Form ──────────────────────────────────────────── */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-1.5">
          <label htmlFor="name" className="text-sm font-medium">{tSubmit('form.name')}</label>
          <input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={tSubmit('form.namePlaceholder')}
            className="h-9 w-full rounded-md border bg-transparent px-3 text-sm"
            required
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="tagline" className="text-sm font-medium">{tSubmit('form.tagline')} <span className="text-muted-foreground font-normal">{tSubmit('form.taglineMax')}</span></label>
          <input
            id="tagline"
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            placeholder={tSubmit('form.taglinePlaceholder')}
            maxLength={80}
            className="h-9 w-full rounded-md border bg-transparent px-3 text-sm"
            required
          />
          <p className="text-xs text-muted-foreground">{tagline.length}/80</p>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="description" className="text-sm font-medium">{tSubmit('form.description')} <span className="text-muted-foreground font-normal">{tSubmit('form.descriptionMax')}</span></label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={tSubmit('form.descriptionPlaceholder')}
            maxLength={200}
            rows={3}
            className="w-full rounded-md border bg-transparent px-3 py-2 text-sm"
            required
          />
          <p className="text-xs text-muted-foreground">{description.length}/200</p>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="githubUrl" className="text-sm font-medium">{tSubmit('form.repository')}</label>
          <input
            id="githubUrl"
            value={githubUrl}
            onChange={(e) => setGithubUrl(e.target.value)}
            placeholder={tSubmit('form.repositoryPlaceholder')}
            className="h-9 w-full rounded-md border bg-transparent px-3 text-sm"
            required
          />
          <p className="text-xs text-muted-foreground">
            {tSubmit('form.repositoryHelper')}
          </p>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="homepageUrl" className="text-sm font-medium">{tSubmit('form.homepage')} <span className="text-muted-foreground font-normal">{tSubmit('form.homepageRequired')}</span></label>
          <input
            id="homepageUrl"
            value={homepageUrl}
            onChange={(e) => setHomepageUrl(e.target.value)}
            placeholder={tSubmit('form.homepagePlaceholder')}
            className="h-9 w-full rounded-md border bg-transparent px-3 text-sm"
          />
          <p className="text-xs text-muted-foreground">
            {tSubmit('form.homepageHelper')}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="license" className="text-sm font-medium">{tSubmit('form.license')}</label>
            <input
              id="license"
              value={license}
              onChange={(e) => setLicense(e.target.value)}
              placeholder={tSubmit('form.licensePlaceholder')}
              className="h-9 w-full rounded-md border bg-transparent px-3 text-sm"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="primaryLanguage" className="text-sm font-medium">{tSubmit('form.language')} <span className="text-muted-foreground font-normal">{tSubmit('form.languageRequired')}</span></label>
            <input
              id="primaryLanguage"
              value={primaryLanguage}
              onChange={(e) => setPrimaryLanguage(e.target.value)}
              placeholder={tSubmit('form.languagePlaceholder')}
              className="h-9 w-full rounded-md border bg-transparent px-3 text-sm"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">{tSubmit('form.categories')} <span className="text-muted-foreground font-normal">{tSubmit('form.categoriesHelper')}</span></label>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => toggleCategory(cat.id)}
                className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  selectedCategories.includes(cat.id)
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-transparent text-muted-foreground hover:bg-muted'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Tags */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">{tSubmit('form.tags')} <span className="text-muted-foreground font-normal">{tSubmit('form.tagsHelper')}</span></label>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggleTag(tag.id)}
                className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  selectedTags.includes(tag.id)
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-transparent text-muted-foreground hover:bg-muted'
                }`}
              >
                #{tag.name}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? tSubmit('form.submitting') : tSubmit('form.submit')}
        </button>
      </form>
    </main>
  )
}

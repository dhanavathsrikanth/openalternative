'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { Product } from '@/app/db/schema'
import posthog from 'posthog-js'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'

const reportReasonSchema = z.enum(['broken_link', 'wrong_category', 'outdated', 'other'])

const reportSchema = z.object({
  reason: reportReasonSchema,
  detail: z.string().optional(),
})

type ReportInput = z.infer<typeof reportSchema>

interface Props {
  product: Product
}

export function ReportForm({ product }: Props) {
  const t = useTranslations('Product.report')
  const [submitted, setSubmitted] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const REASON_LABELS: Record<string, string> = {
    broken_link: t('reason.brokenLink'),
    wrong_category: t('reason.wrongCategory'),
    outdated: t('reason.outdated'),
    other: t('reason.other'),
  }

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ReportInput>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      reason: 'broken_link',
      detail: '',
    },
  })

  async function onSubmit(data: ReportInput) {
    setServerError(null)

    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          reason: data.reason,
          detail: data.detail || undefined,
        }),
      })

      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error ?? t('submitError'))
      }

      posthog.capture('product_report_submitted', {
        product_id: product.id,
        product_slug: product.slug,
        reason: data.reason,
        has_detail: Boolean(data.detail),
      })

      setSubmitted(true)
    } catch (err) {
      setServerError(err instanceof Error ? err.message : t('error'))
    }
  }

  if (submitted) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <svg
              className="mx-auto h-12 w-12 text-success"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <h2 className="mt-4 text-body-lg font-display font-semibold">{t('thanks')}</h2>
            <p className="mt-2 text-body-sm text-muted-foreground">
              {t('thanksBody')}
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-4"
              onClick={() => setSubmitted(false)}
            >
              {t('submitAnother')}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent>
        <h2 className="mb-4 text-body-lg font-display font-semibold">{t('heading')}</h2>
        <p className="mb-4 text-body-sm text-muted-foreground">
          {t('description')}
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label className="mb-1 block">{t('issueLabel')} <span className="text-destructive">*</span></Label>
            <Select onValueChange={register('reason')} defaultValue="broken_link">
              <SelectTrigger>
                <SelectValue placeholder={t('selectReason')} />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(REASON_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.reason && (
              <p className="mt-1 text-body-xs text-destructive">{errors.reason.message}</p>
            )}
          </div>

          <div>
            <Label className="mb-1 block">{t('detailsLabel')}</Label>
            <Textarea
              rows={3}
              placeholder={t('detailsPlaceholder')}
              {...register('detail')}
            />
          </div>

          {serverError && (
            <Alert variant="destructive">
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? t('submitting') : t('submit')}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

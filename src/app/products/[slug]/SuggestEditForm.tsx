'use client'

import { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { Product } from '@/app/db/schema'
import posthog from 'posthog-js'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

const suggestEditSchema = z.object({
  changes: z.array(
    z.object({
      field: z.string(),
      value: z.string(),
    }),
  ),
  sourceUrl: z.string().url('Invalid source URL').min(1, 'Source URL is required'),
})

type SuggestEditInput = z.infer<typeof suggestEditSchema>

interface Props {
  product: Product
}

export function SuggestEditForm({ product }: Props) {
  const [submitted, setSubmitted] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<SuggestEditInput>({
    resolver: zodResolver(suggestEditSchema),
    defaultValues: {
      changes: [
        { field: 'description', value: product.description },
        { field: 'license', value: product.license ?? '' },
        { field: 'homepageUrl', value: product.homepageUrl ?? '' },
      ],
      sourceUrl: '',
    },
  })

  const { fields } = useFieldArray({ control, name: 'changes' })

  async function onSubmit(data: SuggestEditInput) {
    setServerError(null)

    try {
      const res = await fetch('/api/contributions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          changes: data.changes.filter((c) => c.value !== ''),
          sourceUrl: data.sourceUrl,
        }),
      })

      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error ?? 'Failed to submit')
      }

      posthog.capture('product_edit_suggested', {
        product_id: product.id,
        product_slug: product.slug,
        fields_changed: data.changes.filter((c) => c.value !== '').map((c) => c.field),
      })
      setSubmitted(true)
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Something went wrong')
    }
  }

  if (submitted) {
    return (
      <Card>
        <CardContent>
          <h2 className="text-lg font-semibold">Thank you!</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Your suggestion has been submitted for review. A moderator will review it shortly.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent>
        <h2 className="mb-4 text-lg font-semibold">Suggest an Edit</h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-3">
            {fields.map((field, i) => (
              <div key={field.id}>
                <Label className="mb-1 block capitalize">
                  {field.field}
                </Label>
                {field.field === 'description' ? (
                  <Textarea
                    rows={3}
                    {...register(`changes.${i}.value`)}
                  />
                ) : (
                  <Input
                    type="text"
                    {...register(`changes.${i}.value`)}
                  />
                )}
                <input type="hidden" {...register(`changes.${i}.field`)} />
              </div>
            ))}
          </div>

          <div>
            <Label className="mb-1 block">
              Source URL <span className="text-destructive">*</span>
            </Label>
            <Input
              type="url"
              placeholder="https://github.com/..."
              {...register('sourceUrl')}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Link to evidence supporting your edit (GitHub issue, docs page, etc.)
            </p>
            {errors.sourceUrl && (
              <p className="mt-1 text-xs text-destructive">{errors.sourceUrl.message}</p>
            )}
          </div>

          {serverError && (
            <p className="text-sm text-destructive">{serverError}</p>
          )}

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit Suggestion'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { SortOption } from '@/lib/sort'

interface Props {
  options: SortOption[]
  currentSort: string
}

export function SortControl({ options, currentSort }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleChange = useCallback(
    (value: string | null) => {
      if (!value) return
      const next = new URLSearchParams(searchParams.toString())
      if (value === options[0]?.value) {
        next.delete('sort')
      } else {
        next.set('sort', value)
      }
      router.push(`?${next.toString()}`, { scroll: false })
    },
    [router, searchParams, options],
  )

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="sort-select" className="text-sm text-muted-foreground whitespace-nowrap">
        Sort by
      </label>
      <Select value={currentSort} onValueChange={handleChange}>
        <SelectTrigger id="sort-select" className="w-auto min-w-[10rem]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

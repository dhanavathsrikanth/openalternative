'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

type Props = {
  code: string
  language?: string
  /** If true, shows a red "needs review" badge */
  needsReview?: boolean
  /** If true, shows a green "extracted" badge */
  extracted?: boolean
  /** Optional label above the code block */
  label?: string
}

export function CodeBlock({ code, language = 'bash', needsReview, extracted, label }: Props) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="rounded-md border overflow-hidden">
      {(label || needsReview !== undefined || extracted !== undefined) && (
        <div className="flex items-center justify-between gap-2 border-b bg-muted/50 px-3 py-1.5">
          <div className="flex items-center gap-2 min-w-0">
            {label && (
              <span className="text-xs font-medium text-muted-foreground truncate">{label}</span>
            )}
            {extracted !== undefined && (
              <Badge
                variant="outline"
                className={extracted
                  ? 'border-green-300 text-green-700 dark:border-green-700 dark:text-green-300'
                  : 'border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-300'
                }
              >
                {extracted ? 'extracted' : 'generated'}
              </Badge>
            )}
            {needsReview && (
              <Badge variant="destructive" className="text-[10px]">
                needs technical review
              </Badge>
            )}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs shrink-0"
            onClick={handleCopy}
          >
            {copied ? 'Copied!' : 'Copy'}
          </Button>
        </div>
      )}
      <pre className="overflow-x-auto p-3 text-xs leading-relaxed font-mono bg-card">
        <code>{code}</code>
      </pre>
    </div>
  )
}

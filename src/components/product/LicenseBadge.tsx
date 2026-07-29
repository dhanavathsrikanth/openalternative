import { useTranslations } from 'next-intl'
import { Badge, type BadgeProps } from '@/components/ui/badge'

/** Permissive licenses (no copyleft obligations). */
const PERMISSIVE = new Set(['MIT', 'ISC', 'Apache-2.0', 'BSD-2-Clause', 'BSD-3-Clause'])
/** Copyleft / strong copyleft licenses — review terms before adopting. */
const COPYLEFT = new Set(['GPL-3.0', 'AGPL-3.0', 'LGPL-3.0', 'MPL-2.0'])

/** Friendlier display labels for common SPDX identifiers. */
const LABELS: Record<string, string> = {
  'Apache-2.0': 'Apache 2.0',
}

interface Props {
  license: string
  variant?: BadgeProps['variant']
  className?: string
}

export function LicenseBadge({ license, variant, className }: Props) {
  const t = useTranslations('Product')

  const resolvedVariant: BadgeProps['variant'] =
    variant ?? (PERMISSIVE.has(license)
      ? 'success'
      : COPYLEFT.has(license)
        ? 'warning'
        : 'secondary')

  const isPermissive = PERMISSIVE.has(license)
  const label = LABELS[license] ?? license

  return (
    <Badge
      variant={resolvedVariant}
      className={className ? `gap-1.5 ${className}` : 'gap-1.5'}
      title={isPermissive ? t('license.permissive') : t('license.reviewTerms')}
    >
      <svg
        className="size-3"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <path d="M9 12l2 2 4-4" />
        <rect x="3" y="3" width="18" height="18" rx="2" />
      </svg>
      {label}
    </Badge>
  )
}

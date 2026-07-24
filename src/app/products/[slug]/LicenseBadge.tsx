const LICENSE_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  MIT: { bg: 'bg-green-100', text: 'text-green-800', label: 'MIT' },
  'Apache-2.0': { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Apache 2.0' },
  ISC: { bg: 'bg-green-100', text: 'text-green-800', label: 'ISC' },
  'BSD-2-Clause': { bg: 'bg-sky-100', text: 'text-sky-800', label: 'BSD-2-Clause' },
  'BSD-3-Clause': { bg: 'bg-sky-100', text: 'text-sky-800', label: 'BSD-3-Clause' },
  'LGPL-3.0': { bg: 'bg-amber-100', text: 'text-amber-800', label: 'LGPL-3.0' },
  'MPL-2.0': { bg: 'bg-amber-100', text: 'text-amber-800', label: 'MPL-2.0' },
  'GPL-3.0': { bg: 'bg-red-100', text: 'text-red-800', label: 'GPL-3.0' },
  'AGPL-3.0': { bg: 'bg-red-100', text: 'text-red-800', label: 'AGPL-3.0' },
}

const PERMISSIVE = new Set(['MIT', 'ISC', 'Apache-2.0', 'BSD-2-Clause', 'BSD-3-Clause'])

interface Props {
  license: string
}

export function LicenseBadge({ license }: Props) {
  const style = LICENSE_STYLES[license] ?? {
    bg: 'bg-gray-100',
    text: 'text-gray-800',
    label: license,
  }
  const isPermissive = PERMISSIVE.has(license)

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-xs font-medium ${style.bg} ${style.text}`}
      title={isPermissive ? 'Permissive license — compatible with most projects' : 'Review license terms before adopting'}
    >
      <svg className="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 12l2 2 4-4" />
        <rect x="3" y="3" width="18" height="18" rx="2" />
      </svg>
      {style.label}
    </span>
  )
}

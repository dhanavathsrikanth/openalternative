import Link from 'next/link'
import { cn } from '@/lib/utils'

interface Props {
  icon?: React.ReactNode
  title: string
  description: string
  action?: {
    label: string
    href: string
  }
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: Props) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-dashed px-6 py-16 text-center',
        className
      )}
    >
      {icon && (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      {action && (
        <Link
          href={action.href}
          className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
        >
          {action.label}
        </Link>
      )}
    </div>
  )
}

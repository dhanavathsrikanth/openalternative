import { cn } from '@/lib/utils'

interface Props {
  number: string
  label: string
  className?: string
}

export function SectionHeading({ number, label, className }: Props) {
  return (
    <h2 className={cn('mb-4 text-sm font-medium uppercase tracking-wider text-muted-foreground', className)}>
      {number} &middot; {label}
    </h2>
  )
}

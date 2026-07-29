import { cn } from '@/lib/utils'

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export function ProductCard({ className, children, ...props }: Props) {
  return (
    <div
      className={cn(
        'rounded-radius-card border border-border-default bg-surface-raised p-5 shadow-elevation-1',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-radius-badge bg-surface-raised",
        "after:absolute after:inset-0 after:-translate-x-full",
        "after:bg-gradient-to-r after:from-transparent after:via-white/20 after:to-transparent",
        "after:animate-shimmer",
        "dark:after:via-white/10",
        "animate-pulse-skeleton",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }

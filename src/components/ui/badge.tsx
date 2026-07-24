import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-radius-badge border border-transparent px-1.5 py-0.5 text-body-xs font-medium whitespace-nowrap transition-colors duration-fast ease-out focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "bg-brand text-brand-foreground hover:opacity-90",
        secondary:
          "bg-surface-raised text-text-secondary hover:bg-surface-overlay",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-text-primary border-border-default",
        success:
          "bg-success text-success-foreground",
        warning:
          "bg-warning text-warning-foreground",
        info:
          "bg-info text-info-foreground",
        pill:
          "bg-border/50 text-text-secondary rounded-sm hover:bg-border/75",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }

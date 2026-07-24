import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({
  className,
  ...props
}: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-16 w-full rounded-radius-input border-0 bg-surface px-4 py-2.5 text-body-sm text-text-primary shadow-elevation-1 placeholder:text-text-tertiary transition-[color,box-shadow] duration-normal ease-out focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand/60 disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }

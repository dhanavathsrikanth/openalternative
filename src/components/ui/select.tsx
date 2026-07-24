"use client"

import * as React from "react"
import { Select as SelectPrimitive } from "@base-ui/react/select"

import { cn } from "@/lib/utils"
import { ChevronDownIcon, CheckIcon } from "lucide-react"

function Select({ ...props }: SelectPrimitive.Root.Props) {
  return <SelectPrimitive.Root data-slot="select" {...props} />
}

function SelectTrigger({
  className,
  children,
  ...props
}: SelectPrimitive.Trigger.Props) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      className={cn(
        "flex min-h-0 w-auto min-w-36 items-center justify-between gap-1 border border-border-default bg-surface px-4 py-2.5 text-body-sm text-text-primary shadow-elevation-1 rounded-radius-input transition-[color,background-color,border-color,box-shadow] duration-normal ease-out outline-transparent cursor-pointer hover:border-ring focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand/60 disabled:cursor-not-allowed disabled:opacity-50 data-placeholder:text-text-tertiary max-sm:flex-1",
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon className="shrink-0 text-text-tertiary">
        <ChevronDownIcon className="size-4" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
}

function SelectValue({
  className,
  placeholder,
  ...props
}: SelectPrimitive.Value.Props) {
  return (
    <SelectPrimitive.Value
      data-slot="select-value"
      className={cn("truncate", className)}
      placeholder={placeholder}
      {...props}
    />
  )
}

function SelectContent({
  className,
  children,
  ...props
}: SelectPrimitive.Popup.Props) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Popup
        data-slot="select-content"
        className={cn(
          "z-50 max-h-80 overflow-auto rounded-radius-card border border-border-default bg-surface-overlay p-1 shadow-elevation-3 text-body-sm text-text-primary data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0",
          className
        )}
        {...props}
      >
        {children}
      </SelectPrimitive.Popup>
    </SelectPrimitive.Portal>
  )
}

function SelectItem({
  className,
  children,
  ...props
}: SelectPrimitive.Item.Props) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "flex cursor-pointer items-center gap-2 rounded-radius-button px-3 py-2 text-body-sm outline-transparent select-none data-[highlighted]:bg-surface-raised data-[highlighted]:text-text-primary data-[disabled]:opacity-50",
        className
      )}
      {...props}
    >
      <SelectPrimitive.ItemIndicator className="size-4 shrink-0">
        <CheckIcon className="size-4" />
      </SelectPrimitive.ItemIndicator>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
}

function SelectLabel({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="select-label"
      className={cn("px-3 py-1.5 text-body-xs font-medium text-text-tertiary", className)}
      {...props}
    />
  )
}

function SelectSeparator({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="select-separator"
      className={cn("my-1 h-px bg-border-subtle", className)}
      {...props}
    />
  )
}

export {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectSeparator,
}

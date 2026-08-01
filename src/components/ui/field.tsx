import * as React from "react"

import { cn } from "#/lib/utils.ts"

/** Vertical stack of Fields. */
function FieldGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="field-group"
      className={cn("flex flex-col gap-5", className)}
      {...props}
    />
  )
}

function Field({
  className,
  disabled,
  ...props
}: React.ComponentProps<"div"> & { disabled?: boolean }) {
  return (
    <div
      data-slot="field"
      data-disabled={disabled || undefined}
      className={cn("group/field flex flex-col gap-2", className)}
      {...props}
    />
  )
}

/**
 * When a FieldLabel wraps a whole field (a selectable card, say), checking it
 * tints the surface rather than only marking the control.
 */
function FieldLabel({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      data-slot="field-label"
      className={cn(
        "flex items-center gap-2 text-sm leading-none font-medium select-none",
        "group-data-[disabled=true]/field:opacity-50",
        "has-[[data-slot=field]]:rounded-lg has-[[data-slot=field]]:border has-[[data-slot=field]]:p-4",
        "has-[[data-slot=field]]:has-[[data-state=checked]]:border-primary/30 has-[[data-slot=field]]:has-[[data-state=checked]]:bg-primary/5",
        className
      )}
      {...props}
    />
  )
}

function FieldDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="field-description"
      className={cn("text-xs text-muted-foreground", className)}
      {...props}
    />
  )
}

function FieldError({ className, children, ...props }: React.ComponentProps<"p">) {
  if (!children) return null
  return (
    <p
      data-slot="field-error"
      role="alert"
      className={cn("text-sm text-destructive", className)}
      {...props}
    >
      {children}
    </p>
  )
}

export { FieldGroup, Field, FieldLabel, FieldDescription, FieldError }

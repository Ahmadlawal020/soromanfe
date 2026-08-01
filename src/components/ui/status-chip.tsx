import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "#/lib/utils"

/**
 * Outlined, never filled. The house way of showing state.
 *
 * Tones follow the system's colour semantics:
 *   accent       live / best / current / done
 *   warning      pending / price-lock / worse-than-best  (amber, the one
 *                off-token colour in the system)
 *   destructive  errors
 *   inert        not-yet / absent
 *
 * Sits at 0.6rem by default; 0.65rem when it sits in a panel header rail.
 */
const statusChipVariants = cva(
  "inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 tracking-[0.14em] whitespace-nowrap uppercase [&>svg]:size-3",
  {
    variants: {
      tone: {
        accent: "border-accent/40 text-accent",
        warning: "border-warning/40 text-warning",
        destructive: "border-destructive/40 text-destructive",
        inert: "border-foreground/15 text-muted-foreground/60",
      },
      size: {
        default: "text-[0.6rem]",
        rail: "text-[0.65rem]",
      },
    },
    defaultVariants: {
      tone: "accent",
      size: "default",
    },
  },
)

function StatusChip({
  className,
  tone,
  size,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof statusChipVariants>) {
  return (
    <span
      data-slot="status-chip"
      className={cn(statusChipVariants({ tone, size, className }))}
      {...props}
    />
  )
}

/**
 * The live indicator. Paused state swaps the fill for a ring so the dot still
 * occupies its space without reading as active.
 */
function LiveDot({
  paused = false,
  className,
  ...props
}: React.ComponentProps<"span"> & { paused?: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "size-2 shrink-0 rounded-full",
        paused
          ? "bg-transparent text-muted-foreground shadow-[inset_0_0_0_1.5px_currentColor]"
          : "live-dot bg-accent",
        className,
      )}
      {...props}
    />
  )
}

export { StatusChip, LiveDot, statusChipVariants }

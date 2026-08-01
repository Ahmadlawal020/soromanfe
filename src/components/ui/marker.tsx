import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "#/lib/utils.ts"

/**
 * A quiet list-item row.
 *
 * The `separator` variant draws hairlines that flank centred text — used for
 * "or", date dividers in a feed, and section breaks inside a panel.
 */
const markerVariants = cva("text-sm text-muted-foreground", {
  variants: {
    variant: {
      default: "flex items-center gap-2 [&_svg]:size-3.5 [&_svg]:shrink-0",
      separator:
        "flex items-center gap-3 text-xs before:h-px before:flex-1 before:bg-border before:content-[''] after:h-px after:flex-1 after:bg-border after:content-['']",
    },
  },
  defaultVariants: {
    variant: "default",
  },
})

function Marker({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof markerVariants>) {
  return (
    <div
      data-slot="marker"
      className={cn(markerVariants({ variant, className }))}
      {...props}
    />
  )
}

export { Marker, markerVariants }

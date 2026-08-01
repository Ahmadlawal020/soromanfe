import * as React from "react"

import { cn } from "#/lib/utils.ts"

/** Same skin as Input, plus intrinsic content sizing. */
function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "field-sizing-content min-h-16 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-base",
        "transition-colors outline-none placeholder:text-muted-foreground duration-250 ease-luxe",
        "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50",
        "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
        "md:text-sm dark:bg-input/30 dark:disabled:bg-input/80",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }

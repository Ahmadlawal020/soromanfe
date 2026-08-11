import * as React from "react"

import { cn } from "#/lib/utils.ts"

/**
 * text-base below md is deliberate — it stops iOS Safari zooming on focus.
 * Never set text-sm unconditionally here.
 */
function Input({ className, type, onWheel, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      onWheel={(e) => {
        if (type === "number") {
          e.currentTarget.blur()
        }
        onWheel?.(e)
      }}
      className={cn(
        "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base",
        "transition-colors outline-none placeholder:text-muted-foreground duration-250 ease-luxe",
        "selection:bg-primary selection:text-primary-foreground",
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-normal",
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

/**
 * The sturdier field treatment, with a different focus signature: a thin
 * accent ring instead of the fat neutral one. Reserved for checkout-style
 * flows (the order wizard), not general forms.
 *
 * Placeholders drop to /50 so an example value never reads as a filled one.
 */
function BoxedInput({ className, type, onWheel, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="boxed-input"
      onWheel={(e) => {
        if (type === "number") {
          e.currentTarget.blur()
        }
        onWheel?.(e)
      }}
      className={cn(
        "h-11 w-full min-w-0 rounded-lg border border-input bg-transparent px-3.5 text-base",
        "transition-colors outline-none placeholder:text-muted-foreground/50 duration-250 ease-luxe",
        "hover:border-foreground/40",
        "focus-visible:border-accent focus-visible:ring-1 focus-visible:ring-accent/30",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50",
        "aria-invalid:border-destructive aria-invalid:ring-1 aria-invalid:ring-destructive/20",
        "md:text-sm dark:bg-input/30",
        className
      )}
      {...props}
    />
  )
}

export { Input, BoxedInput }

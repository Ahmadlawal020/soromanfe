import * as React from "react"
import { ChevronDownIcon } from "lucide-react"

import { cn } from "#/lib/utils.ts"

/**
 * Native <select> by design — it keeps the phone's wheel picker for drivers on
 * handsets, and it can't be clipped by a page-drawn popup the way a rendered
 * listbox can.
 *
 * className lands on the wrapper, so styling the control itself has to reach
 * through with [&>select].
 */
function NativeSelect({
  className,
  children,
  ...props
}: React.ComponentProps<"select">) {
  return (
    <div data-slot="native-select" className={cn("relative w-full", className)}>
      <select
        className={cn(
          "h-8 w-full appearance-none rounded-lg border border-input bg-transparent py-1 pr-8 pl-2.5 text-base",
          "transition-colors outline-none duration-250 ease-luxe",
          "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
          "disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50",
          "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
          "md:text-sm dark:bg-input/30"
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDownIcon
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 opacity-50"
      />
    </div>
  )
}

/**
 * The checkout-flow field treatment: taller, and with the thin accent focus
 * ring instead of the fat neutral one.
 */
function BoxedSelect({
  className,
  children,
  ...props
}: React.ComponentProps<"select">) {
  return (
    <div data-slot="boxed-select" className={cn("relative w-full", className)}>
      <select
        className={cn(
          "h-11 w-full appearance-none rounded-lg border border-input bg-transparent pr-10 pl-3.5 text-base",
          "transition-colors duration-300 ease-luxe outline-none",
          "hover:border-foreground/40",
          "focus-visible:border-accent focus-visible:ring-1 focus-visible:ring-accent/30",
          "disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50",
          "aria-invalid:border-destructive aria-invalid:ring-1 aria-invalid:ring-destructive/20",
          "md:text-sm dark:bg-input/30"
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDownIcon
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 opacity-50"
      />
    </div>
  )
}

export { NativeSelect, BoxedSelect }

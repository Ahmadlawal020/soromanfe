import * as React from "react"
import { Link } from "@tanstack/react-router"

import { cn } from "#/lib/utils.ts"

/**
 * The recurring "go deeper" affordance. The arrow nudges on hover — and on
 * focus too, so keyboard users get the same signal.
 */
function HoverArrowLink({
  className,
  children,
  ...props
}: Omit<React.ComponentProps<typeof Link>, "children"> & {
  children?: React.ReactNode
}) {
  return (
    <Link
      className={cn(
        "group inline-flex items-center text-xs whitespace-nowrap text-accent outline-none focus-visible:underline focus-visible:underline-offset-4",
        className
      )}
      {...props}
    >
      {children}
      <span
        aria-hidden
        className="ml-1 inline-block transition-transform duration-220 ease-luxe group-hover:translate-x-0.5 group-focus-visible:translate-x-0.5"
      >
        →
      </span>
    </Link>
  )
}

export { HoverArrowLink }

import * as React from "react"

import { cn } from "#/lib/utils.ts"

/**
 * The empty state. Copy here is plain and second-person and never hedges —
 * "Nothing in motion. Ready when you are." rather than "No data available".
 */
function Empty({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="empty"
      className={cn(
        "flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-foreground/15 p-6 text-center text-balance",
        className
      )}
      {...props}
    />
  )
}

function EmptyMedia({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="empty-media"
      className={cn(
        "flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground [&_svg]:size-4",
        className
      )}
      {...props}
    />
  )
}

function EmptyHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="empty-header"
      className={cn("flex flex-col items-center gap-1", className)}
      {...props}
    />
  )
}

function EmptyTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="empty-title"
      className={cn("text-sm font-normal", className)}
      {...props}
    />
  )
}

function EmptyDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="empty-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

function EmptyContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="empty-content"
      className={cn("flex items-center gap-2", className)}
      {...props}
    />
  )
}

export {
  Empty,
  EmptyMedia,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
}

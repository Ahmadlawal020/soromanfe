import * as React from "react"

import { cn } from "#/lib/utils.ts"

/**
 * A field with addons. The focus and invalid states are hoisted to the group
 * so the ring wraps the whole control rather than just the <input>; the inner
 * control strips its own border and ring to avoid drawing them twice.
 */
function InputGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="input-group"
      className={cn(
        "flex h-8 w-full items-center gap-1.5 rounded-lg border border-input px-2.5 transition-colors duration-250 ease-luxe",
        "has-[[data-slot=input-group-control]:focus-visible]:border-ring has-[[data-slot=input-group-control]:focus-visible]:ring-3 has-[[data-slot=input-group-control]:focus-visible]:ring-ring/50",
        "has-[[data-slot=input-group-control][aria-invalid=true]]:border-destructive has-[[data-slot=input-group-control][aria-invalid=true]]:ring-3 has-[[data-slot=input-group-control][aria-invalid=true]]:ring-destructive/20",
        "has-[[data-slot=input-group-control]:disabled]:pointer-events-none has-[[data-slot=input-group-control]:disabled]:bg-input/50 has-[[data-slot=input-group-control]:disabled]:opacity-50",
        "dark:bg-input/30",
        className
      )}
      {...props}
    />
  )
}

/** The bare control — the group owns the chrome. */
function InputGroupInput({
  className,
  type,
  ...props
}: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input-group-control"
      className={cn(
        "h-full w-full min-w-0 flex-1 border-0 bg-transparent p-0 text-base outline-none placeholder:text-muted-foreground",
        "disabled:cursor-not-allowed md:text-sm",
        className
      )}
      {...props}
    />
  )
}

function InputGroupAddon({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="input-group-addon"
      className={cn(
        "flex shrink-0 items-center gap-1.5 text-sm text-muted-foreground [&_svg]:size-4 [&_svg]:shrink-0",
        className
      )}
      {...props}
    />
  )
}

export { InputGroup, InputGroupInput, InputGroupAddon }

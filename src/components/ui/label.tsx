import * as React from "react"

import { cn } from "#/lib/utils.ts"

function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      data-slot="label"
      className={cn(
        "flex items-center gap-2 text-sm leading-none font-normal select-none",
        "peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
        "group-data-[disabled=true]/field:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Label }

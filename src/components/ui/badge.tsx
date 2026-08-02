import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "@radix-ui/react-slot"

import { cn } from "#/lib/utils.ts"

const badgeVariants = cva(
  [
    "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden",
    "rounded-4xl border border-transparent px-2 py-0.5 text-xs font-normal whitespace-nowrap",
    "transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 duration-250 ease-luxe",
    "aria-invalid:border-destructive aria-invalid:ring-destructive/20",
    "[&>svg]:pointer-events-none [&>svg]:size-3!",
  ],
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [a&]:hover:bg-primary/80",
        secondary:
          "bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/80",
        outline: "border-border text-foreground [a&]:hover:bg-muted",
        // Tinted, matching the Button.
        destructive:
          "bg-destructive/10 text-destructive [a&]:hover:bg-destructive/20 dark:bg-destructive/15",
        ghost: "[a&]:hover:bg-muted [a&]:hover:text-foreground",
        link: "text-primary underline-offset-4 [a&]:hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }

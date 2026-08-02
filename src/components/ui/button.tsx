import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "@radix-ui/react-slot"

import { cn } from "#/lib/utils.ts"

/**
 * Two conventions carried over from the design system:
 *
 * 1. Icon side padding is declared on the icon, not the button:
 *      <MessageCircle data-icon="inline-start" />
 *    triggers has-data-[icon=inline-start]:pl-2.
 *
 * 2. Press feedback is a 1px downward nudge, suppressed on menu triggers so
 *    popover anchors don't jump as they open.
 *
 * Polymorphism is Radix's `asChild`, not Base UI's `render`/`nativeButton`:
 *      <Button asChild><Link to="/x">Label</Link></Button>
 */
const buttonVariants = cva(
  [
    "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent",
    "bg-clip-padding text-sm font-normal whitespace-nowrap transition-all outline-none select-none duration-250 ease-luxe",
    "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
    "active:not-aria-[haspopup]:translate-y-px",
    "disabled:pointer-events-none disabled:opacity-50",
    "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
    "dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
    "has-data-[icon=inline-start]:pl-2 has-data-[icon=inline-end]:pr-2",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ],
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/80",
        outline:
          "border-border bg-background hover:bg-muted hover:text-foreground aria-expanded:bg-muted dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)]",
        ghost: "hover:bg-muted hover:text-foreground dark:hover:bg-muted/50",
        // Tinted, never solid red.
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive focus-visible:ring-destructive/20 dark:bg-destructive/15 dark:hover:bg-destructive/25",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-sm [&_svg:not([class*='size-'])]:size-3.5",
        default: "h-8 gap-1.5 px-2.5",
        lg: "h-9 gap-1.5 px-2.5",
        icon: "size-8",
        "icon-xs": "size-6 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-7 [&_svg:not([class*='size-'])]:size-3.5",
        "icon-lg": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  type = "button",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      type={asChild ? undefined : type}
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "#/lib/utils.ts"

/**
 * The shadcn primitive: a **ring**, and no shadow.
 *
 * Do not conflate this with PANEL (lib/panel.ts), the app's editorial section
 * card, which uses a border + soft shadow and a fixed header/body/footer rail
 * anatomy. Mixing the two treatments looks wrong.
 *
 * Use Card for generic content blocks; use PANEL for the dashboard's own
 * sections.
 */
const cardVariants = cva(
  "flex flex-col rounded-xl bg-card py-(--card-spacing) text-card-foreground ring-1 ring-foreground/10",
  {
    variants: {
      size: {
        default: "gap-4 [--card-spacing:--spacing(4)]",
        sm: "gap-3 [--card-spacing:--spacing(3)]",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

function Card({
  className,
  size,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof cardVariants>) {
  return (
    <div
      data-slot="card"
      className={cn(cardVariants({ size, className }))}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1 px-(--card-spacing) has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-(--card-spacing)",
        className
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("text-base leading-snug font-medium", className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-(--card-spacing)", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "flex items-center rounded-b-xl p-(--card-spacing) [.border-t]:bg-muted/50 [.border-t]:pt-(--card-spacing)",
        className
      )}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
  cardVariants,
}

"use client"

import * as React from "react"
import { Avatar as AvatarPrimitive } from "radix-ui"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "#/lib/utils.ts"

/**
 * The hairline ring is drawn with an `after:` overlay using mix-blend rather
 * than a border, so it darkens light images and lightens dark ones instead of
 * stamping a flat line over both.
 */
const avatarVariants = cva(
  "relative flex shrink-0 overflow-hidden rounded-full after:absolute after:inset-0 after:rounded-full after:border after:border-border after:mix-blend-darken after:content-[''] dark:after:mix-blend-lighten",
  {
    variants: {
      size: {
        sm: "size-6",
        default: "size-8",
        lg: "size-10",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

function Avatar({
  className,
  size,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root> &
  VariantProps<typeof avatarVariants>) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      className={cn(avatarVariants({ size, className }))}
      {...props}
    />
  )
}

function AvatarImage({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn("aspect-square size-full object-cover", className)}
      {...props}
    />
  )
}

function AvatarFallback({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        "flex size-full items-center justify-center rounded-full bg-muted text-sm text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

export { Avatar, AvatarImage, AvatarFallback, avatarVariants }

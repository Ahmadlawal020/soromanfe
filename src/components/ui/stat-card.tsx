import * as React from "react"

import { cn } from "#/lib/utils"

export type StatTone = "neutral" | "green" | "amber" | "red" | "blue"

/**
 * Tone only ever colours the icon chip — never the card, the value or the
 * border. That single rule is what keeps a row of six cards calm even when
 * half of them are reporting something alarming.
 *
 * The ring is a box-shadow (`ring-1`), not a border, so it costs no layout
 * space; swapping in a real border makes the chip 42px and shifts everything.
 *
 * green / amber / red / neutral ride the design tokens so they step correctly
 * in dark mode. `blue` has no token — the system has no second hue — so it
 * carries the palette directly, with an explicit dark pairing.
 */
const TONES: Record<StatTone, string> = {
  neutral: "bg-muted text-foreground ring-border",
  green: "bg-accent/10 text-accent ring-accent/20",
  amber: "bg-warning/10 text-warning ring-warning/20",
  red: "bg-destructive/10 text-destructive ring-destructive/20",
  blue: "bg-blue-50 text-blue-700 ring-blue-100 dark:bg-blue-950 dark:text-blue-300 dark:ring-blue-900",
}

export interface StatCardProps extends Omit<React.ComponentProps<"div">, "title"> {
  label: string
  value: React.ReactNode
  description?: React.ReactNode
  icon?: React.ReactNode
  tone?: StatTone
  /** Overrides the figure colour only — the chip keeps its own tone. */
  valueClassName?: string
  /** Trailing element on the chip row, e.g. a StatusChip. */
  action?: React.ReactNode
}

function StatCard({
  className,
  label,
  value,
  description,
  icon,
  tone = "green",
  valueClassName,
  action,
  ...props
}: StatCardProps) {
  return (
    <div
      data-slot="stat-card"
      className={cn(
        "rounded-lg border bg-card p-4 text-card-foreground",
        "transition-colors duration-250 ease-luxe",
        className,
      )}
      {...props}
    >
      {/* 8px flex gap; the title adds another 20px of its own, so the gap
          under the chip reads as 28px. That asymmetry is the breathing room. */}
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          {icon && (
            <span
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-2xl ring-1",
                "[&_svg]:size-5 [&_svg]:stroke-2",
                TONES[tone],
              )}
            >
              {icon}
            </span>
          )}
          {action}
        </div>

        <div className="mt-5 text-xs font-normal uppercase text-muted-foreground">
          {label}
        </div>

        {/* break-words is deliberate: long naira figures must wrap inside the
            card rather than blow the grid column out. */}
        <div
          className={cn(
            "text-3xl leading-[1.05] font-semibold tracking-[-0.02em] break-words tabular-nums",
            valueClassName ?? "text-foreground",
          )}
        >
          {value}
        </div>

        {description && (
          <div className="text-base leading-[1.4] text-muted-foreground">
            {description}
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Column count follows the number of cards unless overridden wholesale.
 *
 *   1–3   1 / 2 / 3
 *   4–5   1 / 2 / 4
 *   6+    2 / 3 / 3
 */
function StatCardGrid({
  count,
  className,
  ...props
}: React.ComponentProps<"div"> & { count: number }) {
  // Columns follow the actual number of cards, so two tiles fill the row
  // instead of sitting in two thirds of a three-column grid.
  const cols =
    count >= 6
      ? "grid-cols-2 sm:grid-cols-3"
      : count >= 4
        ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
        : count === 3
          ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          : count === 2
            ? "grid-cols-1 sm:grid-cols-2"
            : "grid-cols-1"

  return <div className={cn("grid gap-3 sm:gap-4", className || cols)} {...props} />
}

export { StatCard, StatCardGrid }

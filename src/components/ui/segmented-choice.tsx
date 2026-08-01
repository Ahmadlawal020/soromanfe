import * as React from "react"

import { cn } from "#/lib/utils"

export type SegmentedOption<T extends string> = {
  value: T
  label: string
  /** Quiet second line — a code, unit or one-word qualifier. */
  hint?: string
  icon?: React.ReactNode
  disabled?: boolean
}

/**
 * A row of bordered choice buttons — the "little buttons" idiom.
 *
 * Selection is carried by the accent border plus a 5% wash, never by a solid
 * fill: the row has to stay quiet when one of three options is on.
 *
 * Renders as a radiogroup so arrow keys and screen readers behave.
 */
function SegmentedChoice<T extends string>({
  options,
  value,
  onChange,
  label,
  className,
  columns,
}: {
  options: SegmentedOption<T>[]
  value: T | null
  onChange: (value: T) => void
  /** Accessible name for the group. */
  label: string
  className?: string
  /** Defaults to one column per option. */
  columns?: number
}) {
  const cols = columns ?? options.length

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn("grid gap-3", className)}
      style={{ gridTemplateColumns: `repeat(${Math.min(cols, options.length)}, minmax(0, 1fr))` }}
    >
      {options.map((o) => {
        const selected = value === o.value
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={o.disabled}
            onClick={() => onChange(o.value)}
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border px-4 py-3.5",
              "transition-colors duration-250 ease-luxe outline-none",
              "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
              "disabled:pointer-events-none disabled:opacity-50",
              selected
                ? "border-accent bg-accent/5 text-accent"
                : "border-border hover:border-foreground/30 hover:bg-muted/50",
            )}
          >
            {o.icon && (
              <span className={cn("[&_svg]:size-4", selected ? "text-accent" : "text-muted-foreground")}>
                {o.icon}
              </span>
            )}
            <span className="text-sm font-medium">{o.label}</span>
            {o.hint && (
              <span
                className={cn(
                  "text-xs",
                  selected ? "text-accent/70" : "text-muted-foreground",
                )}
              >
                {o.hint}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

export { SegmentedChoice }

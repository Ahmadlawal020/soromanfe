import * as React from "react"

import { cn } from "#/lib/utils"

export type ProgressStage = {
  /** Short uppercase label rendered under the rail. */
  label: string
  /** Longer description used to build the accessible name. */
  description?: string
}

/**
 * The house progress indicator — a hairline with tick marks, not a bar.
 *
 * Used for order stages and price spreads alike. Marks read:
 *   done    tall accent tick
 *   current pulsing accent dot
 *   future  short faint tick
 */
function ProgressRail({
  stages,
  current,
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "role" | "aria-label"> & {
  stages: ProgressStage[]
  /** Zero-based index of the current stage. */
  current: number
}) {
  const last = Math.max(stages.length - 1, 1)
  const pct = Math.min(Math.max(current / last, 0), 1) * 100
  const now = stages[current]

  return (
    <div className={cn("w-full", className)} {...props}>
      <div
        className="relative h-4"
        role="img"
        aria-label={
          now
            ? `Step ${current + 1} of ${stages.length}: ${now.description ?? now.label}`
            : `Step ${current + 1} of ${stages.length}`
        }
      >
        {/* track */}
        <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-foreground/15" />
        {/* fill */}
        <div
          className="absolute top-1/2 left-0 h-px -translate-y-1/2 bg-accent transition-[width] duration-500 ease-luxe"
          style={{ width: `${pct}%` }}
        />
        {stages.map((stage, i) => {
          const left = `${(i / last) * 100}%`
          if (i === current) {
            return (
              <span
                key={stage.label}
                className="live-dot absolute top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent"
                style={{ left }}
              />
            )
          }
          if (i < current) {
            return (
              <span
                key={stage.label}
                className="absolute top-1/2 h-3.5 w-0.5 -translate-x-1/2 -translate-y-1/2 bg-accent"
                style={{ left }}
              />
            )
          }
          return (
            <span
              key={stage.label}
              className="absolute top-1/2 h-2 w-px -translate-x-1/2 -translate-y-1/2 bg-foreground/30"
              style={{ left }}
            />
          )
        })}
      </div>
      <div className="mt-1.5 flex justify-between text-[0.65rem] uppercase">
        {stages.map((stage, i) => (
          <span
            key={stage.label}
            className={cn(
              "whitespace-nowrap",
              i === current && "text-accent",
              i < current && "text-muted-foreground",
              i > current && "text-muted-foreground/50",
            )}
          >
            {stage.label}
          </span>
        ))}
      </div>
    </div>
  )
}

export { ProgressRail }

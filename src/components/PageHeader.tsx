import React from 'react'
import { Button } from '#/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { cn } from '#/lib/utils'

/**
 * The one page header. Every page uses it, which is the entire point — a page
 * that rolls its own heading is a bug, not a variation.
 *
 * Anatomy, top to bottom:
 *
 *   ──── EYEBROW      short rule + section label, taken from the sidebar group
 *   Main title.       the trailing full stop is part of the design
 *   Description       one line on what the page is for
 *                     actions sit right on desktop, wrap below on mobile
 *
 * Letter-spacing is normal throughout. The title keeps `tracking-tight`, which
 * is optical correction on large type — not the wide uppercase tracking that
 * used to run through the app.
 */
interface PageHeaderProps {
  /** ReactNode so pages can interpolate, e.g. {isEdit ? "Edit" : "New"} Depot. */
  title: React.ReactNode
  description?: React.ReactNode
  /** Section label above the title. Defaults to a neutral one if omitted. */
  eyebrow?: string
  actions?: React.ReactNode
  backAction?: () => void
  className?: string
}

export function PageHeader({
  title,
  description,
  eyebrow = 'Soroman',
  actions,
  backAction,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        'flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between',
        className,
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        {backAction && (
          <Button
            variant="outline"
            size="icon"
            className="mt-7 shrink-0 cursor-pointer"
            onClick={backAction}
          >
            <ArrowLeft />
            <span className="sr-only">Go back</span>
          </Button>
        )}

        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <span aria-hidden className="h-px w-7 shrink-0 bg-foreground/25" />
            <span className="truncate text-xs uppercase text-muted-foreground">{eyebrow}</span>
          </div>

          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-balance">
            {title}
            <span className="text-accent">.</span>
          </h1>

          {description && (
            <p className="mt-2 max-w-2xl text-sm text-pretty text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      </div>

      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      )}
    </header>
  )
}

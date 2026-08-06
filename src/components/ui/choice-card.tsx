import { Check } from 'lucide-react'
import { cn } from '#/lib/utils'

/**
 * A selectable card — depot, product, delivery method.
 *
 * Every wizard step used to hand-roll this as a clickable `<div>`, which meant
 * four slightly different selected styles and none of them reachable by
 * keyboard. This is a real button, so it tabs, takes Enter/Space and reports
 * its state to a screen reader.
 *
 * Selection reads as a tinted border plus a tick, not a filled block: the
 * card's own content is the thing worth looking at.
 */
export function ChoiceCard({
  selected,
  onSelect,
  icon,
  title,
  subtitle,
  meta,
  disabled,
  className,
}: {
  selected: boolean
  onSelect: () => void
  icon?: React.ReactNode
  title: React.ReactNode
  subtitle?: React.ReactNode
  /** Optional footer row — price, stock, anything that trails the choice. */
  meta?: React.ReactNode
  disabled?: boolean
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      aria-pressed={selected}
      className={cn(
        'group relative flex w-full flex-col rounded-xl border p-4 text-left transition-colors duration-250 ease-luxe outline-none',
        'focus-visible:ring-2 focus-visible:ring-ring/50',
        selected
          ? 'border-accent bg-accent/5'
          : 'border-foreground/15 hover:border-foreground/30 hover:bg-muted/40',
        disabled && 'pointer-events-none opacity-50',
        className,
      )}
    >
      <div className="flex items-start gap-3">
        {icon && (
          <span
            className={cn(
              'flex size-9 shrink-0 items-center justify-center rounded-lg [&_svg]:size-4',
              selected ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground',
            )}
          >
            {icon}
          </span>
        )}

        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold">{title}</span>
          {subtitle && (
            <span className="mt-0.5 block text-xs text-muted-foreground">{subtitle}</span>
          )}
        </span>

        {/* Reserves its own space so selecting doesn't reflow the row. */}
        <span
          className={cn(
            'flex size-5 shrink-0 items-center justify-center rounded-full transition-opacity',
            selected ? 'bg-accent text-accent-foreground opacity-100' : 'opacity-0',
          )}
        >
          <Check className="size-3" />
        </span>
      </div>

      {meta && (
        <span className="mt-3 flex items-end justify-between border-t border-foreground/10 pt-3">
          {meta}
        </span>
      )}
    </button>
  )
}

/** The grid these sit in — two up from `sm`, so cards never get too wide. */
export function ChoiceGrid({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return <div className={cn('grid gap-3 sm:grid-cols-2', className)}>{children}</div>
}

/** A labelled figure inside a card's meta row. */
export function ChoiceMeta({
  label,
  value,
  align = 'left',
  tone,
}: {
  label: string
  value: React.ReactNode
  align?: 'left' | 'right'
  tone?: string
}) {
  return (
    <span className={cn('block', align === 'right' && 'text-right')}>
      <span className="block text-xs text-muted-foreground">{label}</span>
      <span className={cn('block text-sm font-semibold', tone)}>{value}</span>
    </span>
  )
}

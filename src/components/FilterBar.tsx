import { Search, X } from 'lucide-react'

import { Input } from '#/components/ui/input'
import { Button } from '#/components/ui/button'
import { PANEL } from '#/lib/panel'
import { cn } from '#/lib/utils'

/**
 * The filter band that sits between the page header and the table.
 *
 * Filters, search and bulk actions live here — never inside the table
 * container. A table should begin with its header row and nothing else, so
 * the eye lands on data rather than on controls wrapped in the same border.
 *
 *   <PageHeader … />
 *   <FilterBar>  search, selects, chips  </FilterBar>
 *   <section>    table                   </section>
 */
export function FilterBar({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <section
      className={cn(PANEL, 'flex flex-wrap items-center gap-2 p-3', className)}
      aria-label="Filters"
    >
      {children}
    </section>
  )
}

/** The search input every list page uses, so the affordance is identical. */
export function FilterSearch({
  value,
  onChange,
  placeholder = 'Search…',
  className,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  className?: string
}) {
  return (
    <div className={cn('relative min-w-[12rem] flex-1', className)}>
      <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        className="pl-8"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}

/** Clears every active filter. Only render it when something is active. */
export function FilterClear({ onClear }: { onClear: () => void }) {
  return (
    <Button variant="ghost" size="sm" onClick={onClear}>
      <X data-icon="inline-start" />
      Clear
    </Button>
  )
}

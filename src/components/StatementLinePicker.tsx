import { useState } from 'react'
import { format } from 'date-fns'
import { Search, Link2, X, Loader2 } from 'lucide-react'

import { Input } from '#/components/ui/input'
import { StatusChip } from '#/components/ui/status-chip'
import { MICRO } from '#/lib/panel'
import { cn } from '#/lib/utils'
import { useUnmatchedLines, type StatementLine } from '#/lib/hooks/useBankStatements'

/**
 * Picks the actual deposit row out of an uploaded statement, so Finance stops
 * retyping the depositor, date, reference and amount by hand.
 *
 * Only UNMATCHED lines are offered — a deposit already claimed by another
 * payment never appears here.
 */
export function StatementLinePicker({
  bankAccountId,
  selected,
  onSelect,
  onClear,
}: {
  bankAccountId?: string | number
  selected: StatementLine | null
  onSelect: (line: StatementLine) => void
  onClear: () => void
}) {
  const [q, setQ] = useState('')
  const { data: lines = [], isLoading } = useUnmatchedLines(bankAccountId, q)

  if (!bankAccountId) {
    return (
      <p className="text-sm text-muted-foreground">
        Choose a bank account to search its uploaded statements.
      </p>
    )
  }

  if (selected) {
    return (
      <div className="flex items-start justify-between gap-3 rounded-lg border border-accent/40 bg-accent/5 p-3.5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusChip tone="accent">Matched to statement</StatusChip>
            <span className="text-xs text-muted-foreground tabular-nums">
              {format(new Date(selected.txn_date), 'd MMM yyyy')}
            </span>
          </div>
          <p className="mt-1.5 truncate text-sm font-medium">
            {selected.depositor || 'Unnamed depositor'}
          </p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {selected.bank_ref || 'No reference'}
            {selected.narration ? ` · ${selected.narration}` : ''}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="text-sm font-semibold tabular-nums">
            ₦{Number(selected.amount).toLocaleString()}
          </span>
          <button
            type="button"
            onClick={onClear}
            className="flex size-6 items-center justify-center rounded-full text-muted-foreground transition-colors duration-250 ease-luxe outline-none hover:bg-foreground/10 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <X className="size-3" />
            <span className="sr-only">Unlink statement line</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search depositor, reference or amount…"
          className="pl-9"
        />
      </div>

      <div className="max-h-64 overflow-y-auto rounded-lg border border-foreground/15">
        {isLoading ? (
          <p className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Searching…
          </p>
        ) : lines.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {q ? 'No unmatched deposit matches that.' : 'No unmatched deposits for this account.'}
          </p>
        ) : (
          <ul className="divide-y divide-foreground/10">
            {lines.map((line) => (
              <li key={line.id}>
                <button
                  type="button"
                  onClick={() => onSelect(line)}
                  className="flex w-full items-start justify-between gap-3 px-3.5 py-3 text-left transition-colors duration-250 ease-luxe outline-none hover:bg-muted/60 focus-visible:bg-muted/60"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {line.depositor || 'Unnamed depositor'}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground tabular-nums">
                      {format(new Date(line.txn_date), 'd MMM yyyy')}
                      {line.bank_ref ? ` · ${line.bank_ref}` : ''}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold tabular-nums">
                    ₦{Number(line.amount).toLocaleString()}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className={cn(MICRO, 'flex items-center gap-1.5 text-[0.6rem] text-muted-foreground/70')}>
        <Link2 className="size-3" />
        Amount search ignores commas
      </p>
    </div>
  )
}

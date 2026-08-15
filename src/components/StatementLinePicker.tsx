import { useState } from 'react'
import { format } from 'date-fns'
import { Search, Link2, X, Loader2, Check } from 'lucide-react'

import { Input } from '#/components/ui/input'
import { StatusChip } from '#/components/ui/status-chip'
import { MICRO } from '#/lib/panel'
import { cn } from '#/lib/utils'
import { useUnmatchedLines, type StatementLine } from '#/lib/hooks/useBankStatements'

/**
 * Bank narrations run past 150 characters. A fixed character cap keeps every
 * row the same shape regardless of how wide the panel happens to be — CSS
 * `truncate` only clips once the container itself runs out of room, so on a
 * wide panel a long narration would otherwise render in full. `title` still
 * carries the untruncated text for hover.
 */
const truncateText = (text: string, max = 50) =>
  text.length > max ? `${text.slice(0, max).trimEnd()}…` : text

/**
 * Picks the actual deposit row(s) out of an uploaded statement, so Finance
 * stops retyping the depositor, date, reference and amount by hand.
 *
 * Multi-select: a customer who transferred in several tranches is picked as
 * one growing set, with the running total shown live — everything here stays
 * a local selection until submitted. Submitting claims the lines server-side,
 * atomically, in one transaction, but records one deposit PER line: each
 * keeps its own amount/depositor/date/reference rather than being folded
 * into a single summed row, so the ledger mirrors the bank statement.
 *
 * Only UNMATCHED lines are offered — a deposit already claimed by another
 * payment never appears here.
 */
export function StatementLinePicker({
  bankAccountId,
  selected,
  onToggle,
  onClear,
  query,
  onQueryChange,
}: {
  bankAccountId?: string | number
  selected: StatementLine[]
  onToggle: (line: StatementLine) => void
  onClear: () => void
  /** Controlled search text — omit to let the picker manage its own. */
  query?: string
  onQueryChange?: (q: string) => void
}) {
  const [internalQ, setInternalQ] = useState('')
  const q = query ?? internalQ
  const setQ = onQueryChange ?? setInternalQ
  const { data: lines = [], isLoading } = useUnmatchedLines(bankAccountId, q)
  const selectedIds = new Set(selected.map((l) => l.id))
  const total = selected.reduce((sum, l) => sum + Number(l.amount), 0)

  if (!bankAccountId) {
    return (
      <p className="text-sm text-muted-foreground">
        Choose a bank account to search its uploaded statements.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {/* selected.length > 0 && (
        <div className="space-y-2 rounded-lg border border-accent/40 bg-accent/5 p-3.5">
          <div className="flex items-center justify-between gap-2">
            <StatusChip tone="accent">
              {selected.length} line{selected.length === 1 ? '' : 's'} selected
            </StatusChip>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">₦{total.toLocaleString()}</span>
              <button
                type="button"
                onClick={onClear}
                className="flex size-6 items-center justify-center rounded-full text-muted-foreground transition-colors duration-250 ease-luxe outline-none hover:bg-foreground/10 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                <X className="size-3" />
                <span className="sr-only">Clear selection</span>
              </button>
            </div>
          </div>
          <ul className="space-y-1">
            {selected.map((line) => (
              <li key={line.id} className="flex items-center justify-between gap-2 text-xs">
                <span
                  className="min-w-0 flex-1 truncate text-muted-foreground"
                  title={line.depositor || 'Unnamed depositor'}
                >
                  {format(new Date(line.txn_date), 'd MMM')} · {truncateText(line.depositor || 'Unnamed depositor')}
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  <span className="font-medium">₦{Number(line.amount).toLocaleString()}</span>
                  <button
                    type="button"
                    onClick={() => onToggle(line)}
                    className="text-muted-foreground outline-none hover:text-foreground focus-visible:text-foreground"
                  >
                    <X className="size-3" />
                    <span className="sr-only">Remove</span>
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) */}

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
            {lines.map((line) => {
              const isSelected = selectedIds.has(line.id)
              return (
                <li key={line.id}>
                  <button
                    type="button"
                    onClick={() => onToggle(line)}
                    aria-pressed={isSelected}
                    className={cn(
                      'flex w-full items-start gap-3 px-3.5 py-3 text-left transition-colors duration-250 ease-luxe outline-none hover:bg-muted/60 focus-visible:bg-muted/60',
                      isSelected && 'bg-accent/10 hover:bg-accent/15',
                    )}
                  >
                    <span
                      className={cn(
                        'mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border',
                        isSelected ? 'border-accent bg-accent text-accent-foreground' : 'border-foreground/30',
                      )}
                    >
                      {isSelected && <Check className="size-3" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <p className="truncate text-sm font-normal" title={line.depositor || 'Unnamed depositor'}>
                        {truncateText(line.depositor || 'Unnamed depositor')}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {format(new Date(line.txn_date), 'd MMM yyyy')}
                        {line.bank_ref ? ` · ${line.bank_ref}` : ''}
                      </p>
                    </span>
                    <span className="shrink-0 text-sm font-semibold">
                      ₦{Number(line.amount).toLocaleString()}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* <p className={cn(MICRO, 'flex items-center gap-1.5 text-xs text-muted-foreground/70')}>
        <Link2 className="size-3" />
        Select one or more lines — each becomes its own deposit entry. Amount search ignores commas.
      </p> */}
    </div>
  )
}

import { cn } from '#/lib/utils'
import type { PfiFinancials } from '#/lib/hooks/usePfis'

/**
 * A null money figure is not zero. An uncosted batch must read "—" so nobody
 * takes an unpriced cargo for a free one.
 */
export function naira(v: number | null | undefined, opts?: { compact?: boolean }): string {
  if (v == null || !Number.isFinite(v)) return '—'
  if (opts?.compact) {
    const abs = Math.abs(v)
    const sign = v < 0 ? '-' : ''
    if (abs >= 1_000_000_000) return `${sign}₦${(abs / 1_000_000_000).toFixed(2)}bn`
    if (abs >= 1_000_000) return `${sign}₦${(abs / 1_000_000).toFixed(1)}m`
    if (abs >= 1_000) return `${sign}₦${(abs / 1_000).toFixed(0)}k`
  }
  // Sign before the symbol: "₦-3,871,765,923" reads as a currency code for a
  // second before it reads as a loss.
  const sign = v < 0 ? '-' : ''
  return `${sign}₦${Math.abs(v).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function litres(v: number | null | undefined): string {
  if (v == null || !Number.isFinite(v)) return '—'
  return `${Math.round(v).toLocaleString('en-NG')} L`
}

export function pct(v: number | null | undefined, digits = 1): string {
  if (v == null || !Number.isFinite(v)) return '—'
  return `${v.toFixed(digits)}%`
}

/** Green above zero, red below, muted at nothing. */
export function moneyTone(v: number | null | undefined): string {
  if (v == null || !Number.isFinite(v) || v === 0) return 'text-muted-foreground'
  return v > 0 ? 'text-accent' : 'text-destructive'
}

/**
 * Background + border for a card's profit/loss hero block. Pairs with
 * {@link moneyTone} on the figure inside it — the tint carries the same
 * verdict the text colour does, so it reads before anyone parses the number.
 */
export function profitTint(v: number | null | undefined): string {
  if (v == null || !Number.isFinite(v) || v === 0) return 'border-foreground/10 bg-muted/40'
  return v > 0 ? 'border-accent/25 bg-accent/5' : 'border-destructive/25 bg-destructive/5'
}

/**
 * The gap between the tank and the papers.
 *
 * A surplus is product you got for free; a deficit is money paid for product
 * that never arrived. Neither is neutral, so neither renders neutral.
 */
export function SurplusDeficit({
  litres: value,
  className,
}: {
  litres: number | null
  className?: string
}) {
  if (value == null) {
    return <span className={cn('text-muted-foreground', className)}>—</span>
  }
  if (value === 0) return <span className={cn('text-muted-foreground', className)}>Exact</span>

  const surplus = value > 0
  return (
    <span className={cn(surplus ? 'text-accent' : 'text-destructive', className)}>
      {surplus ? '+' : '−'}
      {Math.abs(value).toLocaleString('en-NG')} L
      <span className="ml-1 text-[0.7em] uppercase opacity-70">
        {surplus ? 'surplus' : 'deficit'}
      </span>
    </span>
  )
}

/**
 * How much of the batch has actually gone out.
 *
 * This bar is the single most important thing on the page, because it is what
 * tells you whether the profit figure beside it means anything yet.
 */
export function SellThroughBar({ value, className }: { value: number | null; className?: string }) {
  const share = value == null ? 0 : Math.round(value * 100)
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            'h-full rounded-full transition-all',
            share >= 99 ? 'bg-accent' : share >= 50 ? 'bg-warning' : 'bg-foreground/25',
          )}
          style={{ width: `${Math.min(100, Math.max(share === 0 ? 0 : 2, share))}%` }}
        />
      </div>
      <span className="shrink-0 text-xs text-muted-foreground">{share}%</span>
    </div>
  )
}

/**
 * The one sentence that stops a paper loss being read as a real one.
 *
 * Cost is charged in full from day one while revenue only accrues as orders
 * are booked, so a healthy half-sold batch still shows a large loss.
 */
export function profitCaveat(f: PfiFinancials): string | null {
  if (f.profitIsMeaningful || f.sellThrough == null) return null
  const share = Math.round(f.sellThrough * 100)
  return `Only ${share}% of this batch has been sold. The full cargo cost is charged against ${share}% of the revenue, so this is not yet a real loss — read it as "have we recovered the cargo cost".`
}

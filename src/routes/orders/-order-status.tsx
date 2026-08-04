import { Clock, CheckCircle2, Send, Truck, XCircle, CircleDashed, Hourglass } from 'lucide-react'

import { cn } from '#/lib/utils'

/**
 * Status badge: a coloured chip with an icon.
 *
 * Matches the `order_status` enum in the database: Pending, Paid, Released,
 * Loading, Completed, Cancelled, Expired.
 *
 * `blue` and `violet` have no design token — the system runs one accent — so
 * those two carry the palette directly with an explicit dark pairing.
 */
const STATUS: Record<string, { label: string; icon: typeof Clock; className: string }> = {
  pending: {
    label: 'Pending', icon: Clock,
    className: 'border-warning/40 bg-warning/10 text-warning',
  },
  paid: {
    label: 'Paid', icon: CheckCircle2,
    className: 'border-accent/40 bg-accent/10 text-accent',
  },
  released: {
    label: 'Released', icon: Send,
    className: 'border-blue-500/40 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  },
  loading: {
    label: 'Loading', icon: Truck,
    className: 'border-violet-500/40 bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300',
  },
  completed: {
    label: 'Completed', icon: CheckCircle2,
    className: 'border-accent/40 bg-accent/10 text-accent',
  },
  cancelled: {
    label: 'Canceled', icon: XCircle,
    className: 'border-destructive/40 bg-destructive/10 text-destructive',
  },
  canceled: {
    label: 'Canceled', icon: XCircle,
    className: 'border-destructive/40 bg-destructive/10 text-destructive',
  },
  expired: {
    label: 'Expired', icon: Hourglass,
    className: 'border-destructive/40 bg-destructive/10 text-destructive',
  },
}

export function OrderStatusBadge({ status }: { status?: string }) {
  const key = String(status || '').toLowerCase()
  const entry = STATUS[key]
  const Icon = entry?.icon ?? CircleDashed

  return (
    <span
      className={cn(
        'inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5',
        'text-xs whitespace-nowrap uppercase',
        entry?.className ?? 'border-foreground/15 text-muted-foreground/60',
      )}
    >
      <Icon className="size-3" />
      {entry?.label ?? status ?? '—'}
    </span>
  )
}

export function PaymentBadge({ paymentStatus }: { paymentStatus?: string }) {
  const paid = String(paymentStatus || '').toLowerCase() === 'paid'
  return (
    <span
      className={cn(
        'inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5',
        'text-xs whitespace-nowrap uppercase',
        paid
          ? 'border-accent/40 bg-accent/10 text-accent'
          : 'border-warning/40 bg-warning/10 text-warning',
      )}
    >
      {paid ? <CheckCircle2 className="size-3" /> : <Clock className="size-3" />}
      {paid ? 'Paid' : 'Unpaid'}
    </span>
  )
}

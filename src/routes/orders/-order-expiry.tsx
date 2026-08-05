import { useState, useEffect } from 'react'
import { Hourglass } from 'lucide-react'
import { cn } from '#/lib/utils'

/**
 * Shows how much time remains before an unpaid Pending order expires, or
 * displays the expired-at timestamp for orders that already lapsed.
 *
 * Renders nothing for orders that are past Pending (Paid, Released, etc.)
 * because they can no longer expire.
 *
 * Uses `expiresAt` from the backend (the computed deadline) — no local
 * expiration duration knowledge needed.  Ticks every 30 s so the countdown
 * stays accurate while the page is open.
 */
export function OrderExpiryBadge({
  status,
  expiresAt,
  expiredAt,
}: {
  status?: string
  expiresAt?: string | null
  expiredAt?: string
}) {
  const s = String(status || '').toLowerCase()

  // Tick counter forces re-computation every 30 s
  const [, setTick] = useState(0)
  useEffect(() => {
    if (!['pending', 'approved', 'pending review'].includes(s) || !expiresAt) return
    const id = setInterval(() => setTick((t) => t + 1), 30_000)
    return () => clearInterval(id)
  }, [s, expiresAt])

  // Already expired — show when it happened.
  if (s === 'expired') {
    return (
      <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-destructive/40 bg-destructive/10 px-2.5 py-0.5 text-[0.65rem] tracking-[0.14em] uppercase text-destructive">
        <Hourglass className="size-3" />
        Expired{expiredAt ? ` · ${formatShortDate(expiredAt)}` : ''}
      </span>
    )
  }

  // Only show countdown for statuses that can still expire
  if (!['pending', 'approved', 'pending review'].includes(s) || !expiresAt) return null

  const deadline = new Date(expiresAt).getTime()
  const remaining = deadline - Date.now()

  if (remaining <= 0) {
    return (
      <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-destructive/40 bg-destructive/10 px-2.5 py-0.5 text-[0.65rem] tracking-[0.14em] uppercase text-destructive">
        <Hourglass className="size-3" />
        Expired
      </span>
    )
  }

  const hours = Math.floor(remaining / (1000 * 60 * 60))
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60))
  const label = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
  const urgent = remaining < 2 * 60 * 1000 // < 2 minutes

  return (
    <span
      className={cn(
        'inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[0.65rem] tracking-[0.14em] uppercase',
        urgent
          ? 'border-destructive/40 bg-destructive/10 text-destructive'
          : 'border-warning/40 bg-warning/10 text-warning',
      )}
    >
      <Hourglass className="size-3" />
      Expires in {label}
    </span>
  )
}

function formatShortDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('en-NG', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return ''
  }
}

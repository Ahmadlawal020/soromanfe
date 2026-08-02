import { useMemo } from 'react'
import { Hourglass } from 'lucide-react'
import { cn } from '#/lib/utils'

const EXPIRY_HOURS = Number(import.meta.env.VITE_ORDER_EXPIRY_HOURS) || 3

/**
 * Shows how much time remains before an unpaid Pending order expires, or
 * displays the expired-at timestamp for orders that already lapsed.
 *
 * Renders nothing for orders that are past Pending (Paid, Released, etc.)
 * because they can no longer expire.
 */
export function OrderExpiryBadge({
  status,
  createdAt,
  expiredAt,
}: {
  status?: string
  createdAt?: string
  expiredAt?: string
}) {
  const s = String(status || '').toLowerCase()

  const expiryInfo = useMemo(() => {
    if (s !== 'pending' || !createdAt) return null
    const deadline = new Date(createdAt).getTime() + EXPIRY_HOURS * 60 * 60 * 1000
    // eslint-disable-next-line react-hooks/purity -- display-only, no side effect
    const now = Date.now()
    const remaining = deadline - now

    if (remaining <= 0) {
      return { type: 'imminent' as const }
    }

    const hours = Math.floor(remaining / (1000 * 60 * 60))
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60))
    const label = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
    const urgent = remaining < 30 * 60 * 1000 // < 30 minutes

    return { type: 'countdown' as const, label, urgent }
  }, [s, createdAt])

  // Already expired — show when it happened.
  if (s === 'expired') {
    return (
      <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-destructive/40 bg-destructive/10 px-2.5 py-0.5 text-[0.65rem] tracking-[0.14em] uppercase text-destructive">
        <Hourglass className="size-3" />
        Expired{expiredAt ? ` · ${formatShortDate(expiredAt)}` : ''}
      </span>
    )
  }

  if (!expiryInfo) return null

  if (expiryInfo.type === 'imminent') {
    return (
      <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-destructive/40 bg-destructive/10 px-2.5 py-0.5 text-[0.65rem] tracking-[0.14em] uppercase text-destructive animate-pulse">
        <Hourglass className="size-3" />
        Expiring imminently
      </span>
    )
  }

  return (
    <span
      className={cn(
        'inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[0.65rem] tracking-[0.14em] uppercase',
        expiryInfo.urgent
          ? 'border-destructive/40 bg-destructive/10 text-destructive'
          : 'border-warning/40 bg-warning/10 text-warning',
      )}
    >
      <Hourglass className="size-3" />
      Expires in {expiryInfo.label}
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

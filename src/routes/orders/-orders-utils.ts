import {
  startOfDay, endOfDay, subDays, startOfWeek, endOfWeek,
  startOfMonth, endOfMonth, startOfYear, endOfYear,
} from 'date-fns'

export type DatePreset = 'today' | 'yesterday' | 'week' | 'month' | 'year' | 'all' | 'custom'

export const DATE_PRESETS: { value: DatePreset; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'year', label: 'This Year' },
  { value: 'all', label: 'All Time' },
]

/** Resolves a preset to an inclusive [from, to] window, or null for All Time. */
export function resolveRange(
  preset: DatePreset,
  custom?: { from?: Date; to?: Date },
): { from: Date; to: Date } | null {
  const now = new Date()
  switch (preset) {
    case 'today':
      return { from: startOfDay(now), to: endOfDay(now) }
    case 'yesterday': {
      const y = subDays(now, 1)
      return { from: startOfDay(y), to: endOfDay(y) }
    }
    case 'week':
      return { from: startOfWeek(now, { weekStartsOn: 1 }), to: endOfWeek(now, { weekStartsOn: 1 }) }
    case 'month':
      return { from: startOfMonth(now), to: endOfMonth(now) }
    case 'year':
      return { from: startOfYear(now), to: endOfYear(now) }
    case 'custom':
      if (!custom?.from) return null
      return { from: startOfDay(custom.from), to: endOfDay(custom.to ?? custom.from) }
    case 'all':
    default:
      return null
  }
}

export const toNumber = (v: unknown): number => {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

export const formatNaira = (amount: number) =>
  `₦${amount.toLocaleString('en-NG', { maximumFractionDigits: 2 })}`

export const formatQty = (qty: number) => qty.toLocaleString('en-NG', { maximumFractionDigits: 2 })

/** An order counts as paid when the gateway has confirmed it. */
export const isPaid = (o: any) => String(o?.paymentStatus || '').toLowerCase() === 'paid'

/** Groups rows by calendar day, preserving the incoming order. */
export function groupByDay<T extends { createdAt?: string }>(rows: T[]) {
  const groups = new Map<string, T[]>()
  for (const row of rows) {
    const key = row.createdAt ? new Date(row.createdAt).toDateString() : 'Unknown date'
    const bucket = groups.get(key)
    if (bucket) bucket.push(row)
    else groups.set(key, [row])
  }
  return groups
}

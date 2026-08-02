import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '#/lib/api/http'
import { useToast } from '#/lib/hooks/useToast'
import { getErrorMessage } from '#/lib/utils'

export type FleetTruck = Record<string, any>
export type LedgerEntry = {
  id: number
  truck_id: number
  entry_type: 'expense' | 'income'
  category: string
  amount: string
  entry_date: string
  description: string | null
  entered_by: string | null
  truck_plate: string
  truck_driver: string
}

export type StatusRating = 'Excellent' | 'Good' | 'Fair' | 'Bad'
export const STATUS_RATINGS: StatusRating[] = ['Excellent', 'Good', 'Fair', 'Bad']

/** The separator that packs a rating and a reason into one column. */
const SEP = ' — '

/**
 * `truckStatus` is a single column carrying both a rating and a reason,
 * e.g. "Bad — no tyres".
 *
 * Anything unrecognised is legacy free text and means Bad — that is the
 * historical convention and changing it would silently reclassify old rows.
 */
export function parseStatus(raw?: string | null): { rating: StatusRating; reason: string } {
  const value = String(raw ?? '').trim()
  if (!value) return { rating: 'Good', reason: '' }

  const [head, ...rest] = value.split(SEP)
  const rating = STATUS_RATINGS.find((r) => r.toLowerCase() === head.trim().toLowerCase())
  if (rating) return { rating, reason: rest.join(SEP).trim() }

  // Legacy free text: no recognisable rating, so treat the whole thing as a
  // reason and call it Bad.
  return { rating: 'Bad', reason: value }
}

/** Excellent and Good carry no reason — there is nothing to explain. */
export function encodeStatus(rating: StatusRating, reason: string): string {
  if (rating === 'Excellent' || rating === 'Good') return rating
  const trimmed = reason.trim()
  return trimmed ? `${rating}${SEP}${trimmed}` : rating
}

export type Incident = { date: string; description: string }

/** Malformed JSON yields an empty list rather than taking the page down. */
export function parseIncidents(raw?: string | null): Incident[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((i) => i && typeof i === 'object')
  } catch {
    return []
  }
}

/** An expiry that has already passed. */
export function isExpired(date?: string | null): boolean {
  if (!date) return false
  const d = new Date(date)
  return !Number.isNaN(d.getTime()) && d < new Date()
}

// ─── Queries ────────────────────────────────────────────────────────────────
// Both pages share these two keys and cross-invalidate, so posting a ledger
// entry moves the money figures on the Directory without a manual refresh.

const KEYS = { trucks: ['fleet-trucks'], ledger: ['fleet-ledger'] }

export function useFleetTrucks() {
  return useQuery({
    queryKey: KEYS.trucks,
    queryFn: async () => {
      const res = await api.get('/fleet', { params: { limit: 100 } })
      return (res.data.data.trucks || []) as FleetTruck[]
    },
  })
}

export function useFleetLedger() {
  return useQuery({
    queryKey: KEYS.ledger,
    queryFn: async () => {
      const res = await api.get('/fleet/ledger')
      return (res.data.data.entries || []) as LedgerEntry[]
    },
  })
}

/** Every write invalidates both keys — that is what keeps the two pages in step. */
function useFleetMutation<T>(fn: (v: T) => Promise<any>, fallback: string) {
  const qc = useQueryClient()
  const toast = useToast()
  return useMutation({
    retry: false,
    mutationFn: fn,
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: KEYS.trucks })
      qc.invalidateQueries({ queryKey: KEYS.ledger })
      toast.success(res?.message || fallback)
    },
    onError: (err: any) => toast.error(getErrorMessage(err)),
  })
}

export const useSaveTruck = () =>
  useFleetMutation<{ id?: number; data: Record<string, any> }>(
    async ({ id, data }) =>
      (id ? await api.patch(`/fleet/${id}`, data) : await api.post('/fleet', data)).data,
    'Truck saved',
  )

export const useDeleteTruck = () =>
  useFleetMutation<number>(async (id) => (await api.delete(`/fleet/${id}`)).data, 'Truck removed')

export const useSaveLedgerEntry = () =>
  useFleetMutation<{ id?: number; truckId: number; data: Record<string, any> }>(
    async ({ id, truckId, data }) =>
      (id
        ? await api.patch(`/fleet/ledger/${id}`, { ...data, truckId })
        : await api.post(`/fleet/${truckId}/ledger`, data)
      ).data,
    'Entry saved',
  )

export const useDeleteLedgerEntry = () =>
  useFleetMutation<number>(
    async (id) => (await api.delete(`/fleet/ledger/${id}`)).data,
    'Entry deleted',
  )

// ─── Categories ─────────────────────────────────────────────────────────────
// Held in the frontend against a free-text column. Nothing stops drift — the
// filters below also scan existing rows so historical values stay selectable.

export const EXPENSE_CATEGORIES = [
  'Brake Pads', 'Tyres', 'Engine Oil', 'Fuel/Diesel', 'Truck Servicing',
  'Repairs & Maintenance', 'Insurance', 'Licence/Registration', 'Spare Parts',
  'Battery', 'Electrical', 'Body Work', 'Towing', 'Driver Salary',
  'Driver Allowance', 'Loading', 'Other',
]

export const INCOME_CATEGORIES = [
  'Delivery', 'Freight Charges', 'Hire/Charter', 'Refund', 'Other',
]

export const ALL_CATEGORIES = [...new Set([...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES])].sort()

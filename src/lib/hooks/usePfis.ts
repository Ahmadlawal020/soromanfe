import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '#/lib/api/http'
import { useToast } from '#/lib/hooks/useToast'
import { getErrorMessage } from '#/lib/utils'
import type { Pfi } from '#/lib/types'

export type { Pfi }

/**
 * Every money figure the API computes for a batch.
 *
 * `null` is meaningful throughout and must be rendered as "—", never as ₦0:
 * a batch nobody has priced yet is not a batch worth nothing. Only
 * `totalExpenses` is always a number.
 */
export type PfiFinancials = {
  /** Documented quantity from the shipping papers — what you are charged for. */
  blQtyLitres: number | null
  /** Measured quantity in the tank — what you can actually sell. */
  tankQtyLitres: number
  /** Tank − BL. Negative is a deficit. Null until BL is entered. */
  surplusDeficitLitres: number | null
  pricePerLitre: number | null
  /** BL × price. Never the tank quantity. */
  pfiValue: number | null
  totalExpenses: number
  totalCost: number | null
  revenue: number
  profitLoss: number | null
  margin: number | null
  sold: number
  remaining: number
  movementQty: number
  allocationQty: number
  /** The deficit priced at what you paid for it — money for product that never landed. */
  deficitCost: number | null
  /** 0–1. How much of the batch has actually gone out. */
  sellThrough: number | null
  /** False while the batch is part-sold, when profit is not yet a real number. */
  profitIsMeaningful: boolean
  costOfSold: number | null
  marginOnSold: number | null
}

export type PfiWithFinancials = Pfi & {
  financials: PfiFinancials
  orderCount: number
  expenseCount: number
}

export type PfiExpense = {
  id: number
  pfi_id: number | null
  category_id: number
  category_name: string
  is_system_category?: boolean
  pfi_number?: string | null
  expense_date: string
  vendor: string
  description: string
  amount: string
  bank_paid_from: string
  receipt_reference?: string
  entered_by: string
  deleted_at: string | null

  // ── The approval chain ────────────────────────────────────────────────
  status: ExpenseStatus
  status_label: string
  status_step: number
  total_steps: number
  /** Computed server-side. The page renders these; it decides nothing itself. */
  available_actions: ExpenseAction[]
  action_blocked_reason: string

  payee_bank_name?: string
  payee_account_number?: string
  payee_account_name?: string
  submitted_by_name?: string | null
  reviewed_by_name?: string | null
  review_note?: string
  attachment_count?: number
  paid_at?: string | null
  history?: Array<{
    action: string
    changes: { note?: string; status?: [string, string] } | null
    created_at: string
    actor_name: string | null
  }>
}

export type ExpenseStatus =
  | 'pending' | 'verified' | 'audit_approved' | 'admin_approved'
  | 'paid' | 'rejected' | 'changes_requested'

export type ExpenseAction =
  | 'verify' | 'audit_approve' | 'admin_approve' | 'mark_paid'
  | 'reject' | 'request_changes'

/** Label and tone per action, so the button and the badge it produces agree. */
export const ACTION_META: Record<ExpenseAction, { label: string; tone: string; needsNote?: boolean }> = {
  verify: { label: 'Verify', tone: 'bg-info text-info-foreground' },
  audit_approve: { label: 'Audit approve', tone: 'bg-info text-info-foreground' },
  admin_approve: { label: 'Authorise', tone: 'bg-accent text-accent-foreground' },
  mark_paid: { label: 'Mark paid', tone: 'bg-success text-success-foreground' },
  reject: { label: 'Reject', tone: 'bg-destructive text-destructive-foreground', needsNote: true },
  request_changes: { label: 'Send back', tone: 'bg-warning text-warning-foreground', needsNote: true },
}

export const STATUS_TONE: Record<ExpenseStatus, string> = {
  pending: 'bg-muted text-foreground',
  verified: 'bg-info/15 text-info',
  audit_approved: 'bg-info/25 text-info',
  admin_approved: 'bg-accent/15 text-accent',
  paid: 'bg-success/15 text-success',
  rejected: 'bg-destructive/15 text-destructive',
  changes_requested: 'bg-warning/15 text-warning',
}

export type ExpenseCategory = {
  id: number
  name: string
  pfi_id: number | null
  is_system_category: boolean
  pfi_status?: string | null
}

export type PfiMovement = {
  id: number
  order_id: number | null
  order_number: string | null
  customer_name: string | null
  action: string
  qty_litres: number
  notes: string
  created_at: string
}

export function usePfiList(params?: { search?: string; status?: string; location?: string }) {
  return useQuery({
    queryKey: ['pfis', params],
    queryFn: async () => {
      const res = await api.get('/pfis', { params })
      return res.data.data as { pfis: PfiWithFinancials[]; pagination: any }
    },
  })
}

export function usePfiDetails(id: string) {
  return useQuery({
    queryKey: ['pfis', id],
    queryFn: async () => {
      const res = await api.get(`/pfis/${id}`)
      return res.data.data.pfi as Pfi
    },
    enabled: !!id,
  })
}

/** The drawer needs the lines behind the totals, not just the totals. */
export function usePfiDetail(id: number | null) {
  return useQuery({
    queryKey: ['pfis', 'detail', id],
    queryFn: async () => {
      const res = await api.get(`/pfis/${id}`)
      return res.data.data as {
        pfi: PfiWithFinancials
        expenses: PfiExpense[]
        movements: PfiMovement[]
      }
    },
    enabled: id != null,
  })
}

export function useCreatePfi() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    retry: false,
    mutationFn: async (data: Record<string, any>) => {
      const res = await api.post('/pfis', data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pfis'] })
      toast.success('PFI created successfully')
    },
    onError: (err: any) => {
      toast.error(getErrorMessage(err))
    },
  })
}

export function useUpdatePfi() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    retry: false,
    mutationFn: async ({ id, data }: { id: string; data: Record<string, any> }) => {
      const res = await api.patch(`/pfis/${id}`, data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pfis'] })
      toast.success('PFI updated successfully')
    },
    onError: (err: any) => {
      toast.error(getErrorMessage(err))
    },
  })
}

export function useDeletePfi() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    retry: false,
    mutationFn: async (id: string) => {
      const res = await api.delete(`/pfis/${id}`)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pfis'] })
      toast.success('PFI deleted successfully')
    },
    onError: (err: any) => {
      toast.error(getErrorMessage(err))
    },
  })
}

// ─── Expenses ───────────────────────────────────────────────────────────────
// PFI and expense data cross-invalidate: booking a cost against a PFI category
// moves that PFI's totals, so a write to either must refresh both.

/** Every write here touches money on both pages. */
function useMoneyMutation<T>(fn: (v: T) => Promise<any>, fallback: string) {
  const queryClient = useQueryClient()
  const toast = useToast()
  return useMutation({
    retry: false,
    mutationFn: fn,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['pfis'] })
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      toast.success(res?.message || fallback)
    },
    onError: (err: any) => toast.error(getErrorMessage(err)),
  })
}

export type ExpenseFilters = {
  search?: string
  category?: string
  pfi?: string
  bank?: string
  type?: 'pfi' | 'general' | ''
  status?: string
  month?: string
  dateFrom?: string
  dateTo?: string
  page?: number
}

export function useExpenses(filters?: ExpenseFilters) {
  return useQuery({
    queryKey: ['expenses', filters],
    queryFn: async () => {
      const res = await api.get('/expenses', { params: { ...filters, limit: 50 } })
      return res.data.data as {
        expenses: PfiExpense[]
        totals: {
          count: number; total: number; pfiTotal: number
          generalTotal: number; paidTotal: number; openTotal: number
        }
        /** Deliberately ignores the status filter, so the tabs keep their counts. */
        statusCounts: Record<string, number>
        banks: string[]
        /** 'own' when the viewer is outside the oversight roles. */
        scope: 'own' | 'all'
        can_review: boolean
        pagination: { page: number; limit: number; total: number; totalPages: number }
      }
    },
  })
}

export function useExpenseCategories() {
  return useQuery({
    queryKey: ['expenses', 'categories'],
    staleTime: 60 * 1000,
    queryFn: async () => {
      const res = await api.get('/expenses/categories')
      return res.data.data as {
        categories: ExpenseCategory[]
        general: ExpenseCategory[]
        pfi: ExpenseCategory[]
      }
    },
  })
}

export const useSaveExpense = () =>
  useMoneyMutation<{ id?: number; data: Record<string, any> }>(
    async ({ id, data }) =>
      (id ? await api.patch(`/expenses/${id}`, data) : await api.post('/expenses', data)).data,
    'Expense saved',
  )

/** One expense with its attachments and full review history. */
export function useExpenseDetail(id: number | null) {
  return useQuery({
    enabled: id != null,
    queryKey: ['expenses', 'detail', id],
    queryFn: async () => (await api.get(`/expenses/${id}`)).data.data.expense as PfiExpense,
  })
}

/**
 * The only call that moves status.
 *
 * Invalidates the PFI queries too: approving changes a cargo's cost, so its
 * screens have to refresh alongside this one.
 */
export const useReviewExpense = () =>
  useMoneyMutation<{ id: number; action: ExpenseAction; note?: string }>(
    async ({ id, action, note }) =>
      (await api.post(`/expenses/${id}/review`, { action, note: note || '' })).data,
    'Expense updated',
  )

export const useDeleteExpense = () =>
  useMoneyMutation<number>(async (id) => (await api.delete(`/expenses/${id}`)).data, 'Expense deleted')

/** Quick-add from inside the PFI drawer; the category is resolved server-side. */
export const useAddPfiExpense = () =>
  useMoneyMutation<{ pfiId: number; data: Record<string, any> }>(
    async ({ pfiId, data }) => (await api.post(`/pfis/${pfiId}/expenses`, data)).data,
    'Expense recorded',
  )

export const useSaveCategory = () =>
  useMoneyMutation<{ id?: number; name: string }>(
    async ({ id, name }) =>
      (id
        ? await api.patch(`/expenses/categories/${id}`, { name })
        : await api.post('/expenses/categories', { name })
      ).data,
    'Category saved',
  )

export const useDeleteCategory = () =>
  useMoneyMutation<number>(
    async (id) => (await api.delete(`/expenses/categories/${id}`)).data,
    'Category deleted',
  )

// ─── PFI actions ────────────────────────────────────────────────────────────

/**
 * Closing returns any gap between the figures typed at closure and the ones
 * the system computed, plus a warning when stock is still on the books.
 */
export const useFinishPfi = () =>
  useMoneyMutation<{ id: number; data: Record<string, any> }>(
    async ({ id, data }) => (await api.post(`/pfis/${id}/finish`, data)).data,
    'PFI closed',
  )

export const useAssignOrders = () =>
  useMoneyMutation<{ pfiId: number; orderIds: number[] }>(
    async ({ pfiId, orderIds }) =>
      (await api.post('/pfis/assign-orders', { pfi_id: pfiId, order_ids: orderIds })).data,
    'Orders assigned',
  )

export function useDepotsForFilter() {
  return useQuery({
    queryKey: ['depots', 'filter'],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const res = await api.get('/depots')
      return (res.data.data.depots || []) as Array<{ _id: string; name: string }>
    },
  })
}

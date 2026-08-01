import { useState, useMemo, useCallback } from 'react'
import { createFileRoute, useNavigate, useRouterState } from '@tanstack/react-router'
import { Card, CardContent } from '#/components/ui/card'
import { Button } from '#/components/ui/button'
import { Badge } from '#/components/ui/badge'
import { Input } from '#/components/ui/input'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '#/components/ui/table'
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription,
} from '#/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu'
import {
  ArrowLeft, Edit, ShieldAlert,
  Loader2, Fuel, Plus, Banknote, Receipt, Trash2, Pencil, ChevronDown,
  Wallet, TrendingUp, Calendar as CalendarIcon,
  Truck, MapPin, User,
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { useFilingStations } from '#/lib/hooks/useFilingStations'
import { useDeliveryCustomerList } from '#/lib/hooks/useDeliveryCustomers'
import { useDeliverySalesList, useCreateDeliverySale, useUpdateDeliverySale, useDeleteDeliverySale } from '#/lib/hooks/useDeliverySales'
import { useDeliveryInventoryList } from '#/lib/hooks/useDeliveryInventory'
import { useToast } from '#/lib/hooks/useToast'
import { cn, toNum } from '#/lib/utils'
import type { FilingStation, DeliverySale, AccountEntry } from '#/lib/types'

export const Route = createFileRoute('/filing-stations/details')({
  validateSearch: (search: Record<string, unknown>) => ({
    stationId: (search.stationId as string) || '',
  }),
  component: FilingStationDetailsView,
})

import { BANK_ACCOUNTS } from '#/components/sales-ledger/SalesLedgerDialogs'

// ═══════════════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════════════

const fmt = (n: number) =>
  `₦${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const fmtQty = (n: number) =>
  n.toLocaleString(undefined, { maximumFractionDigits: 0 })

const formatWithCommas = (v: string): string => {
  const cleaned = v.replace(/[^0-9.]/g, '')
  const parts = cleaned.split('.')
  const intPart = (parts[0] || '').replace(/^0+(?=\d)/, '')
  const formatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  if (parts.length > 1) return `${formatted}.${parts[1]}`
  return formatted
}

const stripCommas = (v: string): string => v.replace(/,/g, '')

const normalizeCycleDate = (dateValue: string | undefined | null): string => {
  if (!dateValue) return ''
  const raw = String(dateValue).trim()
  if (!raw) return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw
  try {
    return format(parseISO(raw), 'yyyy-MM-dd')
  } catch {
    return raw.split('T')[0] || raw
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

type EntryTab = 'sale' | 'deposit' | 'expense'

interface QuickPaymentForm {
  payment_amount: string
  rate: string
  quantity: string
  date_of_payment: string
  payer_name: string
  phone_number: string
  bank_account_id: string
  deposit_status: 'pending' | 'confirmed'
  remarks: string
}

interface LedgerGroup {
  key: string
  loadingId?: string
  stationId: string
  stationName: string
  truckNumber: string
  dateLoaded: string
  depot: string
  location: string
  quantity: number
  totalQtySold: number
  rate: number
  expected: number
  totalPaid: number
  totalExpenses: number
  balance: number
  code: string
  payments: DeliverySale[]
  collectionAccounts: AccountEntry[]
  remittanceAccounts: AccountEntry[]
}

// ═══════════════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════════════

function FilingStationDetailsView() {
  const navigate = useNavigate()
  const routerState = useRouterState()
  const searchParams = Route.useSearch()
  const state = (routerState.location.state || {}) as {
    station?: FilingStation
    ledgerGroup?: LedgerGroup
  }
  const toast = useToast()

  const { data: stations = [], isLoading: isLoadingStations } = useFilingStations()
  const { data: customerListRes, isLoading: isLoadingCustomers } = useDeliveryCustomerList({ type: 'filling_station' })
  const { data: allSales = [], isLoading: isLoadingSales } = useDeliverySalesList()
  const { data: allLoadings = [], isLoading: isLoadingInventory } = useDeliveryInventoryList()

  const createSaleMutation = useCreateDeliverySale()
  const updateSaleMutation = useUpdateDeliverySale()
  const deleteSaleMutation = useDeleteDeliverySale()

  const deliveryCustomers = useMemo(() => {
    if (!customerListRes) return []
    if (Array.isArray(customerListRes)) return customerListRes
    if (Array.isArray(customerListRes.customers)) return customerListRes.customers
    if (Array.isArray(customerListRes.results)) return customerListRes.results
    return []
  }, [customerListRes])

  const targetStationId = searchParams.stationId || state.station?._id || String((state.station as any)?.id || '')
  
  const station = useMemo(() => {
    if (state.station) return state.station
    const foundInStations = stations.find(s => String(s._id || (s as any).id) === targetStationId)
    if (foundInStations) return foundInStations
    const foundInCusts = deliveryCustomers.find((c: any) => String(c._id || c.id) === targetStationId)
    if (foundInCusts) {
      return {
        _id: String(foundInCusts._id || foundInCusts.id),
        name: foundInCusts.name || foundInCusts.customer_name || 'Station',
        customerCode: foundInCusts.customerCode,
        contactPerson: foundInCusts.contactPerson || foundInCusts.contact_person,
        contactPersonPhone: foundInCusts.contactPersonPhone || foundInCusts.contact_person_phone,
        phoneNumber: foundInCusts.phoneNumber || foundInCusts.phone_number,
        tankCapacity: foundInCusts.tankCapacity || foundInCusts.tank_capacity || 0,
        pumpCount: foundInCusts.pumpCount || foundInCusts.pump_count || 0,
        status: foundInCusts.status || 'active',
      } as FilingStation
    }
    return null
  }, [state.station, stations, deliveryCustomers, targetStationId])

  // ── Filter sales & inventory to only this station ──────────────────
  const stationId = String(station?._id || (station as any)?.id || '')
  const stationOnlySales = useMemo(() =>
    allSales.filter(s => String(s.customerId) === stationId || s.customerName === station?.name),
    [allSales, stationId, station?.name])

  const stationOnlyLoadings = useMemo(() =>
    allLoadings.filter(l => String(l.customerId) === stationId || l.customerName === station?.name),
    [allLoadings, stationId, station?.name])

  // ── Recording dialog state ─────────────────────────────────────────
  const [recordDialogOpen, setRecordDialogOpen] = useState(false)
  const [activeEntryTab, setActiveEntryTab] = useState<EntryTab>('sale')
  const [selectedGroup, setSelectedGroup] = useState<LedgerGroup | null>(state.ledgerGroup || null)
  const [quickForm, setQuickForm] = useState<QuickPaymentForm>({
    payment_amount: '', rate: '', quantity: '', date_of_payment: format(new Date(), 'yyyy-MM-dd'),
    payer_name: '', phone_number: '', bank_account_id: '1', deposit_status: 'confirmed', remarks: '',
  })
  const [saving, setSaving] = useState(false)

  // ── Edit dialog state ──────────────────────────────────────────────
  const [editTarget, setEditTarget] = useState<DeliverySale | null>(null)
  const [editForm, setEditForm] = useState<{
    quantity: string; rate: string; payment_amount: string; expenses_amount: string
    payer_name: string; bank_account_id: string; deposit_status: 'pending' | 'confirmed'
    phone_number: string; remarks: string; date_of_payment: string
  } | null>(null)
  const [editSaving, setEditSaving] = useState(false)

  // ── Delete state ───────────────────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState<{ ids: string[]; label: string } | null>(null)
  const [deleting, setDeleting] = useState(false)

  // ── Ledger groups for this station ─────────────────────────────────
  const stationGroups = useMemo(() => {
    const stationSales = stationOnlySales
    const stationLoadings = stationOnlyLoadings
    const groups: LedgerGroup[] = []
    const matchedIds = new Set<string>()
    const salesByTruckDate = new Map<string, DeliverySale[]>()

    const getObjId = (obj: any) => String(obj?._id || obj?.id || '')

    stationSales.forEach(sale => {
      const key = `${(sale.truckNumber || '').toUpperCase()}||${normalizeCycleDate(sale.dateLoaded)}`
      const arr = salesByTruckDate.get(key) ?? []
      arr.push(sale)
      salesByTruckDate.set(key, arr)
    })

    const sortPayments = (p: DeliverySale[]) => [...p].sort((a, b) => {
      const dA = a.dateOfPayment || a.createdAt || a.dateLoaded || ''
      const dB = b.dateOfPayment || b.createdAt || b.dateLoaded || ''
      return dA.localeCompare(dB) || getObjId(a).localeCompare(getObjId(b))
    })

    stationLoadings.forEach(loading => {
      const loadingId = getObjId(loading)
      const truckKey = `${(loading.truckNumber || '').toUpperCase()}||${normalizeCycleDate(loading.dateAllocated)}`
      const cycleSales = salesByTruckDate.get(truckKey) || []
      let payments = cycleSales.filter(s => !matchedIds.has(getObjId(s)))
      payments = sortPayments(payments)
      payments.forEach(p => matchedIds.add(getObjId(p)))

      const quantity = toNum(loading.quantityAllocated) || payments.reduce((max, s) => Math.max(max, toNum(s.quantity)), 0)
      const dailySales = payments.filter(s => toNum(s.quantity) > 0 && toNum(s.quantity) < quantity)
      const expected = dailySales.reduce((sum, s) => sum + toNum(s.salesValue), 0)
      const rate = dailySales.reduce((max, s) => Math.max(max, toNum(s.rate)), 0) || payments.reduce((max, s) => Math.max(max, toNum(s.rate)), 0)
      const totalPaid = payments.reduce((sum, s) => sum + toNum(s.paymentAmount), 0)
      const totalExpenses = payments.reduce((sum, s) => sum + toNum(s.expensesAmount ?? 0), 0)
      const totalQtySold = dailySales.reduce((sum, s) => sum + toNum(s.quantity), 0)

      groups.push({
        key: `loading:${loadingId}`,
        loadingId: loadingId,
        stationId,
        stationName: station?.name || loading.customerName || '',
        truckNumber: loading.truckNumber || '',
        dateLoaded: loading.dateAllocated || payments[0]?.dateLoaded || '',
        depot: loading.depot || loading.pfiLocation || '',
        location: loading.location || '',
        quantity, totalQtySold, rate, expected, totalPaid, totalExpenses,
        balance: expected - (totalPaid + totalExpenses),
        code: loading.allocationCode || payments.map(s => s.allocationCode).find(Boolean) || '',
        payments,
        collectionAccounts: (loading.collectionAccounts?.length ? loading.collectionAccounts : payments[0]?.collectionAccounts) || [],
        remittanceAccounts: (loading.remittanceAccounts?.length ? loading.remittanceAccounts : payments[0]?.remittanceAccounts) || [],
      })
    })

    // Unmatched sales
    const unmatched = new Map<string, DeliverySale[]>()
    stationSales.forEach(s => {
      const sId = getObjId(s)
      if (matchedIds.has(sId)) return
      const key = `${(s.truckNumber || '').toUpperCase()}||${normalizeCycleDate(s.dateLoaded)}`
      const arr = unmatched.get(key) ?? []
      arr.push(s)
      unmatched.set(key, arr)
    })

    unmatched.forEach((payments, key) => {
      const sorted = sortPayments(payments)
      const quantity = payments.reduce((max, s) => Math.max(max, toNum(s.quantity)), 0)
      const dailySales = payments.filter(s => toNum(s.quantity) > 0 && toNum(s.quantity) < quantity)
      const expected = dailySales.reduce((sum, s) => sum + toNum(s.salesValue), 0)
      const totalPaid = payments.reduce((sum, s) => sum + toNum(s.paymentAmount), 0)
      const totalExpenses = payments.reduce((sum, s) => sum + toNum(s.expensesAmount ?? 0), 0)
      const totalQtySold = dailySales.reduce((sum, s) => sum + toNum(s.quantity), 0)

      groups.push({
        key: `sale:${key}`,
        stationId,
        stationName: station?.name || '',
        truckNumber: sorted[0]?.truckNumber || '',
        dateLoaded: sorted[0]?.dateLoaded || '',
        depot: sorted[0]?.depotLoaded || '',
        location: sorted[0]?.location || '',
        quantity, totalQtySold,
        rate: dailySales.reduce((max, s) => Math.max(max, toNum(s.rate)), 0) || sorted.reduce((max, s) => Math.max(max, toNum(s.rate)), 0),
        expected, totalPaid, totalExpenses,
        balance: expected - (totalPaid + totalExpenses),
        code: sorted[0]?.allocationCode || sorted.map(s => s.allocationCode).find(Boolean) || '',
        payments: sorted,
        collectionAccounts: sorted.map(s => s.collectionAccounts).find(a => a && a.length) || [],
        remittanceAccounts: sorted.map(s => s.remittanceAccounts).find(a => a && a.length) || [],
      })
    })

    return groups.sort((a, b) => (b.dateLoaded || '').localeCompare(a.dateLoaded || ''))
  }, [station, stationOnlySales, stationOnlyLoadings, stationId])

  // ── Totals for this station ────────────────────────────────────────
  const stationTotals = useMemo(() => {
    let expected = 0, paid = 0, expenses = 0, qtyAlloc = 0, qtySold = 0
    stationGroups.forEach(g => {
      qtyAlloc += Math.max(0, g.quantity)
      qtySold += Math.max(0, g.totalQtySold)
      expected += Math.max(0, g.expected)
      paid += g.totalPaid
      expenses += g.totalExpenses
    })
    return { expected, paid, expenses, balance: expected - (paid + expenses), qtyAlloc, qtySold, entries: stationGroups.reduce((s, g) => s + g.payments.length, 0) }
  }, [stationGroups])

  // ── Handlers ───────────────────────────────────────────────────────
  const openRecordDialog = (group: LedgerGroup, tab: EntryTab = 'sale') => {
    setSelectedGroup(group)
    setActiveEntryTab(tab)
    setQuickForm({
      payment_amount: '', rate: group.rate > 0 ? String(group.rate) : '', quantity: '',
      date_of_payment: format(new Date(), 'yyyy-MM-dd'), payer_name: '',
      phone_number: '', bank_account_id: '1', deposit_status: 'confirmed', remarks: '',
    })
    setRecordDialogOpen(true)
  }

  const handleRecordSave = useCallback(async () => {
    if (!selectedGroup || !station) return
    setSaving(true)
    try {
      if (activeEntryTab === 'sale') {
        const qty = Number(stripCommas(quickForm.quantity))
        const rate = Number(stripCommas(quickForm.rate))
        if (!qty || qty <= 0) { toast.error('Enter a valid volume'); setSaving(false); return }
        if (!rate || rate <= 0) { toast.error('Enter a valid rate'); setSaving(false); return }

        await createSaleMutation.mutateAsync({
          truckNumber: selectedGroup.truckNumber,
          dateLoaded: selectedGroup.dateLoaded || undefined,
          depotLoaded: selectedGroup.depot || undefined,
          customerId: station._id as any,
          customerName: station.name,
          location: selectedGroup.location || undefined,
          quantity: qty, rate, salesValue: qty * rate,
          paymentAmount: 0,
          dateOfPayment: quickForm.date_of_payment || format(new Date(), 'yyyy-MM-dd'),
          remarks: quickForm.remarks.trim() || `Daily sale: ${qty.toLocaleString()}L @ ₦${rate.toLocaleString()}/L`,
          allocationCode: selectedGroup.code || undefined,
        })
        toast.success(`Daily sale recorded · ${qty.toLocaleString()} L @ ₦${rate.toLocaleString()}/L`)
      } else if (activeEntryTab === 'deposit') {
        const amount = Number(stripCommas(quickForm.payment_amount))
        if (!amount || amount <= 0) { toast.error('Enter a valid amount'); setSaving(false); return }
        if (!quickForm.bank_account_id) { toast.error('Select a bank account'); setSaving(false); return }

        const bankAcct = BANK_ACCOUNTS.find(b => String(b.id) === quickForm.bank_account_id)
        const bankStr = bankAcct ? `${bankAcct.account_number} · ${bankAcct.bank_name}` : undefined

        await createSaleMutation.mutateAsync({
          truckNumber: selectedGroup.truckNumber,
          dateLoaded: selectedGroup.dateLoaded || undefined,
          depotLoaded: selectedGroup.depot || undefined,
          customerId: station._id as any,
          customerName: station.name,
          location: selectedGroup.location || undefined,
          quantity: 0, rate: 0, salesValue: 0,
          paymentAmount: amount,
          payerName: quickForm.payer_name.trim() || undefined,
          bank: bankStr,
          dateOfPayment: quickForm.date_of_payment || format(new Date(), 'yyyy-MM-dd'),
          depositStatus: quickForm.deposit_status,
          phoneNumber: quickForm.phone_number.trim() || undefined,
          remarks: quickForm.remarks.trim() || `Bank Deposit: ₦${amount.toLocaleString()}`,
          allocationCode: selectedGroup.code || undefined,
        })
        toast.success(`Deposit recorded · ₦${amount.toLocaleString()}`)
      } else {
        const amount = Number(stripCommas(quickForm.payment_amount))
        if (!amount || amount <= 0) { toast.error('Enter a valid expense amount'); setSaving(false); return }
        if (!quickForm.remarks.trim()) { toast.error('Enter an expense description'); setSaving(false); return }

        await createSaleMutation.mutateAsync({
          truckNumber: selectedGroup.truckNumber,
          dateLoaded: selectedGroup.dateLoaded || undefined,
          depotLoaded: selectedGroup.depot || undefined,
          customerId: station._id as any,
          customerName: station.name,
          location: selectedGroup.location || undefined,
          quantity: 0, rate: 0, salesValue: 0, paymentAmount: 0,
          expensesAmount: amount,
          payerName: 'EXPENSE', bank: 'EXPENSE',
          dateOfPayment: quickForm.date_of_payment || format(new Date(), 'yyyy-MM-dd'),
          remarks: quickForm.remarks.trim(),
          allocationCode: selectedGroup.code || undefined,
        })
        toast.success(`Expense recorded · ₦${amount.toLocaleString()}`)
      }
      setRecordDialogOpen(false)
    } catch {
      toast.error('Failed to save record')
    } finally {
      setSaving(false)
    }
  }, [selectedGroup, station, activeEntryTab, quickForm, createSaleMutation, toast])

  const openEditDialog = (entry: DeliverySale, group: LedgerGroup) => {
    setSelectedGroup(group)
    setEditTarget(entry)
    setEditForm({
      quantity: toNum(entry.quantity) > 0 ? formatWithCommas(String(toNum(entry.quantity))) : '',
      rate: toNum(entry.rate) > 0 ? formatWithCommas(String(toNum(entry.rate))) : '',
      payment_amount: toNum(entry.paymentAmount) > 0 ? formatWithCommas(String(toNum(entry.paymentAmount))) : '',
      expenses_amount: toNum(entry.expensesAmount ?? 0) > 0 ? formatWithCommas(String(toNum(entry.expensesAmount ?? 0))) : '',
      payer_name: entry.payerName || '',
      bank_account_id: (() => {
        if (!entry.bank) return ''
        const match = BANK_ACCOUNTS.find(b => entry.bank.startsWith(b.account_number) || entry.bank.includes(b.account_number))
        return match ? String(match.id) : ''
      })(),
      deposit_status: entry.depositStatus === 'confirmed' ? 'confirmed' : 'pending',
      phone_number: entry.phoneNumber || '',
      remarks: entry.remarks || '',
      date_of_payment: entry.dateOfPayment || format(new Date(), 'yyyy-MM-dd'),
    })
  }

  const handleEditSave = useCallback(async () => {
    if (!editTarget || !editForm || !selectedGroup || !station) return
    const entryId = String(editTarget._id || editTarget.id || '')
    if (!entryId) return

    setEditSaving(true)
    try {
      const qty = Number(stripCommas(editForm.quantity)) || 0
      const rate = Number(stripCommas(editForm.rate)) || 0
      const pa = Number(stripCommas(editForm.payment_amount)) || 0
      const ea = Number(stripCommas(editForm.expenses_amount)) || 0
      const bankAcct = editForm.bank_account_id ? BANK_ACCOUNTS.find(b => String(b.id) === editForm.bank_account_id) : null
      const bankStr = bankAcct ? `${bankAcct.account_number} · ${bankAcct.bank_name}` : editTarget.bank || undefined

      await updateSaleMutation.mutateAsync({
        id: entryId,
        data: {
          quantity: qty, rate, salesValue: qty * rate,
          paymentAmount: pa, expensesAmount: ea,
          payerName: editForm.payer_name.trim() || undefined,
          bank: bankStr,
          dateOfPayment: editForm.date_of_payment,
          depositStatus: editForm.deposit_status,
          phoneNumber: editForm.phone_number.trim() || undefined,
          remarks: editForm.remarks.trim() || undefined,
        },
      })
      toast.success('Entry updated')
      setEditTarget(null)
      setEditForm(null)
    } catch {
      toast.error('Update failed')
    } finally {
      setEditSaving(false)
    }
  }, [editTarget, editForm, selectedGroup, station, updateSaleMutation, toast])

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await Promise.all(deleteTarget.ids.map(id => deleteSaleMutation.mutateAsync(id)))
      toast.success('Entry deleted')
      setDeleteTarget(null)
    } catch {
      toast.error('Delete failed')
    } finally {
      setDeleting(false)
    }
  }, [deleteTarget, deleteSaleMutation, toast])

  // ── Deposit Status Quick Toggle ───────────────────────────────────
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null)

  const handleToggleDepositStatus = useCallback(async (entry: DeliverySale) => {
    const entryId = String(entry._id || entry.id || '')
    if (!entryId) return
    const nextStatus = entry.depositStatus === 'confirmed' ? 'pending' : 'confirmed'
    setUpdatingStatusId(entryId)
    try {
      await updateSaleMutation.mutateAsync({ id: entryId, data: { depositStatus: nextStatus } })
      toast.success(`Deposit status changed to ${nextStatus}`)
    } catch {
      toast.error('Failed to update status')
    } finally {
      setUpdatingStatusId(null)
    }
  }, [updateSaleMutation, toast])

  // ── Loading / Not found ────────────────────────────────────────────
  if (!station && (isLoadingStations || isLoadingCustomers)) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-7 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!station) {
    return (
      <div className="p-8 text-center max-w-md mx-auto my-12 bg-card rounded-xl border border-border">
        <ShieldAlert className="size-10 mx-auto text-muted-foreground mb-4" />
        <h3 className="font-semibold text-lg">Filing Station not selected</h3>
        <p className="text-sm text-muted-foreground mt-1">Please select a valid station from the directory.</p>
        <Button onClick={() => navigate({ to: '/filing-stations' })} className="mt-4">
          Go back to list
        </Button>
      </div>
    )
  }

  const isLoading = isLoadingSales || isLoadingInventory

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="cursor-pointer" onClick={() => navigate({ to: '/filing-stations' })}>
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">{station.name}</h1>
              {station.customerCode && (
                <Badge variant="outline" className="font-mono text-xs uppercase">{station.customerCode}</Badge>
              )}
              <Badge className={cn(
                station.status === 'active' ? 'bg-accent/10 text-accent border-accent/20' :
                  station.status === 'dormant' ? 'bg-warning/10 text-warning border-warning/20' :
                    'bg-destructive/10 text-destructive border-destructive/20'
              )}>{station.status}</Badge>
            </div>
            <p className="text-muted-foreground text-sm mt-0.5">
              {station.contactPerson || 'Soroman'} · {station.tankCapacity?.toLocaleString()} L capacity · {station.pumpCount} pumps
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="cursor-pointer"
            onClick={() => navigate({ to: '/delivery-customer/details', search: { customerId: String(station._id || (station as any).id) } })}>
            <User className="size-3.5 mr-1.5" /> Customer Profile
          </Button>
          <Button size="sm" variant="outline" className="cursor-pointer"
            onClick={() => navigate({ to: '/filing-stations/form', search: { customerId: String(station._id || (station as any).id) }, state: { station, isEdit: true } as any })}>
            <Edit className="size-3.5 mr-1.5" /> Edit Station
          </Button>
        </div>
      </div>

      {/* Station Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground">Tank Capacity</div>
              <div className="text-xl font-semibold text-foreground tabular-nums">{(station.tankCapacity || 0).toLocaleString()} L</div>
            </div>
            <div className="p-2.5 rounded-xl bg-muted/10 text-muted-foreground"><Fuel className="size-5" /></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground">Allocations</div>
              <div className="text-xl font-semibold text-foreground tabular-nums">{stationGroups.length}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-accent/10 text-accent"><Truck className="size-5" /></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground">Expected Revenue</div>
              <div className="text-lg font-semibold text-foreground">{fmt(stationTotals.expected)}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-muted/10 text-muted-foreground"><TrendingUp className="size-5" /></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground">Outstanding</div>
              <div className={cn('text-lg font-semibold', stationTotals.balance > 0 ? 'text-destructive' : stationTotals.balance < 0 ? 'text-muted-foreground' : 'text-accent')}>
                {stationTotals.balance === 0 ? '✓ Settled' : stationTotals.balance > 0 ? fmt(stationTotals.balance) : `+${fmt(Math.abs(stationTotals.balance))}`}
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-warning/10 text-warning"><Wallet className="size-5" /></div>
          </CardContent>
        </Card>
      </div>

      {/* Ledger Groups */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : stationGroups.length === 0 ? (
          <div className="bg-card rounded-xl border border-border p-16 text-center">
            <Fuel className="size-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground font-medium">No allocations found for this station</p>
            <p className="text-sm text-muted-foreground/70 mt-1">Allocations will appear here once trucks are assigned to this station.</p>
          </div>
        ) : (
          stationGroups.map((group) => (
            <div key={group.key} className="bg-card rounded-xl border border-border overflow-hidden">
              {/* Group Header */}
              <div className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-foreground text-sm uppercase tracking-tight">
                        {group.truckNumber || 'Unassigned Truck'}
                      </h3>
                      {group.code && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-muted/10 text-foreground dark:text-muted-foreground border-border/20">
                          {group.code}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1">
                        <CalendarIcon className="size-3" />
                        {group.dateLoaded ? (() => { try { return format(parseISO(group.dateLoaded), 'dd MMM yyyy') } catch { return group.dateLoaded } })() : '—'}
                      </span>
                      {group.location && <><span className="text-muted-foreground/40">·</span><span className="flex items-center gap-1"><MapPin className="size-3" />{group.location}</span></>}
                      {group.depot && <><span className="text-muted-foreground/40">·</span><span>{group.depot}</span></>}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" className="h-8 text-xs gap-1.5 bg-accent hover:bg-accent/80 text-accent-foreground font-semibold cursor-pointer">
                          <Plus className="size-3.5" /> Record <ChevronDown className="size-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem onClick={() => openRecordDialog(group, 'sale')} className="gap-2 text-xs cursor-pointer">
                          <Fuel className="size-3.5 text-accent" /> Daily Sale
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openRecordDialog(group, 'deposit')} className="gap-2 text-xs cursor-pointer">
                          <Banknote className="size-3.5 text-muted-foreground" /> Bank Deposit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openRecordDialog(group, 'expense')} className="gap-2 text-xs cursor-pointer">
                          <Receipt className="size-3.5 text-warning" /> Expense
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Summary */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-border">
                  <div className="space-y-0.5">
                    <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground font-semibold">Allocated</p>
                    <p className="text-sm font-semibold text-foreground">{group.quantity > 0 ? `${fmtQty(group.quantity)} L` : '—'}</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground font-semibold">Sold</p>
                    <p className="text-sm font-semibold text-foreground">{group.totalQtySold > 0 ? `${fmtQty(group.totalQtySold)} L` : '—'}</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground font-semibold">Deposited</p>
                    <p className="text-sm font-semibold text-accent">{group.totalPaid > 0 ? fmt(group.totalPaid) : '—'}</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground font-semibold">Balance</p>
                    <p className={cn('text-sm font-semibold', group.balance === 0 ? 'text-accent' : group.balance > 0 ? 'text-destructive' : 'text-muted-foreground')}>
                      {group.balance === 0 ? '✓ Settled' : group.balance > 0 ? fmt(group.balance) : `+${fmt(Math.abs(group.balance))}`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Ledger Table */}
              {group.payments.filter(p => toNum(p.quantity) > 0 || toNum(p.paymentAmount) > 0 || toNum(p.expensesAmount ?? 0) > 0).length > 0 && (
                <div className="border-t border-border">
                  <div className="overflow-x-auto">
                    <Table className="text-xs">
                      <TableHeader>
                        <TableRow className="bg-muted/30 border-b border-border">
                          <TableHead className="font-semibold text-muted-foreground w-[36px] px-4">#</TableHead>
                          <TableHead className="font-semibold text-muted-foreground">Date</TableHead>
                          <TableHead className="font-semibold text-muted-foreground text-right">Volume</TableHead>
                          <TableHead className="font-semibold text-muted-foreground text-right">Rate</TableHead>
                          <TableHead className="font-semibold text-muted-foreground text-right">Sales Value</TableHead>
                          <TableHead className="font-semibold text-muted-foreground text-right">Deposits</TableHead>
                          <TableHead className="font-semibold text-muted-foreground">Depositor</TableHead>
                          <TableHead className="font-semibold text-muted-foreground">Bank</TableHead>
                          <TableHead className="font-semibold text-muted-foreground">Status</TableHead>
                          <TableHead className="font-semibold text-muted-foreground text-right">Expenses</TableHead>
                          <TableHead className="font-semibold text-muted-foreground text-center w-[70px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {group.payments
                          .filter(p => toNum(p.quantity) > 0 || toNum(p.paymentAmount) > 0 || toNum(p.expensesAmount ?? 0) > 0)
                          .sort((a, b) => (a.dateOfPayment || a.dateLoaded || '').localeCompare(b.dateOfPayment || b.dateLoaded || ''))
                          .map((entry, idx) => {
                            const entryId = String(entry._id || entry.id || '')
                            const saleQty = toNum(entry.quantity)
                            const saleRate = toNum(entry.rate)
                            const saleVal = toNum(entry.salesValue)
                            const depositAmt = toNum(entry.paymentAmount)
                            const expenseAmt = toNum(entry.expensesAmount ?? 0)
                            const isSale = saleQty > 0 && saleQty < group.quantity
                            const isConfirmed = entry.depositStatus === 'confirmed'
                            const entryDate = entry.dateOfPayment || entry.dateLoaded || ''

                            return (
                              <TableRow key={entryId || idx} className="hover:bg-muted/30 border-b border-border/50">
                                <TableCell className="px-4 text-muted-foreground">{idx + 1}</TableCell>
                                <TableCell className="text-muted-foreground whitespace-nowrap font-medium">
                                  {entryDate ? (() => { try { return format(parseISO(entryDate), 'dd MMM yy') } catch { return entryDate } })() : '—'}
                                </TableCell>
                                <TableCell className="text-right font-semibold text-foreground">{isSale ? `${fmtQty(saleQty)} L` : '—'}</TableCell>
                                <TableCell className="text-right text-muted-foreground">{isSale ? `₦${saleRate.toLocaleString()}` : '—'}</TableCell>
                                <TableCell className="text-right text-foreground font-medium">{isSale ? fmt(saleVal) : '—'}</TableCell>
                                <TableCell className="text-right font-semibold text-accent">{depositAmt > 0 ? fmt(depositAmt) : '—'}</TableCell>
                                <TableCell className="text-muted-foreground">{entry.payerName || '—'}</TableCell>
                                <TableCell className="text-muted-foreground">{entry.bank ? entry.bank.split(' · ')[1] || entry.bank : '—'}</TableCell>
                                <TableCell>
                                  {depositAmt > 0 ? (
                                    <button
                                      type="button"
                                      disabled={updatingStatusId === entryId}
                                      onClick={() => handleToggleDepositStatus(entry)}
                                      title="Click to toggle status (Confirmed / Pending)"
                                      className={cn('inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border transition-all cursor-pointer hover:opacity-80 duration-250 ease-luxe', isConfirmed ? 'bg-accent/10 text-accent border-accent/40' : 'bg-warning/10 text-warning border-warning/40')}
                                    >
                                      {updatingStatusId === entryId && <Loader2 className="size-2.5 animate-spin" />}
                                      {isConfirmed ? 'Confirmed' : 'Pending'}
                                    </button>
                                  ) : '—'}
                                </TableCell>
                                <TableCell className="text-right text-warning">{expenseAmt > 0 ? fmt(expenseAmt) : '—'}</TableCell>
                                <TableCell className="text-center">
                                  <div className="flex gap-0.5 items-center justify-center">
                                    <Button type="button" size="sm" variant="ghost" className="size-6 p-0 text-muted-foreground hover:text-foreground cursor-pointer" title="Edit"
                                      onClick={() => openEditDialog(entry, group)}>
                                      <Pencil className="size-3" />
                                    </Button>
                                    <Button type="button" size="sm" variant="ghost" className="size-6 p-0 text-muted-foreground hover:text-destructive cursor-pointer" title="Delete"
                                      onClick={() => setDeleteTarget({ ids: [entryId], label: `entry on ${entryDate}` })}>
                                      <Trash2 className="size-3" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )
                          })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Station Totals Bar */}
      {stationGroups.length > 0 && (
        <div className="bg-foreground text-background rounded-xl px-5 sm:px-6 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-xs uppercase tracking-[0.22em] text-background/60 font-semibold">
              Station Total · {stationGroups.length} allocation{stationGroups.length === 1 ? '' : 's'} · {stationTotals.entries} entries
            </p>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
              <div><span className="text-background/50 text-[11px] uppercase tracking-[0.14em] mr-1.5">Expected</span><span className="font-semibold">{fmt(stationTotals.expected)}</span></div>
              <div><span className="text-background/50 text-[11px] uppercase tracking-[0.14em] mr-1.5">Deposited</span><span className="font-semibold text-accent">{fmt(stationTotals.paid)}</span></div>
              <div><span className="text-background/50 text-[11px] uppercase tracking-[0.14em] mr-1.5">Expenses</span><span className="font-semibold text-warning">{fmt(stationTotals.expenses)}</span></div>
              <div><span className="text-background/50 text-[11px] uppercase tracking-[0.14em] mr-1.5">Balance</span>
                <span className={cn('font-semibold', stationTotals.balance > 0 ? 'text-destructive' : 'text-accent')}>
                  {stationTotals.balance === 0 ? '₦0.00 ✓' : stationTotals.balance > 0 ? fmt(stationTotals.balance) : `+${fmt(Math.abs(stationTotals.balance))}`}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Record Dialog ──────────────────────────────────────────── */}
      <Dialog open={recordDialogOpen} onOpenChange={setRecordDialogOpen}>
        <DialogContent className="sm:max-w-[540px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className={cn('p-2 rounded-lg', activeEntryTab === 'sale' ? 'bg-muted' : activeEntryTab === 'deposit' ? 'bg-accent/10' : 'bg-warning/10')}>
                {activeEntryTab === 'sale' ? <Fuel className="size-5 text-muted-foreground" /> :
                  activeEntryTab === 'deposit' ? <Banknote className="size-5 text-accent" /> :
                    <Receipt className="size-5 text-warning" />}
              </div>
              <div>
                <h2 className="text-lg font-semibold">
                  {activeEntryTab === 'sale' ? 'Record Daily Pump Sale' : activeEntryTab === 'deposit' ? 'Record Bank Deposit' : 'Record Daily Expense'}
                </h2>
                <p className="text-sm font-normal text-muted-foreground mt-0.5">
                  {selectedGroup ? `${selectedGroup.truckNumber} · ${selectedGroup.stationName}` : ''}
                </p>
              </div>
            </DialogTitle>
            <DialogDescription className="sr-only">Record daily fuel sales, bank deposits, or operating expenses</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Tab Switcher */}
            <div className="flex p-1 bg-muted rounded-lg mb-2 gap-1">
              {([
                { key: 'sale' as EntryTab, label: 'Daily Sale', icon: Fuel, color: 'text-muted-foreground' },
                { key: 'deposit' as EntryTab, label: 'Bank Deposit', icon: Banknote, color: 'text-accent' },
                { key: 'expense' as EntryTab, label: 'Daily Expense', icon: Receipt, color: 'text-warning' },
              ]).map(tab => (
                <button
                  key={tab.key}
                  type="button"
                  className={cn(
                    'flex-1 py-2 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1.5 cursor-pointer duration-250 ease-luxe',
                    activeEntryTab === tab.key
                      ? 'bg-card text-foreground border border-border/50'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                  onClick={() => setActiveEntryTab(tab.key)}
                >
                  <tab.icon className={cn('size-3.5', activeEntryTab === tab.key && tab.color)} />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Daily Sale Tab */}
            {activeEntryTab === 'sale' && (
              <div className="space-y-4 pt-1">
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Rate (₦/L) <span className="text-destructive">*</span></label>
                    <Input type="text" inputMode="decimal" placeholder="e.g. 1,300" className="h-9 text-sm"
                      value={quickForm.rate} onChange={e => setQuickForm(p => ({ ...p, rate: formatWithCommas(e.target.value) }))} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Volume Sold (Ltrs) <span className="text-destructive">*</span></label>
                    <Input type="text" inputMode="decimal" placeholder="e.g. 5,000" className="h-9 text-sm"
                      value={quickForm.quantity} onChange={e => setQuickForm(p => ({ ...p, quantity: formatWithCommas(e.target.value) }))} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Expected Value (₦)</label>
                    <Input readOnly className="h-9 text-sm bg-muted font-semibold text-foreground"
                      value={(() => {
                        const r = Number(stripCommas(quickForm.rate)) || 0
                        const q = Number(stripCommas(quickForm.quantity)) || 0
                        return r && q ? `₦${formatWithCommas(String(r * q))}` : '—'
                      })()} />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Date of Sale</label>
                    <Input type="date" className="h-9 text-sm" value={quickForm.date_of_payment}
                      onChange={e => setQuickForm(p => ({ ...p, date_of_payment: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Remarks</label>
                    <Input placeholder="Optional remarks" className="h-9 text-sm" value={quickForm.remarks}
                      onChange={e => setQuickForm(p => ({ ...p, remarks: e.target.value }))} />
                  </div>
                </div>
              </div>
            )}

            {/* Bank Deposit Tab */}
            {activeEntryTab === 'deposit' && (
              <div className="space-y-4 pt-1">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Amount Deposited (₦) <span className="text-destructive">*</span></label>
                    <Input type="text" inputMode="decimal" placeholder="e.g. 5,000,000" className="h-9 text-sm"
                      value={quickForm.payment_amount} onChange={e => setQuickForm(p => ({ ...p, payment_amount: formatWithCommas(e.target.value) }))} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Date of Deposit</label>
                    <Input type="date" className="h-9 text-sm" value={quickForm.date_of_payment}
                      onChange={e => setQuickForm(p => ({ ...p, date_of_payment: e.target.value }))} />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Bank Account <span className="text-destructive">*</span></label>
                    <select aria-label="Bank account" value={quickForm.bank_account_id}
                      onChange={e => setQuickForm(p => ({ ...p, bank_account_id: e.target.value }))}
                      className="h-8 w-full rounded-lg border border-input bg-background px-2.5 py-1 text-base md:text-sm">
                      <option value="">Select account…</option>
                      {BANK_ACCOUNTS.filter(b => b.is_active).map(b => (
                        <option key={b.id} value={String(b.id)}>{b.account_number} · {b.bank_name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Status</label>
                    <select aria-label="Status" value={quickForm.deposit_status}
                      onChange={e => setQuickForm(p => ({ ...p, deposit_status: e.target.value as 'pending' | 'confirmed' }))}
                      className="h-8 w-full rounded-lg border border-input bg-background px-2.5 py-1 text-base md:text-sm">
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Payer's Name</label>
                    <Input placeholder="Name only" className="h-9 text-sm" value={quickForm.payer_name}
                      onChange={e => setQuickForm(p => ({ ...p, payer_name: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Phone Number</label>
                    <Input className="h-9 text-sm" value={quickForm.phone_number}
                      onChange={e => setQuickForm(p => ({ ...p, phone_number: e.target.value }))} />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Remarks</label>
                  <Input placeholder="Optional remarks" className="h-9 text-sm" value={quickForm.remarks}
                    onChange={e => setQuickForm(p => ({ ...p, remarks: e.target.value }))} />
                </div>
              </div>
            )}

            {/* Daily Expense Tab */}
            {activeEntryTab === 'expense' && (
              <div className="space-y-4 pt-1">
                <div className="bg-warning/10 border border-warning/75 rounded-lg p-3 flex gap-2">
                  <Receipt className="size-4 text-warning shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-warning">Record Daily Expense</p>
                    <p className="text-[10px] text-warning mt-0.5">Record expenses like supplies, paper, maintenance etc.</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Expense Amount (₦) <span className="text-destructive">*</span></label>
                    <Input type="text" inputMode="decimal" placeholder="e.g. 50,000" className="h-9 text-sm"
                      value={quickForm.payment_amount} onChange={e => setQuickForm(p => ({ ...p, payment_amount: formatWithCommas(e.target.value) }))} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Date of Expense</label>
                    <Input type="date" className="h-9 text-sm" value={quickForm.date_of_payment}
                      onChange={e => setQuickForm(p => ({ ...p, date_of_payment: e.target.value }))} />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Expense Description <span className="text-destructive">*</span></label>
                  <Input placeholder="e.g. Printing paper, cleaning supplies" className="h-9 text-sm" value={quickForm.remarks}
                    onChange={e => setQuickForm(p => ({ ...p, remarks: e.target.value }))} />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRecordDialogOpen(false)} disabled={saving} className="cursor-pointer">Cancel</Button>
            <Button onClick={handleRecordSave} disabled={saving} className={cn('gap-2 cursor-pointer',
              activeEntryTab === 'sale' ? 'bg-foreground hover:bg-foreground' :
                activeEntryTab === 'deposit' ? 'bg-accent hover:bg-accent/80' :
                  'bg-warning hover:bg-warning/80'
            )}>
              {saving ? <Loader2 className="size-4 animate-spin" /> :
                activeEntryTab === 'sale' ? <Fuel className="size-4" /> :
                  activeEntryTab === 'deposit' ? <Banknote className="size-4" /> :
                    <Receipt className="size-4" />}
              {saving ? 'Saving…' : activeEntryTab === 'sale' ? 'Save Daily Sale' : activeEntryTab === 'deposit' ? 'Save Deposit' : 'Save Expense'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Entry Dialog ──────────────────────────────────────── */}
      <Dialog open={!!editTarget} onOpenChange={open => { if (!open) { setEditTarget(null); setEditForm(null) } }}>
        <DialogContent className="sm:max-w-[640px]">
          {editTarget && editForm && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted"><Pencil className="size-5 text-muted-foreground" /></div>
                  <div>
                    <h2 className="text-lg font-semibold">Edit Entry</h2>
                    <p className="text-sm font-normal text-muted-foreground mt-0.5">
                      {selectedGroup?.truckNumber} · {selectedGroup?.stationName}
                    </p>
                  </div>
                </DialogTitle>
                <DialogDescription className="sr-only">Edit sale, deposit and expense details</DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Date</label>
                  <Input type="date" className="h-9 text-sm w-[200px]" value={editForm.date_of_payment}
                    onChange={e => setEditForm(p => p ? { ...p, date_of_payment: e.target.value } : null)} />
                </div>

                {/* Sale section */}
                <div className="rounded-lg border border-border/75 overflow-hidden">
                  <div className="bg-muted px-3 py-2 flex items-center gap-2">
                    <Fuel className="size-3.5 text-muted-foreground" /><p className="text-xs font-semibold text-foreground">Daily Sale</p>
                  </div>
                  <div className="p-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Volume (Ltrs)</label>
                      <Input className="h-9 text-sm" value={editForm.quantity}
                        onChange={e => {
                          const qty = formatWithCommas(e.target.value)
                          setEditForm(p => p ? { ...p, quantity: qty } : null)
                        }} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Rate (₦/L)</label>
                      <Input className="h-9 text-sm" value={editForm.rate}
                        onChange={e => setEditForm(p => p ? { ...p, rate: formatWithCommas(e.target.value) } : null)} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Sales Value</label>
                      <Input readOnly className="h-9 text-sm bg-muted font-semibold"
                        value={(() => {
                          const r = Number(stripCommas(editForm.rate)) || 0
                          const q = Number(stripCommas(editForm.quantity)) || 0
                          return r && q ? `₦${formatWithCommas(String(r * q))}` : '—'
                        })()} />
                    </div>
                  </div>
                </div>

                {/* Deposit section */}
                <div className="rounded-lg border border-accent/75 overflow-hidden">
                  <div className="bg-accent/10 px-3 py-2 flex items-center gap-2">
                    <Banknote className="size-3.5 text-accent" /><p className="text-xs font-semibold text-accent">Bank Deposit</p>
                  </div>
                  <div className="p-3 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">Amount Deposited (₦)</label>
                        <Input className="h-9 text-sm font-semibold" value={editForm.payment_amount}
                          onChange={e => setEditForm(p => p ? { ...p, payment_amount: formatWithCommas(e.target.value) } : null)} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">Status</label>
                        <select aria-label="Status" value={editForm.deposit_status}
                          onChange={e => setEditForm(p => p ? { ...p, deposit_status: e.target.value as 'pending' | 'confirmed' } : null)}
                          className="h-8 w-full rounded-lg border border-input bg-background px-2.5 py-1 text-base md:text-sm">
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Bank Account</label>
                      <select aria-label="Bank" value={editForm.bank_account_id}
                        onChange={e => setEditForm(p => p ? { ...p, bank_account_id: e.target.value } : null)}
                        className="h-8 w-full rounded-lg border border-input bg-background px-2.5 py-1 text-base md:text-sm">
                        <option value="">Select account…</option>
                        {BANK_ACCOUNTS.filter(b => b.is_active).map(b => <option key={b.id} value={String(b.id)}>{b.account_number} · {b.bank_name}</option>)}
                      </select>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">Depositor Name</label>
                        <Input className="h-9 text-sm" value={editForm.payer_name}
                          onChange={e => setEditForm(p => p ? { ...p, payer_name: e.target.value } : null)} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">Phone</label>
                        <Input className="h-9 text-sm" value={editForm.phone_number}
                          onChange={e => setEditForm(p => p ? { ...p, phone_number: e.target.value } : null)} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expense section */}
                <div className="rounded-lg border border-warning/75 overflow-hidden">
                  <div className="bg-warning/10 px-3 py-2 flex items-center gap-2">
                    <Receipt className="size-3.5 text-warning" /><p className="text-xs font-semibold text-warning">Expense</p>
                  </div>
                  <div className="p-3">
                    <div className="space-y-1 sm:w-1/2">
                      <label className="text-xs text-muted-foreground">Amount (₦)</label>
                      <Input className="h-9 text-sm" value={editForm.expenses_amount}
                        onChange={e => setEditForm(p => p ? { ...p, expenses_amount: formatWithCommas(e.target.value) } : null)} />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Remarks</label>
                  <Input className="h-9 text-sm" value={editForm.remarks}
                    onChange={e => setEditForm(p => p ? { ...p, remarks: e.target.value } : null)} />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => { setEditTarget(null); setEditForm(null) }} disabled={editSaving} className="cursor-pointer">Cancel</Button>
                <Button onClick={handleEditSave} disabled={editSaving} className="gap-2 bg-foreground hover:bg-foreground/90 cursor-pointer">
                  {editSaving ? <Loader2 className="size-3.5 animate-spin" /> : <Pencil className="size-3.5" />}
                  {editSaving ? 'Saving…' : 'Save Changes'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation Dialog ─────────────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3 text-destructive">
              <Trash2 className="size-6" />
              <h3 className="font-semibold text-lg text-foreground">Confirm Delete</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete <strong>{deleteTarget.label}</strong>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting} className="cursor-pointer">Cancel</Button>
              <Button variant="destructive" onClick={handleDelete} disabled={deleting} className="cursor-pointer">
                {deleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

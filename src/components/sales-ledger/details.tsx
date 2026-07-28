import { useState, useMemo } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '#/components/ui/card'
import { Button } from '#/components/ui/button'
import { Badge } from '#/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '#/components/ui/table'
import {
  ArrowLeft, Truck, Banknote, MapPin, Calendar, CheckCircle2,
  Trash2, ShieldAlert, FileText, Building2, User,
  Plus, Pencil, Tag, UserPlus, Phone, Wallet, TrendingUp,
  ChevronRight,
  Loader2,
} from 'lucide-react'
import { useDeliverySalesList } from '#/lib/hooks/useDeliverySales'
import { useDeliveryInventoryList } from '#/lib/hooks/useDeliveryInventory'
import { useDeliveryCustomerList } from '#/lib/hooks/useDeliveryCustomers'
import { usePfiList, type Pfi } from '#/lib/hooks/usePfis'
import { useLedgerGroups } from '#/lib/hooks/useLedgerGroups'
import { useToast } from '#/lib/hooks/useToast'
import type { DeliverySale, DeliveryInventory, DeliveryCustomer } from '#/lib/types'
import {
  RecordPaymentDialog, QuickPaymentDialog, RowSetupDialog, EditEntryDialog, DeleteConfirmDialog,
  resolveBankAccount, type LedgerGroup,
} from '#/components/sales-ledger/SalesLedgerDialogs'
import { toNum, fmt, fmtQty, normalizeCycleDate, getCycleKey, safeFormatDate } from '#/lib/sales-ledger-utils'

export function SalesLedgerDetails() {
  const navigate = useNavigate()
  const toast = useToast()
  const searchParams = useSearch({ strict: false }) as {
    key?: string
    loadingId?: string
    truckNumber?: string
    dateLoaded?: string
    customerId?: string
    code?: string
  }

  // ── Queries ─────────────────────────────────────────────────────────────
  const { data: rawSales = [], isLoading: salesLoading } = useDeliverySalesList()
  const { data: rawInventory = [], isLoading: inventoryLoading } = useDeliveryInventoryList()
  const { data: rawCustomers, isLoading: customersLoading } = useDeliveryCustomerList()
  const { data: rawPfis } = usePfiList()

  const allSales: DeliverySale[] = useMemo(() =>
    Array.isArray(rawSales) ? rawSales : [], [rawSales])
  const allLoadings: DeliveryInventory[] = useMemo(() =>
    Array.isArray(rawInventory) ? rawInventory : [], [rawInventory])
  const customers: DeliveryCustomer[] = useMemo(() => {
    if (!rawCustomers) return []
    if (Array.isArray(rawCustomers)) return rawCustomers
    return rawCustomers.customers || rawCustomers.data || []
  }, [rawCustomers])
  const pfis: Pfi[] = useMemo(() => {
    if (!rawPfis) return []
    if (Array.isArray(rawPfis)) return rawPfis
    return rawPfis.pfis || rawPfis.data || []
  }, [rawPfis])

  // ── Maps ────────────────────────────────────────────────────────────────
  const customerMap = useMemo(() => {
    const m = new Map<string, DeliveryCustomer>()
    customers.forEach(c => m.set(c._id || c.id || '', c))
    return m
  }, [customers])

  const pfiMap = useMemo(() => {
    const m = new Map<string, Pfi>()
    pfis.forEach(p => m.set(p._id, p))
    return m
  }, [pfis])

  // ── Ledger Groups (shared computation) ──────────────────────────────────
  const { ledgerGroups, cycleCustomerRateMap } = useLedgerGroups({
    allSales, allLoadings, customerMap, pfiMap,
  })

  const tripCodes = useMemo(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('dsl_trip_codes') || '[]')
      const invCodes = allLoadings.map(l => (l.allocationCode || '').trim().toUpperCase()).filter(Boolean)
      return Array.from(new Set([...stored, ...invCodes])).sort()
    } catch {
      return []
    }
  }, [allLoadings])

  // ── Find Current Target Group & All Cycle Groups ─────────────────────────
  const targetGroup = useMemo((): LedgerGroup | null => {
    if (!ledgerGroups.length) return null
    const { key, loadingId, truckNumber, dateLoaded, customerId, code } = searchParams
    if (key) {
      const found = ledgerGroups.find(g => g.key === key)
      if (found) return found
    }
    if (loadingId) {
      const found = ledgerGroups.find(g => String(g.loadingId) === String(loadingId))
      if (found) return found
    }
    if (truckNumber) {
      const normalizedTruck = truckNumber.trim().toUpperCase()
      const matches = ledgerGroups.filter(g => (g.truckNumber || '').trim().toUpperCase() === normalizedTruck)
      if (customerId) {
        const custMatch = matches.find(g => g.customerId === customerId)
        if (custMatch) return custMatch
      }
      if (code) {
        const codeMatch = matches.find(g => (g.code || '').trim().toUpperCase() === code.trim().toUpperCase())
        if (codeMatch) return codeMatch
      }
      if (dateLoaded) {
        const dateMatch = matches.find(g => normalizeCycleDate(g.dateLoaded) === normalizeCycleDate(dateLoaded))
        if (dateMatch) return dateMatch
      }
      if (matches.length > 0) return matches[0]
    }
    return ledgerGroups[0] || null
  }, [ledgerGroups, searchParams])

  const cycleGroups = useMemo((): LedgerGroup[] => {
    if (!targetGroup) return []
    const targetCycleKey = getCycleKey(targetGroup.truckNumber, targetGroup.dateLoaded)
    return ledgerGroups.filter(g => getCycleKey(g.truckNumber, g.dateLoaded) === targetCycleKey)
  }, [ledgerGroups, targetGroup])

  // ── Loaded Trucks for Record Payment Dialog ──────────────────────────────
  const loadedTrucks = useMemo(() => {
    return allLoadings.filter(t => !!(t.truckNumber || t.truckId)).sort((a, b) => {
      const truckA = (a.truckNumber || '').toUpperCase()
      const truckB = (b.truckNumber || '').toUpperCase()
      if (truckA !== truckB) return truckA.localeCompare(truckB)
      return normalizeCycleDate(b.dateAllocated || '').localeCompare(normalizeCycleDate(a.dateAllocated || ''))
    })
  }, [allLoadings])

  // ── Dialog States ───────────────────────────────────────────────────────
  const [recordDialogOpen, setRecordDialogOpen] = useState(false)
  const [assignMode, setAssignMode] = useState(false)

  const [quickPaymentOpen, setQuickPaymentOpen] = useState(false)
  const [quickPaymentTarget, setQuickPaymentTarget] = useState<LedgerGroup | null>(null)

  const [setupOpen, setSetupOpen] = useState(false)
  const [setupTarget, setSetupTarget] = useState<LedgerGroup | null>(null)

  const [editOpen, setEditOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<DeliverySale | null>(null)

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ ids: string[]; loadingId?: string; mode: 'entry' | 'truck'; label: string } | null>(null)

  const openQuickPayment = () => {
    if (!targetGroup) return
    if (!targetGroup.customerId || !targetGroup.location || (!targetGroup.expected && !targetGroup.isFillingStation)) {
      if (targetGroup.loadingId) {
        setAssignMode(false)
        setRecordDialogOpen(true)
        toast.warning('Complete the first entry details first')
      } else {
        toast.error('This row needs a full setup first')
      }
      return
    }
    setQuickPaymentTarget(targetGroup)
    setQuickPaymentOpen(true)
  }

  const openSetup = () => {
    if (!targetGroup) return
    setSetupTarget(targetGroup)
    setSetupOpen(true)
  }

  const openEdit = (sale: DeliverySale) => {
    setEditTarget(sale)
    setEditOpen(true)
  }

  const isLoading = salesLoading || inventoryLoading || customersLoading

  if (isLoading && !targetGroup) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={24} className="animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!targetGroup) {
    return (
      <div className="p-8 text-center max-w-md mx-auto my-12 bg-card rounded-2xl border border-border shadow-sm">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
          <ShieldAlert size={32} className="text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-lg text-foreground">Sales Ledger Entry Not Found</h3>
        <p className="text-sm text-muted-foreground mt-1.5">Please select a valid ledger record from the dashboard.</p>
        <Button onClick={() => navigate({ to: '/sales-ledger' })} className="mt-5 gap-2">
          <ArrowLeft size={16} /> Back to Sales Ledger
        </Button>
      </div>
    )
  }

  const isFS = targetGroup.isFillingStation
  const isExpectedPositive = targetGroup.expected > 0
  const isFullyPaid = isExpectedPositive && targetGroup.balance <= 0
  const paymentProgress = isExpectedPositive ? Math.min(100, Math.round((targetGroup.totalPaid / targetGroup.expected) * 100)) : 0

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* ═══ BREADCRUMB + HEADER ═══ */}
      <div className="space-y-4">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm">
          <button
            onClick={() => navigate({ to: '/sales-ledger' })}
            className="text-muted-foreground hover:text-foreground font-medium transition-colors"
          >
            Sales Ledger
          </button>
          <ChevronRight size={14} className="text-muted-foreground/40" />
          <span className="text-foreground font-semibold">{targetGroup.truckNumber}</span>
          {targetGroup.code && (
            <>
              <ChevronRight size={14} className="text-muted-foreground/40" />
              <span className="text-purple-700 dark:text-purple-300 font-medium uppercase text-xs">{targetGroup.code}</span>
            </>
          )}
        </nav>

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-foreground"
              onClick={() => navigate({ to: '/sales-ledger' })}
            >
              <ArrowLeft size={16} /> Back
            </Button>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                  <Truck size={22} className="text-amber-600 dark:text-amber-400" />
                  {targetGroup.truckNumber}
                </h1>
                {targetGroup.code && (
                  <Badge variant="outline" className="font-mono text-xs uppercase bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20 flex items-center gap-1">
                    <Tag size={10} /> {targetGroup.code}
                  </Badge>
                )}
                {isFS && (
                  <Badge className="text-xs bg-amber-500/20 text-amber-800 dark:text-amber-200 border-amber-500/30">
                    Filling Station
                  </Badge>
                )}
                {isFullyPaid ? (
                  <Badge className="text-xs bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 size={12} /> Fully Paid
                  </Badge>
                ) : targetGroup.balance > 0 ? (
                  <Badge className="text-xs bg-red-500/20 text-red-800 dark:text-red-200 border-red-500/30">
                    Pending Balance
                  </Badge>
                ) : null}
              </div>
              <p className="text-muted-foreground text-sm mt-0.5 uppercase font-medium">
                {cycleGroups.map(g => g.customerName || 'Unassigned').join(', ') || 'Unassigned'} · {targetGroup.location || '—'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="outline" className="gap-1.5 text-xs font-semibold" onClick={openSetup}>
              <Pencil size={13} className="text-muted-foreground" /> Row Setup
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5 text-xs font-semibold" onClick={() => {
              navigate({
                to: '/sales-ledger/assign-customer',
                search: {
                  loadingId: targetGroup.loadingId ? String(targetGroup.loadingId) : undefined,
                  truckNumber: targetGroup.truckNumber || undefined,
                  dateLoaded: targetGroup.dateLoaded || undefined,
                  depot: targetGroup.depot || undefined,
                  code: targetGroup.code || undefined,
                },
              })
            }}>
              <UserPlus size={13} className="text-muted-foreground" /> New Customer
            </Button>
            <Button size="sm" className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs" onClick={openQuickPayment}>
              <Plus size={13} /> Add Payment
            </Button>
          </div>
        </div>
      </div>

      {/* ═══ METRIC CARDS ═══ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card shadow-sm border-border">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground font-medium">Quantity Loaded</div>
              <div className="text-xl font-extrabold text-foreground mt-0.5">
                {targetGroup.quantity > 0 ? `${fmtQty(targetGroup.quantity)} L` : '—'}
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                Rate: {targetGroup.rate > 0 ? fmt(targetGroup.rate) : '—'}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              <Truck size={20} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card shadow-sm border-border">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground font-medium">Expected Revenue</div>
              <div className="text-xl font-extrabold text-foreground mt-0.5">
                {targetGroup.expected > 0 ? fmt(targetGroup.expected) : '—'}
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                Qty × Rate
              </div>
            </div>
            <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              <TrendingUp size={20} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card shadow-sm border-border">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">Total Paid</div>
              <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                {fmt(targetGroup.totalPaid)}
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                {targetGroup.payments.length} payment{targetGroup.payments.length !== 1 ? 's' : ''}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <Banknote size={20} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card shadow-sm border-border">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className={`text-xs font-semibold ${targetGroup.balance > 0 ? 'text-red-500' : targetGroup.balance < 0 ? 'text-blue-500' : 'text-muted-foreground'}`}>
                Balance Status
              </div>
              <div className={`text-xl font-extrabold mt-0.5 ${targetGroup.balance > 0 ? 'text-red-600 dark:text-red-400' : targetGroup.balance < 0 ? 'text-blue-600 dark:text-blue-400' : targetGroup.expected > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}>
                {targetGroup.expected > 0
                  ? (targetGroup.balance === 0 ? '₦0.00' : targetGroup.balance > 0 ? fmt(targetGroup.balance) : `+${fmt(Math.abs(targetGroup.balance))}`)
                  : '₦0.00'}
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                {targetGroup.balance === 0 ? 'Fully Settled' : targetGroup.balance > 0 ? 'Outstanding' : 'Overpaid'}
              </div>
            </div>
            <div className={`p-3 rounded-xl border ${targetGroup.balance > 0 ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20' : 'bg-muted text-muted-foreground border-border'}`}>
              <Wallet size={20} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ═══ PAYMENT PROGRESS BAR ═══ */}
      {isExpectedPositive && (
        <div className="bg-card rounded-xl shadow-sm border border-border p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground">Payment Progress</span>
            <span className={`text-xs font-bold ${paymentProgress >= 100 ? 'text-emerald-600 dark:text-emerald-400' : paymentProgress > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'}`}>
              {paymentProgress}%
            </span>
          </div>
          <div className="h-2.5 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${paymentProgress >= 100 ? 'bg-emerald-500' : paymentProgress > 0 ? 'bg-amber-500' : 'bg-muted-foreground/30'}`}
              style={{ width: `${paymentProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* ═══ MAIN DETAILS & PAYMENTS GRID ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Truck Info + Payment Ledger */}
        <div className="lg:col-span-2 space-y-6">
          {/* Truck Allocation Card */}
          <Card className="bg-card shadow-sm border-border">
            <CardHeader className="border-b border-border pb-3">
              <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <Truck size={16} className="text-amber-600 dark:text-amber-400" />
                Truck & Cycle Information
              </CardTitle>
              <CardDescription className="text-xs">Allocation specs, customer link, and depot data.</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                {[
                  { icon: <Truck className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />, label: 'Truck Plate', value: targetGroup.truckNumber },
                  { icon: <Calendar className="h-4 w-4 text-indigo-500 shrink-0" />, label: 'Date Loaded', value: safeFormatDate(targetGroup.dateLoaded) },
                  { icon: <Building2 className="h-4 w-4 text-amber-500 shrink-0" />, label: 'Depot', value: targetGroup.depot || '—' },
                  { icon: <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />, label: 'Destination', value: targetGroup.location || '—' },
                  { icon: <Tag className="h-4 w-4 text-purple-500 shrink-0" />, label: 'Allocation Code', value: targetGroup.code || 'None' },
                  { icon: <FileText className="h-4 w-4 text-blue-500 shrink-0" />, label: 'PFI Reference', value: targetGroup.pfiNumber || '—' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-muted/60 rounded-xl border border-border">
                    {item.icon}
                    <div className="min-w-0">
                      <div className="text-[11px] text-muted-foreground font-medium">{item.label}</div>
                      <div className="font-semibold text-foreground text-sm truncate uppercase">{item.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Payment Transactions Ledger */}
          <Card className="bg-card shadow-sm border-border">
            <CardHeader className="border-b border-border pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                  <Banknote size={16} className="text-emerald-600 dark:text-emerald-400" />
                  Payment Entries ({targetGroup.payments.length})
                </CardTitle>
                <CardDescription className="text-xs">Individual payments made against this truck allocation.</CardDescription>
              </div>
              <Button size="sm" className="h-8 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs" onClick={openQuickPayment}>
                <Plus size={13} /> Add Payment
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {targetGroup.payments.length === 0 ? (
                <div className="p-10 text-center">
                  <div className="mx-auto w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-3">
                    <Banknote className="text-muted-foreground/40" size={28} />
                  </div>
                  <p className="text-foreground font-semibold text-sm">No payment entries recorded yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Click "Add Payment" above to record a deposit.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table className="text-xs">
                    <TableHeader>
                      <TableRow className="bg-muted/60 hover:bg-muted/60">
                        <TableHead className="w-[40px] text-center font-semibold text-muted-foreground">#</TableHead>
                        <TableHead className="font-semibold text-muted-foreground">Date Paid</TableHead>
                        <TableHead className="font-semibold text-emerald-600 dark:text-emerald-400 text-right">Amount Paid</TableHead>
                        <TableHead className="font-semibold text-red-600 dark:text-red-400 text-right">Balance After</TableHead>
                        <TableHead className="font-semibold text-muted-foreground">Payer Name</TableHead>
                        <TableHead className="font-semibold text-muted-foreground">Payment Method</TableHead>
                        <TableHead className="font-semibold text-muted-foreground">Remarks</TableHead>
                        <TableHead className="w-[120px] text-center font-semibold text-muted-foreground">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(() => {
                        let cumulative = 0
                        return targetGroup.payments.map((payment, idx) => {
                          cumulative += toNum(payment.paymentAmount)
                          const balanceAfter = targetGroup.expected - cumulative
                          const bankAcct = resolveBankAccount(payment.bank)

                          return (
                            <TableRow key={payment._id || payment.id || idx} className="hover:bg-muted/50 border-b border-border transition-colors">
                              <TableCell className="text-muted-foreground text-center font-medium">{idx + 1}</TableCell>
                              <TableCell className="font-medium text-foreground whitespace-nowrap">
                                {safeFormatDate(payment.dateOfPayment)}
                              </TableCell>
                              <TableCell className="text-right font-extrabold text-emerald-600 dark:text-emerald-400 whitespace-nowrap tabular-nums">
                                {fmt(toNum(payment.paymentAmount))}
                              </TableCell>
                              <TableCell className={`text-right font-bold whitespace-nowrap tabular-nums ${balanceAfter > 0 ? 'text-red-600 dark:text-red-400' : balanceAfter < 0 ? 'text-blue-600 dark:text-blue-400' : targetGroup.expected > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}>
                                {targetGroup.expected > 0 ? (balanceAfter === 0 ? '₦0.00' : balanceAfter > 0 ? fmt(balanceAfter) : `+${fmt(Math.abs(balanceAfter))}`) : '—'}
                              </TableCell>
                              <TableCell className="text-foreground font-medium whitespace-nowrap">
                                {payment.payerName ? (
                                  <div>
                                    <p className="uppercase">{payment.payerName}</p>
                                    {payment.phoneNumber && <p className="text-[11px] text-muted-foreground">{payment.phoneNumber}</p>}
                                  </div>
                                ) : payment.phoneNumber ? (
                                  <span className="text-muted-foreground">{payment.phoneNumber}</span>
                                ) : '—'}
                              </TableCell>
                              <TableCell className="text-foreground whitespace-nowrap">
                                {bankAcct ? (
                                  <div>
                                    <p className="font-semibold text-foreground">{bankAcct.account_name}</p>
                                    <p className="text-[11px] text-muted-foreground">{bankAcct.bank_name} ({bankAcct.account_number})</p>
                                  </div>
                                ) : payment.bank ? (
                                  <span className="text-xs text-muted-foreground">{payment.bank}</span>
                                ) : '—'}
                              </TableCell>
                              <TableCell className="text-muted-foreground italic max-w-[120px] truncate">
                                {payment.remarks || '—'}
                              </TableCell>
                              <TableCell className="text-center whitespace-nowrap">
                                <div className="flex items-center justify-center gap-1">
                                  <Button size="sm" variant="outline" className="h-7 text-xs px-2 gap-1 border-border" title="Edit entry" onClick={() => openEdit(payment)}>
                                    <Pencil size={11} /> Edit
                                  </Button>
                                  <Button size="sm" variant="outline" className="h-7 text-xs px-2 gap-1 border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-500/10" title="Delete entry" onClick={() => { setDeleteTarget({ ids: [payment._id || payment.id || ''], mode: 'entry', label: `${targetGroup.truckNumber} — ${fmt(toNum(payment.paymentAmount))}` }); setDeleteOpen(true) }}>
                                    <Trash2 size={11} />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          )
                        })
                      })()}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Customer Info & Financial Summary */}
        <div className="space-y-6">
          {/* Assigned Customers Profile Card */}
          <Card className="bg-card shadow-sm border-border">
            <CardHeader className="border-b border-border pb-3">
              <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <User size={16} className="text-indigo-500" /> Assigned Customers ({cycleGroups.length})
              </CardTitle>
              <CardDescription className="text-xs">
                All customers receiving fuel from truck {targetGroup.truckNumber}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-sm">
              {cycleGroups.length === 0 ? (
                <div className="py-3 text-muted-foreground text-xs italic text-center">No customers assigned yet.</div>
              ) : (
                cycleGroups.map((cg, i) => {
                  const cgCustObj = cg.customerId ? customerMap.get(cg.customerId) : null
                  const isCurrentSelected = cg.key === targetGroup.key

                  return (
                    <div
                      key={cg.key || i}
                      onClick={() => {
                        navigate({
                          to: '/sales-ledger/details',
                          search: {
                            key: cg.key,
                            loadingId: cg.loadingId ? String(cg.loadingId) : undefined,
                            truckNumber: cg.truckNumber,
                            dateLoaded: cg.dateLoaded,
                            customerId: cg.customerId || undefined,
                            code: cg.code,
                          },
                        })
                      }}
                      className={`p-3 rounded-xl border transition-all cursor-pointer space-y-2 ${isCurrentSelected
                          ? 'border-indigo-500/40 bg-indigo-500/10 shadow-sm ring-1 ring-indigo-500/30'
                          : 'border-border bg-muted/40 hover:bg-muted/70 hover:border-border'
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-foreground uppercase flex items-center gap-1.5 text-xs">
                          {isCurrentSelected ? (
                            <span className="h-2 w-2 rounded-full bg-indigo-500 shrink-0" />
                          ) : (
                            <User size={12} className="text-muted-foreground" />
                          )}
                          {cg.customerName || 'Unassigned Customer'}
                        </span>
                        {cg.isFillingStation ? (
                          <Badge className="text-[10px] bg-amber-500/20 text-amber-800 dark:text-amber-200 border-amber-500/30 px-1.5 py-0">
                            FS
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] text-muted-foreground border-border px-1.5 py-0">
                            Normal
                          </Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border">
                        <div>
                          <span className="text-muted-foreground font-medium">Qty:</span>{' '}
                          <strong className="text-foreground">{cg.quantity > 0 ? `${fmtQty(cg.quantity)} L` : '—'}</strong>
                        </div>
                        <div>
                          <span className="text-muted-foreground font-medium">Dest:</span>{' '}
                          <strong className="text-foreground uppercase">{cg.location || '—'}</strong>
                        </div>
                      </div>

                      {(cgCustObj?.phoneNumber || cgCustObj?.contactPersonPhone) && (
                        <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Phone size={10} className="text-muted-foreground" />
                          {cgCustObj.contactPersonPhone || cgCustObj.phoneNumber}
                        </div>
                      )}

                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>

          {/* Financial Breakdown Card */}
          <Card className="bg-card shadow-sm border-border">
            <CardHeader className="border-b border-border pb-3">
              <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <TrendingUp size={16} className="text-emerald-600 dark:text-emerald-400" /> Financial Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-sm">
              {[
                { label: 'Volume', value: targetGroup.quantity > 0 ? `${fmtQty(targetGroup.quantity)} L` : '—' },
                { label: 'Rate per Litre', value: targetGroup.rate > 0 ? fmt(targetGroup.rate) : '—' },
                { label: 'Expected Revenue', value: targetGroup.expected > 0 ? fmt(targetGroup.expected) : '—', bold: true },
                { label: 'Total Paid', value: fmt(targetGroup.totalPaid), className: 'text-emerald-600 dark:text-emerald-400 font-bold' },
              ].map((row, i) => (
                <div key={i} className="flex justify-between py-1 border-b border-border">
                  <span className="text-muted-foreground font-medium">{row.label}</span>
                  <span className={`font-${row.bold ? 'bold' : 'semibold'} text-foreground ${row.className || ''}`}>{row.value}</span>
                </div>
              ))}
              <div className="flex justify-between py-1 pt-2">
                <span className="text-muted-foreground font-semibold">Net Balance</span>
                <span className={`font-extrabold text-base ${targetGroup.balance > 0 ? 'text-red-600 dark:text-red-400' : targetGroup.balance < 0 ? 'text-blue-600 dark:text-blue-400' : targetGroup.expected > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}>
                  {targetGroup.expected > 0
                    ? (targetGroup.balance === 0 ? '✓ Settled' : targetGroup.balance > 0 ? fmt(targetGroup.balance) : `+${fmt(Math.abs(targetGroup.balance))}`)
                    : '₦0.00'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ═══ DIALOGS ═══ */}
      <RecordPaymentDialog
        open={recordDialogOpen}
        onOpenChange={setRecordDialogOpen}
        trucks={loadedTrucks}
        customers={customers}
        customerMap={customerMap}
        tripCodes={tripCodes}
        cycleCustomerRateMap={cycleCustomerRateMap}
        getCycleKey={getCycleKey}
        normalizeCycleDate={normalizeCycleDate}
        assignMode={assignMode}
      />

      <QuickPaymentDialog
        open={quickPaymentOpen}
        onOpenChange={setQuickPaymentOpen}
        target={quickPaymentTarget}
        customerMap={customerMap}
      />

      <RowSetupDialog
        open={setupOpen}
        onOpenChange={setSetupOpen}
        target={setupTarget}
        customers={customers}
        customerMap={customerMap}
        tripCodes={tripCodes}
      />

      <EditEntryDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        target={editTarget}
        tripCodes={tripCodes}
        allSales={allSales}
        getCycleKey={getCycleKey}
        customerMap={customerMap}
      />

      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        target={deleteTarget}
      />
    </div>
  )
}

import { useState } from 'react'
import { createFileRoute, useNavigate, useRouter } from '@tanstack/react-router'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '#/components/ui/card'
import { Input } from '#/components/ui/input'
import {
  Warehouse, MapPin, User, ArrowLeft, Edit, Trash2, Activity, AlertCircle, Loader2, DollarSign, Check, X, ChevronUp, TrendingUp, TrendingDown, History, Clock, FileText, Landmark, Copy, CheckCircle2, ShoppingBag, ChevronDown, Receipt, CreditCard, PackageCheck, Droplets, AlertTriangle, Plus, ShieldCheck, Layers, BarChart3
} from 'lucide-react'
import type { DepotItem } from './index'
import { useDeleteDepot, useUpdateProductPrice, useDepotDetails } from '#/lib/hooks/useDepots'
import { usePfiList } from '#/lib/hooks/usePfis'
import { useBankAccounts } from '#/lib/hooks/useBankAccounts'
import { useOrderList } from '#/lib/hooks/useOrders'
import { useDepositList } from '#/lib/hooks/useDeposits'
import { useToast } from '#/lib/hooks/useToast'
import { Breadcrumbs } from '#/components/Breadcrumbs'
import { ConfirmDialog } from '#/components/ConfirmDialog'

export const Route = createFileRoute('/depots/details')({
  validateSearch: (search: Record<string, unknown>): { id?: string } => ({
    id: (search.id as string) || '',
  }),
  component: DepotDetailPage,
})

function getStatusBadge(status: string) {
  switch (status) {
    case 'Active':
      return (
        <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 gap-1.5 font-medium">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          {status}
        </Badge>
      )
    case 'High Capacity':
      return (
        <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 gap-1.5 font-medium">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
          {status}
        </Badge>
      )
    case 'Maintenance':
      return (
        <Badge variant="destructive" className="gap-1.5 font-medium">
          <span className="h-1.5 w-1.5 rounded-full bg-destructive-foreground animate-pulse" />
          {status}
        </Badge>
      )
    default:
      return <Badge variant="outline">{status || 'Active'}</Badge>
  }
}

function getPfiVolumeStats(pfi: any) {
  const startingLitres = Number(pfi.startingQtyLitres ?? pfi.starting_qty_litres ?? pfi.totalVolumeLitres ?? pfi.volumeLitres ?? pfi.startingQty ?? 0)
  const soldLitres = Number(pfi.soldQtyLitres ?? pfi.sold_qty_litres ?? pfi.soldVolumeLitres ?? pfi.soldQty ?? 0)

  let starting = startingLitres
  let sold = soldLitres

  if (starting === 0 && Number(pfi.qtyVolumeMt ?? pfi.qty_volume_mt ?? 0) > 0) {
    starting = Number(pfi.qtyVolumeMt ?? pfi.qty_volume_mt)
  }

  const remaining = Math.max(0, starting - sold)
  return { starting, sold, remaining }
}

function OrderDepositBreakdown({ order }: { order: any }) {
  const rawCustomer = order.customer || order.customerId
  const customerId = typeof rawCustomer === 'object' ? (rawCustomer?._id || rawCustomer?.id) : rawCustomer
  const { data: depositData, isLoading } = useDepositList(
    customerId ? { customer: String(customerId), limit: 50 } : undefined
  )
  const deposits = depositData?.deposits || []
  const creditDeposits = deposits.filter((d: any) => d.type === 'credit')

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 p-4 text-xs text-muted-foreground bg-muted/20 border-t">
        <Loader2 size={14} className="animate-spin text-primary" /> Loading deposit details for this order...
      </div>
    )
  }

  return (
    <div className="p-4 bg-muted/20 border-t space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-foreground uppercase tracking-wider">
          <Receipt size={14} className="text-emerald-500" />
          <span>Order Funding Deposits ({creditDeposits.length})</span>
        </div>
        {order.virtualAccountNumber && (
          <div className="text-xs text-muted-foreground flex items-center gap-1.5 font-mono bg-background px-2.5 py-1 rounded border">
            <CreditCard size={12} className="text-primary" />
            <span>Paid via DVA: <strong>{order.virtualAccountBank || 'Bank'}</strong> &bull; <strong className="text-foreground">{order.virtualAccountNumber}</strong></span>
          </div>
        )}
      </div>

      {creditDeposits.length === 0 ? (
        <div className="p-3.5 rounded-md bg-background/80 border text-xs text-muted-foreground text-center">
          No separate deposit log found. Order was paid via registered customer wallet account.
        </div>
      ) : (
        <div className="space-y-2">
          {creditDeposits.map((dep: any) => {
            const payDetails = dep.paystackDetails || {}
            const bankName = payDetails.senderBankName || dep.bankName || 'Bank Transfer'
            const depositor = payDetails.senderName || dep.depositorName || order.customerName || 'Customer'
            const ref = dep.reference || payDetails.reference || `DEP-${dep.id || dep._id}`
            const dateObj = dep.createdAt ? new Date(dep.createdAt) : null
            const dateStr = dateObj && !isNaN(dateObj.getTime()) ? dateObj.toLocaleString('en-GB') : 'N/A'
            const amount = Number(dep.amount || 0)

            return (
              <div key={dep.id || dep._id || ref} className="flex flex-wrap items-center justify-between p-3 rounded-md bg-card border text-xs gap-2 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                    <DollarSign size={16} />
                  </div>
                  <div>
                    <div className="font-semibold text-foreground flex items-center gap-2">
                      <span>₦{amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-normal">Credit Deposit</Badge>
                    </div>
                    <div className="text-[11px] text-muted-foreground font-mono mt-0.5">
                      Ref: <span className="text-foreground font-medium">{ref}</span> &bull; {bankName} {depositor ? `(${depositor})` : ''}
                    </div>
                  </div>
                </div>
                <div className="text-right text-[11px] text-muted-foreground">
                  <div className="font-medium text-foreground">{dateStr}</div>
                  {dep.description && <div className="truncate max-w-[220px] text-muted-foreground text-[10px] mt-0.5">{dep.description}</div>}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

type TabType = 'overview' | 'inventory' | 'pfis' | 'orders' | 'activity'

function DepotDetailPage() {
  const navigate = useNavigate()
  const router = useRouter()
  const deleteDepot = useDeleteDepot()
  const updatePrice = useUpdateProductPrice()
  const toast = useToast()
  const search = (Route.useSearch() as any) || {}
  const stateDepot = (router.history.location.state as any)?.depot as DepotItem | undefined
  const depotId = search?.id || (stateDepot as any)?._id || stateDepot?.id || ''

  const { data: fetchedDepot, isLoading: isLoadingDepot } = useDepotDetails(depotId)
  const depot = fetchedDepot || stateDepot

  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [editingProductId, setEditingProductId] = useState<string | null>(null)
  const [editPrice, setEditPrice] = useState('')
  const [expandedHistory, setExpandedHistory] = useState<string | null>(null)
  const [localPrices, setLocalPrices] = useState<DepotItem['productPrices']>(undefined)
  const [copiedAccount, setCopiedAccount] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('All')
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const activeDepotId = (depot as any)?._id || (depot as any)?.id || depotId

  // PFIs query + robust depot matching
  const { data: pfisData, isLoading: isLoadingPfis } = usePfiList(activeDepotId ? { location: activeDepotId } : undefined)
  const rawPfis = pfisData?.pfis || []
  const pfis = rawPfis.filter((pfi: any) => {
    if (!activeDepotId) return true
    const pfiDepotId = pfi.locationId ?? pfi.location_id ?? (typeof pfi.location === 'object' ? (pfi.location?._id || pfi.location?.id) : pfi.location) ?? pfi.depotId ?? pfi.depot_id
    const pfiDepotName = pfi.locationName || (typeof pfi.location === 'string' ? pfi.location : '')
    const depotName = depot?.name || ''

    if (pfiDepotId !== undefined && pfiDepotId !== null && pfiDepotId !== '') {
      return String(pfiDepotId) === String(activeDepotId)
    }
    if (pfiDepotName && depotName) {
      return pfiDepotName.toLowerCase() === depotName.toLowerCase()
    }
    return true
  })

  // Bank Accounts query + robust depot matching
  const { data: depotBankAccounts = [], isLoading: isLoadingBankAccounts } = useBankAccounts(activeDepotId ? { depotId: activeDepotId } : undefined)
  const { data: allBankAccounts = [] } = useBankAccounts()
  const matchingAccounts = depotBankAccounts.length > 0
    ? depotBankAccounts
    : allBankAccounts.filter((b: any) => {
      const bDepotId = b.depotId ?? b.depot_id ?? (typeof b.depot === 'object' ? (b.depot?._id || b.depot?.id) : b.depot)
      return b.status === 'Active' && String(bDepotId) === String(activeDepotId)
    })
  const displayBankAccounts = matchingAccounts.length > 0
    ? matchingAccounts
    : allBankAccounts.filter((b: any) => b.status === 'Active')

  // Orders query + robust depot matching
  const { data: ordersData, isLoading: isLoadingOrders } = useOrderList(activeDepotId ? { depot: activeDepotId, limit: 1000 } : { limit: 1000 })
  const rawOrders = ordersData?.orders || []
  const ordersList = rawOrders.filter((o: any) => {
    if (!activeDepotId) return true
    const ordDepotId = o.depotId ?? o.depot_id ?? (typeof o.depot === 'object' ? (o.depot?._id || o.depot?.id) : (typeof o.depot === 'number' || (typeof o.depot === 'string' && !isNaN(Number(o.depot))) ? o.depot : undefined))
    const ordDepotName = o.depotName || (typeof o.depot === 'string' && isNaN(Number(o.depot)) ? o.depot : '')
    const depotName = depot?.name || ''

    if (ordDepotId !== undefined && ordDepotId !== null && ordDepotId !== '') {
      return String(ordDepotId) === String(activeDepotId)
    }
    if (ordDepotName && depotName) {
      return ordDepotName.toLowerCase() === depotName.toLowerCase()
    }
    return true
  })

  const filteredOrders = ordersList.filter((o: any) => {
    if (statusFilter === 'All') return true
    return o.status === statusFilter
  })

  // Accurately calculate stats based on filtered PFIs and Orders
  const totalPfiStartingQty = pfis.reduce((sum: number, pfi: any) => sum + getPfiVolumeStats(pfi).starting, 0)
  const totalPfiSoldQty = pfis.reduce((sum: number, pfi: any) => sum + getPfiVolumeStats(pfi).sold, 0)
  const totalPfiRemainingQty = pfis.reduce((sum: number, pfi: any) => sum + getPfiVolumeStats(pfi).remaining, 0)
  const totalOrderRevenue = ordersList
    .filter((o: any) => o.status !== 'Cancelled')
    .reduce((sum: number, o: any) => sum + (Number(o.totalAmount ?? o.total_amount ?? o.amount) || 0), 0)
  const totalCompletedOrders = ordersList.filter((o: any) => o.status === 'Completed' || o.status === 'Paid').length
  const fulfillmentPct = totalPfiStartingQty > 0 ? Math.min(100, (totalPfiSoldQty / totalPfiStartingQty) * 100) : 0

  const isStockLow = totalPfiStartingQty > 0 && (totalPfiRemainingQty / totalPfiStartingQty) <= 0.15
  const remainingStockPct = totalPfiStartingQty > 0 ? (totalPfiRemainingQty / totalPfiStartingQty) * 100 : 0

  const getDepotActivityEvents = () => {
    const events: Array<{
      id: string
      title: string
      description: string
      date: Date
      type: 'pfi' | 'order' | 'price'
      badgeColor: string
      icon: any
    }> = []

    pfis.forEach((pfi: any) => {
      const dateVal = pfi.createdAt || pfi.pfiDate || pfi.pfi_date
      if (dateVal) {
        const dObj = new Date(dateVal)
        if (!isNaN(dObj.getTime())) {
          const stats = getPfiVolumeStats(pfi)
          events.push({
            id: `pfi-create-${pfi._id || pfi.id}`,
            title: `PFI ${pfi.pfiNumber || pfi.pfi_number || 'N/A'} Assigned`,
            description: `Registered ${stats.starting.toLocaleString()} ${pfi.productUnit || 'Litres'} of ${pfi.productName || pfi.product_name || 'product'}`,
            date: dObj,
            type: 'pfi',
            badgeColor: 'bg-primary/10 text-primary border-primary/20',
            icon: FileText,
          })
        }
      }
    })

    const prices = depot?.productPrices || []
    prices.forEach((pp: any) => {
      const prodName = pp.product?.name || pp.productName || 'Product'
      const history = pp.priceHistory || []
      history.forEach((h: any, idx: number) => {
        const hObj = h.setAt ? new Date(h.setAt) : new Date()
        events.push({
          id: `price-${pp._id || Math.random()}-${idx}`,
          title: `Price Updated for ${prodName}`,
          description: `Set product price to ₦${Number(h.price || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          date: isNaN(hObj.getTime()) ? new Date() : hObj,
          type: 'price',
          badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
          icon: DollarSign,
        })
      })
    })

    ordersList.forEach((order: any) => {
      if (order.createdAt) {
        const ordDate = new Date(order.createdAt)
        if (!isNaN(ordDate.getTime())) {
          const ordCust = order.customerName || order.customer_name || 'Customer'
          const ordProd = order.productName || order.product_name || order.product?.name || ''
          events.push({
            id: `order-${order._id || order.id}`,
            title: `Order ${order.orderNumber || order.order_number || ''} ${order.status}`,
            description: `${ordCust} ordered ${Number(order.quantity || 0).toLocaleString()} ${order.productUnit || 'L'} (${ordProd})`,
            date: ordDate,
            type: 'order',
            badgeColor: order.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-amber-500/10 text-amber-600 border-amber-500/20',
            icon: ShoppingBag,
          })
        }
      }
    })

    return events.sort((a, b) => b.date.getTime() - a.date.getTime())
  }

  const activityEvents = getDepotActivityEvents()

  const handleCopyAccount = (accountNumber: string) => {
    navigator.clipboard.writeText(accountNumber)
    setCopiedAccount(accountNumber)
    toast.success(`Account number ${accountNumber} copied to clipboard`)
    setTimeout(() => setCopiedAccount(null), 2000)
  }

  const handleBack = () => { window.history.length > 1 ? window.history.back() : navigate({ to: '/depots/' as any }) }
  const handleDelete = () => { setShowDeleteDialog(true) }
  const confirmDelete = async () => {
    if (!activeDepotId) return
    try {
      await deleteDepot.mutateAsync(activeDepotId)
      toast.success('Depot removed successfully')
      navigate({ to: '/depots/' as any })
    }
    catch {
      toast.error('Failed to delete depot')
    }
    finally {
      setShowDeleteDialog(false)
    }
  }

  if (isLoadingDepot && !depot) {
    return (
      <div className="flex flex-col items-center justify-center py-28 gap-4 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground">Loading depot details and operational data...</p>
      </div>
    )
  }

  if (!depot) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-5 text-center">
        <div className="h-16 w-16 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 border border-amber-500/20">
          <AlertCircle size={32} />
        </div>
        <h2 className="text-2xl font-bold text-foreground">No Depot Selected</h2>
        <p className="text-muted-foreground max-w-sm text-sm">Please select a depot from the depot directory to view details.</p>
        <Button onClick={() => navigate({ to: '/depots/' as any })}><ArrowLeft size={16} /> Back to Depots</Button>
      </div>
    )
  }

  const staffList = (depot.staff || (depot as any).staffIds || (depot as any).assignedStaff || []) as any[]

  return (
    <div className="space-y-6 pb-12 animate-fade-in max-w-7xl mx-auto">
      {/* Breadcrumbs */}
      <Breadcrumbs items={[{ label: 'Depots', href: '/depots' }, { label: depot?.name || 'Details' }]} />

      {/* Navigation & Breadcrumb Header */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b pb-4">
        <div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleBack}>
              <ArrowLeft size={16} />
            </Button>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">{depot.name}</h1>
            <div className="hidden sm:block">{getStatusBadge(depot.status)}</div>
          </div>
        </div>

        {/* Action Header Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            className="gap-1.5 shadow-sm font-semibold text-xs"
            onClick={() => navigate({ to: '/pfi/form' as any, search: { depotId: activeDepotId } as any })}
          >
            <Plus size={15} /> Assign PFI
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs font-medium"
            onClick={() => navigate({ to: '/depots/form' as any, search: { id: activeDepotId } as any, state: { depot, isEdit: true } as any })}
          >
            <Edit size={15} /> Edit Depot
          </Button>
          <Button
            variant="destructive"
            size="sm"
            className="gap-1.5 text-xs font-medium"
            onClick={handleDelete}
            disabled={deleteDepot.isPending}
          >
            <Trash2 size={15} /> {deleteDepot.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </header>

      {/* Hero Depot Card Banner */}
      <Card className="overflow-hidden border shadow-sm bg-card">
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-primary/15 border border-primary/20 flex items-center justify-center text-primary shadow-sm shrink-0">
                <Warehouse size={32} />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="font-mono text-xs bg-background/80">
                    Code: {depot.code}
                  </Badge>
                  <div className="sm:hidden">{getStatusBadge(depot.status)}</div>
                  {depot.establishedYear && (
                    <Badge variant="secondary" className="text-xs font-normal">
                      Est. {depot.establishedYear}
                    </Badge>
                  )}
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-foreground">{depot.name}</h2>
                <p className="text-xs md:text-sm text-muted-foreground flex items-center gap-1.5 pt-0.5">
                  <MapPin size={14} className="shrink-0 text-primary" />
                  <span>{[depot.address, depot.city, depot.state, depot.postcode, depot.country].filter(Boolean).join(', ') || 'Address N/A'}</span>
                </p>
              </div>
            </div>

            {/* Quick Metrics Badges in Hero */}
            <div className="flex flex-wrap md:flex-col items-start md:items-end gap-2 text-xs border-t md:border-t-0 pt-4 md:pt-0 w-full md:w-auto">
              <div className="flex items-center gap-2 bg-background/80 backdrop-blur px-3 py-1.5 rounded-lg border text-muted-foreground">
                <FileText size={14} className="text-primary" />
                <span><strong className="text-foreground">{pfis.length}</strong> Assigned PFI(s)</span>
              </div>
              <div className="flex items-center gap-2 bg-background/80 backdrop-blur px-3 py-1.5 rounded-lg border text-muted-foreground">
                <Landmark size={14} className="text-emerald-500" />
                <span><strong className="text-foreground">{displayBankAccounts.length}</strong> Bank Account(s)</span>
              </div>
              <div className="flex items-center gap-2 bg-background/80 backdrop-blur px-3 py-1.5 rounded-lg border text-muted-foreground">
                <ShoppingBag size={14} className="text-amber-500" />
                <span><strong className="text-foreground">{ordersList.length}</strong> Orders Total</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Depot Key Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Stock Allocated */}
        <Card className="border-l-4 border-l-primary shadow-sm hover:shadow transition-shadow">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Total Allocated Stock</p>
              <h3 className="text-2xl font-bold text-foreground">
                {totalPfiStartingQty.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">L</span>
              </h3>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <FileText size={12} className="text-primary" />
                <span>Across {pfis.length} registered PFI(s)</span>
              </p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <PackageCheck size={24} />
            </div>
          </CardContent>
        </Card>

        {/* Total Volume Sold */}
        <Card className="border-l-4 border-l-emerald-500 shadow-sm hover:shadow transition-shadow">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Total Volume Sold</p>
              <h3 className="text-2xl font-bold text-foreground">
                {totalPfiSoldQty.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">L</span>
              </h3>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                <TrendingUp size={12} />
                <span>{Math.round(fulfillmentPct)}% of total stock sold</span>
              </p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <CheckCircle2 size={24} />
            </div>
          </CardContent>
        </Card>

        {/* Stock Remaining */}
        <Card className={`border-l-4 shadow-sm hover:shadow transition-shadow ${isStockLow ? 'border-l-destructive' : 'border-l-amber-500'}`}>
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Stock Remaining</p>
              <h3 className="text-2xl font-bold text-foreground">
                {totalPfiRemainingQty.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">L</span>
              </h3>
              <p className={`text-xs font-medium flex items-center gap-1 ${isStockLow ? 'text-destructive font-bold' : 'text-amber-600 dark:text-amber-400'}`}>
                <Droplets size={12} />
                <span>{Math.round(remainingStockPct)}% stock available</span>
              </p>
            </div>
            <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${isStockLow ? 'bg-destructive/10 text-destructive' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'}`}>
              <Droplets size={24} />
            </div>
          </CardContent>
        </Card>

        {/* Total Depot Sales Revenue */}
        <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow transition-shadow">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Depot Order Sales</p>
              <h3 className="text-2xl font-bold text-foreground">
                ₦{totalOrderRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <ShoppingBag size={12} className="text-blue-500" />
                <span>{ordersList.length} Order(s) &bull; {totalCompletedOrders} Done</span>
              </p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
              <DollarSign size={24} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Warning Alert Banner */}
      {isStockLow && (
        <Card className="border-amber-500/50 bg-amber-500/10 text-amber-900 dark:text-amber-200 shadow-sm">
          <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                <AlertTriangle size={22} />
              </div>
              <div>
                <h4 className="font-bold text-foreground text-sm flex items-center gap-2">
                  <span>Low Stock Warning &bull; Available Stock at {Math.round(remainingStockPct)}%</span>
                  <Badge variant="destructive" className="text-[10px] uppercase font-bold">Action Required</Badge>
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Active PFI stock at {depot.name} is down to <strong>{totalPfiRemainingQty.toLocaleString()} Litres</strong> (out of {totalPfiStartingQty.toLocaleString()} L total allocated). Consider assigning a new PFI or updating capacity.
                </p>
              </div>
            </div>
            <Button
              size="sm"
              className="bg-amber-600 text-white hover:bg-amber-700 shrink-0 text-xs font-semibold gap-1.5 shadow-sm"
              onClick={() => navigate({ to: '/pfi/form' as any, search: { depotId: activeDepotId } as any })}
            >
              <Plus size={14} /> Assign New PFI
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Tab Navigation Controls */}
      <div className="border-b border-border">
        <div className="flex gap-2 overflow-x-auto pb-px">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${activeTab === 'overview'
                ? 'border-primary text-primary bg-primary/5 rounded-t-md'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              }`}
          >
            <BarChart3 size={15} />
            <span>Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${activeTab === 'inventory'
                ? 'border-primary text-primary bg-primary/5 rounded-t-md'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              }`}
          >
            <Layers size={15} />
            <span>Inventory & Pricing</span>
          </button>

          <button
            onClick={() => setActiveTab('pfis')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${activeTab === 'pfis'
                ? 'border-primary text-primary bg-primary/5 rounded-t-md'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              }`}
          >
            <FileText size={15} />
            <span>PFIs & Allocation</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeTab === 'pfis' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
              {pfis.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${activeTab === 'orders'
                ? 'border-primary text-primary bg-primary/5 rounded-t-md'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              }`}
          >
            <ShoppingBag size={15} />
            <span>Orders & Sales</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeTab === 'orders' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
              {ordersList.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('activity')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${activeTab === 'activity'
                ? 'border-primary text-primary bg-primary/5 rounded-t-md'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              }`}
          >
            <Activity size={15} />
            <span>Audit & Activity Log</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeTab === 'activity' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
              {activityEvents.length}
            </span>
          </button>
        </div>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Location & Coordinates */}
          <Card className="shadow-sm">
            <CardHeader className="border-b border-border/50 pb-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <MapPin size={16} />
                </div>
                <div>
                  <CardTitle className="text-sm font-semibold">Location & Geographic Details</CardTitle>
                  <CardDescription className="text-xs">Hub address, LGA and region coordinates</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div>
                <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">Street Address</p>
                <p className="text-sm text-foreground font-medium mt-0.5">{depot.address || 'N/A'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">LGA / City</p>
                  <p className="text-sm text-foreground font-medium mt-0.5">{depot.city || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">State</p>
                  <p className="text-sm text-foreground font-medium mt-0.5">{depot.state || 'N/A'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">Country</p>
                  <p className="text-sm text-foreground font-medium mt-0.5">{depot.country || 'Nigeria'}</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">Postcode</p>
                  <p className="text-sm text-foreground font-mono mt-0.5">{depot.postcode || 'N/A'}</p>
                </div>
              </div>
              <div className="pt-2 border-t">
                <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">System Database ID</p>
                <p className="text-xs font-mono text-muted-foreground mt-0.5 truncate select-all">{activeDepotId}</p>
              </div>
            </CardContent>
          </Card>

          {/* Personnel & Operations */}
          <Card className="shadow-sm">
            <CardHeader className="border-b border-border/50 pb-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                  <User size={16} />
                </div>
                <div>
                  <CardTitle className="text-sm font-semibold">Assigned Staff & Operations</CardTitle>
                  <CardDescription className="text-xs">Hub management personnel and operating schedule</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div>
                <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">Operating Schedule</p>
                <p className="text-sm text-foreground font-medium mt-0.5 flex items-center gap-1.5">
                  <Activity size={14} className="text-emerald-500" />
                  <span>24 Hours / 7 Days a week</span>
                </p>
              </div>

              <div>
                <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">Hub Status</p>
                <div className="mt-1">{getStatusBadge(depot.status)}</div>
              </div>

              <div>
                <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">Assigned Staff Members ({staffList.length})</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {staffList.length > 0 ? (
                    staffList.map((s) => {
                      const sId = typeof s === 'object' ? (s._id || s.adminId || s.id) : s
                      const fn = typeof s === 'object' ? (s.firstName || s.first_name || '') : ''
                      const sn = typeof s === 'object' ? (s.surname || s.last_name || '') : ''
                      const initials = (fn[0] || '') + (sn[0] || '')
                      const fullName = typeof s === 'object' ? (`${fn} ${sn}`.trim() || s.full_name || s.email || 'Staff') : String(s)
                      return (
                        <div key={sId} className="flex items-center gap-2 bg-secondary px-3 py-1.5 rounded-full text-xs font-medium">
                          <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                            {initials || '?'}
                          </div>
                          <span className="text-foreground">{fullName}</span>
                        </div>
                      )
                    })
                  ) : (
                    <span className="text-xs text-muted-foreground italic">No specific staff assigned to this hub.</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Configured Bank Accounts */}
          <Card className="md:col-span-2 shadow-sm">
            <CardHeader className="border-b border-border/50 pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <Landmark size={16} />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-semibold">Depot Bank Accounts</CardTitle>
                    <CardDescription className="text-xs">Bank accounts and account numbers configured for receiving payments at this depot hub</CardDescription>
                  </div>
                </div>
                <Badge variant="outline" className="font-mono text-xs">
                  {displayBankAccounts.length} Account{displayBankAccounts.length !== 1 ? 's' : ''}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {isLoadingBankAccounts ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : displayBankAccounts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No bank accounts have been configured for this depot hub.</p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {displayBankAccounts.map((acc: any) => {
                    const accId = acc.id || acc._id
                    const isCopied = copiedAccount === acc.accountNumber
                    return (
                      <div key={accId} className="flex flex-col justify-between p-4 border rounded-xl bg-card hover:border-primary/50 transition-colors shadow-sm">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <Badge variant="outline" className="text-[10px] font-mono mb-1.5 bg-primary/5 text-primary border-primary/20">
                              {acc.bankCode ? `${acc.bankName} (${acc.bankCode})` : acc.bankName}
                            </Badge>
                            <h4 className="text-sm font-bold text-foreground">{acc.accountName}</h4>
                          </div>
                          <Badge className={acc.status === 'Active' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' : 'bg-muted text-muted-foreground'}>
                            {acc.status}
                          </Badge>
                        </div>

                        <div className="mt-4 pt-3 border-t flex items-center justify-between">
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">Account Number</p>
                            <p className="text-lg font-mono font-bold text-primary tracking-wide">{acc.accountNumber}</p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 gap-1.5 font-mono text-xs cursor-pointer hover:bg-primary/5"
                            onClick={() => handleCopyAccount(acc.accountNumber)}
                          >
                            {isCopied ? <CheckCircle2 size={14} className="text-emerald-500" /> : <Copy size={14} />}
                            <span>{isCopied ? 'Copied' : 'Copy'}</span>
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab 2: Inventory & Pricing */}
      {activeTab === 'inventory' && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Storage Capacities */}
          <Card className="md:col-span-2 shadow-sm">
            <CardHeader className="border-b border-border/50 pb-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <Warehouse size={16} />
                </div>
                <div>
                  <CardTitle className="text-sm font-semibold">Storage Capacities by Product</CardTitle>
                  <CardDescription className="text-xs">Holding capacity configuration for registered products</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {!depot.productCapacities || depot.productCapacities.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No product-specific storage capacities have been configured for this depot.</p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {depot.productCapacities.map((pc: any) => {
                    const prodName = pc.product?.name || pc.productName || 'Unknown Product'
                    const prodSku = pc.product?.sku || pc.productSku || 'N/A'
                    const prodCat = pc.product?.category || pc.productCategory || 'N/A'
                    const prodId = pc.product?._id || pc.product?.id || pc.productId || String(pc.product || Math.random())
                    return (
                      <div key={prodId} className="flex items-center justify-between p-4 border rounded-xl bg-card shadow-sm hover:border-primary/40 transition-colors">
                        <div>
                          <p className="text-sm font-bold text-foreground">{prodName}</p>
                          <p className="text-xs text-muted-foreground font-mono mt-0.5">{prodSku} &bull; {prodCat}</p>
                        </div>
                        <Badge variant="outline" className="font-mono text-sm font-bold bg-secondary px-3 py-1">
                          {(pc.capacity || 0).toLocaleString()} Units
                        </Badge>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Product Pricing & Price History Editor */}
          <Card className="md:col-span-2 shadow-sm">
            <CardHeader className="border-b border-border/50 pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <DollarSign size={16} />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-semibold">Product Pricing at Depot</CardTitle>
                    <CardDescription className="text-xs">Set and manage the price of each product stored in this depot</CardDescription>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs font-mono">
                  Live Price Manager
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {(() => {
                const products = depot.productCapacities || []
                const prices = localPrices ?? depot.productPrices ?? []

                if (products.length === 0) {
                  return <p className="text-sm text-muted-foreground text-center py-6">No products have been configured for this depot. Add product capacities first to set pricing.</p>
                }

                return (
                  <div className="space-y-3">
                    {products.map((pc: any) => {
                      const productId = String(pc.product?._id || pc.product?.id || pc.product || pc.productId)
                      const productName = pc.product?.name || pc.productName || 'Unknown Product'
                      const productSku = pc.product?.sku || pc.productSku || 'N/A'
                      const priceEntry = prices.find((pp: any) => String(pp.product?._id || pp.product?.id || pp.product || pp.productId) === productId)
                      const currentPrice = priceEntry?.currentPrice
                      const history = (priceEntry as any)?.priceHistory || []
                      const isEditing = editingProductId === productId
                      const isHistoryOpen = expandedHistory === productId

                      const lastHistoryPrice = history.length > 0 ? history[history.length - 1].price : null
                      const priceTrend = currentPrice !== undefined && lastHistoryPrice !== null
                        ? currentPrice > lastHistoryPrice ? 'up' : currentPrice < lastHistoryPrice ? 'down' : 'same'
                        : null

                      return (
                        <div key={productId} className="border rounded-xl bg-card overflow-hidden shadow-sm hover:border-border transition-colors">
                          <div className="flex items-center justify-between p-4 flex-wrap gap-3">
                            <div className="flex-1 min-w-[200px]">
                              <p className="text-sm font-bold text-foreground">{productName}</p>
                              <p className="text-xs text-muted-foreground font-mono mt-0.5">{productSku} &bull; {pc.product?.category || 'N/A'}</p>
                            </div>

                            <div className="flex items-center gap-3">
                              {isEditing ? (
                                <div className="flex items-center gap-1.5">
                                  <div className="relative">
                                    <Input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      value={editPrice}
                                      onChange={(e) => setEditPrice(e.target.value)}
                                      className="w-36 h-8 text-sm font-mono tabular-nums"
                                      placeholder="0.00"
                                      autoFocus
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          const val = parseFloat(editPrice)
                                          if (!isNaN(val) && val >= 0) {
                                            updatePrice.mutate(
                                              { depotId: activeDepotId, productId, price: val },
                                              {
                                                onSuccess: (res) => {
                                                  const updatedPrices = res?.data?.depot?.productPrices || res?.depot?.productPrices
                                                  if (updatedPrices) {
                                                    setLocalPrices(updatedPrices)
                                                  }
                                                  setEditingProductId(null)
                                                  setEditPrice('')
                                                  toast.success(`Updated price for ${productName}`)
                                                },
                                              }
                                            )
                                          }
                                        }
                                        if (e.key === 'Escape') {
                                          setEditingProductId(null)
                                          setEditPrice('')
                                        }
                                      }}
                                    />
                                  </div>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 text-emerald-600 hover:bg-emerald-500/10 cursor-pointer"
                                    disabled={updatePrice.isPending}
                                    onClick={() => {
                                      const val = parseFloat(editPrice)
                                      if (!isNaN(val) && val >= 0) {
                                        updatePrice.mutate(
                                          { depotId: activeDepotId, productId, price: val },
                                          {
                                            onSuccess: (res) => {
                                              const updatedPrices = res?.data?.depot?.productPrices || res?.depot?.productPrices
                                              if (updatedPrices) {
                                                setLocalPrices(updatedPrices)
                                              }
                                              setEditingProductId(null)
                                              setEditPrice('')
                                              toast.success(`Updated price for ${productName}`)
                                            },
                                          }
                                        )
                                      }
                                    }}
                                  >
                                    {updatePrice.isPending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 text-destructive hover:bg-destructive/10 cursor-pointer"
                                    onClick={() => { setEditingProductId(null); setEditPrice('') }}
                                  >
                                    <X size={14} />
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  {currentPrice !== undefined ? (
                                    <div className="flex items-center gap-1.5">
                                      {priceTrend === 'up' && <TrendingUp size={14} className="text-emerald-500" />}
                                      {priceTrend === 'down' && <TrendingDown size={14} className="text-destructive" />}
                                      <Badge variant="outline" className="font-mono text-sm font-bold bg-secondary px-3 py-1">
                                        ₦{currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </Badge>
                                    </div>
                                  ) : (
                                    <Badge variant="outline" className="text-xs text-muted-foreground">No price set</Badge>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 text-xs gap-1.5 cursor-pointer"
                                    onClick={() => {
                                      setEditingProductId(productId)
                                      setEditPrice(currentPrice !== undefined ? String(currentPrice) : '')
                                    }}
                                  >
                                    <Edit size={13} />
                                    <span>Edit</span>
                                  </Button>
                                  {history.length > 0 && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-8 text-xs gap-1 text-muted-foreground hover:text-foreground cursor-pointer"
                                      onClick={() => setExpandedHistory(isHistoryOpen ? null : productId)}
                                    >
                                      <History size={13} />
                                      <span>History</span>
                                      {isHistoryOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                    </Button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          {isHistoryOpen && history.length > 0 && (
                            <div className="border-t border-border/50 bg-muted/30 px-4 py-3">
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                <Clock size={12} /> Price Modification History
                              </p>
                              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                                {[...history].reverse().map((h, idx) => {
                                  const nextPrice = idx === 0 ? currentPrice : [...history].reverse()[idx - 1]?.price
                                  const isIncrease = nextPrice !== undefined && nextPrice > h.price
                                  const isDecrease = nextPrice !== undefined && nextPrice < h.price
                                  const hDate = h.setAt ? new Date(h.setAt) : new Date()
                                  const hDateStr = !isNaN(hDate.getTime())
                                    ? `${hDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} ${hDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
                                    : 'N/A'

                                  return (
                                    <div key={idx} className="flex items-center justify-between py-1.5 px-3 rounded-lg text-xs bg-background/60 border border-border/40">
                                      <div className="flex items-center gap-2">
                                        {isIncrease && <TrendingUp size={12} className="text-emerald-500" />}
                                        {isDecrease && <TrendingDown size={12} className="text-destructive" />}
                                        {!isIncrease && !isDecrease && <div className="w-3" />}
                                        <span className="font-mono font-bold text-foreground">₦{h.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                      </div>
                                      <span className="text-muted-foreground font-mono">{hDateStr}</span>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )
              })()}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab 3: PFIs & Stock Allocation */}
      {activeTab === 'pfis' && (
        <Card className="shadow-sm">
          <CardHeader className="border-b border-border/50 pb-3">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <FileText size={16} />
                </div>
                <div>
                  <CardTitle className="text-sm font-semibold">Assigned PFIs ({pfis.length})</CardTitle>
                  <CardDescription className="text-xs">Proforma Invoices and stock volumes registered to this depot hub</CardDescription>
                </div>
              </div>

              <Button
                size="sm"
                className="gap-1.5 text-xs font-semibold"
                onClick={() => navigate({ to: '/pfi/form' as any, search: { depotId: activeDepotId } as any })}
              >
                <Plus size={14} /> Register New PFI
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {isLoadingPfis ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : pfis.length === 0 ? (
              <div className="text-center py-10 space-y-3">
                <FileText size={36} className="mx-auto text-muted-foreground/40" />
                <p className="text-sm font-medium text-foreground">No PFIs currently assigned</p>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">There are no Proforma Invoices associated with this depot. Register a PFI to allocate stock capacity.</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate({ to: '/pfi/form' as any, search: { depotId: activeDepotId } as any })}
                >
                  <Plus size={14} /> Assign PFI
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {pfis.map((pfi: any) => {
                  const pfiId = pfi._id || pfi.id
                  const stats = getPfiVolumeStats(pfi)
                  const unit = pfi.productUnit || 'Litres'
                  const progressPct = stats.starting > 0 ? Math.min((stats.sold / stats.starting) * 100, 100) : 0
                  const pfiDateObj = (pfi.pfiDate || pfi.pfi_date || pfi.createdAt) ? new Date(pfi.pfiDate || pfi.pfi_date || pfi.createdAt) : null
                  const pfiDateStr = pfiDateObj && !isNaN(pfiDateObj.getTime())
                    ? pfiDateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                    : ''

                  return (
                    <div
                      key={pfiId}
                      onClick={() => navigate({ to: '/pfi/details' as any, search: { id: pfiId } as any })}
                      className="flex flex-col p-4 border rounded-xl bg-card hover:bg-muted/30 transition-all cursor-pointer hover:border-primary/50 group shadow-sm justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-foreground px-2.5 py-0.5 rounded-md bg-primary/10 border border-primary/20 group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                                {pfi.pfiNumber || pfi.pfi_number}
                              </span>
                              {pfiDateStr && (
                                <span className="text-[10px] text-muted-foreground font-mono">
                                  {pfiDateStr}
                                </span>
                              )}
                            </div>
                            <p className="text-sm font-bold text-foreground mt-2">{pfi.productName || pfi.product_name || 'Unknown Product'}</p>
                            {pfi.description && (
                              <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{pfi.description}</p>
                            )}
                          </div>
                          <Badge className={pfi.status === 'active' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' : 'bg-secondary text-secondary-foreground'}>
                            {pfi.status || 'Active'}
                          </Badge>
                        </div>

                        <div className="mt-4 space-y-1.5">
                          <div className="flex justify-between text-xs text-muted-foreground font-medium">
                            <span>Sold: <strong>{stats.sold.toLocaleString()}</strong> / {stats.starting.toLocaleString()} {unit}</span>
                            <span className="font-mono font-bold text-foreground">{Math.round(progressPct)}%</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden w-full">
                            <div
                              className="h-full rounded-full transition-all duration-700 bg-primary"
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {(pfi.vesselName || pfi.vessel_name) && (
                        <div className="mt-4 pt-3 border-t border-dashed flex justify-between items-center text-[11px] text-muted-foreground">
                          <span className="truncate max-w-[55%]">Vessel: <strong className="text-foreground">{pfi.vesselName || pfi.vessel_name}</strong></span>
                          {(pfi.unitPrice || pfi.unit_price) && (
                            <span className="font-mono font-medium text-foreground">₦{Number(pfi.unitPrice || pfi.unit_price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / L</span>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tab 4: Orders & Revenue */}
      {activeTab === 'orders' && (
        <Card className="shadow-sm">
          <CardHeader className="border-b border-border/50 pb-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <ShoppingBag size={16} />
                </div>
                <div>
                  <CardTitle className="text-sm font-semibold">Depot Orders ({filteredOrders.length})</CardTitle>
                  <CardDescription className="text-xs">Monitor and manage all customer orders assigned to {depot.name}</CardDescription>
                </div>
              </div>

              {/* Status Filter Pills */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {['All', 'Pending', 'Paid', 'Released', 'Loading', 'Completed', 'Cancelled'].map((st) => {
                  const count = st === 'All'
                    ? ordersList.length
                    : ordersList.filter((o: any) => o.status === st).length

                  const isActive = statusFilter === st

                  return (
                    <button
                      key={st}
                      onClick={() => setStatusFilter(st)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${isActive
                          ? 'bg-primary text-primary-foreground shadow-sm font-semibold'
                          : 'bg-secondary text-secondary-foreground hover:bg-muted'
                        }`}
                    >
                      <span>{st}</span>
                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${isActive ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'
                        }`}>
                        {count}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            {isLoadingOrders ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-12 space-y-2">
                <ShoppingBag size={36} className="mx-auto text-muted-foreground/40" />
                <p className="text-sm font-medium text-foreground">No orders found</p>
                <p className="text-xs text-muted-foreground">There are currently no orders under {depot.name} matching status "{statusFilter}".</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredOrders.map((order: any) => {
                  const ordId = String(order._id || order.id)
                  const isExpanded = expandedOrder === ordId
                  const isSuccessful = ['Paid', 'Released', 'Loading', 'Completed'].includes(order.status) || order.paymentStatus === 'Paid'
                  const ordCustomerName = order.customerName || order.customer_name || (typeof order.customer === 'object' ? `${order.customer?.firstName || ''} ${order.customer?.lastName || order.customer?.surname || ''}`.trim() : '') || 'N/A'
                  const ordProductName = order.productName || order.product_name || order.product?.name || 'N/A'
                  const ordDateObj = order.createdAt ? new Date(order.createdAt) : null
                  const ordDateStr = ordDateObj && !isNaN(ordDateObj.getTime())
                    ? ordDateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                    : ''

                  return (
                    <div
                      key={ordId}
                      className="border rounded-xl bg-card overflow-hidden transition-all hover:border-primary/40 shadow-sm"
                    >
                      <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              onClick={() => navigate({ to: '/orders/details' as any, search: { id: ordId } as any })}
                              className="font-mono font-bold text-sm text-primary hover:underline cursor-pointer"
                            >
                              {order.orderNumber || order.order_number}
                            </span>
                            <Badge
                              className={
                                order.status === 'Completed'
                                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                                  : order.status === 'Cancelled'
                                    ? 'bg-destructive/15 text-destructive border-destructive/30'
                                    : order.status === 'Paid' || order.status === 'Released'
                                      ? 'bg-blue-500/15 text-blue-500 border-blue-500/30'
                                      : 'bg-amber-500/15 text-amber-600 border-amber-500/30'
                              }
                            >
                              {order.status}
                            </Badge>
                            <Badge variant="outline" className="capitalize text-[10px] font-mono">
                              {order.deliveryType || order.delivery_type || 'pickup'}
                            </Badge>
                          </div>

                          <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-3 pt-1">
                            <span>Customer: <strong className="text-foreground">{ordCustomerName}</strong></span>
                            <span>&bull;</span>
                            <span>Product: <strong className="text-foreground">{ordProductName}</strong></span>
                            <span>&bull;</span>
                            <span>Qty: <strong className="text-foreground">{Number(order.quantity || 0).toLocaleString()} {order.productUnit || order.product_unit || 'L'}</strong></span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0">
                          <div className="text-left md:text-right">
                            <div className="text-sm font-bold text-foreground">
                              ₦{Number(order.totalAmount ?? order.total_amount ?? order.amount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            <div className="text-[10px] text-muted-foreground font-mono">
                              {ordDateStr}
                            </div>
                          </div>

                          {isSuccessful ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1 text-xs cursor-pointer"
                              onClick={() => setExpandedOrder(isExpanded ? null : ordId)}
                            >
                              <Receipt size={14} className="text-emerald-500" />
                              <span>{isExpanded ? 'Hide Deposits' : 'View Deposits'}</span>
                              <ChevronDown size={14} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs cursor-pointer"
                              onClick={() => navigate({ to: '/orders/details' as any, search: { id: ordId } as any })}
                            >
                              Details &rarr;
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Deposit breakdown for successful order */}
                      {isExpanded && isSuccessful && (
                        <OrderDepositBreakdown order={order} />
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tab 5: Audit & Activity Log */}
      {activeTab === 'activity' && (
        <Card className="shadow-sm">
          <CardHeader className="border-b border-border/50 pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                  <Activity size={16} />
                </div>
                <div>
                  <CardTitle className="text-sm font-semibold">Depot Activity Timeline ({activityEvents.length})</CardTitle>
                  <CardDescription className="text-xs">Real-time log of price adjustments, PFI registrations, and order activity</CardDescription>
                </div>
              </div>
              <Badge variant="outline" className="font-mono text-xs gap-1">
                <ShieldCheck size={12} className="text-emerald-500" /> Verified Audit Feed
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {activityEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No recent activity logs recorded for this depot hub.</p>
            ) : (
              <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
                {activityEvents.map((evt) => {
                  const IconComp = evt.icon
                  return (
                    <div key={evt.id} className="relative flex items-start justify-between gap-4 group">
                      <div className="absolute -left-6 top-1 h-5 w-5 rounded-full bg-background border-2 border-primary flex items-center justify-center text-primary text-[10px]">
                        <IconComp size={10} />
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-foreground">{evt.title}</span>
                          <Badge variant="outline" className={`text-[10px] ${evt.badgeColor}`}>
                            {evt.type.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{evt.description}</p>
                      </div>
                      <span className="text-[11px] text-muted-foreground font-mono shrink-0">
                        {evt.date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}{' '}
                        {evt.date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Remove Depot Hub"
        description="Are you sure you want to remove this depot hub? This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={confirmDelete}
        loading={deleteDepot.isPending}
      />
    </div>
  )
}

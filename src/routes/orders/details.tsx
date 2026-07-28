import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '#/components/ui/card'
import {
  ArrowLeft, Loader2, AlertCircle, ShoppingBag,
  User, Warehouse, Package, MapPin,
  Calendar, Info, Phone, Mail, Building2, Truck, FileCheck, Banknote, Copy, CheckCircle, Ticket as TicketIcon, Check
} from 'lucide-react'
import { useOrderDetails, useUpdateOrder } from '#/lib/hooks/useOrders'
import { Breadcrumbs } from '#/components/Breadcrumbs'
import { ConfirmDialog } from '#/components/ConfirmDialog'

export const Route = createFileRoute('/orders/details')({
  validateSearch: (search: Record<string, unknown>) => ({
    id: (search.id as string) || '',
  }),
  component: RouteComponent,
})

const toNum = (v: string | number | undefined | null): number => {
  if (v === undefined || v === null || v === '') return 0
  const n = Number(String(v).replace(/,/g, ''))
  return Number.isFinite(n) ? n : 0
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 2 }).format(value)
}

function formatAccountName(name?: string) {
  if (!name) return 'N/A';
  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase())
    .join(' ');
  return `SOROMANNIGERI/ ${initials}`;
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'Completed':
      return <Badge className="bg-success text-success-foreground">Completed</Badge>
    case 'Pending':
      return <Badge className="bg-warning text-warning-foreground">Pending</Badge>
    case 'Cancelled':
      return <Badge className="bg-destructive text-destructive-foreground">Cancelled</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

function RouteComponent() {
  const navigate = useNavigate()
  const { id } = Route.useSearch()
  const { data: order, isLoading } = useOrderDetails(id)
  const [copied, setCopied] = useState(false)
  const updateMutation = useUpdateOrder()
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [confirmAction, setConfirmAction] = useState<{ type: 'status' | 'payment'; value: string } | null>(null)

  const handleBack = () => {
    window.history.length > 1 ? window.history.back() : navigate({ to: '/orders/' as any })
  }

  const handleUpdateStatus = (status: string) => {
    if (!order) return
    setConfirmAction({ type: 'status', value: status })
    setShowConfirmDialog(true)
  }

  const handleUpdatePayment = (paymentStatus: string) => {
    if (!order) return
    setConfirmAction({ type: 'payment', value: paymentStatus })
    setShowConfirmDialog(true)
  }

  const executeConfirmAction = async () => {
    if (!order || !confirmAction) return
    if (confirmAction.type === 'status') {
      await updateMutation.mutateAsync({
        id: order._id || order.id,
        data: { status: confirmAction.value }
      })
    } else {
      await updateMutation.mutateAsync({
        id: order._id || order.id,
        data: { paymentStatus: confirmAction.value }
      })
    }
    setShowConfirmDialog(false)
    setConfirmAction(null)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={32} className="animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-5 text-center">
        <div className="h-16 w-16 rounded-full bg-warning/10 flex items-center justify-center text-warning border border-warning/20">
          <AlertCircle size={32} />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Order Not Found</h2>
        <p className="text-muted-foreground max-w-sm">The requested order details could not be found or loaded.</p>
        <Button onClick={() => navigate({ to: '/orders/' as any })}><ArrowLeft size={16} /> Back to Orders</Button>
      </div>
    )
  }

  const orderDate = order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-NG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }) : 'N/A'

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Orders', href: '/orders' }, { label: order?.orderNumber || 'Details' }]} />
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={handleBack}><ArrowLeft size={16} /></Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Order Details</h1>
            <p className="text-muted-foreground">Detailed breakdown of the sales order and fulfillment status</p>
          </div>
        </div>
      </header>

      {/* Main Order Card Header */}
      <Card className="card-hover">
        <CardContent className="p-6 md:p-8 bg-gradient-to-r from-primary/5 to-info/5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
            <div className="flex items-start sm:items-center gap-5">
              <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-primary-foreground shadow-lg shrink-0">
                <ShoppingBag size={28} />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="font-mono text-xs">ID: {order._id || order.id}</Badge>
                  {getStatusBadge(order.status)}
                </div>
                <h2 className="text-2xl font-bold text-foreground mt-2">Order {order.orderNumber}</h2>
                <p className="text-muted-foreground mt-1 text-sm flex items-center gap-1.5">
                  <Calendar size={14} className="shrink-0" />
                  {orderDate}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Order Info & Cost Breakdown */}
        <Card>
          <CardHeader className="border-b border-border">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Info size={16} />
              </div>
              <div>
                <CardTitle className="text-sm">Summary & Pricing</CardTitle>
                <CardDescription className="text-xs">Quantity, unit price, and total amount details</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="flex justify-between items-center py-2 border-b border-border/50">
              <span className="text-sm text-muted-foreground">Fulfillment Type</span>
              <Badge variant="outline" className="capitalize font-semibold">
                {order.deliveryType === 'delivery' ? (
                  <span className="flex items-center gap-1"><Truck size={12} /> Delivery</span>
                ) : (
                  <span className="flex items-center gap-1"><Warehouse size={12} /> Pickup</span>
                )}
              </Badge>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border/50">
              <span className="text-sm text-muted-foreground">Quantity Ordered</span>
              <span className="font-mono font-semibold text-foreground">
                {toNum(order.quantity)?.toLocaleString()} {order.productUnit || order.product?.unit || 'Liters'}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border/50">
              <span className="text-sm text-muted-foreground">Unit Price</span>
              <span className="font-mono font-medium text-foreground">
                {formatCurrency(toNum(order.price))} per {(order.productUnit || order.product?.unit) === 'Liters' ? 'Liter' : 'Unit'}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2">
              <span className="text-base font-semibold text-foreground">Total Transaction Value</span>
              <span className="font-mono text-lg font-bold text-primary">
                {formatCurrency(toNum(order.totalAmount))}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Customer Information */}
        <Card>
          <CardHeader className="border-b border-border">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-success/10 flex items-center justify-center text-success">
                <User size={16} />
              </div>
              <div>
                <CardTitle className="text-sm">Customer Profile</CardTitle>
                <CardDescription className="text-xs">Client identification and billing contact details</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Client Name</p>
              <p className="text-sm font-semibold text-foreground mt-0.5">{order.customerName || order.customer?.name || 'N/A'}</p>
            </div>
            {(order.customerCompanyName || order.customer?.companyName) && (
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Company</p>
                <p className="text-sm text-foreground mt-0.5 flex items-center gap-1.5">
                  <Building2 size={14} className="text-muted-foreground" />
                  {order.customerCompanyName || order.customer?.companyName}
                </p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Email Address</p>
                <p className="text-sm text-foreground mt-0.5 flex items-center gap-1.5 truncate">
                  <Mail size={14} className="text-muted-foreground shrink-0" />
                  {order.customerEmail || order.customer?.email || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Phone Line</p>
                <p className="text-sm text-foreground mt-0.5 flex items-center gap-1.5">
                  <Phone size={14} className="text-muted-foreground shrink-0" />
                  {order.customerPhone || order.customer?.phone || 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Product Information */}
        <Card>
          <CardHeader className="border-b border-border">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-warning/10 flex items-center justify-center text-warning">
                <Package size={16} />
              </div>
              <div>
                <CardTitle className="text-sm">Product Specifications</CardTitle>
                <CardDescription className="text-xs">Details of the purchased inventory item</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Product Name</p>
              <p className="text-sm font-semibold text-foreground mt-0.5">{order.productName || order.product?.name || 'N/A'}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Product SKU / Code</p>
                <p className="text-sm font-mono text-foreground mt-0.5 font-semibold bg-muted border border-border px-2 py-0.5 rounded w-fit text-xs">
                  {order.productSku || order.product?.sku || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Category</p>
                <p className="text-sm text-foreground mt-0.5">{order.productCategory || order.product?.category || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Depot / Logistics Information */}
        <Card>
          <CardHeader className="border-b border-border">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-info/10 flex items-center justify-center text-info">
                <Warehouse size={16} />
              </div>
              <div>
                <CardTitle className="text-sm">Logistics & Depot Origin</CardTitle>
                <CardDescription className="text-xs">Location and depot processing this transaction</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Fulfillment Depot</p>
              <p className="text-sm font-semibold text-foreground mt-0.5 flex items-center gap-1.5">
                {order.depotName || order.depot?.name || 'N/A'}
                {(order.depotCode || order.depot?.code) && (
                  <Badge variant="outline" className="font-mono text-[10px] py-0 px-1.5">{order.depotCode || order.depot?.code}</Badge>
                )}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">LGA / City</p>
                <p className="text-sm text-foreground mt-0.5">{order.depotCity || order.depot?.city || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">State Region</p>
                <p className="text-sm text-foreground mt-0.5 flex items-center gap-1">
                  <MapPin size={12} className="text-primary shrink-0" />
                  {order.state || order.depotState || order.depot?.state || 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* PFI Source Information */}
        {order.pfiId && (
          <Card>
            <CardHeader className="border-b border-border">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <FileCheck size={16} />
                </div>
                <div>
                  <CardTitle className="text-sm">PFI Source Inventory</CardTitle>
                  <CardDescription className="text-xs">Pro Forma Invoice linked to this order</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">PFI Number</p>
                <p className="text-sm font-semibold text-foreground mt-0.5 flex items-center gap-1.5">
                  <Badge variant="outline" className="font-mono text-xs">{order.pfiNumber}</Badge>
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Starting Qty</p>
                  <p className="text-sm font-mono font-semibold text-foreground mt-0.5">
                    {toNum(order.startingQtyLitres).toLocaleString()} {order.productUnit || 'Litres'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Sold Qty</p>
                  <p className="text-sm font-mono font-semibold text-foreground mt-0.5">
                    {toNum(order.soldQtyLitres).toLocaleString()} {order.productUnit || 'Litres'}
                  </p>
                </div>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-border/50">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">PFI Status</span>
                <Badge className={order.pfiStatus === 'active' ? 'bg-success/10 text-success border border-success/20' : 'bg-muted text-muted-foreground border border-border'}>
                  {order.pfiStatus === 'active' ? 'Active' : 'Finished'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Payment Information */}
      {(order.virtualAccountNumber || order.paymentStatus) && (
        <Card className="card-hover">
          <CardHeader className="border-b border-border">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-success/10 flex items-center justify-center text-success">
                <Banknote size={16} />
              </div>
              <div>
                <CardTitle className="text-sm">Payment Information</CardTitle>
                <CardDescription className="text-xs">Dedicated virtual account and payment status</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="flex justify-between items-center py-2 border-b border-border/50">
              <span className="text-sm text-muted-foreground">Payment Status</span>
              <Badge className={order.paymentStatus === 'Paid' ? 'bg-success text-success-foreground' : 'bg-warning text-warning-foreground'}>
                {order.paymentStatus || 'Unpaid'}
              </Badge>
            </div>
            {order.virtualAccountNumber && (
              <>
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Bank</p>
                  <p className="text-sm font-semibold text-foreground mt-0.5">{order.virtualAccountBank || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Account Number</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-lg font-bold font-mono text-foreground tracking-wider">{order.virtualAccountNumber}</p>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(order.virtualAccountNumber)
                        setCopied(true)
                        setTimeout(() => setCopied(false), 2000)
                      }}
                      className="h-7 w-7 rounded-md border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      title="Copy account number"
                    >
                      {copied ? <CheckCircle size={14} className="text-success" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Account Name</p>
                  <p className="text-sm font-semibold text-foreground mt-0.5">{order.virtualAccountName || formatAccountName(order.customerName || order.customer?.name)}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Admin Actions and Ticket Access */}
      <Card className="border-2 border-primary/20 shadow-md">
        <CardHeader className="bg-primary/5 border-b border-primary/10">
          <CardTitle className="text-sm font-semibold text-primary">Order Actions & Ticket Management</CardTitle>
          <CardDescription className="text-xs">Mark order payment, status, or view generated pickup tickets.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 flex flex-wrap gap-4">
          {order.paymentStatus !== 'Paid' && (
            <Button
              className="bg-success text-success-foreground hover:bg-success/90 cursor-pointer"
              onClick={() => handleUpdatePayment('Paid')}
              disabled={updateMutation.isPending}
            >
              <Check className="w-4 h-4 mr-2" /> Mark as Paid
            </Button>
          )}

          {order.status !== 'Completed' && (
            <Button
              className="bg-info text-info-foreground hover:bg-info/90 cursor-pointer"
              onClick={() => handleUpdateStatus('Completed')}
              disabled={updateMutation.isPending}
            >
              <Check className="w-4 h-4 mr-2" /> Mark as Completed
            </Button>
          )}

          {order.status === 'Cancelled' && (
            <span className="text-sm text-destructive font-medium flex items-center">Order was Cancelled</span>
          )}

          {(order.paymentStatus === 'Paid' || order.status === 'Completed') && (
            <Button
              variant="outline"
              className="border-primary text-primary hover:bg-primary/10 cursor-pointer"
              onClick={() => {
                const suffix = order.orderNumber.replace("ORD-", "")
                navigate({ to: '/ticket/details' as any, search: { id: `TCK-${suffix}` } as any })
              }}
            >
              <TicketIcon className="w-4 h-4 mr-2" /> View Ticket / Receipt QR
            </Button>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        title={confirmAction?.type === 'status' ? 'Update Order Status' : 'Update Payment Status'}
        description={confirmAction?.type === 'status'
          ? `Are you sure you want to mark this order as ${confirmAction?.value}?`
          : `Are you sure you want to mark this order payment as ${confirmAction?.value}?`
        }
        confirmLabel="Confirm"
        onConfirm={executeConfirmAction}
        loading={updateMutation.isPending}
      />
    </div>
  )
}

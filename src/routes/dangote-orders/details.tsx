import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '#/components/ui/card'
import {
  ArrowLeft, AlertCircle, Package, MapPin,
  Calendar, Phone, Mail, Building2, Truck, FileCheck,
  Banknote, Copy, CheckCircle, Clock, XCircle, User, CircleDollarSign,
} from 'lucide-react'
import { useDangoteOrderRequestDetails, useUpdateDangoteOrderPaymentStatus, useUpdateDangoteOrderCollectionStatus } from '#/lib/hooks/useDangoteOrders'
import { Breadcrumbs } from '#/components/Breadcrumbs'
import { ConfirmDialog } from '#/components/ConfirmDialog'
import { PageLoader } from '#/components/PageLoader'
import { PageError } from '#/components/PageError'

export const Route = createFileRoute('/dangote-orders/details')({
  validateSearch: (search: Record<string, unknown>) => ({
    id: (search.id as string) || '',
  }),
  component: DangoteOrderDetails,
})

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 2 }).format(value)
}

function formatAccountName(name?: string) {
  if (!name) return 'N/A'
  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase())
    .join(' ')
  return `SOROMANNIGERI/ ${initials}`
}

function formatDate(dateString: string) {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('en-NG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function paymentStatusBadge(status: string) {
  switch (status) {
    case 'Paid':
      return <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 gap-1"><CheckCircle size={12} /> Paid</Badge>
    case 'Unpaid':
      return <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20 gap-1"><Clock size={12} /> Unpaid</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

function collectionStatusBadge(status: string) {
  switch (status) {
    case 'Collected':
      return <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 gap-1"><CheckCircle size={12} /> Collected</Badge>
    case 'Dispatched':
      return <Badge className="bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20 gap-1"><Truck size={12} /> Dispatched</Badge>
    case 'Pending':
      return <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20 gap-1"><Clock size={12} /> Pending</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

function requestStatusBadge(status: string) {
  switch (status) {
    case 'Pending Review':
      return <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20 gap-1"><Clock size={12} /> Pending Review</Badge>
    case 'Approved':
      return <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 gap-1"><CheckCircle size={12} /> Approved</Badge>
    case 'Rejected':
      return <Badge variant="destructive" className="gap-1"><XCircle size={12} /> Rejected</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

function DangoteOrderDetails() {
  const navigate = useNavigate()
  const { id } = Route.useSearch()

  const { data: request, isLoading, isError, error, refetch } = useDangoteOrderRequestDetails(id)
  const updatePaymentMutation = useUpdateDangoteOrderPaymentStatus()
  const updateCollectionMutation = useUpdateDangoteOrderCollectionStatus()

  const [copied, setCopied] = useState(false)
  const [showPaymentConfirm, setShowPaymentConfirm] = useState(false)
  const [showCollectionConfirm, setShowCollectionConfirm] = useState(false)
  const [pendingPaymentStatus, setPendingPaymentStatus] = useState('')
  const [pendingCollectionStatus, setPendingCollectionStatus] = useState('')

  const handleUpdatePayment = (status: string) => {
    setPendingPaymentStatus(status)
    setShowPaymentConfirm(true)
  }

  const handleUpdateCollection = (status: string) => {
    setPendingCollectionStatus(status)
    setShowCollectionConfirm(true)
  }

  const executePaymentUpdate = async () => {
    if (!request || !pendingPaymentStatus) return
    await updatePaymentMutation.mutateAsync({ id: request.id, paymentStatus: pendingPaymentStatus })
    setShowPaymentConfirm(false)
    setPendingPaymentStatus('')
  }

  const executeCollectionUpdate = async () => {
    if (!request || !pendingCollectionStatus) return
    await updateCollectionMutation.mutateAsync({ id: request.id, collectionStatus: pendingCollectionStatus })
    setShowCollectionConfirm(false)
    setPendingCollectionStatus('')
  }

  if (isLoading) {
    return <PageLoader message="Loading order details..." />
  }

  if (isError) {
    return <PageError message={(error as any)?.message || 'Failed to load order details'} onRetry={refetch} />
  }

  if (!request) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-5 text-center">
        <div className="h-16 w-16 rounded-full bg-warning/10 flex items-center justify-center text-warning border border-warning/20">
          <AlertCircle size={32} />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Order Not Found</h2>
        <p className="text-muted-foreground max-w-sm">The requested order details could not be found or loaded.</p>
        <Button onClick={() => navigate({ to: '/dangote-orders/' as any })}><ArrowLeft size={16} /> Back to Orders</Button>
      </div>
    )
  }

  const reviewerName = [request.reviewerFirstName, request.reviewerSurname].filter(Boolean).join(' ') || 'N/A'

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs items={[
        { label: 'Dangote Orders', href: '/dangote-orders' },
        { label: request.requestNumber },
      ]} />

      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate({ to: '/dangote-orders/' as any })}>
            <ArrowLeft size={16} />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Order Details</h1>
            <p className="text-muted-foreground">Detailed breakdown of the Dangote delivery order</p>
          </div>
        </div>
      </header>

      {/* Main Order Card Header */}
      <Card className="card-hover">
        <CardContent className="p-6 md:p-8 bg-gradient-to-r from-amber-500/5 to-amber-600/5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
            <div className="flex items-start sm:items-center gap-5">
              <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0">
                <Package size={28} />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="font-mono text-xs">ID: {request.id}</Badge>
                  {requestStatusBadge(request.status)}
                  {paymentStatusBadge(request.paymentStatus)}
                  {collectionStatusBadge(request.collectionStatus)}
                </div>
                <h2 className="text-2xl font-bold text-foreground mt-2">{request.requestNumber}</h2>
                <p className="text-muted-foreground mt-1 text-sm flex items-center gap-1.5">
                  <Calendar size={14} className="shrink-0" />
                  {formatDate(request.createdAt)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Summary & Pricing */}
        <Card>
          <CardHeader className="border-b border-border">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <CircleDollarSign size={16} />
              </div>
              <div>
                <CardTitle className="text-sm">Summary & Pricing</CardTitle>
                <CardDescription className="text-xs">Quantity, unit price, and total amount details</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="flex justify-between items-center py-2 border-b border-border/50">
              <span className="text-sm text-muted-foreground">Product</span>
              <span className="font-semibold text-foreground">{request.product}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-border/50">
              <span className="text-sm text-muted-foreground">Quantity</span>
              <span className="font-mono font-semibold text-foreground">
                {Number(request.quantity).toLocaleString()} {request.quantityUnit}
              </span>
            </div>
            {request.pricePerUnit && (
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-sm text-muted-foreground">Price Per {request.quantityUnit === 'Liters' ? 'Litre' : 'Unit'}</span>
                <span className="font-mono font-medium text-foreground">{formatCurrency(Number(request.pricePerUnit))}</span>
              </div>
            )}
            {request.deliveryPrice && (
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-sm text-muted-foreground">Delivery Price</span>
                <span className="font-mono font-medium text-foreground">{formatCurrency(Number(request.deliveryPrice))}</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-2">
              <span className="text-base font-semibold text-foreground">Total Amount</span>
              <span className="font-mono text-lg font-bold text-primary">
                {formatCurrency(Number(request.totalAmount) || 0)}
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
                <CardDescription className="text-xs">Client identification and contact details</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Client Name</p>
              <p className="text-sm font-semibold text-foreground mt-0.5">{request.customerName || 'N/A'}</p>
            </div>
            {request.companyName && (
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Company</p>
                <p className="text-sm text-foreground mt-0.5 flex items-center gap-1.5">
                  <Building2 size={14} className="text-muted-foreground" />
                  {request.companyName}
                </p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Email Address</p>
                <p className="text-sm text-foreground mt-0.5 flex items-center gap-1.5 truncate">
                  <Mail size={14} className="text-muted-foreground shrink-0" />
                  {request.customerEmail || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Phone Line</p>
                <p className="text-sm text-foreground mt-0.5 flex items-center gap-1.5">
                  <Phone size={14} className="text-muted-foreground shrink-0" />
                  {request.customerPhone || 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Delivery Information */}
        <Card>
          <CardHeader className="border-b border-border">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-info/10 flex items-center justify-center text-info">
                <MapPin size={16} />
              </div>
              <div>
                <CardTitle className="text-sm">Delivery Information</CardTitle>
                <CardDescription className="text-xs">Delivery address and location details</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Delivery Address</p>
              <p className="text-sm font-semibold text-foreground mt-0.5">{request.deliveryAddress || 'N/A'}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">State</p>
                <p className="text-sm text-foreground mt-0.5 flex items-center gap-1">
                  <MapPin size={12} className="text-primary shrink-0" />
                  {request.deliveryState || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">LGA</p>
                <p className="text-sm text-foreground mt-0.5">{request.deliveryLga || 'N/A'}</p>
              </div>
            </div>
            {request.expectedArrivalDate && (
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Expected Arrival</p>
                <p className="text-sm font-semibold text-foreground mt-0.5 flex items-center gap-1.5">
                  <Calendar size={14} className="text-muted-foreground" />
                  {request.expectedArrivalDate}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Review Information */}
        <Card>
          <CardHeader className="border-b border-border">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-violet-500/10 flex items-center justify-center text-violet-600">
                <FileCheck size={16} />
              </div>
              <div>
                <CardTitle className="text-sm">Review Information</CardTitle>
                <CardDescription className="text-xs">Request review and approval details</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="flex justify-between items-center py-2 border-b border-border/50">
              <span className="text-sm text-muted-foreground">Request Status</span>
              {requestStatusBadge(request.status)}
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Reviewed By</p>
              <p className="text-sm font-semibold text-foreground mt-0.5">{reviewerName}</p>
            </div>
            {request.reviewedAt && (
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Reviewed At</p>
                <p className="text-sm text-foreground mt-0.5">{formatDate(request.reviewedAt)}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payment Information */}
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
            {paymentStatusBadge(request.paymentStatus)}
          </div>
          {request.virtualAccountNumber && (
            <>
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Bank</p>
                <p className="text-sm font-semibold text-foreground mt-0.5">{request.virtualAccountBank || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Account Number</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-lg font-bold font-mono text-foreground tracking-wider">{request.virtualAccountNumber}</p>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(request.virtualAccountNumber)
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
                <p className="text-sm font-semibold text-foreground mt-0.5">{request.virtualAccountName || formatAccountName(request.customerName)}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Collection Status */}
      <Card className="card-hover">
        <CardHeader className="border-b border-border">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600">
              <Truck size={16} />
            </div>
            <div>
              <CardTitle className="text-sm">Collection Status</CardTitle>
              <CardDescription className="text-xs">Track the delivery and collection progress</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="flex justify-between items-center py-2 border-b border-border/50">
            <span className="text-sm text-muted-foreground">Collection Status</span>
            {collectionStatusBadge(request.collectionStatus)}
          </div>
          <div className="flex items-center gap-4 pt-4">
            <div className={`flex-1 p-3 rounded-lg border text-center transition-colors ${request.collectionStatus === 'Pending' ? 'bg-amber-500/10 border-amber-500/30' : 'bg-muted/50 border-border'}`}>
              <Clock size={20} className={`mx-auto mb-1 ${request.collectionStatus === 'Pending' ? 'text-amber-600' : 'text-muted-foreground'}`} />
              <p className={`text-xs font-medium ${request.collectionStatus === 'Pending' ? 'text-amber-600' : 'text-muted-foreground'}`}>Pending</p>
            </div>
            <div className={`flex-1 p-3 rounded-lg border text-center transition-colors ${request.collectionStatus === 'Dispatched' ? 'bg-blue-500/10 border-blue-500/30' : 'bg-muted/50 border-border'}`}>
              <Truck size={20} className={`mx-auto mb-1 ${request.collectionStatus === 'Dispatched' ? 'text-blue-600' : 'text-muted-foreground'}`} />
              <p className={`text-xs font-medium ${request.collectionStatus === 'Dispatched' ? 'text-blue-600' : 'text-muted-foreground'}`}>Dispatched</p>
            </div>
            <div className={`flex-1 p-3 rounded-lg border text-center transition-colors ${request.collectionStatus === 'Collected' ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-muted/50 border-border'}`}>
              <CheckCircle size={20} className={`mx-auto mb-1 ${request.collectionStatus === 'Collected' ? 'text-emerald-600' : 'text-muted-foreground'}`} />
              <p className={`text-xs font-medium ${request.collectionStatus === 'Collected' ? 'text-emerald-600' : 'text-muted-foreground'}`}>Collected</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Admin Actions */}
      <Card className="border-2 border-primary/20 shadow-md">
        <CardHeader className="bg-primary/5 border-b border-primary/10">
          <CardTitle className="text-sm font-semibold text-primary">Order Actions</CardTitle>
          <CardDescription className="text-xs">Update payment and collection status</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 flex flex-wrap gap-4">
          {request.paymentStatus !== 'Paid' && (
            <Button
              className="bg-success text-success-foreground hover:bg-success/90 cursor-pointer"
              onClick={() => handleUpdatePayment('Paid')}
              disabled={updatePaymentMutation.isPending}
            >
              <CheckCircle className="w-4 h-4 mr-2" /> Mark as Paid
            </Button>
          )}

          {request.paymentStatus === 'Paid' && request.collectionStatus === 'Pending' && (
            <Button
              className="bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
              onClick={() => handleUpdateCollection('Dispatched')}
              disabled={updateCollectionMutation.isPending}
            >
              <Truck className="w-4 h-4 mr-2" /> Mark as Dispatched
            </Button>
          )}

          {request.collectionStatus === 'Dispatched' && (
            <Button
              className="bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer"
              onClick={() => handleUpdateCollection('Collected')}
              disabled={updateCollectionMutation.isPending}
            >
              <CheckCircle className="w-4 h-4 mr-2" /> Mark as Collected
            </Button>
          )}

          {request.paymentStatus === 'Paid' && request.collectionStatus === 'Collected' && (
            <span className="text-sm text-emerald-600 font-medium flex items-center gap-2">
              <CheckCircle size={16} /> Order completed
            </span>
          )}

          {request.status === 'Pending Review' && (
            <Button
              variant="outline"
              className="border-amber-500 text-amber-600 hover:bg-amber-500/10 cursor-pointer"
              onClick={() => navigate({ to: '/dangote-order-request/review' as any, search: { id: String(request.id) } as any })}
            >
              <FileCheck className="w-4 h-4 mr-2" /> Review Request
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Confirm Dialogs */}
      <ConfirmDialog
        open={showPaymentConfirm}
        onOpenChange={setShowPaymentConfirm}
        title="Update Payment Status"
        description={`Are you sure you want to mark this order payment as ${pendingPaymentStatus}?`}
        confirmLabel="Confirm"
        onConfirm={executePaymentUpdate}
        loading={updatePaymentMutation.isPending}
      />

      <ConfirmDialog
        open={showCollectionConfirm}
        onOpenChange={setShowCollectionConfirm}
        title="Update Collection Status"
        description={`Are you sure you want to mark this order as ${pendingCollectionStatus}?`}
        confirmLabel="Confirm"
        onConfirm={executeCollectionUpdate}
        loading={updateCollectionMutation.isPending}
      />
    </div>
  )
}

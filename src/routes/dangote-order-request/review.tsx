import { useState } from 'react'
import { PageHeader } from '#/components/PageHeader'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '#/components/ui/card'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { CommaInput } from '#/components/ui/comma-input'
import {
  ArrowLeft, Package, MapPin, Truck, DollarSign, Calendar, Clock, CheckCircle, XCircle,
  User, FileText, Mail, Phone, ShieldPlus, AlertTriangle,
} from 'lucide-react'
import { useDangoteOrderRequestDetails, useReviewDangoteOrderRequest } from '#/lib/hooks/useDangoteOrders'
import { PageLoader } from '#/components/PageLoader'
import { PageError } from '#/components/PageError'
import { Breadcrumbs } from '#/components/Breadcrumbs'
import { ConfirmDialog } from '#/components/ConfirmDialog'
import { getErrorMessage } from '#/lib/utils'

export const Route = createFileRoute('/dangote-order-request/review')({
  validateSearch: (search: Record<string, unknown>) => ({
    id: (search.id as string) || '',
  }),
  component: ReviewPage,
})

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 2 }).format(value)
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

function statusBadge(status: string) {
  switch (status) {
    case 'Pending Review':
      return <Badge className="bg-warning/15 text-warning border-warning/20 gap-1"><Clock className="size-3" /> Pending Review</Badge>
    case 'Approved':
      return <Badge className="bg-accent/15 text-accent border-accent/20 gap-1"><CheckCircle className="size-3" /> Approved</Badge>
    case 'Rejected':
      return <Badge variant="destructive" className="gap-1"><XCircle className="size-3" /> Rejected</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

function licenseStatusBadge(status: string) {
  switch (status) {
    case 'approved':
      return <Badge className="bg-accent/15 text-accent border-accent/20 gap-1"><CheckCircle className="size-3" /> Approved</Badge>
    case 'pending':
      return <Badge className="bg-warning/15 text-warning border-warning/20 gap-1"><Clock className="size-3" /> Pending</Badge>
    case 'rejected':
      return <Badge variant="destructive" className="gap-1"><XCircle className="size-3" /> Rejected</Badge>
    default:
      return <Badge variant="outline">{status || 'No Licence'}</Badge>
  }
}

function ReviewPage() {
  const navigate = useNavigate()
  const { id } = Route.useSearch()

  const { data: request, isLoading, isError, error, refetch } = useDangoteOrderRequestDetails(id)
  const reviewMutation = useReviewDangoteOrderRequest()

  const [pricePerUnit, setPricePerUnit] = useState('')
  const [deliveryPrice, setDeliveryPrice] = useState('')
  const [expectedDate, setExpectedDate] = useState('')
  const [showApproveConfirm, setShowApproveConfirm] = useState(false)
  const [showRejectConfirm, setShowRejectConfirm] = useState(false)

  const handleApprove = async () => {
    if (!request || !pricePerUnit) return
    try {
      await reviewMutation.mutateAsync({
        id: request.id,
        data: {
          pricePerUnit: parseFloat(pricePerUnit) || 0,
          deliveryPrice: parseFloat(deliveryPrice) || 0,
          expectedArrivalDate: expectedDate || new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
          action: 'approve',
        },
      })
      setShowApproveConfirm(false)
      navigate({ to: '/dangote-order-request' })
    } catch {
      // Error handled by mutation hook
    }
  }

  const handleReject = async () => {
    if (!request) return
    try {
      await reviewMutation.mutateAsync({
        id: request.id,
        data: { action: 'reject' },
      })
      setShowRejectConfirm(false)
      navigate({ to: '/dangote-order-request' })
    } catch {
      // Error handled by mutation hook
    }
  }

  if (isLoading) {
    return <PageLoader message="Loading request details..." />
  }

  if (isError) {
    return <PageError message={getErrorMessage(error)} onRetry={refetch} />
  }

  if (!request) {
    return (
      <PageError
        title="Request Not Found"
        message="The delivery order request you're looking for doesn't exist."
        onRetry={() => navigate({ to: '/dangote-order-request' })}
      />
    )
  }

  const computedTotal = (parseFloat(pricePerUnit) || 0) * request.quantity + (parseFloat(deliveryPrice) || 0)
  const reviewerName = [request.reviewerFirstName, request.reviewerSurname].filter(Boolean).join(' ') || 'N/A'
  const hasLicense = !!request.licenseId
  const licenseApproved = !hasLicense || request.licenseStatus === 'approved'

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs items={[
        { label: 'Delivery Order Requests', href: '/dangote-order-request' },
        { label: request.requestNumber },
      ]} />

      {/* Header */}
      <PageHeader
      eyebrow="Dangote Delivery"
      title="Review Delivery Order Request"
      description={`{request.requestNumber}`}
      actions={
        <>
          {statusBadge(request.status)}
        </>
      }
    />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Request Details */}
        <Card>
          <CardHeader className="border-b border-border">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <FileText className="size-4" />
              </div>
              <div>
                <CardTitle className="text-sm">Request Details</CardTitle>
                <CardDescription className="text-xs">Customer-submitted order information</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="flex items-center gap-3">
              <User className="size-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Customer</p>
                <p className="text-sm font-semibold text-foreground">{request.customerName}</p>
                {request.companyName && (
                  <p className="text-xs text-muted-foreground">{request.companyName}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="size-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm font-normal text-foreground">{request.customerEmail || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="size-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Phone</p>
                <p className="text-sm font-normal text-foreground">{request.customerPhone || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Package className="size-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Product</p>
                <p className="text-sm font-semibold text-foreground">{request.product}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Truck className="size-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Quantity</p>
                <p className="text-sm font-semibold text-foreground">{Number(request.quantity).toLocaleString()} {request.quantityUnit}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="size-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Delivery Address</p>
                <p className="text-sm font-normal text-foreground">{request.deliveryAddress}</p>
                {request.deliveryState && (
                  <p className="text-xs text-muted-foreground">{request.deliveryState}{request.deliveryLga ? `, ${request.deliveryLga}` : ''}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="size-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Submitted</p>
                <p className="text-sm font-normal text-foreground">{formatDate(request.createdAt)}</p>
              </div>
            </div>

            {/* Licence Info */}
            {(request.licenseId || request.licenseCompanyName) && (
              <div className="space-y-3 pt-3 border-t border-border">
                <div className="flex items-center gap-3">
                  <ShieldPlus className="size-4 text-muted-foreground shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Company Licence</p>
                    <p className="text-sm font-semibold text-foreground">{request.licenseCompanyName || '—'}</p>
                  </div>
                  {licenseStatusBadge(request.licenseStatus)}
                </div>
                {request.licenseUrl && (
                  <div className="rounded-lg border bg-background overflow-hidden">
                    {/\.(pdf)/i.test(request.licenseUrl) ? (
                      <div className="p-4 flex items-center gap-3">
                        <FileText className="size-8 text-primary shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-normal text-foreground">PDF Document</p>
                          <p className="text-xs text-muted-foreground truncate">{request.licenseUrl}</p>
                        </div>
                        <a
                          href={request.licenseUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary underline hover:no-underline"
                        >
                          View PDF
                        </a>
                      </div>
                    ) : (
                      <a href={request.licenseUrl} target="_blank" rel="noopener noreferrer">
                        <img
                          src={request.licenseUrl}
                          alt={`${request.licenseCompanyName} licence`}
                          className="w-full max-h-[500px] object-contain cursor-pointer hover:opacity-95 transition-opacity duration-250 ease-luxe"
                        />
                      </a>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Review Panel */}
        <Card>
          <CardHeader className="border-b border-border">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
                <DollarSign className="size-4" />
              </div>
              <div>
                <CardTitle className="text-sm">Pricing & Approval</CardTitle>
                <CardDescription className="text-xs">
                  {request.status === 'Pending Review' ? 'Set pricing and approve or reject this request' : 'Review details and outcome'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            {request.status === 'Pending Review' ? (
              <>
                <div>
                  <Label className="text-xs">Price Per {request.quantityUnit === 'Liters' ? 'Litre' : 'Unit'} (₦)*</Label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-mono">₦</span>
                    <CommaInput
                      className="pl-8 h-10 text-right font-mono font-semibold"
                      placeholder="0.00"
                      value={pricePerUnit}
                      onValueChange={setPricePerUnit}
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Delivery Price (₦)</Label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-mono">₦</span>
                    <CommaInput
                      className="pl-8 h-10 text-right font-mono font-semibold"
                      placeholder="0"
                      value={deliveryPrice}
                      onValueChange={setDeliveryPrice}
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Expected Arrival Date</Label>
                  <Input
                    type="date"
                    className="h-10 mt-1"
                    value={expectedDate}
                    onChange={(e) => setExpectedDate(e.target.value)}
                  />
                </div>

                {/* Computed Total */}
                <div className="p-4 rounded-lg bg-muted/50 border border-border space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal ({Number(request.quantity).toLocaleString()} × {pricePerUnit ? formatCurrency(parseFloat(pricePerUnit)) : '—'})</span>
                    <span className="font-mono font-semibold">{pricePerUnit ? formatCurrency(parseFloat(pricePerUnit) * request.quantity) : '—'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Delivery</span>
                    <span className="font-mono font-semibold">{deliveryPrice ? formatCurrency(parseFloat(deliveryPrice)) : '₦0'}</span>
                  </div>
                  <div className="border-t border-border pt-2 flex justify-between">
                    <span className="font-semibold text-foreground">Total Amount</span>
                    <span className="font-mono font-semibold text-lg text-foreground">
                      {pricePerUnit ? formatCurrency(computedTotal) : '—'}
                    </span>
                  </div>
                </div>

                {/* Licence Warning */}
                {hasLicense && !licenseApproved && (
                  <div className="p-3 rounded-lg bg-warning/10 border border-warning/20 flex items-start gap-2">
                    <AlertTriangle className="size-4 text-warning shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-warning">Licence Not Approved</p>
                      <p className="text-xs text-warning/80">
                        The associated licence ({request.licenseCompanyName}) is {request.licenseStatus || 'not approved'}. Approve the licence first before approving this order.
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <Button
                    variant="destructive"
                    className="flex-1 gap-2"
                    onClick={() => setShowRejectConfirm(true)}
                    disabled={reviewMutation.isPending}
                  >
                    <XCircle className="size-4" />
                    Reject
                  </Button>
                  <Button
                    className="flex-1 gap-2"
                    onClick={() => setShowApproveConfirm(true)}
                    disabled={!pricePerUnit || !licenseApproved || reviewMutation.isPending}
                  >
                    <CheckCircle className="size-4" />
                    Approve Request
                  </Button>
                </div>
              </>
            ) : (
              <>
                {/* Already reviewed — show outcome */}
                <div className="space-y-3">
                  {request.pricePerUnit != null && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Price Per Unit</span>
                      <span className="font-mono font-semibold">{formatCurrency(Number(request.pricePerUnit))}/{request.quantityUnit === 'Liters' ? 'L' : 'unit'}</span>
                    </div>
                  )}
                  {request.deliveryPrice != null && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Delivery Price</span>
                      <span className="font-mono font-semibold">{formatCurrency(Number(request.deliveryPrice))}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Amount</span>
                    <span className="font-mono font-semibold text-lg">{formatCurrency(Number(request.totalAmount))}</span>
                  </div>
                  {request.expectedArrivalDate && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Expected Arrival</span>
                      <span className="font-normal">{request.expectedArrivalDate}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Reviewed By</span>
                    <span className="font-normal">{reviewerName}</span>
                  </div>
                  {request.reviewedAt && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Reviewed At</span>
                      <span className="font-normal">{formatDate(request.reviewedAt)}</span>
                    </div>
                  )}
                </div>

                <div className="pt-4">
                  <Button variant="outline" className="w-full" onClick={() => navigate({ to: '/dangote-order-request' })}>
                    <ArrowLeft className="size-4 mr-2" />
                    Back to Requests
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Approve Confirm Dialog */}
      <ConfirmDialog
        open={showApproveConfirm}
        onOpenChange={setShowApproveConfirm}
        title="Approve Delivery Order Request"
        description={
          `You're about to approve this request and create a Dangote delivery order.\n\n` +
          `Customer: ${request.customerName}\n` +
          `Product: ${request.product}\n` +
          `Quantity: ${Number(request.quantity).toLocaleString()} ${request.quantityUnit}\n` +
          `Total: ${formatCurrency(computedTotal)}\n\n` +
          `A confirmation email will be sent to the customer.`
        }
        confirmLabel="Approve & Send Confirmation"
        onConfirm={handleApprove}
        loading={reviewMutation.isPending}
      />

      {/* Reject Confirm Dialog */}
      <ConfirmDialog
        open={showRejectConfirm}
        onOpenChange={setShowRejectConfirm}
        title="Reject Delivery Order Request"
        description={
          `Are you sure you want to reject request ${request.requestNumber}?\n\n` +
          `Customer: ${request.customerName}\n` +
          `Product: ${request.product}\n` +
          `Quantity: ${Number(request.quantity).toLocaleString()} ${request.quantityUnit}\n\n` +
          `This action cannot be undone.`
        }
        variant="destructive"
        confirmLabel="Reject Request"
        onConfirm={handleReject}
        loading={reviewMutation.isPending}
      />
    </div>
  )
}

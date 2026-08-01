import { Button } from '#/components/ui/button'
import { useNavigate } from '@tanstack/react-router'
import {
  CheckCircle,
  ArrowRight,
  Package,
  Plus,
  Mail,
  Clock,
} from 'lucide-react'
import type { DangoteOrderWizardReturn } from '../../hooks/useDangoteOrderWizard'

interface DangoteCompletionStepProps {
  wizard: DangoteOrderWizardReturn
}

export function DangoteCompletionStep({ wizard }: DangoteCompletionStepProps) {
  const navigate = useNavigate()
  const {
    placedRequest,
    selectedCustomer,
    resetWizard,
  } = wizard

  if (!placedRequest) return null

  return (
    <div key="dangote-step-6" className="space-y-6 animate-fade-in">
      {/* Success Header */}
      <div className="flex flex-col items-center justify-center pt-8 gap-4 text-center">
        <div className="size-16 rounded-full bg-success/10 flex items-center justify-center text-success border border-success/20">
          <CheckCircle className="size-8" />
        </div>
        <div>
          <h2 className="text-lg md:text-xl font-semibold text-foreground tracking-tight">Order Request Submitted!</h2>
          <p className="text-muted-foreground max-w-md mx-auto mt-2">
            Request <span className="font-mono font-semibold text-primary">{placedRequest.requestNumber}</span> has been submitted and is under review.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 max-w-2xl mx-auto">
        {/* Status Card */}
        <div className="border-2 border-primary/20 rounded-xl bg-primary/5 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-primary/15 flex items-center justify-center text-primary">
              <Clock className="size-4" />
            </div>
            <span className="font-semibold text-sm text-foreground">Review Status</span>
          </div>
          <div className="space-y-2">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-[0.14em]">Status</p>
              <p className="text-sm font-semibold text-primary">Pending Review</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-[0.14em]">What Happens Next</p>
              <p className="text-xs text-muted-foreground leading-snug">
                The customer will be notified that their order request has been received. Once reviewed and approved with pricing, they will receive a follow-up notification with the full details.
              </p>
            </div>
          </div>
        </div>

        {/* Email Notification Card */}
        <div className="border rounded-xl bg-card p-5 space-y-3">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-info/15 flex items-center justify-center text-info">
              <Mail className="size-4" />
            </div>
            <span className="font-semibold text-sm text-foreground">Customer Notification</span>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <div className="size-8 rounded-full flex items-center justify-center bg-success/10 text-success">
                <Mail className="size-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Order Received Notification</p>
                <p className="text-xs text-muted-foreground">
                  {selectedCustomer?.email ? `Sent to customer at ${selectedCustomer.email}` : 'No customer email on file'}
                </p>
              </div>
              <CheckCircle className="size-4 text-success" />
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <div className="size-8 rounded-full flex items-center justify-center bg-muted text-muted-foreground">
                <Mail className="size-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Approval Notification</p>
                <p className="text-xs text-muted-foreground">
                  Customer will be notified after approval with pricing details
                </p>
              </div>
              <Clock className="size-4 text-muted-foreground" />
            </div>
          </div>
        </div>
      </div>

      {/* Order Summary */}
      <div className="max-w-2xl mx-auto border rounded-xl divide-y divide-border">
        <div className="p-4 flex items-center gap-2">
          <Package className="size-4 text-primary" />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.22em]">Request Summary</span>
        </div>
        <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-xs text-muted-foreground block">Request Number</span>
            <span className="font-mono font-semibold text-foreground">{placedRequest.requestNumber}</span>
          </div>
          <div>
            <span className="text-xs text-muted-foreground block">Product</span>
            <span className="font-semibold text-foreground">{placedRequest.product}</span>
          </div>
          <div>
            <span className="text-xs text-muted-foreground block">Quantity</span>
            <span className="font-semibold text-foreground">{Number(placedRequest.quantity).toLocaleString()} {placedRequest.quantityUnit}</span>
          </div>
          <div>
            <span className="text-xs text-muted-foreground block">Customer</span>
            <span className="font-semibold text-foreground">{placedRequest.customerName}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2 pb-4">
        <Button variant="outline" onClick={resetWizard}>
          <Plus className="size-4 mr-2" /> Place Another Order
        </Button>
        <Button  onClick={() => navigate({ to: '/dangote-order-request' as any })}>
          View Dangote Requests <ArrowRight className="size-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}

import { Button } from '#/components/ui/button'
import { useNavigate } from '@tanstack/react-router'
import {
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Package,
  Plus,
  Copy,
  Mail,
  Phone,
  Banknote,
  FileCheck,
} from 'lucide-react'
import { formatCurrency, formatAccountName } from '../utils/formatters'
import type { OrderWizardReturn } from '../hooks/useOrderWizard'

interface CompletionStepProps {
  wizard: OrderWizardReturn
}

export function CompletionStep({ wizard }: CompletionStepProps) {
  const navigate = useNavigate()
  const {
    placedOrder,
    paymentInfo,
    copied,
    setCopied,
    resetWizard,
  } = wizard

  if (!placedOrder) return null

  return (
    <div key="step-6" className="space-y-6 animate-fade-in">
      {/* Success Header */}
      <div className="flex flex-col items-center justify-center pt-8 gap-4 text-center">
        <div className="size-16 rounded-full bg-success/10 flex items-center justify-center text-success border border-success/20">
          <CheckCircle className="size-8" />
        </div>
        <div>
          <h2 className="text-lg md:text-xl font-semibold text-foreground tracking-tight">Order Created Successfully!</h2>
          <p className="text-muted-foreground max-w-md mx-auto mt-2">
            Order <span className="font-mono font-semibold text-primary">{placedOrder.orderNumber}</span> has been processed and customer balance was updated.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 max-w-2xl mx-auto">
        {/* Virtual Account Card */}
        {paymentInfo?.accountNumber && (
          <div className="border-2 border-success/20 rounded-xl bg-success/5 p-5 space-y-3">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-lg bg-success/15 flex items-center justify-center text-success">
                <Banknote className="size-4" />
              </div>
              <span className="font-semibold text-sm text-foreground">Dedicated Payment Account</span>
            </div>
            <div className="space-y-2">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-[0.14em]">Bank</p>
                <p className="text-sm font-semibold text-foreground">{paymentInfo.bankName}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-[0.14em]">Account Number</p>
                <div className="flex items-center gap-2">
                  <p className="text-xl font-semibold font-mono text-foreground tabular-nums">{paymentInfo.accountNumber}</p>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(paymentInfo.accountNumber)
                      setCopied(true)
                      setTimeout(() => setCopied(false), 2000)
                    }}
                    className="size-7 rounded-md border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-250 ease-luxe"
                    title="Copy account number"
 >
                    {copied ? <CheckCircle className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
                  </button>
                </div>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-[0.14em]">Account Name</p>
                <p className="text-sm font-semibold text-foreground">{paymentInfo.accountName || formatAccountName(placedOrder.customerName)}</p>
              </div>
            </div>
            <p className="text-[11px] text-success/80 leading-snug">Share this account number with the customer for payment.</p>
          </div>
        )}

        {/* Notification Status Card */}
        <div className="border rounded-xl bg-card p-5 space-y-3">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-info/15 flex items-center justify-center text-info">
              <FileCheck className="size-4" />
            </div>
            <span className="font-semibold text-sm text-foreground">Notifications Sent</span>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <div className={`size-8 rounded-full flex items-center justify-center ${paymentInfo?.emailSent ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
                <Mail className="size-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Invoice Email</p>
                <p className="text-xs text-muted-foreground">
                  {paymentInfo?.emailSent ? `Sent to ${placedOrder.customerEmail}` : 'No email on file - skipped'}
                </p>
              </div>
              {paymentInfo?.emailSent ? (
                <CheckCircle className="size-4 text-success" />
              ) : (
                <AlertCircle className="size-4 text-muted-foreground" />
              )}
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <div className={`size-8 rounded-full flex items-center justify-center ${paymentInfo?.smsSent ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
                <Phone className="size-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Order Summary SMS</p>
                <p className="text-xs text-muted-foreground">
                  {paymentInfo?.smsSent ? `Sent to ${placedOrder.customerPhone}` : 'SMS not sent'}
                </p>
              </div>
              {paymentInfo?.smsSent ? (
                <CheckCircle className="size-4 text-success" />
              ) : (
                <AlertCircle className="size-4 text-muted-foreground" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Order Summary */}
      <div className="max-w-2xl mx-auto border rounded-xl divide-y divide-border">
        <div className="p-4 flex items-center gap-2">
          <Package className="size-4 text-primary" />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.22em]">Order Summary</span>
        </div>
        <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-xs text-muted-foreground block">Product</span>
            <span className="font-semibold text-foreground">{placedOrder.productName || 'N/A'}</span>
          </div>
          <div>
            <span className="text-xs text-muted-foreground block">Quantity</span>
            <span className="font-semibold text-foreground">{Number(placedOrder.quantity).toLocaleString()} {placedOrder.productUnit || 'Liters'}</span>
          </div>
          <div>
            <span className="text-xs text-muted-foreground block">Unit Price</span>
            <span className="font-semibold text-foreground">{formatCurrency(placedOrder.price)}</span>
          </div>
          <div>
            <span className="text-xs text-muted-foreground block">Total</span>
            <span className="font-semibold text-primary">{formatCurrency(placedOrder.totalAmount)}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2 pb-4">
        <Button variant="outline" onClick={resetWizard}>
          <Plus className="size-4 mr-2" /> Place Another Order
        </Button>
        <Button  onClick={() => navigate({ to: '/orders' as any })}>
          Go to Orders List <ArrowRight className="size-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}

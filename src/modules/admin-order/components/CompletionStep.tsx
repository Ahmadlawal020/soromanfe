import { useState } from 'react'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Textarea } from '#/components/ui/textarea'
import { Label } from '#/components/ui/label'
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
  Hourglass,
} from 'lucide-react'
import { formatCurrency, formatAccountName } from '../utils/formatters'
import type { OrderWizardReturn } from '../hooks/useOrderWizard'
import { useCreateExpectedPayment } from '#/lib/hooks/useExpectedPayments'

interface CompletionStepProps {
  wizard: OrderWizardReturn
}

/**
 * Optional, skippable: how the customer says they'll pay, noted while it's
 * fresh so a later anonymous bank transfer has something to be matched
 * against. Never blocks — closing this card without submitting is fine.
 */
function ExpectedPaymentNote({ customerId, orderId }: { customerId: number; orderId: number }) {
  const [open, setOpen] = useState(false)
  const [saved, setSaved] = useState(false)
  const [expectedAmount, setExpectedAmount] = useState('')
  const [reference, setReference] = useState('')
  const [note, setNote] = useState('')
  const createExpectedPayment = useCreateExpectedPayment()

  if (saved) {
    return (
      <div className="max-w-2xl mx-auto flex items-center gap-2 rounded-xl border border-success/20 bg-success/5 p-4 text-sm text-success-foreground">
        <CheckCircle className="size-4 text-success shrink-0" />
        Noted — this'll show up when the desk reconciles bank transfers for this customer.
      </div>
    )
  }

  if (!open) {
    return (
      <div className="max-w-2xl mx-auto">
        <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
          <Hourglass className="size-4 mr-2" /> Customer told you how they'll pay?
        </Button>
      </div>
    )
  }

  const submit = async () => {
    await createExpectedPayment.mutateAsync({
      customerId,
      orderId,
      expectedAmount: expectedAmount ? Number(expectedAmount) : undefined,
      reference: reference.trim(),
      note: note.trim(),
    })
    setSaved(true)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-3 rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2">
        <div className="size-8 rounded-lg bg-warning/15 flex items-center justify-center text-warning">
          <Hourglass className="size-4" />
        </div>
        <span className="font-semibold text-sm text-foreground">Expected payment</span>
      </div>
      <p className="text-xs text-muted-foreground">
        Optional — a quick note on how the customer says they'll pay makes their bank
        transfer easy to spot later. Skip if you don't know yet.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="ep-amount" className="text-xs">Expected amount</Label>
          <Input id="ep-amount" type="number" step="0.01" placeholder="0.00" value={expectedAmount} onChange={(e) => setExpectedAmount(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ep-ref" className="text-xs">Reference they'll use</Label>
          <Input id="ep-ref" placeholder="e.g. their phone number" value={reference} onChange={(e) => setReference(e.target.value)} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="ep-note" className="text-xs">Note</Label>
        <Textarea id="ep-note" rows={2} placeholder="e.g. Says she'll transfer from GTBank this afternoon" value={note} onChange={(e) => setNote(e.target.value)} />
      </div>
      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>Skip</Button>
        <Button type="button" size="sm" disabled={createExpectedPayment.isPending} onClick={submit}>
          {createExpectedPayment.isPending ? 'Saving…' : 'Save note'}
        </Button>
      </div>
    </div>
  )
}

export function CompletionStep({ wizard }: CompletionStepProps) {
  const navigate = useNavigate()
  const {
    placedOrder,
    paymentInfo,
    orderCompanyName,
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
                <p className="text-xs text-muted-foreground uppercase">Bank</p>
                <p className="text-sm font-semibold text-foreground">{paymentInfo.bankName}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase">Account Number</p>
                <div className="flex items-center gap-2">
                  <p className="text-xl font-semibold font-mono text-foreground">{paymentInfo.accountNumber}</p>
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
                <p className="text-xs text-muted-foreground uppercase">Account Name</p>
                <p className="text-sm font-semibold text-foreground">{paymentInfo.accountName || formatAccountName(placedOrder.customerName)}</p>
              </div>
            </div>
            <p className="text-xs text-success/80 leading-snug">Share this account number with the customer for payment.</p>
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
                <p className="text-sm font-normal text-foreground">Invoice Email</p>
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
                <p className="text-sm font-normal text-foreground">Order Summary SMS</p>
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
          <span className="text-xs font-semibold text-muted-foreground uppercase">Order Summary</span>
        </div>
        <div className="p-4 grid grid-cols-2 sm:grid-cols-5 gap-4 text-sm">
          <div>
            <span className="text-xs text-muted-foreground block">Product</span>
            <span className="font-semibold text-foreground">{placedOrder.productName || 'N/A'}</span>
          </div>
          <div>
            <span className="text-xs text-muted-foreground block">Company</span>
            <span className="font-semibold text-foreground">{orderCompanyName || 'N/A'}</span>
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

      {placedOrder.customerId && (
        <ExpectedPaymentNote customerId={Number(placedOrder.customerId)} orderId={Number(placedOrder.id)} />
      )}

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

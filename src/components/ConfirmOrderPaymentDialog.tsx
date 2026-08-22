import { useEffect, useState } from 'react'
import { Loader2, CheckCircle2, AlertTriangle } from 'lucide-react'

import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '#/components/ui/dialog'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '#/components/ui/select'
import { useCustomerDetails } from '#/lib/hooks/useCustomers'
import { useBankAccounts } from '#/lib/hooks/useBankAccounts'
import { useCreateDeposit } from '#/lib/hooks/useDeposits'
import { usePayOrder } from '#/lib/hooks/useOrders'
import { StatementLinePicker } from '#/components/StatementLinePicker'
import type { StatementLine } from '#/lib/hooks/useBankStatements'
import { MICRO } from '#/lib/panel'
import { cn, toNum } from '#/lib/utils'

function formatCurrency(v: number) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 2 }).format(v)
}

const digitsOnly = (v: string) => v.replace(/\D/g, '')
const formatAmount = (raw: string) => (raw ? Number(raw).toLocaleString('en-NG') : '')

/**
 * Confirm payment on one specific pending order — the point this whole flow
 * exists for. Existing wallet balance applies first; any shortfall is closed
 * by matching a bank statement line (or several) or typing a manual amount,
 * both tagged with this order's id (see createDeposit's orderId) so the
 * funding trail names this order explicitly rather than leaving a later
 * FIFO walk to land on it by coincidence. Anything matched beyond what the
 * order needs simply stays in the customer's wallet.
 */
export function ConfirmOrderPaymentDialog({
  order, open, onOpenChange,
}: {
  order: any | null
  open: boolean
  onOpenChange: (o: boolean) => void
}) {
  const customerId = order?.customerId ? String(order.customerId) : ''
  const { data: customer, isLoading: loadingCustomer } = useCustomerDetails(open ? customerId : '')
  const { data: bankAccounts } = useBankAccounts({ status: 'Active' })
  const createDeposit = useCreateDeposit()
  const payOrder = usePayOrder()

  const [mode, setMode] = useState<'statement' | 'manual'>('statement')
  const [bankAccountId, setBankAccountId] = useState('')
  const [statementLines, setStatementLines] = useState<StatementLine[]>([])
  const [statementQuery, setStatementQuery] = useState('')
  const [manualAmount, setManualAmount] = useState('')
  const [manualDepositor, setManualDepositor] = useState('')
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    if (!open) {
      setBankAccountId(''); setStatementLines([]); setStatementQuery('')
      setManualAmount(''); setManualDepositor(''); setMode('statement'); setConfirming(false)
    }
  }, [open])

  if (!order) return null

  const total = toNum(order.totalAmount)
  // Prefer the live customer read over whatever balance was embedded in the
  // orders list — that snapshot goes stale the moment another order for the
  // same customer is confirmed in this same session.
  const liveBalance = customer ? toNum(customer.balance) : toNum(order.customerBalance)
  const newFromStatement = statementLines.reduce((s, l) => s + Number(l.amount), 0)
  const newFromManual = mode === 'manual' ? Number(digitsOnly(manualAmount) || '0') : 0
  const newDeposit = mode === 'statement' ? newFromStatement : newFromManual
  const available = liveBalance + newDeposit
  const stillShort = Math.max(0, total - available)
  const excess = Math.max(0, available - total)
  // A statement line can't be selected without a bank account already chosen
  // (the picker itself refuses to search without one) — only the manual path
  // needs its own explicit checks here.
  const manualEntryValid = mode !== 'manual' || newDeposit === 0 || (manualDepositor.trim().length > 0 && !!bankAccountId)
  const readyToConfirm = stillShort <= 0 && manualEntryValid

  const handleConfirm = async () => {
    if (!readyToConfirm) return
    setConfirming(true)
    try {
      if (newDeposit > 0) {
        if (mode === 'statement') {
          await createDeposit.mutateAsync({
            customer: order.customerId,
            bankAccountId,
            lineIds: statementLines.map((l) => l.id),
            orderId: order.id,
          })
        } else {
          const bank = bankAccounts?.find((b) => String(b.id) === bankAccountId)
          await createDeposit.mutateAsync({
            customer: order.customerId,
            amount: newFromManual,
            bankAccountId: bankAccountId || undefined,
            bankName: bank?.bankName,
            accountName: bank?.accountName,
            accountNumber: bank?.accountNumber,
            depositorName: manualDepositor.trim(),
            orderId: order.id,
          })
        }
        // The deposit already landed — clear the selection so a retry below
        // (if paying fails) falls back to the now-updated wallet balance
        // instead of trying to re-claim lines that are already matched.
        setStatementLines([]); setManualAmount(''); setManualDepositor('')
      }
      await payOrder.mutateAsync(order.id)
      onOpenChange(false)
    } catch {
      // Both mutations surface their own error toast. If the deposit
      // succeeded but paying failed, the money is safely in the wallet —
      // the dialog stays open (now showing no shortfall) so staff can just
      // hit Confirm again.
    } finally {
      setConfirming(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Confirm payment — {order.orderNumber}</DialogTitle>
          <DialogDescription>
            {order.customerName}
            {order.companyName || order.customerCompanyName
              ? ` · ${order.companyName || order.customerCompanyName}`
              : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3 rounded-lg border border-foreground/15 bg-muted/30 p-3 text-sm">
            <div>
              <p className={cn(MICRO, 'text-muted-foreground')}>Order total</p>
              <p className="mt-0.5 font-semibold">{formatCurrency(total)}</p>
            </div>
            <div>
              <p className={cn(MICRO, 'text-muted-foreground')}>Wallet balance</p>
              <p className="mt-0.5 font-semibold">
                {loadingCustomer ? <Loader2 className="size-3.5 animate-spin" /> : formatCurrency(liveBalance)}
              </p>
            </div>
            <div>
              <p className={cn(MICRO, 'text-muted-foreground')}>{stillShort > 0 ? 'Still needed' : 'Spare after this'}</p>
              <p className={cn('mt-0.5 font-semibold', stillShort > 0 ? 'text-warning' : 'text-success')}>
                {formatCurrency(stillShort > 0 ? stillShort : excess)}
              </p>
            </div>
          </div>

          {stillShort <= 0 && newDeposit === 0 ? (
            <div className="flex items-start gap-2 rounded-lg border border-success/25 bg-success/5 p-3 text-sm text-success">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
              <p>Wallet balance already covers this order in full — nothing to match.</p>
            </div>
          ) : (
            <>
              {Math.max(0, total - liveBalance) > 0 && (
                <div className="flex items-start gap-2 rounded-lg border border-warning/25 bg-warning/5 p-3 text-sm text-warning">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                  <p>
                    {order.customerName || 'This customer'} needs {formatCurrency(Math.max(0, total - liveBalance))} more
                    to complete this order — match a statement line or record the payment below.
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMode('statement')}
                  className={cn(
                    'flex-1 rounded-lg border px-3 py-2 text-sm transition-colors duration-250 ease-luxe',
                    mode === 'statement' ? 'border-accent/40 bg-accent/10 text-accent' : 'border-foreground/15 text-muted-foreground hover:bg-muted/60',
                  )}
                >
                  Match bank statement
                </button>
                <button
                  type="button"
                  onClick={() => setMode('manual')}
                  className={cn(
                    'flex-1 rounded-lg border px-3 py-2 text-sm transition-colors duration-250 ease-luxe',
                    mode === 'manual' ? 'border-accent/40 bg-accent/10 text-accent' : 'border-foreground/15 text-muted-foreground hover:bg-muted/60',
                  )}
                >
                  Record manually
                </button>
              </div>

              <div className="space-y-1.5">
                <Label className={cn(MICRO, 'text-muted-foreground')}>Receiving bank account</Label>
                <Select
                  value={bankAccountId}
                  onValueChange={(v) => { setBankAccountId(v); setStatementLines([]) }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose bank account…" />
                  </SelectTrigger>
                  <SelectContent>
                    {(bankAccounts || []).map((b) => (
                      <SelectItem key={b.id} value={String(b.id)}>
                        {b.bankName} — {b.accountNumber} · {b.accountName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {mode === 'statement' ? (
                <div className="space-y-1.5">
                  <Label className={cn(MICRO, 'text-muted-foreground')}>Match to bank statement</Label>
                  <StatementLinePicker
                    bankAccountId={bankAccountId || undefined}
                    selected={statementLines}
                    onToggle={(line) => {
                      setStatementLines((prev) =>
                        prev.some((l) => l.id === line.id) ? prev.filter((l) => l.id !== line.id) : [...prev, line],
                      )
                    }}
                    onClear={() => setStatementLines([])}
                    query={statementQuery}
                    onQueryChange={setStatementQuery}
                  />
                  {statementLines.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {statementLines.length} line{statementLines.length === 1 ? '' : 's'} selected · {formatCurrency(newFromStatement)}
                    </p>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className={cn(MICRO, 'text-muted-foreground')}>Amount</Label>
                    <Input
                      type="text" inputMode="numeric"
                      value={formatAmount(digitsOnly(manualAmount))}
                      onChange={(e) => setManualAmount(digitsOnly(e.target.value))}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className={cn(MICRO, 'text-muted-foreground')}>Depositor / payer name</Label>
                    <Input
                      value={manualDepositor}
                      onChange={(e) => setManualDepositor(e.target.value)}
                      placeholder="Who paid"
                    />
                  </div>
                </div>
              )}

              {newDeposit > 0 && (
                <p className="text-xs leading-tight text-muted-foreground">
                  {stillShort > 0
                    ? `Still ${formatCurrency(stillShort)} short after this.`
                    : excess > 0
                      ? `Covers the order with ${formatCurrency(excess)} left over — that stays in ${order.customerName || 'the customer'}'s wallet.`
                      : 'Covers the order exactly.'}
                </p>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={confirming}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!readyToConfirm || confirming}>
            {confirming && <Loader2 className="animate-spin" />}
            Confirm payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

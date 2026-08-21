import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '#/components/ui/dialog'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Textarea } from '#/components/ui/textarea'
import { Check, Loader2, Search, ArrowRight } from 'lucide-react'
import { useCustomerList } from '#/lib/hooks/useCustomers'
import { useTransferBalance } from '#/lib/hooks/useDeposits'
import { toNum, cn } from '#/lib/utils'
import type { Customer } from '#/lib/types'

const digitsOnly = (v: string) => v.replace(/\D/g, '')
const formatAmount = (raw: string) => {
  const d = digitsOnly(raw)
  return d ? Number(d).toLocaleString('en-NG') : ''
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 2 }).format(value)
}

/** A search box + filtered result list, picking one customer. */
function CustomerPicker({
  label, customers, isLoading, selectedId, onSelect, excludeId,
}: {
  label: string
  customers: Customer[]
  isLoading: boolean
  selectedId: string
  onSelect: (c: Customer) => void
  /** The other side's pick — offered but visually muted, since picking it too would be a same-customer transfer. */
  excludeId?: string
}) {
  const [query, setQuery] = useState('')
  const selected = customers.find((c) => c._id === selectedId)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = !q
      ? customers.slice(0, 100)
      : customers.filter((c) =>
          [c.name, c.companyName, c.phone].some((f) => String(f || '').toLowerCase().includes(q)),
        ).slice(0, 100)
    return list
  }, [customers, query])

  return (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {selected ? (
        <div className="flex items-center justify-between gap-2 rounded-lg border border-foreground/15 bg-muted/30 p-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{selected.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {selected.companyName ? `${selected.companyName} · ` : ''}Balance: {formatCurrency(toNum(selected.balance))}
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => onSelect({ ...selected, _id: '' })}>
            Change
          </Button>
        </div>
      ) : (
        <>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, company or phone…"
              className="pl-9"
            />
          </div>
          <ul className="max-h-48 divide-y divide-foreground/10 overflow-y-auto rounded-lg border border-foreground/15">
            {isLoading ? (
              <li className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> Loading customers…
              </li>
            ) : filtered.length === 0 ? (
              <li className="py-6 text-center text-sm text-muted-foreground">No customer matches that.</li>
            ) : (
              filtered.map((c) => (
                <li key={c._id}>
                  <button
                    type="button"
                    onClick={() => onSelect(c)}
                    className={cn(
                      'flex w-full items-start gap-2.5 px-3 py-2.5 text-left transition-colors duration-250 ease-luxe outline-none hover:bg-muted/60',
                      c._id === excludeId && 'opacity-50',
                    )}
                  >
                    <span className="min-w-0 flex-1">
                      <p className="truncate text-sm font-normal">{c.name}</p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {c.companyName || 'No company'} · {formatCurrency(toNum(c.balance))}
                      </p>
                    </span>
                    {c._id === excludeId && <Check className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />}
                  </button>
                </li>
              ))
            )}
          </ul>
        </>
      )}
    </div>
  )
}

function AmountInput({ value, onChange }: { value: string; onChange: (raw: string) => void }) {
  const ref = useRef<HTMLInputElement>(null)
  const [caret, setCaret] = useState<number | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const el = e.target
    const digitsBefore = digitsOnly(el.value.slice(0, el.selectionStart ?? 0)).length
    const raw = digitsOnly(el.value)
    onChange(raw)
    const formatted = formatAmount(raw)
    let seen = 0
    let pos = formatted.length
    for (let i = 0; i < formatted.length; i += 1) {
      if (/\d/.test(formatted[i])) seen += 1
      if (seen === digitsBefore) { pos = i + 1; break }
    }
    setCaret(digitsBefore === 0 ? 0 : pos)
  }

  useLayoutEffect(() => {
    if (caret != null && ref.current) {
      ref.current.setSelectionRange(caret, caret)
      setCaret(null)
    }
  }, [caret])

  return (
    <Input
      ref={ref}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      placeholder="0"
      value={formatAmount(value)}
      onChange={handleChange}
      className="text-right text-lg font-semibold"
    />
  )
}

export function TransferBalanceDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { data: customerData, isLoading } = useCustomerList({ limit: 5000 }, { enabled: open })
  const customers: Customer[] = useMemo(() => {
    if (!customerData) return []
    return Array.isArray(customerData) ? customerData : (customerData as any)?.customers || []
  }, [customerData])

  const [fromId, setFromId] = useState('')
  const [toId, setToId] = useState('')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const transfer = useTransferBalance()

  const fromCustomer = customers.find((c) => c._id === fromId)
  const amountValue = Number(amount || 0)
  const insufficientFunds = fromCustomer != null && amountValue > toNum(fromCustomer.balance)
  const canSubmit = fromId && toId && fromId !== toId && amountValue > 0 && !insufficientFunds

  const reset = () => {
    setFromId(''); setToId(''); setAmount(''); setDescription('')
  }

  const handleSubmit = async () => {
    if (!canSubmit) return
    await transfer.mutateAsync({ fromCustomer: fromId, toCustomer: toId, amount: amountValue, description: description.trim() || undefined })
    reset()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o) }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Transfer wallet balance</DialogTitle>
          <DialogDescription>
            Moves money directly between two customers' wallets — for correcting a deposit recorded
            against the wrong customer, or a genuine account-to-account transfer.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <CustomerPicker label="From" customers={customers} isLoading={isLoading} selectedId={fromId} onSelect={(c) => setFromId(c._id)} excludeId={toId} />
          <div className="flex justify-center">
            <ArrowRight className="size-4 text-muted-foreground" />
          </div>
          <CustomerPicker label="To" customers={customers} isLoading={isLoading} selectedId={toId} onSelect={(c) => setToId(c._id)} excludeId={fromId} />

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Amount</Label>
            <AmountInput value={amount} onChange={setAmount} />
            {insufficientFunds && (
              <p className="text-xs text-destructive">
                Exceeds the source customer's balance of {formatCurrency(toNum(fromCustomer?.balance))}.
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Reason (optional)</Label>
            <Textarea
              rows={2}
              placeholder="e.g. Deposit was recorded against the wrong customer"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={transfer.isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit || transfer.isPending}>
            {transfer.isPending && <Loader2 className="animate-spin" />}
            Transfer {amountValue > 0 ? formatCurrency(amountValue) : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

import { useEffect, useMemo, useState } from 'react'
import { Plus, Trash2, Loader2, AlertTriangle, Clock } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'

import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '#/components/ui/dialog'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { StatusChip } from '#/components/ui/status-chip'
import { MICRO } from '#/lib/panel'
import { cn } from '#/lib/utils'
import api from '#/lib/api/http'
import { useToast } from '#/lib/hooks/useToast'
import { getErrorMessage } from '#/lib/utils'
import type { TruckLoad } from '#/lib/hooks/useTickets'

/** A single truck can never carry more than this, when the order is in litres. */
const MAX_TRUCK_LITRES = 60000

type Draft = { quantity: string; truckNumber: string; driverName: string; driverPhone: string }

const emptyDraft = (): Draft => ({ quantity: '', truckNumber: '', driverName: '', driverPhone: '' })

const num = (v: unknown) => {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}
const fmt = (n: number) => n.toLocaleString('en-NG')

/** Local datetime string for a datetime-local input. */
function localNow() {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

export function TicketGenerateDialog({
  order,
  loads,
  open,
  onOpenChange,
  onGenerated,
}: {
  order: any | null
  loads: TruckLoad[]
  open: boolean
  onOpenChange: (o: boolean) => void
  /** Fired after a successful batch, so the caller can open the print modal. */
  onGenerated?: (orderId: number) => void
}) {
  const qc = useQueryClient()
  const toast = useToast()
  const [loadingAt, setLoadingAt] = useState('')
  const [drafts, setDrafts] = useState<Draft[]>([emptyDraft()])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) { setLoadingAt(''); setDrafts([emptyDraft()]) }
  }, [open, order?.id])

  const unit = order?.productUnit || 'Litres'
  const inLitres = /litre/i.test(unit)
  const ordered = num(order?.quantity)

  /**
   * How much may be ticketed.
   *
   * This backend settles orders in full from the wallet, so there is no
   * part-paid figure — releasable equals ordered. When split payments arrive,
   * this is the single line that changes.
   */
  const releasable = ordered
  const partPaid = releasable < ordered

  const previous = loads.reduce((s, l) => s + num(l.quantity), 0)
  const added = drafts.reduce((s, d) => s + num(d.quantity), 0)
  const remaining = releasable - previous - added
  const pct = releasable > 0 ? ((previous + added) / releasable) * 100 : 0
  const over = previous + added > releasable

  const setDraft = (i: number, patch: Partial<Draft>) =>
    setDrafts((d) => d.map((t, j) => (j === i ? { ...t, ...patch } : t)))

  /** Refuses anything above the per-truck ceiling as it is typed. */
  const onQuantity = (i: number, raw: string) => {
    if (inLitres && num(raw) > MAX_TRUCK_LITRES) return
    setDraft(i, { quantity: raw })
  }

  const problem = useMemo(() => {
    if (!loadingAt) return 'Set the loading date and time'
    for (let i = 0; i < drafts.length; i++) {
      const d = drafts[i]
      const where = `Truck ${i + 1}`
      if (!d.quantity || num(d.quantity) <= 0) return `${where}: enter a quantity`
      if (inLitres && num(d.quantity) > MAX_TRUCK_LITRES) {
        return `${where}: ${fmt(num(d.quantity))} exceeds the ${fmt(MAX_TRUCK_LITRES)} litre limit`
      }
      if (!d.truckNumber.trim()) return `${where}: enter the truck number`
      if (!d.driverName.trim()) return `${where}: enter the driver's name`
      if (!d.driverPhone.trim()) return `${where}: enter the driver's phone`
    }
    if (previous + added > releasable) {
      return `Allocated ${fmt(previous + added)} against ${fmt(releasable)} releasable — ${fmt(previous)} already ticketed`
    }
    return null
  }, [drafts, loadingAt, previous, added, releasable, inLitres])

  const submit = async () => {
    if (!order || problem) return
    setSubmitting(true)
    try {
      const trucks = drafts.map((d) => ({
        quantity: num(d.quantity),
        truckNumber: d.truckNumber.trim(),
        driverName: d.driverName.trim(),
        driverPhone: d.driverPhone.trim(),
        // Compartment quantities, ullage and loader are handwritten on the
        // printed sheet and deliberately never captured here.
        compartments: null,
        loaderName: null,
        loaderPhone: null,
      }))

      // An order still sitting at Paid has to be released before it can be
      // ticketed; truck 1's details carry that call.
      if (!['Released', 'Loading'].includes(String(order.status))) {
        await api.post(`/orders/${order.id}/release`, { trucks: [trucks[0]] })
      }

      await api.post(`/orders/${order.id}/generate-tickets`, {
        trucks,
        pfiId: order.pfiId ?? null,
        loadingAt,
      })

      // Stock figures move across the app, so refresh orders, this order's
      // tickets and the PFI caches together.
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['orders'] }),
        qc.invalidateQueries({ queryKey: ['tickets'] }),
        qc.invalidateQueries({ queryKey: ['pfis'] }),
      ])

      toast.success(`${trucks.length} ticket${trucks.length === 1 ? '' : 's'} generated`)
      onOpenChange(false)
      onGenerated?.(order.id)
    } catch (err) {
      // The dialog stays open with everything typed, so a retry costs nothing.
      toast.error(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  if (!order) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88svh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Generate loading tickets</DialogTitle>
          <DialogDescription>
            {order.orderNumber} · {order.customerName} · {order.depotName || order.state}
          </DialogDescription>
        </DialogHeader>

        {/* Order summary */}
        <div className="rounded-lg border border-foreground/15 bg-muted/40 p-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              [partPaid ? 'Releasable volume' : 'Total volume', releasable],
              ['Previous', previous],
              ['New', added],
              ['Remaining', Math.max(remaining, 0)],
            ].map(([label, value]) => (
              <div key={String(label)}>
                <p className={cn(MICRO, 'text-xs text-muted-foreground')}>{label}</p>
                <p className="mt-1 text-base font-semibold tracking-tight tabular-nums">
                  {fmt(Number(value))}
                </p>
              </div>
            ))}
          </div>

          {/* Amber while short, green at exactly 100%, red past it. */}
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-foreground/10">
            <div
              className={cn(
                'h-full rounded-full transition-[width] duration-500 ease-luxe',
                over ? 'bg-destructive' : pct >= 100 ? 'bg-accent' : 'bg-warning',
              )}
              style={{ width: `${Math.min(Math.max(pct, 0), 100)}%` }}
            />
          </div>
        </div>

        {partPaid && (
          <div className="flex items-start gap-2 rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm text-warning">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <span>
              This customer has part-paid — only {fmt(releasable)} of {fmt(ordered)} {unit}{' '}
              ordered can be released until the rest is paid for.
            </span>
          </div>
        )}

        {/* Loading time */}
        <div className="space-y-1.5">
          <label className={cn(MICRO, 'block text-muted-foreground')} htmlFor="loading-at">
            Loading date &amp; time
          </label>
          <div className="flex gap-2">
            <Input
              id="loading-at" type="datetime-local" value={loadingAt}
              onChange={(e) => setLoadingAt(e.target.value)}
            />
            <Button variant="outline" size="sm" onClick={() => setLoadingAt(localNow())}>
              <Clock data-icon="inline-start" />
              Now
            </Button>
          </div>
        </div>

        {/* Trucks */}
        <div className="space-y-3">
          {drafts.map((d, i) => (
            <div key={i} className="rounded-lg border border-foreground/15 p-3.5">
              <div className="mb-3 flex items-center justify-between">
                <span className={cn(MICRO, 'text-muted-foreground')}>Truck {i + 1}</span>
                {drafts.length > 1 && (
                  <Button
                    variant="ghost" size="icon-sm"
                    onClick={() => setDrafts((t) => t.filter((_, j) => j !== i))}
                  >
                    <Trash2 />
                    <span className="sr-only">Remove truck {i + 1}</span>
                  </Button>
                )}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  type="number" inputMode="numeric" placeholder={`Quantity (${unit})`}
                  value={d.quantity} onChange={(e) => onQuantity(i, e.target.value)}
                  className="tabular-nums"
                />
                <Input
                  placeholder="Truck number" value={d.truckNumber}
                  onChange={(e) => setDraft(i, { truckNumber: e.target.value })}
                />
                <Input
                  placeholder="Driver's name" value={d.driverName}
                  onChange={(e) => setDraft(i, { driverName: e.target.value })}
                />
                <Input
                  placeholder="Driver's phone" value={d.driverPhone}
                  onChange={(e) => setDraft(i, { driverPhone: e.target.value })}
                  className="tabular-nums"
                />
              </div>
            </div>
          ))}

          <Button variant="outline" size="sm" onClick={() => setDrafts((t) => [...t, emptyDraft()])}>
            <Plus data-icon="inline-start" />
            Add another truck
          </Button>
        </div>

        <DialogFooter>
          <div className="mr-auto min-w-0">
            {problem && (
              <p className="truncate text-xs text-muted-foreground/70">{problem}</p>
            )}
            {!problem && over === false && pct === 100 && (
              <StatusChip tone="accent">Fully allocated</StatusChip>
            )}
          </div>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={Boolean(problem) || submitting}>
            {submitting && <Loader2 className="animate-spin" />}
            Generate {drafts.length} ticket{drafts.length === 1 ? '' : 's'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

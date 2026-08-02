import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { format } from 'date-fns'

import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '#/components/ui/dialog'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { MICRO } from '#/lib/panel'
import { cn } from '#/lib/utils'
import { useUpdateOrder } from '#/lib/hooks/useOrders'
import { formatNaira, formatQty, toNumber } from './-orders-utils'
import { OrderStatusBadge, PaymentBadge } from './-order-status'

/** A label/value pair in the read-only detail grid. */
function Row({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className={cn(MICRO, 'text-xs text-muted-foreground')}>{label}</p>
      <p className="mt-1 truncate text-sm">{value ?? '—'}</p>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className={cn(MICRO, 'mb-3 text-muted-foreground')}>{title}</p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">{children}</div>
    </div>
  )
}

export function OrderDetailsDialog({
  order,
  open,
  onOpenChange,
}: {
  order: any | null
  open: boolean
  onOpenChange: (o: boolean) => void
}) {
  if (!order) return null
  const qty = toNumber(order.quantity)
  const unit = order.productUnit || 'L'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85svh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{order.orderNumber || 'Order'}</DialogTitle>
          <DialogDescription>
            {order.createdAt ? format(new Date(order.createdAt), 'EEEE, d MMMM yyyy · HH:mm') : 'No date recorded'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2">
          <OrderStatusBadge status={order.status} />
          <PaymentBadge paymentStatus={order.paymentStatus} />
        </div>

        <div className="space-y-6 pt-2">
          <Section title="Customer">
            <Row label="Name" value={order.customerName} />
            <Row label="Phone" value={order.customerPhone} />
            <Row label="Email" value={order.customerEmail} />
            <Row label="Company" value={order.customerCompanyName} />
          </Section>

          <Section title="Order">
            <Row label="Reference" value={order.orderNumber} />
            <Row label="Location" value={order.depotName || order.state} />
            <Row label="Product" value={order.productName} />
            <Row label="Quantity" value={`${formatQty(qty)} ${unit}`} />
            <Row label="Unit price" value={formatNaira(toNumber(order.price))} />
            <Row label="Total" value={formatNaira(toNumber(order.totalAmount))} />
            <Row label="PFI" value={order.pfiNumber} />
            <Row label="Delivery type" value={order.deliveryType} />
            <Row label="Delivery address" value={order.deliveryAddress} />
          </Section>

          {(order.virtualAccountNumber || order.virtualAccountBank) && (
            <Section title="Payment">
              <Row label="Account number" value={order.virtualAccountNumber} />
              <Row label="Bank" value={order.virtualAccountBank} />
              <Row label="Account name" value={order.virtualAccountName} />
            </Section>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Edit form. Only fields the API actually accepts are exposed — the Node
 * backend's order model has no truck, driver or narration columns.
 *
 * The form diffs against the original and sends only what changed.
 */
export function OrderEditDialog({
  order,
  open,
  onOpenChange,
}: {
  order: any | null
  open: boolean
  onOpenChange: (o: boolean) => void
}) {
  const updateOrder = useUpdateOrder()
  const [form, setForm] = useState({ date: '', time: '', quantity: '', totalAmount: '' })

  useEffect(() => {
    if (!order) return
    const d = order.createdAt ? new Date(order.createdAt) : null
    setForm({
      date: d ? format(d, 'yyyy-MM-dd') : '',
      time: d ? format(d, 'HH:mm') : '',
      quantity: String(order.quantity ?? ''),
      totalAmount: String(order.totalAmount ?? ''),
    })
  }, [order])

  if (!order) return null

  const original = {
    date: order.createdAt ? format(new Date(order.createdAt), 'yyyy-MM-dd') : '',
    time: order.createdAt ? format(new Date(order.createdAt), 'HH:mm') : '',
    quantity: String(order.quantity ?? ''),
    totalAmount: String(order.totalAmount ?? ''),
  }

  const changed =
    form.date !== original.date ||
    form.time !== original.time ||
    form.quantity !== original.quantity ||
    form.totalAmount !== original.totalAmount

  const handleSave = async () => {
    // Send only what actually changed.
    const patch: Record<string, unknown> = {}
    if (form.quantity !== original.quantity) patch.quantity = Number(form.quantity)
    if (form.totalAmount !== original.totalAmount) patch.totalAmount = Number(form.totalAmount)
    if (form.date !== original.date || form.time !== original.time) {
      patch.createdAt = new Date(`${form.date}T${form.time || '00:00'}`).toISOString()
    }
    if (!Object.keys(patch).length) return onOpenChange(false)

    try {
      await updateOrder.mutateAsync({ id: String(order.id ?? order._id), data: patch })
      onOpenChange(false)
    } catch {
      // useUpdateOrder surfaces the error as a toast.
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit {order.orderNumber}</DialogTitle>
          <DialogDescription>
            Only changed fields are sent. Quantity and total price affect the ledger.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="order-date">Order date</Label>
            <Input
              id="order-date" type="date" value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="order-time">Time</Label>
            <Input
              id="order-time" type="time" value={form.time}
              onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="order-qty">Quantity</Label>
            <Input
              id="order-qty" type="number" inputMode="decimal" value={form.quantity}
              onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="order-total">Total price</Label>
            <Input
              id="order-total" type="number" inputMode="decimal" value={form.totalAmount}
              onChange={(e) => setForm((f) => ({ ...f, totalAmount: e.target.value }))}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={updateOrder.isPending}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!changed || updateOrder.isPending}>
            {updateOrder.isPending && <Loader2 className="animate-spin" />}
            Save changes
          </Button>
        </DialogFooter>
        {!changed && (
          <p className="text-right text-xs text-muted-foreground/70">
            Nothing changed yet
          </p>
        )}
      </DialogContent>
    </Dialog>
  )
}

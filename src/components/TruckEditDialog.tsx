import { useEffect, useState } from 'react'
import { Loader2, Truck } from 'lucide-react'

import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '#/components/ui/dialog'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { NumberInput } from '#/components/ui/number-input'
import { Label } from '#/components/ui/label'
import { MICRO } from '#/lib/panel'
import { cn } from '#/lib/utils'
import { useUpdateTruckLoad, type TruckLoad } from '#/lib/hooks/useTickets'

type Draft = { quantity: string; truckNumber: string; driverName: string; driverPhone: string }

const toDraft = (l: TruckLoad): Draft => ({
  quantity: String(Number(l.quantity)),
  truckNumber: l.truckNumber || '',
  driverName: l.driverName || '',
  driverPhone: l.driverPhone || '',
})

/** One truck's editable fields — quantity, plate, driver. */
function TruckRow({ orderId, load }: { orderId: number | string; load: TruckLoad }) {
  const update = useUpdateTruckLoad()
  const [draft, setDraft] = useState<Draft>(toDraft(load))

  useEffect(() => { setDraft(toDraft(load)) }, [load])

  const original = toDraft(load)
  const changed =
    draft.quantity !== original.quantity ||
    draft.truckNumber !== original.truckNumber ||
    draft.driverName !== original.driverName ||
    draft.driverPhone !== original.driverPhone
  const locked = load.status === 'gated_out'

  const save = async () => {
    const patch: Record<string, unknown> = {}
    if (draft.quantity !== original.quantity) patch.quantity = Number(draft.quantity)
    if (draft.truckNumber !== original.truckNumber) patch.truckNumber = draft.truckNumber
    if (draft.driverName !== original.driverName) patch.driverName = draft.driverName
    if (draft.driverPhone !== original.driverPhone) patch.driverPhone = draft.driverPhone
    if (!Object.keys(patch).length) return
    await update.mutateAsync({ orderId, loadId: load.id, data: patch }).catch(() => {})
  }

  return (
    <div className="space-y-3 rounded-lg border border-foreground/15 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-sm font-normal">
          <Truck className="size-3.5 text-muted-foreground" />
          Truck {load.truckIndex}
        </p>
        {locked && (
          <span className="text-xs text-muted-foreground">Gated out — no longer editable</span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className={cn(MICRO, 'text-muted-foreground')}>Quantity (L)</Label>
          <NumberInput
            value={draft.quantity} disabled={locked}
            onValueChange={(v) => setDraft((d) => ({ ...d, quantity: v }))}
          />
        </div>
        <div className="space-y-1">
          <Label className={cn(MICRO, 'text-muted-foreground')}>Plate number</Label>
          <Input
            value={draft.truckNumber} disabled={locked}
            onChange={(e) => setDraft((d) => ({ ...d, truckNumber: e.target.value }))}
          />
        </div>
        <div className="space-y-1">
          <Label className={cn(MICRO, 'text-muted-foreground')}>Driver name</Label>
          <Input
            value={draft.driverName} disabled={locked}
            onChange={(e) => setDraft((d) => ({ ...d, driverName: e.target.value }))}
          />
        </div>
        <div className="space-y-1">
          <Label className={cn(MICRO, 'text-muted-foreground')}>Driver phone</Label>
          <Input
            value={draft.driverPhone} disabled={locked}
            onChange={(e) => setDraft((d) => ({ ...d, driverPhone: e.target.value }))}
          />
        </div>
      </div>
      <div className="flex justify-end">
        <Button size="sm" onClick={save} disabled={locked || !changed || update.isPending}>
          {update.isPending && <Loader2 className="animate-spin" />}
          Save truck {load.truckIndex}
        </Button>
      </div>
    </div>
  )
}

/**
 * Correct a mistake on one or more trucks already ticketed for an order —
 * quantity, plate, driver name/phone. Separate from generating a new ticket
 * and from the loading-desk's "confirm loaded" step; this only ever touches
 * the load's own details, and is refused once a truck has gated out.
 */
export function TruckEditDialog({
  orderId, orderNumber, loads, open, onOpenChange,
}: {
  orderId: number | string | null
  orderNumber?: string
  loads: TruckLoad[]
  open: boolean
  onOpenChange: (o: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit truck details{orderNumber ? ` — ${orderNumber}` : ''}</DialogTitle>
          <DialogDescription>
            Correct quantity, plate or driver details on a ticketed truck.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {loads.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No trucks ticketed yet.</p>
          ) : (
            loads.map((l) => <TruckRow key={l.id} orderId={orderId!} load={l} />)
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

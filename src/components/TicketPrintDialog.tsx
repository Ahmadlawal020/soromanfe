import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Printer, Loader2, Layers, ArrowLeft, Pencil, Truck } from 'lucide-react'

import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '#/components/ui/dialog'
import { Button } from '#/components/ui/button'
import { Badge } from '#/components/ui/badge'
import { WaybillSheet } from '#/components/WaybillSheet'
import api from '#/lib/api/http'
import { useTicketPrintData, type TruckLoad } from '#/lib/hooks/useTickets'

const STATUS_LABEL: Record<TruckLoad['status'], string> = {
  pending: 'Not gated in',
  gated_in: 'At the gate',
  loaded: 'Loaded',
  gated_out: 'Departed',
}
const STATUS_TONE: Record<TruckLoad['status'], string> = {
  pending: 'bg-muted text-foreground',
  gated_in: 'bg-info/15 text-info',
  loaded: 'bg-accent/15 text-accent',
  gated_out: 'bg-success/15 text-success',
}

/**
 * Waybill preview and printing.
 *
 * Multiple trucks land on a list first — picking straight into "truck 1 of
 * N" hid every other truck's ticket behind Print all, with no way to open
 * one specifically to reprint or correct it. A single-truck order skips the
 * list; there is nothing to choose between.
 *
 * The sheets print through a portal onto <body> rather than from inside the
 * dialog: the dialog is fixed-positioned, height-capped and scrollable, all of
 * which clip a full-page sheet. A top-level sibling has none of that, so the
 * print stylesheet only has to hide everything else.
 *
 * The same WaybillSheet renders the preview and the paper, so they cannot
 * drift apart.
 */
export function TicketPrintDialog({
  orderId,
  orderNumber,
  loads = [],
  open,
  onOpenChange,
  onEdit,
}: {
  orderId?: number | string
  orderNumber?: string
  loads?: TruckLoad[]
  open: boolean
  onOpenChange: (o: boolean) => void
  /** Switches to the truck-details editor for this order. */
  onEdit?: () => void
}) {
  const [selected, setSelected] = useState<number | null>(null)
  const showList = loads.length > 1 && selected === null
  const activeLoadId = selected ?? (loads.length === 1 ? loads[0].id : null)

  const { data, isLoading } = useTicketPrintData(orderId, activeLoadId)
  const [batch, setBatch] = useState<Record<string, any>[] | null>(null)
  const [preparing, setPreparing] = useState(false)

  // Only ever print what is currently mounted.
  const sheets = batch ?? (data ? [data] : [])

  useEffect(() => {
    if (!open) { setSelected(null); setBatch(null); setPreparing(false) }
  }, [open])

  /** Fetches every ticket's payload up front, then prints one continuous job. */
  const printAll = async () => {
    if (!orderId || loads.length === 0) return
    setPreparing(true)
    try {
      const payloads = await Promise.all(
        loads.map((l) =>
          api.get(`/orders/${orderId}/trucks/${l.id}/print`).then((r) => r.data.data),
        ),
      )
      setBatch(payloads)
      // Let the portal commit before handing off to the print dialog.
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
      window.print()
    } finally {
      setPreparing(false)
    }
  }

  const printOne = async () => {
    setBatch(null)
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
    window.print()
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[88svh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {showList ? `Trucks${orderNumber ? ` — ${orderNumber}` : ''}` : 'Waybill & payment receipt'}
            </DialogTitle>
            <DialogDescription>
              {showList
                ? `${loads.length} trucks ticketed on this order — pick one to view, print or edit.`
                : data
                  ? `Truck ${data.truckNumber} of ${data.totalTrucks} · ${data.reference}`
                  : 'Preparing…'}
            </DialogDescription>
          </DialogHeader>

          {showList ? (
            <div className="space-y-1.5">
              {loads.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => setSelected(l.id)}
                  className="flex w-full items-center justify-between gap-3 rounded-lg border border-foreground/15 p-3 text-left transition-colors duration-250 ease-luxe outline-none hover:bg-muted/60"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted/60">
                      <Truck className="size-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-normal">
                        Truck {l.truckIndex} · {l.truckNumber || 'No plate yet'}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {Number(l.quantity).toLocaleString('en-NG')} L
                        {l.driverName ? ` · ${l.driverName}` : ''}
                      </p>
                    </div>
                  </div>
                  <Badge className={STATUS_TONE[l.status]}>{STATUS_LABEL[l.status]}</Badge>
                </button>
              ))}
            </div>
          ) : isLoading || !data ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="size-5 animate-spin text-accent" />
            </div>
          ) : (
            // Scaled down so a full sheet is legible inside the dialog.
            <div className="overflow-hidden rounded-lg border border-foreground/15">
              <div className="origin-top scale-[0.62] [transform-box:fill-box]">
                <WaybillSheet data={data} />
              </div>
            </div>
          )}

          <DialogFooter>
            {loads.length > 1 && !showList && (
              <Button variant="ghost" onClick={() => setSelected(null)}>
                <ArrowLeft data-icon="inline-start" />
                All trucks
              </Button>
            )}
            <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
            {loads.length > 1 && (
              <Button variant="outline" onClick={printAll} disabled={preparing}>
                {preparing ? <Loader2 className="animate-spin" /> : <Layers data-icon="inline-start" />}
                Print all {loads.length}
              </Button>
            )}
            {!showList && onEdit && (
              <Button variant="outline" onClick={onEdit} disabled={!data}>
                <Pencil data-icon="inline-start" />
                Edit
              </Button>
            )}
            {!showList && (
              <Button onClick={printOne} disabled={!data}>
                <Printer data-icon="inline-start" />
                Print
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* The paper copy. One sheet per truck, each on its own page. */}
      {open && sheets.length > 0
        ? createPortal(
            <div id="ticket-print-root" className="hidden print:block">
              {sheets.map((s, i) => (
                <WaybillSheet key={`${s.reference}-${s.truckNumber}-${i}`} data={s} />
              ))}
            </div>,
            document.body,
          )
        : null}
    </>
  )
}

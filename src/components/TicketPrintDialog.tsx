import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Printer, Loader2, Layers } from 'lucide-react'

import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '#/components/ui/dialog'
import { Button } from '#/components/ui/button'
import { WaybillSheet } from '#/components/WaybillSheet'
import api from '#/lib/api/http'
import { useTicketPrintData } from '#/lib/hooks/useTickets'

/**
 * Waybill preview and printing.
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
  loadId,
  loadIds = [],
  open,
  onOpenChange,
}: {
  orderId?: number | string
  loadId: number | null
  /** Every load on the order, for "print all". */
  loadIds?: number[]
  open: boolean
  onOpenChange: (o: boolean) => void
}) {
  const { data, isLoading } = useTicketPrintData(orderId, loadId)
  const [batch, setBatch] = useState<Record<string, any>[] | null>(null)
  const [preparing, setPreparing] = useState(false)

  // Only ever print what is currently mounted.
  const sheets = batch ?? (data ? [data] : [])

  useEffect(() => {
    if (!open) { setBatch(null); setPreparing(false) }
  }, [open])

  /** Fetches every ticket's payload up front, then prints one continuous job. */
  const printAll = async () => {
    if (!orderId || loadIds.length === 0) return
    setPreparing(true)
    try {
      const payloads = await Promise.all(
        loadIds.map((id) =>
          api.get(`/orders/${orderId}/trucks/${id}/print`).then((r) => r.data.data),
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
            <DialogTitle>Waybill &amp; payment receipt</DialogTitle>
            <DialogDescription>
              {data
                ? `Truck ${data.truckNumber} of ${data.totalTrucks} · ${data.reference}`
                : 'Preparing…'}
            </DialogDescription>
          </DialogHeader>

          {isLoading || !data ? (
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
            <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
            {loadIds.length > 1 && (
              <Button variant="outline" onClick={printAll} disabled={!data || preparing}>
                {preparing ? <Loader2 className="animate-spin" /> : <Layers data-icon="inline-start" />}
                Print all {loadIds.length}
              </Button>
            )}
            <Button onClick={printOne} disabled={!data}>
              <Printer data-icon="inline-start" />
              Print
            </Button>
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

import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription,
} from '#/components/ui/dialog'
import { CheckCircle2, Loader2, Truck } from 'lucide-react'

interface OffloadTarget {
  id?: string
  _id?: string
  truckPlate: string
  code?: string
  qty?: number
  unitLabel?: string
}

interface OffloadDialogProps {
  target: OffloadTarget | null
  date: string
  setDate: (v: string) => void
  onClose: () => void
  onConfirm: () => void
  loading: boolean
}

export function OffloadDialog({ target, date, setDate, onClose, onConfirm, loading }: OffloadDialogProps) {
  if (!target) return null

  return (
    <Dialog open={!!target} onOpenChange={open => { if (!open) onClose() }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="size-5 text-accent" />
            Confirm Sale / Offload
          </DialogTitle>
          <DialogDescription>
            Mark <strong>{target.truckPlate}</strong>
            {target.code ? ` (${target.code})` : ''} as sold/offloaded.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="bg-muted/30 rounded-lg p-3 flex items-center gap-3">
            <Truck className="size-4 text-muted-foreground shrink-0" />
            <div>
              <p className="font-semibold text-sm">{target.truckPlate}</p>
              {target.qty != null && target.qty > 0 && (
                <p className="text-xs text-muted-foreground">
                  {target.qty.toLocaleString()} {target.unitLabel || 'L'}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase">
              Date Sold / Offloaded
            </label>
            <Input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="h-9 text-sm"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            className="bg-accent hover:bg-accent/80 text-accent-foreground gap-2"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
            {loading ? 'Saving...' : 'Confirm Sold'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

import { Button } from '#/components/ui/button'
import { Label } from '#/components/ui/label'
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription,
} from '#/components/ui/dialog'
import { Tag, Loader2 } from 'lucide-react'
import type { Pfi } from '#/lib/hooks/usePfis'

interface BulkAssignDialogProps {
  open: boolean
  count: number
  deliveryCodes: string[]
  allPfiOptions: { id: string; label: string }[]
  allPfis: Pfi[]
  bulkAssignCode: string
  bulkAssignPfi: string
  setBulkAssignCode: (v: string) => void
  setBulkAssignPfi: (v: string) => void
  onClose: () => void
  onConfirm: () => void
  loading: boolean
}

export function BulkAssignDialog({
  open, count, deliveryCodes, allPfiOptions,   allPfis: _allPfis,
  bulkAssignCode, bulkAssignPfi,
  setBulkAssignCode, setBulkAssignPfi,
  onClose, onConfirm, loading,
}: BulkAssignDialogProps) {
  return (
    <Dialog open={open} onOpenChange={open => { if (!open) onClose() }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag size={18} className="text-blue-600" />
            Bulk Assign
          </DialogTitle>
          <DialogDescription>
            Assign a code and/or PFI to <strong>{count}</strong> selected record{count !== 1 ? 's' : ''}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Allocation Code
            </Label>
            <select
              aria-label="Bulk allocation code"
              value={bulkAssignCode}
              onChange={e => setBulkAssignCode(e.target.value)}
              className="h-9 w-full rounded-lg border border-border bg-white px-3 text-sm"
            >
              <option value="">Keep existing code</option>
              <option value="__CLEAR__">Remove code (no code)</option>
              {deliveryCodes.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              PFI
            </Label>
            <select
              aria-label="Bulk PFI"
              value={bulkAssignPfi}
              onChange={e => setBulkAssignPfi(e.target.value)}
              className="h-9 w-full rounded-lg border border-border bg-white px-3 text-sm"
            >
              <option value="">Keep existing PFI</option>
              {allPfiOptions.map(p => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={loading || (!bulkAssignCode && !bulkAssignPfi)}
            className="gap-2"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Tag size={16} />}
            {loading ? 'Applying...' : `Apply to ${count} Record${count !== 1 ? 's' : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

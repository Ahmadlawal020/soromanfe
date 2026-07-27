import { Button } from '#/components/ui/button'
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription,
} from '#/components/ui/dialog'
import { Trash2, Loader2, AlertTriangle } from 'lucide-react'

interface BulkDeleteDialogProps {
  open: boolean
  count: number
  onClose: () => void
  onConfirm: () => void
  loading: boolean
}

export function BulkDeleteDialog({ open, count, onClose, onConfirm, loading }: BulkDeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={open => { if (!open) onClose() }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle size={20} />
            Bulk Delete
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete <strong>{count}</strong> selected record{count !== 1 ? 's' : ''}?
            This will also delete all associated sales ledger entries. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={loading}
            className="gap-2"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
            {loading ? 'Deleting...' : `Delete ${count} Record${count !== 1 ? 's' : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

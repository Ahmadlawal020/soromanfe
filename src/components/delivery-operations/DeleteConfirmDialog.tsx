import { Button } from '#/components/ui/button'
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription,
} from '#/components/ui/dialog'
import { Trash2, Loader2, AlertTriangle } from 'lucide-react'

interface DeleteTarget {
  id: string
  label: string
}

interface DeleteConfirmDialogProps {
  target: DeleteTarget | null
  onClose: () => void
  onConfirm: () => void
  loading: boolean
}

export function DeleteConfirmDialog({ target, onClose, onConfirm, loading }: DeleteConfirmDialogProps) {
  if (!target) return null

  return (
    <Dialog open={!!target} onOpenChange={open => { if (!open) onClose() }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="size-5" />
            Delete Record
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the record for <strong>{target.label}</strong>?
            This will also delete any associated sales ledger entries. This action cannot be undone.
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
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
            {loading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

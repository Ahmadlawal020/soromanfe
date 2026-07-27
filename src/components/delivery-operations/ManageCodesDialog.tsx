import { useState, useMemo } from 'react'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription,
} from '#/components/ui/dialog'
import { Settings, Plus, Trash2, Pencil, Check, X, Tag, Search } from 'lucide-react'
import type { DeliveryInventory } from '#/lib/types'

interface ManageCodesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  deliveryCodes: string[]
  setDeliveryCodes: React.Dispatch<React.SetStateAction<string[]>>
  truckRecords?: (DeliveryInventory & { code?: string; truckPlate?: string })[]
  allEntries: DeliveryInventory[]
  onRename: (oldCode: string, newCode: string) => Promise<void>
  toast: { success: (msg: string) => void; error: (msg: string) => void }
}

export function ManageCodesDialog({
  open, onOpenChange, deliveryCodes, setDeliveryCodes,
  truckRecords: _truckRecords, allEntries, onRename, toast,
}: ManageCodesDialogProps) {
  const [newCode, setNewCode] = useState('')
  const [codeSearch, setCodeSearch] = useState('')
  const [editingCode, setEditingCode] = useState<string | null>(null)
  const [editingCodeValue, setEditingCodeValue] = useState('')
  const [renamingCode, setRenamingCode] = useState(false)

  const codeUsageMap = useMemo(() => {
    const map = new Map<string, number>()
    allEntries.forEach(e => {
      const code = (e.allocationCode || '').trim().toUpperCase()
      if (code) map.set(code, (map.get(code) || 0) + 1)
    })
    return map
  }, [allEntries])

  const filteredCodes = useMemo(() => {
    if (!codeSearch.trim()) return deliveryCodes
    const q = codeSearch.trim().toLowerCase()
    return deliveryCodes.filter(c => c.toLowerCase().includes(q))
  }, [deliveryCodes, codeSearch])

  const handleAddCode = () => {
    const normalized = newCode.trim().toUpperCase().replace(/\s+/g, '-')
    if (!normalized) return
    if (deliveryCodes.includes(normalized)) {
      toast.error(`Code "${normalized}" already exists`)
      return
    }
    setDeliveryCodes(prev => [...prev, normalized].sort())
    setNewCode('')
    toast.success(`Code "${normalized}" created`)
  }

  const handleDeleteCode = (code: string) => {
    setDeliveryCodes(prev => prev.filter(c => c !== code))
    toast.success(`Code "${code}" removed`)
  }

  const handleStartRename = (code: string) => {
    setEditingCode(code)
    setEditingCodeValue(code)
  }

  const handleSaveRename = async () => {
    if (!editingCode || !editingCodeValue.trim()) return
    const newCode = editingCodeValue.trim().toUpperCase().replace(/\s+/g, '-')
    if (newCode === editingCode) { setEditingCode(null); return }
    if (deliveryCodes.includes(newCode)) {
      toast.error(`Code "${newCode}" already exists`)
      return
    }

    setRenamingCode(true)
    try {
      await onRename(editingCode, newCode)
      setDeliveryCodes(prev => prev.map(c => c === editingCode ? newCode : c).sort())
      toast.success(`Renamed "${editingCode}" → "${newCode}"`)
      setEditingCode(null)
    } catch {
      toast.error('Rename failed')
    } finally {
      setRenamingCode(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings size={18} className="text-purple-600" />
            Manage Allocation Codes
          </DialogTitle>
          <DialogDescription>
            Create, rename, or delete allocation codes used to group truck records.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Add new code */}
          <div className="flex gap-2">
            <Input
              placeholder="New code name..."
              value={newCode}
              onChange={e => setNewCode(e.target.value.toUpperCase().replace(/\s+/g, '-'))}
              onKeyDown={e => e.key === 'Enter' && handleAddCode()}
              className="h-9 text-sm flex-1"
            />
            <Button size="sm" className="h-9 px-3 gap-1.5" onClick={handleAddCode}>
              <Plus size={14} /> Add
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
            <Input
              placeholder="Search codes..."
              value={codeSearch}
              onChange={e => setCodeSearch(e.target.value)}
              className="h-9 pl-8 text-sm"
            />
          </div>

          {/* Code list */}
          <div className="border border-border rounded-lg divide-y divide-border/50 max-h-[300px] overflow-y-auto">
            {filteredCodes.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                {deliveryCodes.length === 0 ? 'No codes created yet.' : 'No codes match your search.'}
              </div>
            ) : (
              filteredCodes.map(code => {
                const usage = codeUsageMap.get(code) || 0
                const isEditing = editingCode === code

                return (
                  <div key={code} className="flex items-center gap-2 px-3 py-2.5">
                    {isEditing ? (
                      <>
                        <Input
                          value={editingCodeValue}
                          onChange={e => setEditingCodeValue(e.target.value.toUpperCase().replace(/\s+/g, '-'))}
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleSaveRename()
                            if (e.key === 'Escape') setEditingCode(null)
                          }}
                          className="h-8 text-sm flex-1"
                          autoFocus
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-emerald-600"
                          onClick={handleSaveRename}
                          disabled={renamingCode}
                        >
                          <Check size={14} />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={() => setEditingCode(null)}
                        >
                          <X size={14} />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Tag size={12} className="text-purple-500 shrink-0" />
                        <span className="flex-1 font-semibold text-sm">{code}</span>
                        <span className="text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                          {usage} record{usage !== 1 ? 's' : ''}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                          onClick={() => handleStartRename(code)}
                          title="Rename"
                        >
                          <Pencil size={12} />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-red-500"
                          onClick={() => handleDeleteCode(code)}
                          title="Delete"
                        >
                          <Trash2 size={12} />
                        </Button>
                      </>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

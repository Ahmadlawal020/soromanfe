import { useMemo } from 'react'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription,
} from '#/components/ui/dialog'
import { Plus, Search, Loader2, Truck, X } from 'lucide-react'
import { toNum } from '#/lib/utils'
import type { Pfi } from '#/lib/hooks/usePfis'

interface TruckItem {
  _id: string
  plateNumber: string
  capacity?: string | number
  capacity_litres?: number
  status?: string
  driver?: string
}

interface AllocateTrucksDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  activePfiOptions: { id: string; label: string }[]
  selectedPfi: Pfi | null
  deliveryCodes: string[]
  availableTrucks: TruckItem[]
  selectedTruckIds: Set<string>
  autoSumCapacity: number
  trucksWithNoCapacity: string[]
  saving: boolean
  loadPfi: string
  loadCode: string
  dateAllocated: string
  truckSearch: string
  showNewCodeInput: boolean
  newCodeInput: string
  setLoadPfi: (v: string) => void
  setLoadCode: (v: string) => void
  setDateAllocated: (v: string) => void
  setTruckSearch: (v: string) => void
  setShowNewCodeInput: (v: boolean) => void
  setNewCodeInput: (v: string) => void
  setLoadDepot: (v: string) => void
  toggleTruck: (id: string) => void
  addNewCode: () => void
  handleLoadSave: () => void
  pfiMap: Map<string, Pfi>
}

export function AllocateTrucksDialog({
  open,
  onOpenChange,
  activePfiOptions,
  selectedPfi,
  deliveryCodes,
  availableTrucks,
  selectedTruckIds,
  autoSumCapacity,
  trucksWithNoCapacity,
  saving,
  loadPfi,
  loadCode,
  dateAllocated,
  truckSearch,
  showNewCodeInput,
  newCodeInput,
  setLoadPfi,
  setLoadCode,
  setDateAllocated,
  setTruckSearch,
  setShowNewCodeInput,
  setNewCodeInput,
  setLoadDepot,
  toggleTruck,
  addNewCode,
  handleLoadSave,
  pfiMap,
}: AllocateTrucksDialogProps) {
  const filteredTrucks = useMemo(() => {
    if (!truckSearch.trim()) return availableTrucks
    const q = truckSearch.trim().toLowerCase()
    return availableTrucks.filter(t =>
      t.plateNumber.toLowerCase().includes(q) ||
      (t.driver || '').toLowerCase().includes(q)
    )
  }, [availableTrucks, truckSearch])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90svh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Truck className="size-5 text-accent" />
            Allocate Trucks to PFI
          </DialogTitle>
          <DialogDescription>
            Select a PFI source, assign an allocation code, and choose trucks to load.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* PFI Selector */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground uppercase">
              PFI Source <span className="text-destructive">*</span>
            </Label>
            <select
              aria-label="Select PFI"
              value={loadPfi}
              onChange={e => {
                setLoadPfi(e.target.value)
                const pfi = pfiMap.get(e.target.value)
                if (pfi?.locationName) setLoadDepot(pfi.locationName)
              }}
              className="h-8 w-full rounded-lg border border-border bg-white px-2.5 text-base md:text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="">Select a PFI...</option>
              {activePfiOptions.map(p => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
            {selectedPfi && (
              <p className="text-[11px] text-muted-foreground">
                Product: <strong>{selectedPfi.productName || 'N/A'}</strong> ·
                Depot: <strong>{selectedPfi.locationName || 'N/A'}</strong> ·
                Remaining: <strong>{(toNum(selectedPfi.startingQtyLitres) - toNum(selectedPfi.soldQtyLitres)).toLocaleString()} L</strong>
              </p>
            )}
          </div>

          {/* Allocation Code + Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase">
                Allocation Code
              </Label>
              {showNewCodeInput ? (
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g. CODE-001"
                    value={newCodeInput}
                    onChange={e => setNewCodeInput(e.target.value.toUpperCase().replace(/\s+/g, '-'))}
                    onKeyDown={e => e.key === 'Enter' && addNewCode()}
                    className="h-9 text-sm"
                  />
                  <Button size="sm" className="h-9 px-3 text-xs" onClick={addNewCode}>
                    Add
                  </Button>
                  <Button size="sm" variant="ghost" className="h-9 px-2" onClick={() => { setShowNewCodeInput(false); setNewCodeInput('') }}>
                    <X className="size-3.5" />
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <select
                    aria-label="Allocation code"
                    value={loadCode}
                    onChange={e => setLoadCode(e.target.value)}
                    className="h-8 flex-1 rounded-lg border border-border bg-white px-2.5 text-base md:text-sm"
                  >
                    <option value="">No code</option>
                    {deliveryCodes.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9 px-2.5 text-xs gap-1"
                    onClick={() => setShowNewCodeInput(true)}
                  >
                    <Plus className="size-3.5" /> New
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase">
                Date Loaded
              </Label>
              <Input
                type="date"
                value={dateAllocated}
                onChange={e => setDateAllocated(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
          </div>

          {/* Truck Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-muted-foreground uppercase">
                Select Trucks <span className="text-destructive">*</span>
              </Label>
              <span className="text-[11px] text-muted-foreground">
                {selectedTruckIds.size} selected · {availableTrucks.length} available
              </span>
            </div>

            <div className="relative">
              <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search trucks by plate or driver..."
                value={truckSearch}
                onChange={e => setTruckSearch(e.target.value)}
                className="h-9 pl-8 text-sm"
              />
            </div>

            <div className="border border-border rounded-lg max-h-[260px] overflow-y-auto divide-y divide-border/50">
              {filteredTrucks.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  {availableTrucks.length === 0
                    ? 'All trucks are currently loaded. Offload a truck first.'
                    : 'No trucks match your search.'}
                </div>
              ) : (
                filteredTrucks.map(truck => {
                  const isSelected = selectedTruckIds.has(truck._id)
                  const capacity = toNum(truck.capacity_litres || truck.capacity)
                  return (
                    <label
                      key={truck._id}
                      className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors ${
                        isSelected ? 'bg-accent/60' : 'hover:bg-muted/30'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleTruck(truck._id)}
                        className="size-4 rounded border-border accent-primary"
                      />
                      <div className="flex-1 min-w-0">
                        <span className="font-semibold text-sm text-foreground">{truck.plateNumber}</span>
                        {truck.driver && (
                          <span className="text-xs text-muted-foreground ml-2">— {truck.driver}</span>
                        )}
                      </div>
                      <span className="text-xs font-normal text-muted-foreground shrink-0">
                        {capacity > 0 ? `${capacity.toLocaleString()} L` : 'No capacity'}
                      </span>
                    </label>
                  )
                })
              )}
            </div>
          </div>

          {/* Summary */}
          {selectedTruckIds.size > 0 && (
            <div className="bg-accent/60 border border-accent/40 rounded-lg px-4 py-3 space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-normal text-accent">
                  {selectedTruckIds.size} truck{selectedTruckIds.size !== 1 ? 's' : ''} selected
                </span>
                {autoSumCapacity > 0 && (
                  <span className="font-semibold text-accent">
                    Total: {autoSumCapacity.toLocaleString()} L
                  </span>
                )}
              </div>
              {trucksWithNoCapacity.length > 0 && (
                <p className="text-[11px] text-warning">
                  ⚠ No capacity set for: {trucksWithNoCapacity.join(', ')}
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button
            className="bg-accent hover:bg-accent/80 text-accent-foreground gap-2"
            onClick={handleLoadSave}
            disabled={saving || selectedTruckIds.size === 0 || !loadPfi}
          >
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Truck className="size-4" />}
            {saving ? 'Saving...' : `Allocate ${selectedTruckIds.size} Truck${selectedTruckIds.size !== 1 ? 's' : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

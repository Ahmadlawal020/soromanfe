import { useState, useMemo, useCallback } from 'react'
import { PageHeader } from '#/components/PageHeader'
import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { format } from 'date-fns'
import { usePfiList, useUpdatePfi, type Pfi } from '#/lib/hooks/usePfis'
import { useAllocatableTrucks } from '#/lib/hooks/useFleet'
import { useDeliveryInventoryList, useCreateDeliveryInventory } from '#/lib/hooks/useDeliveryInventory'
import { useToast } from '#/lib/hooks/useToast'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Truck, Plus, Search, Loader2, CheckCircle2, Droplets, Building2, Calendar, Tag, AlertCircle, X } from 'lucide-react'

export const Route = createFileRoute('/delivery-operations/allocate-trucks')({
  component: AllocateTrucksPage,
})

function toNum(v: string | number | undefined | null): number {
  if (v === undefined || v === null || v === '') return 0
  if (typeof v === 'number') return v
  const cleaned = String(v).replace(/[^0-9.]/g, '')
  const n = Number(cleaned)
  return Number.isFinite(n) ? n : 0
}

function AllocateTrucksPage() {
  const navigate = useNavigate()
  const toast = useToast()

  // Queries
  const { data: pfisData } = usePfiList()
  const { data: trucksData } = useAllocatableTrucks()
  const { data: rawInventory = [] } = useDeliveryInventoryList()

  const allPfis: Pfi[] = useMemo(() => {
    if (!pfisData) return []
    return Array.isArray(pfisData) ? pfisData : (pfisData.pfis || [])
  }, [pfisData])

  const allTrucks = useMemo(() => {
    if (!trucksData) return []
    return Array.isArray(trucksData) ? trucksData : (trucksData.trucks || [])
  }, [trucksData])

  const allEntries = useMemo(() => {
    if (!rawInventory) return []
    return Array.isArray(rawInventory) ? rawInventory : []
  }, [rawInventory])

  // Mutations
  const createInventory = useCreateDeliveryInventory()
  const updatePfi = useUpdatePfi()

  // Form State
  const [loadPfi, setLoadPfi] = useState('')
  const [loadCode, setLoadCode] = useState('')
  const [loadDepot, setLoadDepot] = useState('')
  const [dateAllocated, setDateAllocated] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [selectedTruckIds, setSelectedTruckIds] = useState<Set<string>>(new Set())
  const [truckSearch, setTruckSearch] = useState('')
  const [showNewCodeInput, setShowNewCodeInput] = useState(false)
  const [newCodeInput, setNewCodeInput] = useState('')
  const [customCodes, setCustomCodes] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  // Derived existing allocation codes
  const deliveryCodes = useMemo(() => {
    const fromEntries = allEntries
      .map(e => (e.allocationCode || '').trim().toUpperCase())
      .filter(Boolean)
    const combined = Array.from(new Set([...fromEntries, ...customCodes])).sort()
    return combined
  }, [allEntries, customCodes])

  // Lookup Maps
  const pfiMap = useMemo(() => {
    const m = new Map<string, Pfi>()
    allPfis.forEach((p: Pfi) => m.set(p._id, p))
    return m
  }, [allPfis])

  // Active PFI options
  const activePfiOptions = useMemo(() => {
    return allPfis
      .filter((p: Pfi) => p.status === 'active')
      .sort((a: Pfi, b: Pfi) => a.pfiNumber.localeCompare(b.pfiNumber))
  }, [allPfis])

  const selectedPfi = useMemo(() => (loadPfi ? pfiMap.get(loadPfi) || null : null), [loadPfi, pfiMap])

  // Loaded truck plates to prevent double allocation
  const loadedTruckPlates = useMemo(() => {
    const set = new Set<string>()
    allEntries.forEach(r => {
      if (r.loadingStatus === 'loaded' && (r.truckNumber || (r as any).truckPlate)) {
        set.add((r.truckNumber || (r as any).truckPlate || '').toUpperCase())
      }
    })
    return set
  }, [allEntries])

  // Available trucks (not currently in transit)
  const availableTrucks = useMemo(() => {
    return allTrucks.filter((t: any) => {
      const plate = (t.plateNumber || '').toUpperCase()
      return !loadedTruckPlates.has(plate)
    })
  }, [allTrucks, loadedTruckPlates])

  // Filtered trucks by search
  const filteredTrucks = useMemo(() => {
    if (!truckSearch.trim()) return availableTrucks
    const q = truckSearch.trim().toLowerCase()
    return availableTrucks.filter((t: any) =>
      (t.plateNumber || '').toLowerCase().includes(q) ||
      (t.driver || t.driver_name || '').toLowerCase().includes(q) ||
      (t.model || '').toLowerCase().includes(q)
    )
  }, [availableTrucks, truckSearch])

  // Capacity calculations
  const autoSumCapacity = useMemo(() => {
    let total = 0
    selectedTruckIds.forEach(id => {
      const t = allTrucks.find((t: any) => (t._id || t.id) === id)
      if (t?.capacity_litres || t?.capacity) total += toNum(t.capacity_litres || t.capacity)
    })
    return total
  }, [selectedTruckIds, allTrucks])

  const trucksWithNoCapacity = useMemo(() => {
    const result: string[] = []
    selectedTruckIds.forEach(id => {
      const t = allTrucks.find((t: any) => (t._id || t.id) === id)
      if (t && !toNum(t.capacity_litres || t.capacity)) result.push(t.plateNumber)
    })
    return result
  }, [selectedTruckIds, allTrucks])

  // Handlers
  const toggleTruck = (truckId: string) => {
    setSelectedTruckIds(prev => {
      const next = new Set(prev)
      next.has(truckId) ? next.delete(truckId) : next.add(truckId)
      return next
    })
  }

  const selectAllFilteredTrucks = () => {
    setSelectedTruckIds(prev => {
      const next = new Set(prev)
      filteredTrucks.forEach((t: any) => next.add(t._id || t.id))
      return next
    })
  }

  const clearTruckSelection = () => {
    setSelectedTruckIds(new Set())
  }

  const addNewCode = () => {
    const normalized = newCodeInput.trim().toUpperCase().replace(/\s+/g, '-')
    if (!normalized) return
    if (deliveryCodes.includes(normalized)) {
      toast.error(`Code "${normalized}" already exists`)
      return
    }
    setCustomCodes(prev => [...prev, normalized])
    setLoadCode(normalized)
    setNewCodeInput('')
    setShowNewCodeInput(false)
    toast.success(`Code "${normalized}" created and selected`)
  }

  const handleSave = useCallback(async () => {
    if (selectedTruckIds.size === 0) {
      toast.error('Select at least one truck')
      return
    }
    if (!loadPfi) {
      toast.error('Select a PFI source')
      return
    }

    setSaving(true)
    try {
      const depot = loadDepot || selectedPfi?.locationName || ''
      const normalizedCode = loadCode ? loadCode.trim().toUpperCase().replace(/\s+/g, '-') : null
      const promises: Promise<any>[] = []

      for (const truckId of selectedTruckIds) {
        const truckObj = allTrucks.find((t: any) => String(t._id || t.id) === String(truckId))
        const truckCapacity = toNum(truckObj?.capacity_litres || truckObj?.capacity)
        promises.push(
          createInventory.mutateAsync({
            pfi: loadPfi,
            pfiId: Number(loadPfi) || undefined,
            allocation_code: normalizedCode || undefined,
            allocationCode: normalizedCode || undefined,
            truck: truckId,
            truckId: Number(truckId) || undefined,
            truck_number: truckObj?.plateNumber || '',
            truckNumber: truckObj?.plateNumber || '',
            depot: depot || selectedPfi?.locationName || undefined,
            quantity_allocated: truckCapacity,
            quantityAllocated: truckCapacity,
            date_allocated: dateAllocated,
            dateAllocated: dateAllocated,
            loading_status: 'loaded',
            loadingStatus: 'loaded',
          } as any)
        )
      }

      await Promise.all(promises)

      // Update PFI sold_qty_litres
      if (selectedPfi && autoSumCapacity > 0) {
        const currentSold = toNum(selectedPfi.soldQtyLitres)
        await updatePfi.mutateAsync({
          id: loadPfi,
          data: { soldQtyLitres: currentSold + autoSumCapacity },
        })
      }

      toast.success(
        `${selectedTruckIds.size} truck${selectedTruckIds.size > 1 ? 's' : ''} allocated${normalizedCode ? ` under ${normalizedCode}` : ''
        }`
      )

      navigate({ to: '/delivery-operations' })
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save truck allocations')
    } finally {
      setSaving(false)
    }
  }, [
    selectedTruckIds,
    loadCode,
    loadPfi,
    loadDepot,
    dateAllocated,
    selectedPfi,
    allTrucks,
    autoSumCapacity,
    createInventory,
    updatePfi,
    toast,
    navigate,
  ])

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <PageHeader
      eyebrow="Truck Sales"
      title="Allocate Trucks to PFI"
      description="Select an active PFI source, specify allocation code, and assign trucks for loading."
    />

        <div className="flex items-center gap-2">
          <Link to="/delivery-operations">
            <Button variant="outline" size="sm" className="cursor-pointer" disabled={saving}>
              Cancel
            </Button>
          </Link>
          <Button
            size="sm"
            className="bg-accent hover:bg-accent/80 text-accent-foreground gap-2 cursor-pointer font-normal"
            onClick={handleSave}
            disabled={saving || selectedTruckIds.size === 0 || !loadPfi}
          >
            {saving ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
            {saving ? 'Saving...' : `Confirm & Allocate ${selectedTruckIds.size} Truck${selectedTruckIds.size !== 1 ? 's' : ''}`}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Form Details */}
        <div className="lg:col-span-1 space-y-5">
          {/* Step 1: PFI Selection */}
          <div className="bg-card p-5 rounded-xl border border-border space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <span className="flex items-center justify-center size-6 rounded-full bg-accent/20 text-accent text-xs font-semibold">1</span>
              Select PFI Source <span className="text-destructive">*</span>
            </div>

            <div className="space-y-2">
              <select
                aria-label="Select PFI Source"
                value={loadPfi}
                onChange={e => {
                  setLoadPfi(e.target.value)
                  const pfi = pfiMap.get(e.target.value)
                  if (pfi?.locationName) setLoadDepot(pfi.locationName)
                }}
                className="h-8 w-full rounded-lg border border-border bg-background text-foreground px-2.5 text-base md:text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 font-normal"
              >
                <option value="">Select a PFI...</option>
                {activePfiOptions.map(p => (
                  <option key={p._id} value={p._id}>
                    {p.pfiNumber} — {p.productName || 'N/A'} ({p.locationName || 'Depot'})
                  </option>
                ))}
              </select>

              {selectedPfi ? (
                <div className="p-3.5 bg-accent/10 border border-accent/20 rounded-lg text-xs space-y-1.5">
                  <div className="flex justify-between font-semibold text-accent">
                    <span>{selectedPfi.pfiNumber}</span>
                    <span className="bg-accent/20 text-accent px-2 py-0.5 rounded text-xs uppercase font-semibold">Active</span>
                  </div>
                  <div className="text-accent space-y-1">
                    <p className="flex items-center gap-1.5">
                      <Droplets className="size-3.5" />
                      Product: <strong>{selectedPfi.productName || 'N/A'}</strong>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <Building2 className="size-3.5" />
                      Depot: <strong>{selectedPfi.locationName || 'N/A'}</strong>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <Truck className="size-3.5" />
                      Available Volume:{' '}
                      <strong>
                        {(toNum(selectedPfi.startingQtyLitres) - toNum(selectedPfi.soldQtyLitres)).toLocaleString()} L
                      </strong>
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Choose a PFI from the dropdown to view available litres and depot details.
                </p>
              )}
            </div>
          </div>

          {/* Step 2: Allocation Code & Date */}
          <div className="bg-card p-5 rounded-xl border border-border space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <span className="flex items-center justify-center size-6 rounded-full bg-accent/20 text-accent text-xs font-semibold">2</span>
              Allocation Details
            </div>

            <div className="space-y-3">
              {/* Allocation Code */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1">
                  <Tag className="size-3.5" /> Allocation Code
                </Label>
                {showNewCodeInput ? (
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g. DEL-2026-AGO-01"
                      value={newCodeInput}
                      onChange={e => setNewCodeInput(e.target.value.toUpperCase().replace(/\s+/g, '-'))}
                      onKeyDown={e => e.key === 'Enter' && addNewCode()}
                      className="h-9 text-sm uppercase font-mono"
                    />
                    <Button size="sm" className="h-9 px-3 text-xs bg-accent text-accent-foreground hover:bg-accent" onClick={addNewCode}>
                      Add
                    </Button>
                    <Button size="sm" variant="ghost" className="h-9 px-2" onClick={() => { setShowNewCodeInput(false); setNewCodeInput('') }}>
                      <X className="size-3.5" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <select
                      aria-label="Allocation Code"
                      value={loadCode}
                      onChange={e => setLoadCode(e.target.value)}
                      className="h-8 flex-1 rounded-lg border border-border bg-background text-foreground px-2.5 text-base md:text-sm font-mono font-normal"
                    >
                      <option value="">No Code (Unassigned)</option>
                      {deliveryCodes.map(c => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-9 px-2.5 text-xs gap-1 cursor-pointer"
                      onClick={() => setShowNewCodeInput(true)}
                    >
                      <Plus className="size-3.5" /> New
                    </Button>
                  </div>
                )}
              </div>

              {/* Depot Override */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1">
                  <Building2 className="size-3.5" /> Depot Location
                </Label>
                <Input
                  placeholder="Depot name..."
                  value={loadDepot}
                  onChange={e => setLoadDepot(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>

              {/* Date Allocated */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-1">
                  <Calendar className="size-3.5" /> Date Loaded
                </Label>
                <Input
                  type="date"
                  value={dateAllocated}
                  onChange={e => setDateAllocated(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Allocation Summary Card */}
          <div className="bg-foreground text-background p-5 rounded-xl space-y-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold uppercase">
              <span>Allocation Summary</span>
              <Truck className="size-4 text-accent" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Selected Trucks:</span>
                <span className="font-semibold text-accent">{selectedTruckIds.size}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Volume:</span>
                <span className="font-semibold text-accent">
                  {autoSumCapacity > 0 ? `${autoSumCapacity.toLocaleString()} Litres` : '0 L'}
                </span>
              </div>
              {loadCode && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Code:</span>
                  <span className="font-mono text-accent">{loadCode}</span>
                </div>
              )}
            </div>

            {trucksWithNoCapacity.length > 0 && (
              <div className="p-2 bg-warning/60 border border-warning/50 rounded text-xs text-warning flex items-start gap-1.5">
                <AlertCircle className="size-3.5 shrink-0 mt-0.5" />
                <span>No capacity set for: {trucksWithNoCapacity.join(', ')}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Truck Selection List */}
        <div className="lg:col-span-2 bg-card p-5 rounded-xl border border-border space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-border pb-3">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <span className="flex items-center justify-center size-6 rounded-full bg-accent/20 text-accent text-xs font-semibold">3</span>
                Select Fleet Trucks <span className="text-destructive">*</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {selectedTruckIds.size} selected of {availableTrucks.length} available trucks
              </p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs text-accent hover:bg-accent/10 cursor-pointer"
                onClick={selectAllFilteredTrucks}
                disabled={filteredTrucks.length === 0}
              >
                Select All ({filteredTrucks.length})
              </Button>
              {selectedTruckIds.size > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                  onClick={clearTruckSelection}
                >
                  Clear Selection
                </Button>
              )}
            </div>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search trucks by plate number, driver, or vehicle model..."
              value={truckSearch}
              onChange={e => setTruckSearch(e.target.value)}
              className="h-10 pl-9 text-sm"
            />
          </div>

          {/* Trucks Grid / List */}
          <div className="max-h-[500px] overflow-y-auto pr-1 space-y-2">
            {filteredTrucks.length === 0 ? (
              <div className="p-12 text-center border-2 border-dashed border-border rounded-xl">
                <Truck className="size-9 mx-auto text-muted-foreground/40 mb-2" />
                <p className="text-sm font-normal text-muted-foreground">
                  {availableTrucks.length === 0
                    ? 'All registered trucks are currently loaded in transit.'
                    : 'No available trucks match your search query.'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Offload active trucks on the Delivery Operations screen to make them available again.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredTrucks.map((truck: any) => {
                  const truckId = truck._id || truck.id
                  const isSelected = selectedTruckIds.has(truckId)
                  const capacity = toNum(truck.capacity_litres || truck.capacity)
                  const driverName = truck.driver || truck.driver_name || 'Unassigned'

                  return (
                    <div
                      key={truckId}
                      onClick={() => toggleTruck(truckId)}
                      className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3 select-none ${isSelected
 ? 'border-accent bg-accent/10 dark:bg-accent/30 '
 : 'border-border hover:border-border/80 bg-card hover:bg-muted/50'
 }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => { }} // handled by parent onClick
                        className="size-4 mt-1 rounded border-border accent-primary cursor-pointer"
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-semibold text-sm text-foreground font-mono">
                            {truck.plateNumber}
                          </span>
                          <span
                            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${capacity > 0
 ? 'bg-accent/15 text-accent'
 : 'bg-muted text-muted-foreground'
 }`}
                          >
                            {capacity > 0 ? `${capacity.toLocaleString()} L` : 'N/A'}
                          </span>
                        </div>

                        <p className="text-xs text-muted-foreground truncate mt-1">
                          Driver: <strong className="text-foreground">{driverName}</strong>
                        </p>

                        {truck.model && (
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            Model: {truck.model}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Bottom Save Action */}
          <div className="pt-4 border-t border-border flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Selected: <strong className="text-foreground">{selectedTruckIds.size} trucks</strong> ({autoSumCapacity.toLocaleString()} Litres)
            </span>

            <Button
              className="bg-accent hover:bg-accent/80 text-accent-foreground gap-2 cursor-pointer px-6"
              onClick={handleSave}
              disabled={saving || selectedTruckIds.size === 0 || !loadPfi}
            >
              {saving ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
              {saving ? 'Processing...' : 'Confirm Allocation'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

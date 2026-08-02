import { useState, useEffect, useMemo } from 'react'
import { createFileRoute, useNavigate, useRouter } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '#/components/ui/select'
import { Loader2, ArrowLeft, Save, CheckCircle, AlertCircle, FileText, User, Package, Search, Warehouse, Flame, MapPin, X } from 'lucide-react'
import { useCreatePfi, useDepotsForFilter, useUpdatePfi } from '#/lib/hooks/usePfis'
import { useProductList } from '#/lib/hooks/useProducts'
import { useAdminList } from '#/lib/hooks/useAdmin'
import { useLpgStations } from '#/lib/hooks/useLpgStations'

export const Route = createFileRoute('/pfi/form')({
  component: PFIForm,
})

function formatDateToInput(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return ''
    return d.toISOString().substring(0, 10)
  } catch {
    return ''
  }
}

function PFIForm() {
  const navigate = useNavigate()
  const router = useRouter()
  const createPfi = useCreatePfi()
  const updatePfi = useUpdatePfi()

  const stateData = router.history.location.state as { pfi?: any; isEdit?: boolean } | undefined
  const isEdit = stateData?.isEdit || false
  const editingPfi = stateData?.pfi

  // Data for dropdowns
  const { data: statesData } = useDepotsForFilter()
  const { data: lpgStationsData } = useLpgStations({ limit: 100 })
  const { data: productsData } = useProductList()
  const { data: adminsData } = useAdminList()

  const locations = Array.isArray(statesData) ? statesData : ((statesData as any)?.depots || (statesData as any)?.results || [])
  const lpgStations = Array.isArray(lpgStationsData) ? lpgStationsData : []
  const products = Array.isArray(productsData) ? productsData : ((productsData as any)?.products || (productsData as any)?.results || [])
  const staff = Array.isArray(adminsData) ? adminsData : []

  // Build combined location list
  const combinedLocations = useMemo(() => {
    const depots = locations.map((d: any) => ({
      id: String(d.id || d._id),
      name: d.name || '',
      code: d.code || '',
      address: d.address || d.city || '',
      type: 'depot' as const,
    }))
    const stations = lpgStations.map((s: any) => ({
      id: String(s.id || s._id),
      name: s.name || '',
      code: s.code || '',
      address: s.address || s.city || '',
      type: 'lpg' as const,
    }))
    return [...depots, ...stations]
  }, [locations, lpgStations])

  const [form, setForm] = useState({
    id: '',
    pfiDate: '',
    pfiNumber: '',
    description: '',
    locationId: '',
    lpgStationId: '',
    productId: '',
    productUnit: '',
    startingQtyLitres: '',
    blQtyLitres: '',
    qtyVolumeMt: '',
    unitPrice: '',
    auditOfficerId: '',
    productOfficerId: '',
    itComplianceOfficerId: '',
    securityExitOfficerId: '',
    commissionOfficerId: '',
    salesManagerId: '',
    vesselBroker: '',
    vesselName: '',
    surveyorName: '',
    surveyorPhone: '',
  })

  useEffect(() => {
    if (isEdit && editingPfi) {
      setForm({
        id: editingPfi._id || editingPfi.id || '',
        pfiDate: formatDateToInput(editingPfi.pfiDate),
        pfiNumber: editingPfi.pfiNumber || '',
        description: editingPfi.description || '',
        locationId: editingPfi.locationId ? String(editingPfi.locationId) : '',
        lpgStationId: editingPfi.lpgStationId ? String(editingPfi.lpgStationId) : '',
        productId: String(editingPfi.productId || ''),
        productUnit: editingPfi.productUnit || '',
        startingQtyLitres: String(editingPfi.startingQtyLitres || ''),
        blQtyLitres: (editingPfi as any).blQtyLitres != null ? String((editingPfi as any).blQtyLitres) : '',
        qtyVolumeMt: String(editingPfi.qtyVolumeMt || ''),
        unitPrice: editingPfi.unitPrice !== undefined && editingPfi.unitPrice !== null ? String(editingPfi.unitPrice) : '',
        auditOfficerId: editingPfi.auditOfficerId ? String(editingPfi.auditOfficerId) : '',
        productOfficerId: editingPfi.productOfficerId ? String(editingPfi.productOfficerId) : '',
        itComplianceOfficerId: editingPfi.itComplianceOfficerId ? String(editingPfi.itComplianceOfficerId) : '',
        securityExitOfficerId: editingPfi.securityExitOfficerId ? String(editingPfi.securityExitOfficerId) : '',
        commissionOfficerId: editingPfi.commissionOfficerId ? String(editingPfi.commissionOfficerId) : '',
        salesManagerId: editingPfi.salesManagerId ? String(editingPfi.salesManagerId) : '',
        vesselBroker: editingPfi.vesselBroker || '',
        vesselName: editingPfi.vesselName || '',
        surveyorName: editingPfi.surveyorName || '',
        surveyorPhone: editingPfi.surveyorPhone || '',
      })
    }
  }, [isEdit, editingPfi])

  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [locationSearch, setLocationSearch] = useState('')
  const [isLocationOpen, setIsLocationOpen] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!form.pfiNumber || !form.productId || (!form.startingQtyLitres && !form.qtyVolumeMt)) {
      setError('Please fill in all required fields (PFI No, Product, and Quantity).')
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        pfiDate: form.pfiDate || null,
        pfiNumber: form.pfiNumber,
        description: form.description,
        locationId: form.locationId ? form.locationId : null,
        lpgStationId: form.lpgStationId ? form.lpgStationId : null,
        productId: form.productId,
        productUnit: form.productUnit || undefined,
        startingQtyLitres: Number(form.startingQtyLitres) || 0,
        // Blank means unknown, not zero — a false 0 would make every downstream
        // money figure compute against it instead of reading "—".
        blQtyLitres: form.blQtyLitres === '' ? null : Number(form.blQtyLitres),
        qtyVolumeMt: form.qtyVolumeMt ? Number(form.qtyVolumeMt) : null,
        unitPrice: form.unitPrice ? Number(form.unitPrice) : 0,
        auditOfficerId: form.auditOfficerId || null,
        productOfficerId: form.productOfficerId || null,
        itComplianceOfficerId: form.itComplianceOfficerId || null,
        securityExitOfficerId: form.securityExitOfficerId || null,
        commissionOfficerId: form.commissionOfficerId || null,
        salesManagerId: form.salesManagerId || null,
        vesselBroker: form.vesselBroker || null,
        vesselName: form.vesselName || null,
        surveyorName: form.surveyorName || null,
        surveyorPhone: form.surveyorPhone || null,
      }

      if (isEdit && form.id) {
        await updatePfi.mutateAsync({ id: form.id, data: payload })
      } else {
        await createPfi.mutateAsync(payload)
      }
      setSubmitted(true)
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to save PFI details')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-5 text-center">
        <div className="size-16 rounded-full bg-success/10 flex items-center justify-center text-success border border-success/20">
          <CheckCircle className="size-8" />
        </div>
        <h2 className="text-lg md:text-xl font-semibold text-foreground tracking-tight">PFI {isEdit ? 'Updated' : 'Registered'} Successfully!</h2>
        <p className="text-muted-foreground max-w-sm">Pro Forma Invoice {form.pfiNumber} has been saved successfully.</p>
        <div className="flex gap-3 mt-2">
          {!isEdit && (
            <Button variant="outline" onClick={() => {
              setSubmitted(false)
              setForm({
                id: '',
                pfiDate: '',
                pfiNumber: '',
                description: '',
                locationId: '',
                lpgStationId: '',
                productId: '',
                productUnit: '',
                startingQtyLitres: '',
                blQtyLitres: '',
                qtyVolumeMt: '',
                unitPrice: '',
                auditOfficerId: '',
                productOfficerId: '',
                itComplianceOfficerId: '',
                securityExitOfficerId: '',
                commissionOfficerId: '',
                salesManagerId: '',
                vesselBroker: '',
                vesselName: '',
                surveyorName: '',
                surveyorPhone: '',
              })
              setError('')
            }}>
              Add Another
            </Button>
          )}
          <Button onClick={() => navigate({ to: '/pfi' as any })}>Back to PFI List</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in ">
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" size="sm" onClick={() => navigate({ to: '/pfi' as any })} className="mb-2">
            <ArrowLeft className="size-4 mr-2" />Back to PFI List
          </Button>
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-balance">{isEdit ? 'Edit PFI' : 'Add New PFI'}</h1>
          <p className="text-muted-foreground">{isEdit ? 'Modify information, officers, and vessel credentials of this PFI' : 'Register a new Pro Forma Invoice'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        {error && (
          <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm font-medium flex items-center gap-2 max-w-3xl">
            <AlertCircle className="size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

          {/* Section 1: PFI Identity & Specs */}
          <div className="space-y-4 border rounded-lg p-5 bg-card">
            <div className="flex items-center space-x-2 border-b pb-2">
              <FileText className="size-5 text-primary" />
              <h2 className="text-lg font-semibold">Identity & Specs</h2>
            </div>
            <div className="space-y-3">
              <div>
                <Label>PFI Date</Label>
                <Input type="date" value={form.pfiDate} onChange={e => setForm({ ...form, pfiDate: e.target.value })} />
              </div>

              <div>
                <Label>PFI No *</Label>
                <Input placeholder="e.g. PFI-001" value={form.pfiNumber} onChange={e => setForm({ ...form, pfiNumber: e.target.value })} required />
              </div>

              <div>
                <Label>Description</Label>
                <Input placeholder="e.g. AGO bulk supply" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>

              <div>
                <Label>Location (Optional)</Label>
                {(() => {
                  const selectedId = form.lpgStationId || form.locationId
                  const selectedType = form.lpgStationId ? 'lpg' : form.locationId ? 'depot' : null
                  const selected = selectedId ? combinedLocations.find(l => l.id === selectedId && l.type === selectedType) : null

                  if (selected && !isLocationOpen) {
                    return (
                      <div className="mt-1 p-3 border rounded-lg bg-muted/30 flex items-center gap-3">
                        <div className={`size-9 rounded-lg flex items-center justify-center shrink-0 ${selected.type === 'lpg' ? 'bg-orange-100 text-orange-600' : 'bg-primary/10 text-primary'}`}>
                          {selected.type === 'lpg' ? <Flame className="size-4" /> : <Warehouse className="size-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-foreground truncate">{selected.name}</p>
                          <p className="text-xs text-muted-foreground">{selected.code} &bull; {selected.type === 'lpg' ? 'LPG Station' : 'Depot'}</p>
                        </div>
                        <Button type="button" variant="outline" size="sm" onClick={() => { setIsLocationOpen(true); setLocationSearch('') }}>Change</Button>
                      </div>
                    )
                  }

                  const filtered = locationSearch.trim()
                    ? combinedLocations.filter(l =>
                        l.name.toLowerCase().includes(locationSearch.toLowerCase()) ||
                        l.code.toLowerCase().includes(locationSearch.toLowerCase()) ||
                        l.address.toLowerCase().includes(locationSearch.toLowerCase())
                      )
                    : combinedLocations

                  return (
                    <div className="space-y-2 mt-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
                        <Input
                          placeholder="Search depots and LPG stations..."
                          className="pl-10 pr-9"
                          value={locationSearch}
                          onChange={(e) => { setLocationSearch(e.target.value); setIsLocationOpen(true) }}
                          autoFocus
                        />
                        {locationSearch && (
                          <button type="button" onClick={() => setLocationSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                            <X className="size-4" />
                          </button>
                        )}
                      </div>
                      <div className="border rounded-lg max-h-[200px] overflow-y-auto">
                        <div
                          className="p-2.5 hover:bg-muted cursor-pointer text-sm text-muted-foreground border-b"
                          onClick={() => { setForm({ ...form, locationId: '', lpgStationId: '' }); setIsLocationOpen(false); setLocationSearch('') }}
                        >
                          No Location Selected
                        </div>
                        {filtered.length === 0 ? (
                          <div className="p-4 text-center text-sm text-muted-foreground">No locations found</div>
                        ) : (
                          filtered.map((l) => {
                            const isSelected = (l.type === 'lpg' ? form.lpgStationId : form.locationId) === l.id
                            return (
                              <div
                                key={`${l.type}-${l.id}`}
                                className={`p-2.5 flex items-center gap-3 cursor-pointer hover:bg-muted transition-colors ${isSelected ? 'bg-primary/5' : ''}`}
                                onClick={() => {
                                  if (l.type === 'lpg') {
                                    setForm({ ...form, lpgStationId: l.id, locationId: '' })
                                  } else {
                                    setForm({ ...form, locationId: l.id, lpgStationId: '' })
                                  }
                                  setIsLocationOpen(false)
                                  setLocationSearch('')
                                }}
                              >
                                <div className={`size-8 rounded-lg flex items-center justify-center shrink-0 ${l.type === 'lpg' ? 'bg-orange-100 text-orange-600' : 'bg-primary/10 text-primary'}`}>
                                  {l.type === 'lpg' ? <Flame className="size-3.5" /> : <Warehouse className="size-3.5" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm text-foreground truncate">{l.name}</p>
                                  <p className="text-xs text-muted-foreground truncate">{l.code} {l.address ? `• ${l.address}` : ''}</p>
                                </div>
                                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${l.type === 'lpg' ? 'bg-orange-100 text-orange-600' : 'bg-primary/10 text-primary'}`}>
                                  {l.type === 'lpg' ? 'LPG' : 'Depot'}
                                </span>
                              </div>
                            )
                          })
                        )}
                      </div>
                    </div>
                  )
                })()}
              </div>

              <div>
                <Label>Product *</Label>
                <Select value={form.productId} onValueChange={v => {
                  const selected = products.find((p: any) => String(p.id || p._id) === String(v))
                  setForm(prev => ({
                    ...prev,
                    productId: v,
                    productUnit: selected?.unit || 'Litres'
                  }))
                }}>
                  <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                  <SelectContent>
                    {products.map((p: any) => (
                      <SelectItem key={p.id || p._id} value={String(p.id || p._id)}>
                        {p.name} {p.unit ? `(${p.unit})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {(() => {
                const selectedProd = products.find((p: any) => String(p.id || p._id) === String(form.productId))
                const unitName = selectedProd?.unit || form.productUnit || 'Litres'
                const uLower = unitName.toLowerCase()
                const isWeightProd = uLower.includes('mt') || uLower.includes('ton') || uLower.includes('kg') || uLower.includes('weight')

                const activeQty = isWeightProd
                  ? (Number(form.qtyVolumeMt) || Number(form.startingQtyLitres) || 0)
                  : (Number(form.startingQtyLitres) || Number(form.qtyVolumeMt) || 0)

                const unitPriceVal = Number(form.unitPrice) || 0
                const projectedCost = activeQty * unitPriceVal

                return (
                  <div className="space-y-4 pt-1">
                    {/* Primary Quantity Input matching product unit */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <Label className="font-semibold text-foreground">
                          Quantity ({unitName}) *
                        </Label>
                        <span className="text-[11px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                          Unit: {unitName}
                        </span>
                      </div>
                      <div className="relative">
                        <Input
                          type="number"
                          step={isWeightProd ? "0.001" : "1"}
                          min="0"
                          placeholder={isWeightProd ? "e.g. 820" : "e.g. 1000000"}
                          value={isWeightProd ? form.qtyVolumeMt : form.startingQtyLitres}
                          onChange={e => {
                            if (isWeightProd) {
                              setForm({ ...form, qtyVolumeMt: e.target.value })
                            } else {
                              setForm({ ...form, startingQtyLitres: e.target.value })
                            }
                          }}
                          required
                          className="pr-16 font-medium"
 />
                        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-xs font-semibold text-muted-foreground bg-muted px-2 py-1 rounded">
                          {unitName}
                        </div>
                      </div>
                    </div>

                    {/*
                      BL quantity — the documented figure from the shipping
                      papers, which is what you are billed for. The quantity
                      above is what measured into the tank, which is what you
                      can sell. Cargo value is computed from this one, so
                      leaving it blank is what makes a PFI read as unpriced.
                    */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-normal">
                        BL Quantity — from the shipping papers
                      </Label>
                      <div className="relative">
                        <Input
                          type="number"
                          step="1"
                          min="0"
                          placeholder="e.g. 1000000"
                          value={form.blQtyLitres}
                          onChange={e => setForm({ ...form, blQtyLitres: e.target.value })}
                          className="pr-16 font-medium"
                        />
                        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-xs font-semibold text-muted-foreground bg-muted px-2 py-1 rounded">
                          Litres
                        </div>
                      </div>
                      {(() => {
                        const bl = Number(form.blQtyLitres)
                        const tank = Number(form.startingQtyLitres)
                        if (!form.blQtyLitres || !bl || !tank) {
                          return (
                            <p className="text-[11px] text-muted-foreground">
                              What you pay for. Cargo value is computed from this, not the tank
                              quantity — leave it blank and every money figure will read “—”.
                            </p>
                          )
                        }
                        const gap = tank - bl
                        if (gap === 0) {
                          return <p className="text-[11px] text-muted-foreground">Tank matches the papers exactly.</p>
                        }
                        const price = Number(form.unitPrice) || 0
                        const worth = price > 0
                          ? ` — worth ₦${(Math.abs(gap) * price).toLocaleString('en-NG', { maximumFractionDigits: 0 })}`
                          : ''
                        return gap > 0 ? (
                          <p className="text-[11px] text-accent">
                            Surplus of {gap.toLocaleString()} L — more landed than the papers say.
                          </p>
                        ) : (
                          <p className="text-[11px] text-destructive">
                            Deficit of {Math.abs(gap).toLocaleString()} L{worth} — you are billed for
                            product that never arrived.
                          </p>
                        )
                      })()}
                    </div>

                    {/* Secondary Equivalent Input (Optional) */}
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground font-normal">
                        {isWeightProd ? 'Equivalent Volume in Litres (Optional)' : 'Equivalent Weight in MT / kg (Optional)'}
                      </Label>
                      <div className="relative">
                        <Input
                          type="number"
                          step={isWeightProd ? "1" : "0.001"}
                          min="0"
                          placeholder={isWeightProd ? "e.g. 1000000" : "e.g. 820"}
                          value={isWeightProd ? form.startingQtyLitres : form.qtyVolumeMt}
                          onChange={e => {
                            if (isWeightProd) {
                              setForm({ ...form, startingQtyLitres: e.target.value })
                            } else {
                              setForm({ ...form, qtyVolumeMt: e.target.value })
                            }
                          }}
                          className="pr-16 text-xs text-muted-foreground"
 />
                        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[11px] font-medium text-muted-foreground bg-muted/60 px-2 py-0.5 rounded">
                          {isWeightProd ? 'Litres' : 'MT / kg'}
                        </div>
                      </div>
                    </div>

                    {/* Unit Price Input */}
                    <div className="space-y-1.5 pt-1">
                      <Label className="font-semibold text-foreground">
                        Unit Price (₦ per {unitName})
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">₦</span>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="e.g. 950.00"
                          value={form.unitPrice}
                          onChange={e => setForm({ ...form, unitPrice: e.target.value })}
                          className="pl-8 font-medium"
 />
                      </div>
                    </div>

                    {/* Dynamic Cost Projection Summary */}
                    {activeQty > 0 && unitPriceVal > 0 && (
                      <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-xs flex justify-between items-center">
                        <span className="text-muted-foreground">
                          Projected Cumulative Cost ({activeQty.toLocaleString()} {unitName} × ₦{unitPriceVal.toLocaleString()}):
                        </span>
                        <span className="font-semibold text-primary text-sm">
                          ₦{projectedCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    )}
                  </div>
                )
              })()}
            </div>
          </div>

          {/* Section 2: Assigned Officers */}
          <div className="space-y-4 border rounded-lg p-5 bg-card">
            <div className="flex items-center space-x-2 border-b pb-2">
              <User className="size-5 text-primary" />
              <h2 className="text-lg font-semibold">Assigned Officers</h2>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Audit Officer', key: 'auditOfficerId' },
                { label: 'Product Officer', key: 'productOfficerId' },
                { label: 'IT Compliance', key: 'itComplianceOfficerId' },
                { label: 'Security Exit', key: 'securityExitOfficerId' },
                { label: 'Commission Officer', key: 'commissionOfficerId' },
                { label: 'Sales Manager', key: 'salesManagerId' },
              ].map((field) => (
                <div key={field.key}>
                  <Label>{field.label}</Label>
                  <Select value={(form as any)[field.key] || "none"} onValueChange={v => setForm({ ...form, [field.key]: v === 'none' ? '' : v })}>
                    <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Unassigned</SelectItem>
                      {staff.map((u: any) => (
                        <SelectItem key={u.id} value={String(u.id)}>{u.full_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Vessel & Surveyor */}
          <div className="space-y-4 border rounded-lg p-5 bg-card">
            <div className="flex items-center space-x-2 border-b pb-2">
              <Package className="size-5 text-primary" />
              <h2 className="text-lg font-semibold">Vessel & Surveyor</h2>
            </div>
            <div className="space-y-3">
              <div>
                <Label>Vessel Broker</Label>
                <Input placeholder="Broker name" value={form.vesselBroker} onChange={e => setForm({ ...form, vesselBroker: e.target.value })} />
              </div>
              <div>
                <Label>Vessel Name</Label>
                <Input placeholder="e.g. MV Lagos Star" value={form.vesselName} onChange={e => setForm({ ...form, vesselName: e.target.value })} />
              </div>
              <div>
                <Label>Surveyor Name</Label>
                <Input placeholder="Surveyor full name" value={form.surveyorName} onChange={e => setForm({ ...form, surveyorName: e.target.value })} />
              </div>
              <div>
                <Label>Surveyor Phone</Label>
                <Input type="tel" placeholder="e.g. 08012345678" value={form.surveyorPhone} onChange={e => setForm({ ...form, surveyorPhone: e.target.value })} />
              </div>
            </div>
          </div>

        </div>

        <div className="flex justify-end gap-3 border-t pt-4">
          <Button type="button" variant="outline" onClick={() => navigate({ to: '/pfi' as any })}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting} className="min-w-[150px]">
            {isSubmitting ? <><Loader2 className="size-4 animate-spin mr-2" />Saving...</> : <><Save className="size-4 mr-2" />{isEdit ? 'Update PFI' : 'Save PFI'}</>}
          </Button>
        </div>
      </form>
    </div>
  )
}

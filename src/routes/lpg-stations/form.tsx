import { useState, useEffect } from 'react'
import { createFileRoute, useNavigate, useLocation } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '#/components/ui/select'
import { ArrowLeft, Flame, MapPin, Activity, CheckCircle, Loader2, AlertCircle, Users, Search, X, UserCheck, Plus, Trash2, Layers } from 'lucide-react'
import type { LpgStationItem } from '#/lib/hooks/useLpgStations'
import { useCreateLpgStation, useUpdateLpgStation, useLpgStationDetails } from '#/lib/hooks/useLpgStations'
import { useAdminList } from '#/lib/hooks/useAdmin'
import { countries, nigeriaStates, nigeriaLgas } from '#/lib/nigeria-data'

export const Route = createFileRoute('/lpg-stations/form')({
  component: LpgStationForm,
})

const statusList = ['Active', 'Maintenance', 'High Capacity'] as const

function LpgStationForm() {
  const navigate = useNavigate()
  const location = useLocation()
  const createStation = useCreateLpgStation()
  const updateStation = useUpdateLpgStation()

  const stateData = location.state as { station?: LpgStationItem; isEdit?: boolean } | undefined
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
  const stationIdFromUrl = searchParams?.get('id') || searchParams?.get('stationId') || ''

  const stateStation = stateData?.station
  const stationId = stateStation?.id || (stateStation as any)?._id || stationIdFromUrl
  const isEdit = Boolean(stateData?.isEdit || stationId)

  const { data: fetchedStation, isLoading: isLoadingStation } = useLpgStationDetails(stationId)
  const editingStation = stateStation || fetchedStation

  const [formData, setFormData] = useState({
    id: '',
    name: '',
    code: '',
    address: '',
    city: '',
    state: '',
    country: 'Nigeria',
    postcode: '',
    lpgCapacityKg: '',
    pricePerKg: '',
    status: 'Active' as LpgStationItem['status'],
    establishedYear: new Date().getFullYear().toString(),
  })

  const { data: staffData } = useAdminList()
  const [staffSearchTerm, setStaffSearchTerm] = useState('')
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([])

  const [cylinderSizeInput, setCylinderSizeInput] = useState('')
  const [cylinderQtyInput, setCylinderQtyInput] = useState('')
  const [cylinders, setCylinders] = useState<Array<{ cylinderSizeKg: number; quantity: number }>>([])

  const matchCountry = (rawCountry?: string) => {
    if (!rawCountry) return 'Nigeria'
    const trimmed = rawCountry.trim()
    if (trimmed.toLowerCase() === 'ng' || trimmed.toLowerCase() === 'nga') return 'Nigeria'
    const matched = countries.find((c) => c.toLowerCase() === trimmed.toLowerCase())
    return matched || trimmed
  }

  const getLgasForState = (stateName: string) => {
    if (!stateName) return []
    const trimmed = stateName.trim()
    if (trimmed.toLowerCase().includes('fct') || trimmed.toLowerCase().includes('federal capital') || trimmed.toLowerCase().includes('abuja')) {
      return nigeriaLgas['Federal Capital Territory (FCT)'] || []
    }
    const cleaned = trimmed.replace(/\s+state$/i, '').trim()
    const matchedState = nigeriaStates.find(
      (s) => s.toLowerCase() === trimmed.toLowerCase() || s.toLowerCase() === cleaned.toLowerCase()
    )
    return nigeriaLgas[matchedState || stateName] || []
  }

  const matchNigeriaState = (rawState?: string) => {
    if (!rawState) return ''
    const trimmed = rawState.trim()
    const lower = trimmed.toLowerCase()
    if (lower.includes('fct') || lower.includes('federal capital') || lower.includes('abuja')) {
      return 'Federal Capital Territory (FCT)'
    }
    const cleaned = trimmed.replace(/\s+state$/i, '').trim()
    const matched = nigeriaStates.find(
      (s) => s.toLowerCase() === trimmed.toLowerCase() || s.toLowerCase() === cleaned.toLowerCase()
    )
    return matched || trimmed
  }

  const matchNigeriaLga = (stateName: string, rawCity?: string) => {
    if (!rawCity) return ''
    const lgas = getLgasForState(stateName)
    if (lgas.length === 0) return rawCity.trim()
    const trimmed = rawCity.trim()
    const cleaned = trimmed.replace(/\s+lga$/i, '').replace(/\s+local government$/i, '').trim()
    const matched = lgas.find(
      (lga) => lga.toLowerCase() === trimmed.toLowerCase() || lga.toLowerCase() === cleaned.toLowerCase()
    )
    return matched || trimmed
  }

  const matchStatus = (rawStatus?: string): LpgStationItem['status'] => {
    if (!rawStatus) return 'Active'
    const lower = rawStatus.trim().toLowerCase()
    if (lower === 'maintenance') return 'Maintenance'
    if (lower === 'high capacity' || lower === 'highcapacity') return 'High Capacity'
    return 'Active'
  }

  useEffect(() => {
    if (isEdit && editingStation) {
      const rawCountry = editingStation.country || 'Nigeria'
      const rawState = editingStation.state || ''
      const rawCity = editingStation.city || ''

      const initialCountry = matchCountry(rawCountry)
      const initialState = matchNigeriaState(rawState)
      const initialCity = matchNigeriaLga(initialState, rawCity)
      const initialStatus = matchStatus(editingStation.status)

      setFormData({
        id: String((editingStation as any).id || (editingStation as any)._id || ''),
        name: editingStation.name || '',
        code: editingStation.code || '',
        address: editingStation.address || '',
        city: initialCity,
        state: initialState,
        country: initialCountry,
        postcode: editingStation.postcode || '',
        lpgCapacityKg: String(editingStation.lpgCapacityKg || ''),
        pricePerKg: String(editingStation.pricePerKg || ''),
        status: initialStatus,
        establishedYear: String(editingStation.establishedYear || new Date().getFullYear()),
      })

      const rawStaff = (editingStation as any).staff || (editingStation as any).staffIds || []
      const staffIdsArr = rawStaff.map((s: any) => typeof s === 'string' ? s : String(s._id || s.adminId || s.id))
      setSelectedStaffIds(staffIdsArr)

      const rawCylinders = (editingStation as any).cylinders || []
      setCylinders(rawCylinders.map((c: any) => ({
        cylinderSizeKg: Number(c.cylinderSizeKg) || 0,
        quantity: Number(c.quantity) || 0,
      })))
    }
  }, [isEdit, editingStation])

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.name.trim()) newErrors.name = 'Station name is required'
    if (!formData.code.trim()) newErrors.code = 'Station code is required'
    if (!formData.address.trim()) newErrors.address = 'Physical address is required'
    if (!formData.city.trim()) newErrors.city = 'City/LGA is required'
    if (!formData.state.trim()) newErrors.state = 'State is required'
    if (!formData.country.trim()) newErrors.country = 'Country is required'
    if (!formData.postcode.trim()) newErrors.postcode = 'Postcode is required'
    if (!formData.lpgCapacityKg.trim() || isNaN(Number(formData.lpgCapacityKg)) || Number(formData.lpgCapacityKg) < 1) newErrors.lpgCapacityKg = 'LPG capacity must be at least 1 Kg'
    if (!formData.establishedYear.trim() || isNaN(Number(formData.establishedYear))) newErrors.establishedYear = 'Established year must be a valid year'
    return newErrors
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => { const next = { ...prev }; delete next[field]; return next })
  }

  const handleCountryChange = (value: string) => {
    setFormData((prev) => ({ ...prev, country: value, state: '', city: '' }))
    setErrors((prev) => {
      const next = { ...prev }
      delete next.country
      delete next.state
      delete next.city
      return next
    })
  }

  const handleStateChange = (value: string) => {
    setFormData((prev) => ({ ...prev, state: value, city: '' }))
    setErrors((prev) => {
      const next = { ...prev }
      delete next.state
      delete next.city
      return next
    })
  }

  const handleLgaChange = (value: string) => {
    setFormData((prev) => ({ ...prev, city: value }))
    if (errors.city) setErrors((prev) => { const next = { ...prev }; delete next.city; return next })
  }

  const filteredStaff = (staffData || []).filter((staff: any) => {
    const searchLower = staffSearchTerm.toLowerCase()
    return (
      staff?.full_name?.toLowerCase().includes(searchLower) ||
      staff?.email?.toLowerCase().includes(searchLower)
    )
  })

  const toggleStaff = (staffId: string) => {
    const sId = String(staffId)
    setSelectedStaffIds((prev) =>
      prev.includes(sId) ? prev.filter((id) => id !== sId) : [...prev, sId]
    )
  }

  const removeStaff = (staffId: string) => {
    const sId = String(staffId)
    setSelectedStaffIds((prev) => prev.filter((id) => id !== sId))
  }

  const getStaffDetails = (staffId: string) =>
    (staffData || []).find((staff: any) => String(staff.id) === String(staffId))

  const handleAddCylinder = () => {
    const sizeNum = Number(cylinderSizeInput)
    const qtyNum = Number(cylinderQtyInput)
    if (isNaN(sizeNum) || sizeNum < 1) return
    if (isNaN(qtyNum) || qtyNum < 1) return
    if (cylinders.some((c) => c.cylinderSizeKg === sizeNum)) return
    setCylinders((prev) => [...prev, { cylinderSizeKg: sizeNum, quantity: qtyNum }])
    setCylinderSizeInput('')
    setCylinderQtyInput('')
  }

  const handleRemoveCylinder = (sizeKg: number) => {
    setCylinders((prev) => prev.filter((c) => c.cylinderSizeKg !== sizeKg))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors = validate()
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return }
    setIsSubmitting(true)
    try {
      const data = {
        name: formData.name,
        code: formData.code,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        country: formData.country,
        postcode: formData.postcode,
        lpgCapacityKg: Number(formData.lpgCapacityKg),
        pricePerKg: formData.pricePerKg ? Number(formData.pricePerKg) : 0,
        status: formData.status,
        establishedYear: formData.establishedYear,
        staffIds: selectedStaffIds,
        cylinders: cylinders.map((c) => ({ cylinderSizeKg: c.cylinderSizeKg, quantity: c.quantity })),
      }
      const targetStationId = (editingStation as any)?.id || (editingStation as any)?._id
      if (isEdit && targetStationId) { await updateStation.mutateAsync({ id: targetStationId, data: data as any }) }
      else { await createStation.mutateAsync(data as any) }
      setSubmitted(true)
    } catch (err: any) { setErrors({ form: err.response?.data?.message || 'Failed to save LPG station' }) }
    finally { setIsSubmitting(false) }
  }

  if (isEdit && isLoadingStation && !stateStation) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-5 text-center">
        <div className="size-16 rounded-full bg-success/10 flex items-center justify-center text-success border border-success/20"><CheckCircle className="size-8" /></div>
        <h2 className="text-lg md:text-xl font-semibold text-foreground tracking-tight">LPG Station {isEdit ? 'Updated' : 'Created'} Successfully!</h2>
        <p className="text-muted-foreground max-w-sm">{formData.name} has been saved to the LPG station directory.</p>
        <div className="flex gap-3 mt-2">
          {!isEdit && <Button variant="outline" onClick={() => { setSubmitted(false); setFormData({ id: '', name: '', code: '', address: '', city: '', state: '', country: '', postcode: '', lpgCapacityKg: '', pricePerKg: '', status: 'Active', establishedYear: new Date().getFullYear().toString() }); setSelectedStaffIds([]); setCylinders([]); setErrors({}) }}>Add Another</Button>}
          <Button onClick={() => navigate({ to: '/lpg-stations/' as any })}>Back to LPG Stations</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <Button variant="ghost" size="sm" onClick={() => navigate({ to: '/lpg-stations/' as any })} className="mb-2"><ArrowLeft className="size-4 mr-2" />Back to LPG Stations</Button>
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-balance">{isEdit ? 'Edit LPG Station' : 'Register New LPG Station'}</h1>
          <p className="text-muted-foreground">{isEdit ? 'Modify details of this LPG station' : 'Fill in the details to add a new LPG station'}</p>
          {errors.form && <p className="text-sm text-destructive mt-1 flex items-center gap-1.5"><AlertCircle className="size-3.5" />{errors.form}</p>}
        </div>
      </header>

      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4 border rounded-lg p-4">
            <div className="flex items-center space-x-2"><Flame className="size-5 text-primary" /><h2 className="text-lg font-medium">Station Identity</h2></div>
            <div className="space-y-3">
              <div><Label>Station Name*</Label><Input value={formData.name} onChange={(e) => handleInputChange('name', e.target.value)} placeholder="e.g. Lagos LPG Station" className={errors.name ? 'border-destructive' : ''} />{errors.name && <p className="text-sm text-destructive mt-1">{errors.name}</p>}</div>
              <div><Label>Station Code*</Label><Input value={formData.code} onChange={(e) => handleInputChange('code', e.target.value)} placeholder="e.g. LPG-LOS-01" className={errors.code ? 'border-destructive' : ''} />{errors.code && <p className="text-sm text-destructive mt-1">{errors.code}</p>}</div>
              <div><Label>Established Year*</Label><Input value={formData.establishedYear} onChange={(e) => handleInputChange('establishedYear', e.target.value)} placeholder="e.g. 2022" className={errors.establishedYear ? 'border-destructive' : ''} />{errors.establishedYear && <p className="text-sm text-destructive mt-1">{errors.establishedYear}</p>}</div>
            </div>
          </div>

          <div className="space-y-4 border rounded-lg p-4">
            <div className="flex items-center space-x-2"><MapPin className="size-5 text-primary" /><h2 className="text-lg font-medium">Location Details</h2></div>
            <div className="space-y-3">
              <div>
                <Label>Physical Address*</Label>
                <Input value={formData.address} onChange={(e) => handleInputChange('address', e.target.value)} placeholder="e.g. Ikeja Industrial Zone" className={errors.address ? 'border-destructive' : ''} />
                {errors.address && <p className="text-sm text-destructive mt-1">{errors.address}</p>}
              </div>

              <div>
                <Label>Country*</Label>
                <Select
                  key={`country-${formData.country}`}
                  value={formData.country}
                  onValueChange={handleCountryChange}
                >
                  <SelectTrigger className={errors.country ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Select Country" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from(new Set([...countries, formData.country].filter(Boolean))).map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.country && <p className="text-sm text-destructive mt-1">{errors.country}</p>}
              </div>

              {matchCountry(formData.country) === 'Nigeria' ? (
                <>
                  <div>
                    <Label>State*</Label>
                    <Select
                      key={`state-${formData.state}`}
                      value={formData.state}
                      onValueChange={handleStateChange}
                    >
                      <SelectTrigger className={errors.state ? 'border-destructive' : ''}>
                        <SelectValue placeholder="Select State" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from(new Set([...nigeriaStates, formData.state].filter(Boolean))).map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.state && <p className="text-sm text-destructive mt-1">{errors.state}</p>}
                  </div>

                  <div>
                    <Label>LGA*</Label>
                    <Select
                      key={`city-${formData.state}-${formData.city}`}
                      value={formData.city}
                      onValueChange={handleLgaChange}
                      disabled={!formData.state}
                    >
                      <SelectTrigger className={errors.city ? 'border-destructive' : ''}>
                        <SelectValue placeholder={formData.state ? "Select LGA" : "Select a state first"} />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from(new Set([...getLgasForState(formData.state), formData.city].filter(Boolean))).map((lga) => (
                          <SelectItem key={lga} value={lga}>{lga}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.city && <p className="text-sm text-destructive mt-1">{errors.city}</p>}
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <Label>State*</Label>
                    <Input value={formData.state} onChange={(e) => handleInputChange('state', e.target.value)} placeholder="e.g. California" className={errors.state ? 'border-destructive' : ''} />
                    {errors.state && <p className="text-sm text-destructive mt-1">{errors.state}</p>}
                  </div>

                  <div>
                    <Label>City / LGA*</Label>
                    <Input value={formData.city} onChange={(e) => handleInputChange('city', e.target.value)} placeholder="e.g. San Francisco" className={errors.city ? 'border-destructive' : ''} />
                    {errors.city && <p className="text-sm text-destructive mt-1">{errors.city}</p>}
                  </div>
                </>
              )}

              <div>
                <Label>Postcode*</Label>
                <Input value={formData.postcode} onChange={(e) => handleInputChange('postcode', e.target.value)} placeholder="e.g. 101221" className={errors.postcode ? 'border-destructive' : ''} />
                {errors.postcode && <p className="text-sm text-destructive mt-1">{errors.postcode}</p>}
              </div>
            </div>
          </div>

          <div className="space-y-4 border rounded-lg p-4">
            <div className="flex items-center space-x-2"><Activity className="size-5 text-primary" /><h2 className="text-lg font-medium">Station Status</h2></div>
            <div className="space-y-3">
              <div>
                <Label>Status</Label>
                <Select
                  key={`status-${formData.status}`}
                  value={formData.status}
                  onValueChange={(v) => handleInputChange('status', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from(new Set([...statusList, formData.status].filter(Boolean))).map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>LPG Capacity (Kg)*</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.lpgCapacityKg}
                  onChange={(e) => handleInputChange('lpgCapacityKg', e.target.value)}
                  placeholder="e.g. 5000"
                  className={errors.lpgCapacityKg ? 'border-destructive' : ''}
                />
                {errors.lpgCapacityKg && <p className="text-sm text-destructive mt-1">{errors.lpgCapacityKg}</p>}
              </div>
              <div>
                <Label>Price Per Kg (₦)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.pricePerKg}
                  onChange={(e) => handleInputChange('pricePerKg', e.target.value)}
                  placeholder="e.g. 800"
                />
                <p className="text-xs text-muted-foreground mt-1">Default price per Kg of LPG gas at this station</p>
              </div>
            </div>
          </div>

          <div className="space-y-4 border rounded-lg p-4">
            <div className="flex items-center space-x-2"><Users className="size-5 text-primary" /><h2 className="text-lg font-medium">Assign Staff</h2></div>
            <div className="space-y-3">
              {selectedStaffIds.length > 0 && (
                <div className="space-y-2">
                  <Label>Selected Staff</Label>
                  <div className="flex flex-wrap gap-2">
                    {selectedStaffIds.map((staffId) => {
                      const staff = getStaffDetails(staffId)
                      return (
                        <div key={staffId} className="flex items-center gap-2 bg-secondary px-3 py-1 rounded-full text-sm">
                          <div className="size-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-semibold text-primary">
                            {staff ? (staff.full_name?.charAt(0) || '?') : '?'}
                          </div>
                          <span>{staff?.full_name || 'Unknown'}</span>
                          <button type="button" onClick={() => removeStaff(staffId)} className="text-muted-foreground hover:text-foreground">
                            <X className="size-4" />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              <div>
                <Label>Search Staff</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
                  <Input placeholder="Search by name or email..." className="pl-10" value={staffSearchTerm} onChange={(e) => setStaffSearchTerm(e.target.value)} />
                </div>
              </div>

              {staffSearchTerm && (
                <div className="border rounded-lg max-h-60 overflow-y-auto">
                  {filteredStaff.length > 0 ? (
                    filteredStaff.map((staff: any) => {
                      const sId = String(staff.id)
                      const isSelected = selectedStaffIds.includes(sId)
                      return (
                        <div
                          key={sId}
                          className={`flex items-center p-3 hover:bg-secondary cursor-pointer ${isSelected ? 'bg-secondary' : ''}`}
                          onClick={() => toggleStaff(sId)}
                        >
                          <div className="size-9 rounded-full bg-primary/20 flex items-center justify-center text-sm font-semibold text-primary">
                            {staff.full_name?.charAt(0) || '?'}
                          </div>
                          <div className="ml-4 space-y-1">
                            <p className="text-sm font-medium leading-none">{staff.full_name}</p>
                            <p className="text-sm text-muted-foreground">{staff.email}</p>
                          </div>
                          {isSelected && (
                            <div className="ml-auto">
                              <UserCheck className="size-4 text-primary" />
                            </div>
                          )}
                        </div>
                      )
                    })
                  ) : (
                    <div className="p-4 text-center text-sm text-muted-foreground">No staff found</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="border rounded-lg p-6 bg-card space-y-6">
          <div className="flex items-center space-x-2 border-b pb-3">
            <Layers className="size-5 text-primary" />
            <div>
              <h2 className="text-lg font-medium">Cylinder Inventory</h2>
              <p className="text-xs text-muted-foreground">Define the cylinder sizes available at this station and their quantities</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-end gap-4 bg-muted/40 p-4 rounded-lg border">
            <div className="flex-1 space-y-2">
              <Label>Cylinder Size (Kg)</Label>
              <Input
                type="number"
                min="1"
                placeholder="e.g. 12"
                value={cylinderSizeInput}
                onChange={(e) => setCylinderSizeInput(e.target.value)}
                className="bg-background"
              />
            </div>

            <div className="w-full sm:w-[200px] space-y-2">
              <Label>Quantity</Label>
              <Input
                type="number"
                min="1"
                placeholder="e.g. 50"
                value={cylinderQtyInput}
                onChange={(e) => setCylinderQtyInput(e.target.value)}
                className="bg-background"
              />
            </div>

            <Button
              type="button"
              onClick={handleAddCylinder}
              className="w-full sm:w-auto"
            >
              <Plus className="size-4 mr-2" /> Add Cylinder
            </Button>
          </div>

          <div className="space-y-2">
            {cylinders.length === 0 ? (
              <div className="text-center py-6 text-sm text-muted-foreground border border-dashed rounded-lg">
                No cylinders configured yet. Add cylinder sizes and quantities above.
              </div>
            ) : (
              <div className="border rounded-md divide-y overflow-hidden">
                {cylinders.map((c) => (
                  <div key={c.cylinderSizeKg} className="flex items-center justify-between p-3 bg-background hover:bg-muted/10 transition-colors duration-250 ease-luxe">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{c.cylinderSizeKg} Kg Cylinder</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-mono font-semibold bg-secondary px-2.5 py-1 rounded">
                        {c.quantity.toLocaleString()} units
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive size-8"
                        onClick={() => handleRemoveCylinder(c.cylinderSizeKg)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate({ to: '/lpg-stations/' as any })}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting} className="min-w-[160px]">
            {isSubmitting ? (<><Loader2 className="size-4 animate-spin mr-2" />Saving...</>) : isEdit ? 'Update Station' : 'Register Station'}
          </Button>
        </div>
      </form>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { createFileRoute, useNavigate, useLocation } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '#/components/ui/select'
import { ArrowLeft, Warehouse, MapPin, Activity, CheckCircle, Loader2, AlertCircle, Trash2, Plus, Layers, Users, Search, X, UserCheck } from 'lucide-react'
import type { DepotItem } from './index'
import { useCreateDepot, useUpdateDepot, useDepotDetails } from '#/lib/hooks/useDepots'
import { useProductList } from '#/lib/hooks/useProducts'
import { useAdminList } from '#/lib/hooks/useAdmin'
import { useToast } from '#/lib/hooks/useToast'
import { countries, nigeriaStates, nigeriaLgas } from '#/lib/nigeria-data'

export const Route = createFileRoute('/depots/form')({
  component: DepotForm,
})

const statusList = ['Active', 'Maintenance', 'High Capacity'] as const

function DepotForm() {
  const navigate = useNavigate()
  const location = useLocation()
  const createDepot = useCreateDepot()
  const updateDepot = useUpdateDepot()
  const toast = useToast()

  const stateData = location.state as { depot?: DepotItem; isEdit?: boolean } | undefined
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
  const depotIdFromUrl = searchParams?.get('id') || searchParams?.get('depotId') || ''

  const stateDepot = stateData?.depot
  const depotId = stateDepot?.id || (stateDepot as any)?._id || depotIdFromUrl
  const isEdit = Boolean(stateData?.isEdit || depotId)

  const { data: fetchedDepot, isLoading: isLoadingDepot } = useDepotDetails(depotId)
  const editingDepot = stateDepot || fetchedDepot

  const [formData, setFormData] = useState({ id: '', name: '', code: '', address: '', city: '', state: '', country: 'Nigeria', postcode: '', status: 'Active' as DepotItem['status'], establishedYear: new Date().getFullYear().toString() })

  const { data: productsData } = useProductList({ limit: 1000 } as any)
  const products = productsData?.products || []

  const { data: staffData } = useAdminList()
  const [staffSearchTerm, setStaffSearchTerm] = useState('')
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([])

  const [selectedProductId, setSelectedProductId] = useState('')
  const [productCapacityVal, setProductCapacityVal] = useState('')
  const [productCapacities, setProductCapacities] = useState<Array<{ product: { _id: string; id?: string; name: string; sku: string; category: string }; capacity: number }>>([])

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

  const matchStatus = (rawStatus?: string): DepotItem['status'] => {
    if (!rawStatus) return 'Active'
    const lower = rawStatus.trim().toLowerCase()
    if (lower === 'maintenance') return 'Maintenance'
    if (lower === 'high capacity' || lower === 'highcapacity') return 'High Capacity'
    return 'Active'
  }

  useEffect(() => {
    if (isEdit && editingDepot) {
      const rawCountry = editingDepot.country || 'Nigeria'
      const rawState = editingDepot.state || (editingDepot as any).locationState || (editingDepot as any).region || ''
      const rawCity = editingDepot.city || (editingDepot as any).lga || (editingDepot as any).town || ''

      const initialCountry = matchCountry(rawCountry)
      const initialState = matchNigeriaState(rawState)
      const initialCity = matchNigeriaLga(initialState, rawCity)
      const initialStatus = matchStatus(editingDepot.status)

      setFormData({
        id: String((editingDepot as any).id || (editingDepot as any)._id || ''),
        name: editingDepot.name || '',
        code: editingDepot.code || '',
        address: editingDepot.address || '',
        city: initialCity,
        state: initialState,
        country: initialCountry,
        postcode: editingDepot.postcode || '',
        status: initialStatus,
        establishedYear: String(editingDepot.establishedYear || new Date().getFullYear()),
      })

      const normalizedCapacities = (editingDepot.productCapacities || []).map((pc: any) => {
        if (pc.product && typeof pc.product === 'object') {
          return {
            product: {
              _id: String(pc.product._id || pc.product.id || pc.productId),
              id: String(pc.product.id || pc.product._id || pc.productId),
              name: pc.product.name || pc.productName || 'Unknown Product',
              sku: pc.product.sku || pc.productSku || '',
              category: pc.product.category || pc.productCategory || '',
            },
            capacity: Number(pc.capacity) || 0,
          }
        }
        return {
          product: {
            _id: String(pc.productId),
            id: String(pc.productId),
            name: pc.productName || 'Unknown Product',
            sku: pc.productSku || '',
            category: pc.productCategory || '',
          },
          capacity: Number(pc.capacity) || 0,
        }
      })
      setProductCapacities(normalizedCapacities)

      const rawStaff = (editingDepot as any).staff || (editingDepot as any).staffIds || []
      const staffIdsArr = rawStaff.map((s: any) => typeof s === 'string' ? s : String(s._id || s.adminId || s.id))
      setSelectedStaffIds(staffIdsArr)
    }
  }, [isEdit, editingDepot])

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.name.trim()) newErrors.name = 'Depot name is required'
    if (!formData.code.trim()) newErrors.code = 'Depot code is required'
    if (!formData.address.trim()) newErrors.address = 'Physical address is required'
    if (!formData.city.trim()) newErrors.city = 'City/LGA is required'
    if (!formData.state.trim()) newErrors.state = 'State is required'
    if (!formData.country.trim()) newErrors.country = 'Country is required'
    if (!formData.postcode.trim()) newErrors.postcode = 'Postcode is required'
    if (!formData.establishedYear.trim() || isNaN(Number(formData.establishedYear))) newErrors.establishedYear = 'Established year must be a valid year'
    if (productCapacities.length === 0) newErrors.productCapacities = 'At least one product holding capacity must be added before saving a depot'
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

  const handleAddProductCapacity = () => {
    if (!selectedProductId) return
    const capNum = Number(productCapacityVal)
    if (isNaN(capNum) || capNum <= 0) {
      toast.error('Please enter a valid capacity greater than 0')
      return
    }
    const targetProdId = String(selectedProductId)
    if (productCapacities.some((pc) => String(pc.product.id || pc.product._id) === targetProdId)) {
      toast.error('This product capacity is already added.')
      return
    }
    const prod = products.find((p: any) => String(p.id || p._id) === targetProdId)
    if (!prod) return
    const pId = String(prod.id || prod._id)
    setProductCapacities((prev) => [
      ...prev,
      {
        product: {
          _id: pId,
          id: pId,
          name: prod.name,
          sku: prod.sku,
          category: prod.category,
        },
        capacity: capNum,
      },
    ])
    setSelectedProductId('')
    setProductCapacityVal('')
    if (errors.productCapacities) setErrors((prev) => { const next = { ...prev }; delete next.productCapacities; return next })
  }

  const handleRemoveProductCapacity = (prodId: string) => {
    const pId = String(prodId)
    setProductCapacities((prev) => prev.filter((pc) => String(pc.product.id || pc.product._id) !== pId))
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors = validate()
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return }
    setIsSubmitting(true)
    try {
      const computedMaxCapacity = productCapacities.reduce((sum, pc) => sum + (Number(pc.capacity) || 0), 0)
      const data = {
        name: formData.name,
        code: formData.code,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        country: formData.country,
        postcode: formData.postcode,
        maxCapacity: computedMaxCapacity,
        status: formData.status,
        establishedYear: formData.establishedYear,
        productCapacities: productCapacities.map((pc) => ({
          product: pc.product.id || pc.product._id,
          capacity: pc.capacity,
        })),
        staffIds: selectedStaffIds,
      }
      const targetDepotId = (editingDepot as any)?.id || (editingDepot as any)?._id
      if (isEdit && targetDepotId) { await updateDepot.mutateAsync({ id: targetDepotId, data: data as any }) }
      else { await createDepot.mutateAsync(data as any) }
      setSubmitted(true)
    } catch (err: any) { setErrors({ form: err.response?.data?.message || 'Failed to save depot' }) }
    finally { setIsSubmitting(false) }
  }

  if (isEdit && isLoadingDepot && !stateDepot) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={32} className="animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-5 text-center">
        <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center text-success border border-success/20"><CheckCircle size={32} /></div>
        <h2 className="text-2xl font-bold text-foreground">Depot {isEdit ? 'Updated' : 'Registered'} Successfully!</h2>
        <p className="text-muted-foreground max-w-sm">{formData.name} has been successfully saved to the hub management directory.</p>
        <div className="flex gap-3 mt-2">
          {!isEdit && <Button variant="outline" onClick={() => { setSubmitted(false); setFormData({ id: '', name: '', code: '', address: '', city: '', state: '', country: '', postcode: '', status: 'Active', establishedYear: new Date().getFullYear().toString() }); setProductCapacities([]); setSelectedStaffIds([]); setErrors({}) }}>Add Another</Button>}
          <Button onClick={() => navigate({ to: '/depots/' as any })}>Back to Depots</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <Button variant="ghost" size="sm" onClick={() => navigate({ to: '/depots/' as any })} className="mb-2"><ArrowLeft className="h-4 w-4 mr-2" />Back to Depots</Button>
          <h1 className="text-3xl font-bold tracking-tight">{isEdit ? 'Edit Depot' : 'Register New Depot'}</h1>
          <p className="text-muted-foreground">{isEdit ? 'Modify details of this operational logistics hub' : 'Fill in the details to add a new hub to the logistics network'}</p>
          {errors.form && <p className="text-sm text-destructive mt-1 flex items-center gap-1.5"><AlertCircle size={14} />{errors.form}</p>}
        </div>
      </header>

      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4 border rounded-lg p-4">
            <div className="flex items-center space-x-2"><Warehouse className="h-5 w-5 text-primary" /><h2 className="text-lg font-medium">Depot Identity</h2></div>
            <div className="space-y-3">
              <div><Label>Depot / Hub Name*</Label><Input value={formData.name} onChange={(e) => handleInputChange('name', e.target.value)} placeholder="e.g. Lagos Port Depot" className={errors.name ? 'border-destructive' : ''} />{errors.name && <p className="text-sm text-destructive mt-1">{errors.name}</p>}</div>
              <div><Label>Depot Code*</Label><Input value={formData.code} onChange={(e) => handleInputChange('code', e.target.value)} placeholder="e.g. DP-LOS-01" className={errors.code ? 'border-destructive' : ''} />{errors.code && <p className="text-sm text-destructive mt-1">{errors.code}</p>}</div>
              <div><Label>Established Year*</Label><Input value={formData.establishedYear} onChange={(e) => handleInputChange('establishedYear', e.target.value)} placeholder="e.g. 2022" className={errors.establishedYear ? 'border-destructive' : ''} />{errors.establishedYear && <p className="text-sm text-destructive mt-1">{errors.establishedYear}</p>}</div>
            </div>
          </div>

          <div className="space-y-4 border rounded-lg p-4">
            <div className="flex items-center space-x-2"><MapPin className="h-5 w-5 text-primary" /><h2 className="text-lg font-medium">Location Details</h2></div>
            <div className="space-y-3">
              <div>
                <Label>Physical Address*</Label>
                <Input value={formData.address} onChange={(e) => handleInputChange('address', e.target.value)} placeholder="e.g. Apapa Wharf Rd" className={errors.address ? 'border-destructive' : ''} />
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
            <div className="flex items-center space-x-2"><Activity className="h-5 w-5 text-primary" /><h2 className="text-lg font-medium">Hub Status</h2></div>
            <div className="space-y-3">
              <div>
                <Label>Hub Status</Label>
                <Select
                  key={`status-${formData.status}`}
                  value={formData.status}
                  onValueChange={(v) => handleInputChange('status', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select hub status" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from(new Set([...statusList, formData.status].filter(Boolean))).map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="space-y-4 border rounded-lg p-4">
            <div className="flex items-center space-x-2"><Users className="h-5 w-5 text-primary" /><h2 className="text-lg font-medium">Assign Staff</h2></div>
            <div className="space-y-3">
              {selectedStaffIds.length > 0 && (
                <div className="space-y-2">
                  <Label>Selected Staff</Label>
                  <div className="flex flex-wrap gap-2">
                    {selectedStaffIds.map((staffId) => {
                      const staff = getStaffDetails(staffId)
                      return (
                        <div key={staffId} className="flex items-center gap-2 bg-secondary px-3 py-1 rounded-full text-sm">
                          <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                            {staff ? (staff.full_name?.charAt(0) || '?') : '?'}
                          </div>
                          <span>{staff?.full_name || 'Unknown'}</span>
                          <button type="button" onClick={() => removeStaff(staffId)} className="text-muted-foreground hover:text-foreground">
                            <X className="h-4 w-4" />
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
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
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
                          <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                            {staff.full_name?.charAt(0) || '?'}
                          </div>
                          <div className="ml-4 space-y-1">
                            <p className="text-sm font-medium leading-none">{staff.full_name}</p>
                            <p className="text-sm text-muted-foreground">{staff.email}</p>
                          </div>
                          {isSelected && (
                            <div className="ml-auto">
                              <UserCheck className="h-4 w-4 text-primary" />
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
            <Layers className="h-5 w-5 text-primary" />
            <div>
              <h2 className="text-lg font-medium">Product Holding Capacities*</h2>
              <p className="text-xs text-muted-foreground">Map products directly from the database to their storage capacities at this depot (at least 1 required)</p>
              {errors.productCapacities && <p className="text-sm text-destructive flex items-center gap-1.5 mt-1.5"><AlertCircle size={14} />{errors.productCapacities}</p>}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-end gap-4 bg-muted/40 p-4 rounded-lg border">
            <div className="flex-1 space-y-2">
              <Label>Select Product</Label>
              <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                <SelectTrigger className="w-full bg-background">
                  <SelectValue placeholder="Choose product from database..." />
                </SelectTrigger>
                <SelectContent>
                  {products.length === 0 ? (
                    <SelectItem value="none" disabled>No products available</SelectItem>
                  ) : (
                    products.map((p: any) => {
                      const pId = String(p.id || p._id)
                      return (
                        <SelectItem key={pId} value={pId}>
                          {p.name} ({p.sku}) - {p.category}
                        </SelectItem>
                      )
                    })
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="w-full sm:w-[200px] space-y-2">
              <Label>Capacity (Liters / Units)</Label>
              <Input
                type="number"
                min="1"
                placeholder="e.g. 50000"
                value={productCapacityVal}
                onChange={(e) => setProductCapacityVal(e.target.value)}
                className="bg-background"
              />
            </div>

            <Button
              type="button"
              onClick={handleAddProductCapacity}
              className="gradient-primary text-white border-0 w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" /> Add Capacity
            </Button>
          </div>

          <div className="space-y-2">
            {productCapacities.length === 0 ? (
              <div className="text-center py-6 text-sm text-muted-foreground border border-dashed rounded-lg">
                No product capacities configured yet. Select a product above to define depot holding capacity.
              </div>
            ) : (
              <div className="border rounded-md divide-y overflow-hidden">
                {productCapacities.map((pc) => {
                  const pId = String(pc.product.id || pc.product._id)
                  return (
                    <div key={pId} className="flex items-center justify-between p-3 bg-background hover:bg-muted/10 transition-colors">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{pc.product.name} ({pc.product.sku})</p>
                        <p className="text-xs text-muted-foreground">{pc.product.category}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-mono font-bold bg-secondary px-2.5 py-1 rounded">
                          {pc.capacity.toLocaleString()} Max Units
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive h-8 w-8"
                          onClick={() => handleRemoveProductCapacity(pId)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate({ to: '/depots/' as any })}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting} className="gradient-primary text-white border-0 min-w-[160px]">
            {isSubmitting ? (<><Loader2 size={16} className="animate-spin mr-2" />Saving...</>) : isEdit ? 'Update Depot' : 'Register Depot'}
          </Button>
        </div>
      </form>
    </div>
  )
}

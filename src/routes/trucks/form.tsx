import { useState, useEffect, useRef } from 'react'
import { createFileRoute, useNavigate, useRouter } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '#/components/ui/select'
import { ArrowLeft, Truck, ShieldAlert, CheckCircle, Loader2, AlertCircle, Compass, Search, Check, ChevronDown } from 'lucide-react'
import { useCreateTruck, useUpdateTruck } from '#/lib/hooks/useTrucks'
import { useDriverList } from '#/lib/hooks/useDrivers'


export const Route = createFileRoute('/trucks/form')({
  component: TruckForm,
})

const statusList = ['Idle', 'In Transit', 'Maintenance'] as const
const truckTypes = ['Semi-Trailer', 'Box Truck', 'Refrigerated', 'Flatbed', 'Tanker', 'Dump Truck'] as const

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

interface DriverSearchSelectProps {
  value: string
  onChange: (value: string) => void
  editingTruck?: any
}

function DriverSearchSelect({ value, onChange, editingTruck }: DriverSearchSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm)
    }, 300)
    return () => clearTimeout(handler)
  }, [searchTerm])

  const { data: driversData, isLoading } = useDriverList({ search: debouncedSearch })
  const drivers = driversData?.drivers || []

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const selectedDriverName = (() => {
    if (!value) return "No Driver (Unassigned)"
    const found = drivers.find((d: any) => d._id === value)
    if (found) return `${found.name} (${found.status})`
    if (editingTruck && editingTruck.driverRef) {
      const editDriver = editingTruck.driverRef
      if (typeof editDriver === 'object' && editDriver._id === value) {
        return `${editDriver.name} (${editDriver.status || 'Active'})`
      } else if (editDriver === value) {
        return "Assigned Driver"
      }
    }
    return "Assigned Driver"
  })()

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        className="flex h-9 w-full items-center justify-between gap-2 rounded-lg border bg-transparent px-3 py-2 text-sm outline-none focus:border-ring focus:ring-[3px] focus:ring-ring/50 text-left"
        onClick={() => setIsOpen(!isOpen)}
 >
        <span className="truncate">{selectedDriverName}</span>
        <ChevronDown className="size-4 opacity-50 shrink-0" />
      </button>
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border bg-popover p-2 text-popover-foreground animate-in fade-in-0 zoom-in-95 flex flex-col gap-1.5">
          <div className="relative flex items-center">
            <Search className="absolute left-2.5 size-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search by name, email, license..."
              className="pl-8 h-8 text-xs bg-background"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
 />
          </div>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            <button
              type="button"
              className="w-full text-left px-2 py-1.5 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground cursor-pointer flex items-center justify-between"
              onClick={() => {
                onChange('')
                setIsOpen(false)
                setSearchTerm('')
              }}
 >
              <span>No Driver (Unassigned)</span>
              {value === '' && <Check className="size-4 text-primary" />}
            </button>
            {isLoading ? (
              <div className="p-4 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                <Loader2 className="size-4 animate-spin text-primary" />
                <span>Searching...</span>
              </div>
            ) : drivers.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No drivers found
              </div>
            ) : (
              drivers.map((driver: any) => (
                <button
                  key={driver._id}
                  type="button"
                  className="w-full text-left px-2 py-1.5 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground cursor-pointer flex items-center justify-between gap-2"
                  onClick={() => {
                    onChange(driver._id)
                    setIsOpen(false)
                    setSearchTerm('')
                  }}
 >
                  <div className="flex flex-col min-w-0">
                    <span className="font-medium truncate">{driver.name}</span>
                    <span className="text-xs text-muted-foreground truncate">
                      {driver.licenseNumber} • {driver.status}
                    </span>
                  </div>
                  {value === driver._id && <Check className="size-4 text-primary shrink-0" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function TruckForm() {
  const navigate = useNavigate()
  const router = useRouter()
  const createTruck = useCreateTruck()
  const updateTruck = useUpdateTruck()

  const stateData = router.history.location.state as { truck?: any; isEdit?: boolean } | undefined
  const isEdit = stateData?.isEdit || false
  const editingTruck = stateData?.truck

  const [formData, setFormData] = useState({
    id: '',
    plateNumber: '',
    model: '',
    capacity: '',
    capacityLitres: 0,
    status: 'Idle' as typeof statusList[number],
    driverRef: '',
    fuelLevel: 100,
    mileage: '0 km',
    vin: '',
    year: new Date().getFullYear(),
    make: '',
    type: 'Box Truck',
    insuranceExpiry: '',
    registrationExpiry: '',
    nextServiceMileage: 15000,
  })

  useEffect(() => {
    if (isEdit && editingTruck) {
      setFormData({
        id: editingTruck._id || editingTruck.id || '',
        plateNumber: editingTruck.plateNumber || '',
        model: editingTruck.model || '',
        capacity: editingTruck.capacity || '',
        capacityLitres: editingTruck.capacity_litres || 0,
        status: (editingTruck.status as any) || 'Idle',
        driverRef: editingTruck.driverRef?._id || editingTruck.driverRef || '',
        fuelLevel: editingTruck.fuelLevel !== undefined ? editingTruck.fuelLevel : 100,
        mileage: editingTruck.mileage || '0 km',
        vin: editingTruck.vin || '',
        year: editingTruck.year || new Date().getFullYear(),
        make: editingTruck.make || '',
        type: editingTruck.type || 'Box Truck',
        insuranceExpiry: formatDateToInput(editingTruck.insuranceExpiry),
        registrationExpiry: formatDateToInput(editingTruck.registrationExpiry),
        nextServiceMileage: editingTruck.nextServiceMileage || 15000,
      })
    }
  }, [isEdit, editingTruck])

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.plateNumber.trim()) newErrors.plateNumber = 'Plate number is required'
    if (!formData.model.trim()) newErrors.model = 'Model is required'
    if (!formData.capacity.trim()) newErrors.capacity = 'Capacity description is required (e.g. 15 Tons)'
    if (formData.year < 1900 || formData.year > new Date().getFullYear() + 2) {
      newErrors.year = 'Please enter a valid manufacture year'
    }
    if (formData.fuelLevel < 0 || formData.fuelLevel > 100) {
      newErrors.fuelLevel = 'Fuel level must be between 0 and 100'
    }
    if (formData.nextServiceMileage < 0) {
      newErrors.nextServiceMileage = 'Service mileage must be positive'
    }
    return newErrors
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => { const next = { ...prev }; delete next[field]; return next })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors = validate()
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return }
    setIsSubmitting(true)
    try {
      const payload = {
        plateNumber: formData.plateNumber,
        model: formData.model,
        capacity: formData.capacity,
        capacity_litres: formData.capacityLitres > 0 ? formData.capacityLitres : undefined,
        status: formData.status,
        driverRef: formData.driverRef || null,
        fuelLevel: Number(formData.fuelLevel),
        mileage: formData.mileage,
        vin: formData.vin,
        year: Number(formData.year),
        make: formData.make,
        type: formData.type,
        insuranceExpiry: formData.insuranceExpiry || null,
        registrationExpiry: formData.registrationExpiry || null,
        nextServiceMileage: Number(formData.nextServiceMileage),
      }

      if (isEdit && formData.id) {
        await updateTruck.mutateAsync({ id: formData.id, data: payload })
      } else {
        await createTruck.mutateAsync(payload)
      }
      setSubmitted(true)
    } catch (err: any) {
      setErrors({ form: err.response?.data?.message || 'Failed to save truck details' })
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
        <h2 className="text-lg md:text-xl font-semibold text-foreground tracking-tight">Truck {isEdit ? 'Updated' : 'Registered'} Successfully!</h2>
        <p className="text-muted-foreground max-w-sm">Vehicle {formData.plateNumber.toUpperCase()} has been saved to the fleet catalog.</p>
        <div className="flex gap-3 mt-2">
          {!isEdit && (
            <Button variant="outline" onClick={() => {
              setSubmitted(false)
              setFormData({
                id: '',
                plateNumber: '',
                model: '',
                capacity: '',
                capacityLitres: 0,
                status: 'Idle',
                driverRef: '',
                fuelLevel: 100,
                mileage: '0 km',
                vin: '',
                year: new Date().getFullYear(),
                make: '',
                type: 'Box Truck',
                insuranceExpiry: '',
                registrationExpiry: '',
                nextServiceMileage: 15000,
              })
              setErrors({})
            }}>
              Register Another
            </Button>
          )}
          <Button onClick={() => navigate({ to: '/trucks/' as any })}>Back to Trucks</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <Button variant="ghost" size="sm" onClick={() => navigate({ to: '/trucks/' as any })} className="mb-2">
            <ArrowLeft className="size-4 mr-2" />Back to Trucks
          </Button>
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-balance">{isEdit ? 'Edit Truck' : 'Register New Truck'}</h1>
          <p className="text-muted-foreground">{isEdit ? 'Modify vehicle specifications and operator credentials' : 'Register a new heavy-duty truck to your company fleet'}</p>
          {errors.form && <p className="text-sm text-destructive mt-1 flex items-center gap-1.5"><AlertCircle className="size-3.5" />{errors.form}</p>}
        </div>
      </header>

      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

          {/* Section 1: Identity & Specifications */}
          <div className="space-y-4 border rounded-lg p-5 bg-card">
            <div className="flex items-center space-x-2 border-b pb-2">
              <Truck className="size-5 text-primary" />
              <h2 className="text-lg font-semibold">Identity & Specs</h2>
            </div>
            <div className="space-y-3">
              <div>
                <Label>Plate Number*</Label>
                <Input
                  value={formData.plateNumber}
                  onChange={(e) => handleInputChange('plateNumber', e.target.value)}
                  placeholder="e.g. LA-982-BB"
                  className={errors.plateNumber ? 'border-destructive' : ''}
 />
                {errors.plateNumber && <p className="text-sm text-destructive mt-1">{errors.plateNumber}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Brand / Make</Label>
                  <Input
                    value={formData.make}
                    onChange={(e) => handleInputChange('make', e.target.value)}
                    placeholder="e.g. Scania, Volvo"
 />
                </div>
                <div>
                  <Label>Model*</Label>
                  <Input
                    value={formData.model}
                    onChange={(e) => handleInputChange('model', e.target.value)}
                    placeholder="e.g. R450, Actros"
                    className={errors.model ? 'border-destructive' : ''}
 />
                  {errors.model && <p className="text-sm text-destructive mt-1">{errors.model}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Manufacture Year</Label>
                  <Input
                    type="number"
                    value={formData.year}
                    onChange={(e) => handleInputChange('year', Number(e.target.value))}
                    placeholder="2022"
                    className={errors.year ? 'border-destructive' : ''}
 />
                  {errors.year && <p className="text-sm text-destructive mt-1">{errors.year}</p>}
                </div>
                <div>
                  <Label>Vehicle Type</Label>
                  <Select value={formData.type} onValueChange={(v) => handleInputChange('type', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {truckTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>VIN (Vehicle ID Number)</Label>
                <Input
                  value={formData.vin}
                  onChange={(e) => handleInputChange('vin', e.target.value.toUpperCase())}
                  placeholder="17-character VIN"
                  className="font-mono uppercase"
 />
              </div>

              <div>
                <Label>Payload Capacity (Tons/Liters)*</Label>
                <Input
                  value={formData.capacity}
                  onChange={(e) => handleInputChange('capacity', e.target.value)}
                  placeholder="e.g. 20 Tons, 30,000 Liters"
                  className={errors.capacity ? 'border-destructive' : ''}
 />
                {errors.capacity && <p className="text-sm text-destructive mt-1">{errors.capacity}</p>}
              </div>

              <div>
                <Label>Capacity (Litres) — Numeric</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.capacityLitres || ''}
                  onChange={(e) => handleInputChange('capacityLitres', Number(e.target.value) || 0)}
                  placeholder="e.g. 30000"
 />
                <p className="text-[11px] text-muted-foreground mt-1">
                  Numeric capacity in litres — used for delivery allocation calculations.
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Assignments & Status */}
          <div className="space-y-4 border rounded-lg p-5 bg-card">
            <div className="flex items-center space-x-2 border-b pb-2">
              <Compass className="size-5 text-primary" />
              <h2 className="text-lg font-semibold">Status & Assignment</h2>
            </div>
            <div className="space-y-3">
              <div>
                <Label>Operational Status</Label>
                <Select value={formData.status} onValueChange={(v) => handleInputChange('status', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {statusList.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Assigned Driver</Label>
                <DriverSearchSelect
                  value={formData.driverRef}
                  onChange={(v) => handleInputChange('driverRef', v)}
                  editingTruck={editingTruck}
 />
              </div>
            </div>
          </div>

          {/* Section 3: Telemetry, Expiries & Service */}
          <div className="space-y-4 border rounded-lg p-5 bg-card">
            <div className="flex items-center space-x-2 border-b pb-2">
              <ShieldAlert className="size-5 text-primary" />
              <h2 className="text-lg font-semibold">Telemetry & Compliance</h2>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Current Mileage</Label>
                  <Input
                    value={formData.mileage}
                    onChange={(e) => handleInputChange('mileage', e.target.value)}
                    placeholder="e.g. 15,200 km"
 />
                </div>
                <div>
                  <Label>Fuel Level (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.fuelLevel}
                    onChange={(e) => handleInputChange('fuelLevel', Number(e.target.value))}
                    className={errors.fuelLevel ? 'border-destructive' : ''}
 />
                  {errors.fuelLevel && <p className="text-sm text-destructive mt-1">{errors.fuelLevel}</p>}
                </div>
              </div>

              <div>
                <Label>Next Service Mileage (km Threshold)</Label>
                <Input
                  type="number"
                  value={formData.nextServiceMileage}
                  onChange={(e) => handleInputChange('nextServiceMileage', Number(e.target.value))}
                  className={errors.nextServiceMileage ? 'border-destructive' : ''}
 />
                {errors.nextServiceMileage && <p className="text-sm text-destructive mt-1">{errors.nextServiceMileage}</p>}
              </div>

              <div>
                <Label>Insurance Expiration Date</Label>
                <div className="relative">
                  <Input
                    type="date"
                    value={formData.insuranceExpiry}
                    onChange={(e) => handleInputChange('insuranceExpiry', e.target.value)}
 />
                </div>
              </div>

              <div>
                <Label>Road Registration Expiration Date</Label>
                <div className="relative">
                  <Input
                    type="date"
                    value={formData.registrationExpiry}
                    onChange={(e) => handleInputChange('registrationExpiry', e.target.value)}
 />
                </div>
              </div>
            </div>
          </div>

        </div>

        <div className="flex justify-end gap-3 border-t pt-4">
          <Button type="button" variant="outline" onClick={() => navigate({ to: '/trucks/' as any })}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting} className="min-w-[150px]">
            {isSubmitting ? <><Loader2 className="size-4 animate-spin mr-2" />Saving...</> : isEdit ? 'Update Truck' : 'Register Truck'}
          </Button>
        </div>
      </form>
    </div>
  )
}

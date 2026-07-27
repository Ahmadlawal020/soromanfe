import { useState, useEffect } from 'react'
import { createFileRoute, useNavigate, useRouter } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '#/components/ui/select'
import { ArrowLeft, Contact, CheckCircle, Loader2, AlertCircle, Truck, FileText } from 'lucide-react'
import { useCreateDriver, useUpdateDriver } from '#/lib/hooks/useDrivers'

export const Route = createFileRoute('/drivers/form')({
  component: DriverForm,
})

const statusList = ['Active', 'On Trip', 'Off Duty'] as const
const licenseClasses = ['A', 'B', 'C', 'D', 'E', 'CE', 'DE'] as const

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

function DriverForm() {
  const navigate = useNavigate()
  const router = useRouter()
  const createDriver = useCreateDriver()
  const updateDriver = useUpdateDriver()

  const stateData = router.history.location.state as { driver?: any; isEdit?: boolean } | undefined
  const isEdit = stateData?.isEdit || false
  const editingDriver = stateData?.driver

  const [formData, setFormData] = useState({
    id: '',
    name: '',
    email: '',
    phone: '',
    licenseNumber: '',
    licenseClass: '',
    licenseExpiry: '',
    rating: 0,
    status: 'Active' as typeof statusList[number],
    safetyScore: 0,
  })

  useEffect(() => {
    if (isEdit && editingDriver) {
      setFormData({
        id: editingDriver._id || editingDriver.id || '',
        name: editingDriver.name || '',
        email: editingDriver.email || '',
        phone: editingDriver.phone || '',
        licenseNumber: editingDriver.licenseNumber || '',
        licenseClass: editingDriver.licenseClass || '',
        licenseExpiry: formatDateToInput(editingDriver.licenseExpiry),
        rating: editingDriver.rating ?? 0,
        status: (editingDriver.status as any) || 'Active',
        safetyScore: editingDriver.safetyScore ?? 0,
      })
    }
  }, [isEdit, editingDriver])

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.name.trim()) newErrors.name = 'Driver name is required'
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required'
    if (!formData.licenseNumber.trim()) newErrors.licenseNumber = 'License number is required'
    if (!formData.licenseClass.trim()) newErrors.licenseClass = 'License class is required'
    if (formData.rating < 0 || formData.rating > 5) newErrors.rating = 'Rating must be between 0 and 5'
    if (formData.safetyScore < 0 || formData.safetyScore > 100) newErrors.safetyScore = 'Safety score must be between 0 and 100'
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
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        licenseNumber: formData.licenseNumber,
        licenseClass: formData.licenseClass,
        licenseExpiry: formData.licenseExpiry || null,
        rating: Number(formData.rating),
        status: formData.status,
        safetyScore: Number(formData.safetyScore),
      }

      if (isEdit && formData.id) {
        await updateDriver.mutateAsync({ id: formData.id, data: payload })
      } else {
        await createDriver.mutateAsync(payload)
      }
      setSubmitted(true)
    } catch (err: any) {
      setErrors({ form: err.response?.data?.message || 'Failed to save driver details' })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-5 text-center">
        <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center text-success border border-success/20">
          <CheckCircle size={32} />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Driver {isEdit ? 'Updated' : 'Registered'} Successfully!</h2>
        <p className="text-muted-foreground max-w-sm">Driver {formData.name} has been saved to the drivers directory.</p>
        <div className="flex gap-3 mt-2">
          {!isEdit && (
            <Button variant="outline" onClick={() => {
              setSubmitted(false)
              setFormData({
                id: '', name: '', email: '', phone: '',
                licenseNumber: '', licenseClass: '', licenseExpiry: '',
                rating: 0, status: 'Active', safetyScore: 0,
              })
              setErrors({})
            }}>
              Register Another
            </Button>
          )}
          <Button onClick={() => navigate({ to: '/drivers/' as any })}>Back to Drivers</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <Button variant="ghost" size="sm" onClick={() => navigate({ to: '/drivers/' as any })} className="mb-2">
            <ArrowLeft className="h-4 w-4 mr-2" />Back to Drivers
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">{isEdit ? 'Edit Driver' : 'Register New Driver'}</h1>
          <p className="text-muted-foreground">{isEdit ? 'Modify driver credentials, license details, and truck assignment' : 'Add a new driver to your fleet workforce'}</p>
          {errors.form && <p className="text-sm text-destructive mt-1 flex items-center gap-1.5"><AlertCircle size={14} />{errors.form}</p>}
        </div>
      </header>

      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

          {/* Section 1: Personal & Contact Info */}
          <div className="space-y-4 border rounded-lg p-5 bg-card">
            <div className="flex items-center space-x-2 border-b pb-2">
              <Contact className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Personal & Contact</h2>
            </div>
            <div className="space-y-3">
              <div>
                <Label>Full Name*</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="e.g. Musa Abdullahi"
                  className={errors.name ? 'border-destructive' : ''}
                />
                {errors.name && <p className="text-sm text-destructive mt-1">{errors.name}</p>}
              </div>

              <div>
                <Label>Email Address</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="e.g. musa@example.com"
                />
              </div>

              <div>
                <Label>Phone Number*</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="e.g. 08012345678"
                  className={errors.phone ? 'border-destructive' : ''}
                />
                {errors.phone && <p className="text-sm text-destructive mt-1">{errors.phone}</p>}
              </div>
            </div>
          </div>

          {/* Section 2: License & Credentials */}
          <div className="space-y-4 border rounded-lg p-5 bg-card">
            <div className="flex items-center space-x-2 border-b pb-2">
              <FileText className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">License & Credentials</h2>
            </div>
            <div className="space-y-3">
              <div>
                <Label>License Number*</Label>
                <Input
                  value={formData.licenseNumber}
                  onChange={(e) => handleInputChange('licenseNumber', e.target.value.toUpperCase())}
                  placeholder="e.g. ABD-12345678"
                  className={`font-mono uppercase ${errors.licenseNumber ? 'border-destructive' : ''}`}
                />
                {errors.licenseNumber && <p className="text-sm text-destructive mt-1">{errors.licenseNumber}</p>}
              </div>

              <div>
                <Label>License Class*</Label>
                <Select value={formData.licenseClass} onValueChange={(v) => handleInputChange('licenseClass', v)}>
                  <SelectTrigger className={errors.licenseClass ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Select license class..." />
                  </SelectTrigger>
                  <SelectContent>
                    {licenseClasses.map((lc) => <SelectItem key={lc} value={lc}>{lc}</SelectItem>)}
                  </SelectContent>
                </Select>
                {errors.licenseClass && <p className="text-sm text-destructive mt-1">{errors.licenseClass}</p>}
              </div>

              <div>
                <Label>License Expiry Date</Label>
                <Input
                  type="date"
                  value={formData.licenseExpiry}
                  onChange={(e) => handleInputChange('licenseExpiry', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Driver Rating (0-5)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="5"
                    step="0.1"
                    value={formData.rating}
                    onChange={(e) => handleInputChange('rating', Number(e.target.value))}
                    className={errors.rating ? 'border-destructive' : ''}
                  />
                  {errors.rating && <p className="text-sm text-destructive mt-1">{errors.rating}</p>}
                </div>
                <div>
                  <Label>Safety Score (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.safetyScore}
                    onChange={(e) => handleInputChange('safetyScore', Number(e.target.value))}
                    className={errors.safetyScore ? 'border-destructive' : ''}
                  />
                  {errors.safetyScore && <p className="text-sm text-destructive mt-1">{errors.safetyScore}</p>}
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Status & Assignment */}
          <div className="space-y-4 border rounded-lg p-5 bg-card">
            <div className="flex items-center space-x-2 border-b pb-2">
              <Truck className="h-5 w-5 text-primary" />
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
            </div>
          </div>

        </div>

        <div className="flex justify-end gap-3 border-t pt-4">
          <Button type="button" variant="outline" onClick={() => navigate({ to: '/drivers/' as any })}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting} className="gradient-primary text-white border-0 min-w-[150px]">
            {isSubmitting ? <><Loader2 size={16} className="animate-spin mr-2" />Saving...</> : isEdit ? 'Update Driver' : 'Register Driver'}
          </Button>
        </div>
      </form>
    </div>
  )
}

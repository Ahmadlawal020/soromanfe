import { useState, useEffect } from 'react'
import { createFileRoute, useNavigate, useRouter } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '#/components/ui/select'
import { ArrowLeft, Users, CheckCircle, Loader2, AlertCircle, Building2 } from 'lucide-react'
import { useCreateCustomer, useUpdateCustomer } from '#/lib/hooks/useCustomers'
import { CustomerLicenses } from '#/components/CustomerLicenses'

export const Route = createFileRoute('/customers/form')({
  component: CustomerForm,
})

const statusList = ['Active', 'Inactive'] as const

function CustomerForm() {
  const navigate = useNavigate()
  const router = useRouter()
  const createCustomer = useCreateCustomer()
  const updateCustomer = useUpdateCustomer()

  const stateData = router.history.location.state as { customer?: any; isEdit?: boolean } | undefined
  const isEdit = stateData?.isEdit || false
  const editingCustomer = stateData?.customer

  const [formData, setFormData] = useState({
    id: '',
    name: '',
    email: '',
    phone: '',
    companyName: '',
    address: '',
    status: 'Active' as typeof statusList[number],
  })

  useEffect(() => {
    if (isEdit && editingCustomer) {
      setFormData({
        id: editingCustomer._id || editingCustomer.id || '',
        name: editingCustomer.name || '',
        email: editingCustomer.email || '',
        phone: editingCustomer.phone || '',
        companyName: editingCustomer.companyName || '',
        address: editingCustomer.address || '',
        status: (editingCustomer.status as any) || 'Active',
      })
    }
  }, [isEdit, editingCustomer])

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [createdCustomerId, setCreatedCustomerId] = useState<number | null>(null)

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.name.trim()) newErrors.name = 'Customer name is required'
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required'
    else {
      const cleaned = formData.phone.replace(/[\s\-\(\)]/g, "");
      const isValid = /^(0|\+?234)\d{10}$/.test(cleaned) || /^[789]\d{9}$/.test(cleaned);
      if (!isValid) newErrors.phone = 'Enter a valid Nigerian phone number (e.g. 08012345678)';
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
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        companyName: formData.companyName,
        address: formData.address,
        status: formData.status,
      }

      if (isEdit && formData.id) {
        await updateCustomer.mutateAsync({ id: formData.id, data: payload })
      } else {
        const result = await createCustomer.mutateAsync(payload)
        setCreatedCustomerId(result?.data?.customer?.id || null)
      }
      setSubmitted(true)
    } catch (err: any) {
      setErrors({ form: err.response?.data?.message || 'Failed to save customer details' })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center justify-center py-12 gap-5 text-center">
          <div className="size-16 rounded-full bg-success/10 flex items-center justify-center text-success border border-success/20">
            <CheckCircle className="size-8" />
          </div>
          <h2 className="text-lg md:text-xl font-semibold text-foreground tracking-tight">Customer {isEdit ? 'Updated' : 'Created'} Successfully!</h2>
          <p className="text-muted-foreground max-w-sm">Customer {formData.name} has been saved to the customer directory.</p>
          <div className="flex gap-3 mt-2">
            {!isEdit && (
              <Button variant="outline" onClick={() => {
                setSubmitted(false)
                setCreatedCustomerId(null)
                setFormData({
                  id: '', name: '', email: '', phone: '',
                  companyName: '', address: '', status: 'Active',
                })
                setErrors({})
              }}>
                Add Another
              </Button>
            )}
            <Button onClick={() => navigate({ to: '/customers/' as any })}>Back to Customers</Button>
          </div>
        </div>

        {!isEdit && createdCustomerId && (
          <div className="max-w-2xl mx-auto">
            <CustomerLicenses customerId={createdCustomerId} />
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <Button variant="ghost" size="sm" onClick={() => navigate({ to: '/customers/' as any })} className="mb-2">
            <ArrowLeft className="size-4 mr-2" />Back to Customers
          </Button>
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-balance">{isEdit ? 'Edit Customer' : 'Add New Customer'}</h1>
          <p className="text-muted-foreground">{isEdit ? 'Modify customer information and account details' : 'Register a new customer to your company directory'}</p>
          {errors.form && <p className="text-sm text-destructive mt-1 flex items-center gap-1.5"><AlertCircle className="size-3.5" />{errors.form}</p>}
        </div>
      </header>

      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">

          {/* Section 1: Personal & Contact Info */}
          <div className="space-y-4 border rounded-lg p-5 bg-card">
            <div className="flex items-center space-x-2 border-b pb-2">
              <Users className="size-5 text-primary" />
              <h2 className="text-lg font-semibold">Personal & Contact</h2>
            </div>
            <div className="space-y-3">
              <div>
                <Label>Customer Name*</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="e.g. Ahmad Ibrahim"
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
                  placeholder="e.g. ahmed@example.com"
 />
              </div>

              <div>
                <Label>Phone Number*</Label>
                <Input
                  type="tel"
                  inputMode="numeric"
                  maxLength={14}
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="e.g. 08012345678"
                  className={errors.phone ? 'border-destructive' : ''}
 />
                {errors.phone && <p className="text-sm text-destructive mt-1">{errors.phone}</p>}
              </div>
            </div>
          </div>

          {/* Section 2: Company & Address */}
          <div className="space-y-4 border rounded-lg p-5 bg-card">
            <div className="flex items-center space-x-2 border-b pb-2">
              <Building2 className="size-5 text-primary" />
              <h2 className="text-lg font-semibold">Company & Address</h2>
            </div>
            <div className="space-y-3">
              <div>
                <Label>Company Name</Label>
                <Input
                  value={formData.companyName}
                  onChange={(e) => handleInputChange('companyName', e.target.value)}
                  placeholder="e.g. Soroman Energy Ltd"
 />
              </div>

              <div>
                <Label>Address</Label>
                <Input
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="e.g. 12 Marina Road, Lagos"
 />
              </div>

              <div>
                <Label>Account Status</Label>
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

        {isEdit && editingCustomer?.id && (
          <CustomerLicenses customerId={Number(editingCustomer.id)} />
        )}

        <div className="flex justify-end gap-3 border-t pt-4">
          <Button type="button" variant="outline" onClick={() => navigate({ to: '/customers/' as any })}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting} className="min-w-[150px]">
            {isSubmitting ? <><Loader2 className="size-4 animate-spin mr-2" />Saving...</> : isEdit ? 'Update Customer' : 'Add Customer'}
          </Button>
        </div>
      </form>
    </div>
  )
}

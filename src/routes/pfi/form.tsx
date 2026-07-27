import { useState, useEffect } from 'react'
import { createFileRoute, useNavigate, useRouter } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '#/components/ui/select'
import { Loader2, ArrowLeft, Save, CheckCircle, AlertCircle, FileText, User, Package } from 'lucide-react'
import { useCreatePfi, useDepotsForFilter, useUpdatePfi } from '#/lib/hooks/usePfis'
import { useProductList } from '#/lib/hooks/useProducts'
import { useAdminList } from '#/lib/hooks/useAdmin'

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
  const { data: productsData } = useProductList()
  const { data: adminsData } = useAdminList()

  const locations = Array.isArray(statesData) ? statesData : ((statesData as any)?.depots || (statesData as any)?.results || [])
  const products = Array.isArray(productsData) ? productsData : ((productsData as any)?.products || (productsData as any)?.results || [])
  const staff = Array.isArray(adminsData) ? adminsData : []

  const [form, setForm] = useState({
    id: '',
    pfiDate: '',
    pfiNumber: '',
    description: '',
    locationId: '',
    productId: '',
    startingQtyLitres: '',
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
        locationId: String(editingPfi.locationId || ''),
        productId: String(editingPfi.productId || ''),
        startingQtyLitres: String(editingPfi.startingQtyLitres || ''),
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!form.pfiNumber || !form.locationId || !form.productId || !form.startingQtyLitres) {
      setError('Please fill in all required fields (PFI No, Location, Product, Qty Volume).')
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        pfiDate: form.pfiDate || null,
        pfiNumber: form.pfiNumber,
        description: form.description,
        locationId: form.locationId,
        productId: form.productId,
        startingQtyLitres: Number(form.startingQtyLitres),
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
        <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center text-success border border-success/20">
          <CheckCircle size={32} />
        </div>
        <h2 className="text-2xl font-bold text-foreground">PFI {isEdit ? 'Updated' : 'Registered'} Successfully!</h2>
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
                productId: '',
                startingQtyLitres: '',
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
            <ArrowLeft className="h-4 w-4 mr-2" />Back to PFI List
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">{isEdit ? 'Edit PFI' : 'Add New PFI'}</h1>
          <p className="text-muted-foreground">{isEdit ? 'Modify information, officers, and vessel credentials of this PFI' : 'Register a new Pro Forma Invoice'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        {error && (
          <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm font-medium flex items-center gap-2 max-w-3xl">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

          {/* Section 1: PFI Identity & Specs */}
          <div className="space-y-4 border rounded-lg p-5 bg-card">
            <div className="flex items-center space-x-2 border-b pb-2">
              <FileText className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Identity & Specs</h2>
            </div>
            <div className="space-y-3">
              <div>
                <Label>PFI Date</Label>
                <Input type="date" value={form.pfiDate} onChange={e => setForm({ ...form, pfiDate: e.target.value })} />
              </div>

              <div>
                <Label>PFI No *</Label>
                <Input placeholder="e.g. PFI-50" value={form.pfiNumber} onChange={e => setForm({ ...form, pfiNumber: e.target.value })} required />
              </div>

              <div>
                <Label>Description</Label>
                <Input placeholder="e.g. AGO supply from Dangote refinery" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>

              <div>
                <Label>Location *</Label>
                <Select value={form.locationId} onValueChange={v => setForm({ ...form, locationId: v })}>
                  <SelectTrigger><SelectValue placeholder="Select location" /></SelectTrigger>
                  <SelectContent>
                    {locations.map((l: any) => (
                      <SelectItem key={l.id || l._id} value={String(l.id || l._id)}>{l.name || l.state_name || l.state || l.id}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Product *</Label>
                <Select value={form.productId} onValueChange={v => setForm({ ...form, productId: v })}>
                  <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                  <SelectContent>
                    {products.map((p: any) => (
                      <SelectItem key={p.id || p._id} value={String(p.id || p._id)}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Qty (Ltr) *</Label>
                  <Input type="number" min="0" placeholder="e.g. 1000000" value={form.startingQtyLitres} onChange={e => setForm({ ...form, startingQtyLitres: e.target.value })} required />
                </div>
                <div>
                  <Label>Qty (MT)</Label>
                  <Input type="number" min="0" placeholder="e.g. 820" value={form.qtyVolumeMt} onChange={e => setForm({ ...form, qtyVolumeMt: e.target.value })} />
                </div>
              </div>

              <div>
                <Label>Unit Price (₦ per Ltr)</Label>
                <Input type="number" step="0.01" min="0" placeholder="e.g. 950.00" value={form.unitPrice} onChange={e => setForm({ ...form, unitPrice: e.target.value })} />
                {Number(form.startingQtyLitres || 0) > 0 && Number(form.unitPrice || 0) > 0 && (
                  <p className="text-xs text-muted-foreground mt-1 font-medium">
                    Projected Total Value: <span className="font-semibold text-success">₦{(Number(form.startingQtyLitres) * Number(form.unitPrice)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Assigned Officers */}
          <div className="space-y-4 border rounded-lg p-5 bg-card">
            <div className="flex items-center space-x-2 border-b pb-2">
              <User className="h-5 w-5 text-primary" />
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
              <Package className="h-5 w-5 text-primary" />
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
          <Button type="submit" disabled={isSubmitting} className="gradient-primary text-white border-0 min-w-[150px]">
            {isSubmitting ? <><Loader2 size={16} className="animate-spin mr-2" />Saving...</> : <><Save className="w-4 h-4 mr-2" />{isEdit ? 'Update PFI' : 'Save PFI'}</>}
          </Button>
        </div>
      </form>
    </div>
  )
}

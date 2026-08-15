import { useState } from 'react'
import { PageHeader } from '#/components/PageHeader'
import { createFileRoute, useNavigate, useRouter } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Textarea } from '#/components/ui/textarea'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '#/components/ui/select'
import { Card, CardHeader, CardTitle, CardContent } from '#/components/ui/card'
import { ArrowLeft, Store, Landmark, Loader2 } from 'lucide-react'
import { useCreateVendor, useUpdateVendor, useVendorDetails, type Vendor } from '#/lib/hooks/useVendors'
import { useToast } from '#/lib/hooks/useToast'
import { routeGuard } from '#/lib/route-guard'

export const Route = createFileRoute('/vendors/form')({
  beforeLoad: () => routeGuard('/vendors'),
  component: VendorForm,
})

function VendorForm() {
  const navigate = useNavigate()
  const router = useRouter()
  const toast = useToast()
  const createVendor = useCreateVendor()
  const updateVendor = useUpdateVendor()

  const stateData = router.history.location.state as { vendor?: Vendor; isEdit?: boolean } | undefined
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
  const vendorIdFromUrl = searchParams?.get('id') || searchParams?.get('vendorId') || ''

  const stateVendor = stateData?.vendor
  const vendorId = stateVendor?.id || vendorIdFromUrl
  const isEdit = Boolean(stateData?.isEdit || vendorId)

  const { data, isLoading: isLoadingVendor } = useVendorDetails(vendorId)
  const editingVendor = stateVendor || data?.vendor

  const [name, setName] = useState(editingVendor?.name || '')
  const [contactPerson, setContactPerson] = useState(editingVendor?.contactPerson || '')
  const [phone, setPhone] = useState(editingVendor?.phone || '')
  const [email, setEmail] = useState(editingVendor?.email || '')
  const [address, setAddress] = useState(editingVendor?.address || '')
  const [bankName, setBankName] = useState(editingVendor?.bankName || '')
  const [accountNumber, setAccountNumber] = useState(editingVendor?.accountNumber || '')
  const [accountName, setAccountName] = useState(editingVendor?.accountName || '')
  const [taxId, setTaxId] = useState(editingVendor?.taxId || '')
  const [status, setStatus] = useState<'Active' | 'Inactive'>(editingVendor?.status || 'Active')
  const [hydrated, setHydrated] = useState(!isEdit)

  // Fields seed from editingVendor once it resolves (state-passed or fetched);
  // this only fires once so the user's own edits are never clobbered.
  if (!hydrated && editingVendor) {
    setName(editingVendor.name || '')
    setContactPerson(editingVendor.contactPerson || '')
    setPhone(editingVendor.phone || '')
    setEmail(editingVendor.email || '')
    setAddress(editingVendor.address || '')
    setBankName(editingVendor.bankName || '')
    setAccountNumber(editingVendor.accountNumber || '')
    setAccountName(editingVendor.accountName || '')
    setTaxId(editingVendor.taxId || '')
    setStatus(editingVendor.status || 'Active')
    setHydrated(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast.error('Please enter the vendor name')
      return
    }

    const payload = {
      name: name.trim(),
      contactPerson: contactPerson.trim(),
      phone: phone.trim(),
      email: email.trim(),
      address: address.trim(),
      bankName: bankName.trim(),
      accountNumber: accountNumber.trim(),
      accountName: accountName.trim(),
      taxId: taxId.trim(),
      status,
    }

    try {
      if (isEdit && vendorId) {
        await updateVendor.mutateAsync({ id: vendorId, data: payload })
      } else {
        await createVendor.mutateAsync(payload)
      }
      navigate({ to: '/vendors' })
    } catch {
      // Handled in mutation onError toast
    }
  }

  const isSubmitting = createVendor.isPending || updateVendor.isPending

  if (isEdit && isLoadingVendor && !editingVendor) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground mt-3">Loading vendor details...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl mx-auto pb-12">
      <div className="flex items-center justify-between gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate({ to: '/vendors' })}>
          <ArrowLeft className="size-4 mr-2" /> Back to Vendors
        </Button>
      </div>

      <PageHeader
        eyebrow="Expenses"
        title={isEdit ? 'Edit Vendor' : 'Add New Vendor'}
        description={isEdit ? 'Update this vendor\'s contact and bank details' : 'Save a vendor so it can be picked from a list next time an expense is raised'}
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="border-border/60">
          <CardHeader className="border-b border-border/40 pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Store className="size-4 text-primary" /> Vendor Information
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="vendor-name">Vendor Name *</Label>
                <Input id="vendor-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Zenith Marine Services" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="vendor-contact">Contact Person</Label>
                <Input id="vendor-contact" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="vendor-phone">Phone</Label>
                <Input id="vendor-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="vendor-email">Email</Label>
                <Input id="vendor-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="vendor-tax">Tax / Registration ID</Label>
                <Input id="vendor-tax" value={taxId} onChange={(e) => setTaxId(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="vendor-status">Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as 'Active' | 'Inactive')}>
                  <SelectTrigger id="vendor-status"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vendor-address">Address</Label>
              <Textarea id="vendor-address" value={address} onChange={(e) => setAddress(e.target.value)} rows={2} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="border-b border-border/40 pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Landmark className="size-4 text-primary" /> Bank Details
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="vendor-bank-name">Bank Name</Label>
              <Input id="vendor-bank-name" value={bankName} onChange={(e) => setBankName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vendor-account-number">Account Number</Label>
              <Input id="vendor-account-number" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="vendor-account-name">Account Name</Label>
              <Input id="vendor-account-name" value={accountName} onChange={(e) => setAccountName(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate({ to: '/vendors' })}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="size-4 mr-2 animate-spin" />}
            {isEdit ? 'Save Changes' : 'Add Vendor'}
          </Button>
        </div>
      </form>
    </div>
  )
}

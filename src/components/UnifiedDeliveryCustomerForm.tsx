import React, { useState, useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '#/components/ui/card'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { ArrowLeft, Loader2, Save, User, Building2, CreditCard, Camera } from 'lucide-react'
import {
  useCreateDeliveryCustomer,
  useUpdateDeliveryCustomer,
  useDeliveryCustomerDetails,
  type DeliveryCustomerPayload,
} from '#/lib/hooks/useDeliveryCustomers'

interface UnifiedDeliveryCustomerFormProps {
  defaultCustomerType?: 'customer' | 'filling_station'
  redirectPath?: string
  customerId?: string
  initialCustomer?: any
}

export function UnifiedDeliveryCustomerForm({
  defaultCustomerType = 'customer',
  redirectPath,
  customerId,
  initialCustomer,
}: UnifiedDeliveryCustomerFormProps) {
  const navigate = useNavigate()
  const createMutation = useCreateDeliveryCustomer()
  const updateMutation = useUpdateDeliveryCustomer()

  const { data: fetchedCustomer, isLoading: isFetching } = useDeliveryCustomerDetails(customerId)
  const activeCustomer = initialCustomer || fetchedCustomer

  const targetId = String(customerId || activeCustomer?._id || activeCustomer?.id || '')
  const isEdit = !!targetId

  // Primary customer type state
  const [customerType, setCustomerType] = useState<'customer' | 'filling_station'>(defaultCustomerType)

  // Basic Information
  const [name, setName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [altPhoneNumber, setAltPhoneNumber] = useState('')
  const [email, setEmail] = useState('')

  // Individual Customer specific fields
  const [homeAddress, setHomeAddress] = useState('')
  const [officeAddress, setOfficeAddress] = useState('')
  const [passportPhoto, setPassportPhoto] = useState('')
  const [passportPhotoPreview, setPassportPhotoPreview] = useState('')

  // Filling Station specific fields
  const [contactPerson, setContactPerson] = useState('')
  const [contactPersonPhone, setContactPersonPhone] = useState('')
  const [stationAddress, setStationAddress] = useState('')
  const [tankCapacity, setTankCapacity] = useState('')
  const [pumpCount, setPumpCount] = useState('1')

  // Bank & Settlement Account Details
  const [bankName, setBankName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [accountName, setAccountName] = useState('')

  // Financial Settings
  const [creditLimit, setCreditLimit] = useState('0')
  const [status, setStatus] = useState<'active' | 'dormant' | 'suspended'>('active')

  // Notes
  const [notes, setNotes] = useState('')

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Prefill state when activeCustomer is loaded
  useEffect(() => {
    if (activeCustomer) {
      const c = activeCustomer
      const bankDetails = c.bankDetails || c.bank_details || {}

      const type = c.customerType || c.customer_type
      if (type === 'customer' || type === 'filling_station') {
        setCustomerType(type)
      }
      setName(c.name || c.customer_name || '')
      setPhoneNumber(c.phoneNumber || c.phone_number || '')
      setAltPhoneNumber(c.altPhoneNumber || c.alt_phone_number || '')
      setEmail(c.email || '')
      setHomeAddress(c.homeAddress || c.home_address || '')
      setOfficeAddress(c.officeAddress || c.office_address || '')
      setPassportPhoto(c.passportPhoto || c.passport_photo || '')
      setPassportPhotoPreview(c.passportPhoto || c.passport_photo || '')
      setContactPerson(c.contactPerson || c.contact_person || '')
      setContactPersonPhone(c.contactPersonPhone || c.contact_person_phone || '')
      setStationAddress(c.stationAddress || c.station_address || '')
      setTankCapacity(c.tankCapacity !== undefined && c.tankCapacity !== null ? String(c.tankCapacity) : (c.tank_capacity !== undefined ? String(c.tank_capacity) : ''))
      setPumpCount(c.pumpCount !== undefined && c.pumpCount !== null ? String(c.pumpCount) : (c.pump_count !== undefined ? String(c.pump_count) : '1'))
      setBankName(bankDetails.bankName || c.bankName || c.bank_name || '')
      setAccountNumber(bankDetails.accountNumber || c.accountNumber || c.account_number || '')
      setAccountName(bankDetails.accountName || c.accountName || c.account_name || '')
      setCreditLimit(c.creditLimit !== undefined && c.creditLimit !== null ? String(c.creditLimit) : (c.outstanding_limit !== undefined ? String(c.outstanding_limit) : '0'))
      setStatus(c.status || 'active')
      setNotes(c.notes || '')
    }
  }, [activeCustomer])

  const isSubmitting = createMutation.isPending || updateMutation.isPending

  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64 = reader.result as string
        setPassportPhoto(base64)
        setPassportPhotoPreview(base64)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const newErrors: Record<string, string> = {}
    if (!name.trim()) newErrors.name = 'Name is required'
    if (!phoneNumber.trim()) newErrors.phone = 'Phone number is required'
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    setErrors({})

    const payload: DeliveryCustomerPayload = {
      customerType,
      name: name.trim(),
      phoneNumber: phoneNumber.trim(),
      altPhoneNumber: altPhoneNumber.trim(),
      email: email.trim(),
      bankDetails: {
        bankName: bankName.trim(),
        accountNumber: accountNumber.trim(),
        accountName: accountName.trim(),
      },
      bankName: bankName.trim(),
      accountNumber: accountNumber.trim(),
      accountName: accountName.trim(),
      creditLimit: Number(creditLimit) || 0,
      status,
      notes: notes.trim(),
    }

    if (customerType === 'customer') {
      payload.homeAddress = homeAddress.trim()
      payload.officeAddress = officeAddress.trim()
      payload.passportPhoto = passportPhoto.trim()
    } else {
      payload.contactPerson = contactPerson.trim()
      payload.contactPersonPhone = contactPersonPhone.trim()
      payload.stationAddress = stationAddress.trim()
      payload.tankCapacity = Number(tankCapacity) || 0
      payload.pumpCount = Number(pumpCount) || 1
    }

    try {
      if (isEdit && targetId) {
        await updateMutation.mutateAsync({ id: targetId, data: payload })
      } else {
        await createMutation.mutateAsync(payload)
      }
      const target = redirectPath || (customerType === 'filling_station' ? '/filing-stations' : '/delivery-customer')
      navigate({ to: target as any })
    } catch (err) {
      // Handled in mutation
    }
  }

  const backTarget = redirectPath || (defaultCustomerType === 'filling_station' ? '/filing-stations' : '/delivery-customer')

  if (isFetching && !activeCustomer) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 size={28} className="animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          className="cursor-pointer"
          onClick={() => navigate({ to: backTarget as any })}
        >
          <ArrowLeft size={16} className="mr-1" /> Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isEdit
              ? customerType === 'filling_station' ? 'Edit Filling Station' : 'Edit Delivery Customer'
              : customerType === 'filling_station' ? 'Create Filling Station' : 'Create Delivery Customer'}
          </h1>
          <p className="text-muted-foreground text-sm">
            {isEdit
              ? 'Update profile information and entity settings.'
              : 'Single unified creation workflow for both regular customers and filling stations.'}
          </p>
        </div>
      </div>

      {/* Selector for Customer Type */}
      <Card className="border-primary/20 bg-card/60 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Select Customer Classification</CardTitle>
          <CardDescription>Choose whether this entry is an individual customer or a filling station entity.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setCustomerType('customer')}
              className={`p-4 rounded-xl border flex items-center gap-3 transition-all cursor-pointer text-left ${
                customerType === 'customer'
                  ? 'border-primary bg-primary/10 text-primary shadow-sm font-semibold'
                  : 'border-border hover:border-primary/40 text-muted-foreground'
              }`}
            >
              <div className={`p-2 rounded-lg ${customerType === 'customer' ? 'bg-primary text-white' : 'bg-muted'}`}>
                <User size={20} />
              </div>
              <div>
                <div className="text-sm font-medium">Individual Customer</div>
                <div className="text-xs text-muted-foreground font-normal">Regular individual or private client</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setCustomerType('filling_station')}
              className={`p-4 rounded-xl border flex items-center gap-3 transition-all cursor-pointer text-left ${
                customerType === 'filling_station'
                  ? 'border-primary bg-primary/10 text-primary shadow-sm font-semibold'
                  : 'border-border hover:border-primary/40 text-muted-foreground'
              }`}
            >
              <div className={`p-2 rounded-lg ${customerType === 'filling_station' ? 'bg-primary text-white' : 'bg-muted'}`}>
                <Building2 size={20} />
              </div>
              <div>
                <div className="text-sm font-medium">Filling Station</div>
                <div className="text-xs text-muted-foreground font-normal">Commercial filling station outlet</div>
              </div>
            </button>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        {/* Core Identity */}
        <Card>
          <CardHeader>
            <CardTitle>{customerType === 'filling_station' ? 'Station Identity' : 'Customer Details'}</CardTitle>
            <CardDescription>Primary identification & contact phone details.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">{customerType === 'filling_station' ? 'Station / Business Name *' : 'Full Name *'}</Label>
              <Input
                id="name"
                placeholder={customerType === 'filling_station' ? 'TotalEnergies Lekki Phase 1' : 'John Doe'}
                required
                value={name}
                onChange={(e) => { setName(e.target.value); if (errors.name) setErrors(prev => ({ ...prev, name: '' })) }}
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Primary Phone Number *</Label>
              <Input
                id="phoneNumber"
                placeholder="+234 801 234 5678"
                required
                value={phoneNumber}
                onChange={(e) => { setPhoneNumber(e.target.value); if (errors.phone) setErrors(prev => ({ ...prev, phone: '' })) }}
                className={errors.phone ? 'border-destructive' : ''}
              />
              {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="altPhoneNumber">Alternative Phone Number</Label>
              <Input
                id="altPhoneNumber"
                placeholder="+234 809 988 7766"
                value={altPhoneNumber}
                onChange={(e) => setAltPhoneNumber(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="customer@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Dynamic Section: Customer vs Filling Station */}
        {customerType === 'customer' ? (
          <Card>
            <CardHeader>
              <CardTitle>Customer Specific Details</CardTitle>
              <CardDescription>Residential & office addresses and passport photo.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="homeAddress">Home Address</Label>
                <Input
                  id="homeAddress"
                  placeholder="12 Victoria Island, Lagos"
                  value={homeAddress}
                  onChange={(e) => setHomeAddress(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="officeAddress">Office Address</Label>
                <Input
                  id="officeAddress"
                  placeholder="Suite 404 Commercial Towers, Ikeja"
                  value={officeAddress}
                  onChange={(e) => setOfficeAddress(e.target.value)}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="passportPhoto">Passport Photo</Label>
                <div className="flex items-center gap-4">
                  {passportPhotoPreview ? (
                    <img
                      src={passportPhotoPreview}
                      alt="Passport preview"
                      className="w-16 h-16 rounded-lg object-cover border border-border"
                    />
                  ) : passportPhoto ? (
                    <img
                      src={passportPhoto}
                      alt="Passport preview"
                      className="w-16 h-16 rounded-lg object-cover border border-border"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-lg border-2 border-dashed border-border flex items-center justify-center text-muted-foreground bg-muted/40">
                      <Camera size={24} />
                    </div>
                  )}
                  <div className="flex-1 space-y-2">
                    <Input
                      id="passportPhotoFile"
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoFileChange}
                      className="cursor-pointer"
                    />
                    <Input
                      id="passportPhoto"
                      placeholder="Or paste image URL (https://...)"
                      value={passportPhoto}
                      onChange={(e) => {
                        setPassportPhoto(e.target.value)
                        setPassportPhotoPreview(e.target.value)
                      }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Filling Station Details</CardTitle>
              <CardDescription>Station site manager contact person & storage specs.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contactPerson">Contact Person (Manager)</Label>
                <Input
                  id="contactPerson"
                  placeholder="Manager Adebayo"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactPersonPhone">Contact Person Phone</Label>
                <Input
                  id="contactPersonPhone"
                  placeholder="+234 803 111 2233"
                  value={contactPersonPhone}
                  onChange={(e) => setContactPersonPhone(e.target.value)}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="stationAddress">Station Physical Address</Label>
                <Input
                  id="stationAddress"
                  placeholder="Plot 10 Admiralty Way, Lekki Phase 1, Lagos"
                  value={stationAddress}
                  onChange={(e) => setStationAddress(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tankCapacity">Tank Capacity (Litres)</Label>
                <Input
                  id="tankCapacity"
                  type="number"
                  min="0"
                  placeholder="45000"
                  value={tankCapacity}
                  onChange={(e) => setTankCapacity(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pumpCount">Number of Fuel Pumps</Label>
                <Input
                  id="pumpCount"
                  type="number"
                  min="1"
                  placeholder="4"
                  value={pumpCount}
                  onChange={(e) => setPumpCount(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Bank & Settlement Account Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard size={18} className="text-primary" /> Bank & Settlement Account Details
            </CardTitle>
            <CardDescription>Customer banking credentials for payment reconciliation and settlement.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bankName">Bank Name</Label>
              <Input
                id="bankName"
                placeholder="e.g. Zenith Bank, Access Bank"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="accountNumber">Account Number</Label>
              <Input
                id="accountNumber"
                placeholder="e.g. 0123456789"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="accountName">Account Name</Label>
              <Input
                id="accountName"
                placeholder="e.g. Soroman Logistics / Customer Name"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Credit Limit & Status */}
        <Card>
          <CardHeader>
            <CardTitle>Credit Limit & Status</CardTitle>
            <CardDescription>Set the customer's credit limit and account status.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="creditLimit">Credit Limit (NGN)</Label>
              <Input
                id="creditLimit"
                type="number"
                min="0"
                value={creditLimit}
                onChange={(e) => setCreditLimit(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Account Status</Label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full h-10 rounded-lg border border-border bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="active">Active</option>
                <option value="dormant">Dormant</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Additional Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Notes & Remarks</CardTitle>
          </CardHeader>
          <CardContent>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special instructions or observations..."
              className="w-full rounded-lg border border-border bg-card p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </CardContent>
        </Card>

        {/* Action buttons */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            className="cursor-pointer"
            onClick={() => navigate({ to: backTarget as any })}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            className="gradient-primary text-white border-0 cursor-pointer shadow-md shadow-primary/20"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> {isEdit ? 'Updating...' : 'Saving...'}
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" /> {isEdit ? 'Update' : 'Save'} {customerType === 'filling_station' ? 'Station' : 'Customer'}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

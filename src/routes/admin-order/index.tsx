import { useState, useEffect } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Card, CardContent, CardFooter } from '#/components/ui/card'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '#/components/ui/select'
import { Badge } from '#/components/ui/badge'
import {
  Loader2,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Search,
  User,
  MapPin,
  Warehouse,
  Package,
  Truck,
  FileCheck,
  Plus,
  Pencil,
  CircleDollarSign,
  Copy,
  Mail,
  Phone,
  Banknote,
} from 'lucide-react'
import { useCustomerList, useCreateCustomer } from '#/lib/hooks/useCustomers'
import { useDepots } from '#/lib/hooks/useDepots'
import { useCreateOrder } from '#/lib/hooks/useOrders'
import { nigeriaStates } from '#/lib/nigeria-data'

export const Route = createFileRoute('/admin-order/')({
  component: CreateOrderWizard,
})

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(value)
}

function formatAccountName(name?: string) {
  if (!name) return 'N/A';
  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase())
    .join(' ');
  return `SOROMANNIGERI/ ${initials}`;
}

const WIZARD_STEPS = [
  { title: 'Customer', shortTitle: 'Customer', icon: User },
  { title: 'Location & Depot', shortTitle: 'Location', icon: MapPin },
  { title: 'Product', shortTitle: 'Product', icon: Package },
  { title: 'Delivery', shortTitle: 'Delivery', icon: Truck },
  { title: 'Review', shortTitle: 'Review', icon: FileCheck },
]

function CreateOrderWizard() {
  const navigate = useNavigate()
  const createCustomerMutation = useCreateCustomer()
  const createOrderMutation = useCreateOrder()

  const [step, setStep] = useState(1)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  // Step 1: Customer
  const [customerSearch, setCustomerSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchPage, setSearchPage] = useState(1)
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)
  const [isRegisteringCustomer, setIsRegisteringCustomer] = useState(false)
  const [newCustomerForm, setNewCustomerForm] = useState({
    name: '',
    email: '',
    phone: '',
    companyName: '',
    address: '',
  })

  // Step 2: Location & Depot (merged)
  const [selectedState, setSelectedState] = useState('')
  const [selectedDepot, setSelectedDepot] = useState<any>(null)

  // Step 3: Product
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [orderQuantity, setOrderQuantity] = useState('')

  // Step 4: Delivery
  const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup'>('pickup')

  // Step 5: Completion
  const [placedOrder, setPlacedOrder] = useState<any>(null)
  const [paymentInfo, setPaymentInfo] = useState<any>(null)

  // Debounce customer search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(customerSearch)
      setSearchPage(1)
    }, 300)
    return () => clearTimeout(handler)
  }, [customerSearch])

  // Backend queries
  const { data: customerSearchData, isLoading: isSearchingCustomers } = useCustomerList(
    { search: debouncedSearch || undefined, limit: 20, page: searchPage },
    { enabled: debouncedSearch.trim().length >= 2 }
  )
  const customers = customerSearchData?.customers || []
  const totalCustomers = customerSearchData?.pagination?.total || 0
  const hasMore = customers.length < totalCustomers

  const { data: depotsList, isLoading: isLoadingDepots } = useDepots({ limit: 100 })
  const depots = depotsList || []

  const stateDepots = depots.filter((d: any) =>
    d.state?.toLowerCase().trim() === selectedState?.toLowerCase().trim()
  )

  const handleRegisterCustomer = async () => {
    setError('')
    if (!newCustomerForm.name || !newCustomerForm.phone) {
      setError('Name and Phone Number are required')
      return
    }
    const cleaned = newCustomerForm.phone.replace(/[\s\-\(\)]/g, "");
    const isValid = /^(0|\+?234)\d{10}$/.test(cleaned) || /^8\d{9}$/.test(cleaned);
    if (!isValid) {
      setError('Enter a valid Nigerian phone number (e.g. 08012345678)')
      return
    }
    try {
      const response = await createCustomerMutation.mutateAsync(newCustomerForm)
      if (response.success && response.data?.customer) {
        setSelectedCustomer(response.data.customer)
        setIsRegisteringCustomer(false)
        setStep(2)
      } else {
        setError('Failed to register customer')
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Error registering customer')
    }
  }

  const handlePlaceOrder = async () => {
    setError('')
    try {
      const totalAmount = Number(orderQuantity) * Number(selectedProduct.currentPrice)
      const payload = {
        customer: selectedCustomer._id || selectedCustomer.id,
        state: selectedState,
        depot: selectedDepot.id || selectedDepot._id,
        product: selectedProduct.product._id || selectedProduct.product.id,
        quantity: Number(orderQuantity),
        price: Number(selectedProduct.currentPrice),
        totalAmount,
        deliveryType,
      }
      const response = await createOrderMutation.mutateAsync(payload)
      if (response.success && response.data?.order) {
        setPlacedOrder(response.data.order)
        setPaymentInfo(response.data.payment || null)
        setStep(6)
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to place order')
    }
  }

  const handleNextStep = () => {
    setError('')
    if (step === 1) {
      if (!selectedCustomer) {
        setError('Please select an existing customer or register a new one')
        return
      }
      setStep(2)
    } else if (step === 2) {
      if (!selectedState) {
        setError('Please select the destination state')
        return
      }
      if (!selectedDepot) {
        setError('Please select a depot')
        return
      }
      setStep(3)
    } else if (step === 3) {
      if (!selectedProduct) {
        setError('Please select a product')
        return
      }
      if (!orderQuantity || Number(orderQuantity) <= 0) {
        setError('Please enter a valid quantity')
        return
      }
      const capacityEntry = selectedDepot.productCapacities?.find(
        (pc: any) => (pc.product?._id || pc.product?.id) === (selectedProduct.product?._id || selectedProduct.product?.id)
      )
      if (capacityEntry && capacityEntry.capacity < Number(orderQuantity)) {
        setError(`Insufficient capacity. Available: ${capacityEntry.capacity.toLocaleString()} ${selectedProduct.product?.unit || 'Liters'}`)
        return
      }
      setStep(4)
    } else if (step === 4) {
      setStep(5)
    }
  }

  const handlePrevStep = () => {
    setError('')
    setStep(prev => Math.max(1, prev - 1))
  }

  const goToStep = (targetStep: number) => {
    setError('')
    setStep(targetStep)
  }

  const resetWizard = () => {
    setStep(1)
    setCustomerSearch('')
    setDebouncedSearch('')
    setIsSearchOpen(false)
    setSearchPage(1)
    setSelectedCustomer(null)
    setIsRegisteringCustomer(false)
    setSelectedState('')
    setSelectedDepot(null)
    setSelectedProduct(null)
    setOrderQuantity('')
    setPlacedOrder(null)
    setPaymentInfo(null)
    setError('')
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Button
            variant="ghost"
            size="sm"
            className="mb-2 -ml-2 text-muted-foreground hover:text-foreground"
            onClick={() => navigate({ to: '/orders' as any })}
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Orders
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Place Customer Order</h1>
          <p className="text-muted-foreground">Follow the step-by-step process to verify customers, select inventory, and place orders.</p>
        </div>
      </div>

      {/* Progress Indicator */}
      {step <= 5 && (
        <div className="border rounded-xl bg-card p-3 sm:p-4 shadow-sm">
          <div className="flex justify-between items-center relative">
            <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-muted -translate-y-1/2 z-0" />
            <div
              className="absolute top-1/2 left-4 h-0.5 -translate-y-1/2 z-0 transition-all duration-500 ease-out bg-gradient-to-r from-lime-700 to-lime-500"
              style={{ width: `${((step - 1) / (WIZARD_STEPS.length - 1)) * (100 - 8)}%` }}
            />
            {WIZARD_STEPS.map((stepInfo, idx) => {
              const StepIcon = stepInfo.icon
              const isCompleted = step > idx + 1
              const isActive = step === idx + 1

              return (
                <div key={idx} className="flex flex-col items-center z-10 relative">
                  <div
                    className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${isCompleted
                      ? 'bg-gradient-to-tr from-lime-700 to-lime-500 border-lime-600 text-white'
                      : isActive
                        ? 'bg-card border-primary text-primary shadow-[0_0_0_4px_rgba(13,148,136,0.15)] ring-2 ring-primary ring-offset-2'
                        : 'bg-muted border-muted-foreground/20 text-muted-foreground'
                      }`}
                  >
                    {isCompleted ? (
                      <CheckCircle size={14} className="sm:w-4 sm:h-4" />
                    ) : (
                      <StepIcon size={14} className="sm:w-4 sm:h-4" />
                    )}
                  </div>
                  <span
                    className={`text-[10px] sm:text-[11px] font-semibold mt-1.5 transition-colors duration-200 ${isActive ? 'text-primary' : isCompleted ? 'text-lime-700' : 'text-muted-foreground'
                      }`}
                  >
                    <span className="hidden sm:inline">{stepInfo.title}</span>
                    <span className="sm:hidden">{stepInfo.shortTitle}</span>
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm font-medium flex items-center gap-2 border border-destructive/20">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Wizard Card */}
      <Card className="shadow-md">
        <CardContent className="pt-6">

          {/* STEP 1: CUSTOMER */}
          {step === 1 && (
            <div key="step-1" className="space-y-6 animate-fade-in">
              <div className="flex items-center gap-3 border-b border-border pb-4">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <User size={18} />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Customer Identification</h2>
                  <p className="text-sm text-muted-foreground">Search for an existing customer or register a new profile.</p>
                </div>
              </div>

              {!isRegisteringCustomer ? (
                <div className="space-y-4">
                  {selectedCustomer && !isSearchOpen ? (
                    <>
                      <div className="p-4 border rounded-xl bg-muted/30 space-y-3">
                        <div className="flex items-center gap-2 border-b border-border pb-2">
                          <div className="h-6 w-6 rounded bg-primary/10 flex items-center justify-center">
                            <User className="text-primary w-3.5 h-3.5" />
                          </div>
                          <span className="font-bold text-sm">Selected Customer</span>
                          <Badge variant="outline" className={`ml-auto ${selectedCustomer.status === 'Active' ? 'bg-success/10 text-success border-success/20' : ''}`}>
                            {selectedCustomer.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-lime-700 to-lime-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                            {selectedCustomer.name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-foreground">{selectedCustomer.name}</p>
                            <p className="text-xs text-muted-foreground">{selectedCustomer.companyName || 'No Company'} &bull; {selectedCustomer.phone}</p>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => { setIsSearchOpen(true); setSelectedCustomer(null); }}>
                            Change
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                          <div>
                            <span className="text-muted-foreground block">Full Name</span>
                            <span className="font-medium">{selectedCustomer.name}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground block">Company</span>
                            <span className="font-medium">{selectedCustomer.companyName || '—'}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground block">Phone</span>
                            <span className="font-medium">{selectedCustomer.phone}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground block">Account Balance</span>
                            <span className={`font-semibold ${(selectedCustomer.balance || 0) < 0 ? 'text-destructive' : 'text-success'}`}>
                              {formatCurrency(selectedCustomer.balance || 0)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                          <Input
                            placeholder="Search by name, email, phone, or company..."
                            value={customerSearch}
                            onChange={(e) => { setCustomerSearch(e.target.value); setSelectedCustomer(null); setIsSearchOpen(true); }}
                            className="pl-10"
                            autoFocus
                          />
                          {customerSearch && (
                            <button
                              onClick={() => { setCustomerSearch(''); setSelectedCustomer(null); setIsSearchOpen(false); }}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            >
                              &times;
                            </button>
                          )}
                        </div>
                        <Button variant="outline" onClick={() => setIsRegisteringCustomer(true)} className="shrink-0">
                          <Plus className="w-4 h-4 mr-2" /> Register New
                        </Button>
                      </div>

                      {!customerSearch.trim() ? (
                        <div className="p-10 text-center border border-dashed rounded-xl bg-muted/20">
                          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-muted border border-border mb-3">
                            <Search size={20} className="text-muted-foreground" />
                          </div>
                          <p className="text-sm font-medium text-foreground">Search for a customer</p>
                          <p className="text-xs text-muted-foreground mt-1">Type at least 2 characters to search by name, email, phone, or company.</p>
                        </div>
                      ) : customerSearch.trim().length < 2 ? (
                        <div className="p-10 text-center border border-dashed rounded-xl bg-muted/20">
                          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-muted border border-border mb-3">
                            <Search size={20} className="text-muted-foreground" />
                          </div>
                          <p className="text-sm font-medium text-foreground">Keep typing...</p>
                          <p className="text-xs text-muted-foreground mt-1">Enter at least 2 characters to start searching.</p>
                        </div>
                      ) : isSearchingCustomers && searchPage === 1 ? (
                        <div className="flex items-center justify-center py-16">
                          <Loader2 size={24} className="animate-spin text-muted-foreground" />
                        </div>
                      ) : customers.length === 0 ? (
                        <div className="p-10 text-center border border-dashed rounded-xl">
                          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-muted border border-border mb-3">
                            <User size={20} className="text-muted-foreground" />
                          </div>
                          <p className="text-sm font-medium text-foreground">No customer matches found</p>
                          <p className="text-xs text-muted-foreground mt-1">Try a different search or register a new customer.</p>
                          <Button variant="ghost" size="sm" onClick={() => setIsRegisteringCustomer(true)} className="mt-3 text-primary">
                            <Plus size={14} className="mr-1" /> Register "{customerSearch}"
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="max-h-[320px] overflow-y-auto pr-1 space-y-2">
                            {customers.map((c: any) => (
                              <div
                                key={c._id}
                                onClick={() => { setSelectedCustomer(c); setIsSearchOpen(false); setCustomerSearch(''); }}
                                className="p-3 sm:p-4 rounded-xl border cursor-pointer transition-all duration-200 flex items-center gap-3 hover:bg-muted/50 hover:border-muted-foreground/20 border-border"
                              >
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-lime-700 to-lime-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                                  {c.name?.charAt(0)?.toUpperCase() || '?'}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-sm text-foreground truncate">{c.name}</p>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {c.companyName || 'No Company'} &bull; {c.phone}
                                  </p>
                                </div>
                                <div className="text-right shrink-0">
                                  <span className="text-[10px] text-muted-foreground block">Balance</span>
                                  <span className={`font-bold text-sm ${(c.balance || 0) < 0 ? 'text-destructive' : 'text-foreground'}`}>
                                    {formatCurrency(c.balance || 0)}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="flex items-center justify-between pt-1">
                            <p className="text-xs text-muted-foreground">
                              Showing {customers.length} of {totalCustomers} customers
                            </p>
                            {hasMore && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs text-primary"
                                onClick={() => setSearchPage(prev => prev + 1)}
                                disabled={isSearchingCustomers}
                              >
                                {isSearchingCustomers ? (
                                  <><Loader2 size={12} className="animate-spin mr-1" /> Loading...</>
                                ) : (
                                  'Load More'
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ) : (
                <div className="space-y-4 border p-5 rounded-xl bg-card shadow-sm">
                  <div className="flex justify-between items-center border-b border-border pb-2">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded bg-primary/10 flex items-center justify-center">
                        <Plus className="text-primary w-3.5 h-3.5" />
                      </div>
                      <span className="font-bold text-sm">New Customer Registration</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setIsRegisteringCustomer(false)}>Cancel</Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Customer Name *</Label>
                      <Input
                        placeholder="e.g. Ahmad Oluwafemi"
                        value={newCustomerForm.name}
                        onChange={(e) => setNewCustomerForm({ ...newCustomerForm, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Phone Number *</Label>
                      <Input
                        type="tel"
                        inputMode="numeric"
                        maxLength={14}
                        placeholder="e.g. 08012345678"
                        value={newCustomerForm.phone}
                        onChange={(e) => setNewCustomerForm({ ...newCustomerForm, phone: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Email Address</Label>
                      <Input
                        type="email"
                        placeholder="e.g. customer@example.com"
                        value={newCustomerForm.email}
                        onChange={(e) => setNewCustomerForm({ ...newCustomerForm, email: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Company Name</Label>
                      <Input
                        placeholder="e.g. Ahmad Logistics Ltd"
                        value={newCustomerForm.companyName}
                        onChange={(e) => setNewCustomerForm({ ...newCustomerForm, companyName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label>Address</Label>
                      <Input
                        placeholder="e.g. 12 Link Road, Ikeja, Lagos"
                        value={newCustomerForm.address}
                        onChange={(e) => setNewCustomerForm({ ...newCustomerForm, address: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 border-t border-border pt-3">
                    <Button variant="outline" onClick={() => setIsRegisteringCustomer(false)}>Cancel</Button>
                    <Button
                      className="gradient-primary text-white border-0"
                      onClick={handleRegisterCustomer}
                      disabled={createCustomerMutation.isPending}
                    >
                      {createCustomerMutation.isPending ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
                      Register & Proceed
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: LOCATION & DEPOT (merged) */}
          {step === 2 && (
            <div key="step-2" className="space-y-6 animate-fade-in">
              <div className="flex items-center gap-3 border-b border-border pb-4">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <MapPin size={18} />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Location & Depot</h2>
                  <p className="text-sm text-muted-foreground">Select the destination state and nearest depot for sourcing.</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Destination State *</Label>
                <Select
                  value={selectedState}
                  onValueChange={(v) => { setSelectedState(v); setSelectedDepot(null); setSelectedProduct(null); }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose a state" />
                  </SelectTrigger>
                  <SelectContent>
                    {nigeriaStates.map((state) => (
                      <SelectItem key={state} value={state}>{state}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedState && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Warehouse className="w-4 h-4 text-muted-foreground" />
                    <Label className="text-sm font-semibold">Available Depots in {selectedState}</Label>
                  </div>

                  {isLoadingDepots ? (
                    <div className="flex items-center justify-center py-16">
                      <Loader2 size={24} className="animate-spin text-muted-foreground" />
                    </div>
                  ) : stateDepots.length === 0 ? (
                    <div className="p-10 border border-dashed rounded-xl text-center space-y-2">
                      <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-muted border border-border mb-1">
                        <Warehouse size={20} className="text-muted-foreground" />
                      </div>
                      <p className="text-sm font-medium text-foreground">No active depots in {selectedState}</p>
                      <p className="text-xs text-muted-foreground">Please select a different state.</p>
                    </div>
                  ) : (
                    <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                      {stateDepots.map((d: any) => (
                        <div
                          key={d.id}
                          onClick={() => { setSelectedDepot(d); setSelectedProduct(null); }}
                          className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 flex items-start gap-3 ${selectedDepot?.id === d.id
                            ? 'border-primary bg-primary/5 shadow-sm'
                            : 'hover:bg-muted/50 hover:border-muted-foreground/20 border-border'
                            }`}
                        >
                          <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${selectedDepot?.id === d.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                            }`}>
                            <Warehouse size={16} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-sm text-foreground">{d.name}</p>
                            <p className="text-xs text-muted-foreground font-mono mt-0.5">Code: {d.code}</p>
                            <p className="text-xs text-muted-foreground mt-1 truncate">{d.address}, {d.city}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* STEP 3: PRODUCT SELECTION & QUANTITY */}
          {step === 3 && (
            <div key="step-3" className="space-y-6 animate-fade-in">
              <div className="flex items-center gap-3 border-b border-border pb-4">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <Package size={18} />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Product Selection & Quantity</h2>
                  <p className="text-sm text-muted-foreground">Choose a product available at {selectedDepot?.name} and enter the order quantity.</p>
                </div>
              </div>

              <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                {selectedDepot?.productPrices?.map((priceEntry: any, idx: number) => {
                  const capacityEntry = selectedDepot.productCapacities?.find(
                    (c: any) => (c.product?._id || c.product?.id) === (priceEntry.product?._id || priceEntry.product?.id)
                  )
                  const remainingQty = capacityEntry?.capacity ?? 0
                  const isSelected = selectedProduct?.product?._id === priceEntry.product?._id

                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedProduct(priceEntry)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 flex flex-col justify-between ${isSelected
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'hover:bg-muted/50 hover:border-muted-foreground/20 border-border'
                        }`}
                    >
                      <div>
                        <div className="flex justify-between items-start">
                          <p className="font-bold text-sm text-foreground">{priceEntry.product?.name || 'Unknown'}</p>
                          <Badge variant="outline" className="text-[10px] uppercase font-mono">{priceEntry.product?.sku}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{priceEntry.product?.category}</p>
                      </div>
                      <div className="flex justify-between items-end mt-4 pt-3 border-t border-border">
                        <div>
                          <span className="text-[10px] text-muted-foreground block">Available Stock</span>
                          <span className="font-semibold text-xs">{remainingQty.toLocaleString()} {priceEntry.product?.unit || 'Liters'}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-muted-foreground block">Unit Price</span>
                          <span className="font-bold text-primary text-sm">{formatCurrency(priceEntry.currentPrice)}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {selectedProduct && (
                <div className="p-5 border-2 border-primary/25 rounded-xl bg-primary/5 space-y-4 shadow-sm">
                  <div className="flex items-center gap-3 pb-3 border-b border-primary/20">
                    <div className="h-9 w-9 rounded-lg bg-primary/15 flex items-center justify-center text-primary">
                      <CircleDollarSign className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-bold text-base text-foreground">Order Details</span>
                      <p className="text-xs text-muted-foreground">Enter the quantity and review pricing.</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Order Quantity ({selectedProduct.product?.unit || 'Liters'}) *</Label>
                      <Input
                        type="number"
                        placeholder="e.g. 5000"
                        value={orderQuantity}
                        onChange={(e) => setOrderQuantity(e.target.value)}
                        min="1"
                      />
                    </div>
                    <div className="flex flex-col justify-end bg-card p-3 rounded-lg border border-border">
                      <div className="flex justify-between items-center text-xs text-muted-foreground">
                        <span>Unit Price</span>
                        <span>{formatCurrency(selectedProduct.currentPrice)}</span>
                      </div>
                      <div className="flex justify-between items-center font-bold text-lg mt-2 border-t border-border pt-2 text-foreground">
                        <span>Total</span>
                        <span className="text-primary">{formatCurrency(Number(orderQuantity || 0) * selectedProduct.currentPrice)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: DELIVERY OR PICKUP */}
          {step === 4 && (
            <div key="step-4" className="space-y-6 animate-fade-in">
              <div className="flex items-center gap-3 border-b border-border pb-4">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <Truck size={18} />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Delivery Options</h2>
                  <p className="text-sm text-muted-foreground">Choose whether the customer wants delivery or depot self-pickup.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  {
                    value: 'pickup' as const,
                    icon: Warehouse,
                    title: 'Self Pickup',
                    description: 'Customer arranges their own trucks to load from the depot.',
                  },
                  {
                    value: 'delivery' as const,
                    icon: Truck,
                    title: 'Company Delivery',
                    description: 'Soroman Logistics will manage transport and delivery to destination.',
                  },
                ].map((option) => {
                  const Icon = option.icon
                  const isSelected = deliveryType === option.value
                  return (
                    <div
                      key={option.value}
                      onClick={() => setDeliveryType(option.value)}
                      className={`p-5 border rounded-xl cursor-pointer transition-all duration-200 flex gap-3 items-start ${isSelected
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'hover:bg-muted/50 hover:border-muted-foreground/20 border-border'
                        }`}
                    >
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                        }`}>
                        <Icon size={18} />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-foreground">{option.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">{option.description}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* STEP 5: REVIEW ORDER */}
          {step === 5 && (
            <div key="step-5" className="space-y-6 animate-fade-in">
              <div className="flex items-center gap-3 border-b border-border pb-4">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <FileCheck size={18} />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Review Order Details</h2>
                  <p className="text-sm text-muted-foreground">Double check all details before placing the order.</p>
                </div>
              </div>

              {/* Customer Section */}
              <div className="border rounded-xl divide-y divide-border">
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-primary" />
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Customer</span>
                  </div>
                  <Button variant="ghost" size="sm" className="h-7 text-xs text-primary" onClick={() => goToStep(1)}>
                    <Pencil size={12} className="mr-1" /> Edit
                  </Button>
                </div>
                <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-xs text-muted-foreground block">Customer Name</span>
                    <span className="font-semibold text-foreground">{selectedCustomer?.name}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">Company</span>
                    <span className="font-semibold text-foreground">{selectedCustomer?.companyName || '—'}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">Phone</span>
                    <span className="font-semibold text-foreground">{selectedCustomer?.phone}</span>
                  </div>
                </div>
                {(selectedCustomer?.balance || 0) < 0 && (
                  <div className="px-4 py-2 bg-destructive/5 flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 text-destructive" />
                    <span className="text-xs text-destructive font-medium">Customer has a negative balance of {formatCurrency(selectedCustomer.balance)}</span>
                  </div>
                )}
              </div>

              {/* Location Section */}
              <div className="border rounded-xl divide-y divide-border">
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Location & Depot</span>
                  </div>
                  <Button variant="ghost" size="sm" className="h-7 text-xs text-primary" onClick={() => goToStep(2)}>
                    <Pencil size={12} className="mr-1" /> Edit
                  </Button>
                </div>
                <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-xs text-muted-foreground block">Destination State</span>
                    <span className="font-semibold text-foreground">{selectedState}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">Depot</span>
                    <span className="font-semibold text-foreground">{selectedDepot?.name}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">Depot Code</span>
                    <span className="font-semibold text-foreground font-mono">{selectedDepot?.code}</span>
                  </div>
                </div>
              </div>

              {/* Product Section */}
              <div className="border rounded-xl divide-y divide-border">
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-primary" />
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Product & Quantity</span>
                  </div>
                  <Button variant="ghost" size="sm" className="h-7 text-xs text-primary" onClick={() => goToStep(3)}>
                    <Pencil size={12} className="mr-1" /> Edit
                  </Button>
                </div>
                <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-xs text-muted-foreground block">Product</span>
                    <span className="font-semibold text-foreground">{selectedProduct?.product?.name}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">SKU</span>
                    <span className="font-semibold text-foreground font-mono">{selectedProduct?.product?.sku}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">Order Volume</span>
                    <span className="font-semibold text-foreground">{Number(orderQuantity).toLocaleString()} {selectedProduct?.product?.unit || 'Liters'}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">Unit Price</span>
                    <span className="font-semibold text-foreground">{formatCurrency(selectedProduct?.currentPrice)}</span>
                  </div>
                </div>
              </div>

              {/* Delivery Section */}
              <div className="border rounded-xl divide-y divide-border">
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-primary" />
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Delivery Method</span>
                  </div>
                  <Button variant="ghost" size="sm" className="h-7 text-xs text-primary" onClick={() => goToStep(4)}>
                    <Pencil size={12} className="mr-1" /> Edit
                  </Button>
                </div>
                <div className="p-4 text-sm">
                  <div className="flex items-center gap-2">
                    {deliveryType === 'pickup' ? <Warehouse className="w-4 h-4 text-primary" /> : <Truck className="w-4 h-4 text-primary" />}
                    <span className="font-semibold text-foreground capitalize">{deliveryType === 'pickup' ? 'Self Pickup' : 'Company Delivery'}</span>
                  </div>
                </div>
              </div>

              {/* Total Amount */}
              <div className="p-5 border-2 border-primary/20 rounded-xl bg-primary/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CircleDollarSign className="w-5 h-5 text-primary" />
                    <span className="font-semibold text-foreground">Total Amount Due</span>
                  </div>
                  <span className="text-2xl font-bold text-primary">
                    {formatCurrency(Number(orderQuantity) * selectedProduct?.currentPrice)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: COMPLETED SCREEN */}
          {step === 6 && placedOrder && (
            <div key="step-6" className="space-y-6 animate-fade-in">
              {/* Success Header */}
              <div className="flex flex-col items-center justify-center pt-8 gap-4 text-center">
                <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center text-success border border-success/20">
                  <CheckCircle size={32} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Order Created Successfully!</h2>
                  <p className="text-muted-foreground max-w-md mx-auto mt-2">
                    Order <span className="font-mono font-bold text-primary">{placedOrder.orderNumber}</span> has been processed and customer balance was updated.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 max-w-2xl mx-auto">
                {/* Virtual Account Card */}
                {paymentInfo?.accountNumber && (
                  <div className="border-2 border-success/20 rounded-xl bg-success/5 p-5 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-success/15 flex items-center justify-center text-success">
                        <Banknote size={16} />
                      </div>
                      <span className="font-bold text-sm text-foreground">Dedicated Payment Account</span>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Bank</p>
                        <p className="text-sm font-semibold text-foreground">{paymentInfo.bankName}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Account Number</p>
                        <div className="flex items-center gap-2">
                          <p className="text-xl font-bold font-mono text-foreground tracking-wider">{paymentInfo.accountNumber}</p>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(paymentInfo.accountNumber)
                              setCopied(true)
                              setTimeout(() => setCopied(false), 2000)
                            }}
                            className="h-7 w-7 rounded-md border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            title="Copy account number"
                          >
                            {copied ? <CheckCircle size={14} className="text-success" /> : <Copy size={14} />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Account Name</p>
                        <p className="text-sm font-semibold text-foreground">{formatAccountName(placedOrder.customer?.name)}</p>
                      </div>
                    </div>
                    <p className="text-[11px] text-success/80 leading-snug">Share this account number with the customer for payment.</p>
                  </div>
                )}

                {/* Notification Status Card */}
                <div className="border rounded-xl bg-card p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-info/15 flex items-center justify-center text-info">
                      <FileCheck size={16} />
                    </div>
                    <span className="font-bold text-sm text-foreground">Notifications Sent</span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center ${paymentInfo?.emailSent ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
                        <Mail size={16} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">Invoice Email</p>
                        <p className="text-xs text-muted-foreground">
                          {paymentInfo?.emailSent ? `Sent to ${placedOrder.customer?.email}` : 'No email on file - skipped'}
                        </p>
                      </div>
                      {paymentInfo?.emailSent ? (
                        <CheckCircle size={16} className="text-success" />
                      ) : (
                        <AlertCircle size={16} className="text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center ${paymentInfo?.smsSent ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
                        <Phone size={16} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">Order Summary SMS</p>
                        <p className="text-xs text-muted-foreground">
                          {paymentInfo?.smsSent ? `Sent to ${placedOrder.customer?.phone}` : 'SMS not sent'}
                        </p>
                      </div>
                      {paymentInfo?.smsSent ? (
                        <CheckCircle size={16} className="text-success" />
                      ) : (
                        <AlertCircle size={16} className="text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Summary */}
              <div className="max-w-2xl mx-auto border rounded-xl divide-y divide-border">
                <div className="p-4 flex items-center gap-2">
                  <Package className="w-4 h-4 text-primary" />
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Order Summary</span>
                </div>
                <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-xs text-muted-foreground block">Product</span>
                    <span className="font-semibold text-foreground">{placedOrder.product?.name || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">Quantity</span>
                    <span className="font-semibold text-foreground">{Number(placedOrder.quantity).toLocaleString()} {placedOrder.product?.unit || 'Liters'}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">Unit Price</span>
                    <span className="font-semibold text-foreground">{formatCurrency(placedOrder.price)}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">Total</span>
                    <span className="font-bold text-primary">{formatCurrency(placedOrder.totalAmount)}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2 pb-4">
                <Button variant="outline" onClick={resetWizard}>
                  <Plus className="w-4 h-4 mr-2" /> Place Another Order
                </Button>
                <Button className="gradient-primary text-white border-0" onClick={() => navigate({ to: '/orders' as any })}>
                  Go to Orders List <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

        </CardContent>

        {/* Footer Navigation */}
        {step <= 5 && (
          <CardFooter className="border-t border-border flex justify-between pt-4 bg-muted/20">
            <Button
              variant="outline"
              onClick={handlePrevStep}
              disabled={step === 1}
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
            </Button>
            {step === 5 ? (
              <Button
                className="gradient-primary text-white border-0 min-w-[140px]"
                onClick={handlePlaceOrder}
                disabled={createOrderMutation.isPending}
              >
                {createOrderMutation.isPending ? (
                  <><Loader2 size={16} className="animate-spin mr-2" />Processing...</>
                ) : (
                  'Place Order'
                )}
              </Button>
            ) : (
              <Button
                className="gradient-primary text-white border-0 min-w-[100px]"
                onClick={handleNextStep}
              >
                Next <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            )}
          </CardFooter>
        )}
      </Card>
    </div>
  )
}

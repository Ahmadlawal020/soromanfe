import { useState, useEffect } from 'react'
import { useCustomerList, useCreateCustomer } from '#/lib/hooks/useCustomers'
import { useCustomerLicenses, useCreateCustomerLicense } from '#/lib/hooks/useCustomerLicenses'
import { useDangoteProductsActive, useCreateDangoteOrderRequest } from '#/lib/hooks/useDangoteOrders'
import type { CustomerLicense } from '#/lib/types'

export function useDangoteOrderWizard() {
  const createCustomerMutation = useCreateCustomer()
  const createDangoteOrderRequestMutation = useCreateDangoteOrderRequest()
  const createLicenseMutation = useCreateCustomerLicense()

  const [step, setStep] = useState(1)
  const [errors, setErrors] = useState<string[]>([])

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

  // Step 2: Company & Licence
  const [selectedLicense, setSelectedLicense] = useState<CustomerLicense | null>(null)
  const [isAddingLicense, setIsAddingLicense] = useState(false)
  const [newLicenseForm, setNewLicenseForm] = useState({
    companyName: '',
    licenseUrl: '',
    licensePublicId: '',
    expiryDate: '',
  })

  // Step 3: Product
  const [selectedProduct, setSelectedProduct] = useState<any>(null)

  // Step 4: Quantity
  const [orderQuantity, setOrderQuantity] = useState('')
  const [quantityUnit, setQuantityUnit] = useState('Tons')

  // Step 5: Delivery
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [deliveryState, setDeliveryState] = useState('')
  const [deliveryLga, setDeliveryLga] = useState('')

  // Step 6: Completion
  const [placedRequest, setPlacedRequest] = useState<any>(null)

  // Sync quantity unit to selected product's unit
  useEffect(() => {
    if (selectedProduct?.unit) {
      setQuantityUnit(selectedProduct.unit)
    }
  }, [selectedProduct])

  // Debounce customer search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(customerSearch)
      setSearchPage(1)
    }, 300)
    return () => clearTimeout(handler)
  }, [customerSearch])

  // Reset licence selection when customer changes
  useEffect(() => {
    setSelectedLicense(null)
    setIsAddingLicense(false)
    setNewLicenseForm({ companyName: '', licenseUrl: '', licensePublicId: '', expiryDate: '' })
  }, [selectedCustomer])

  // Backend queries
  const { data: customerSearchData, isLoading: isSearchingCustomers } = useCustomerList(
    { search: debouncedSearch || undefined, limit: 20, page: searchPage },
    { enabled: debouncedSearch.trim().length >= 2 }
  )
  const customers = customerSearchData?.customers || []
  const totalCustomers = customerSearchData?.pagination?.total || 0
  const hasMore = customers.length < totalCustomers

  const customerId = selectedCustomer?._id || selectedCustomer?.id
  const { data: customerLicenses = [], isLoading: isLoadingLicenses } = useCustomerLicenses(customerId)

  // Filter licences: only show approved and pending (not rejected)
  const availableLicenses = customerLicenses.filter(
    (l) => l.status === 'approved' || l.status === 'pending'
  )

  const { data: dangoteProducts = [], isLoading: isLoadingProducts } = useDangoteProductsActive()

  const handleRegisterCustomer = async () => {
    setErrors([])
    if (!newCustomerForm.name || !newCustomerForm.phone) {
      setErrors(['Name and Phone Number are required'])
      return
    }
    const cleaned = newCustomerForm.phone.replace(/[\s\-()]/g, "")
    const isValid = /^(0|\+?234)\d{10}$/.test(cleaned) || /^8\d{9}$/.test(cleaned)
    if (!isValid) {
      setErrors(['Enter a valid Nigerian phone number (e.g. 08012345678)'])
      return
    }
    try {
      const response = await createCustomerMutation.mutateAsync(newCustomerForm)
      if (response.success && response.data?.customer) {
        setSelectedCustomer(response.data.customer)
        setIsRegisteringCustomer(false)
        setStep(2)
      } else {
        setErrors(['Failed to register customer'])
      }
    } catch (err: any) {
      setErrors([err?.response?.data?.message || err.message || 'Error registering customer'])
    }
  }

  const handleAddLicense = async () => {
    setErrors([])
    if (!newLicenseForm.companyName.trim()) {
      setErrors(['Company name is required'])
      return
    }
    if (!newLicenseForm.licenseUrl) {
      setErrors(['Please upload a licence file'])
      return
    }
    try {
      const cid = Number(customerId)
      const response = await createLicenseMutation.mutateAsync({
        customerId: cid,
        companyName: newLicenseForm.companyName.trim(),
        licenseUrl: newLicenseForm.licenseUrl,
        licensePublicId: newLicenseForm.licensePublicId,
        expiryDate: newLicenseForm.expiryDate || undefined,
      })
      if (response.success && response.data?.license) {
        setSelectedLicense(response.data.license)
        setIsAddingLicense(false)
        setNewLicenseForm({ companyName: '', licenseUrl: '', licensePublicId: '', expiryDate: '' })
      }
    } catch (err: any) {
      setErrors([err?.response?.data?.message || err.message || 'Failed to add licence'])
    }
  }

  const handlePlaceOrder = async () => {
    setErrors([])
    try {
      const payload = {
        customerId: customerId,
        companyName: selectedLicense?.companyName || '',
        licenseId: selectedLicense?.id || null,
        product: selectedProduct.name,
        quantity: Number(orderQuantity),
        quantityUnit,
        deliveryAddress,
        deliveryState,
        deliveryLga,
      }
      const response = await createDangoteOrderRequestMutation.mutateAsync(payload)
      if (response.success && response.data?.request) {
        setPlacedRequest(response.data.request)
        setStep(7)
      }
    } catch (err: any) {
      setErrors([err?.response?.data?.message || err.message || 'Failed to submit order request'])
    }
  }

  /**
   * Validation for a single step, independent of where the user currently is.
   *
   * Kept separate from navigation so the UI can group several steps onto one
   * screen and validate the whole group before advancing. Returns all error
   * messages, or an empty array when the step is satisfied.
   */
  const validateStep = (target: number): string[] => {
    const errs: string[] = []
    if (target === 1) {
      if (!selectedCustomer) errs.push('Please select an existing customer or register a new one')
      return errs
    }
    if (target === 2) {
      if (!selectedLicense) errs.push('Please select a company & licence or add a new one')
      return errs
    }
    if (target === 3) {
      if (!selectedProduct) errs.push('Please select a Dangote product')
      return errs
    }
    if (target === 4) {
      if (!orderQuantity || Number(orderQuantity) <= 0) errs.push('Please enter a valid quantity')
      return errs
    }
    if (target === 5) {
      if (!deliveryAddress.trim()) errs.push('Please enter the delivery address')
      return errs
    }
    return errs
  }

  const handleNextStep = () => {
    const stepErrors = validateStep(step)
    if (stepErrors.length > 0) {
      setErrors(stepErrors)
      return
    }
    setErrors([])
    if (step < 6) setStep(step + 1)
  }

  const handlePrevStep = () => {
    setErrors([])
    setStep(prev => Math.max(1, prev - 1))
  }

  const resetWizard = () => {
    setStep(1)
    setCustomerSearch('')
    setDebouncedSearch('')
    setIsSearchOpen(false)
    setSearchPage(1)
    setSelectedCustomer(null)
    setIsRegisteringCustomer(false)
    setSelectedLicense(null)
    setIsAddingLicense(false)
    setNewLicenseForm({ companyName: '', licenseUrl: '', licensePublicId: '', expiryDate: '' })
    setSelectedProduct(null)
    setOrderQuantity('')
    setQuantityUnit('Tons')
    setDeliveryAddress('')
    setDeliveryState('')
    setDeliveryLga('')
    setPlacedRequest(null)
    setErrors([])
  }

  return {
    step,
    setStep,
    errors,
    setErrors,
    validateStep,

    // Customer state
    customerSearch,
    setCustomerSearch,
    isSearchOpen,
    setIsSearchOpen,
    searchPage,
    setSearchPage,
    selectedCustomer,
    setSelectedCustomer,
    isRegisteringCustomer,
    setIsRegisteringCustomer,
    newCustomerForm,
    setNewCustomerForm,
    customers,
    totalCustomers,
    hasMore,
    isSearchingCustomers,
    createCustomerMutation,

    // Licence state
    selectedLicense,
    setSelectedLicense,
    isAddingLicense,
    setIsAddingLicense,
    newLicenseForm,
    setNewLicenseForm,
    customerLicenses: availableLicenses,
    isLoadingLicenses,
    createLicenseMutation,

    // Product state
    selectedProduct,
    setSelectedProduct,
    dangoteProducts,
    isLoadingProducts,

    // Quantity state
    orderQuantity,
    setOrderQuantity,
    quantityUnit,
    setQuantityUnit,

    // Delivery state
    deliveryAddress,
    setDeliveryAddress,
    deliveryState,
    setDeliveryState,
    deliveryLga,
    setDeliveryLga,

    // Completion state
    placedRequest,
    createDangoteOrderRequestMutation,

    // Handlers
    handleRegisterCustomer,
    handleAddLicense,
    handlePlaceOrder,
    handleNextStep,
    handlePrevStep,
    resetWizard,
  }
}

export type DangoteOrderWizardReturn = ReturnType<typeof useDangoteOrderWizard>

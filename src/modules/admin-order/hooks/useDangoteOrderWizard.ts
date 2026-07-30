import { useState, useEffect } from 'react'
import { useCustomerList, useCreateCustomer } from '#/lib/hooks/useCustomers'
import { useDangoteProductsActive, useCreateDangoteOrderRequest } from '#/lib/hooks/useDangoteOrders'

export function useDangoteOrderWizard() {
  const createCustomerMutation = useCreateCustomer()
  const createDangoteOrderRequestMutation = useCreateDangoteOrderRequest()

  const [step, setStep] = useState(1)
  const [error, setError] = useState('')

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

  // Step 2: Product
  const [selectedProduct, setSelectedProduct] = useState<any>(null)

  // Step 3: Quantity
  const [orderQuantity, setOrderQuantity] = useState('')
  const [quantityUnit, setQuantityUnit] = useState('Tons')

  // Step 4: Delivery
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [deliveryState, setDeliveryState] = useState('')
  const [deliveryLga, setDeliveryLga] = useState('')

  // Step 5: Completion
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

  // Backend queries
  const { data: customerSearchData, isLoading: isSearchingCustomers } = useCustomerList(
    { search: debouncedSearch || undefined, limit: 20, page: searchPage },
    { enabled: debouncedSearch.trim().length >= 2 }
  )
  const customers = customerSearchData?.customers || []
  const totalCustomers = customerSearchData?.pagination?.total || 0
  const hasMore = customers.length < totalCustomers

  const { data: dangoteProducts = [], isLoading: isLoadingProducts } = useDangoteProductsActive()

  const handleRegisterCustomer = async () => {
    setError('')
    if (!newCustomerForm.name || !newCustomerForm.phone) {
      setError('Name and Phone Number are required')
      return
    }
    const cleaned = newCustomerForm.phone.replace(/[\s\-()]/g, "")
    const isValid = /^(0|\+?234)\d{10}$/.test(cleaned) || /^8\d{9}$/.test(cleaned)
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
      const payload = {
        customerId: selectedCustomer._id || selectedCustomer.id,
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
        setStep(6)
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to submit order request')
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
      if (!selectedProduct) {
        setError('Please select a Dangote product')
        return
      }
      setStep(3)
    } else if (step === 3) {
      if (!orderQuantity || Number(orderQuantity) <= 0) {
        setError('Please enter a valid quantity')
        return
      }
      setStep(4)
    } else if (step === 4) {
      if (!deliveryAddress.trim()) {
        setError('Please enter the delivery address')
        return
      }
      setStep(5)
    }
  }

  const handlePrevStep = () => {
    setError('')
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
    setSelectedProduct(null)
    setOrderQuantity('')
    setQuantityUnit('Tons')
    setDeliveryAddress('')
    setDeliveryState('')
    setDeliveryLga('')
    setPlacedRequest(null)
    setError('')
  }

  return {
    step,
    error,

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
    handlePlaceOrder,
    handleNextStep,
    handlePrevStep,
    resetWizard,
  }
}

export type DangoteOrderWizardReturn = ReturnType<typeof useDangoteOrderWizard>

import { useState, useEffect } from 'react'
import { useCustomerList, useCreateCustomer } from '#/lib/hooks/useCustomers'
import { useDepots } from '#/lib/hooks/useDepots'
import { useCreateOrder } from '#/lib/hooks/useOrders'

export function useOrderWizard() {
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

  return {
    // Step state
    step,
    error,
    copied,
    setCopied,

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

    // Location & Depot state
    selectedState,
    setSelectedState,
    selectedDepot,
    setSelectedDepot,
    setSelectedProduct,
    stateDepots,
    isLoadingDepots,

    // Product state
    selectedProduct,
    orderQuantity,
    setOrderQuantity,

    // Delivery state
    deliveryType,
    setDeliveryType,

    // Completion state
    placedOrder,
    paymentInfo,
    createOrderMutation,

    // Handlers
    handleRegisterCustomer,
    handlePlaceOrder,
    handleNextStep,
    handlePrevStep,
    goToStep,
    resetWizard,
  }
}

export type OrderWizardReturn = ReturnType<typeof useOrderWizard>

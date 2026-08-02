import { useState, useEffect } from 'react'
import { useCustomerList, useCreateCustomer } from '#/lib/hooks/useCustomers'
import { useLpgStations } from '#/lib/hooks/useLpgStations'
import { useCreateLpgOrderRequest } from '#/lib/hooks/useLpgOrders'
import { nigeriaStates, nigeriaLgas } from '#/lib/nigeria-data'

export function useLpgOrderWizard() {
  const createCustomerMutation = useCreateCustomer()
  const createLpgOrderRequestMutation = useCreateLpgOrderRequest()

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

  // Step 2: Station (State → LGA → Station)
  const [selectedState, setSelectedState] = useState('')
  const [selectedLga, setSelectedLga] = useState('')
  const [selectedStation, setSelectedStation] = useState<any>(null)

  // Step 3: Cylinder
  const [selectedCylinderSizeKg, setSelectedCylinderSizeKg] = useState<number | null>(null)
  const [cylinderQuantity, setCylinderQuantity] = useState('')

  // Step 4: Delivery
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [deliveryState, setDeliveryState] = useState('')
  const [deliveryLga, setDeliveryLga] = useState('')

  // Step 5: Completion
  const [placedRequest, setPlacedRequest] = useState<any>(null)

  // Debounce customer search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(customerSearch)
      setSearchPage(1)
    }, 300)
    return () => clearTimeout(handler)
  }, [customerSearch])

  // Reset station/cylinder when state changes
  useEffect(() => {
    setSelectedLga('')
    setSelectedStation(null)
    setSelectedCylinderSizeKg(null)
    setCylinderQuantity('')
  }, [selectedState])

  // Reset cylinder when LGA changes
  useEffect(() => {
    setSelectedStation(null)
    setSelectedCylinderSizeKg(null)
    setCylinderQuantity('')
  }, [selectedLga])

  // Reset cylinder when station changes
  useEffect(() => {
    setSelectedCylinderSizeKg(null)
    setCylinderQuantity('')
  }, [selectedStation])

  // Backend queries
  const { data: customerSearchData, isLoading: isSearchingCustomers } = useCustomerList(
    { search: debouncedSearch || undefined, limit: 20, page: searchPage },
    { enabled: debouncedSearch.trim().length >= 2 }
  )
  const customers = customerSearchData?.customers || []
  const totalCustomers = customerSearchData?.pagination?.total || 0
  const hasMore = customers.length < totalCustomers

  const { data: allStations = [], isLoading: isLoadingStations } = useLpgStations({ limit: 100 })

  // Filter stations by state and LGA
  const stateStations = (allStations as any[]).filter((s: any) =>
    s.state?.toLowerCase().trim() === selectedState?.toLowerCase().trim() &&
    s.status === 'Active'
  )

  const lgaStations = selectedLga
    ? stateStations.filter((s: any) =>
        s.city?.toLowerCase().trim() === selectedLga?.toLowerCase().trim()
      )
    : stateStations

  // Get LGAs for the selected state
  const availableLgas = selectedState
    ? (nigeriaLgas[selectedState] || []).filter((lga: string) =>
        stateStations.some((s: any) => s.city?.toLowerCase().trim() === lga.toLowerCase().trim())
      )
    : []

  // Get available cylinder sizes from selected station
  const availableCylinders = selectedStation?.cylinders || []

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
        customerId: selectedCustomer?._id || selectedCustomer?.id,
        lpgStationId: selectedStation?.id,
        cylinderSizeKg: selectedCylinderSizeKg,
        cylinderQuantity: Number(cylinderQuantity),
        deliveryAddress,
        deliveryState: deliveryState || selectedState,
        deliveryLga: deliveryLga || selectedLga,
      }
      const response = await createLpgOrderRequestMutation.mutateAsync(payload)
      if (response.success && response.data?.request) {
        setPlacedRequest(response.data.request)
        setStep(6)
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to submit order request')
    }
  }

  const validateStep = (target: number): string | null => {
    if (target === 1) {
      if (!selectedCustomer) return 'Please select an existing customer or register a new one'
      return null
    }
    if (target === 2) {
      if (!selectedState) return 'Please select a state'
      if (!selectedStation) return 'Please select an LPG station'
      return null
    }
    if (target === 3) {
      if (!selectedCylinderSizeKg) return 'Please select a cylinder size'
      if (!cylinderQuantity || Number(cylinderQuantity) <= 0) return 'Please enter a valid quantity'
      return null
    }
    if (target === 4) {
      if (!deliveryAddress.trim()) return 'Please enter the delivery address'
      return null
    }
    return null
  }

  const handleNextStep = () => {
    const message = validateStep(step)
    if (message) {
      setError(message)
      return
    }
    setError('')
    if (step < 5) setStep(step + 1)
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
    setNewCustomerForm({ name: '', email: '', phone: '', companyName: '', address: '' })
    setSelectedState('')
    setSelectedLga('')
    setSelectedStation(null)
    setSelectedCylinderSizeKg(null)
    setCylinderQuantity('')
    setDeliveryAddress('')
    setDeliveryState('')
    setDeliveryLga('')
    setPlacedRequest(null)
    setError('')
  }

  return {
    step,
    setStep,
    error,
    setError,
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

    // Station state
    selectedState,
    setSelectedState,
    selectedLga,
    setSelectedLga,
    selectedStation,
    setSelectedStation,
    allStations,
    stateStations,
    lgaStations,
    availableLgas,
    isLoadingStations,

    // Cylinder state
    selectedCylinderSizeKg,
    setSelectedCylinderSizeKg,
    cylinderQuantity,
    setCylinderQuantity,
    availableCylinders,

    // Delivery state
    deliveryAddress,
    setDeliveryAddress,
    deliveryState,
    setDeliveryState,
    deliveryLga,
    setDeliveryLga,

    // Completion state
    placedRequest,
    createLpgOrderRequestMutation,

    // Handlers
    handleRegisterCustomer,
    handlePlaceOrder,
    handleNextStep,
    handlePrevStep,
    resetWizard,
  }
}

export type LpgOrderWizardReturn = ReturnType<typeof useLpgOrderWizard>

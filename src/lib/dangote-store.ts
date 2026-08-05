// Dangote Delivery Mock Store

export interface DangoteOrder {
  id: string
  plant: string
  product: string
  quantity: number
  quantityUnit: 'Tons' | 'Liters' | 'Bags'
  amount: number // in NGN (₦)
  customer: string
  driver: string
  truck: string
  ticketNo: string
  status: 'Authorized' | 'Open' | 'Complete' | 'Cancelled'
  createdDate: string
  deliveryAddress: string
  deliveryState?: string
  deliveryLga?: string
  pricePerUnit?: number
  deliveryPrice?: number
  expectedArrivalDate?: string
  approvedBy?: string
  approvedAt?: string
}

export interface DangoteOrderRequest {
  id: string
  customer: string
  plant: string
  product: string
  quantity: number
  quantityUnit: 'Tons' | 'Liters' | 'Bags'
  amount: number // in NGN (₦)
  deliveryAddress: string
  deliveryState?: string
  deliveryLga?: string
  paymentReference?: string
  paymentMode?: 'Bank Transfer' | 'Bank Draft' | 'Wallet'
  status: 'Pending Review' | 'Approved' | 'Rejected' | 'Cancelled' | 'Expired'
  createdDate: string
  pricePerUnit?: number
  deliveryPrice?: number
  expectedArrivalDate?: string
  reviewedBy?: string
  reviewedAt?: string
}

export interface DangotePayment {
  id: string
  customer: string
  orderRef: string
  amount: number
  bankName: string
  paymentDate: string
  status: 'Pending' | 'Verified' | 'Flagged'
  receiptUrl: string
  notes?: string
  verifiedBy?: string
  verifiedAt?: string
}

export interface DangoteDeposit {
  id: string
  customer: string
  amount: number
  reference: string
  paymentMode: 'Bank Transfer' | 'Bank Draft' | 'Wallet'
  bankName: string
  paymentDate: string
  status: 'Completed' | 'Pending' | 'Failed'
  description: string
}

// Initial Mock Data
const INITIAL_ORDERS: DangoteOrder[] = [
  {
    id: 'DNG-ORD-2026-001',
    plant: 'Ibese Cement Plant',
    product: '3X Cement (42.5R)',
    quantity: 45,
    quantityUnit: 'Tons',
    amount: 5400000,
    customer: 'Soroman Logistics Ltd',
    driver: 'Abubakar Garba',
    truck: 'KD-782-A3',
    ticketNo: 'DNG-LT-902123',
    status: 'Complete',
    createdDate: '2026-07-25',
    deliveryAddress: '12 Commercial Road, Apapa, Lagos',
    approvedBy: 'Finance Manager',
    approvedAt: '2026-07-25 10:00'
  },
  {
    id: 'DNG-ORD-2026-002',
    plant: 'Obajana Cement Plant',
    product: 'Falcon Cement (32.5R)',
    quantity: 60,
    quantityUnit: 'Tons',
    amount: 6900000,
    customer: 'Aliko Distributors Inc.',
    driver: 'Emeka Nwosu',
    truck: 'LSD-501-XY',
    ticketNo: 'DNG-LT-482012',
    status: 'Open',
    createdDate: '2026-07-27',
    deliveryAddress: 'Plot 45, Garki Area 11, Abuja',
    approvedBy: 'Finance Manager',
    approvedAt: '2026-07-27 14:30'
  }
]

const INITIAL_REQUESTS: DangoteOrderRequest[] = [
  {
    id: 'DNG-REQ-PETROL-001',
    customer: 'Katsina Agri-Cooperative',
    plant: 'Dangote Refinery',
    product: 'Petroleum (PMS)',
    quantity: 30000,
    quantityUnit: 'Liters',
    amount: 0, // Set to 0 initially since staff will set price per liter and delivery price during review
    deliveryAddress: 'Plot 12, Kaita-Katsina Road, Kaita',
    deliveryState: 'Katsina State',
    deliveryLga: 'Kaita LGA',
    status: 'Pending Review',
    createdDate: '2026-07-30'
  },
  {
    id: 'DNG-REQ-2026-101',
    customer: 'Mega Builders West Africa',
    plant: 'Obajana Cement Plant',
    product: '3X Cement (42.5R)',
    quantity: 45,
    quantityUnit: 'Tons',
    amount: 5400000,
    deliveryAddress: '32 Broad Street, Marina, Lagos',
    deliveryState: 'Lagos State',
    deliveryLga: 'Lagos Island LGA',
    status: 'Approved',
    createdDate: '2026-07-30',
    pricePerUnit: 120000,
    deliveryPrice: 0,
    expectedArrivalDate: '2026-08-01',
    reviewedBy: 'Staff Auditor',
    reviewedAt: '2026-07-30 08:00'
  },
  {
    id: 'DNG-REQ-2026-102',
    customer: 'Gbagada Cement Hub',
    plant: 'Ibese Cement Plant',
    product: 'Falcon Cement (32.5R)',
    quantity: 30,
    quantityUnit: 'Tons',
    amount: 3450000,
    deliveryAddress: '15 Diya Street, Gbagada, Lagos',
    deliveryState: 'Lagos State',
    deliveryLga: 'Kosofe LGA',
    status: 'Approved',
    createdDate: '2026-07-30',
    pricePerUnit: 115000,
    deliveryPrice: 0,
    expectedArrivalDate: '2026-08-03',
    reviewedBy: 'Staff Auditor',
    reviewedAt: '2026-07-30 08:15'
  }
]

const INITIAL_PAYMENTS: DangotePayment[] = [
  {
    id: 'DNG-PAY-2026-201',
    customer: 'Gbagada Cement Hub',
    orderRef: 'DNG-REQ-2026-102',
    amount: 3450000,
    bankName: 'Access Bank',
    paymentDate: '2026-07-30',
    status: 'Pending',
    receiptUrl: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    notes: 'Payment for 30 Tons Falcon Cement'
  }
]

const INITIAL_DEPOSITS: DangoteDeposit[] = [
  {
    id: 'DNG-DEP-001',
    customer: 'Mega Builders West Africa',
    amount: 5400000,
    reference: 'REF-BANK-99882',
    paymentMode: 'Bank Transfer',
    bankName: 'Guaranty Trust Bank',
    paymentDate: '2026-07-30',
    status: 'Completed',
    description: 'Advance Deposit: Cement Order Request DNG-REQ-2026-101'
  }
]

// Local Storage keys
const KEY_ORDERS = 'soroman_dangote_orders'
const KEY_REQUESTS = 'soroman_dangote_requests'
const KEY_PAYMENTS = 'soroman_dangote_payments'
const KEY_DEPOSITS = 'soroman_dangote_deposits'

const isBrowser = typeof window !== 'undefined'

export const DangoteStore = {
  getOrders(): DangoteOrder[] {
    if (!isBrowser) return INITIAL_ORDERS
    const data = localStorage.getItem(KEY_ORDERS)
    if (!data) {
      localStorage.setItem(KEY_ORDERS, JSON.stringify(INITIAL_ORDERS))
      return INITIAL_ORDERS
    }
    return JSON.parse(data)
  },

  saveOrders(orders: DangoteOrder[]) {
    if (isBrowser) {
      localStorage.setItem(KEY_ORDERS, JSON.stringify(orders))
    }
  },

  getRequests(): DangoteOrderRequest[] {
    if (!isBrowser) return INITIAL_REQUESTS
    const data = localStorage.getItem(KEY_REQUESTS)
    if (!data) {
      localStorage.setItem(KEY_REQUESTS, JSON.stringify(INITIAL_REQUESTS))
      return INITIAL_REQUESTS
    }
    return JSON.parse(data)
  },

  saveRequests(requests: DangoteOrderRequest[]) {
    if (isBrowser) {
      localStorage.setItem(KEY_REQUESTS, JSON.stringify(requests))
    }
  },

  getPayments(): DangotePayment[] {
    if (!isBrowser) return INITIAL_PAYMENTS
    const data = localStorage.getItem(KEY_PAYMENTS)
    if (!data) {
      localStorage.setItem(KEY_PAYMENTS, JSON.stringify(INITIAL_PAYMENTS))
      return INITIAL_PAYMENTS
    }
    return JSON.parse(data)
  },

  savePayments(payments: DangotePayment[]) {
    if (isBrowser) {
      localStorage.setItem(KEY_PAYMENTS, JSON.stringify(payments))
    }
  },

  getDeposits(): DangoteDeposit[] {
    if (!isBrowser) return INITIAL_DEPOSITS
    const data = localStorage.getItem(KEY_DEPOSITS)
    if (!data) {
      localStorage.setItem(KEY_DEPOSITS, JSON.stringify(INITIAL_DEPOSITS))
      return INITIAL_DEPOSITS
    }
    return JSON.parse(data)
  },

  saveDeposits(deposits: DangoteDeposit[]) {
    if (isBrowser) {
      localStorage.setItem(KEY_DEPOSITS, JSON.stringify(deposits))
    }
  },

  addOrder(order: Omit<DangoteOrder, 'id' | 'createdDate'>) {
    const orders = this.getOrders()
    const newOrder: DangoteOrder = {
      ...order,
      id: `DNG-ORD-2026-00${orders.length + 1}`,
      createdDate: new Date().toISOString().split('T')[0],
    }
    orders.unshift(newOrder)
    this.saveOrders(orders)
    return newOrder
  },

  addRequest(request: Omit<DangoteOrderRequest, 'id' | 'createdDate'>) {
    const requests = this.getRequests()
    const newRequest: DangoteOrderRequest = {
      ...request,
      id: `DNG-REQ-2026-10${requests.length + 1}`,
      createdDate: new Date().toISOString().split('T')[0],
    }
    requests.unshift(newRequest)
    this.saveRequests(requests)
    return newRequest
  },

  reviewRequest(requestId: string, pricePerUnit: number, deliveryPrice: number, expectedArrivalDate: string, staffName: string = 'Staff Auditor') {
    const requests = this.getRequests()
    const reqIndex = requests.findIndex((r) => r.id === requestId)
    if (reqIndex !== -1) {
      const req = requests[reqIndex]
      const totalAmount = (req.quantity * pricePerUnit) + deliveryPrice

      req.pricePerUnit = pricePerUnit
      req.deliveryPrice = deliveryPrice
      req.expectedArrivalDate = expectedArrivalDate
      req.amount = totalAmount
      req.status = 'Approved'
      req.reviewedBy = staffName
      req.reviewedAt = new Date().toISOString().replace('T', ' ').substring(0, 16)

      this.saveRequests(requests)

      // Automatically spawn the loading order
      this.approveRequest(requestId, staffName)
    }
  },

  approveRequest(requestId: string, adminName: string = 'System Admin') {
    const requests = this.getRequests()
    const reqIndex = requests.findIndex((r) => r.id === requestId)
    if (reqIndex !== -1) {
      requests[reqIndex].status = 'Approved'
      this.saveRequests(requests)

      const req = requests[reqIndex]
      const orders = this.getOrders()

      const drivers = ['Shehu Danjuma', 'Ifeanyi Okafor', 'Kabiru Sani', 'Adebayo Alao']
      const trucks = ['KD-331-AB', 'LA-882-XY', 'KB-101-NG', 'FC-990-ZA']
      const randomDriver = drivers[Math.floor(Math.random() * drivers.length)]
      const randomTruck = trucks[Math.floor(Math.random() * trucks.length)]
      const randomTicket = `DNG-LT-${Math.floor(100000 + Math.random() * 900000)}`

      const newOrder: DangoteOrder = {
        id: req.id.includes('PETROL') ? `DNG-ORD-PETROL-${Math.floor(100 + Math.random() * 900)}` : `DNG-ORD-2026-0${orders.length + 1}`,
        plant: req.plant,
        product: req.product,
        quantity: req.quantity,
        quantityUnit: req.quantityUnit || 'Tons',
        amount: req.amount,
        customer: req.customer,
        driver: randomDriver,
        truck: randomTruck,
        ticketNo: randomTicket,
        status: 'Authorized',
        createdDate: new Date().toISOString().split('T')[0],
        deliveryAddress: req.deliveryAddress,
        deliveryState: req.deliveryState,
        deliveryLga: req.deliveryLga,
        pricePerUnit: req.pricePerUnit,
        deliveryPrice: req.deliveryPrice,
        expectedArrivalDate: req.expectedArrivalDate,
        approvedBy: adminName,
        approvedAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
      }
      orders.unshift(newOrder)
      this.saveOrders(orders)
    }
  },

  verifyPayment(paymentId: string, adminName: string = 'Finance Manager') {
    const payments = this.getPayments()
    const payIndex = payments.findIndex((p) => p.id === paymentId)
    if (payIndex !== -1) {
      payments[payIndex].status = 'Verified'
      payments[payIndex].verifiedBy = adminName
      payments[payIndex].verifiedAt = new Date().toISOString().replace('T', ' ').substring(0, 16)
      this.savePayments(payments)

      const payment = payments[payIndex]
      this.approveRequest(payment.orderRef, adminName)
    }
  },

  flagPayment(paymentId: string, notes: string = 'Verification failed', adminName: string = 'Finance Manager') {
    const payments = this.getPayments()
    const payIndex = payments.findIndex((p) => p.id === paymentId)
    if (payIndex !== -1) {
      payments[payIndex].status = 'Flagged'
      payments[payIndex].notes = notes
      payments[payIndex].verifiedBy = adminName
      payments[payIndex].verifiedAt = new Date().toISOString().replace('T', ' ').substring(0, 16)
      this.savePayments(payments)

      const payment = payments[payIndex]
      const requests = this.getRequests()
      const reqIndex = requests.findIndex((r) => r.id === payment.orderRef)
      if (reqIndex !== -1) {
        requests[reqIndex].status = 'Rejected'
        this.saveRequests(requests)
      }
    }
  }
}

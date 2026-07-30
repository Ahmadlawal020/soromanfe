import { Button } from '#/components/ui/button'
import {
  AlertCircle,
  User,
  MapPin,
  Package,
  Truck,
  Warehouse,
  FileCheck,
  Pencil,
  CircleDollarSign,
} from 'lucide-react'
import { formatCurrency } from '../utils/formatters'
import type { OrderWizardReturn } from '../hooks/useOrderWizard'

interface ReviewStepProps {
  wizard: OrderWizardReturn
}

export function ReviewStep({ wizard }: ReviewStepProps) {
  const {
    selectedCustomer,
    selectedState,
    selectedDepot,
    selectedProduct,
    orderQuantity,
    deliveryType,
    goToStep,
  } = wizard

  return (
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
  )
}

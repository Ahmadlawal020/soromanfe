import {
  User,
  Package,
  MapPin,
  Truck,
  CircleDollarSign,
} from 'lucide-react'
import type { DangoteOrderWizardReturn } from '../../hooks/useDangoteOrderWizard'

interface DangoteReviewStepProps {
  wizard: DangoteOrderWizardReturn
}

export function DangoteReviewStep({ wizard }: DangoteReviewStepProps) {
  const {
    selectedCustomer,
    selectedProduct,
    orderQuantity,
    quantityUnit,
    deliveryAddress,
    deliveryState,
    deliveryLga,
  } = wizard

  return (
    <div key="dangote-step-5" className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          <CircleDollarSign size={18} />
        </div>
        <div>
          <h2 className="text-lg font-bold">Review Order Request</h2>
          <p className="text-sm text-muted-foreground">Review the details before submitting your Dangote delivery order request.</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Customer */}
        <div className="p-4 border rounded-xl bg-muted/30">
          <div className="flex items-center gap-2 mb-3">
            <User className="text-primary w-4 h-4" />
            <span className="font-bold text-sm">Customer</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-muted-foreground block">Name</span>
              <span className="font-medium">{selectedCustomer?.name}</span>
            </div>
            <div>
              <span className="text-muted-foreground block">Company</span>
              <span className="font-medium">{selectedCustomer?.companyName || '—'}</span>
            </div>
            <div>
              <span className="text-muted-foreground block">Phone</span>
              <span className="font-medium">{selectedCustomer?.phone}</span>
            </div>
            <div>
              <span className="text-muted-foreground block">Email</span>
              <span className="font-medium">{selectedCustomer?.email || '—'}</span>
            </div>
          </div>
        </div>

        {/* Product */}
        <div className="p-4 border rounded-xl bg-muted/30">
          <div className="flex items-center gap-2 mb-3">
            <Package className="text-primary w-4 h-4" />
            <span className="font-bold text-sm">Product</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-muted-foreground block">Product</span>
              <span className="font-medium">{selectedProduct?.name}</span>
            </div>
            <div>
              <span className="text-muted-foreground block">Category</span>
              <span className="font-medium">{selectedProduct?.category}</span>
            </div>
            <div>
              <span className="text-muted-foreground block">Grade</span>
              <span className="font-medium">{selectedProduct?.gradeClass || 'N/A'}</span>
            </div>
            <div>
              <span className="text-muted-foreground block">Supplier</span>
              <span className="font-medium">{selectedProduct?.supplier || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Quantity */}
        <div className="p-4 border rounded-xl bg-muted/30">
          <div className="flex items-center gap-2 mb-3">
            <Truck className="text-primary w-4 h-4" />
            <span className="font-bold text-sm">Quantity</span>
          </div>
          <div className="text-xs">
            <span className="text-muted-foreground block">Order Quantity</span>
            <span className="font-bold text-lg text-foreground">{Number(orderQuantity).toLocaleString()} {quantityUnit}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Pricing will be set during admin review.
          </p>
        </div>

        {/* Delivery */}
        <div className="p-4 border rounded-xl bg-muted/30">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="text-primary w-4 h-4" />
            <span className="font-bold text-sm">Delivery Location</span>
          </div>
          <div className="text-xs">
            <span className="text-muted-foreground block">Address</span>
            <span className="font-medium">{deliveryAddress}</span>
            {(deliveryState || deliveryLga) && (
              <p className="text-muted-foreground mt-1">
                {deliveryState}{deliveryLga ? `, ${deliveryLga}` : ''}
              </p>
            )}
          </div>
        </div>

        {/* Notice */}
        <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
          <p className="text-sm text-primary">
            <strong>Note:</strong> Once submitted, the customer will receive a notification confirming that their order request has been received and is under review. They will be notified again once the request is approved with pricing details.
          </p>
        </div>
      </div>
    </div>
  )
}

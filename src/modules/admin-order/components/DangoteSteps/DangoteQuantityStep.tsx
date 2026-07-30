import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import {
  CircleDollarSign,
  Package,
} from 'lucide-react'
import type { DangoteOrderWizardReturn } from '../../hooks/useDangoteOrderWizard'

interface DangoteQuantityStepProps {
  wizard: DangoteOrderWizardReturn
}

export function DangoteQuantityStep({ wizard }: DangoteQuantityStepProps) {
  const {
    selectedProduct,
    orderQuantity,
    setOrderQuantity,
    quantityUnit,
  } = wizard

  return (
    <div key="dangote-step-3" className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          <CircleDollarSign size={18} />
        </div>
        <div>
          <h2 className="text-lg font-bold">Quantity & Amount</h2>
          <p className="text-sm text-muted-foreground">Set the quantity for your Dangote delivery order.</p>
        </div>
      </div>

      {/* Selected Product Summary */}
      <div className="p-4 border rounded-xl bg-muted/30 space-y-2">
        <div className="flex items-center gap-2 border-b border-border pb-2">
          <Package className="text-primary w-4 h-4" />
          <span className="font-bold text-sm">Selected Product</span>
        </div>
        <div className="flex items-center gap-3">
          <div>
            <p className="font-semibold text-sm text-foreground">{selectedProduct?.name}</p>
            <p className="text-xs text-muted-foreground">{selectedProduct?.category} &bull; {selectedProduct?.unit}</p>
          </div>
        </div>
      </div>

      {/* Quantity Input */}
      <div className="p-5 border-2 border-primary/25 rounded-xl bg-primary/5 space-y-4 shadow-sm">
        <div className="flex items-center gap-3 pb-3 border-b border-primary/20">
          <div className="h-9 w-9 rounded-lg bg-primary/15 flex items-center justify-center text-primary">
            <CircleDollarSign className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-base text-foreground">Order Details</span>
            <p className="text-xs text-muted-foreground">Enter the quantity for your Dangote delivery order.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Quantity *</Label>
            <Input
              type="number"
              placeholder="e.g. 45"
              value={orderQuantity}
              onChange={(e) => setOrderQuantity(e.target.value)}
              min="1"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Unit</Label>
            <div className="w-full h-10 px-3 rounded-md border border-input bg-muted/50 text-sm flex items-center text-muted-foreground">
              {quantityUnit || selectedProduct?.unit || 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">Unit is determined by the selected product.</p>
          </div>
        </div>
        {orderQuantity && Number(orderQuantity) > 0 && (
          <div className="p-3 rounded-lg bg-card border border-border">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Order Quantity</span>
              <span className="font-bold text-foreground">{Number(orderQuantity).toLocaleString()} {quantityUnit}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Pricing will be set during admin review. You will receive a confirmation email with the final price.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

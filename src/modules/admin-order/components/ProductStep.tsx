import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Badge } from '#/components/ui/badge'
import {
  Package,
  CircleDollarSign,
} from 'lucide-react'
import { formatCurrency } from '../utils/formatters'
import type { OrderWizardReturn } from '../hooks/useOrderWizard'

interface ProductStepProps {
  wizard: OrderWizardReturn
}

export function ProductStep({ wizard }: ProductStepProps) {
  const {
    selectedDepot,
    selectedProduct,
    setSelectedProduct,
    orderQuantity,
    setOrderQuantity,
  } = wizard

  return (
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
  )
}

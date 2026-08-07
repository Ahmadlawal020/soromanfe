import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Badge } from '#/components/ui/badge'
import { ChoiceCard, ChoiceGrid, ChoiceMeta } from '#/components/ui/choice-card'
import { cn } from '#/lib/utils'
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

  const prices: any[] = selectedDepot?.productPrices ?? []
  const unit = selectedProduct?.product?.unit || 'Litres'
  const qty = Number(orderQuantity || 0)
  const total = selectedProduct ? qty * selectedProduct.currentPrice : 0

  const stockFor = (entry: any) =>
    selectedDepot?.productCapacities?.find(
      (c: any) => (c.product?._id || c.product?.id) === (entry.product?._id || entry.product?.id),
    )?.capacity ?? 0

  const stock = selectedProduct ? stockFor(selectedProduct) : 0
  // The wizard's own validation refuses to advance past this, so the warning
  // says blocked rather than merely discouraged.
  const overStock = qty > 0 && stock > 0 && qty > stock

  if (prices.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-foreground/20 p-6 text-center text-sm text-muted-foreground">
        This depot has no priced products yet. Set a price under Product Pricing before ordering
        from it.
      </p>
    )
  }

  return (
    <div className="space-y-5">
      <ChoiceGrid>
        {prices.map((entry: any, idx: number) => {
          const remaining = stockFor(entry)
          const selected = selectedProduct?.product?._id === entry.product?._id
          return (
            <ChoiceCard
              key={idx}
              selected={selected}
              onSelect={() => setSelectedProduct(entry)}
              title={entry.product?.name || 'Unknown'}
              subtitle={
                <span className="flex items-center gap-1.5">
                  {entry.product?.category}
                  {entry.product?.sku && (
                    <Badge variant="outline" className="font-mono text-xs">
                      {entry.product.sku}
                    </Badge>
                  )}
                </span>
              }
              meta={
                <>
                  <ChoiceMeta
                    label="In stock"
                    value={`${remaining.toLocaleString()} ${entry.product?.unit || 'L'}`}
                    tone={remaining === 0 ? 'text-muted-foreground' : undefined}
                  />
                  <ChoiceMeta
                    label="Unit price"
                    align="right"
                    value={formatCurrency(entry.currentPrice)}
                    tone="text-accent"
                  />
                </>
              }
            />
          )
        })}
      </ChoiceGrid>

      {/* Quantity only appears once there is a product to price it against —
          an empty box above an unchosen product is just noise. */}
      {selectedProduct && (
        <div className="space-y-2">
          <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
            <div className="space-y-1.5">
              <Label htmlFor="order-qty">Quantity ({unit})</Label>
              <Input
                id="order-qty"
                type="number"
                min="1"
                inputMode="numeric"
                placeholder="e.g. 5000"
                value={orderQuantity}
                onChange={(e) => setOrderQuantity(e.target.value)}
                aria-invalid={overStock || undefined}
                aria-describedby="order-total"
              />
            </div>

            {/* The number the desk is actually deciding on, kept beside the
                input rather than boxed away in its own panel. */}
            <div
              id="order-total"
              className="rounded-lg border border-foreground/15 px-4 py-2.5 sm:min-w-[13rem]"
            >
              <span className="block text-xs text-muted-foreground">
                {qty > 0 ? `${qty.toLocaleString()} × ${formatCurrency(selectedProduct.currentPrice)}` : 'Order total'}
              </span>
              <span className="block text-lg font-semibold">
                {formatCurrency(total)}
              </span>
            </div>
          </div>

          <p className={cn('text-xs', overStock ? 'text-warning' : 'text-muted-foreground')}>
            {overStock
              ? `Only ${stock.toLocaleString()} ${unit} in stock at ${selectedDepot?.name} — reduce the quantity to continue.`
              : `${stock.toLocaleString()} ${unit} available at ${selectedDepot?.name}.`}
          </p>
        </div>
      )}
    </div>
  )
}

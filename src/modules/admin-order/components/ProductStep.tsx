import { useLayoutEffect, useRef, useState } from 'react'

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

/** Digits only — what the wizard stores and every Number() call reads. */
const digitsOnly = (v: string) => v.replace(/\D/g, '')

/** Display form. Empty stays empty so the placeholder still shows. */
const formatQty = (raw: string) => {
  const d = digitsOnly(raw)
  return d ? Number(d).toLocaleString('en-NG') : ''
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

  const stockFor = (entry: any) => {
    const pId = entry.product?._id || entry.product?.id || entry.productId
    const match = selectedDepot?.productCapacities?.find(
      (c: any) => String(c.product?._id || c.product?.id || c.productId) === String(pId)
    )
    return Number(match?.availableStock ?? 0)
  }

  /**
   * Comma formatting is display-only.
   *
   * `orderQuantity` stays raw digits because the wizard runs it through
   * Number() for validation, the capacity check and the submitted payload —
   * Number("45,000") is NaN, which would place a broken order rather than
   * fail loudly.
   */
  const qtyRef = useRef<HTMLInputElement>(null)
  const [caret, setCaret] = useState<number | null>(null)

  const onQtyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const el = e.target
    // Count digits to the left of the caret, not characters: reformatting
    // moves the commas around, and a character index would drift past them.
    const digitsBefore = digitsOnly(el.value.slice(0, el.selectionStart ?? 0)).length
    const raw = digitsOnly(el.value)
    setOrderQuantity(raw)

    // Where that same digit sits once the commas are re-inserted.
    const formatted = formatQty(raw)
    let seen = 0
    let pos = formatted.length
    for (let i = 0; i < formatted.length; i += 1) {
      if (/\d/.test(formatted[i])) seen += 1
      if (seen === digitsBefore) { pos = i + 1; break }
    }
    setCaret(digitsBefore === 0 ? 0 : pos)
  }

  // Restore the caret after React has painted the reformatted value, or it
  // jumps to the end on every keystroke.
  useLayoutEffect(() => {
    if (caret != null && qtyRef.current) {
      qtyRef.current.setSelectionRange(caret, caret)
      setCaret(null)
    }
  }, [caret])

  const stock = selectedProduct ? stockFor(selectedProduct) : 0
  const isOutOfStock = stock <= 0
  // The wizard's own validation refuses to advance past this, so the warning
  // says blocked rather than merely discouraged.
  const overStock = qty > 0 && (isOutOfStock || qty > stock)

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
                  {/* PFI stock — hidden on the product picker on request.
                  <ChoiceMeta
                    label="In stock"
                    value={
                      remaining > 0
                        ? `${remaining.toLocaleString()} ${entry.product?.unit || 'L'}`
                        : '0 (No active PFI)'
                    }
                    tone={remaining === 0 ? 'text-destructive' : undefined}
                  /> */}
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
          {/*
            Laid out as the sum it is: quantity × unit price = total.

            It used to be a full-width input beside a bordered total, which put
            two boxes of different heights next to each other and stretched a
            five-digit field across the panel. The field is now sized to what
            gets typed into it, and the total is type rather than another box.
          */}
          <div className="flex flex-wrap items-end gap-x-4 gap-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="order-qty">Quantity</Label>
              <div className="relative w-44">
                <Input
                  ref={qtyRef}
                  id="order-qty"
                  // text, not number: a number input refuses to display commas,
                  // and 45000 is genuinely hard to read at a glance. inputMode
                  // still brings up the numeric keypad on a phone.
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="45,000"
                  value={formatQty(orderQuantity)}
                  onChange={onQtyChange}
                  aria-invalid={overStock || undefined}
                  aria-describedby="order-total"
                  // Room on the right for the unit, so the label above stays
                  // just "Quantity" instead of "Quantity (Litres)".
                  className="pr-12 text-right"
                />
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground"
                >
                  {unit === 'Litres' ? 'L' : unit}
                </span>
              </div>
            </div>

            <div className="flex items-end gap-4 pb-2">
              <span className="text-sm text-muted-foreground">×</span>
              <div>
                <span className="block text-xs text-muted-foreground">Unit price</span>
                <span className="block text-sm">{formatCurrency(selectedProduct.currentPrice)}</span>
              </div>
              <span className="text-sm text-muted-foreground">=</span>
            </div>

            <div id="order-total" className="pb-1.5">
              <span className="block text-xs text-muted-foreground">Order total</span>
              <span
                className={cn(
                  'block text-2xl leading-none font-semibold tracking-[-0.02em]',
                  qty > 0 ? 'text-foreground' : 'text-muted-foreground/50',
                )}
              >
                {formatCurrency(total)}
              </span>
            </div>
          </div>

          <p className={cn('text-xs', isOutOfStock ? 'text-destructive' : overStock ? 'text-warning' : 'text-muted-foreground')}>
            {isOutOfStock
              ? `This product is out of stock at ${selectedDepot?.name} (no active PFI stock assigned).`
              : overStock
              ? `Only ${stock.toLocaleString()} ${unit} in stock (from assigned PFIs) at ${selectedDepot?.name} — reduce the quantity to continue.`
              : `${stock.toLocaleString()} ${unit} available in stock at ${selectedDepot?.name}.`}
          </p>
        </div>
      )}
    </div>
  )
}

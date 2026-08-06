import { Badge } from '#/components/ui/badge'
import {
  Loader2,
  Layers,
} from 'lucide-react'
import { ChoiceCard, ChoiceGrid, ChoiceMeta } from '#/components/ui/choice-card'
import type { DangoteOrderWizardReturn } from '../../hooks/useDangoteOrderWizard'

interface DangoteProductStepProps {
  wizard: DangoteOrderWizardReturn
}

export function DangoteProductStep({ wizard }: DangoteProductStepProps) {
  const {
    selectedProduct,
    setSelectedProduct,
    dangoteProducts,
    isLoadingProducts,
  } = wizard

  if (isLoadingProducts) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {!dangoteProducts || dangoteProducts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-foreground/20 p-8 text-center">
          <p className="text-sm">No Dangote products available</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Add them under Dangote Products before raising a request.
          </p>
        </div>
      ) : (
        <ChoiceGrid>
          {dangoteProducts.map((product: any) => {
            const productId = product._id || product.id
            const selected = Boolean(
              selectedProduct && (selectedProduct._id || selectedProduct.id) === productId,
            )
            return (
              <ChoiceCard
                key={productId}
                selected={selected}
                onSelect={() => setSelectedProduct(product)}
                icon={<Layers />}
                title={product.name}
                subtitle={
                  <span className="flex flex-wrap items-center gap-1.5">
                    {product.category}
                    {product.sku && (
                      <Badge variant="outline" className="font-mono text-xs">{product.sku}</Badge>
                    )}
                  </span>
                }
                meta={
                  product.gradeClass ? (
                    <>
                      <ChoiceMeta label="Grade" value={product.gradeClass} />
                      {product.description && (
                        <span className="max-w-[60%] text-right text-xs text-muted-foreground line-clamp-2">
                          {product.description}
                        </span>
                      )}
                    </>
                  ) : undefined
                }
              />
            )
          })}
        </ChoiceGrid>
      )}
    </div>
  )
}

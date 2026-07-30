import { Badge } from '#/components/ui/badge'
import {
  Package,
  Loader2,
  Layers,
  Flame,
} from 'lucide-react'
import type { DangoteOrderWizardReturn } from '../../hooks/useDangoteOrderWizard'

interface DangoteProductStepProps {
  wizard: DangoteOrderWizardReturn
}

const categoryColors: Record<string, string> = {
  'PMS (Premium Motor Spirit)': 'from-primary to-[#7ed3bf]',
  'AGO (Automotive Gas Oil)': 'from-success to-[#6ec89a]',
  'DPK (Dual Purpose Kerosene)': 'from-warning to-amber-400',
  'Jet A-1 (Aviation Fuel)': 'from-sky-500 to-sky-400',
  'LPG (Liquefied Petroleum Gas)': 'from-info to-cyan-400',
  'LPFO / Heavy Fuel Oil': 'from-destructive to-rose-400',
  'Lubricants & Base Oils': 'from-violet-500 to-violet-400',
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
        <Loader2 size={24} className="animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div key="dangote-step-2" className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          <Package size={18} />
        </div>
        <div>
          <h2 className="text-lg font-bold">Dangote Delivery Product Selection</h2>
          <p className="text-sm text-muted-foreground">Choose a Dangote product for the delivery order request.</p>
        </div>
      </div>

      {!dangoteProducts || dangoteProducts.length === 0 ? (
        <div className="p-10 text-center border border-dashed rounded-xl">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-muted border border-border mb-3">
            <Package size={20} className="text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">No Dangote products available</p>
          <p className="text-xs text-muted-foreground mt-1">Contact admin to add Dangote products.</p>
        </div>
      ) : (
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
          {dangoteProducts.map((product: any) => {
            const productId = product._id || product.id
            const isSelected = selectedProduct && (selectedProduct._id || selectedProduct.id) === productId

            return (
              <div
                key={productId}
                onClick={() => setSelectedProduct(product)}
                className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 flex flex-col justify-between ${isSelected
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'hover:bg-muted/50 hover:border-muted-foreground/20 border-border'
                  }`}
              >
                <div>
                  <div className="flex justify-between items-start">
                    <p className="font-bold text-sm text-foreground">{product.name}</p>
                    <Badge variant="outline" className="text-[10px] uppercase font-mono">{product.sku}</Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className={`h-5 w-5 rounded-md bg-gradient-to-br ${categoryColors[product.category] || 'from-gray-400 to-gray-300'} flex items-center justify-center`}>
                      <Layers className="h-2.5 w-2.5 text-white" />
                    </div>
                    <span className="text-xs text-muted-foreground">{product.category}</span>
                  </div>
                  {product.description && (
                    <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{product.description}</p>
                  )}
                </div>
                {product.gradeClass && (
                <div className="flex justify-between items-end mt-4 pt-3 border-t border-border">
                  <div className="flex items-center gap-1.5">
                    <Flame className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Grade</span>
                  </div>
                  <Badge className="bg-success text-success-foreground text-xs">{product.gradeClass}</Badge>
                </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

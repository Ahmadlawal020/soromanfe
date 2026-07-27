import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { Fuel, Layers, ArrowLeft, Edit, Trash2, AlertOctagon, Scale, Thermometer, ShieldAlert, Archive, Truck, AlertCircle, Loader2, Warehouse } from 'lucide-react'
import { useProductDetails, useDeleteProduct } from '#/lib/hooks/useProducts'
import { useDepots } from '#/lib/hooks/useDepots'

export const Route = createFileRoute('/products/details')({
  validateSearch: (search: Record<string, unknown>) => ({
    id: (search.id as string) || '',
  }),
  component: ProductDetailPage,
})

function ProductDetailPage() {
  const navigate = useNavigate()
  const { id } = Route.useSearch()
  const { data: product, isLoading: isLoadingProduct } = useProductDetails(id)
  const { data: depots = [], isLoading: isLoadingDepots } = useDepots()
  const deleteProduct = useDeleteProduct()

  const isLoading = isLoadingProduct || isLoadingDepots

  const handleBack = () => {
    window.history.length > 1 ? window.history.back() : navigate({ to: '/products/' as any })
  }

  const handleDelete = async () => {
    if (!product?._id) return
    if (confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteProduct.mutateAsync(product._id)
        navigate({ to: '/products/' as any })
      } catch {
        // Error handling is done via react-query
      }
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={32} className="animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-5 text-center">
        <div className="h-16 w-16 rounded-full bg-warning/10 flex items-center justify-center text-warning border border-warning/20"><AlertCircle size={32} /></div>
        <h2 className="text-2xl font-bold text-foreground">No Product Selected</h2>
        <p className="text-muted-foreground max-w-sm">Please select a product from the directory to view its details.</p>
        <Button onClick={() => navigate({ to: '/products/' as any })}><ArrowLeft size={16} /> Back to Inventory</Button>
      </div>
    )
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



  const getSingularUnit = (unit?: string) => {
    switch (unit) {
      case 'Liters': return 'Liter'
      case 'Metric Tonnes': return 'Metric Tonne'
      case 'Kilograms': return 'Kilogram'
      case 'Barrels': return 'Barrel'
      case 'US Gallons': return 'Gallon'
      default: return 'Liter'
    }
  }

  const getUnitAbbreviation = (unit?: string) => {
    switch (unit) {
      case 'Liters': return 'L'
      case 'Metric Tonnes': return 'MT'
      case 'Kilograms': return 'kg'
      case 'Barrels': return 'bbl'
      case 'US Gallons': return 'Gal'
      default: return 'L'
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={handleBack}><ArrowLeft size={16} /></Button>
          <div><h1 className="text-3xl font-bold text-foreground">Product Details</h1><p className="text-muted-foreground">View specifications, inventory levels, and hazard ratings</p></div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate({ to: '/products/form', search: { id: product._id } })}><Edit size={16} /> Edit</Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleteProduct.isPending}>
            {deleteProduct.isPending ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />} Delete
          </Button>
        </div>
      </header>

      <Card className="card-hover">
        <CardContent className="p-6 md:p-8 bg-gradient-to-r from-primary/5 to-success/5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${categoryColors[product.category] || 'from-gray-400 to-gray-300'} flex items-center justify-center text-white shadow-lg`}><Fuel size={36} /></div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2"><Badge variant="outline" className="font-mono text-xs">{product.sku}</Badge><Badge className="bg-success text-success-foreground text-xs">{product.gradeClass}</Badge></div>
              <h2 className="text-2xl font-bold text-foreground mt-2">{product.name}</h2>
              <p className="text-muted-foreground mt-1.5 max-w-2xl text-sm leading-relaxed">{product.description || 'No description provided.'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="border-b border-border"><div className="flex items-center gap-2"><div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary"><Scale size={16} /></div><div><CardTitle className="text-sm">Technical Specifications</CardTitle><p className="text-xs text-muted-foreground">Quality & chemical specs</p></div></div></CardHeader>
          <CardContent className="space-y-4">
            <div><p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Density</p><p className="text-sm text-foreground mt-0.5">{product.density || 'N/A'}</p></div>
            <div><p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Flash Point</p><p className="text-sm text-foreground mt-0.5 flex items-center gap-1"><Thermometer size={14} className="text-muted-foreground" />{product.flashPoint || 'N/A'}</p></div>
            <div><p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Quality Grade</p><p className="text-sm text-foreground mt-0.5">{product.gradeClass || 'N/A'}</p></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b border-border"><div className="flex items-center gap-2"><div className="h-8 w-8 rounded-lg bg-destructive/10 flex items-center justify-center text-destructive"><ShieldAlert size={16} /></div><div><CardTitle className="text-sm">Safety & Regulation</CardTitle><p className="text-xs text-muted-foreground">Hazard & storage info</p></div></div></CardHeader>
          <CardContent className="space-y-4">
            <div><p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">UN Number</p><p className="text-sm font-mono text-foreground mt-0.5 bg-muted border border-border px-2 py-0.5 rounded w-fit text-xs font-semibold">{product.unNumber || 'N/A'}</p></div>
            <div><p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Hazard Classification</p><p className="text-sm text-foreground mt-0.5 flex items-center gap-1.5"><AlertOctagon size={14} className="text-destructive shrink-0" />{product.hazardClass || 'N/A'}</p></div>
            <div><p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Category</p><p className="text-sm text-foreground mt-0.5 flex items-center gap-1.5"><Layers size={14} className="text-muted-foreground" />{product.category || 'N/A'}</p></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b border-border"><div className="flex items-center gap-2"><div className="h-8 w-8 rounded-lg bg-success/10 flex items-center justify-center text-success"><Archive size={16} /></div><div><CardTitle className="text-sm">Commercial & Unit Info</CardTitle><p className="text-xs text-muted-foreground">Measurement unit & supplier</p></div></div></CardHeader>
          <CardContent className="space-y-4">
            <div><p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Measurement Unit</p><p className="text-sm text-foreground mt-0.5">{product.unit || 'Liters'}</p></div>
            <div><p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Primary Supplier</p><p className="text-sm text-foreground mt-0.5 flex items-center gap-1.5"><Truck size={14} className="text-muted-foreground" />{product.supplier || 'N/A'}</p></div>
          </CardContent>
        </Card>
      </div>

      {(() => {
        const prodId = product._id || (product as any).id
        const supportingDepots = depots.filter((d: any) =>
          (d.productCapacities || []).some((pc: any) => String(pc.product?._id || pc.product?.id || pc.productId) === String(prodId)) ||
          (d.productPrices || []).some((pp: any) => String(pp.product?._id || pp.product?.id || pp.productId) === String(prodId))
        ).map((d: any) => {
          const capInfo = (d.productCapacities || []).find((pc: any) => String(pc.product?._id || pc.product?.id || pc.productId) === String(prodId));
          const priceInfo = (d.productPrices || []).find((pp: any) => String(pp.product?._id || pp.product?.id || pp.productId) === String(prodId));
          return {
            id: d.id,
            name: d.name,
            code: d.code,
            city: d.city,
            state: d.state,
            capacity: capInfo ? capInfo.capacity : 0,
            price: priceInfo ? priceInfo.currentPrice : null,
            rawDepot: d,
          };
        });

        return (
          <Card className="mt-6">
            <CardHeader className="border-b border-border">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-info/10 flex items-center justify-center text-info">
                  <Warehouse size={16} />
                </div>
                <div>
                  <CardTitle className="text-sm">Supporting Depots & Pricing</CardTitle>
                  <p className="text-xs text-muted-foreground">Depot allocation, storage capacity, and regional prices</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {supportingDepots.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  No depots are currently configured to support this product.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
                      <tr>
                        <th className="px-6 py-3 font-semibold">Depot Name</th>
                        <th className="px-6 py-3 font-semibold">Location</th>
                        <th className="px-6 py-3 font-semibold text-right">Storage Capacity</th>
                        <th className="px-6 py-3 font-semibold text-right">Current Price</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {supportingDepots.map((depot) => (
                        <tr key={depot.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-6 py-4 font-medium text-foreground">
                            <button
                              onClick={() => navigate({ to: '/depots/details' as any, state: { depot: depot.rawDepot } } as any)}
                              className="flex items-center gap-2 hover:text-primary transition-colors text-left"
                            >
                              <span>{depot.name}</span>
                              <Badge variant="outline" className="font-mono text-[10px] py-0 px-1.5">{depot.code}</Badge>
                            </button>
                          </td>
                          <td className="px-6 py-4 text-muted-foreground">
                            {depot.city}, {depot.state}
                          </td>
                          <td className="px-6 py-4 text-right font-mono text-foreground font-medium">
                            {depot.capacity.toLocaleString()} {getUnitAbbreviation(product.unit)}
                          </td>
                          <td className="px-6 py-4 text-right font-mono font-bold text-foreground">
                            {depot.price !== null ? (
                              `₦${depot.price.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / ${getSingularUnit(product.unit)}`
                            ) : (
                              <span className="text-muted-foreground font-normal">N/A</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })()}
    </div>
  )
}

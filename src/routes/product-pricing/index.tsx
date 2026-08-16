import { useState, useMemo } from 'react'
import { PageHeader } from '#/components/PageHeader'
import { createFileRoute } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import { CommaInput } from '#/components/ui/comma-input'
import { Label } from '#/components/ui/label'
import { Badge } from '#/components/ui/badge'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '#/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '#/components/ui/dialog'
import { Pencil, Power, Loader2, CheckCircle, Fuel, Warehouse } from 'lucide-react'
import { useDepots, useUpdateDepotProductPrices, useToggleDepotStatus } from '#/lib/hooks/useDepots'
import { useProductList } from '#/lib/hooks/useProducts'
import { PageLoader } from '#/components/PageLoader'
import { PageError } from '#/components/PageError'
import { PageEmpty } from '#/components/PageEmpty'
import { routeGuard } from '#/lib/route-guard'

export const Route = createFileRoute('/product-pricing/')({
  beforeLoad: () => routeGuard('/product-pricing'),
  component: ProductPricingPage,
})

interface ProductItem {
  id: string
  name: string
  sku?: string
  category?: string
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'Active':
      return <Badge className="bg-accent/15 text-accent border-accent/20">Active</Badge>
    case 'High Capacity':
      return <Badge className="bg-warning/15 text-warning border-warning/20">High Capacity</Badge>
    case 'Maintenance':
    case 'Suspended':
      return <Badge variant="destructive">Suspended</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

function ProductPricingPage() {
  // Determine if user can edit prices (super_admin, admin, or finance)
  const isReadOnly = false // allow logged-in users to manage unless restricted

  const { data: depots = [], isLoading: isLoadingDepots, isError, error, refetch } = useDepots()
  const { data: productsResponse, isLoading: isLoadingProducts } = useProductList({ productType: 'soroman' })

  const updatePricesMutation = useUpdateDepotProductPrices()
  const toggleStatusMutation = useToggleDepotStatus()

  const [editingDepot, setEditingDepot] = useState<any | null>(null)
  const [tempPrices, setTempPrices] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  // Only products that appear on the Products page (productType: soroman)
  // are shown here — depot pricing entries for other product types (e.g.
  // Dangote products) are intentionally not surfaced as pricing columns.
  const allProducts = useMemo(() => {
    const globalProducts = productsResponse?.products || []
    const list: ProductItem[] = globalProducts.map((p: any) => ({
      id: String(p.id || p._id),
      name: p.name,
      sku: p.sku,
      category: p.category,
    }))

    // Sort products logically (Petrol/PMS first, Diesel/AGO second, Kerosene/DPK third, then rest)
    return list.sort((a, b) => {
      const nameA = a.name.toLowerCase()
      const nameB = b.name.toLowerCase()
      if (nameA.includes('petrol') || nameA.includes('pms')) return -1
      if (nameB.includes('petrol') || nameB.includes('pms')) return 1
      if (nameA.includes('diesel') || nameA.includes('ago')) return -1
      if (nameB.includes('diesel') || nameB.includes('ago')) return 1
      return nameA.localeCompare(nameB)
    })
  }, [productsResponse])

  // Open Edit Dialog for a depot
  const openEdit = (depot: any) => {
    const prices: Record<string, string> = {}

    allProducts.forEach((prod) => {
      const existingPrice = (depot.productPrices || []).find((pp: any) => {
        const ppId = String(pp.productId || pp.product?._id || pp.product?.id)
        return ppId === prod.id || pp.productName?.toLowerCase() === prod.name.toLowerCase()
      })
      if (existingPrice) {
        prices[prod.id] = String(existingPrice.currentPrice ?? '')
      } else {
        prices[prod.id] = ''
      }
    })

    setTempPrices(prices)
    setEditingDepot(depot)
  }

  // Handle Save Prices
  const handleSave = async () => {
    if (!editingDepot) return
    setSaving(true)
    try {
      // A blank or zero price means "not priced at this location" — the
      // backend rejects a price of 0 (it would make orders free there), so
      // those products are simply left out of the payload rather than sent
      // as 0. Only products with an actual price greater than zero are saved.
      const productPricesPayload = allProducts
        .filter((p) => {
          const raw = tempPrices[p.id]
          if (raw === undefined || raw.trim() === '') return false
          const num = parseFloat(raw)
          return !isNaN(num) && num > 0
        })
        .map((p) => ({
          product: p.id,
          currentPrice: parseFloat(tempPrices[p.id]),
        }))

      await updatePricesMutation.mutateAsync({
        depotId: editingDepot.id,
        productPrices: productPricesPayload,
      })

      setEditingDepot(null)
      setTempPrices({})
    } catch {
      // Error notification handled by mutation
    } finally {
      setSaving(false)
    }
  }

  // Handle Toggle Status
  const handleToggleStatus = (depot: any) => {
    // The backend's depot status enum is Active / Maintenance / High Capacity
    // — there is no "Suspended" value. "Maintenance" is what the "Suspend"
    // action actually sets; getStatusBadge displays it as "Suspended".
    const newStatus = depot.status === 'Active' ? 'Maintenance' : 'Active'
    toggleStatusMutation.mutate({ depotId: depot.id, status: newStatus })
  }

  const isLoading = isLoadingDepots || isLoadingProducts

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        eyebrow="Operations"
        title="Depot Product Pricing"
        description="Current selling price per product at each depot hub."
      />

      {isLoading ? (
        <PageLoader message="Loading depot product prices..." />
      ) : isError ? (
        <PageError message={(error as any)?.message || 'Failed to load depots'} onRetry={() => refetch()} />
      ) : depots.length === 0 ? (
        <PageEmpty
          icon={<Warehouse className="size-8 text-muted-foreground" />}
          title="No depots configured"
          description="Create depots in the Depots module first."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {depots.map((depot: any) => {
            // Create lookup map for depot's prices
            const priceMap = new Map<string, number>()
            ;(depot.productPrices || []).forEach((pp: any) => {
              const pid = String(pp.productId || pp.product?._id || pp.product?.id)
              priceMap.set(pid, pp.currentPrice)
              if (pp.productName) {
                priceMap.set(pp.productName.toLowerCase(), pp.currentPrice)
              }
            })

            return (
              <Card key={depot.id} className="flex flex-col">
                <CardHeader className="border-b border-border pb-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="font-semibold text-foreground">{depot.name}</CardTitle>
                      <CardDescription className="mt-0.5 flex flex-wrap items-center gap-x-1.5">
                        {depot.code && <span className="font-mono">{depot.code}</span>}
                        {(depot.city || depot.state) && (
                          <span>
                            {depot.code && '·'} {depot.city}
                            {depot.city && depot.state ? `, ${depot.state}` : depot.state}
                          </span>
                        )}
                      </CardDescription>
                    </div>
                    {getStatusBadge(depot.status)}
                  </div>
                </CardHeader>

                <CardContent className="flex-1">
                  {allProducts.length === 0 ? (
                    <p className="py-2 text-sm text-muted-foreground">No products configured yet.</p>
                  ) : (
                    <div className="divide-y divide-border">
                      {allProducts.map((prod) => {
                        const price = priceMap.get(prod.id) ?? priceMap.get(prod.name.toLowerCase())
                        const hasPrice = price !== undefined && price !== null && !isNaN(price) && Number(price) > 0

                        return (
                          <div key={prod.id} className="flex items-center justify-between gap-4 py-2 first:pt-0 last:pb-0">
                            <div>
                              <span className="text-sm text-foreground">{prod.name}</span>
                              {prod.sku && <span className="block text-xs text-muted-foreground font-mono">SKU: {prod.sku}</span>}
                            </div>
                            {hasPrice ? (
                              <span className="font-semibold text-foreground font-mono text-sm whitespace-nowrap">
                                ₦{Number(price).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground/50 italic whitespace-nowrap">Not priced</span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>

                {!isReadOnly && (
                  <CardFooter className="gap-2 border-t border-border pt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-1.5"
                      onClick={() => openEdit(depot)}
                    >
                      <Pencil className="size-3.5" /> Edit prices
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`gap-1.5 ${
                        depot.status === 'Active'
                          ? 'text-destructive hover:text-destructive/80 hover:bg-destructive/10'
                          : 'text-accent hover:text-accent/80 hover:bg-accent/10'
                      }`}
                      onClick={() => handleToggleStatus(depot)}
                    >
                      <Power className="size-3.5" />
                      {depot.status === 'Active' ? 'Suspend' : 'Activate'}
                    </Button>
                  </CardFooter>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {/* Edit Prices Modal Dialog */}
      <Dialog
        open={!!editingDepot}
        onOpenChange={(open) => {
          if (!open) {
            setEditingDepot(null)
            setTempPrices({})
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Fuel className="size-5 text-primary" />
              Edit Depot Prices — {editingDepot?.name}
            </DialogTitle>
            <DialogDescription>
              Set current selling price per unit for each product at this depot location. Leave a product blank or at 0 if it isn't priced here.
            </DialogDescription>
          </DialogHeader>

          {editingDepot && (
            <div className="space-y-4 py-3 max-h-[60svh] overflow-y-auto pr-1">
              {allProducts.map((product) => (
                <div key={product.id} className="flex items-center justify-between gap-4 p-3 rounded-lg border border-border bg-muted/20">
                  <div>
                    <Label className="text-sm font-semibold text-foreground">{product.name}</Label>
                    {product.sku && (
                      <span className="block text-xs text-muted-foreground font-mono">
                        SKU: {product.sku}
                      </span>
                    )}
                  </div>

                  <div className="relative w-40">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-mono font-normal">
                      ₦
                    </span>
                    <CommaInput
                      className="pl-8 h-10 text-right font-mono font-semibold text-base"
                      placeholder="Not priced"
                      value={tempPrices[product.id] ?? ''}
                      onValueChange={(val) =>
                        setTempPrices((prev) => ({ ...prev, [product.id]: val }))
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border">
            <Button
              variant="outline"
              onClick={() => {
                setEditingDepot(null)
                setTempPrices({})
              }}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle className="size-4" />}
              {saving ? 'Saving…' : 'Save Prices'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

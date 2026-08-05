import { useState, useMemo } from 'react'
import { FilterBar } from '#/components/FilterBar'
import { PageHeader } from '#/components/PageHeader'
import { StatCard } from '#/components/ui/stat-card'
import { createFileRoute } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { CommaInput } from '#/components/ui/comma-input'
import { Label } from '#/components/ui/label'
import { Badge } from '#/components/ui/badge'
import { Card, CardContent } from '#/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '#/components/ui/dialog'
import { Search, Pencil, Power, Loader2, CheckCircle, Fuel, Warehouse, Tag, X } from 'lucide-react'
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
  const { data: productsResponse, isLoading: isLoadingProducts } = useProductList()

  const updatePricesMutation = useUpdateDepotProductPrices()
  const toggleStatusMutation = useToggleDepotStatus()

  const [searchQuery, setSearchQuery] = useState('')
  const [editingDepot, setEditingDepot] = useState<any | null>(null)
  const [tempPrices, setTempPrices] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  // Consolidate all available products from global list and depot pricing entries
  const allProducts = useMemo(() => {
    const map = new Map<string, ProductItem>()

    // Add global products
    const globalProducts = productsResponse?.products || []
    globalProducts.forEach((p: any) => {
      const pid = String(p.id || p._id)
      map.set(pid, { id: pid, name: p.name, sku: p.sku, category: p.category })
    })

    // Add products from depot prices if any missing
    depots.forEach((d: any) => {
      (d.productPrices || []).forEach((pp: any) => {
        const pid = String(pp.productId || pp.product?._id || pp.product?.id || pp.id)
        const name = pp.productName || pp.product?.name || 'Unknown Product'
        if (!map.has(pid)) {
          map.set(pid, { id: pid, name, sku: pp.productSku || pp.product?.sku })
        }
      })
    })

    // Sort products logically (Petrol/PMS first, Diesel/AGO second, Kerosene/DPK third, then rest)
    const list = Array.from(map.values())
    return list.sort((a, b) => {
      const nameA = a.name.toLowerCase()
      const nameB = b.name.toLowerCase()
      if (nameA.includes('petrol') || nameA.includes('pms')) return -1
      if (nameB.includes('petrol') || nameB.includes('pms')) return 1
      if (nameA.includes('diesel') || nameA.includes('ago')) return -1
      if (nameB.includes('diesel') || nameB.includes('ago')) return 1
      return nameA.localeCompare(nameB)
    })
  }, [productsResponse, depots])

  // Filter depots based on search query
  const filteredDepots = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return depots
    return depots.filter((d: any) =>
      d.name?.toLowerCase().includes(q) ||
      d.code?.toLowerCase().includes(q) ||
      d.city?.toLowerCase().includes(q) ||
      d.state?.toLowerCase().includes(q) ||
      (d.productPrices || []).some((pp: any) => (pp.productName || pp.product?.name || '').toLowerCase().includes(q))
    )
  }, [depots, searchQuery])

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
      const productPricesPayload = allProducts
        .filter((p) => tempPrices[p.id] !== undefined && tempPrices[p.id] !== '')
        .map((p) => ({
          product: p.id,
          currentPrice: parseFloat(tempPrices[p.id]) || 0,
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
    const newStatus = depot.status === 'Active' ? 'Suspended' : 'Active'
    toggleStatusMutation.mutate({ depotId: depot.id, status: newStatus })
  }

  // Calculate top summary stats
  const activeCount = useMemo(() => depots.filter((d: any) => d.status === 'Active').length, [depots])

  const isLoading = isLoadingDepots || isLoadingProducts

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <PageHeader
      eyebrow="Operations"
      title="Depot Product Pricing"
      description="View and manage real-time fuel and product prices across all depot hubs."
    />

      {/* Stats Cards */}
      {!isLoading && !isError && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard icon={<Warehouse />} label="Total Depots" value={depots.length} description={`${activeCount} Active Hubs`} />

          <StatCard icon={<Tag />} label="Products Priced" value={allProducts.length} description="Configured Products" />

          <StatCard icon={<Fuel />} label="Priced Depot Entries" value={depots.reduce((acc: number, d: any) => acc + (d.productPrices?.length || 0), 0)} description="Active Depot Prices" />
        </div>
      )}

      {/* Main Pricing Table Container */}
      <FilterBar>
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
        placeholder="Search depot or location…"
        className="pl-9 pr-9"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
        <button
        onClick={() => setSearchQuery('')}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
        <X className="size-4" />
        </button>
        )}
        </div>
      </FilterBar>

      <Card>
        

        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8">
              <PageLoader message="Loading depot product prices..." />
            </div>
          ) : isError ? (
            <div className="p-8">
              <PageError message={(error as any)?.message || 'Failed to load depots'} onRetry={() => refetch()} />
            </div>
          ) : filteredDepots.length === 0 ? (
            <div className="p-8">
              <PageEmpty
                icon={<Fuel className="size-8 text-muted-foreground" />}
                title={searchQuery ? 'No depots found' : 'No depots configured'}
                description={searchQuery ? 'Try adjusting your search criteria.' : 'Create depots in the Depots module first.'}
                hasFilters={!!searchQuery}
                onClearFilters={() => setSearchQuery('')}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 text-xs uppercase font-semibold text-muted-foreground">
                    <TableHead className="w-12 text-center">#</TableHead>
                    <TableHead className="min-w-[160px]">Depot / Hub</TableHead>
                    <TableHead className="min-w-[120px]">Location</TableHead>
                    <TableHead className="w-28">Status</TableHead>

                    {/* Dynamic Header for each Product */}
                    {allProducts.map((prod) => (
                      <TableHead key={prod.id} className="text-right min-w-[130px]">
                        <span className="font-semibold text-foreground">{prod.name}</span>
                        {prod.sku && <span className="block text-xs text-muted-foreground font-normal">SKU: {prod.sku}</span>}
                      </TableHead>
                    ))}

                    <TableHead className="text-center w-36">Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filteredDepots.map((depot: any, idx: number) => {
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
                      <TableRow key={depot.id} className="hover:bg-muted/40 transition-colors duration-250 ease-luxe">
                        <TableCell className="text-center text-xs text-muted-foreground font-mono">
                          {idx + 1}
                        </TableCell>

                        <TableCell>
                          <div className="font-semibold text-foreground">{depot.name}</div>
                          {depot.code && (
                            <span className="text-xs text-muted-foreground font-mono">
                              {depot.code}
                            </span>
                          )}
                        </TableCell>

                        <TableCell className="text-sm text-muted-foreground">
                          {depot.city || depot.state ? (
                            <span>
                              {depot.city}
                              {depot.city && depot.state ? `, ${depot.state}` : depot.state}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/50">—</span>
                          )}
                        </TableCell>

                        <TableCell>{getStatusBadge(depot.status)}</TableCell>

                        {/* Render Price Cell for each Product */}
                        {allProducts.map((prod) => {
                          const price = priceMap.get(prod.id) ?? priceMap.get(prod.name.toLowerCase())
                          const hasPrice = price !== undefined && price !== null && !isNaN(price)

                          return (
                            <TableCell key={prod.id} className="text-right whitespace-nowrap">
                              {hasPrice ? (
                                <span className="font-semibold text-foreground font-mono text-sm">
                                  ₦{Number(price).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                                </span>
                              ) : (
                                <span className="text-muted-foreground/40 text-sm font-mono">—</span>
                              )}
                            </TableCell>
                          )
                        })}

                        {/* Action Buttons */}
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            {!isReadOnly && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2 text-primary hover:text-primary/80 hover:bg-primary/10 gap-1 text-xs"
                                onClick={() => openEdit(depot)}
                              >
                                <Pencil className="size-3.5" /> Edit
                              </Button>
                            )}

                            {!isReadOnly && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className={`h-8 px-2 gap-1 text-xs ${
                                  depot.status === 'Active'
                                    ? 'text-destructive hover:text-destructive/80 hover:bg-destructive/10'
                                    : 'text-accent hover:text-accent/80 hover:bg-accent/10'
                                }`}
                                onClick={() => handleToggleStatus(depot)}
                              >
                                <Power className="size-3.5" />
                                {depot.status === 'Active' ? 'Suspend' : 'Activate'}
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

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
              Set current selling price per unit for each product at this depot location.
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
                      placeholder="0.00"
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

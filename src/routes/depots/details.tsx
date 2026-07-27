import { useState } from 'react'
import { createFileRoute, useNavigate, useRouter } from '@tanstack/react-router'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '#/components/ui/card'
import { Input } from '#/components/ui/input'
import {
  Warehouse, MapPin, User, ArrowLeft, Edit, Trash2, BookOpen, Calendar, Activity, AlertCircle, Loader2, DollarSign, Check, X, ChevronUp, TrendingUp, TrendingDown, History, Clock, FileText
} from 'lucide-react'
import type { DepotItem } from './index'
import { useDeleteDepot, useUpdateProductPrice, useDepotDetails } from '#/lib/hooks/useDepots'
import { usePfiList } from '#/lib/hooks/usePfis'
import { useToast } from '#/lib/hooks/useToast'

export const Route = createFileRoute('/depots/details')({
  component: DepotDetailPage,
})

function getStatusBadge(status: string) {
  switch (status) {
    case 'Active': return <Badge className="bg-success text-success-foreground">{status}</Badge>
    case 'High Capacity': return <Badge className="bg-warning text-warning-foreground">{status}</Badge>
    case 'Maintenance': return <Badge variant="destructive">{status}</Badge>
    default: return <Badge variant="outline">{status}</Badge>
  }
}



function DepotDetailPage() {
  const navigate = useNavigate()
  const router = useRouter()
  const deleteDepot = useDeleteDepot()
  const updatePrice = useUpdateProductPrice()
  const toast = useToast()
  const search = (Route.useSearch() as any) || {}
  const stateDepot = (router.history.location.state as any)?.depot as DepotItem | undefined
  const depotId = search?.id || stateDepot?.id || ''

  const { data: fetchedDepot, isLoading: isLoadingDepot } = useDepotDetails(depotId)
  const depot = fetchedDepot || stateDepot

  const [editingProductId, setEditingProductId] = useState<string | null>(null)
  const [editPrice, setEditPrice] = useState('')
  const [expandedHistory, setExpandedHistory] = useState<string | null>(null)
  const [localPrices, setLocalPrices] = useState<DepotItem['productPrices']>(undefined)


  const activeDepotId = (depot as any)?._id || (depot as any)?.id || depotId
  const { data: pfisData, isLoading: isLoadingPfis } = usePfiList({ location: activeDepotId })
  const pfis = pfisData?.pfis || []

  const handleBack = () => { window.history.length > 1 ? window.history.back() : navigate({ to: '/depots/' as any }) }
  const handleDelete = async () => {
    if (confirm('Are you sure you want to remove this depot?') && activeDepotId) {
      try { await deleteDepot.mutateAsync(activeDepotId); navigate({ to: '/depots/' as any }) }
      catch { toast.error('Failed to delete depot') }
    }
  }

  if (isLoadingDepot && !depot) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-5 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading depot details...</p>
      </div>
    )
  }

  if (!depot) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-5 text-center">
        <div className="h-16 w-16 rounded-full bg-warning/10 flex items-center justify-center text-warning border border-warning/20"><AlertCircle size={32} /></div>
        <h2 className="text-2xl font-bold text-foreground">No Depot Selected</h2>
        <p className="text-muted-foreground max-w-sm">Please select a depot from the directory to view its details.</p>
        <Button onClick={() => navigate({ to: '/depots/' as any })}><ArrowLeft size={16} /> Back to Depots</Button>
      </div>
    )
  }

  const staffList = (depot.staff || (depot as any).staffIds || []) as any[]

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={handleBack}><ArrowLeft size={16} /></Button>
          <div><h1 className="text-3xl font-bold text-foreground">Depot Details</h1><p className="text-muted-foreground">View hub info, assigned staff, cargo requests, and management details</p></div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate({ to: '/depots/form', state: { depot, isEdit: true } as any })}><Edit size={16} /> Edit</Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleteDepot.isPending}><Trash2 size={16} /> {deleteDepot.isPending ? 'Deleting...' : 'Delete'}</Button>
        </div>
      </header>

      <Card className="card-hover">
        <CardContent className="p-6 md:p-8 bg-gradient-to-r from-primary/5 to-success/5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center text-primary-foreground shadow-lg shrink-0"><Warehouse size={36} /></div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2"><Badge variant="outline" className="font-mono text-xs">Code: {depot.code}</Badge>{getStatusBadge(depot.status)}</div>
              <h2 className="text-2xl font-bold text-foreground mt-2">{depot.name}</h2>
              <p className="text-muted-foreground mt-1.5 text-sm flex items-center gap-1.5"><MapPin size={14} className="shrink-0" />{depot.address}, {depot.city}, {depot.state} {depot.postcode}, {depot.country}</p>
            </div>
          </div>
        </CardContent>
      </Card>


      <div className="grid gap-4 md:grid-cols-2">


        <Card>
          <CardHeader className="border-b border-border"><div className="flex items-center gap-2"><div className="h-8 w-8 rounded-lg bg-info/10 flex items-center justify-center text-info"><User size={16} /></div><div><CardTitle className="text-sm">Assigned Staff</CardTitle><CardDescription className="text-xs">Personnel & operations</CardDescription></div></div></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Staff Members</p>
              <div className="mt-1 flex flex-wrap gap-2">
                {staffList.length > 0 ? (
                  staffList.map((s) => {
                    const sId = s._id || s.adminId || s.id
                    const fn = s.firstName || s.first_name || ''
                    const sn = s.surname || s.last_name || ''
                    const initials = (fn[0] || '') + (sn[0] || '')
                    const fullName = `${fn} ${sn}`.trim() || s.full_name || s.email || 'Staff'
                    return (
                      <div key={sId} className="flex items-center gap-1.5 bg-secondary px-2.5 py-1 rounded-full text-sm">
                        <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                          {initials || '?'}
                        </div>
                        <span className="text-foreground">{fullName}</span>
                      </div>
                    )
                  })
                ) : (
                  <span className="text-sm text-muted-foreground">No staff assigned</span>
                )}
              </div>
            </div>
            <div><p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Status</p><div className="mt-1">{getStatusBadge(depot.status)}</div></div>
            <div><p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Operating Hours</p><p className="text-sm text-foreground mt-0.5 flex items-center gap-1.5"><Activity size={14} className="text-muted-foreground" />24 / 7</p></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b border-border"><div className="flex items-center gap-2"><div className="h-8 w-8 rounded-lg bg-success/10 flex items-center justify-center text-success"><MapPin size={16} /></div><div><CardTitle className="text-sm">Location & Address</CardTitle><CardDescription className="text-xs">Geographic hub coordinates</CardDescription></div></div></CardHeader>
          <CardContent className="space-y-4">
            <div><p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Street Address</p><p className="text-sm text-foreground mt-0.5">{depot.address}</p></div>
            <div className="grid grid-cols-2 gap-4"><div><p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">LGA / City</p><p className="text-sm text-foreground mt-0.5">{depot.city}</p></div><div><p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">State</p><p className="text-sm text-foreground mt-0.5">{depot.state}</p></div></div>
            <div className="grid grid-cols-2 gap-4"><div><p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Country</p><p className="text-sm text-foreground mt-0.5">{depot.country}</p></div><div><p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Postcode</p><p className="text-sm text-foreground mt-0.5 font-mono">{depot.postcode}</p></div></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b border-border"><div className="flex items-center gap-2"><div className="h-8 w-8 rounded-lg bg-warning/10 flex items-center justify-center text-warning"><BookOpen size={16} /></div><div><CardTitle className="text-sm">Cargo & Operations</CardTitle><CardDescription className="text-xs">Categories & logistics</CardDescription></div></div></CardHeader>
          <CardContent className="space-y-4">
            <div><p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Year Established</p><p className="text-sm text-foreground mt-0.5 flex items-center gap-1.5"><Calendar size={14} className="text-muted-foreground" />Est. {depot.establishedYear}</p></div>
            <div><p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">System Database ID</p><p className="text-xs font-mono text-muted-foreground mt-0.5 truncate select-all">{(depot as any)?._id || (depot as any)?.id}</p></div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="border-b border-border">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Warehouse size={16} />
              </div>
              <div>
                <CardTitle className="text-sm">Storage Capacities by Product</CardTitle>
                <CardDescription className="text-xs">Holding capacity configuration for registered products</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {!depot.productCapacities || depot.productCapacities.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No product-specific storage capacities have been configured for this depot.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {depot.productCapacities.map((pc: any) => {
                  const prodName = pc.product?.name || pc.productName || 'Unknown Product'
                  const prodSku = pc.product?.sku || pc.productSku || 'N/A'
                  const prodCat = pc.product?.category || pc.productCategory || 'N/A'
                  const prodId = pc.product?._id || pc.product?.id || pc.productId || String(pc.product || Math.random())
                  return (
                    <div key={prodId} className="flex items-center justify-between p-3 border rounded-lg bg-card">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{prodName}</p>
                        <p className="text-xs text-muted-foreground font-mono">{prodSku} &bull; {prodCat}</p>
                      </div>
                      <Badge variant="outline" className="font-mono text-sm font-bold bg-secondary px-2.5 py-1">
                        {(pc.capacity || 0).toLocaleString()} Units
                      </Badge>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="border-b border-border">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-success/10 flex items-center justify-center text-success">
                <DollarSign size={16} />
              </div>
              <div>
                <CardTitle className="text-sm">Product Pricing at Depot</CardTitle>
                <CardDescription className="text-xs">Set and manage the price of each product stored in this depot</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {(() => {
              const products = depot.productCapacities || []
              const prices = localPrices ?? depot.productPrices ?? []

              if (products.length === 0) {
                return <p className="text-sm text-muted-foreground text-center py-4">No products have been configured for this depot. Add product capacities first to set pricing.</p>
              }

              return (
                <div className="space-y-3">
                  {products.map((pc: any) => {
                    const productId = String(pc.product?._id || pc.product || pc.productId || pc.id)
                    const productName = pc.product?.name || pc.productName || 'Unknown Product'
                    const productSku = pc.product?.sku || pc.productSku || 'N/A'
                    const priceEntry = prices.find((pp: any) => String(pp.product?._id || pp.product || pp.productId || pp.id) === productId)
                    const currentPrice = priceEntry?.currentPrice
                    const history = (priceEntry as any)?.priceHistory || []
                    const isEditing = editingProductId === productId
                    const isHistoryOpen = expandedHistory === productId

                    const lastHistoryPrice = history.length > 0 ? history[history.length - 1].price : null
                    const priceTrend = currentPrice !== undefined && lastHistoryPrice !== null
                      ? currentPrice > lastHistoryPrice ? 'up' : currentPrice < lastHistoryPrice ? 'down' : 'same'
                      : null

                    return (
                      <div key={productId} className="border rounded-lg bg-card overflow-hidden">
                        <div className="flex items-center justify-between p-4">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground">{productName}</p>
                            <p className="text-xs text-muted-foreground font-mono">{productSku} &bull; {pc.product?.category || 'N/A'}</p>
                          </div>

                          <div className="flex items-center gap-2">
                            {isEditing ? (
                              <div className="flex items-center gap-1.5">
                                <div className="relative">
                                  <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={editPrice}
                                    onChange={(e) => setEditPrice(e.target.value)}
                                    className="w-32 h-8 text-sm font-mono tabular-nums"
                                    placeholder="0.00"
                                    autoFocus
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        const val = parseFloat(editPrice)
                                        if (!isNaN(val) && val >= 0) {
                                          updatePrice.mutate(
                                            { depotId: activeDepotId, productId, price: val },
                                            {
                                              onSuccess: (res) => {
                                                setLocalPrices(res.data?.depot?.productPrices ?? prices)
                                                setEditingProductId(null)
                                                setEditPrice('')
                                              },
                                            }
                                          )
                                        }
                                      }
                                      if (e.key === 'Escape') {
                                        setEditingProductId(null)
                                        setEditPrice('')
                                      }
                                    }}
                                  />
                                </div>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 text-success hover:bg-success/10"
                                  disabled={updatePrice.isPending}
                                  onClick={() => {
                                    const val = parseFloat(editPrice)
                                    if (!isNaN(val) && val >= 0) {
                                      updatePrice.mutate(
                                        { depotId: activeDepotId, productId, price: val },
                                        {
                                          onSuccess: (res) => {
                                            setLocalPrices(res.data?.depot?.productPrices ?? prices)
                                            setEditingProductId(null)
                                            setEditPrice('')
                                          },
                                        }
                                      )
                                    }
                                  }}
                                >
                                  {updatePrice.isPending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                  onClick={() => { setEditingProductId(null); setEditPrice('') }}
                                >
                                  <X size={14} />
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                {currentPrice !== undefined ? (
                                  <div className="flex items-center gap-1.5">
                                    {priceTrend === 'up' && <TrendingUp size={14} className="text-success" />}
                                    {priceTrend === 'down' && <TrendingDown size={14} className="text-destructive" />}
                                    <Badge variant="outline" className="font-mono text-sm font-bold bg-secondary px-2.5 py-1">
                                      ₦{currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </Badge>
                                  </div>
                                ) : (
                                  <Badge variant="outline" className="text-xs text-muted-foreground">No price set</Badge>
                                )}
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 hover:bg-primary/10 text-primary"
                                  onClick={() => {
                                    setEditingProductId(productId)
                                    setEditPrice(currentPrice !== undefined ? String(currentPrice) : '')
                                  }}
                                >
                                  <Edit size={14} />
                                </Button>
                                {history.length > 0 && (
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 hover:bg-muted text-muted-foreground"
                                    onClick={() => setExpandedHistory(isHistoryOpen ? null : productId)}
                                  >
                                    {isHistoryOpen ? <ChevronUp size={14} /> : <History size={14} />}
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {isHistoryOpen && history.length > 0 && (
                          <div className="border-t border-border bg-muted/30 px-4 py-3">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                              <Clock size={12} /> Price History
                            </p>
                            <div className="space-y-1.5 max-h-48 overflow-y-auto">
                              {[...history].reverse().map((h, idx) => {
                                const nextPrice = idx === 0 ? currentPrice : [...history].reverse()[idx - 1]?.price
                                const isIncrease = nextPrice !== undefined && nextPrice > h.price
                                const isDecrease = nextPrice !== undefined && nextPrice < h.price
                                return (
                                  <div key={idx} className="flex items-center justify-between py-1.5 px-2 rounded text-xs hover:bg-muted/50 transition-colors">
                                    <div className="flex items-center gap-2">
                                      {isIncrease && <TrendingUp size={12} className="text-success" />}
                                      {isDecrease && <TrendingDown size={12} className="text-destructive" />}
                                      {!isIncrease && !isDecrease && <div className="w-3" />}
                                      <span className="font-mono font-semibold text-foreground">₦{h.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>
                                    <span className="text-muted-foreground">
                                      {new Date(h.setAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                      {' '}
                                      {new Date(h.setAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            })()}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="border-b border-border">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <FileText size={16} />
              </div>
              <div>
                <CardTitle className="text-sm">Assigned PFIs ({pfis.length})</CardTitle>
                <CardDescription className="text-xs">Proforma Invoices registered to this depot</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {isLoadingPfis ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : pfis.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No PFIs are currently assigned to this depot.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {pfis.map((pfi: any) => {
                  const starting = Number(pfi.startingQtyLitres) || 0
                  const sold = Number(pfi.soldQtyLitres) || 0
                  const unit = pfi.productUnit || 'Litres'
                  const progressPct = starting > 0 ? Math.min((sold / starting) * 100, 100) : 0

                  return (
                    <div
                      key={pfi._id || pfi.id}
                      onClick={() => navigate({ to: '/pfi/details' as any, search: { id: pfi._id || pfi.id } as any })}
                      className="flex flex-col p-4 border rounded-lg bg-card hover:bg-muted/30 transition-all cursor-pointer hover:border-primary/50 group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-foreground px-2 py-0.5 rounded bg-primary/10 border border-primary/20 group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                              {pfi.pfiNumber}
                            </span>
                            {pfi.pfiDate && (
                              <span className="text-[10px] text-muted-foreground font-mono">
                                {new Date(pfi.pfiDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-semibold text-foreground mt-2">{pfi.productName || 'Unknown Product'}</p>
                          {pfi.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{pfi.description}</p>
                          )}
                        </div>
                        <Badge
                          className={pfi.status === 'active' ? 'bg-success text-success-foreground' : 'bg-secondary text-secondary-foreground'}
                        >
                          {pfi.status}
                        </Badge>
                      </div>

                      <div className="mt-4 space-y-1.5">
                        <div className="flex justify-between text-xs text-muted-foreground font-medium">
                          <span>Sold: {sold.toLocaleString()} / {starting.toLocaleString()} {unit}</span>
                          <span>{Math.round(progressPct)}%</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden w-full">
                          <div
                            className="h-full rounded-full transition-all duration-700 bg-primary"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>

                      {pfi.vesselName && (
                        <div className="mt-3 pt-2.5 border-t border-dashed flex justify-between items-center text-[10px] text-muted-foreground">
                          <span className="truncate max-w-[50%]">Vessel: <strong>{pfi.vesselName}</strong></span>
                          {pfi.unitPrice && (
                            <span>₦{Number(pfi.unitPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / Unit</span>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

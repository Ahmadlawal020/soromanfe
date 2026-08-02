import { useState } from 'react'
import { PageHeader } from '#/components/PageHeader'
import { createFileRoute, useNavigate, useRouter } from '@tanstack/react-router'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '#/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '#/components/ui/dialog'
import {
  Flame, MapPin, User, ArrowLeft, Edit, Trash2, Activity, AlertCircle, Loader2, FileText, Plus, BarChart3, PackageCheck, Droplets, TrendingUp, AlertTriangle, Layers, DollarSign
} from 'lucide-react'
import type { LpgStationItem } from '#/lib/hooks/useLpgStations'
import { useDeleteLpgStation, useLpgStationDetails, useUpdateLpgStation } from '#/lib/hooks/useLpgStations'
import { useToast } from '#/lib/hooks/useToast'
import { Breadcrumbs } from '#/components/Breadcrumbs'
import { ConfirmDialog } from '#/components/ConfirmDialog'

export const Route = createFileRoute('/lpg-stations/details')({
  validateSearch: (search: Record<string, unknown>): { id?: string } => ({
    id: (search.id as string) || '',
  }),
  component: LpgStationDetailPage,
})

function getStatusBadge(status: string) {
  switch (status) {
    case 'Active':
      return (
        <Badge className="bg-accent/15 text-accent border-accent/30 gap-1.5 font-normal">
          <span className="size-1.5 rounded-full bg-accent animate-pulse" />
          {status}
        </Badge>
      )
    case 'High Capacity':
      return (
        <Badge className="bg-warning/15 text-warning border-warning/30 gap-1.5 font-normal">
          <span className="size-1.5 rounded-full bg-warning animate-pulse" />
          {status}
        </Badge>
      )
    case 'Maintenance':
      return (
        <Badge variant="destructive" className="gap-1.5 font-normal">
          <span className="size-1.5 rounded-full bg-destructive-foreground animate-pulse" />
          {status}
        </Badge>
      )
    default:
      return <Badge variant="outline">{status || 'Active'}</Badge>
  }
}

function getPfiVolumeStats(pfi: any) {
  const startingLitres = Number(pfi.startingQtyLitres ?? pfi.starting_qty_litres ?? pfi.totalVolumeLitres ?? pfi.volumeLitres ?? pfi.startingQty ?? 0)
  const soldLitres = Number(pfi.soldQtyLitres ?? pfi.sold_qty_litres ?? pfi.soldVolumeLitres ?? pfi.soldQty ?? 0)

  let starting = startingLitres
  let sold = soldLitres

  if (starting === 0 && Number(pfi.qtyVolumeMt ?? pfi.qty_volume_mt ?? 0) > 0) {
    starting = Number(pfi.qtyVolumeMt ?? pfi.qty_volume_mt)
  }

  const remaining = Math.max(0, starting - sold)
  return { starting, sold, remaining }
}

type TabType = 'overview' | 'pfis' | 'activity'

function LpgStationDetailPage() {
  const navigate = useNavigate()
  const router = useRouter()
  const deleteStation = useDeleteLpgStation()
  const updateStation = useUpdateLpgStation()
  const toast = useToast()
  const search = (Route.useSearch() as any) || {}
  const stateStation = (router.history.location.state as any)?.station as LpgStationItem | undefined
  const stationId = search?.id || (stateStation as any)?._id || stateStation?.id || ''

  const { data: fetchedStation, isLoading: isLoadingStation } = useLpgStationDetails(stationId)
  const station = fetchedStation || stateStation

  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [editPriceOpen, setEditPriceOpen] = useState(false)
  const [editPriceValue, setEditPriceValue] = useState('')

  const activeStationId = (station as any)?._id || (station as any)?.id || stationId

  const pfis = (station as any)?.pfis || []
  const cylinders = (station as any)?.cylinders || []
  const totalCylinders = cylinders.reduce((sum: number, c: any) => sum + (Number(c.quantity) || 0), 0)

  const totalPfiStartingQty = pfis.reduce((sum: number, pfi: any) => sum + getPfiVolumeStats(pfi).starting, 0)
  const totalPfiSoldQty = pfis.reduce((sum: number, pfi: any) => sum + getPfiVolumeStats(pfi).sold, 0)
  const totalPfiRemainingQty = pfis.reduce((sum: number, pfi: any) => sum + getPfiVolumeStats(pfi).remaining, 0)
  const fulfillmentPct = totalPfiStartingQty > 0 ? Math.min(100, (totalPfiSoldQty / totalPfiStartingQty) * 100) : 0
  const isStockLow = totalPfiStartingQty > 0 && (totalPfiRemainingQty / totalPfiStartingQty) <= 0.15
  const remainingStockPct = totalPfiStartingQty > 0 ? (totalPfiRemainingQty / totalPfiStartingQty) * 100 : 0

  const handleBack = () => { window.history.length > 1 ? window.history.back() : navigate({ to: '/lpg-stations/' as any }) }
  const handleDelete = () => { setShowDeleteDialog(true) }
  const handleEditPrice = () => {
    setEditPriceValue(String(station?.pricePerKg || ''))
    setEditPriceOpen(true)
  }
  const handleSavePrice = async () => {
    if (!activeStationId) return
    try {
      await updateStation.mutateAsync({ id: activeStationId, data: { pricePerKg: Number(editPriceValue) || 0 } })
      toast.success('Price per Kg updated successfully')
      setEditPriceOpen(false)
    } catch {
      toast.error('Failed to update price per Kg')
    }
  }
  const confirmDelete = async () => {
    if (!activeStationId) return
    try {
      await deleteStation.mutateAsync(activeStationId)
      toast.success('LPG station removed successfully')
      navigate({ to: '/lpg-stations/' as any })
    }
    catch {
      toast.error('Failed to delete LPG station')
    }
    finally {
      setShowDeleteDialog(false)
    }
  }

  if (isLoadingStation && !station) {
    return (
      <div className="flex flex-col items-center justify-center py-28 gap-4 text-center">
        <Loader2 className="size-10 animate-spin text-primary" />
        <p className="text-sm font-normal text-muted-foreground">Loading LPG station details...</p>
      </div>
    )
  }

  if (!station) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-5 text-center">
        <div className="size-16 rounded-full bg-warning/10 flex items-center justify-center text-warning border border-warning/20">
          <AlertCircle className="size-8" />
        </div>
        <h2 className="text-lg md:text-xl font-semibold text-foreground tracking-tight">No Station Selected</h2>
        <p className="text-muted-foreground max-w-sm text-sm">Please select an LPG station from the directory to view details.</p>
        <Button onClick={() => navigate({ to: '/lpg-stations/' as any })}><ArrowLeft className="size-4" /> Back to LPG Stations</Button>
      </div>
    )
  }

  const staffList = (station.staff || (station as any).staffIds || []) as any[]

  return (
    <div className="space-y-6 pb-12 animate-fade-in max-w-7xl mx-auto">
      <Breadcrumbs items={[{ label: 'LPG Stations', href: '/lpg-stations' }, { label: station?.name || 'Details' }]} />

      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b pb-4">
        <PageHeader
      eyebrow="LPG Home Delivery"
      title={station.name}
    />

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            className="gap-1.5 font-semibold text-xs"
            onClick={() => navigate({ to: '/pfi/form' as any, search: { lpgStationId: activeStationId } as any })}
          >
            <Plus className="size-4" /> Assign PFI
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs font-normal"
            onClick={() => navigate({ to: '/lpg-stations/form' as any, search: { id: activeStationId } as any, state: { station, isEdit: true } as any })}
          >
            <Edit className="size-4" /> Edit Station
          </Button>
          <Button
            variant="destructive"
            size="sm"
            className="gap-1.5 text-xs font-normal"
            onClick={handleDelete}
            disabled={deleteStation.isPending}
          >
            <Trash2 className="size-4" /> {deleteStation.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </header>

      {/* Hero Card */}
      <Card className="overflow-hidden border bg-card">
        <div className="bg-primary/10 p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="size-16 rounded-xl bg-primary/15 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                <Flame className="size-8" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="font-mono text-xs bg-background/80">
                    Code: {station.code}
                  </Badge>
                  <div className="sm:hidden">{getStatusBadge(station.status)}</div>
                  {station.establishedYear && (
                    <Badge variant="secondary" className="text-xs font-normal">
                      Est. {station.establishedYear}
                    </Badge>
                  )}
                </div>
                <h2 className="text-xl font-semibold text-foreground tracking-tight">{station.name}</h2>
                <p className="text-xs md:text-sm text-muted-foreground flex items-center gap-1.5 pt-0.5">
                  <MapPin className="size-3.5 shrink-0 text-primary" />
                  <span>{[station.address, station.city, station.state, station.postcode, station.country].filter(Boolean).join(', ') || 'Address N/A'}</span>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap md:flex-col items-start md:items-end gap-2 text-xs border-t md:border-t-0 pt-4 md:pt-0 w-full md:w-auto">
              <div className="flex items-center gap-2 bg-background/80 backdrop-blur px-3 py-1.5 rounded-lg border text-muted-foreground">
                <Flame className="size-3.5 text-primary" />
                <span><strong className="text-foreground">{station.lpgCapacityKg?.toLocaleString()}</strong> Kg Capacity</span>
              </div>
              <div className="flex items-center gap-2 bg-background/80 backdrop-blur px-3 py-1.5 rounded-lg border text-muted-foreground">
                <DollarSign className="size-3.5 text-primary" />
                <span><strong className="text-foreground">{Number(station.pricePerKg || 0) > 0 ? `₦${Number(station.pricePerKg).toLocaleString()}` : 'Not set'}</strong> / Kg</span>
              </div>
              <div className="flex items-center gap-2 bg-background/80 backdrop-blur px-3 py-1.5 rounded-lg border text-muted-foreground">
                <FileText className="size-3.5 text-accent" />
                <span><strong className="text-foreground">{pfis.length}</strong> Assigned PFI(s)</span>
              </div>
              <div className="flex items-center gap-2 bg-background/80 backdrop-blur px-3 py-1.5 rounded-lg border text-muted-foreground">
                <User className="size-3.5 text-warning" />
                <span><strong className="text-foreground">{staffList.length}</strong> Staff</span>
              </div>
              <div className="flex items-center gap-2 bg-background/80 backdrop-blur px-3 py-1.5 rounded-lg border text-muted-foreground">
                <Layers className="size-3.5 text-primary" />
                <span><strong className="text-foreground">{totalCylinders.toLocaleString()}</strong> Cylinders ({cylinders.length} sizes)</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-primary hover:shadow transition-shadow duration-250 ease-luxe">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-semibold uppercase">Total Allocated Stock</p>
              <h3 className="text-2xl font-semibold text-foreground">
                {totalPfiStartingQty.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">Kg</span>
              </h3>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <FileText className="size-3 text-primary" />
                <span>Across {pfis.length} PFI(s)</span>
              </p>
            </div>
            <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <PackageCheck className="size-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500 hover:shadow transition-shadow duration-250 ease-luxe">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-semibold uppercase">Volume Sold</p>
              <h3 className="text-2xl font-semibold text-foreground">
                {totalPfiSoldQty.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">Kg</span>
              </h3>
              <p className="text-xs text-accent font-normal flex items-center gap-1">
                <TrendingUp className="size-3" />
                <span>{Math.round(fulfillmentPct)}% sold</span>
              </p>
            </div>
            <div className="size-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent shrink-0">
              <TrendingUp className="size-6" />
            </div>
          </CardContent>
        </Card>

        <Card className={`border-l-4 hover:shadow transition-shadow ${isStockLow ? 'border-l-destructive' : 'border-l-amber-500'}`}>
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-semibold uppercase">Stock Remaining</p>
              <h3 className="text-2xl font-semibold text-foreground">
                {totalPfiRemainingQty.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">Kg</span>
              </h3>
              <p className={`text-xs font-normal flex items-center gap-1 ${isStockLow ? 'text-destructive font-semibold' : 'text-warning'}`}>
                <Droplets className="size-3" />
                <span>{Math.round(remainingStockPct)}% available</span>
              </p>
            </div>
            <div className={`size-12 rounded-xl flex items-center justify-center shrink-0 ${isStockLow ? 'bg-destructive/10 text-destructive' : 'bg-warning/10 text-warning'}`}>
              <Droplets className="size-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 hover:shadow transition-shadow duration-250 ease-luxe">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-semibold uppercase">LPG Capacity</p>
              <h3 className="text-2xl font-semibold text-foreground">
                {station.lpgCapacityKg?.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">Kg</span>
              </h3>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Flame className="size-3 text-muted-foreground" />
                <span>Standard LPG</span>
              </p>
            </div>
            <div className="size-12 rounded-xl bg-muted/10 flex items-center justify-center text-muted-foreground shrink-0">
              <Flame className="size-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Warning */}
      {isStockLow && (
        <Card className="border-warning/50 bg-warning/10 text-warning">
          <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-warning/20 flex items-center justify-center text-warning shrink-0">
                <AlertTriangle className="size-5" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground text-sm flex items-center gap-2">
                  <span>Low Stock Warning &bull; Available at {Math.round(remainingStockPct)}%</span>
                  <Badge variant="destructive" className="text-[10px] uppercase font-semibold">Action Required</Badge>
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Active PFI stock at {station.name} is down to <strong>{totalPfiRemainingQty.toLocaleString()} Kg</strong>. Consider assigning a new PFI.
                </p>
              </div>
            </div>
            <Button
              size="sm"
              className="bg-warning text-warning-foreground hover:bg-warning shrink-0 text-xs font-semibold gap-1.5"
              onClick={() => navigate({ to: '/pfi/form' as any, search: { lpgStationId: activeStationId } as any })}
            >
              <Plus className="size-3.5" /> Assign New PFI
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-border">
        <div className="flex gap-2 overflow-x-auto pb-px">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${activeTab === 'overview'
              ? 'border-primary text-primary bg-primary/5 rounded-t-md'
              : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            }`}
          >
            <BarChart3 className="size-4" />
            <span>Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('pfis')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${activeTab === 'pfis'
              ? 'border-primary text-primary bg-primary/5 rounded-t-md'
              : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            }`}
          >
            <FileText className="size-4" />
            <span>PFIs & Allocation</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeTab === 'pfis' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
              {pfis.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('activity')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${activeTab === 'activity'
              ? 'border-primary text-primary bg-primary/5 rounded-t-md'
              : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            }`}
          >
            <Activity className="size-4" />
            <span>Activity Log</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader className="border-b border-border/50 pb-3">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
                  <MapPin className="size-4" />
                </div>
                <div>
                  <CardTitle className="text-sm font-semibold">Location & Geographic Details</CardTitle>
                  <CardDescription className="text-xs">Station address, LGA and region</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div>
                <p className="text-[11px] text-muted-foreground font-semibold uppercase">Street Address</p>
                <p className="text-sm text-foreground font-normal mt-0.5">{station.address || 'N/A'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[11px] text-muted-foreground font-semibold uppercase">LGA / City</p>
                  <p className="text-sm text-foreground font-normal mt-0.5">{station.city || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground font-semibold uppercase">State</p>
                  <p className="text-sm text-foreground font-normal mt-0.5">{station.state || 'N/A'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[11px] text-muted-foreground font-semibold uppercase">Country</p>
                  <p className="text-sm text-foreground font-normal mt-0.5">{station.country || 'Nigeria'}</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground font-semibold uppercase">Postcode</p>
                  <p className="text-sm text-foreground font-mono mt-0.5">{station.postcode || 'N/A'}</p>
                </div>
              </div>
              <div className="pt-2 border-t">
                <p className="text-[11px] text-muted-foreground font-semibold uppercase">System Database ID</p>
                <p className="text-xs font-mono text-muted-foreground mt-0.5 truncate select-all">{activeStationId}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b border-border/50 pb-3">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-lg bg-muted/10 flex items-center justify-center text-muted-foreground">
                  <User className="size-4" />
                </div>
                <div>
                  <CardTitle className="text-sm font-semibold">Assigned Staff & Operations</CardTitle>
                  <CardDescription className="text-xs">Station management personnel</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div>
                <p className="text-[11px] text-muted-foreground font-semibold uppercase">Operating Schedule</p>
                <p className="text-sm text-foreground font-normal mt-0.5 flex items-center gap-1.5">
                  <Activity className="size-3.5 text-accent" />
                  <span>24 Hours / 7 Days a week</span>
                </p>
              </div>

              <div>
                <p className="text-[11px] text-muted-foreground font-semibold uppercase">Station Status</p>
                <div className="mt-1">{getStatusBadge(station.status)}</div>
              </div>

              <div>
                <p className="text-[11px] text-muted-foreground font-semibold uppercase">LPG Capacity</p>
                <p className="text-lg font-semibold text-foreground mt-0.5 flex items-center gap-2">
                  <Flame className="size-4 text-primary" />
                  {station.lpgCapacityKg?.toLocaleString()} Kg
                </p>
              </div>

              <div>
                <p className="text-[11px] text-muted-foreground font-semibold uppercase">Assigned Staff ({staffList.length})</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {staffList.length > 0 ? (
                    staffList.map((s) => {
                      const sId = typeof s === 'object' ? (s._id || s.adminId || s.id) : s
                      const fn = typeof s === 'object' ? (s.firstName || s.first_name || '') : ''
                      const sn = typeof s === 'object' ? (s.surname || s.last_name || '') : ''
                      const initials = (fn[0] || '') + (sn[0] || '')
                      const fullName = typeof s === 'object' ? (`${fn} ${sn}`.trim() || s.full_name || s.email || 'Staff') : String(s)
                      return (
                        <div key={sId} className="flex items-center gap-2 bg-secondary px-3 py-1.5 rounded-full text-xs font-normal">
                          <div className="size-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-semibold text-primary">
                            {initials || '?'}
                          </div>
                          <span className="text-foreground">{fullName}</span>
                        </div>
                      )
                    })
                  ) : (
                    <span className="text-xs text-muted-foreground">No staff assigned to this station.</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader className="border-b border-border/50 pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <Layers className="size-4" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-semibold">Cylinder Inventory</CardTitle>
                    <CardDescription className="text-xs">Cylinder sizes and quantities available at this station</CardDescription>
                  </div>
                </div>
                <Badge variant="outline" className="font-mono text-xs">
                  {totalCylinders.toLocaleString()} total units
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {cylinders.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No cylinders configured for this station.</p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {cylinders.map((c: any) => (
                    <div key={c.cylinderSizeKg || c.id} className="flex items-center justify-between p-4 border rounded-xl bg-card hover:border-primary/40 transition-colors duration-250 ease-luxe">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{c.cylinderSizeKg} Kg Cylinder</p>
                      </div>
                      <Badge variant="outline" className="font-mono text-sm font-semibold bg-secondary px-3 py-1">
                        {Number(c.quantity).toLocaleString()} units
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* LPG Pricing Card */}
          <Card className="md:col-span-2">
            <CardHeader className="border-b border-border/50 pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="size-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
                    <DollarSign className="size-4" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-semibold">LPG Pricing</CardTitle>
                    <CardDescription className="text-xs">Current price per Kg and price change history</CardDescription>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="gap-1.5 text-xs font-normal" onClick={handleEditPrice}>
                  <Edit className="size-3.5" /> Update Price
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-6">
                <div className="flex-1">
                  <p className="text-[11px] text-muted-foreground font-semibold uppercase">Current Price Per Kg</p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-3xl font-semibold text-foreground">
                      {Number(station.pricePerKg || 0) > 0 ? `₦${Number(station.pricePerKg).toLocaleString()}` : '—'}
                    </span>
                    <span className="text-sm text-muted-foreground">/ Kg</span>
                  </div>
                  {Number(station.pricePerKg || 0) > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      12.5Kg cylinder: ₦{(Number(station.pricePerKg) * 12.5).toLocaleString()} · 25Kg cylinder: ₦{(Number(station.pricePerKg) * 25).toLocaleString()} · 50Kg cylinder: ₦{(Number(station.pricePerKg) * 50).toLocaleString()}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3 bg-muted/50 rounded-lg px-4 py-3 border">
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground uppercase">12.5 Kg</p>
                    <p className="text-sm font-semibold text-foreground">{Number(station.pricePerKg || 0) > 0 ? `₦${(Number(station.pricePerKg) * 12.5).toLocaleString()}` : '—'}</p>
                  </div>
                  <div className="w-px h-8 bg-border" />
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground uppercase">25 Kg</p>
                    <p className="text-sm font-semibold text-foreground">{Number(station.pricePerKg || 0) > 0 ? `₦${(Number(station.pricePerKg) * 25).toLocaleString()}` : '—'}</p>
                  </div>
                  <div className="w-px h-8 bg-border" />
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground uppercase">50 Kg</p>
                    <p className="text-sm font-semibold text-foreground">{Number(station.pricePerKg || 0) > 0 ? `₦${(Number(station.pricePerKg) * 50).toLocaleString()}` : '—'}</p>
                  </div>
                </div>
              </div>

              {/* Price History */}
              <div className="border-t pt-4">
                <p className="text-[11px] text-muted-foreground font-semibold uppercase mb-3">Price History</p>
                {(() => {
                  const history = (station as any).priceHistory || []
                  if (history.length === 0) {
                    return (
                      <p className="text-sm text-muted-foreground text-center py-4">No price history yet. Set the first price above.</p>
                    )
                  }
                  return (
                    <div className="space-y-1 max-h-[240px] overflow-y-auto">
                      {history.map((entry: any) => {
                        const date = new Date(entry.setAt)
                        const now = new Date()
                        const diffMs = now.getTime() - date.getTime()
                        const diffMins = Math.floor(diffMs / 60000)
                        const diffHours = Math.floor(diffMs / 3600000)
                        const diffDays = Math.floor(diffMs / 86400000)
                        let timeAgo = ''
                        if (diffMins < 1) timeAgo = 'Just now'
                        else if (diffMins < 60) timeAgo = `${diffMins}m ago`
                        else if (diffHours < 24) timeAgo = `${diffHours}h ago`
                        else timeAgo = `${diffDays}d ago`

                        return (
                          <div key={entry.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="size-2 rounded-full bg-primary" />
                              <span className="font-semibold text-sm text-foreground font-mono">₦{Number(entry.pricePerKg).toLocaleString()} / Kg</span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span>{date.toLocaleDateString('en-NG', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                              <span className="text-muted-foreground/50">{date.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}</span>
                              <span className="bg-muted px-2 py-0.5 rounded text-[10px] font-normal">{timeAgo}</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )
                })()}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      {activeTab === 'pfis' && (
        <div className="space-y-4">
          {pfis.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="size-10 text-muted-foreground mx-auto mb-3" />
                <h3 className="text-base font-semibold text-foreground mb-1">No PFIs Assigned</h3>
                <p className="text-sm text-muted-foreground mb-4">No Proforma Invoices have been assigned to this LPG station yet.</p>
                <Button size="sm" onClick={() => navigate({ to: '/pfi/form' as any, search: { lpgStationId: activeStationId } as any })}>
                  <Plus className="size-4 mr-2" /> Assign PFI
                </Button>
              </CardContent>
            </Card>
          ) : (
            pfis.map((pfi: any) => {
              const stats = getPfiVolumeStats(pfi)
              const remainingPct = stats.starting > 0 ? (stats.remaining / stats.starting) * 100 : 0
              return (
                <Card key={pfi._id || pfi.id} className="hover:border-primary/30 transition-colors">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-semibold text-foreground">{pfi.pfiNumber || 'N/A'}</h3>
                          <Badge variant={pfi.status === 'active' ? 'default' : 'secondary'} className="text-[10px]">
                            {pfi.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {pfi.productName || 'LPG'} &bull; {pfi.productUnit || 'Kg'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Remaining</p>
                        <p className="text-lg font-semibold text-foreground">{stats.remaining.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">{pfi.productUnit || 'Kg'}</span></p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase">Starting</p>
                        <p className="text-sm font-semibold">{stats.starting.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase">Sold</p>
                        <p className="text-sm font-semibold">{stats.sold.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase">Progress</p>
                        <p className="text-sm font-semibold">{Math.round(remainingPct)}%</p>
                      </div>
                    </div>
                    <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${remainingPct <= 15 ? 'bg-destructive' : remainingPct <= 40 ? 'bg-warning' : 'bg-accent'}`}
                        style={{ width: `${Math.max(0, Math.min(100, 100 - remainingPct))}%` }}
                      />
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      )}

      {/* Tab 3: Activity */}
      {activeTab === 'activity' && (
        <Card>
          <CardContent className="py-12 text-center">
            <Activity className="size-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-base font-semibold text-foreground mb-1">Activity Log</h3>
            <p className="text-sm text-muted-foreground">Activity events for this LPG station will appear here.</p>
          </CardContent>
        </Card>
      )}

      {/* Edit Price Dialog */}
      <Dialog open={editPriceOpen} onOpenChange={setEditPriceOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Update Price Per Kg</DialogTitle>
            <DialogDescription>
              Set the LPG gas price per Kg for <strong>{station?.name}</strong>. This price is used when customers place LPG orders.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <label className="text-sm font-normal">Price Per Kg (₦)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-mono">₦</span>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  className="pl-8 text-right font-mono font-semibold"
                  placeholder="e.g. 800"
                  value={editPriceValue}
                  onChange={(e) => setEditPriceValue(e.target.value)}
                  autoFocus
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setEditPriceOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleSavePrice} disabled={updateStation.isPending}>
              {updateStation.isPending ? <><Loader2 className="size-3.5 animate-spin mr-1.5" /> Saving...</> : 'Save Price'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete LPG Station"
        description={`Are you sure you want to delete "${station.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        variant="destructive"
      />
    </div>
  )
}

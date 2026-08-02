import { createFileRoute, useNavigate, useRouter } from '@tanstack/react-router'
import { PageHeader } from '#/components/PageHeader'
import { useState } from 'react'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '#/components/ui/card'
import { Truck, User, Wrench, Fuel, ShieldAlert, ArrowLeft, Edit, Trash2, Calendar, AlertCircle, Gauge, Loader2 } from 'lucide-react'
import { useTruckDetails, useDeleteTruck } from '#/lib/hooks/useTrucks'
import { useToast } from '#/lib/hooks/useToast'
import { Breadcrumbs } from '#/components/Breadcrumbs'
import { ConfirmDialog } from '#/components/ConfirmDialog'

export const Route = createFileRoute('/trucks/details')({
  validateSearch: (search: Record<string, unknown>): { id?: string; truckId?: string } => ({
    id: (search.id as string) || undefined,
    truckId: (search.truckId as string) || undefined,
  }),
  component: TruckDetailPage,
})

function getStatusBadge(status: string) {
  switch (status) {
    case 'In Transit': return <Badge className="bg-success text-success-foreground">{status}</Badge>
    case 'Idle': return <Badge className="bg-warning text-warning-foreground">{status}</Badge>
    case 'Maintenance': return <Badge variant="destructive">{status}</Badge>
    default: return <Badge variant="outline">{status}</Badge>
  }
}

function getFuelColor(level: number) {
  if (level > 50) return 'text-success bg-success/10'
  if (level > 20) return 'text-warning bg-warning/10'
  return 'text-destructive bg-destructive/10 border-destructive/20 animate-pulse'
}

function getFuelBarColor(level: number) {
  if (level > 50) return 'bg-success'
  if (level > 20) return 'bg-warning'
  return 'bg-destructive'
}

// Calculate days remaining and return styling
function getComplianceStatus(dateStr: string | null | undefined) {
  if (!dateStr) return { label: 'Not Provided', color: 'text-muted-foreground', alert: false }

  const expiry = new Date(dateStr)
  if (isNaN(expiry.getTime())) return { label: 'Invalid Date', color: 'text-muted-foreground', alert: false }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const diffTime = expiry.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays < 0) {
    return { label: `Expired (${Math.abs(diffDays)} days ago)`, color: 'text-destructive font-semibold bg-destructive/5 px-2 py-0.5 rounded border border-destructive/10', alert: true }
  } else if (diffDays <= 30) {
    return { label: `Expiring soon (${diffDays} days left)`, color: 'text-warning font-semibold bg-warning/5 px-2 py-0.5 rounded border border-warning/10', alert: true }
  } else {
    return { label: `Valid (${diffDays} days left)`, color: 'text-success bg-success/5 px-2 py-0.5 rounded border border-success/10', alert: false }
  }
}

function TruckDetailPage() {
  const navigate = useNavigate()
  const router = useRouter()
  const searchParams = Route.useSearch()
  const deleteTruck = useDeleteTruck()
  const toast = useToast()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const truckState = (router.history.location.state as any)?.truck
  const truckId = searchParams.id || searchParams.truckId || truckState?._id || truckState?.id || (router.history.location.state as any)?.id

  const { data: truckDetails, isLoading } = useTruckDetails(truckId)

  // Fallback to routing state if query is fetching/empty
  const truck = truckDetails || truckState

  const handleBack = () => {
    window.history.length > 1 ? window.history.back() : navigate({ to: '/trucks/' as any })
  }

  const handleDelete = () => {
    setShowDeleteDialog(true)
  }

  const confirmDelete = async () => {
    if (!truck?._id) return
    try {
      await deleteTruck.mutateAsync(truck._id || truck.id)
      setShowDeleteDialog(false)
      navigate({ to: '/trucks/' as any })
    } catch {
      toast.error('Failed to delete truck')
    }
  }

  if (!truck && isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!truck) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-5 text-center">
        <div className="size-16 rounded-full bg-warning/10 flex items-center justify-center text-warning border border-warning/20">
          <AlertCircle className="size-8" />
        </div>
        <h2 className="text-lg md:text-xl font-semibold text-foreground tracking-tight">No Truck Selected</h2>
        <p className="text-muted-foreground max-w-sm">Please select a truck from the fleet directory to inspect details.</p>
        <Button onClick={() => navigate({ to: '/trucks/' as any })}><ArrowLeft className="size-4" /> Back to Trucks</Button>
      </div>
    )
  }

  const currentMileageVal = parseInt(truck.mileage?.replace(/[^0-9]/g, '') || '0')
  const isServiceDue = currentMileageVal >= (truck.nextServiceMileage || 15000)
  const insuranceStatus = getComplianceStatus(truck.insuranceExpiry)
  const registrationStatus = getComplianceStatus(truck.registrationExpiry)

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Trucks', href: '/trucks' }, { label: truck?.plateNumber || 'Details' }]} />

      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <PageHeader
      eyebrow="Transport"
      title="Truck Profile Details"
      description="Fleet status, active operator, and compliance schedules"
    />
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate({ to: '/trucks/form', state: { truck, isEdit: true } as any })}>
            <Edit className="size-4" /> Edit Profile
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleteTruck.isPending}>
            <Trash2 className="size-4" /> {deleteTruck.isPending ? 'Decommissioning...' : 'Decommission'}
          </Button>
        </div>
      </header>

      {/* Hero Badge Panel */}
      <Card className="card-hover">
        <CardContent className="bg-primary/5 p-6 md:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="size-20 bg-primary rounded-full flex items-center justify-center text-primary-foreground shrink-0">
              <Truck className="size-9" />
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="font-mono text-xs">VIN: {truck.vin || 'Not Provided'}</Badge>
                {getStatusBadge(truck.status)}
              </div>
              <h2 className="text-lg md:text-xl font-semibold text-foreground mt-2 tracking-tight">{truck.plateNumber}</h2>
              <p className="text-muted-foreground mt-1.5 text-sm flex items-center gap-1.5">
                {truck.year ? `${truck.year} ` : ''}{truck.make || 'Generic'} {truck.model} &bull; {truck.type || 'Standard'} Heavy Vehicle
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Grid */}
      <div className="grid gap-6 md:grid-cols-2">

        {/* Card 1: Telemetry & Service status */}
        <Card>
          <CardHeader className="border-b border-border">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Gauge className="size-4" />
              </div>
              <div>
                <CardTitle className="text-sm">Telemetry & Maintenance</CardTitle>
                <CardDescription className="text-xs">Odometer and servicing trackers</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground font-normal uppercase">Current Mileage</p>
                <p className="text-2xl font-semibold text-foreground mt-1 tabular-nums">{truck.mileage}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-normal uppercase">Fuel Capacity Status</p>
                <div className={`inline-flex items-center gap-1.5 mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${getFuelColor(truck.fuelLevel)}`}>
                  <Fuel className="size-3" /> {truck.fuelLevel}%
                </div>
              </div>
            </div>

            {/* Fuel Bar */}
            <div className="space-y-1">
              <div className="h-2 bg-muted rounded-full overflow-hidden w-full">
                <div className={`h-full rounded-full transition-all duration-700 ${getFuelBarColor(truck.fuelLevel)}`} style={{ width: `${truck.fuelLevel}%` }} />
              </div>
            </div>

            {/* Maintenance Service Alert */}
            <div className="border-t pt-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-normal uppercase">Maintenance Service Threshold</p>
                  <p className="text-sm font-semibold text-foreground mt-1">Due at: {truck.nextServiceMileage?.toLocaleString() || '15,000'} km</p>
                </div>
                {isServiceDue ? (
                  <div className="flex items-center gap-1 text-destructive font-semibold text-xs bg-destructive/10 border border-destructive/20 px-2 py-1 rounded">
                    <Wrench className="size-3" /> Service Overdue
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-success font-semibold text-xs bg-success/10 border border-success/20 px-2 py-1 rounded">
                    <Wrench className="size-3" /> Service Good
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {isServiceDue
                  ? 'Vehicle mileage exceeds service interval. Schedule immediately.'
                  : `Service window remaining: ${Math.max(0, (truck.nextServiceMileage || 15000) - currentMileageVal).toLocaleString()} km.`}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Driver & Assignment details */}
        <Card>
          <CardHeader className="border-b border-border">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-lg bg-info/10 flex items-center justify-center text-info">
                <User className="size-4" />
              </div>
              <div>
                <CardTitle className="text-sm">Assigned Operator (Driver)</CardTitle>
                <CardDescription className="text-xs">Active operator credentials and safety score</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            {truck.currentDriverId ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-semibold text-primary">
                    {truck.driverName?.charAt(0) || '?'}
                  </div>
                  <div>
                    <button
                      onClick={() => navigate({ to: '/drivers/details' as any, search: { id: truck.currentDriverId } as any, state: { id: truck.currentDriverId } } as any)}
                      className="font-semibold text-foreground hover:text-primary transition-colors text-left block duration-250 ease-luxe"
                    >
                      {truck.driverName}
                    </button>
                    {truck.driverPhone && (
                      <p className="text-xs text-muted-foreground">{truck.driverPhone}</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-foreground flex items-center gap-2">
                  <User className="size-4 text-muted-foreground" /> {truck.driverName || 'Unassigned'}
                </p>
                <p className="text-xs text-muted-foreground">No linked profile available. Assign a registered driver to track telemetry and routes.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card 3: Compliance & Registration/Insurance expirations */}
        <Card>
          <CardHeader className="border-b border-border">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-lg bg-warning/10 flex items-center justify-center text-warning">
                <Calendar className="size-4" />
              </div>
              <div>
                <CardTitle className="text-sm">Compliance & Expiry Monitoring</CardTitle>
                <CardDescription className="text-xs">Road permit and insurance statuses</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">Insurance Validity</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-sm font-semibold text-foreground">
                    {truck.insuranceExpiry ? new Date(truck.insuranceExpiry).toLocaleDateString() : 'N/A'}
                  </span>
                  <span className={`text-xs ${insuranceStatus.color}`}>
                    {insuranceStatus.label}
                  </span>
                </div>
              </div>

              <div className="border-t pt-3">
                <p className="text-xs text-muted-foreground">Road Registration Validity</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-sm font-semibold text-foreground">
                    {truck.registrationExpiry ? new Date(truck.registrationExpiry).toLocaleDateString() : 'N/A'}
                  </span>
                  <span className={`text-xs ${registrationStatus.color}`}>
                    {registrationStatus.label}
                  </span>
                </div>
              </div>

              {(insuranceStatus.alert || registrationStatus.alert) && (
                <div className="mt-2 p-3 bg-destructive/5 border border-destructive/10 rounded flex items-start gap-2">
                  <ShieldAlert className="size-4 text-destructive shrink-0 mt-0.5" />
                  <p className="text-xs text-destructive-foreground font-normal">
                    Attention: Vehicle is not in full compliance. Please update credentials immediately.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Previous Drivers History */}
        <Card>
          <CardHeader className="border-b border-border">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground">
                <User className="size-4" />
              </div>
              <div>
                <CardTitle className="text-sm">Previous Drivers History</CardTitle>
                <CardDescription className="text-xs">Historical log of operators assigned to this truck</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {!truck.previousDrivers || truck.previousDrivers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No previous assignment records found.</p>
            ) : (
              <div className="divide-y divide-border">
                {truck.previousDrivers.map((record: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between py-3 hover:bg-muted/10 px-2 rounded-lg transition-colors duration-250 ease-luxe">
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-full bg-secondary flex items-center justify-center text-xs font-semibold text-muted-foreground">
                        {record.driverName?.charAt(0) || '?'}
                      </div>
                      <div>
                        {record.driverRef ? (
                          <button
                            onClick={() => navigate({ to: '/drivers/details' as any, search: { id: record.driverRef._id || record.driverRef } as any, state: { id: record.driverRef._id || record.driverRef } } as any)}
                            className="font-normal text-sm text-foreground hover:text-primary transition-colors text-left block duration-250 ease-luxe"
                          >
                            {record.driverName}
                          </button>
                        ) : (
                          <span className="font-normal text-sm text-foreground">{record.driverName}</span>
                        )}
                        <p className="text-xs text-muted-foreground">Assigned on: {new Date(record.assignedAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      </div>

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Decommission Truck"
        description="Are you sure you want to permanently decommission and remove this truck from the fleet? This action cannot be undone."
        confirmLabel="Decommission"
        variant="destructive"
        onConfirm={confirmDelete}
        loading={deleteTruck.isPending}
      />
    </div>
  )
}

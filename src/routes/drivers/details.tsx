import { createFileRoute, useNavigate, useRouter } from '@tanstack/react-router'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '#/components/ui/card'
import { User, Truck, ShieldAlert, ArrowLeft, Edit, Trash2, Calendar, AlertCircle, Star, Phone, Mail, FileText, Gauge } from 'lucide-react'
import { useDriverDetails, useDeleteDriver } from '#/lib/hooks/useDrivers'
import { useToast } from '#/lib/hooks/useToast'

export const Route = createFileRoute('/drivers/details')({
  validateSearch: (search: Record<string, unknown>): { id?: string; driverId?: string } => ({
    id: (search.id as string) || undefined,
    driverId: (search.driverId as string) || undefined,
  }),
  component: DriverDetailPage,
})

function getStatusBadge(status: string) {
  switch (status) {
    case 'On Trip': return <Badge className="bg-success text-success-foreground">{status}</Badge>
    case 'Active': return <Badge className="bg-info text-info-foreground">{status}</Badge>
    case 'Off Duty': return <Badge className="bg-warning text-warning-foreground">{status}</Badge>
    default: return <Badge variant="outline">{status}</Badge>
  }
}

function getSafetyColor(score: number) {
  if (score >= 95) return 'text-success bg-success/10 border-success/20'
  if (score >= 80) return 'text-warning bg-warning/10 border-warning/20'
  return 'text-destructive bg-destructive/10 border-destructive/20'
}

function getSafetyBarColor(score: number) {
  if (score >= 95) return 'bg-success'
  if (score >= 80) return 'bg-warning'
  return 'bg-destructive'
}

function getRatingStars(rating: number) {
  const stars = []
  for (let i = 1; i <= 5; i++) {
    if (i <= Math.floor(rating)) {
      stars.push(<Star key={i} size={16} className="text-warning fill-warning" />)
    } else if (i - rating < 1 && i - rating > 0) {
      stars.push(<Star key={i} size={16} className="text-warning fill-warning/50" />)
    } else {
      stars.push(<Star key={i} size={16} className="text-muted-foreground/30" />)
    }
  }
  return stars
}

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

function DriverDetailPage() {
  const navigate = useNavigate()
  const router = useRouter()
  const searchParams = Route.useSearch()
  const deleteDriver = useDeleteDriver()
  const toast = useToast()

  const driverState = (router.history.location.state as any)?.driver
  const driverId = searchParams.id || searchParams.driverId || driverState?._id || driverState?.id || (router.history.location.state as any)?.id

  const { data: driverDetails, isLoading } = useDriverDetails(driverId)

  const driver = driverDetails || driverState

  const handleBack = () => {
    window.history.length > 1 ? window.history.back() : navigate({ to: '/drivers/' as any })
  }

  const handleDelete = async () => {
    if (confirm('Are you sure you want to permanently remove this driver from the system?') && driver?._id) {
      try {
        await deleteDriver.mutateAsync(driver._id || driver.id)
        navigate({ to: '/drivers/' as any })
      } catch {
        toast.error('Failed to delete driver')
      }
    }
  }

  const handleEdit = () => {
    navigate({ to: '/drivers/form', state: { driver, isEdit: true } as any })
  }

  if (!driver && isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!driver) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-5 text-center">
        <div className="h-16 w-16 rounded-full bg-warning/10 flex items-center justify-center text-warning border border-warning/20">
          <AlertCircle size={32} />
        </div>
        <h2 className="text-2xl font-bold text-foreground">No Driver Selected</h2>
        <p className="text-muted-foreground max-w-sm">Please select a driver from the directory to view details.</p>
        <Button onClick={() => navigate({ to: '/drivers/' as any })}><ArrowLeft size={16} /> Back to Drivers</Button>
      </div>
    )
  }

  const licenseStatus = getComplianceStatus(driver.licenseExpiry)
  const getInitials = (name: string) => {
    const parts = name.split(' ')
    return `${parts[0]?.[0] || ''}${parts[1]?.[0] || ''}`.toUpperCase()
  }

  const assignedTruckName = driver.assignedTruckPlate || driver.assignedTruck
  const assignedTruckId = driver.assignedTruckId || driver.assignedTruckRef?._id || driver.assignedTruckRef

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={handleBack}>
            <ArrowLeft size={16} />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Driver Profile</h1>
            <p className="text-muted-foreground">License credentials, safety metrics, and contact information</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleEdit}>
            <Edit size={16} /> Edit Profile
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleteDriver.isPending}>
            <Trash2 size={16} /> {deleteDriver.isPending ? 'Removing...' : 'Remove Driver'}
          </Button>
        </div>
      </header>

      {/* Hero Badge Panel */}
      <Card className="card-hover">
        <CardContent className="p-6 md:p-8 bg-gradient-to-r from-primary/5 to-info/5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-2xl font-bold shadow-lg shrink-0">
              {getInitials(driver.name)}
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="font-mono text-xs">DL: {driver.licenseNumber}</Badge>
                {getStatusBadge(driver.status)}
              </div>
              <h2 className="text-3xl font-bold text-foreground mt-2">{driver.name}</h2>
              <p className="text-muted-foreground mt-1.5 text-sm flex items-center gap-1.5">
                License Class {driver.licenseClass} &bull;{' '}
                {assignedTruckName && assignedTruckName !== 'None' && assignedTruckId ? (
                  <button
                    onClick={() => navigate({ to: '/trucks/details' as any, search: { id: assignedTruckId } as any, state: { id: assignedTruckId } } as any)}
                    className="text-foreground hover:text-primary font-medium transition-colors underline underline-offset-2"
                  >
                    Assigned to {assignedTruckName}
                  </button>
                ) : assignedTruckName && assignedTruckName !== 'None' ? (
                  `Assigned to ${assignedTruckName}`
                ) : (
                  'No truck assigned'
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Grid */}
      <div className="grid gap-6 md:grid-cols-2">

        {/* Card 1: License & Credentials */}
        <Card>
          <CardHeader className="border-b border-border">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <FileText size={16} />
              </div>
              <div>
                <CardTitle className="text-sm">License & Credentials</CardTitle>
                <CardDescription className="text-xs">Driving license details and validity</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">License Number</p>
                <p className="text-lg font-bold font-mono text-foreground mt-1">{driver.licenseNumber}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">License Class</p>
                <p className="text-lg font-bold text-foreground mt-1">{driver.licenseClass}</p>
              </div>
            </div>

            <div className="border-t pt-4">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">License Expiry</p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-sm font-semibold text-foreground">
                  {driver.licenseExpiry ? new Date(driver.licenseExpiry).toLocaleDateString() : 'N/A'}
                </span>
                <span className={`text-xs ${licenseStatus.color}`}>
                  {licenseStatus.label}
                </span>
              </div>
            </div>

            {licenseStatus.alert && (
              <div className="mt-2 p-3 bg-destructive/5 border border-destructive/10 rounded flex items-start gap-2">
                <ShieldAlert className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                <p className="text-xs text-destructive-foreground font-medium">
                  Attention: License requires immediate renewal. Driver may not be legally permitted to operate.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card 2: Contact & Assignment */}
        <Card>
          <CardHeader className="border-b border-border">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-info/10 flex items-center justify-center text-info">
                <User size={16} />
              </div>
              <div>
                <CardTitle className="text-sm">Contact & Truck Assignment</CardTitle>
                <CardDescription className="text-xs">Communication details and vehicle assignment</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail size={16} className="text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm font-medium text-foreground">{driver.email || 'Not provided'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone size={16} className="text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="text-sm font-medium text-foreground">{driver.phone}</p>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center gap-3">
                <Truck size={16} className="text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Assigned Truck</p>
                  {assignedTruckName && assignedTruckName !== 'None' && assignedTruckId ? (
                    <button
                      onClick={() => navigate({ to: '/trucks/details' as any, search: { id: assignedTruckId } as any, state: { id: assignedTruckId } } as any)}
                      className="text-sm font-semibold text-foreground hover:text-primary transition-colors underline underline-offset-2"
                    >
                      {assignedTruckName}
                    </button>
                  ) : (
                    <p className="text-sm font-semibold text-foreground">
                      {assignedTruckName && assignedTruckName !== 'None' ? assignedTruckName : 'Unassigned'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Performance & Safety */}
        <Card>
          <CardHeader className="border-b border-border">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-warning/10 flex items-center justify-center text-warning">
                <Star size={16} />
              </div>
              <div>
                <CardTitle className="text-sm">Performance & Safety</CardTitle>
                <CardDescription className="text-xs">Driver rating and safety metrics</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Driver Rating</p>
                <div className="flex items-center gap-1.5 mt-2">
                  {getRatingStars(driver.rating || 0)}
                  <span className="text-sm font-bold text-foreground ml-1">{(driver.rating || 0).toFixed(1)}</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Safety Score</p>
                <div className={`inline-flex items-center gap-1.5 mt-2 px-2.5 py-0.5 rounded-full text-xs font-semibold ${getSafetyColor(driver.safetyScore || 0)}`}>
                  <Gauge size={12} /> {driver.safetyScore || 0}%
                </div>
              </div>
            </div>

            {/* Safety Score Bar */}
            <div className="space-y-1">
              <div className="h-2 bg-muted rounded-full overflow-hidden w-full">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${getSafetyBarColor(driver.safetyScore || 0)}`}
                  style={{ width: `${driver.safetyScore || 0}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {(driver.safetyScore || 0) >= 95 ? 'Excellent safety record' :
                 (driver.safetyScore || 0) >= 80 ? 'Acceptable - monitor closely' :
                 'Below threshold - review required'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Status & Activity */}
        <Card>
          <CardHeader className="border-b border-border">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-success/10 flex items-center justify-center text-success">
                <Calendar size={16} />
              </div>
              <div>
                <CardTitle className="text-sm">Status & Activity</CardTitle>
                <CardDescription className="text-xs">Current operational status and record timestamps</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Current Status</p>
              <div className="mt-2">
                {getStatusBadge(driver.status)}
              </div>
            </div>

            <div className="border-t pt-4 space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">Record Created</p>
                <p className="text-sm font-medium text-foreground">
                  {driver.createdAt ? new Date(driver.createdAt).toLocaleDateString() : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Last Updated</p>
                <p className="text-sm font-medium text-foreground">
                  {driver.updatedAt ? new Date(driver.updatedAt).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Card 5: Previous Trucks History */}
      <Card className="md:col-span-2">
        <CardHeader className="border-b border-border">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground">
              <Truck size={16} />
            </div>
            <div>
              <CardTitle className="text-sm">Previous Trucks History</CardTitle>
              <CardDescription className="text-xs">Historical log of trucks this driver has been assigned to</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {!driver.previousTrucks || driver.previousTrucks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No previous truck assignment records found.</p>
          ) : (
            <div className="divide-y divide-border">
              {driver.previousTrucks.map((record: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between py-3 hover:bg-muted/10 px-2 rounded-lg transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-muted-foreground">
                      {record.truckPlate?.charAt(0) || '?'}
                    </div>
                    <div>
                      {record.truckRef && typeof record.truckRef === 'object' ? (
                        <button
                          onClick={() => navigate({ to: '/trucks/details' as any, search: { id: record.truckRef._id || record.truckRef } as any, state: { id: record.truckRef._id || record.truckRef } } as any)}
                          className="font-medium text-sm text-foreground hover:text-primary transition-colors text-left block"
                        >
                          {record.truckPlate}
                          {record.truckRef.model && (
                            <span className="text-xs text-muted-foreground font-normal ml-1.5">({record.truckRef.model})</span>
                          )}
                        </button>
                      ) : (
                        <span className="font-medium text-sm text-foreground">{record.truckPlate}</span>
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
  )
}

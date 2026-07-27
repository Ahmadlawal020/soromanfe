import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '#/components/ui/card'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Badge } from '#/components/ui/badge'
import { Separator } from '#/components/ui/separator'
import { Loader2, ArrowLeft, Save, CheckCircle, FileText, Edit, Trash2, User, Calendar, Banknote, MapPin, Package, ShieldAlert } from 'lucide-react'
import { usePfiDetails, useUpdatePfi, useDeletePfi } from '#/lib/hooks/usePfis'
import { useAdminList } from '#/lib/hooks/useAdmin'
import { useToast } from '#/lib/hooks/useToast'
import { toNum } from '#/lib/utils'

export const Route = createFileRoute('/pfi/details')({
  validateSearch: (search: Record<string, unknown>): { id: string } => {
    return {
      id: search.id as string || '',
    }
  },
  component: PFIDetails,
})

function fmtQty(n: number) {
  return n.toLocaleString(undefined, { maximumFractionDigits: 0 })
}

function fmtCurrency(n: number) {
  return `₦${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function PFIDetails() {
  const navigate = useNavigate()
  const toast = useToast()
  const { id } = Route.useSearch()

  const { data: pfi, isLoading, error: fetchError } = usePfiDetails(id)
  const { mutateAsync: updatePfi, isPending } = useUpdatePfi()
  const { mutateAsync: deletePfi, isPending: isDeleting } = useDeletePfi()
  const { data: adminsData } = useAdminList()

  const staff = Array.isArray(adminsData) ? adminsData : []

  const getOfficerName = (idOrName: string | number | null | undefined, storedName?: string | null) => {
    if (!idOrName && !storedName) return 'Unassigned'
    if (idOrName) {
      const found = staff.find((u: any) => String(u.id) === String(idOrName) || String(u._id) === String(idOrName))
      if (found) return found.full_name
    }
    if (storedName) return storedName
    return 'Unassigned'
  }

  const [form, setForm] = useState({
    closureDate: new Date().toISOString().split('T')[0],
    totalInflow: '',
    bank: '',
    purchaseCost: '',
    aggregateExpenses: '',
    handler: '',
    remarks: '',
  })

  const [error, setError] = useState('')

  if (isLoading) {
    return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
  }

  if (fetchError || !pfi) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
        <FileText className="w-12 h-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold">PFI Not Found</h2>
        <p className="text-muted-foreground">The requested PFI details could not be loaded.</p>
        <Button onClick={() => navigate({ to: '/pfi' as any })}>Back to PFI List</Button>
      </div>
    )
  }

  const starting = Number(pfi.startingQtyLitres || 0)
  const sold = Number(pfi.soldQtyLitres || 0)
  const remaining = Math.max(0, starting - sold)
  const isActive = pfi.status === 'active'

  const handleEdit = () => {
    navigate({ to: '/pfi/form', state: { pfi, isEdit: true } as any })
  }

  const handleDelete = async () => {
    const targetId = pfi?._id || pfi?.id
    if (confirm('Are you sure you want to permanently delete this PFI and all associated data?') && targetId) {
      try {
        await deletePfi(String(targetId))
        navigate({ to: '/pfi' as any })
      } catch (err: any) {
        toast.error(err?.response?.data?.message || err.message || 'Failed to delete PFI')
      }
    }
  }

  const handleClosePfi = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      await updatePfi({
        id,
        data: {
          status: 'finished',
          closureDate: form.closureDate || undefined,
          totalInflow: form.totalInflow ? Number(form.totalInflow.replace(/,/g, '')) : undefined,
          closureBank: form.bank.trim() || undefined,
          purchaseCost: form.purchaseCost ? Number(form.purchaseCost.replace(/,/g, '')) : undefined,
          aggregateExpenses: form.aggregateExpenses ? Number(form.aggregateExpenses.replace(/,/g, '')) : undefined,
          closureHandler: form.handler.trim() || undefined,
          closureRemarks: form.remarks.trim() || undefined,
        }
      })
      navigate({ to: '/pfi' as any })
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to close PFI')
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate({ to: '/pfi' as any })}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">PFI Profile Details</h1>
            <p className="text-muted-foreground">Monitor PFI transaction logs, quantities, assigned officers, and closure state</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleEdit}>
            <Edit size={16} className="mr-2" /> Edit PFI
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
            <Trash2 size={16} className="mr-2" /> {isDeleting ? 'Deleting...' : 'Delete PFI'}
          </Button>
        </div>
      </header>

      {/* Hero Badge Panel */}
      <Card className="card-hover">
        <CardContent className="p-6 md:p-8 bg-gradient-to-r from-primary/5 to-info/5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary shadow-lg shrink-0">
              <FileText size={36} />
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="font-mono text-xs">PFI ID: {pfi._id}</Badge>
                {isActive ? (
                  <Badge className="bg-success text-success-foreground">Active</Badge>
                ) : (
                  <Badge variant="secondary">Finished</Badge>
                )}
              </div>
              <h2 className="text-3xl font-bold text-foreground mt-2">{pfi.pfiNumber}</h2>
              <p className="text-muted-foreground mt-1.5 text-sm flex items-center gap-1.5">
                {pfi.description || 'Pro Forma Invoice details and logistics status'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Card 1: PFI Information */}
        <Card>
          <CardHeader className="border-b border-border">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <MapPin size={16} />
              </div>
              <div>
                <CardTitle className="text-sm">Information & Location</CardTitle>
                <CardDescription className="text-xs">Date, product and terminal origin details</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-4 text-sm">
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-muted-foreground font-medium">PFI Date</dt>
                <dd className="font-semibold text-foreground mt-0.5">{pfi.pfiDate ? new Date(pfi.pfiDate).toLocaleDateString() : '—'}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground font-medium">Location</dt>
                <dd className="font-semibold text-foreground mt-0.5">{pfi.locationName || '—'}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground font-medium">Product Type</dt>
                <dd className="font-semibold text-foreground mt-0.5">{pfi.productName || '—'}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground font-medium">Qty Volume (MT)</dt>
                <dd className="font-semibold text-foreground mt-0.5">{pfi.qtyVolumeMt || '—'}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground font-medium">Unit Price</dt>
                <dd className="font-semibold text-foreground mt-0.5">
                  {pfi.unitPrice ? `₦${Number(pfi.unitPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / Ltr` : '—'}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {/* Card 2: Vessel & Surveyor */}
        <Card>
          <CardHeader className="border-b border-border">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-info/10 flex items-center justify-center text-info">
                <Package size={16} />
              </div>
              <div>
                <CardTitle className="text-sm">Vessel & Surveyor Logs</CardTitle>
                <CardDescription className="text-xs">Vessel broker name, vessel name, surveyor contact</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-4 text-sm">
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-muted-foreground font-medium">Vessel Broker</dt>
                <dd className="font-semibold text-foreground mt-0.5">{pfi.vesselBroker || '—'}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground font-medium">Vessel Name</dt>
                <dd className="font-semibold text-foreground mt-0.5">{pfi.vesselName || '—'}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground font-medium">Surveyor Name</dt>
                <dd className="font-semibold text-foreground mt-0.5">{pfi.surveyorName || '—'}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground font-medium">Surveyor Phone</dt>
                <dd className="font-semibold text-foreground mt-0.5">{pfi.surveyorPhone || '—'}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {/* Card 3: Assigned Officers */}
        <Card>
          <CardHeader className="border-b border-border">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-warning/10 flex items-center justify-center text-warning">
                <User size={16} />
              </div>
              <div>
                <CardTitle className="text-sm">Assigned Personnel</CardTitle>
                <CardDescription className="text-xs">Compliance, security and product managers</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-4 text-sm">
            <dl className="grid grid-cols-2 gap-y-3 gap-x-4">
              <div>
                <dt className="text-muted-foreground font-medium">Audit Officer</dt>
                <dd className="font-semibold text-foreground mt-0.5">{getOfficerName(pfi.auditOfficerId, pfi.auditOfficerName)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground font-medium">Product Officer</dt>
                <dd className="font-semibold text-foreground mt-0.5">{getOfficerName(pfi.productOfficerId, pfi.productOfficerName)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground font-medium">IT Compliance Officer</dt>
                <dd className="font-semibold text-foreground mt-0.5">{getOfficerName(pfi.itComplianceOfficerId, pfi.itComplianceOfficerName)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground font-medium">Security Exit Officer</dt>
                <dd className="font-semibold text-foreground mt-0.5">{getOfficerName(pfi.securityExitOfficerId, pfi.securityExitOfficerName)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground font-medium">Commission Officer</dt>
                <dd className="font-semibold text-foreground mt-0.5">{getOfficerName(pfi.commissionOfficerId, pfi.commissionOfficerName)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground font-medium">Sales Manager</dt>
                <dd className="font-semibold text-foreground mt-0.5">{getOfficerName(pfi.salesManagerId, pfi.salesManagerName)}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {/* Card 4: Quantities & Revenue */}
        <Card>
          <CardHeader className="border-b border-border">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-success/10 flex items-center justify-center text-success">
                <Banknote size={16} />
              </div>
              <div>
                <CardTitle className="text-sm">Quantities & Revenue</CardTitle>
                <CardDescription className="text-xs">Inventory metrics and financial totals</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Starting Qty (Ltr)</p>
                <p className="text-lg font-bold text-foreground mt-1">{fmtQty(starting)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total Revenue</p>
                <p className="text-lg font-bold text-success mt-1">{fmtCurrency(toNum(pfi.totalAmount))}</p>
              </div>
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Sold Qty (Ltr)</p>
                <p className="text-lg font-bold text-emerald-600 mt-1">{fmtQty(sold)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Remaining Qty (Ltr)</p>
                <p className="text-lg font-bold text-amber-600 mt-1">{fmtQty(remaining)}</p>
              </div>
            </div>
            {starting > 0 && (
              <div className="space-y-1 mt-2">
                <div className="h-2 bg-muted rounded-full overflow-hidden w-full">
                  <div className="h-full bg-emerald-500 rounded-full transition-all duration-700" style={{ width: `${Math.min(100, (sold / starting) * 100)}%` }} />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{((sold / starting) * 100).toFixed(1)}% sold</span>
                  <span>{((remaining / starting) * 100).toFixed(1)}% left</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card 5: Closure Card */}
        <div className="md:col-span-2">
          {isActive ? (
            <Card className="border-primary/20 shadow-md">
              <CardHeader className="bg-primary/5 border-b border-primary/10">
                <CardTitle className="text-primary flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Close PFI
                </CardTitle>
                <CardDescription>Enter final closure details to mark this PFI as finished.</CardDescription>
              </CardHeader>
              <form onSubmit={handleClosePfi}>
                <CardContent className="space-y-4 pt-6">
                  {error && (
                    <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm font-medium mb-4 flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Closure Date</Label>
                      <Input type="date" value={form.closureDate} onChange={e => setForm({ ...form, closureDate: e.target.value })} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Closure Bank</Label>
                      <Input placeholder="e.g. Zenith Bank" value={form.bank} onChange={e => setForm({ ...form, bank: e.target.value })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Total Inflow (₦)</Label>
                      <Input type="number" placeholder="0.00" value={form.totalInflow} onChange={e => setForm({ ...form, totalInflow: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Purchase Cost (₦)</Label>
                      <Input type="number" placeholder="0.00" value={form.purchaseCost} onChange={e => setForm({ ...form, purchaseCost: e.target.value })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Aggregate Expenses (₦)</Label>
                      <Input type="number" placeholder="0.00" value={form.aggregateExpenses} onChange={e => setForm({ ...form, aggregateExpenses: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Closure Handler</Label>
                      <Input placeholder="Name of handler" value={form.handler} onChange={e => setForm({ ...form, handler: e.target.value })} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Closure Remarks</Label>
                    <Input placeholder="Any final remarks..." value={form.remarks} onChange={e => setForm({ ...form, remarks: e.target.value })} />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-3 bg-muted/50 p-4 border-t">
                  <Button type="submit" className="w-full sm:w-auto" disabled={isPending}>
                    {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Finish PFI
                  </Button>
                </CardFooter>
              </form>
            </Card>
          ) : (
            <Card>
              <CardHeader className="border-b border-border">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground">
                    <Calendar size={16} />
                  </div>
                  <div>
                    <CardTitle className="text-sm">Closure Summary</CardTitle>
                    <CardDescription className="text-xs">Final closure audit details</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4 text-sm">
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <dt className="text-muted-foreground font-medium">Closure Date</dt>
                    <dd className="font-semibold text-foreground mt-0.5">{pfi.closureDate ? new Date(pfi.closureDate).toLocaleDateString() : '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground font-medium">Closure Bank</dt>
                    <dd className="font-semibold text-foreground mt-0.5">{pfi.closureBank || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground font-medium">Total Inflow</dt>
                    <dd className="font-semibold text-success mt-0.5">{pfi.totalInflow ? fmtCurrency(toNum(pfi.totalInflow)) : '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground font-medium">Purchase Cost</dt>
                    <dd className="font-semibold text-destructive mt-0.5">{pfi.purchaseCost ? fmtCurrency(toNum(pfi.purchaseCost)) : '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground font-medium">Aggregate Expenses</dt>
                    <dd className="font-semibold text-destructive mt-0.5">{pfi.aggregateExpenses ? fmtCurrency(toNum(pfi.aggregateExpenses)) : '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground font-medium">Closure Handler</dt>
                    <dd className="font-semibold text-foreground mt-0.5">{pfi.closureHandler || '—'}</dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-muted-foreground font-medium">Remarks</dt>
                    <dd className="italic text-foreground mt-0.5">{pfi.closureRemarks || 'No remarks provided.'}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Plus, Pencil, TrendingUp, Loader2, BarChart3, RefreshCw, CheckCircle } from 'lucide-react'

import { PageHeader } from '#/components/PageHeader'
import { StatCard } from '#/components/ui/stat-card'
import { Button } from '#/components/ui/button'

import { CommaInput } from '#/components/ui/comma-input'
import { Label } from '#/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '#/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '#/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '#/components/ui/table'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '#/components/ui/dialog'

import { PageLoader } from '#/components/PageLoader'
import { PageError } from '#/components/PageError'
import { PageEmpty } from '#/components/PageEmpty'

import { useCommissionRates, useUpsertCommissionRate } from '#/lib/hooks/useCommissions'
import { useDepots } from '#/lib/hooks/useDepots'
import { useProductList } from '#/lib/hooks/useProducts'
import type { CommissionRate } from '#/lib/types'

export const Route = createFileRoute('/commission-rates/')({
  component: CommissionRatesPage,
})

function CommissionRatesPage() {
  const { data: rates = [], isLoading, isError, error, refetch } = useCommissionRates()
  const { data: depots = [] } = useDepots()
  const { data: productsResponse } = useProductList()
  const upsertMutation = useUpsertCommissionRate()

  const products = (productsResponse as any)?.products || []

  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingRate, setEditingRate] = useState<CommissionRate | null>(null)
  const [editForm, setEditForm] = useState({ depotId: '', productId: '', commissionRate: '' })
  const [saving, setSaving] = useState(false)

  const openAddNew = () => {
    setEditingRate(null)
    setEditForm({ depotId: '', productId: '', commissionRate: '' })
    setShowEditDialog(true)
  }

  const openEdit = (rate: CommissionRate) => {
    setEditingRate(rate)
    setEditForm({
      depotId: String(rate.depotId),
      productId: String(rate.productId),
      commissionRate: String(rate.commissionRate),
    })
    setShowEditDialog(true)
  }

  const handleSave = async () => {
    if (!editForm.depotId || !editForm.productId || !editForm.commissionRate) return
    setSaving(true)
    try {
      await upsertMutation.mutateAsync({
        depotId: editForm.depotId,
        productId: editForm.productId,
        commissionRate: parseFloat(editForm.commissionRate) || 0,
      })
      setShowEditDialog(false)
    } catch {
      // error handled by mutation
    } finally {
      setSaving(false)
    }
  }

  const depotsArr = depots as any[]

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Finance"
        title="Commission rates"
        description="The rate applied per depot and product. Changing one affects every commission calculated from it onwards."
      />

      {/* Rate Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard icon={<TrendingUp />} label="Rates Configured" value={rates.length} description="Depot × Product combinations" />
        <StatCard icon={<BarChart3 />} label="Depots Covered" value={new Set(rates.map((r) => r.depotId)).size} description="With commission rates set" />
      </div>

      {/* Rates Table */}
      <Card>
        <CardHeader className="border-b border-border p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg">Commission Rate Directory</CardTitle>
              <CardDescription>Set the commission rate (₦/L) for each depot and product combination</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
                <RefreshCw className="size-4" />
                Refresh
              </Button>
              <Button size="sm" onClick={openAddNew} className="gap-2">
                <Plus className="size-4" />
                Add Rate
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8">
              <PageLoader message="Loading commission rates…" />
            </div>
          ) : isError ? (
            <div className="p-8">
              <PageError message={(error as any)?.message || 'Failed to load rates'} onRetry={() => refetch()} />
            </div>
          ) : rates.length === 0 ? (
            <div className="p-8">
              <PageEmpty
                icon={<TrendingUp className="size-8 text-muted-foreground" />}
                title="No commission rates configured"
                description="Add commission rates per depot and product to start tracking commissions."
                actionLabel="Add First Rate"
                onAction={openAddNew}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 text-xs uppercase font-semibold text-muted-foreground">
                    <TableHead className="w-12 text-center">#</TableHead>
                    <TableHead>Depot</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Commission Rate</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead className="text-center">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rates.map((rate, idx) => (
                    <TableRow key={rate.id} className="hover:bg-muted/40 transition-colors duration-250 ease-luxe">
                      <TableCell className="text-center text-xs text-muted-foreground font-mono">
                        {idx + 1}
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-foreground">{rate.depotName}</div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {rate.depotCity}{rate.depotCity && rate.depotState ? ', ' : ''}{rate.depotState}
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-sm">{rate.productName}</div>
                        {rate.productSku && (
                          <div className="text-xs text-muted-foreground font-mono">SKU: {rate.productSku}</div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-mono text-sm font-semibold text-foreground">
                          ₦{rate.commissionRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/L
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {rate.updatedAt ? new Date(rate.updatedAt).toLocaleDateString() : '—'}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-primary hover:text-primary/80 hover:bg-primary/10 gap-1 text-xs"
                          onClick={() => openEdit(rate)}
                        >
                          <Pencil className="size-3.5" />
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Rate Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="size-5 text-primary" />
              {editingRate ? 'Edit Commission Rate' : 'Add Commission Rate'}
            </DialogTitle>
            <DialogDescription>
              {editingRate
                ? `Update the commission rate for ${editingRate.productName} at ${editingRate.depotName}`
                : 'Set a commission rate for a depot and product combination'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div>
              <Label className="text-xs">Depot</Label>
              <Select
                value={editForm.depotId}
                onValueChange={(v) => setEditForm((p) => ({ ...p, depotId: v }))}
                disabled={!!editingRate}
              >
                <SelectTrigger className="h-9 mt-1">
                  <SelectValue placeholder="Select depot" />
                </SelectTrigger>
                <SelectContent>
                  {depotsArr.map((d) => (
                    <SelectItem key={d.id} value={String(d.id)}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Product</Label>
              <Select
                value={editForm.productId}
                onValueChange={(v) => setEditForm((p) => ({ ...p, productId: v }))}
                disabled={!!editingRate}
              >
                <SelectTrigger className="h-9 mt-1">
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p: any) => (
                    <SelectItem key={p.id || p._id} value={String(p.id || p._id)}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Commission Rate (₦ per Litre)</Label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-mono font-normal">
                  ₦
                </span>
                <CommaInput
                  className="pl-8 h-10 text-right font-mono font-semibold text-base"
                  placeholder="0.00"
                  value={editForm.commissionRate}
                  onValueChange={(val) => setEditForm((p) => ({ ...p, commissionRate: val }))}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border">
            <Button variant="outline" onClick={() => setShowEditDialog(false)} disabled={saving}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !editForm.depotId || !editForm.productId || !editForm.commissionRate}
              className="gap-2"
            >
              {saving ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle className="size-4" />}
              {saving ? 'Saving…' : 'Save Rate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

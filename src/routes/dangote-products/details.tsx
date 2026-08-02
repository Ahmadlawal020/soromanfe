import { useState } from 'react'
import { PageHeader } from '#/components/PageHeader'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '#/components/ui/card'
import { Fuel, Layers, ArrowLeft, Edit, Trash2, AlertOctagon, Scale, Thermometer, ShieldAlert, Archive, Truck, AlertCircle, Loader2, Package } from 'lucide-react'
import { useProductDetails, useDeleteProduct } from '#/lib/hooks/useProducts'

import { Breadcrumbs } from '#/components/Breadcrumbs'
import { ConfirmDialog } from '#/components/ConfirmDialog'

export const Route = createFileRoute('/dangote-products/details')({
  validateSearch: (search: Record<string, unknown>) => ({
    id: (search.id as string) || '',
  }),
  component: DangoteProductDetailPage,
})

function DangoteProductDetailPage() {
  const navigate = useNavigate()
  const { id } = Route.useSearch()
  const { data: product, isLoading: isLoadingProduct } = useProductDetails(id)

  const deleteProduct = useDeleteProduct()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const isLoading = isLoadingProduct

  const handleBack = () => {
    window.history.length > 1 ? window.history.back() : navigate({ to: '/dangote-products/' as any })
  }

  const handleDelete = async () => {
    if (!product?._id) return
    try {
      await deleteProduct.mutateAsync(product._id)
      navigate({ to: '/dangote-products' as any })
    } catch {
      // Error handled by mutation
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-5 text-center">
        <div className="size-16 rounded-full bg-warning/10 flex items-center justify-center text-warning border border-warning/20">
          <AlertCircle className="size-8" />
        </div>
        <h2 className="text-lg md:text-xl font-semibold text-foreground tracking-tight">Product Not Found</h2>
        <p className="text-muted-foreground max-w-sm">The Dangote product you're looking for doesn't exist or may have been removed.</p>
        <Button onClick={handleBack}><ArrowLeft className="size-4" /> Back to Dangote Products</Button>
      </div>
    )
  }



  const detailRows = [
    { label: 'Product Name', value: product.name, icon: Fuel },
    { label: 'SKU Code', value: product.sku, icon: Archive },
    { label: 'Category', value: product.category, icon: Layers },
    ...(product.gradeClass ? [{ label: 'Quality Grade', value: product.gradeClass, icon: Scale }] : []),
    { label: 'Unit', value: product.unit || 'Liters', icon: Archive },
    { label: 'Supplier', value: product.supplier || 'N/A', icon: Truck },
  ]

  const technicalRows = [
    { label: 'Density Range', value: product.density || 'N/A', icon: Scale },
    { label: 'Flash Point', value: product.flashPoint || 'N/A', icon: Thermometer },
    { label: 'UN Number', value: product.unNumber || 'N/A', icon: AlertOctagon },
    { label: 'Hazard Class', value: product.hazardClass || 'None', icon: ShieldAlert },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <Breadcrumbs items={[{ label: 'Dangote Products', href: '/dangote-products' }, { label: product.name || 'Details' }]} />

      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <PageHeader
      eyebrow="Dangote Delivery"
      title={product.name}
      description="Dangote product details and specifications"
    />
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate({ to: '/dangote-products/form', search: { id: product._id } } as any)}>
            <Edit className="size-4" /> Edit Product
          </Button>
          <Button variant="destructive" onClick={() => setShowDeleteDialog(true)} disabled={deleteProduct.isPending}>
            <Trash2 className="size-4" /> {deleteProduct.isPending ? 'Removing...' : 'Remove Product'}
          </Button>
        </div>
      </header>

      {/* Hero Badge */}
      <Card className="card-hover">
        <CardContent className="bg-primary/5 p-6 md:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="size-20 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-2xl font-semibold shrink-0 tabular-nums">
              <Fuel className="size-8" />
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="font-mono text-xs">{product.sku}</Badge>
                {product.gradeClass && <Badge className="bg-success text-success-foreground">{product.gradeClass}</Badge>}
              </div>
              <h2 className="text-lg md:text-xl font-semibold text-foreground mt-2 tracking-tight">{product.name}</h2>
              <p className="text-muted-foreground mt-1.5 text-sm">{product.description || 'No description provided'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Basic Details */}
        <Card>
          <CardHeader className="border-b border-border">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-lg bg-info/10 flex items-center justify-center text-info">
                <Package className="size-4" />
              </div>
              <div>
                <CardTitle className="text-sm">Product Information</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            {detailRows.map((row) => (
              <div key={row.label} className="flex items-center gap-3">
                <row.icon className="size-4 text-muted-foreground shrink-0" />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">{row.label}</p>
                  <p className="text-sm font-normal text-foreground">{row.value}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Technical Specs */}
        <Card>
          <CardHeader className="border-b border-border">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-lg bg-warning/10 flex items-center justify-center text-warning">
                <Scale className="size-4" />
              </div>
              <div>
                <CardTitle className="text-sm">Technical Specifications</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            {technicalRows.map((row) => (
              <div key={row.label} className="flex items-center gap-3">
                <row.icon className="size-4 text-muted-foreground shrink-0" />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">{row.label}</p>
                  <p className="text-sm font-normal text-foreground">{row.value}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>



      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Remove Dangote Product"
        description="Are you sure you want to permanently remove this Dangote product? This action cannot be undone."
        confirmLabel="Remove Product"
        variant="destructive"
        onConfirm={handleDelete}
        loading={deleteProduct.isPending}
      />
    </div>
  )
}

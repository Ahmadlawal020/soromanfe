import { useState } from 'react'
import { PageHeader } from '#/components/PageHeader'
import { StatCard } from '#/components/ui/stat-card'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '#/components/ui/card'
import { Input } from '#/components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '#/components/ui/select'
import { Fuel, Search, Plus, Eye, Edit, Layers, Flame, X, Package } from 'lucide-react'
import { PageLoader } from '#/components/PageLoader'
import { PageError } from '#/components/PageError'
import { PageEmpty } from '#/components/PageEmpty'
import { useProductList } from '#/lib/hooks/useProducts'

export const Route = createFileRoute('/products/')({
  component: ProductsDashboard,
})

export interface ProductItem { _id: string; id?: string; name: string; sku: string; category: string; gradeClass: string; description?: string; density?: string; flashPoint?: string; unNumber?: string; hazardClass?: string; unit?: string; supplier?: string }

const categoryList = [
  'PMS (Premium Motor Spirit)',
  'AGO (Automotive Gas Oil)',
  'DPK (Dual Purpose Kerosene)',
  'Jet A-1 (Aviation Fuel)',
  'LPG (Liquefied Petroleum Gas)',
  'LPFO / Heavy Fuel Oil',
  'Lubricants & Base Oils',
]

const categoryColors: Record<string, string> = {
  'PMS (Premium Motor Spirit)': 'from-primary to-[#7ed3bf]',
  'AGO (Automotive Gas Oil)': 'from-success to-[#6ec89a]',
  'DPK (Dual Purpose Kerosene)': 'from-warning to-warning',
  'Jet A-1 (Aviation Fuel)': 'from-muted to-muted',
  'LPG (Liquefied Petroleum Gas)': 'from-info to-muted',
  'LPFO / Heavy Fuel Oil': 'from-destructive to-destructive',
  'Lubricants & Base Oils': 'from-muted to-muted',
}

function ProductsDashboard() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  const { data, isLoading, isError, error, refetch } = useProductList({
    search: searchTerm || undefined,
    category: selectedCategory !== 'all' ? selectedCategory : undefined,
    productType: 'soroman',
  })

  const products: ProductItem[] = data?.products || []
  const hasFilters = !!(searchTerm || selectedCategory !== 'all')

  const statsCards = [
    { title: 'Total Products', value: data?.pagination?.total ?? products.length, sub: 'Petroleum products registered', icon: Fuel },
    { title: 'Categories', value: new Set(products.map((p) => p.category)).size, sub: 'Product classifications', icon: Layers },
    { title: 'Grade Types', value: new Set(products.map((p) => p.gradeClass)).size, sub: 'Quality classifications', icon: Flame },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
      eyebrow="Operations"
      title="Petroleum Products"
      description="Manage petroleum product listings, grades, and distribution categories."
      actions={
        <>
          <Button size="sm"  onClick={() => navigate({ to: '/products/form', search: { id: '' } })}><Plus className="size-4 mr-2" />Register New Product</Button>
        </>
      }
    />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {!isLoading && !isError && statsCards.map((card) => (
          <StatCard key={card.title} icon={<card.icon />} label={card.title} value={card.value} description={card.sub} />
        ))}
      </div>

      <Card>
        <CardHeader className="border-b border-border">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div><CardTitle>Fuel & Petroleum Inventory</CardTitle><CardDescription>Review product grades, categories, and quality classifications</CardDescription></div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input type="text" placeholder="Search product name or SKU..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
              {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 size-5 rounded-full bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground flex items-center justify-center cursor-pointer transition-colors duration-250 ease-luxe"><X className="size-2.5" /></button>}
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-[200px]"><SelectValue placeholder="All Categories" /></SelectTrigger>
              <SelectContent><SelectItem value="all">All Categories</SelectItem>{categoryList.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <PageLoader message="Loading products..." />
          ) : isError ? (
            <PageError message={(error as any)?.message || 'Failed to load'} onRetry={() => refetch()} />
          ) : products.length === 0 ? (
            <PageEmpty
              icon={<Package className="size-6 text-muted-foreground" />}
              title={hasFilters ? 'No products match your filters' : 'No products yet'}
              description={hasFilters ? 'Try adjusting your search or filter criteria.' : 'Add your first product to get started.'}
              actionLabel="Add Product"
              onAction={() => navigate({ to: '/products/form', search: { id: '' } })}
              hasFilters={hasFilters}
              onClearFilters={() => { setSearchTerm(''); setSelectedCategory('all') }}
 />
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <Card
                  key={product._id}
                  className="card-hover cursor-pointer"
                  onClick={() => navigate({ to: '/products/details', search: { id: product._id } })}
 >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-1"><h3 className="text-base font-semibold text-foreground leading-snug pr-2">{product.name}</h3><Badge variant="outline" className="font-mono text-xs shrink-0">{product.sku}</Badge></div>
                    <div className="flex items-center gap-2 mb-4"><div className={`size-6 rounded-md ${categoryColors[product.category] || 'from-muted to-muted'} flex items-center justify-center`}><Layers className="size-3 text-white" /></div><span className="text-xs text-muted-foreground">{product.category}</span></div>
                    <div className="flex items-center justify-between pt-3 border-t border-border"><div className="flex items-center gap-1.5"><Flame className="size-3.5 text-muted-foreground" /><span className="text-xs text-muted-foreground">Grade</span></div><Badge className="bg-success text-success-foreground text-xs">{product.gradeClass}</Badge></div>
                    <div className="flex gap-2 pt-4 mt-4 border-t border-border">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={(e) => { e.stopPropagation(); navigate({ to: '/products/details', search: { id: product._id } }) }}
 >
                        <Eye className="size-3.5" /> View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={(e) => { e.stopPropagation(); navigate({ to: '/products/form', search: { id: product._id } }) }}
 >
                        <Edit className="size-3.5" /> Edit
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Fuel, Layers, Plus, Pencil } from 'lucide-react'

import { PageHeader } from '#/components/PageHeader'
import { FilterBar, FilterSearch, FilterClear } from '#/components/FilterBar'
import { StatCard, StatCardGrid } from '#/components/ui/stat-card'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { NativeSelect } from '#/components/ui/native-select'
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '#/components/ui/table'
import { PageLoader } from '#/components/PageLoader'
import { PageError } from '#/components/PageError'
import { PageEmpty } from '#/components/PageEmpty'
import { PANEL, MICRO } from '#/lib/panel'
import { cn, getErrorMessage } from '#/lib/utils'
import { useProductList } from '#/lib/hooks/useProducts'
import { routeGuard } from '#/lib/route-guard'

export const Route = createFileRoute('/products/')({
  beforeLoad: () => routeGuard('/products'),
  component: ProductsDashboard,
})

export interface ProductItem { _id: string; id?: string; name: string; sku: string; category: string; gradeClass: string; description?: string; density?: string; flashPoint?: string; unNumber?: string; hazardClass?: string; unit?: string; supplier?: string }

function ProductsDashboard() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')

  const { data, isLoading, isError, error, refetch } = useProductList({
    search: search || undefined,
    category: category !== 'all' ? category : undefined,
    productType: 'soroman',
  })

  const products: ProductItem[] = data?.products || []
  const hasFilters = !!(search || category !== 'all')
  const categories = [...new Set(products.map((p) => p.category).filter(Boolean))].sort()

  const clear = () => { setSearch(''); setCategory('all') }

  if (isLoading) return <PageLoader message="Loading products…" />
  if (isError) return <PageError message={getErrorMessage(error)} onRetry={() => refetch()} />

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operations"
        title="Products"
        description="The petroleum products you buy and sell."
        actions={
          <Button onClick={() => navigate({ to: '/products/form', search: { id: '' } })}>
            <Plus data-icon="inline-start" />
            New product
          </Button>
        }
      />

      <StatCardGrid count={2}>
        <StatCard
          icon={<Fuel />} label="Products" value={data?.pagination?.total ?? products.length}
          description="Registered and sellable"
        />
        <StatCard
          icon={<Layers />} label="Categories" value={categories.length}
          description="Product classifications"
        />
      </StatCardGrid>

      <FilterBar>
        <FilterSearch value={search} onChange={setSearch} placeholder="Search name or SKU…" />
        <NativeSelect className="w-48" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="all">All categories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </NativeSelect>
        {hasFilters && <FilterClear onClear={clear} />}
      </FilterBar>

      <section className={PANEL}>
        {products.length === 0 ? (
          <PageEmpty
            icon={<Fuel className="size-6 text-muted-foreground" />}
            title={hasFilters ? 'No products match those filters' : 'No products yet'}
            description={hasFilters ? 'Try a different search or category.' : 'Add one to start pricing and selling it.'}
            actionLabel={hasFilters ? undefined : 'New product'}
            onAction={hasFilters ? undefined : () => navigate({ to: '/products/form', search: { id: '' } })}
            hasFilters={hasFilters}
            onClearFilters={clear}
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="hidden md:table-cell">Grade</TableHead>
                  <TableHead className="hidden lg:table-cell">Unit</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow
                    key={product._id || product.id}
                    className="cursor-pointer"
                    onClick={() => navigate({ to: '/products/details', search: { id: product._id } })}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{product.name}</span>
                        {product.sku && (
                          <Badge variant="outline" className="font-mono text-xs">{product.sku}</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{product.category || '—'}</TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {product.gradeClass || '—'}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground">
                      {product.unit || '—'}
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost" size="icon-sm" title="Edit product"
                        onClick={() => navigate({ to: '/products/form', search: { id: product._id } })}
                      >
                        <Pencil />
                        <span className="sr-only">Edit {product.name}</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {products.length > 0 && (
          <p className={cn(MICRO, 'border-t border-foreground/10 p-3 text-muted-foreground')}>
            {products.length} product{products.length === 1 ? '' : 's'}
          </p>
        )}
      </section>
    </div>
  )
}

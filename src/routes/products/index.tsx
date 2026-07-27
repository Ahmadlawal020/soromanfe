import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '#/components/ui/card'
import { Input } from '#/components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '#/components/ui/select'
import { Fuel, Search, Plus, Eye, Edit, Layers, Flame, SearchX, X, Loader2 } from 'lucide-react'
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
  'DPK (Dual Purpose Kerosene)': 'from-warning to-amber-400',
  'Jet A-1 (Aviation Fuel)': 'from-sky-500 to-sky-400',
  'LPG (Liquefied Petroleum Gas)': 'from-info to-cyan-400',
  'LPFO / Heavy Fuel Oil': 'from-destructive to-rose-400',
  'Lubricants & Base Oils': 'from-violet-500 to-violet-400',
}

function ProductsDashboard() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  const { data, isLoading } = useProductList({
    search: searchTerm || undefined,
    category: selectedCategory !== 'all' ? selectedCategory : undefined,
  })

  const products: ProductItem[] = data?.products || []

  const statsCards = [
    { title: 'Total Products', value: data?.pagination?.total ?? products.length, sub: 'Petroleum products registered', icon: Fuel },
    { title: 'Categories', value: new Set(products.map((p) => p.category)).size, sub: 'Product classifications', icon: Layers },
    { title: 'Grade Types', value: new Set(products.map((p) => p.gradeClass)).size, sub: 'Quality classifications', icon: Flame },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div><h1 className="text-3xl font-bold text-foreground">Petroleum Products</h1><p className="text-muted-foreground">Manage petroleum product listings, grades, and distribution categories.</p></div>
        <Button size="sm" className="gradient-primary text-white border-0" onClick={() => navigate({ to: '/products/form', search: { id: '' } })}><Plus className="w-4 h-4 mr-2" />Register New Product</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {statsCards.map((card, idx) => (
          <Card key={idx} className="stats-card"><CardContent className="p-4 flex justify-between items-center"><div><p className="text-sm text-muted-foreground">{card.title}</p><p className="text-2xl font-bold">{card.value}</p><p className="text-xs text-muted-foreground">{card.sub}</p></div><card.icon className="w-8 h-8 text-primary" /></CardContent></Card>
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
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input type="text" placeholder="Search product name or SKU..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
              {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground flex items-center justify-center cursor-pointer transition-colors"><X size={10} /></button>}
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-[200px]"><SelectValue placeholder="All Categories" /></SelectTrigger>
              <SelectContent><SelectItem value="all">All Categories</SelectItem>{categoryList.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16"><Loader2 size={24} className="animate-spin text-muted-foreground" /></div>
          ) : products.length === 0 ? (
            <div className="col-span-full p-16 text-center">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-muted border border-border mb-4"><SearchX size={24} className="text-muted-foreground" /></div>
              <p className="text-sm font-medium text-foreground">No products found</p>
              <p className="text-xs text-muted-foreground mt-1">Try adjusting your search or filter criteria.</p>
              <Button variant="ghost" size="sm" onClick={() => { setSearchTerm(''); setSelectedCategory('all') }} className="mt-4 text-primary"><X size={14} /> Clear filters</Button>
            </div>
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
                    <div className="flex items-center gap-2 mb-4"><div className={`h-6 w-6 rounded-md bg-gradient-to-br ${categoryColors[product.category] || 'from-gray-400 to-gray-300'} flex items-center justify-center`}><Layers className="h-3 w-3 text-white" /></div><span className="text-xs text-muted-foreground">{product.category}</span></div>
                    <div className="flex items-center justify-between pt-3 border-t border-border"><div className="flex items-center gap-1.5"><Flame className="h-3.5 w-3.5 text-muted-foreground" /><span className="text-xs text-muted-foreground">Grade</span></div><Badge className="bg-success text-success-foreground text-xs">{product.gradeClass}</Badge></div>
                    <div className="flex gap-2 pt-4 mt-4 border-t border-border">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={(e) => { e.stopPropagation(); navigate({ to: '/products/details', search: { id: product._id } }) }}
                      >
                        <Eye className="h-3.5 w-3.5" /> View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={(e) => { e.stopPropagation(); navigate({ to: '/products/form', search: { id: product._id } }) }}
                      >
                        <Edit className="h-3.5 w-3.5" /> Edit
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

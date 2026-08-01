import { useState, useEffect } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '#/components/ui/select'
import { ArrowLeft, Scale, Save, Loader2, Package, AlertTriangle, FileText } from 'lucide-react'
import { useProductDetails, useCreateProduct, useUpdateProduct } from '#/lib/hooks/useProducts'

export const Route = createFileRoute('/dangote-products/form')({
  validateSearch: (search: Record<string, unknown>) => ({
    id: (search.id as string) || '',
  }),
  component: DangoteProductForm,
})

const categoriesList = [
  'PMS (Premium Motor Spirit)',
  'AGO (Automotive Gas Oil)',
  'DPK (Dual Purpose Kerosene)',
  'Jet A-1 (Aviation Fuel)',
  'LPG (Liquefied Petroleum Gas)',
  'LPFO / Heavy Fuel Oil',
  'Lubricants & Base Oils',
]
const hazardClassesList = ['Class 2.1 Flammable Gas', 'Class 3 Flammable Liquid', 'Class 9 Environmentally Hazardous', 'Non-Hazardous']
const unitsList = ['Liters', 'Metric Tonnes', 'Kilograms', 'Barrels', 'US Gallons']

const categoryLegacyMap: Record<string, string> = {
  'Motor Fuel': 'PMS (Premium Motor Spirit)',
  'Diesel Fuel': 'AGO (Automotive Gas Oil)',
  'Kerosene': 'DPK (Dual Purpose Kerosene)',
  'Cooking Gas': 'LPG (Liquefied Petroleum Gas)',
  'Industrial Fuel': 'LPFO / Heavy Fuel Oil',
  'Lubricants': 'Lubricants & Base Oils',
}

function DangoteProductForm() {
  const navigate = useNavigate()
  const { id } = Route.useSearch()
  const isEdit = !!id
  const { data: editingProduct, isLoading: isLoadingProduct } = useProductDetails(id)
  const createProduct = useCreateProduct()
  const updateProduct = useUpdateProduct()

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: 'PMS (Premium Motor Spirit)',
    productType: 'dangote',
    gradeClass: '',
    description: '',
    density: '',
    flashPoint: '',
    unNumber: '',
    hazardClass: 'Class 3 Flammable Liquid',
    unit: 'Liters',
    supplier: '',
  })

  useEffect(() => {
    if (isEdit && editingProduct) {
      const rawCategory = editingProduct.category || ''
      const mappedCategory = categoryLegacyMap[rawCategory] || rawCategory || 'PMS (Premium Motor Spirit)'

      const rawHazard = editingProduct.hazardClass || ''
      const mappedHazard = rawHazard === 'None' ? 'Non-Hazardous' : (rawHazard || 'Class 3 Flammable Liquid')

      setFormData({
        name: editingProduct.name || '',
        sku: editingProduct.sku || '',
        category: mappedCategory,
        productType: 'dangote',
        gradeClass: editingProduct.gradeClass || '',
        description: editingProduct.description || '',
        density: editingProduct.density || '',
        flashPoint: editingProduct.flashPoint || '',
        unNumber: editingProduct.unNumber || '',
        hazardClass: mappedHazard,
        unit: editingProduct.unit || 'Liters',
        supplier: editingProduct.supplier || '',
      })
    }
  }, [isEdit, editingProduct])

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [apiError, setApiError] = useState('')

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.name.trim()) newErrors.name = 'Product name is required'
    if (!formData.sku.trim()) newErrors.sku = 'SKU code is required'
    return newErrors
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => { const next = { ...prev }; delete next[name]; return next })
    if (apiError) setApiError('')
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => { const next = { ...prev }; delete next[name]; return next })
    if (apiError) setApiError('')
  }

  const isSubmitting = createProduct.isPending || updateProduct.isPending

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors = validate()
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    setApiError('')

    try {
      if (isEdit && editingProduct?._id) {
        await updateProduct.mutateAsync({ id: editingProduct._id, data: formData })
      } else {
        await createProduct.mutateAsync(formData)
      }
      navigate({ to: '/dangote-products' })
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Something went wrong'
      setApiError(message)
    }
  }

  if (isEdit && isLoadingProduct) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate({ to: '/dangote-products' })}
            className="mb-2"
          >
            <ArrowLeft className="size-4 mr-2" />
            Back to Dangote Products
          </Button>
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-balance">
            {isEdit ? 'Edit Dangote Product' : 'Register New Dangote Product'}
          </h1>
          <p className="text-muted-foreground">
            {isEdit ? 'Modify details of this Dangote product listing' : 'Fill in the details to add a new Dangote product'}
          </p>
        </div>
      </header>

      {apiError && (
        <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-lg px-4 py-3 text-sm flex items-center gap-2">
          <AlertTriangle className="size-4 shrink-0" />
          {apiError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Basic Product Details */}
          <div className="space-y-4 border rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Package className="size-5 text-primary" />
              <h2 className="text-lg font-medium">Basic Product Details</h2>
            </div>

            <div className="space-y-3">
              <div>
                <Label htmlFor="name">Product Name*</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Premium Motor Spirit"
                  className={errors.name ? 'border-destructive' : ''}
                />
                {errors.name && (
                  <p className="text-sm text-destructive mt-1">{errors.name}</p>
                )}
              </div>

              <div>
                <Label htmlFor="sku">SKU Code*</Label>
                <Input
                  id="sku"
                  name="sku"
                  value={formData.sku}
                  onChange={handleChange}
                  placeholder="e.g. DNG-PMS-001"
                  className={errors.sku ? 'border-destructive' : ''}
                />
                {errors.sku && (
                  <p className="text-sm text-destructive mt-1">{errors.sku}</p>
                )}
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  key={`category-${formData.category}`}
                  value={formData.category}
                  onValueChange={(v) => handleSelectChange('category', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from(new Set([...categoriesList, formData.category].filter(Boolean))).map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="unit">Measurement Unit</Label>
                <Select
                  key={`unit-${formData.unit}`}
                  value={formData.unit}
                  onValueChange={(v) => handleSelectChange('unit', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select measurement unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from(new Set([...unitsList, formData.unit].filter(Boolean))).map((u) => (
                      <SelectItem key={u} value={u}>{u}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="gradeClass">Quality Grade</Label>
                <Input
                  id="gradeClass"
                  name="gradeClass"
                  value={formData.gradeClass}
                  onChange={handleChange}
                  placeholder="e.g. Grade A"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Describe the product..."
                  className="w-full rounded-lg border border-border bg-transparent px-3 py-2.5 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/30 transition-all resize-none duration-250 ease-luxe"
                />
              </div>
            </div>
          </div>

          {/* Technical & Safety Specifications */}
          <div className="space-y-4 border rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Scale className="size-5 text-primary" />
              <h2 className="text-lg font-medium">Technical Specifications</h2>
            </div>

            <div className="space-y-3">
              <div>
                <Label htmlFor="density">Density Range</Label>
                <Input
                  id="density"
                  name="density"
                  value={formData.density}
                  onChange={handleChange}
                  placeholder="e.g. 0.720 kg/L"
                />
              </div>

              <div>
                <Label htmlFor="flashPoint">Flash Point</Label>
                <Input
                  id="flashPoint"
                  name="flashPoint"
                  value={formData.flashPoint}
                  onChange={handleChange}
                  placeholder="e.g. < -40°C"
                />
              </div>

              <div>
                <Label htmlFor="unNumber">UN Number</Label>
                <Input
                  id="unNumber"
                  name="unNumber"
                  value={formData.unNumber}
                  onChange={handleChange}
                  placeholder="e.g. UN 1203"
                />
              </div>

              <div>
                <Label htmlFor="supplier">Primary Supplier</Label>
                <Input
                  id="supplier"
                  name="supplier"
                  value={formData.supplier}
                  onChange={handleChange}
                  placeholder="e.g. Dangote Refinery"
                />
              </div>
            </div>
          </div>

          {/* Safety & Commercial */}
          <div className="space-y-4 border rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="size-5 text-primary" />
              <h2 className="text-lg font-medium">Safety & Commercial</h2>
            </div>

            <div className="space-y-3">
              <div>
                <Label htmlFor="hazardClass">Hazard Class</Label>
                <Select
                  key={`hazardClass-${formData.hazardClass}`}
                  value={formData.hazardClass}
                  onValueChange={(v) => handleSelectChange('hazardClass', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select hazard class" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from(new Set([...hazardClassesList, formData.hazardClass].filter(Boolean))).map((h) => (
                      <SelectItem key={h} value={h}>{h}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-2">
                <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground">
                  <FileText className="size-4 inline-block mr-2" />
                  Ensure all safety data sheets (SDS) are up to date for this product.
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate({ to: '/dangote-products' })}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Save className="size-4 mr-2" />}
            {isSubmitting ? 'Saving...' : isEdit ? 'Update Product' : 'Save Product'}
          </Button>
        </div>
      </form>
    </div>
  )
}

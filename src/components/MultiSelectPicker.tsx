import { Loader2, Search, Check, X } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Badge } from '#/components/ui/badge'

export type MultiSelectOption = { id: number; primary: string; secondary?: string }

/**
 * A search + select-all/clear + chips + checkbox-grid multi-select. Started
 * as the admin form's depot/LPG-station/PFI scope picker; generalized here
 * once the messaging page needed the same pattern for a customer picker.
 */
export function MultiSelectPicker({
  icon: Icon,
  title,
  description,
  items,
  selectedIds,
  searchTerm,
  onSearchChange,
  onToggle,
  onSelectAll,
  onClear,
  isLoading,
  emptyMessage,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  items: MultiSelectOption[]
  selectedIds: number[]
  searchTerm: string
  onSearchChange: (v: string) => void
  onToggle: (id: number) => void
  onSelectAll: () => void
  onClear: () => void
  isLoading?: boolean
  emptyMessage: string
}) {
  const filtered = items.filter((i) =>
    i.primary.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (i.secondary || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-3 border rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="size-4 text-primary" />
          <div>
            <p className="text-sm font-normal text-foreground">{title}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
        <Badge variant="secondary" className="text-xs px-2 py-1 font-semibold">{selectedIds.length} selected</Badge>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input value={searchTerm} onChange={(e) => onSearchChange(e.target.value)} placeholder="Search..." className="pl-9 h-9 text-xs" />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button type="button" variant="outline" size="sm" onClick={onSelectAll} className="h-9 text-xs">Select All</Button>
          <Button type="button" variant="ghost" size="sm" onClick={onClear} className="h-9 text-xs text-muted-foreground">Clear</Button>
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedIds.map((id) => {
            const item = items.find((i) => i.id === id)
            return (
              <Badge key={id} variant="secondary" className="text-xs font-normal py-1 px-2.5 flex items-center gap-1.5">
                {item ? item.primary : `#${id}`}
                <button type="button" onClick={() => onToggle(id)} className="hover:text-destructive"><X className="size-3" /></button>
              </Badge>
            )
          })}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-6"><Loader2 className="size-4 animate-spin text-primary mr-2" /><span className="text-xs text-muted-foreground">Loading...</span></div>
      ) : filtered.length === 0 ? (
        <div className="p-4 text-center text-xs text-muted-foreground border border-dashed rounded-lg">{emptyMessage}</div>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 max-h-56 overflow-y-auto pr-1">
          {filtered.map((item) => {
            const checked = selectedIds.includes(item.id)
            return (
              <div key={item.id} onClick={() => onToggle(item.id)} className={`p-2.5 rounded-lg border cursor-pointer flex items-center justify-between select-none ${checked ? 'border-primary/50 bg-primary/10' : 'border-border/40 hover:bg-muted/30'}`}>
                <div className="min-w-0 flex-1 pr-2">
                  <p className={`text-xs font-normal truncate ${checked ? 'text-primary' : 'text-foreground'}`}>{item.primary}</p>
                  {item.secondary && <p className="text-xs text-muted-foreground truncate">{item.secondary}</p>}
                </div>
                <div className={`size-4 rounded border flex items-center justify-center shrink-0 ${checked ? 'bg-primary border-primary text-primary-foreground' : 'border-border'}`}>
                  {checked && <Check className="size-3 stroke-[3]" />}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

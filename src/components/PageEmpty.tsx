import { SearchX, Plus, X } from 'lucide-react'
import { Button } from '#/components/ui/button'

interface PageEmptyProps {
  icon?: React.ReactNode
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  hasFilters?: boolean
  onClearFilters?: () => void
}

export function PageEmpty({ icon, title, description, actionLabel, onAction, hasFilters, onClearFilters }: PageEmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-muted border border-border">
        {icon || <SearchX size={24} className="text-muted-foreground" />}
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-foreground">{title}</p>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      </div>
      <div className="flex items-center gap-2">
        {hasFilters && onClearFilters && (
          <Button variant="ghost" size="sm" onClick={onClearFilters} className="text-primary">
            <X size={14} /> Clear filters
          </Button>
        )}
        {!hasFilters && actionLabel && onAction && (
          <Button size="sm" className="gradient-primary text-white border-0" onClick={onAction}>
            <Plus size={14} className="mr-1" />{actionLabel}
          </Button>
        )}
      </div>
    </div>
  )
}

import { SearchX, Plus, X } from 'lucide-react'
import { Button } from '#/components/ui/button'
import {
  Empty,
  EmptyMedia,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from '#/components/ui/empty'

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
    <Empty className="my-6 py-16">
      <EmptyMedia>{icon || <SearchX />}</EmptyMedia>
      <EmptyHeader>
        <EmptyTitle>{title}</EmptyTitle>
        {description && <EmptyDescription>{description}</EmptyDescription>}
      </EmptyHeader>
      {((hasFilters && onClearFilters) || (!hasFilters && actionLabel && onAction)) && (
        <EmptyContent>
          {hasFilters && onClearFilters && (
            <Button variant="ghost" size="sm" onClick={onClearFilters}>
              <X data-icon="inline-start" /> Clear filters
            </Button>
          )}
          {!hasFilters && actionLabel && onAction && (
            <Button size="sm" onClick={onAction}>
              <Plus data-icon="inline-start" />
              {actionLabel}
            </Button>
          )}
        </EmptyContent>
      )}
    </Empty>
  )
}

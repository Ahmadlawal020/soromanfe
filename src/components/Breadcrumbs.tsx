import { ChevronRight } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'

export interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  const navigate = useNavigate()

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-muted-foreground">
      {items.map((item, idx) => (
        <span key={idx} className="flex items-center gap-1">
          {idx > 0 && <ChevronRight className="size-3.5 shrink-0" aria-hidden="true" />}
          {item.href ? (
            <button
              onClick={() => navigate({ to: item.href as any })}
              className="hover:text-foreground transition-colors cursor-pointer duration-250 ease-luxe"
            >
              {item.label}
            </button>
          ) : (
            <span className="text-foreground font-normal">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}

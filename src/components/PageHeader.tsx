import React from 'react'
import { Button } from '#/components/ui/button'
import { ArrowLeft } from 'lucide-react'

interface PageHeaderProps {
  title: string
  description?: string
  actions?: React.ReactNode
  backAction?: () => void
}

export function PageHeader({ title, description, actions, backAction }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div className="flex items-center gap-3">
        {backAction && (
          <Button variant="outline" size="icon" className="cursor-pointer" onClick={backAction} aria-label="Go back">
            <ArrowLeft size={16} />
          </Button>
        )}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">{title}</h1>
          {description && (
            <p className="text-muted-foreground text-sm mt-0.5">{description}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  )
}

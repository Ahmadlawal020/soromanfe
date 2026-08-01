import React from 'react'
import { Button } from '#/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { MICRO } from '#/lib/panel'

interface PageHeaderProps {
  title: string
  description?: string
  /** Wide-tracked uppercase label above the title — the house eyebrow. */
  eyebrow?: string
  actions?: React.ReactNode
  backAction?: () => void
}

export function PageHeader({ title, description, eyebrow, actions, backAction }: PageHeaderProps) {
  return (
    <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
      <div className="flex items-center gap-3">
        {backAction && (
          <Button variant="outline" size="icon" className="cursor-pointer" onClick={backAction}>
            <ArrowLeft />
            <span className="sr-only">Go back</span>
          </Button>
        )}
        <div>
          {eyebrow && (
            <p className={`${MICRO} mb-1.5 text-muted-foreground`}>{eyebrow}</p>
          )}
          {/* Headings lean on tight tracking rather than extra weight. */}
          <h1 className="text-xl font-semibold tracking-tight text-balance md:text-2xl">
            {title}
          </h1>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  )
}

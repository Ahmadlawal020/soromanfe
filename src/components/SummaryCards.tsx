import React from 'react'
import { cn } from '#/lib/utils'

export interface SummaryCard {
  title: string
  value: string
  description?: string
  icon: React.ReactNode
  tone?: 'neutral' | 'green' | 'red' | 'amber' | 'blue'
}

const toneStyles: Record<string, { icon: string; border: string }> = {
  neutral: { icon: 'bg-muted text-muted-foreground', border: 'border-border' },
  green: { icon: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400', border: 'border-emerald-200/50 dark:border-emerald-800/50' },
  red: { icon: 'bg-red-500/10 text-red-600 dark:text-red-400', border: 'border-red-200/50 dark:border-red-800/50' },
  amber: { icon: 'bg-amber-500/10 text-amber-600 dark:text-amber-400', border: 'border-amber-200/50 dark:border-amber-800/50' },
  blue: { icon: 'bg-blue-500/10 text-blue-600 dark:text-blue-400', border: 'border-blue-200/50 dark:border-blue-800/50' },
}

export function SummaryCards({ cards }: { cards: SummaryCard[] }) {
  const gridCols =
    cards.length <= 3
      ? 'grid-cols-1 sm:grid-cols-3'
      : cards.length === 4
        ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
        : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6'

  return (
    <div className={cn('grid gap-4', gridCols)}>
      {cards.map((card) => {
        const tone = toneStyles[card.tone || 'neutral']
        return (
          <div
            key={card.title}
            className={cn(
              'bg-card rounded-xl shadow-sm border p-4 flex items-start justify-between gap-3',
              tone.border
            )}
          >
            <div className="min-w-0">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                {card.title}
              </p>
              <p className="text-lg font-bold mt-1 text-foreground truncate">{card.value}</p>
              {card.description && (
                <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{card.description}</p>
              )}
            </div>
            <div className={cn('h-10 w-10 shrink-0 rounded-xl flex items-center justify-center', tone.icon)}>
              {card.icon}
            </div>
          </div>
        )
      })}
    </div>
  )
}

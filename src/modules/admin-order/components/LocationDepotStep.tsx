import { Loader2, Warehouse } from 'lucide-react'
import { ChoiceCard, ChoiceGrid } from '#/components/ui/choice-card'
import type { OrderWizardReturn } from '../hooks/useOrderWizard'

interface LocationDepotStepProps {
  wizard: OrderWizardReturn
}

export function LocationDepotStep({ wizard }: LocationDepotStepProps) {
  const {
    selectedDepot,
    setSelectedDepot,
    setSelectedProduct,
    activeDepots,
    isLoadingDepots,
  } = wizard

  return (
    <div className="space-y-5">
      {isLoadingDepots ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : activeDepots.length === 0 ? (
        <div className="rounded-xl border border-dashed border-foreground/20 p-8 text-center">
          <p className="text-sm">No active Soroman depots found</p>
        </div>
      ) : (
        <ChoiceGrid>
          {activeDepots.map((d: any) => (
            <ChoiceCard
              key={d.id}
              selected={selectedDepot?.id === d.id}
              onSelect={() => { setSelectedDepot(d); setSelectedProduct(null) }}
              icon={<Warehouse />}
              title={d.name}
              subtitle={[d.code, [d.address, d.city].filter(Boolean).join(', ')]
                .filter(Boolean)
                .join(' · ')}
            />
          ))}
        </ChoiceGrid>
      )}
    </div>
  )
}

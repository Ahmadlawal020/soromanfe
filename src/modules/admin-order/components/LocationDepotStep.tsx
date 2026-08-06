import { Label } from '#/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '#/components/ui/select'
import { Loader2, Warehouse } from 'lucide-react'
import { ChoiceCard, ChoiceGrid } from '#/components/ui/choice-card'
import { nigeriaStates } from '#/lib/nigeria-data'
import type { OrderWizardReturn } from '../hooks/useOrderWizard'

interface LocationDepotStepProps {
  wizard: OrderWizardReturn
}

export function LocationDepotStep({ wizard }: LocationDepotStepProps) {
  const {
    selectedState,
    setSelectedState,
    selectedDepot,
    setSelectedDepot,
    setSelectedProduct,
    stateDepots,
    isLoadingDepots,
  } = wizard

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="dest-state">Destination state</Label>
        <Select
          value={selectedState}
          onValueChange={(v) => {
            setSelectedState(v)
            setSelectedDepot(null)
            setSelectedProduct(null)
          }}
        >
          <SelectTrigger id="dest-state" className="w-full">
            <SelectValue placeholder="Choose a state" />
          </SelectTrigger>
          <SelectContent>
            {nigeriaStates.map((state) => (
              <SelectItem key={state} value={state}>{state}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Depots only appear once a state narrows them — before that the list
          would be every depot in the country. */}
      {selectedState && (
        isLoadingDepots ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : stateDepots.length === 0 ? (
          <div className="rounded-xl border border-dashed border-foreground/20 p-8 text-center">
            <p className="text-sm">No active depots in {selectedState}</p>
            <p className="mt-1 text-xs text-muted-foreground">Try a different state.</p>
          </div>
        ) : (
          <ChoiceGrid>
            {stateDepots.map((d: any) => (
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
        )
      )}
    </div>
  )
}

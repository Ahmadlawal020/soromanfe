import { Label } from '#/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '#/components/ui/select'
import {
  Loader2,
  MapPin,
  Warehouse,
} from 'lucide-react'
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
    <div key="step-2" className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          <MapPin size={18} />
        </div>
        <div>
          <h2 className="text-lg font-bold">Location & Depot</h2>
          <p className="text-sm text-muted-foreground">Select the destination state and nearest depot for sourcing.</p>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Destination State *</Label>
        <Select
          value={selectedState}
          onValueChange={(v) => { setSelectedState(v); setSelectedDepot(null); setSelectedProduct(null); }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Choose a state" />
          </SelectTrigger>
          <SelectContent>
            {nigeriaStates.map((state) => (
              <SelectItem key={state} value={state}>{state}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedState && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Warehouse className="w-4 h-4 text-muted-foreground" />
            <Label className="text-sm font-semibold">Available Depots in {selectedState}</Label>
          </div>

          {isLoadingDepots ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={24} className="animate-spin text-muted-foreground" />
            </div>
          ) : stateDepots.length === 0 ? (
            <div className="p-10 border border-dashed rounded-xl text-center space-y-2">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-muted border border-border mb-1">
                <Warehouse size={20} className="text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">No active depots in {selectedState}</p>
              <p className="text-xs text-muted-foreground">Please select a different state.</p>
            </div>
          ) : (
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
              {stateDepots.map((d: any) => (
                <div
                  key={d.id}
                  onClick={() => { setSelectedDepot(d); setSelectedProduct(null); }}
                  className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 flex items-start gap-3 ${selectedDepot?.id === d.id
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'hover:bg-muted/50 hover:border-muted-foreground/20 border-border'
                    }`}
                >
                  <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${selectedDepot?.id === d.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    }`}>
                    <Warehouse size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-foreground">{d.name}</p>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">Code: {d.code}</p>
                    <p className="text-xs text-muted-foreground mt-1 truncate">{d.address}, {d.city}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

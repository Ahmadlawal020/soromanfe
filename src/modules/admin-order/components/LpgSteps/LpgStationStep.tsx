import { Label } from '#/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '#/components/ui/select'
import {
  Loader2,
  Flame,
  MapPin,
} from 'lucide-react'
import { nigeriaStates } from '#/lib/nigeria-data'
import type { LpgOrderWizardReturn } from '../../hooks/useLpgOrderWizard'

interface LpgStationStepProps {
  wizard: LpgOrderWizardReturn
}

export function LpgStationStep({ wizard }: LpgStationStepProps) {
  const {
    selectedState,
    setSelectedState,
    selectedLga,
    setSelectedLga,
    selectedStation,
    setSelectedStation,
    availableLgas,
    lgaStations,
    isLoadingStations,
  } = wizard

  return (
    <div key="lpg-step-2" className="space-y-6 animate-fade-in">

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>State *</Label>
          <Select
            value={selectedState}
            onValueChange={(v) => { setSelectedState(v); setSelectedLga(''); setSelectedStation(null); }}
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

        {selectedState && availableLgas.length > 0 && (
          <div className="space-y-2">
            <Label>LGA *</Label>
            <Select
              value={selectedLga}
              onValueChange={(v) => { setSelectedLga(v); setSelectedStation(null); }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose an LGA" />
              </SelectTrigger>
              <SelectContent>
                {availableLgas.map((lga: string) => (
                  <SelectItem key={lga} value={lga}>{lga}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {selectedState && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Flame className="size-4 text-muted-foreground" />
            <Label className="text-sm font-semibold">
              Available LPG Stations in {selectedLga ? `${selectedLga}, ` : ''}{selectedState}
            </Label>
          </div>

          {isLoadingStations ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : lgaStations.length === 0 ? (
            <div className="p-10 border border-dashed rounded-xl text-center space-y-2">
              <div className="inline-flex size-12 items-center justify-center rounded-xl bg-muted border border-border mb-1">
                <Flame className="size-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-normal text-foreground">
                No active LPG stations in {selectedLga ? `${selectedLga}, ` : ''}{selectedState}
              </p>
              <p className="text-xs text-muted-foreground">Please select a different {selectedLga ? 'LGA or ' : ''}state.</p>
            </div>
          ) : (
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
              {lgaStations.map((s: any) => (
                <div
                  key={s.id}
                  onClick={() => setSelectedStation(s)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 flex items-start gap-3 ${
                    selectedStation?.id === s.id
                      ? 'border-primary bg-primary/5'
                      : 'hover:bg-muted/50 hover:border-muted-foreground/20 border-border'
                  }`}
                >
                  <div className={`size-9 rounded-lg flex items-center justify-center shrink-0 ${
                    selectedStation?.id === s.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}>
                    <Flame className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-foreground">{s.name}</p>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">Code: {s.code}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <MapPin className="size-3" />
                      <span className="truncate">{s.address}, {s.city}</span>
                    </div>
                    {s.cylinders && s.cylinders.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Cylinders: {s.cylinders.map((c: any) => `${c.cylinderSizeKg}Kg`).join(', ')}
                      </p>
                    )}
                    {Number(s.pricePerKg) > 0 && (
                      <p className="text-xs font-normal text-primary mt-1">
                        ₦{Number(s.pricePerKg).toLocaleString()} / Kg
                      </p>
                    )}
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

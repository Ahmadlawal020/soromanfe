import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import {
  Flame,
  Package,
  DollarSign,
} from 'lucide-react'
import type { LpgOrderWizardReturn } from '../../hooks/useLpgOrderWizard'

interface LpgCylinderStepProps {
  wizard: LpgOrderWizardReturn
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(value)
}

export function LpgCylinderStep({ wizard }: LpgCylinderStepProps) {
  const {
    selectedStation,
    selectedCylinderSizeKg,
    setSelectedCylinderSizeKg,
    cylinderQuantity,
    setCylinderQuantity,
    availableCylinders,
  } = wizard

  const pricePerKg = Number(selectedStation?.pricePerKg) || 0
  const totalWeightKg = (selectedCylinderSizeKg || 0) * (Number(cylinderQuantity) || 0)
  const subtotal = pricePerKg * totalWeightKg

  return (
    <div key="lpg-step-3" className="space-y-6 animate-fade-in">

      {selectedStation && (
        <div className="p-4 border rounded-xl bg-muted/30">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="text-primary size-4" />
            <span className="font-semibold text-sm">Selected Station</span>
          </div>
          <p className="text-sm font-medium text-foreground">{selectedStation.name}</p>
          <p className="text-xs text-muted-foreground">{selectedStation.address}, {selectedStation.city}, {selectedStation.state}</p>
          {pricePerKg > 0 && (
            <div className="flex items-center gap-1.5 mt-2">
              <DollarSign className="size-3.5 text-primary" />
              <span className="text-sm font-semibold text-primary">{formatCurrency(pricePerKg)} / Kg</span>
            </div>
          )}
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Package className="size-4 text-muted-foreground" />
          <Label className="text-sm font-semibold">Select Cylinder Size *</Label>
        </div>

        {availableCylinders.length === 0 ? (
          <div className="p-10 border border-dashed rounded-xl text-center space-y-2">
            <div className="inline-flex size-12 items-center justify-center rounded-xl bg-muted border border-border mb-1">
              <Package className="size-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">No cylinders available</p>
            <p className="text-xs text-muted-foreground">This station has no cylinder inventory configured.</p>
          </div>
        ) : (
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
            {availableCylinders.map((c: any) => (
              <div
                key={c.cylinderSizeKg}
                onClick={() => setSelectedCylinderSizeKg(c.cylinderSizeKg)}
                className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 flex items-start gap-3 ${
                  selectedCylinderSizeKg === c.cylinderSizeKg
                    ? 'border-primary bg-primary/5'
                    : 'hover:bg-muted/50 hover:border-muted-foreground/20 border-border'
                }`}
              >
                <div className={`size-9 rounded-lg flex items-center justify-center shrink-0 ${
                  selectedCylinderSizeKg === c.cylinderSizeKg ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}>
                  <Flame className="size-4" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-foreground">{c.cylinderSizeKg} Kg Cylinder</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {c.quantity?.toLocaleString()} units available
                  </p>
                  {pricePerKg > 0 && (
                    <p className="text-xs font-medium text-primary mt-0.5">
                      {formatCurrency(pricePerKg * c.cylinderSizeKg)} per cylinder
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedCylinderSizeKg && (
        <div className="space-y-2">
          <Label>Number of Cylinders *</Label>
          <Input
            type="number"
            min="1"
            placeholder="e.g. 2"
            value={cylinderQuantity}
            onChange={(e) => setCylinderQuantity(e.target.value)}
          />
          <div className="text-xs text-muted-foreground space-y-1">
            <p>Total weight: {totalWeightKg.toLocaleString()} Kg</p>
            {pricePerKg > 0 && Number(cylinderQuantity) > 0 && (
              <p className="font-medium text-foreground">
                Estimated subtotal: {formatCurrency(subtotal)} (delivery price set during review)
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

import { Label } from '#/components/ui/label'
import {
  MapPin,
  Building2,
  Navigation,
} from 'lucide-react'
import { nigeriaStates, nigeriaLgas } from '#/lib/nigeria-data'
import type { DangoteOrderWizardReturn } from '../../hooks/useDangoteOrderWizard'

interface DangoteDeliveryStepProps {
  wizard: DangoteOrderWizardReturn
}

function getLgasForState(stateName: string): string[] {
  if (!stateName) return []
  const trimmed = stateName.trim()
  if (trimmed.toLowerCase().includes('fct') || trimmed.toLowerCase().includes('federal capital') || trimmed.toLowerCase().includes('abuja')) {
    return nigeriaLgas['Federal Capital Territory (FCT)'] || []
  }
  const cleaned = trimmed.replace(/\s+state$/i, '').trim()
  const matchedState = nigeriaStates.find(
    (s) => s.toLowerCase() === trimmed.toLowerCase() || s.toLowerCase() === cleaned.toLowerCase()
  )
  return nigeriaLgas[matchedState || stateName] || []
}

export function DangoteDeliveryStep({ wizard }: DangoteDeliveryStepProps) {
  const {
    deliveryAddress,
    setDeliveryAddress,
    deliveryState,
    setDeliveryState,
    deliveryLga,
    setDeliveryLga,
  } = wizard

  const availableLgas = getLgasForState(deliveryState)

  const handleStateChange = (value: string) => {
    setDeliveryState(value)
    setDeliveryLga('')
  }

  return (
    <div key="dangote-step-4" className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          <MapPin size={18} />
        </div>
        <div>
          <h2 className="text-lg font-bold">Delivery Location</h2>
          <p className="text-sm text-muted-foreground">Enter the delivery address where the product will be delivered.</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Delivery Address */}
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5">
            <Navigation className="w-3.5 h-3.5 text-muted-foreground" />
            Delivery Address *
          </Label>
          <textarea
            placeholder="e.g. 32 Broad Street, Marina, Lagos"
            value={deliveryAddress}
            onChange={(e) => setDeliveryAddress(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/30 transition-all resize-none"
          />
        </div>

        {/* State & LGA */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
              State
            </Label>
            <select
              value={deliveryState}
              onChange={(e) => handleStateChange(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus-visible:ring-2 focus-visible:ring-ring/30 outline-none transition-all"
            >
              <option value="">Select State</option>
              {nigeriaStates.map((state) => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
              LGA
            </Label>
            <select
              value={deliveryLga}
              onChange={(e) => setDeliveryLga(e.target.value)}
              disabled={!deliveryState || availableLgas.length === 0}
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus-visible:ring-2 focus-visible:ring-ring/30 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">{deliveryState ? 'Select LGA' : 'Select a state first'}</option>
              {availableLgas.map((lga) => (
                <option key={lga} value={lga}>{lga}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Delivery Summary */}
        {deliveryAddress && (
          <div className="p-4 border rounded-xl bg-muted/30">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="text-primary w-4 h-4" />
              <span className="font-bold text-sm">Delivery Summary</span>
            </div>
            <p className="text-sm text-foreground">{deliveryAddress}</p>
            {(deliveryState || deliveryLga) && (
              <p className="text-xs text-muted-foreground mt-1">
                {deliveryState}{deliveryLga ? `, ${deliveryLga}` : ''}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

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

      <div className="space-y-4">
        {/* Delivery Address */}
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5">
            <Navigation className="size-3.5 text-muted-foreground" />
            Delivery Address *
          </Label>
          <textarea
            placeholder="e.g. 32 Broad Street, Marina, Lagos"
            value={deliveryAddress}
            onChange={(e) => setDeliveryAddress(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-input bg-background px-2.5 py-1.5 text-base md:text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 transition-all resize-none duration-250 ease-luxe"
          />
        </div>

        {/* State & LGA */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5">
              <Building2 className="size-3.5 text-muted-foreground" />
              State
            </Label>
            <select
              value={deliveryState}
              onChange={(e) => handleStateChange(e.target.value)}
              className="w-full h-8 px-2.5 rounded-lg border border-input bg-background text-base md:text-sm focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none transition-all duration-250 ease-luxe"
            >
              <option value="">Select State</option>
              {nigeriaStates.map((state) => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5">
              <MapPin className="size-3.5 text-muted-foreground" />
              LGA
            </Label>
            <select
              value={deliveryLga}
              onChange={(e) => setDeliveryLga(e.target.value)}
              disabled={!deliveryState || availableLgas.length === 0}
              className="w-full h-8 px-2.5 rounded-lg border border-input bg-background text-base md:text-sm focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed duration-250 ease-luxe"
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
              <MapPin className="text-primary size-4" />
              <span className="font-semibold text-sm">Delivery Summary</span>
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

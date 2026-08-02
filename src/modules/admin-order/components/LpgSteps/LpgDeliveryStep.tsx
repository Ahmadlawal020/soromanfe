import { Label } from '#/components/ui/label'

import { Textarea } from '#/components/ui/textarea'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '#/components/ui/select'
import { MapPin } from 'lucide-react'
import { nigeriaStates, nigeriaLgas } from '#/lib/nigeria-data'
import type { LpgOrderWizardReturn } from '../../hooks/useLpgOrderWizard'

interface LpgDeliveryStepProps {
  wizard: LpgOrderWizardReturn
}

export function LpgDeliveryStep({ wizard }: LpgDeliveryStepProps) {
  const {
    deliveryAddress,
    setDeliveryAddress,
    deliveryState,
    setDeliveryState,
    deliveryLga,
    setDeliveryLga,
  } = wizard

  const lgas = deliveryState ? (nigeriaLgas[deliveryState] || []) : []

  return (
    <div key="lpg-step-4" className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-2 mb-2">
        <MapPin className="text-primary size-4" />
        <span className="font-semibold text-sm">Delivery Address</span>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Delivery Address *</Label>
          <Textarea
            placeholder="Enter the full delivery address..."
            value={deliveryAddress}
            onChange={(e) => setDeliveryAddress(e.target.value)}
            rows={3}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Delivery State</Label>
            <Select
              value={deliveryState}
              onValueChange={(v) => { setDeliveryState(v); setDeliveryLga(''); }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select state (optional)" />
              </SelectTrigger>
              <SelectContent>
                {nigeriaStates.map((state) => (
                  <SelectItem key={state} value={state}>{state}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {deliveryState && lgas.length > 0 && (
            <div className="space-y-2">
              <Label>Delivery LGA</Label>
              <Select
                value={deliveryLga}
                onValueChange={setDeliveryLga}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select LGA (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {lgas.map((lga: string) => (
                    <SelectItem key={lga} value={lga}>{lga}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

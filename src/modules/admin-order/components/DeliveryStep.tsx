import {
  Truck,
  Warehouse,
} from 'lucide-react'
import type { OrderWizardReturn } from '../hooks/useOrderWizard'

interface DeliveryStepProps {
  wizard: OrderWizardReturn
}

export function DeliveryStep({ wizard }: DeliveryStepProps) {
  const { deliveryType, setDeliveryType } = wizard

  return (
    <div key="step-4" className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          <Truck size={18} />
        </div>
        <div>
          <h2 className="text-lg font-bold">Delivery Options</h2>
          <p className="text-sm text-muted-foreground">Choose whether the customer wants delivery or depot self-pickup.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          {
            value: 'pickup' as const,
            icon: Warehouse,
            title: 'Self Pickup',
            description: 'Customer arranges their own trucks to load from the depot.',
          },
          {
            value: 'delivery' as const,
            icon: Truck,
            title: 'Company Delivery',
            description: 'Soroman Logistics will manage transport and delivery to destination.',
          },
        ].map((option) => {
          const Icon = option.icon
          const isSelected = deliveryType === option.value
          return (
            <div
              key={option.value}
              onClick={() => setDeliveryType(option.value)}
              className={`p-5 border rounded-xl cursor-pointer transition-all duration-200 flex gap-3 items-start ${isSelected
                ? 'border-primary bg-primary/5 shadow-sm'
                : 'hover:bg-muted/50 hover:border-muted-foreground/20 border-border'
                }`}
            >
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}>
                <Icon size={18} />
              </div>
              <div>
                <p className="font-bold text-sm text-foreground">{option.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{option.description}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

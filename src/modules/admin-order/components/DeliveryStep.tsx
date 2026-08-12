import { Truck, Warehouse } from 'lucide-react'
import { ChoiceCard, ChoiceGrid } from '#/components/ui/choice-card'
import type { OrderWizardReturn } from '../hooks/useOrderWizard'

interface DeliveryStepProps {
  wizard: OrderWizardReturn
}

const OPTIONS = [
  {
    value: 'pickup' as const,
    icon: <Warehouse />,
    title: 'Customer loads with their truck',
    subtitle: 'The customer sends their own trucks to load at the depot.',
  },
  {
    value: 'delivery' as const,
    icon: <Truck />,
    title: 'Delivery by Soroman',
    subtitle: 'Soroman delivers it with our trucks to the customer.',
  },
]

export function DeliveryStep({ wizard }: DeliveryStepProps) {
  const { deliveryType, setDeliveryType } = wizard

  return (
    <ChoiceGrid>
      {OPTIONS.map((o) => (
        <ChoiceCard
          key={o.value}
          selected={deliveryType === o.value}
          onSelect={() => setDeliveryType(o.value)}
          icon={o.icon}
          title={o.title}
          subtitle={o.subtitle}
        />
      ))}
    </ChoiceGrid>
  )
}

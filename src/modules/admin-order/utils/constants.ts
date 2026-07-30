import {
  User,
  MapPin,
  Package,
  Truck,
  FileCheck,
} from 'lucide-react'

export const WIZARD_STEPS = [
  { title: 'Customer', shortTitle: 'Customer', icon: User },
  { title: 'Location & Depot', shortTitle: 'Location', icon: MapPin },
  { title: 'Product', shortTitle: 'Product', icon: Package },
  { title: 'Delivery', shortTitle: 'Delivery', icon: Truck },
  { title: 'Review', shortTitle: 'Review', icon: FileCheck },
]

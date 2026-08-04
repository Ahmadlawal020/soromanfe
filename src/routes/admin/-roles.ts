export const Roles = {
  SUPERADMIN: 0,
  ADMIN: 1,
  FINANCE: 2,
  TRUCK_SALES: 3,
  TICKETING: 4,
  SECURITY: 5,
  TRANSPORT: 6,
  RELEASE: 7,
  AUDIT: 8,
  SALES_MANAGER: 9,
  PRODUCT_MANAGER: 10,
  LPG_DASHBOARD: 11,
  LPG_PLANTS: 12,
  LPG_STOCK: 13,
  LPG_SALES: 14,
  COMMISSIONS: 15,
  COMMISSION_OFFICER: 16,
  DISPATCH: 17,
  IT_COMPLIANCE: 18,
} as const;
export type Roles = (typeof Roles)[keyof typeof Roles];

export const ROLES = Roles;

export const ROLE_LABELS: Record<number, string> = {
  [Roles.SUPERADMIN]: 'Superadmin',
  [Roles.ADMIN]: 'Administration',
  [Roles.FINANCE]: 'Finance',
  [Roles.TRUCK_SALES]: 'Truck Sales',
  [Roles.TICKETING]: 'Ticketing',
  [Roles.SECURITY]: 'Security',
  [Roles.TRANSPORT]: 'Transport',
  [Roles.RELEASE]: 'Release',
  [Roles.AUDIT]: 'Audit',
  [Roles.SALES_MANAGER]: 'Sales Manager',
  [Roles.PRODUCT_MANAGER]: 'Product Manager',
  [Roles.LPG_DASHBOARD]: 'LPG Dashboard',
  [Roles.LPG_PLANTS]: 'LPG Plants',
  [Roles.LPG_STOCK]: 'LPG Stock',
  [Roles.LPG_SALES]: 'LPG Sales',
  [Roles.COMMISSIONS]: 'Commissions',
  [Roles.COMMISSION_OFFICER]: 'Commission Officer',
  [Roles.DISPATCH]: 'Dispatch',
  [Roles.IT_COMPLIANCE]: 'IT Compliance',
};

export const ALL_ROLES = Object.entries(ROLE_LABELS).map(([id, label]) => ({
  id: Number(id),
  label,
}));

export const ROLE_GROUPS: { label: string; roles: number[] }[] = [
  { label: 'Admin', roles: [Roles.SUPERADMIN, Roles.ADMIN, Roles.AUDIT] },
  { label: 'Finance', roles: [Roles.FINANCE, Roles.COMMISSIONS, Roles.COMMISSION_OFFICER] },
  { label: 'Operations', roles: [Roles.TICKETING, Roles.RELEASE, Roles.DISPATCH, Roles.SECURITY, Roles.TRANSPORT, Roles.SALES_MANAGER, Roles.PRODUCT_MANAGER, Roles.TRUCK_SALES] },
  { label: 'LPG Division', roles: [Roles.LPG_DASHBOARD, Roles.LPG_PLANTS, Roles.LPG_STOCK, Roles.LPG_SALES] },
  { label: 'Others', roles: [Roles.IT_COMPLIANCE] },
];

export const roleColorMap: Record<number, string> = {
  [Roles.ADMIN]: 'text-purple-600',
  [Roles.FINANCE]: 'text-soroman-blue',
  [Roles.TRUCK_SALES]: 'text-emerald-600',
  [Roles.TICKETING]: 'text-amber-600',
  [Roles.SECURITY]: 'text-red-600',
  [Roles.TRANSPORT]: 'text-cyan-600',
  [Roles.RELEASE]: 'text-soroman-orange',
  [Roles.AUDIT]: 'text-muted-foreground',
  [Roles.SALES_MANAGER]: 'text-indigo-600',
  [Roles.PRODUCT_MANAGER]: 'text-teal-600',
  [Roles.LPG_DASHBOARD]: 'text-soroman-orange',
  [Roles.LPG_PLANTS]: 'text-soroman-orange',
  [Roles.LPG_STOCK]: 'text-soroman-orange',
  [Roles.LPG_SALES]: 'text-soroman-orange',
  [Roles.COMMISSIONS]: 'text-emerald-700',
  [Roles.COMMISSION_OFFICER]: 'text-green-700',
  [Roles.DISPATCH]: 'text-sky-600',
  [Roles.IT_COMPLIANCE]: 'text-zinc-600',
};

// Reads the current user's roles from the auth store.
// Falls back to empty array if no user is logged in.
export function getCurrentUserRoles(): number[] {
  try {
    const stored = localStorage.getItem('dashboard-auth-storage')
    if (stored) {
      const parsed = JSON.parse(stored)
      const roles = parsed?.state?.user?.roles
      if (Array.isArray(roles)) return roles.map(Number).filter((n: number) => !isNaN(n))
    }
  } catch {
    // Ignore parse errors
  }
  return []
}

export const LOCATION_CHOICES = [
  'Headquarters',
  'Lagos',
  'Calabar',
  'Port-Harcourt',
  'Warri',
] as const;

export type LocationChoice = (typeof LOCATION_CHOICES)[number];

// Dummy states list (simulates API-fetched states)
export const statesList: { id: number; name: string }[] = [
  { id: 1, name: 'Lagos' },
  { id: 2, name: 'Abuja' },
  { id: 3, name: 'Rivers' },
  { id: 4, name: 'Cross River' },
  { id: 5, name: 'Delta' },
  { id: 6, name: 'Edo' },
  { id: 7, name: 'Akwa Ibom' },
  { id: 8, name: 'Ogun' },
];

// Dummy PFIs list (simulates API-fetched PFIs)
export type PfiOption = {
  id: number;
  pfi_number: string;
  location_name?: string;
  product_name?: string;
};

export const pfisList: PfiOption[] = [
  { id: 1, pfi_number: 'PFI-2025-001', location_name: 'Lagos', product_name: 'AGO' },
  { id: 2, pfi_number: 'PFI-2025-002', location_name: 'Rivers', product_name: 'PMS' },
  { id: 3, pfi_number: 'PFI-2025-003', location_name: 'Cross River', product_name: 'DPK' },
  { id: 4, pfi_number: 'PFI-2025-004', location_name: 'Delta', product_name: 'AGO' },
  { id: 5, pfi_number: 'PFI-2025-005', location_name: 'Edo', product_name: 'LPG' },
  { id: 6, pfi_number: 'PFI-2025-006', location_name: 'Abuja', product_name: 'PMS' },
];

export interface StaffMember {
  id: string | number;
  email: string;
  full_name: string;
  phone_number: string | null;
  username: string | null;
  role: number;
  roles: number[];
  location: LocationChoice;
  locations: number[];
  location_names: string[];
  pfis: number[];
  pfi_numbers: string[];
  can_view_all_locations: boolean;
  suspended: boolean;
  email_verified: boolean;
  plain_password: string | null;
  last_login: string | null;
  last_login_ip: string | null;
  last_login_user_agent?: string | null;
  date_joined: string;
  is_staff: boolean;
  is_superuser: boolean;
}

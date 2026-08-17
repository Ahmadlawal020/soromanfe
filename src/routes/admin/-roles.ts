export const Roles = {
  SUPERADMIN: 0,
  ADMIN: 1,
  FINANCE: 2,
  TRUCK_SALES: 3,
  TICKETING: 4,
  SECURITY_ENTRY: 5,
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
  SECURITY_EXIT: 19,

  // Tiered Subroles - Finance Department
  FINANCE_VIEWER: 20,
  FINANCE_OPERATOR: 21,
  FINANCE_MANAGER: 22,

  // Tiered Subroles - Transport Department
  TRANSPORT_VIEWER: 23,
  TRANSPORT_OPERATOR: 24,
  TRANSPORT_MANAGER: 25,

  // Tiered Subroles - Security Department
  SECURITY_VIEWER: 26,
  SECURITY_OPERATOR: 27,
  SECURITY_MANAGER: 28,

  // Tiered Subroles - Ticketing Department
  TICKETING_VIEWER: 29,
  TICKETING_OPERATOR: 30,
  TICKETING_MANAGER: 31,

  // Tiered Subroles - Orders Department
  ORDERS_VIEWER: 32,
  ORDERS_OPERATOR: 33,
  ORDERS_MANAGER: 34,

  // Tiered Subroles - Sales Department
  SALES_VIEWER: 35,
  SALES_OPERATOR: 36,
  SALES_MANAGER_TIER: 37,

  // Tiered Subroles - Dangote Department
  DANGOTE_VIEWER: 38,
  DANGOTE_OPERATOR: 39,
  DANGOTE_MANAGER: 40,

  // Tiered Subroles - LPG Department
  LPG_VIEWER: 41,
  LPG_OPERATOR: 42,
  LPG_MANAGER: 43,

  // Verifies and pays expenses — the "Expenses Officer" stage of the expense
  // approval chain.
  EXPENDITURE_OFFICER: 44,
} as const;
export type Roles = (typeof Roles)[keyof typeof Roles];

export const ROLES = Roles;

export const ROLE_LABELS: Record<number, string> = {
  [Roles.SUPERADMIN]: 'Superadmin',
  [Roles.ADMIN]: 'Administration',
  [Roles.FINANCE]: 'Finance',
  [Roles.TRUCK_SALES]: 'Truck Sales',
  [Roles.TICKETING]: 'Ticketing',
  [Roles.SECURITY_ENTRY]: 'Security (Entry Gate)',
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
  [Roles.SECURITY_EXIT]: 'Security (Exit Gate)',

  // Tiered Subroles - Finance Department
  [Roles.FINANCE_VIEWER]: 'Finance Viewer',
  [Roles.FINANCE_OPERATOR]: 'Finance Operator',
  [Roles.FINANCE_MANAGER]: 'Finance Manager',

  // Tiered Subroles - Transport Department
  [Roles.TRANSPORT_VIEWER]: 'Transport Viewer',
  [Roles.TRANSPORT_OPERATOR]: 'Transport Operator',
  [Roles.TRANSPORT_MANAGER]: 'Transport Manager',

  // Tiered Subroles - Security Department
  [Roles.SECURITY_VIEWER]: 'Security Viewer',
  [Roles.SECURITY_OPERATOR]: 'Security Operator',
  [Roles.SECURITY_MANAGER]: 'Security Manager',

  // Tiered Subroles - Ticketing Department
  [Roles.TICKETING_VIEWER]: 'Ticketing Viewer',
  [Roles.TICKETING_OPERATOR]: 'Ticketing Operator',
  [Roles.TICKETING_MANAGER]: 'Ticketing Manager',

  // Tiered Subroles - Orders Department
  [Roles.ORDERS_VIEWER]: 'Orders Viewer',
  [Roles.ORDERS_OPERATOR]: 'Orders Operator',
  [Roles.ORDERS_MANAGER]: 'Orders Manager',

  // Tiered Subroles - Sales Department
  [Roles.SALES_VIEWER]: 'Sales Viewer',
  [Roles.SALES_OPERATOR]: 'Sales Operator',
  [Roles.SALES_MANAGER_TIER]: 'Sales Manager (Tier)',

  // Tiered Subroles - Dangote Department
  [Roles.DANGOTE_VIEWER]: 'Dangote Viewer',
  [Roles.DANGOTE_OPERATOR]: 'Dangote Operator',
  [Roles.DANGOTE_MANAGER]: 'Dangote Manager',

  // Tiered Subroles - LPG Department
  [Roles.LPG_VIEWER]: 'LPG Viewer',
  [Roles.LPG_OPERATOR]: 'LPG Operator',
  [Roles.LPG_MANAGER]: 'LPG Manager',

  [Roles.EXPENDITURE_OFFICER]: 'Expenditure Officer',
};

export const ALL_ROLES = Object.entries(ROLE_LABELS).map(([id, label]) => ({
  id: Number(id),
  label,
}));

export const ROLE_GROUPS: { label: string; roles: number[] }[] = [
  { label: 'Admin', roles: [Roles.SUPERADMIN, Roles.ADMIN, Roles.AUDIT] },
  { label: 'Finance', roles: [Roles.FINANCE, Roles.COMMISSIONS, Roles.COMMISSION_OFFICER, Roles.EXPENDITURE_OFFICER] },
  { label: 'Finance (Tiered)', roles: [Roles.FINANCE_VIEWER, Roles.FINANCE_OPERATOR, Roles.FINANCE_MANAGER] },
  { label: 'Operations', roles: [Roles.TICKETING, Roles.RELEASE, Roles.DISPATCH, Roles.SECURITY_ENTRY, Roles.SECURITY_EXIT, Roles.TRANSPORT, Roles.SALES_MANAGER, Roles.PRODUCT_MANAGER, Roles.TRUCK_SALES] },
  { label: 'Transport (Tiered)', roles: [Roles.TRANSPORT_VIEWER, Roles.TRANSPORT_OPERATOR, Roles.TRANSPORT_MANAGER] },
  { label: 'Security (Tiered)', roles: [Roles.SECURITY_VIEWER, Roles.SECURITY_OPERATOR, Roles.SECURITY_MANAGER] },
  { label: 'Ticketing (Tiered)', roles: [Roles.TICKETING_VIEWER, Roles.TICKETING_OPERATOR, Roles.TICKETING_MANAGER] },
  { label: 'Orders (Tiered)', roles: [Roles.ORDERS_VIEWER, Roles.ORDERS_OPERATOR, Roles.ORDERS_MANAGER] },
  { label: 'Sales (Tiered)', roles: [Roles.SALES_VIEWER, Roles.SALES_OPERATOR, Roles.SALES_MANAGER_TIER] },
  { label: 'LPG Division', roles: [Roles.LPG_DASHBOARD, Roles.LPG_PLANTS, Roles.LPG_STOCK, Roles.LPG_SALES] },
  { label: 'LPG (Tiered)', roles: [Roles.LPG_VIEWER, Roles.LPG_OPERATOR, Roles.LPG_MANAGER] },
  { label: 'Dangote (Tiered)', roles: [Roles.DANGOTE_VIEWER, Roles.DANGOTE_OPERATOR, Roles.DANGOTE_MANAGER] },
  { label: 'Others', roles: [Roles.IT_COMPLIANCE] },
];

export const roleColorMap: Record<number, string> = {
  [Roles.ADMIN]: 'text-purple-600',
  [Roles.FINANCE]: 'text-soroman-blue',
  [Roles.TRUCK_SALES]: 'text-emerald-600',
  [Roles.TICKETING]: 'text-amber-600',
  [Roles.SECURITY_ENTRY]: 'text-red-600',
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
  [Roles.SECURITY_EXIT]: 'text-rose-600',

  // Tiered Subroles - Finance Department
  [Roles.FINANCE_VIEWER]: 'text-blue-400',
  [Roles.FINANCE_OPERATOR]: 'text-blue-500',
  [Roles.FINANCE_MANAGER]: 'text-blue-700',

  // Tiered Subroles - Transport Department
  [Roles.TRANSPORT_VIEWER]: 'text-cyan-400',
  [Roles.TRANSPORT_OPERATOR]: 'text-cyan-500',
  [Roles.TRANSPORT_MANAGER]: 'text-cyan-700',

  // Tiered Subroles - Security Department
  [Roles.SECURITY_VIEWER]: 'text-red-400',
  [Roles.SECURITY_OPERATOR]: 'text-red-500',
  [Roles.SECURITY_MANAGER]: 'text-red-700',

  // Tiered Subroles - Ticketing Department
  [Roles.TICKETING_VIEWER]: 'text-amber-400',
  [Roles.TICKETING_OPERATOR]: 'text-amber-500',
  [Roles.TICKETING_MANAGER]: 'text-amber-700',

  // Tiered Subroles - Orders Department
  [Roles.ORDERS_VIEWER]: 'text-violet-400',
  [Roles.ORDERS_OPERATOR]: 'text-violet-500',
  [Roles.ORDERS_MANAGER]: 'text-violet-700',

  // Tiered Subroles - Sales Department
  [Roles.SALES_VIEWER]: 'text-indigo-400',
  [Roles.SALES_OPERATOR]: 'text-indigo-500',
  [Roles.SALES_MANAGER_TIER]: 'text-indigo-700',

  // Tiered Subroles - Dangote Department
  [Roles.DANGOTE_VIEWER]: 'text-orange-400',
  [Roles.DANGOTE_OPERATOR]: 'text-orange-500',
  [Roles.DANGOTE_MANAGER]: 'text-orange-700',

  // Tiered Subroles - LPG Department
  [Roles.LPG_VIEWER]: 'text-amber-400',
  [Roles.LPG_OPERATOR]: 'text-amber-500',
  [Roles.LPG_MANAGER]: 'text-amber-700',

  [Roles.EXPENDITURE_OFFICER]: 'text-blue-600',
};

// Reads the current user's roles from the auth store.
// Falls back to empty array if no user is logged in.
export function getCurrentUserRoles(): number[] {
  try {
    const stored = sessionStorage.getItem('dashboard-auth-storage')
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

export interface PageOverride {
  route_path: string;
  allowed: boolean;
}

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
  depot_ids: number[];
  lpg_station_ids: number[];
  page_overrides: PageOverride[];
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

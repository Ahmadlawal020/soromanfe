import { redirect } from '@tanstack/react-router'
import { 
  canAccessRoute, 
  isSuperAdmin, 
  ROUTE_PERMISSIONS,
  getRoutePermissions 
} from '#/lib/rbac'

/**
 * Get current user roles from session storage
 * Returns numeric role IDs
 *
 * The backend now sends these as Django's real role integers directly (see
 * Sman-Backend's middleware/verifyStaff.js / config/roleMapping.js) — no
 * string translation needed or possible here. A stale string->id table used
 * to live in this function; since the backend never sent strings, it always
 * mapped to an empty array, which made routeGuard() below treat every real
 * user as having zero roles and redirect-loop between /login and /overview.
 */
export function getCurrentUserRolesFromStorage(): number[] {
  try {
    const stored = sessionStorage.getItem('dashboard-auth-storage')
    if (!stored) return []

    const parsed = JSON.parse(stored)
    const roles = parsed?.state?.user?.roles
    if (!Array.isArray(roles)) return []

    return roles.map(Number).filter((r: number) => !isNaN(r))
  } catch {
    return []
  }
}

/**
 * Get the current user's per-page access overrides from session storage,
 * keyed by routePath -> allowed. See the admin form's "Page Access" section.
 */
export function getCurrentUserOverridesFromStorage(): Record<string, boolean> {
  try {
    const stored = sessionStorage.getItem('dashboard-auth-storage')
    if (!stored) return {}

    const parsed = JSON.parse(stored)
    const overrides = parsed?.state?.user?.pageOverrides
    if (!Array.isArray(overrides)) return {}

    const map: Record<string, boolean> = {}
    for (const o of overrides) {
      if (o && typeof o.routePath === 'string') map[o.routePath] = !!o.allowed
    }
    return map
  } catch {
    return {}
  }
}

/**
 * Helper to check if user has active session in storage
 */
export function isAuthenticatedFromStorage(): boolean {
  try {
    const stored = sessionStorage.getItem('dashboard-auth-storage')
    if (!stored) return false

    const parsed = JSON.parse(stored)
    return Boolean(parsed?.state?.accessToken || parsed?.state?.user)
  } catch {
    return false
  }
}

/**
 * Route guard function for TanStack Router's beforeLoad
 * Redirects unauthenticated users to /login and unauthorized users to /overview
 * 
 * @param routePath - The route path to check permissions for
 * @throws redirect to /login or /overview if access is denied
 * 
 * @example
 * // In a route file:
 * export const Route = createFileRoute('/orders/')({
 *   beforeLoad: () => routeGuard('/orders'),
 *   component: OrdersPage,
 * })
 */
export function routeGuard(routePath: string): void {
  if (!isAuthenticatedFromStorage()) {
    throw redirect({ to: '/login' })
  }

  const userRoles = getCurrentUserRolesFromStorage()

  // SUPERADMIN bypasses all checks
  if (isSuperAdmin(userRoles)) return

  // Check if user can access the route
  if (!canAccessRoute(userRoles, routePath, getCurrentUserOverridesFromStorage())) {
    if (routePath === '/overview') {
      throw redirect({ to: '/login' })
    }
    throw redirect({ to: '/overview' })
  }
}

/**
 * Route guard that checks a specific action permission
 * 
 * @param routePath - The route path to check permissions for
 * @param action - The action to check (view, create, edit, delete, etc.)
 * @throws redirect to /login or /overview if access is denied
 * 
 * @example
 * // In a route file for a form page:
 * export const Route = createFileRoute('/orders/form')({
 *   beforeLoad: () => routeActionGuard('/orders', 'create'),
 *   component: OrderForm,
 * })
 */
export function routeActionGuard(routePath: string, action: 'view' | 'create' | 'edit' | 'delete'): void {
  if (!isAuthenticatedFromStorage()) {
    throw redirect({ to: '/login' })
  }

  const userRoles = getCurrentUserRolesFromStorage()
  
  // SUPERADMIN bypasses all checks
  if (isSuperAdmin(userRoles)) return
  
  const permissions = getRoutePermissions(routePath)
  if (!permissions) return // No permissions defined = allow access
  
  const allowedRoles = permissions[action]
  if (!allowedRoles || allowedRoles.length === 0) {
    // No roles specified for this action = deny access
    if (routePath === '/overview') {
      throw redirect({ to: '/login' })
    }
    throw redirect({ to: '/overview' })
  }
  
  const hasAccess = allowedRoles.some(role => userRoles.includes(role))
  if (!hasAccess) {
    if (routePath === '/overview') {
      throw redirect({ to: '/login' })
    }
    throw redirect({ to: '/overview' })
  }
}

/**
 * Get filtered navigation categories based on current user's roles
 * For use in the Sidebar component
 */
export function getFilteredNavCategories<T extends { items: { path: string }[] }>(
  categories: T[],
  userRoles?: number[]
): T[] {
  const roles = userRoles ?? getCurrentUserRolesFromStorage()

  // SUPERADMIN sees everything
  if (isSuperAdmin(roles)) return categories

  const overrides = getCurrentUserOverridesFromStorage()
  return categories
    .map(category => ({
      ...category,
      items: category.items.filter(item => canAccessRoute(roles, item.path, overrides)),
    }))
    .filter(category => category.items.length > 0)
}

/**
 * Check if the current user has a specific role
 */
export function currentUserHasRole(roleId: number): boolean {
  const roles = getCurrentUserRolesFromStorage()
  if (isSuperAdmin(roles)) return true
  return roles.includes(roleId)
}

/**
 * Check if the current user has ANY of the specified roles
 */
export function currentUserHasAnyRole(roleIds: number[]): boolean {
  const roles = getCurrentUserRolesFromStorage()
  if (isSuperAdmin(roles)) return true
  return roleIds.some(role => roles.includes(role))
}

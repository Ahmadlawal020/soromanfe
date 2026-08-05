import { useMemo } from 'react'
import { useAuthStore } from '#/modules/auth'
import {
  Roles,
  isSuperAdmin,
  hasAnyRole,
  canAccessRoute,
  canPerformAction,
  isAuditRole,
  getRoutePermissions,
  type ActionType,
} from '#/lib/rbac'

/**
 * Hook for component-level role and permission checks
 * 
 * @param routePath - Optional route path to check permissions against
 * @returns Object with role checking utilities
 * 
 * @example
 * // Basic role check
 * const { hasRole, isSuperAdmin } = useRoles()
 * if (hasRole([Roles.ADMIN])) { ... }
 * 
 * // Route-specific permission check
 * const { canCreate, canEdit, canDelete } = useRoles('/orders')
 * {canCreate && <Button>Create Order</Button>}
 */
export function useRoles(routePath?: string) {
  const user = useAuthStore((s) => s.user)
  
  const userRoles = useMemo(() => {
    if (!user?.roles) return []
    // Convert string roles to numeric IDs
    const ROLE_STRING_TO_ID: Record<string, number> = {
      super_admin: 0,
      admin: 1,
      finance: 2,
      truck_sales: 3,
      ticketing: 4,
      security_entry: 5,
      transport: 6,
      release: 7,
      audit: 8,
      sales_manager: 9,
      product_manager: 10,
      lpg_dashboard: 11,
      lpg_plants: 12,
      lpg_stock: 13,
      lpg_sales: 14,
      commissions: 15,
      commission_officer: 16,
      dispatch: 17,
      it_compliance: 18,
      security_exit: 19,

      // Tiered Subroles - Finance Department
      finance_viewer: 20,
      finance_operator: 21,
      finance_manager: 22,

      // Tiered Subroles - Transport Department
      transport_viewer: 23,
      transport_operator: 24,
      transport_manager: 25,

      // Tiered Subroles - Security Department
      security_viewer: 26,
      security_operator: 27,
      security_manager: 28,

      // Tiered Subroles - Ticketing Department
      ticketing_viewer: 29,
      ticketing_operator: 30,
      ticketing_manager: 31,

      // Tiered Subroles - Orders Department
      orders_viewer: 32,
      orders_operator: 33,
      orders_manager: 34,

      // Tiered Subroles - Sales Department
      sales_viewer: 35,
      sales_operator: 36,
      sales_manager_tier: 37,

      // Tiered Subroles - Dangote Department
      dangote_viewer: 38,
      dangote_operator: 39,
      dangote_manager: 40,

      // Tiered Subroles - LPG Department
      lpg_viewer: 41,
      lpg_operator: 42,
      lpg_manager: 43,
    }
    return user.roles
      .map(r => ROLE_STRING_TO_ID[r])
      .filter((r): r is number => r !== undefined)
  }, [user?.roles])

  const isSuperAdminUser = useMemo(() => isSuperAdmin(userRoles), [userRoles])
  const isAuditUser = useMemo(() => isAuditRole(userRoles), [userRoles])

  const permissions = useMemo(() => {
    if (!routePath) return null
    return getRoutePermissions(routePath)
  }, [routePath])

  return {
    // User info
    userRoles,
    isSuperAdmin: isSuperAdminUser,
    isAudit: isAuditUser,

    // Generic role check
    hasRole: (roles: number[]) => hasAnyRole(userRoles, roles),

    // Route access check
    canAccess: routePath ? canAccessRoute(userRoles, routePath) : true,

    // Action-specific checks (only available when routePath is provided)
    canView: routePath ? canPerformAction(userRoles, routePath, 'view') : true,
    canCreate: routePath ? canPerformAction(userRoles, routePath, 'create') : false,
    canEdit: routePath ? canPerformAction(userRoles, routePath, 'edit') : false,
    canDelete: routePath ? canPerformAction(userRoles, routePath, 'delete') : false,
    canReview: routePath ? canPerformAction(userRoles, routePath, 'review') : false,
    canApprove: routePath ? canPerformAction(userRoles, routePath, 'approve') : false,
    canPay: routePath ? canPerformAction(userRoles, routePath, 'pay') : false,
    canDispatch: routePath ? canPerformAction(userRoles, routePath, 'dispatch') : false,
    canExport: routePath ? canPerformAction(userRoles, routePath, 'export') : false,

    // Raw permissions object for advanced use cases
    permissions,

    // Helper to check any custom action
    canDo: (action: ActionType) => routePath 
      ? canPerformAction(userRoles, routePath, action) 
      : isSuperAdminUser,
  }
}

/**
 * Simple hook to get current user's numeric role IDs
 */
export function useCurrentUserRoles(): number[] {
  const user = useAuthStore((s) => s.user)
  
  return useMemo(() => {
    if (!user?.roles) return []
    const ROLE_STRING_TO_ID: Record<string, number> = {
      super_admin: 0,
      admin: 1,
      finance: 2,
      truck_sales: 3,
      ticketing: 4,
      security_entry: 5,
      transport: 6,
      release: 7,
      audit: 8,
      sales_manager: 9,
      product_manager: 10,
      lpg_dashboard: 11,
      lpg_plants: 12,
      lpg_stock: 13,
      lpg_sales: 14,
      commissions: 15,
      commission_officer: 16,
      dispatch: 17,
      it_compliance: 18,
      security_exit: 19,

      // Tiered Subroles - Finance Department
      finance_viewer: 20,
      finance_operator: 21,
      finance_manager: 22,

      // Tiered Subroles - Transport Department
      transport_viewer: 23,
      transport_operator: 24,
      transport_manager: 25,

      // Tiered Subroles - Security Department
      security_viewer: 26,
      security_operator: 27,
      security_manager: 28,

      // Tiered Subroles - Ticketing Department
      ticketing_viewer: 29,
      ticketing_operator: 30,
      ticketing_manager: 31,

      // Tiered Subroles - Orders Department
      orders_viewer: 32,
      orders_operator: 33,
      orders_manager: 34,

      // Tiered Subroles - Sales Department
      sales_viewer: 35,
      sales_operator: 36,
      sales_manager_tier: 37,

      // Tiered Subroles - Dangote Department
      dangote_viewer: 38,
      dangote_operator: 39,
      dangote_manager: 40,

      // Tiered Subroles - LPG Department
      lpg_viewer: 41,
      lpg_operator: 42,
      lpg_manager: 43,
    }
    return user.roles
      .map(r => ROLE_STRING_TO_ID[r])
      .filter((r): r is number => r !== undefined)
  }, [user?.roles])
}

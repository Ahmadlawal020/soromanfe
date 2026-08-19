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
  
  // Sman-Backend sends Django's real role integers directly (see
  // config/roleMapping.js) — no string translation needed or possible here.
  const userRoles = useMemo(() => {
    if (!user?.roles) return []
    return user.roles.map(Number).filter((r) => !isNaN(r))
  }, [user?.roles])

  const isSuperAdminUser = useMemo(() => isSuperAdmin(userRoles), [userRoles])
  const isAuditUser = useMemo(() => isAuditRole(userRoles), [userRoles])

  // Per-page visibility exceptions on top of the role default — see the
  // admin form's "Page Access" section. Only view access is overridable;
  // create/edit/delete etc. below stay role-derived.
  const pageOverrides = useMemo(() => {
    const map: Record<string, boolean> = {}
    for (const o of user?.pageOverrides || []) map[o.routePath] = o.allowed
    return map
  }, [user?.pageOverrides])

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
    canAccess: routePath ? canAccessRoute(userRoles, routePath, pageOverrides) : true,

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
  
  // Sman-Backend sends Django's real role integers directly — see the note
  // on the userRoles memo in useRoles() above.
  return useMemo(() => {
    if (!user?.roles) return []
    return user.roles.map(Number).filter((r) => !isNaN(r))
  }, [user?.roles])
}

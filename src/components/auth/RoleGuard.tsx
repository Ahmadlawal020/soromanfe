import React from 'react'
import { useRoles } from '#/lib/hooks/useRoles'
import { type ActionType } from '#/lib/rbac'

interface RoleGuardProps {
  children: React.ReactNode
  /** Route path to check permissions against */
  routePath?: string
  /** Specific action to check (view, create, edit, delete, etc.) */
  action?: ActionType
  /** Array of role IDs that are allowed (for custom role checks) */
  roles?: number[]
  /** Content to render when access is denied (default: null) */
  fallback?: React.ReactNode
  /** If true, renders fallback instead of nothing when denied */
  showFallback?: boolean
}

/**
 * Component-level access control guard
 * 
 * Renders children only if the current user has the required permissions.
 * 
 * @example
 * // Check specific action on a route
 * <RoleGuard routePath="/orders" action="create">
 *   <Button>Create Order</Button>
 * </RoleGuard>
 * 
 * @example
 * // Check custom roles
 * <RoleGuard roles={[Roles.ADMIN, Roles.SUPERADMIN]}>
 *   <AdminPanel />
 * </RoleGuard>
 * 
 * @example
 * // With fallback content
 * <RoleGuard routePath="/admin" action="edit" showFallback fallback={<DisabledButton />}>
 *   <EditButton />
 * </RoleGuard>
 */
export function RoleGuard({
  children,
  routePath,
  action,
  roles,
  fallback = null,
  showFallback = false,
}: RoleGuardProps) {
  const { hasRole, canDo, isSuperAdmin } = useRoles(routePath)

  // If specific roles are provided, check those
  if (roles) {
    if (!hasRole(roles) && !isSuperAdmin) {
      return showFallback ? <>{fallback}</> : null
    }
    return <>{children}</>
  }

  // If action is specified, check that action
  if (action && routePath) {
    if (!canDo(action) && !isSuperAdmin) {
      return showFallback ? <>{fallback}</> : null
    }
    return <>{children}</>
  }

  // If only routePath is provided, check view access
  if (routePath) {
    const { canAccess } = useRoles(routePath)
    if (!canAccess && !isSuperAdmin) {
      return showFallback ? <>{fallback}</> : null
    }
    return <>{children}</>
  }

  // No restrictions specified, render children
  return <>{children}</>
}

/**
 * Convenience wrapper for create action
 */
export function CanCreate({ 
  routePath, 
  children, 
  fallback 
}: { 
  routePath: string
  children: React.ReactNode
  fallback?: React.ReactNode 
}) {
  return (
    <RoleGuard routePath={routePath} action="create" showFallback={!!fallback} fallback={fallback}>
      {children}
    </RoleGuard>
  )
}

/**
 * Convenience wrapper for edit action
 */
export function CanEdit({ 
  routePath, 
  children, 
  fallback 
}: { 
  routePath: string
  children: React.ReactNode
  fallback?: React.ReactNode 
}) {
  return (
    <RoleGuard routePath={routePath} action="edit" showFallback={!!fallback} fallback={fallback}>
      {children}
    </RoleGuard>
  )
}

/**
 * Convenience wrapper for delete action
 */
export function CanDelete({ 
  routePath, 
  children, 
  fallback 
}: { 
  routePath: string
  children: React.ReactNode
  fallback?: React.ReactNode 
}) {
  return (
    <RoleGuard routePath={routePath} action="delete" showFallback={!!fallback} fallback={fallback}>
      {children}
    </RoleGuard>
  )
}

/**
 * Convenience wrapper for review action
 */
export function CanReview({ 
  routePath, 
  children, 
  fallback 
}: { 
  routePath: string
  children: React.ReactNode
  fallback?: React.ReactNode 
}) {
  return (
    <RoleGuard routePath={routePath} action="review" showFallback={!!fallback} fallback={fallback}>
      {children}
    </RoleGuard>
  )
}

/**
 * Convenience wrapper for approve action
 */
export function CanApprove({ 
  routePath, 
  children, 
  fallback 
}: { 
  routePath: string
  children: React.ReactNode
  fallback?: React.ReactNode 
}) {
  return (
    <RoleGuard routePath={routePath} action="approve" showFallback={!!fallback} fallback={fallback}>
      {children}
    </RoleGuard>
  )
}

/**
 * Convenience wrapper for pay action
 */
export function CanPay({ 
  routePath, 
  children, 
  fallback 
}: { 
  routePath: string
  children: React.ReactNode
  fallback?: React.ReactNode 
}) {
  return (
    <RoleGuard routePath={routePath} action="pay" showFallback={!!fallback} fallback={fallback}>
      {children}
    </RoleGuard>
  )
}

/**
 * Convenience wrapper for dispatch action
 */
export function CanDispatch({ 
  routePath, 
  children, 
  fallback 
}: { 
  routePath: string
  children: React.ReactNode
  fallback?: React.ReactNode 
}) {
  return (
    <RoleGuard routePath={routePath} action="dispatch" showFallback={!!fallback} fallback={fallback}>
      {children}
    </RoleGuard>
  )
}

/**
 * Convenience wrapper for export action
 */
export function CanExport({ 
  routePath, 
  children, 
  fallback 
}: { 
  routePath: string
  children: React.ReactNode
  fallback?: React.ReactNode 
}) {
  return (
    <RoleGuard routePath={routePath} action="export" showFallback={!!fallback} fallback={fallback}>
      {children}
    </RoleGuard>
  )
}

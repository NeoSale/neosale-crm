'use client'

import { useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { UserRole, Permission } from '@/types/auth'

/**
 * Role hierarchy for numeric comparison
 */
const ROLE_HIERARCHY: Record<UserRole, number> = {
  super_admin: 6,
  admin: 5,
  manager: 4,
  salesperson: 3,
  member: 2,
  viewer: 1,
}

/**
 * Permission mappings per role
 */
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  super_admin: [
    'leads:view_all',
    'leads:view_assigned',
    'leads:create',
    'leads:edit',
    'leads:delete',
    'leads:assign',
    'leads:transfer',
    'reports:view',
    'reports:export',
    'settings:view',
    'settings:manage',
    'users:view',
    'users:manage',
  ],
  admin: [
    'leads:view_all',
    'leads:view_assigned',
    'leads:create',
    'leads:edit',
    'leads:delete',
    'leads:assign',
    'leads:transfer',
    'reports:view',
    'reports:export',
    'settings:view',
    'settings:manage',
    'users:view',
    'users:manage',
  ],
  manager: [
    'leads:view_all',
    'leads:view_assigned',
    'leads:create',
    'leads:edit',
    'leads:assign',
    'leads:transfer',
    'reports:view',
    'reports:export',
    'users:view',
  ],
  salesperson: [
    'leads:view_assigned',
    'leads:edit',
  ],
  member: [
    'leads:view_assigned',
  ],
  viewer: [],
}

export interface UsePermissionsReturn {
  role: UserRole | null
  permissions: Permission[]
  hasPermission: (permission: Permission) => boolean
  hasAnyPermission: (permissions: Permission[]) => boolean
  hasAllPermissions: (permissions: Permission[]) => boolean
  canViewAllLeads: boolean
  canViewAssignedLeadsOnly: boolean
  canAssignLeads: boolean
  canTransferLeads: boolean
  canViewReports: boolean
  canManageSettings: boolean
  canManageUsers: boolean
  isAtLeast: (role: UserRole) => boolean
  isExactly: (role: UserRole) => boolean
  isSalesperson: boolean
  isManager: boolean
  isAdmin: boolean
}

/**
 * Hook for checking user permissions based on their role
 */
export function usePermissions(): UsePermissionsReturn {
  const { profile } = useAuth()

  return useMemo(() => {
    const role = profile?.role || null
    const permissions = role ? ROLE_PERMISSIONS[role] : []

    const hasPermission = (permission: Permission): boolean => {
      return permissions.includes(permission)
    }

    const hasAnyPermission = (perms: Permission[]): boolean => {
      return perms.some((p) => permissions.includes(p))
    }

    const hasAllPermissions = (perms: Permission[]): boolean => {
      return perms.every((p) => permissions.includes(p))
    }

    const isAtLeast = (targetRole: UserRole): boolean => {
      if (!role) return false
      return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY[targetRole]
    }

    const isExactly = (targetRole: UserRole): boolean => {
      return role === targetRole
    }

    return {
      role,
      permissions,
      hasPermission,
      hasAnyPermission,
      hasAllPermissions,
      canViewAllLeads: hasPermission('leads:view_all'),
      canViewAssignedLeadsOnly:
        hasPermission('leads:view_assigned') && !hasPermission('leads:view_all'),
      canAssignLeads: hasPermission('leads:assign'),
      canTransferLeads: hasPermission('leads:transfer'),
      canViewReports: hasPermission('reports:view'),
      canManageSettings: hasPermission('settings:manage'),
      canManageUsers: hasPermission('users:manage'),
      isAtLeast,
      isExactly,
      isSalesperson: role === 'salesperson',
      isManager: role === 'manager',
      isAdmin: role === 'admin' || role === 'super_admin',
    }
  }, [profile?.role])
}

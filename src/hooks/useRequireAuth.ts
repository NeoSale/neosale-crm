'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@neosale/auth'
import { UserRole } from '@/types/auth'

export function useRequireAuth(requiredRole?: UserRole) {
  const { user, profile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }

    if (!loading && user && requiredRole && profile) {
      const roleHierarchy: Record<UserRole, number> = {
        super_admin: 6,
        admin: 5,
        manager: 4,
        salesperson: 3,
        member: 2,
        viewer: 1,
      }

      if (roleHierarchy[profile.role] < roleHierarchy[requiredRole]) {
        router.push('/unauthorized')
      }
    }
  }, [user, profile, loading, requiredRole, router])

  return { user, profile, loading }
}

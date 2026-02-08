'use client'

import { useEffect } from 'react'
import { useAuth } from '@neosale/auth'
import { UserRole } from '@/types/auth'

export function useRequireAuth(requiredRole?: UserRole) {
  const { user, profile, loading } = useAuth()

  useEffect(() => {
    if (!loading && !user) {
      const authUrl = process.env.NEXT_PUBLIC_AUTH_URL || 'http://localhost:5000'
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
      const redirectUrl = encodeURIComponent(appUrl)
      window.location.href = `${authUrl}/login?redirect_url=${redirectUrl}`
    }
  }, [user, loading])

  return { user, profile, loading }
}

import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuthStore } from '@/app/store'
import type { Role } from '@/config/roles'
import { ROUTES } from '@/config/routes'

interface RoleGuardProps {
  roles: Role[]
  children: ReactNode
  fallback?: ReactNode
}

/**
 * Wraps a route/component and redirects to /login if the user is not
 * authenticated or does not have one of the allowed roles.
 */
export default function RoleGuard({ roles, children, fallback }: RoleGuardProps) {
  const { isAuthenticated, user } = useAuthStore()

  if (!isAuthenticated || !user) {
    return <Navigate to={ROUTES.LOGIN} replace />
  }

  if (!roles.includes(user.role as Role)) {
    return fallback ? <>{fallback}</> : <Navigate to={ROUTES.LOGIN} replace />
  }

  return <>{children}</>
}

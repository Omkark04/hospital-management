/**
 * features/auth/components/RoleRedirect.tsx
 * Used AFTER successful login to route user to their role-specific dashboard.
 * Also serves as a fallback for authenticated users landing on /login.
 */
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/app/store'
import { ROUTES } from '@/config/routes'
import type { Role } from '@/config/roles'

const ROLE_ROUTES: Record<Role, string> = {
  owner:            ROUTES.OWNER_DASHBOARD,
  doctor:           ROUTES.DOCTOR_DASHBOARD,
  receptionist:     ROUTES.RECEPTIONIST_DASHBOARD,
  patient:          ROUTES.PATIENT_DASHBOARD,
  hr:               ROUTES.HR_DASHBOARD,
  employee:         ROUTES.EMPLOYEE_DASHBOARD,
  campaign_manager: ROUTES.OWNER_DASHBOARD,  // campaign managers go to owner view for now
}

export default function RoleRedirect() {
  const { isAuthenticated, user } = useAuthStore()

  if (!isAuthenticated || !user) {
    return <Navigate to={ROUTES.LOGIN} replace />
  }

  const route = ROLE_ROUTES[user.role as Role] ?? ROUTES.HOME
  return <Navigate to={route} replace />
}

/**
 * hooks/usePermissions.ts
 * React hook that exposes role-based permission checks for the current user.
 */
import { useAuthStore } from '@/app/store'
import {
  can,
  isOwner,
  isDoctor,
  isReceptionist,
  isPatient,
  isHR,
  isEmployee,
  canManagePatients,
  canManageBilling,
  APPOINTMENT_ROLES,
  PRODUCT_ROLES,
  HR_ROLES,
} from '@/lib/auth/permissions'
import type { Role } from '@/config/roles'

export function usePermissions() {
  const role = useAuthStore((s) => s.user?.role) as Role | undefined

  return {
    role,
    isOwner: isOwner(role),
    isDoctor: isDoctor(role),
    isReceptionist: isReceptionist(role),
    isPatient: isPatient(role),
    isHR: isHR(role),
    isEmployee: isEmployee(role),

    // Feature-level permissions
    canManagePatients: canManagePatients(role),
    canManageBilling: canManageBilling(role),
    canManageAppointments: can(role, APPOINTMENT_ROLES),
    canManageProducts: can(role, PRODUCT_ROLES),
    canAccessHR: can(role, HR_ROLES),

    // Generic checker
    can: (allowedRoles: Role[]) => can(role, allowedRoles),
  }
}

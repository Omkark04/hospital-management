/**
 * lib/auth/permissions.ts
 * Frontend permission helpers — mirrors backend RBAC roles.
 * Use in components to conditionally render UI elements.
 */
import type { Role } from '@/config/roles'

/** Roles that can access the full admin/management area */
export const ADMIN_ROLES: Role[] = ['owner', 'receptionist', 'hr']

/** Roles that can view and manage patient records */
export const PATIENT_MANAGEMENT_ROLES: Role[] = ['owner', 'doctor', 'receptionist']

/** Roles that can manage appointments */
export const APPOINTMENT_ROLES: Role[] = ['owner', 'doctor', 'receptionist', 'patient']

/** Roles that can access billing */
export const BILLING_ROLES: Role[] = ['owner', 'receptionist']

/** Roles that can access HR module */
export const HR_ROLES: Role[] = ['owner', 'hr']

/** Roles that can manage products/medicines */
export const PRODUCT_ROLES: Role[] = ['owner', 'receptionist']

// ─── Permission check helpers ─────────────────────────────────────────────────

export function can(userRole: Role | undefined, allowedRoles: Role[]): boolean {
  if (!userRole) return false
  return allowedRoles.includes(userRole)
}

export function isOwner(role: Role | undefined): boolean {
  return role === 'owner'
}

export function isDoctor(role: Role | undefined): boolean {
  return role === 'doctor'
}

export function isReceptionist(role: Role | undefined): boolean {
  return role === 'receptionist'
}

export function isPatient(role: Role | undefined): boolean {
  return role === 'patient'
}

export function isHR(role: Role | undefined): boolean {
  return role === 'hr'
}

export function isEmployee(role: Role | undefined): boolean {
  return role === 'employee'
}

export function canManagePatients(role: Role | undefined): boolean {
  return can(role, PATIENT_MANAGEMENT_ROLES)
}

export function canManageBilling(role: Role | undefined): boolean {
  return can(role, BILLING_ROLES)
}

export const ROLES = {
  OWNER: 'owner',
  DOCTOR: 'doctor',
  RECEPTIONIST: 'receptionist',
  PATIENT: 'patient',
  HR: 'hr',
  EMPLOYEE: 'employee',
  CAMPAIGN_MANAGER: 'campaign_manager',
} as const

export type Role = (typeof ROLES)[keyof typeof ROLES]

export const ROLE_LABELS: Record<Role, string> = {
  owner: 'Owner',
  doctor: 'Doctor',
  receptionist: 'Receptionist',
  patient: 'Patient',
  hr: 'HR Manager',
  employee: 'Employee',
  campaign_manager: 'Campaign Manager',
}

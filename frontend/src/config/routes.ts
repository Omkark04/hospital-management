export const ROUTES = {
  HOME: '/',
  ABOUT: '/about',
  SERVICES: '/services',
  BLOG: '/blog',
  CONTACT: '/contact',
  PRODUCTS: '/products',
  REFERRAL: '/referral',
  LOGIN: '/login',

  // Role dashboards (base routes)
  OWNER: '/owner/*',
  OWNER_DASHBOARD: '/owner/dashboard',
  OWNER_BRANCHES: '/owner/branches',
  OWNER_SETTINGS: '/owner/settings',

  DOCTOR: '/doctor/*',
  DOCTOR_DASHBOARD: '/doctor/dashboard',
  DOCTOR_PATIENTS: '/doctor/patients',

  RECEPTIONIST: '/receptionist/*',
  RECEPTIONIST_DASHBOARD: '/receptionist/dashboard',
  RECEPTIONIST_APPOINTMENTS: '/receptionist/appointments',
  RECEPTIONIST_BILLING: '/receptionist/billing',

  PATIENT: '/patient/*',
  PATIENT_DASHBOARD: '/patient/dashboard',
  PATIENT_APPOINTMENTS: '/patient/appointments',
  PATIENT_HISTORY: '/patient/history',

  HR: '/hr/*',
  HR_DASHBOARD: '/hr/dashboard',
  HR_EMPLOYEES: '/hr/employees',
  HR_LEAVES: '/hr/leaves',

  EMPLOYEE: '/employee/*',
  EMPLOYEE_DASHBOARD: '/employee/dashboard',
} as const

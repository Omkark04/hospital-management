/**
 * All API endpoint constants.
 * Import from here — never hardcode URLs in feature code.
 */
const API = {
  // Auth
  AUTH: {
    LOGIN: '/auth/login/',
    REGISTER: '/auth/register/',
    LOGOUT: '/auth/logout/',
    REFRESH: '/auth/token/refresh/',
    ME: '/auth/me/',
  },

  // Branches
  BRANCHES: {
    LIST: '/branches/',
    DETAIL: (id: string) => `/branches/${id}/`,
  },

  // Patients
  PATIENTS: {
    LIST: '/patients/',
    DETAIL: (id: string) => `/patients/${id}/`,
    HISTORY: (id: string) => `/patients/${id}/history/`,
  },

  // Appointments
  APPOINTMENTS: {
    LIST: '/appointments/',
    DETAIL: (id: string) => `/appointments/${id}/`,
    SLOTS: '/appointments/slots/',
  },

  // Billing
  BILLING: {
    INVOICES: '/billing/invoices/',
    INVOICE_DETAIL: (id: string) => `/billing/invoices/${id}/`,
    PAYMENTS: '/billing/payments/',
  },

  // HR
  HR: {
    EMPLOYEES: '/hr/employees/',
    EMPLOYEE_DETAIL: (id: string) => `/hr/employees/${id}/`,
    ATTENDANCE: '/hr/attendance/',
    LEAVES: '/hr/leaves/',
    LEAVE_DETAIL: (id: string) => `/hr/leaves/${id}/`,
  },

  // Products
  PRODUCTS: {
    LIST: '/products/',
    DETAIL: (id: string) => `/products/${id}/`,
    CATEGORIES: '/products/categories/',
  },

  // Notifications
  NOTIFICATIONS: {
    LIST: '/notifications/',
    MARK_READ: (id: string) => `/notifications/${id}/read/`,
    MARK_ALL_READ: '/notifications/read-all/',
  },

  // Public
  PUBLIC: {
    BLOG: '/public/blog/',
    SERVICES: '/public/services/',
  },

  // Referrals
  REFERRALS: {
    SUBMIT: '/referrals/',
  },
}

export default API

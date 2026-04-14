import { NavLink } from 'react-router-dom'
import { useAuthStore } from '@/app/store'
import { ROUTES } from '@/config/routes'
import {
  LayoutDashboard, Users, Calendar, Receipt,
  UserCheck, Package, Megaphone, Bell, Settings,
  Building2, ClipboardList, UserCircle, Briefcase,
} from 'lucide-react'
import styles from './Sidebar.module.css'

interface NavItem {
  label: string
  to: string
  icon: React.ReactNode
}

const NAV_BY_ROLE: Record<string, NavItem[]> = {
  owner: [
    { label: 'Dashboard',   to: ROUTES.OWNER_DASHBOARD, icon: <LayoutDashboard size={18} /> },
    { label: 'Branches',    to: ROUTES.OWNER_BRANCHES,  icon: <Building2 size={18} /> },
    { label: 'Settings',    to: ROUTES.OWNER_SETTINGS,  icon: <Settings size={18} /> },
  ],
  doctor: [
    { label: 'Dashboard',  to: ROUTES.DOCTOR_DASHBOARD, icon: <LayoutDashboard size={18} /> },
    { label: 'Patients',   to: ROUTES.DOCTOR_PATIENTS,  icon: <Users size={18} /> },
  ],
  receptionist: [
    { label: 'Dashboard',    to: ROUTES.RECEPTIONIST_DASHBOARD,    icon: <LayoutDashboard size={18} /> },
    { label: 'Appointments', to: ROUTES.RECEPTIONIST_APPOINTMENTS, icon: <Calendar size={18} /> },
    { label: 'Billing',      to: ROUTES.RECEPTIONIST_BILLING,      icon: <Receipt size={18} /> },
  ],
  patient: [
    { label: 'Dashboard',    to: ROUTES.PATIENT_DASHBOARD,    icon: <LayoutDashboard size={18} /> },
    { label: 'Appointments', to: ROUTES.PATIENT_APPOINTMENTS, icon: <Calendar size={18} /> },
    { label: 'Medical History', to: ROUTES.PATIENT_HISTORY,   icon: <ClipboardList size={18} /> },
  ],
  hr: [
    { label: 'Dashboard',    to: ROUTES.HR_DASHBOARD,  icon: <LayoutDashboard size={18} /> },
    { label: 'Employees',    to: ROUTES.HR_EMPLOYEES,  icon: <UserCheck size={18} /> },
    { label: 'Leave Requests', to: ROUTES.HR_LEAVES,  icon: <Briefcase size={18} /> },
  ],
  employee: [
    { label: 'Dashboard',   to: ROUTES.EMPLOYEE_DASHBOARD, icon: <LayoutDashboard size={18} /> },
  ],
}

export function Sidebar() {
  const { user } = useAuthStore()
  const navItems = (user?.role && NAV_BY_ROLE[user.role]) ?? []

  return (
    <aside className={styles.sidebar}>
      {/* Logo */}
      <div className={styles.logo}>
        <div className={styles.logoIcon}>🏥</div>
        <span className={styles.logoText}>HMS</span>
      </div>

      {/* User info */}
      {user && (
        <div className={styles.userInfo}>
          <div className={styles.avatar}>
            {user.full_name?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div>
            <p className={styles.userName}>{user.full_name}</p>
            <p className={styles.userRole}>{user.role}</p>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className={styles.nav}>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.active : ''}`
            }
          >
            <span className={styles.navIcon}>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}

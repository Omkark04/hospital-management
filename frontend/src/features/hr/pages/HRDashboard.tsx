import { useAuthStore } from '@/app/store'
import styles from './HRDashboard.module.css'

const STATS = [
  { label: 'Total Employees', value: '87',  icon: '👥', trend: '5 new this month', color: 'blue' },
  { label: 'On Leave Today',  value: '6',   icon: '🏖️', trend: '2 pending approval', color: 'orange' },
  { label: 'Present Today',   value: '79',  icon: '✅', trend: '90.8% attendance', color: 'green' },
  { label: 'Open Positions',  value: '3',   icon: '📋', trend: 'Hiring in progress', color: 'purple' },
]

const LEAVE_REQUESTS = [
  { name: 'Deepak Nair',    role: 'Nurse',        dates: '16–18 Apr',  type: 'Sick Leave',   status: 'Pending' },
  { name: 'Shalini Verma',  role: 'Lab Tech',     dates: '20–21 Apr',  type: 'Casual Leave', status: 'Pending' },
  { name: 'Raju Yadav',     role: 'Housekeeping', dates: '22 Apr',     type: 'Emergency',    status: 'Pending' },
]

export default function HRDashboard() {
  const { user } = useAuthStore()

  return (
    <div className={styles.page}>
      <div className={styles.heading}>
        <h1 className={styles.title}>HR Management</h1>
        <p className={styles.subtitle}>Welcome, {user?.full_name} — {new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })}</p>
      </div>

      <div className={styles.statsGrid}>
        {STATS.map((s) => (
          <div key={s.label} className={`${styles.card} ${styles[s.color]}`}>
            <span className={styles.cardIcon}>{s.icon}</span>
            <div>
              <p className={styles.cardValue}>{s.value}</p>
              <p className={styles.cardLabel}>{s.label}</p>
              <p className={styles.cardTrend}>{s.trend}</p>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.actions}>
        <button className={styles.actionBtn} id="add-employee-btn">➕ Add Employee</button>
        <button className={styles.actionBtn} id="mark-attendance-btn">📋 Mark Attendance</button>
        <button className={styles.actionBtn} id="payroll-btn">💰 Process Payroll</button>
      </div>

      {/* Leave Requests */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Pending Leave Requests</h2>
        <div className={styles.table}>
          <div className={styles.tableHeader}>
            <span>Employee</span><span>Role</span><span>Dates</span><span>Type</span><span>Actions</span>
          </div>
          {LEAVE_REQUESTS.map((r) => (
            <div key={r.name} className={styles.tableRow}>
              <span className={styles.empName}>{r.name}</span>
              <span className={styles.empRole}>{r.role}</span>
              <span>{r.dates}</span>
              <span>{r.type}</span>
              <div className={styles.rowActions}>
                <button className={styles.btnApprove} id={`approve-${r.name.replace(' ', '-')}`}>Approve</button>
                <button className={styles.btnReject}  id={`reject-${r.name.replace(' ', '-')}`}>Reject</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className={styles.apiNote}>📡 Live data from <code>/api/v1/hr/employees/</code> and <code>/api/v1/hr/leaves/</code></p>
    </div>
  )
}

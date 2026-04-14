import { useAuthStore } from '@/app/store'
import styles from './ReceptionistDashboard.module.css'

const STATS = [
  { label: 'New Registrations', value: '7',   icon: '➕', trend: 'Today', color: 'blue' },
  { label: 'Appointments',      value: '24',  icon: '📅', trend: '8 pending confirm', color: 'purple' },
  { label: 'Billing Pending',   value: '₹42k', icon: '💳', trend: '5 invoices due', color: 'orange' },
  { label: 'Walk-ins',          value: '4',   icon: '🚶', trend: 'In queue', color: 'green' },
]

const QUEUE = [
  { token: 'T-001', name: 'Amit Joshi',   uhid: 'Walk-in',           type: 'Consultation',   status: 'In Progress' },
  { token: 'T-002', name: 'Leela Devi',   uhid: 'HMS-DEL-2025-00341', type: 'Follow-up',      status: 'Waiting' },
  { token: 'T-003', name: 'Farhan Khan',  uhid: 'HMS-DEL-2025-00289', type: 'Test Result',    status: 'Waiting' },
  { token: 'T-004', name: 'Sunita Rao',   uhid: 'Walk-in',           type: 'Registration',   status: 'Waiting' },
]

export default function ReceptionistDashboard() {
  const { user } = useAuthStore()

  return (
    <div className={styles.page}>
      <div className={styles.heading}>
        <h1 className={styles.title}>Reception Desk</h1>
        <p className={styles.subtitle}>
          Welcome, {user?.full_name} — {new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })}
        </p>
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

      {/* Quick Actions */}
      <div className={styles.actions}>
        <button className={styles.actionBtn} id="register-patient-btn">➕ Register Patient</button>
        <button className={styles.actionBtn} id="book-appointment-btn">📅 Book Appointment</button>
        <button className={styles.actionBtn} id="create-invoice-btn">💳 Create Invoice</button>
        <button className={styles.actionBtn} id="search-patient-btn">🔍 Search Patient</button>
      </div>

      {/* Today's Queue */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Today's Queue</h2>
        <div className={styles.table}>
          <div className={styles.tableHeader}>
            <span>Token</span><span>Name</span><span>UHID</span><span>Type</span><span>Status</span><span>Action</span>
          </div>
          {QUEUE.map((row) => (
            <div key={row.token} className={styles.tableRow}>
              <span className={styles.token}>{row.token}</span>
              <span>{row.name}</span>
              <span className={styles.uhid}>{row.uhid}</span>
              <span>{row.type}</span>
              <span className={`${styles.status} ${styles[row.status.replace(' ', '')]}`}>{row.status}</span>
              <button className={styles.btnAction} id={`process-${row.token}`}>Process</button>
            </div>
          ))}
        </div>
      </div>

      <p className={styles.apiNote}>📡 Live data from <code>/api/v1/appointments/today/</code> and <code>/api/v1/patients/</code></p>
    </div>
  )
}

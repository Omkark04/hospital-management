import { useAuthStore } from '@/app/store'
import styles from './DoctorDashboard.module.css'

const STATS = [
  { label: "Today's Patients",  value: '12',  icon: '👥', trend: '3 pending', color: 'blue' },
  { label: "Appointments",      value: '8',   icon: '📅', trend: '2 upcoming', color: 'purple' },
  { label: "Completed Today",   value: '6',   icon: '✅', trend: 'On schedule', color: 'green' },
  { label: "Avg. Consult Time", value: '18m', icon: '⏱️', trend: 'vs 22m last week', color: 'orange' },
]

const UPCOMING = [
  { time: '10:00 AM', patient: 'Ravi Sharma',   uhid: 'HMS-MUM-2025-00012', reason: 'Follow-up' },
  { time: '10:30 AM', patient: 'Priya Menon',   uhid: 'HMS-MUM-2025-00048', reason: 'Consultation' },
  { time: '11:00 AM', patient: 'Arjun Kapoor',  uhid: 'HMS-MUM-2025-00073', reason: 'New patient' },
  { time: '11:30 AM', patient: 'Sneha Patil',   uhid: 'HMS-MUM-2025-00091', reason: 'Test review' },
]

export default function DoctorDashboard() {
  const { user } = useAuthStore()
  const today = new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })

  return (
    <div className={styles.page}>
      <div className={styles.heading}>
        <div>
          <h1 className={styles.title}>Good morning, Dr. {user?.full_name?.split(' ')[0]} 👋</h1>
          <p className={styles.subtitle}>{today} — Here's your schedule overview</p>
        </div>
      </div>

      {/* Stats */}
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

      {/* Today's schedule */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Today's Appointments</h2>
        <div className={styles.table}>
          <div className={styles.tableHeader}>
            <span>Time</span>
            <span>Patient</span>
            <span>UHID</span>
            <span>Reason</span>
            <span>Action</span>
          </div>
          {UPCOMING.map((row) => (
            <div key={row.uhid} className={styles.tableRow}>
              <span className={styles.time}>{row.time}</span>
              <span className={styles.patientName}>{row.patient}</span>
              <span className={styles.uhid}>{row.uhid}</span>
              <span className={styles.reason}>{row.reason}</span>
              <button className={styles.btnView} id={`view-patient-${row.uhid}`}>
                View Chart
              </button>
            </div>
          ))}
        </div>
      </div>

      <p className={styles.apiNote}>📡 Connect to <code>/api/v1/appointments/today/</code> to load live data</p>
    </div>
  )
}

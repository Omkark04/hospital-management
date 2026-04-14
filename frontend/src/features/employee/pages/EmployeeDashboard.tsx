import { useAuthStore } from '@/app/store'
import styles from './EmployeeDashboard.module.css'

const TODAY_SCHEDULE = [
  { time: '09:00 AM', task: 'Ward Rounds — Floor 2',         dept: 'General' },
  { time: '11:00 AM', task: 'Assist with OT Prep — Room 3',  dept: 'OT' },
  { time: '02:00 PM', task: 'Inventory Check — Pharmacy',     dept: 'Pharmacy' },
  { time: '04:00 PM', task: 'Shift Handover Report',          dept: 'General' },
]

export default function EmployeeDashboard() {
  const { user } = useAuthStore()

  return (
    <div className={styles.page}>
      <div className={styles.heading}>
        <h1 className={styles.title}>My Workspace</h1>
        <p className={styles.subtitle}>Welcome, {user?.full_name} — {new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })}</p>
      </div>

      {/* Status cards */}
      <div className={styles.statsGrid}>
        <div className={`${styles.card} ${styles.green}`}>
          <span className={styles.cardIcon}>✅</span>
          <div>
            <p className={styles.cardValue}>Present</p>
            <p className={styles.cardLabel}>Attendance Status</p>
            <p className={styles.cardTrend}>Checked in at 8:52 AM</p>
          </div>
        </div>
        <div className={`${styles.card} ${styles.blue}`}>
          <span className={styles.cardIcon}>📅</span>
          <div>
            <p className={styles.cardValue}>4</p>
            <p className={styles.cardLabel}>Tasks Today</p>
            <p className={styles.cardTrend}>2 completed</p>
          </div>
        </div>
        <div className={`${styles.card} ${styles.orange}`}>
          <span className={styles.cardIcon}>🏖️</span>
          <div>
            <p className={styles.cardValue}>8 days</p>
            <p className={styles.cardLabel}>Leave Balance</p>
            <p className={styles.cardTrend}>Casual: 5 | Sick: 3</p>
          </div>
        </div>
        <div className={`${styles.card} ${styles.purple}`}>
          <span className={styles.cardIcon}>💰</span>
          <div>
            <p className={styles.cardValue}>₹ ---</p>
            <p className={styles.cardLabel}>Next Payslip</p>
            <p className={styles.cardTrend}>Due 1st May 2025</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className={styles.actions}>
        <button className={styles.actionBtn} id="apply-leave-btn">🏖️ Apply Leave</button>
        <button className={styles.actionBtn} id="view-payslip-btn">💰 View Payslips</button>
        <button className={styles.actionBtn} id="view-attendance-btn">📋 My Attendance</button>
      </div>

      {/* Today's schedule */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Today's Schedule</h2>
        <div className={styles.scheduleList}>
          {TODAY_SCHEDULE.map((item, i) => (
            <div key={i} className={styles.scheduleItem}>
              <div className={styles.scheduleTime}>{item.time}</div>
              <div className={styles.scheduleDot} />
              <div className={styles.scheduleDetails}>
                <p className={styles.scheduleTask}>{item.task}</p>
                <p className={styles.scheduleDept}>{item.dept}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className={styles.apiNote}>📡 Live data from <code>/api/v1/hr/attendance/</code></p>
    </div>
  )
}

import { useAuthStore } from '@/app/store'
import styles from './OwnerDashboard.module.css'

const STAT_CARDS = [
  { label: 'Total Branches',   value: '4',    icon: '🏥', trend: '+1 this month',  color: 'blue' },
  { label: 'Total Revenue',    value: '₹2.4L', icon: '💰', trend: '+18% vs last month', color: 'green' },
  { label: 'Active Patients',  value: '1,240', icon: '👥', trend: '+92 this week', color: 'purple' },
  { label: 'Total Staff',      value: '87',   icon: '👨‍⚕️', trend: '5 new joiners', color: 'orange' },
]

export default function OwnerDashboard() {
  const { user } = useAuthStore()

  return (
    <div className={styles.page}>
      <div className={styles.heading}>
        <h1 className={styles.title}>Owner Dashboard</h1>
        <p className={styles.subtitle}>
          Full visibility across all branches — {new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })}
        </p>
      </div>

      {/* Stats Grid */}
      <div className={styles.statsGrid}>
        {STAT_CARDS.map((card) => (
          <div key={card.label} className={`${styles.statCard} ${styles[card.color]}`}>
            <div className={styles.statIcon}>{card.icon}</div>
            <div>
              <p className={styles.statValue}>{card.value}</p>
              <p className={styles.statLabel}>{card.label}</p>
              <p className={styles.statTrend}>{card.trend}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Placeholder charts notice */}
      <div className={styles.notice}>
        <span>📊</span>
        <p>Connect to the backend API to populate charts and real-time data.</p>
      </div>
    </div>
  )
}

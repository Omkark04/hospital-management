import { useAuthStore } from '@/app/store'
import styles from './PatientDashboard.module.css'

const APPOINTMENTS = [
  { date: '15 Apr 2025', time: '10:30 AM', doctor: 'Dr. Reena Mehta', dept: 'Cardiology',    status: 'Confirmed' },
  { date: '22 Apr 2025', time: '02:00 PM', doctor: 'Dr. Anil Verma',  dept: 'Orthopedics',  status: 'Pending' },
  { date: '02 Mar 2025', time: '11:00 AM', doctor: 'Dr. Priya Nair',  dept: 'Dermatology',  status: 'Completed' },
]

const VITALS = [
  { label: 'Blood Pressure', value: '120/80', unit: 'mmHg',   icon: '❤️' },
  { label: 'Blood Sugar',    value: '98',      unit: 'mg/dL',  icon: '🩸' },
  { label: 'Weight',         value: '72',      unit: 'kg',     icon: '⚖️' },
  { label: 'SpO₂',           value: '98',      unit: '%',      icon: '🫁' },
]

const STATUS_CLASS: Record<string, string> = {
  Confirmed: 'statusConfirmed',
  Pending:   'statusPending',
  Completed: 'statusCompleted',
}

export default function PatientDashboard() {
  const { user } = useAuthStore()

  return (
    <div className={styles.page}>
      <div className={styles.heading}>
        <h1 className={styles.title}>My Health Portal</h1>
        <p className={styles.subtitle}>Welcome, {user?.full_name}</p>
      </div>

      {/* Vitals at a glance */}
      <h2 className={styles.sectionTitle}>Last Recorded Vitals</h2>
      <div className={styles.vitalsGrid}>
        {VITALS.map((v) => (
          <div key={v.label} className={styles.vitalCard}>
            <span className={styles.vitalIcon}>{v.icon}</span>
            <p className={styles.vitalValue}>{v.value} <small>{v.unit}</small></p>
            <p className={styles.vitalLabel}>{v.label}</p>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div className={styles.actions}>
        <button className={styles.actionBtn} id="book-appointment-patient-btn">📅 Book Appointment</button>
        <button className={styles.actionBtn} id="view-history-btn">📋 My History</button>
        <button className={styles.actionBtn} id="view-reports-btn">🧾 My Reports</button>
        <button className={styles.actionBtn} id="view-bills-btn">💳 My Bills</button>
      </div>

      {/* Appointments */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>My Appointments</h2>
        <div className={styles.appointmentList}>
          {APPOINTMENTS.map((a, i) => (
            <div key={i} className={styles.appointmentCard}>
              <div className={styles.appointmentLeft}>
                <p className={styles.apptDate}>{a.date} at {a.time}</p>
                <p className={styles.apptDoctor}>{a.doctor}</p>
                <p className={styles.apptDept}>{a.dept}</p>
              </div>
              <span className={`${styles.statusBadge} ${styles[STATUS_CLASS[a.status]]}`}>
                {a.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      <p className={styles.apiNote}>📡 Live data from <code>/api/v1/appointments/upcoming/</code></p>
    </div>
  )
}

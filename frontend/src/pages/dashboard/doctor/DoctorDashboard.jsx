import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { getPatients } from '../../../api/patients';
import { getAppointments } from '../../../api/patients';
import { getPrescriptions } from '../../../api/medicines';
import { getMyCampaigns } from '../../../api/campaigns';

function StatCard({ icon, label, value, color, link }) {
  return (
    <div className={`stat-card ${color}`}>
      <div className="stat-icon" style={{ background: `var(--${color === 'cyan' ? 'primary' : color === 'purple' ? 'secondary' : color === 'green' ? 'success' : 'warning'}-bg)` }}>{icon}</div>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value ?? '—'}</div>
      {link && <Link to={link} style={{ fontSize: '0.8rem', color: 'var(--primary)', marginTop: 8, display: 'block' }}>View all →</Link>}
    </div>
  );
}

export default function DoctorDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ patients: null, appointments: null, prescriptions: null, campaigns: null });
  const [todayAppts, setTodayAppts] = useState([]);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    Promise.allSettled([
      getPatients(),
      getAppointments({ date: today }),
      getPrescriptions(),
      getMyCampaigns(),
    ]).then(([p, a, rx, c]) => {
      setStats({
        patients: p.status === 'fulfilled' ? (p.value.data.count ?? p.value.data.length) : 0,
        appointments: a.status === 'fulfilled' ? (a.value.data.count ?? a.value.data.length) : 0,
        prescriptions: rx.status === 'fulfilled' ? (rx.value.data.count ?? rx.value.data.length) : 0,
        campaigns: c.status === 'fulfilled' ? (c.value.data.count ?? c.value.data.length) : 0,
      });
      if (a.status === 'fulfilled') {
        const list = a.value.data.results || a.value.data;
        setTodayAppts(Array.isArray(list) ? list.slice(0, 5) : []);
      }
    });
  }, []);

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h2>Welcome, Dr. {user?.full_name?.split(' ')[0] || 'Doctor'} 🩺</h2>
        <p style={{ color: 'var(--text-muted)', marginTop: 6 }}>You have {stats.appointments ?? 0} appointments today.</p>
      </div>

      <div className="stats-grid" style={{ marginBottom: 36 }}>
        <StatCard icon="🧑‍⚕️" label="My Patients" value={stats.patients} color="cyan" link="/dashboard/patients" />
        <StatCard icon="📅" label="Today's Appointments" value={stats.appointments} color="purple" link="/dashboard/appointments" />
        <StatCard icon="💊" label="Prescriptions Issued" value={stats.prescriptions} color="green" link="/dashboard/prescriptions" />
        <StatCard icon="🎯" label="Active Campaigns" value={stats.campaigns} color="orange" link="/dashboard/my-campaigns" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Today's appointments */}
        <div className="card">
          <div className="card-header">
            <h4>📅 Today's Appointments</h4>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {todayAppts.length === 0 ? (
              <div className="empty-state"><div className="icon">📅</div><p>No appointments today</p></div>
            ) : (
              <div>
                {todayAppts.map(a => (
                  <div key={a.id} style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-card)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{a.patient_name || 'Patient'}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>⏰ {a.scheduled_time} · {a.reason || 'General'}</div>
                    </div>
                    <span className={`badge badge-${a.status === 'completed' ? 'success' : a.status === 'cancelled' ? 'danger' : 'info'}`}>
                      {a.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div className="card card-body">
          <h4 style={{ marginBottom: 20, color: 'var(--primary)' }}>⚡ Quick Actions</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { icon: '🧑‍⚕️', label: 'Search Patient', to: '/dashboard/patients' },
              { icon: '💊', label: 'Write Prescription', to: '/dashboard/prescriptions' },
              { icon: '📅', label: 'View All Appointments', to: '/dashboard/appointments' },
              { icon: '🎯', label: 'Campaign Dashboard', to: '/dashboard/my-campaigns' },
            ].map(a => (
              <Link key={a.label} to={a.to} style={{ display: 'flex', gap: 14, padding: '12px 14px', borderRadius: 'var(--radius-md)', background: 'var(--bg-card)', textDecoration: 'none', alignItems: 'center', transition: 'all 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary-color)'}
              >
                <span style={{ fontSize: '1.2rem' }}>{a.icon}</span>
                <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{a.label}</span>
                <span style={{ marginLeft: 'auto', color: 'var(--primary)' }}>→</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

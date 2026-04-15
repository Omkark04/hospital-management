import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { getMyProfile, getAppointments } from '../../../api/patients';
import { getMyBills } from '../../../api/billing';

export default function PatientDashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [bills, setBills] = useState([]);

  useEffect(() => {
    Promise.allSettled([getMyProfile(), getAppointments(), getMyBills()]).then(([p, a, b]) => {
      if (p.status === 'fulfilled') setProfile(p.value.data);
      if (a.status === 'fulfilled') setAppointments((a.value.data.results || a.value.data).slice(0, 4));
      if (b.status === 'fulfilled') setBills((b.value.data.results || b.value.data).slice(0, 4));
    });
  }, []);

  const pendingBills = bills.filter(b => b.payment_status !== 'paid');
  const pendingAmount = pendingBills.reduce((sum, b) => sum + parseFloat(b.balance_due || 0), 0);

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h2>Hello, {user?.full_name?.split(' ')[0] || 'Patient'} 🧑‍⚕️</h2>
        <p style={{ color: 'var(--text-muted)', marginTop: 6 }}>Your personal health portal.</p>
      </div>

      {/* Profile summary */}
      {profile && (
        <div className="card card-body" style={{ marginBottom: 28, display: 'flex', gap: 24, alignItems: 'center' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 800, color: 'white', flexShrink: 0 }}>
            {profile.first_name?.charAt(0)}
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ marginBottom: 4 }}>{profile.first_name} {profile.last_name}</h3>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600 }}>UHID: {profile.uhid}</span>
              {profile.blood_group && <span className="badge badge-danger">{profile.blood_group}</span>}
              {profile.gender && <span className="badge badge-info">{profile.gender}</span>}
            </div>
          </div>
          <Link to="/dashboard/profile" className="btn btn-ghost btn-sm">Edit Profile</Link>
        </div>
      )}

      <div className="stats-grid" style={{ marginBottom: 36 }}>
        <div className="stat-card cyan">
          <div className="stat-icon" style={{ background: 'var(--primary-bg)' }}>📅</div>
          <div className="stat-label">Appointments</div>
          <div className="stat-value">{appointments.length}</div>
          <Link to="/dashboard/my-appointments" style={{ fontSize: '0.8rem', color: 'var(--primary)', marginTop: 8, display: 'block' }}>View all →</Link>
        </div>
        <div className="stat-card orange">
          <div className="stat-icon" style={{ background: 'var(--warning-bg)' }}>🧾</div>
          <div className="stat-label">Pending Bills</div>
          <div className="stat-value">₹{pendingAmount.toFixed(0)}</div>
          <Link to="/dashboard/my-bills" style={{ fontSize: '0.8rem', color: 'var(--warning)', marginTop: 8, display: 'block' }}>View →</Link>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Appointments */}
        <div className="card">
          <div className="card-header"><h4>📅 My Appointments</h4></div>
          <div className="card-body" style={{ padding: 0 }}>
            {appointments.length === 0 ? (
              <div className="empty-state"><div className="icon">📅</div><p>No appointments found</p></div>
            ) : (
              appointments.map(a => (
                <div key={a.id} style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-card)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{a.scheduled_date}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>⏰ {a.scheduled_time} · {a.doctor_name || 'Doctor'}</div>
                  </div>
                  <span className={`badge badge-${a.status === 'completed' ? 'success' : a.status === 'cancelled' ? 'danger' : 'info'}`}>{a.status}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Bills */}
        <div className="card">
          <div className="card-header"><h4>🧾 My Bills</h4></div>
          <div className="card-body" style={{ padding: 0 }}>
            {bills.length === 0 ? (
              <div className="empty-state"><div className="icon">🧾</div><p>No bills found</p></div>
            ) : (
              bills.map(b => (
                <div key={b.id} style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-card)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>Bill #{b.id}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>₹{b.total_amount}</div>
                  </div>
                  <span className={`badge badge-${b.payment_status === 'paid' ? 'success' : b.payment_status === 'partial' ? 'warning' : 'danger'}`}>{b.payment_status}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

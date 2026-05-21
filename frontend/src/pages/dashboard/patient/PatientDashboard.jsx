import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { getMyProfile, getAppointments } from '../../../api/patients';
import { getMyBills } from '../../../api/billing';
import { FaCalendarAlt, FaFileInvoiceDollar, FaClock, FaLink } from 'react-icons/fa';

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
        <h2>Hello, {user?.full_name?.split(' ')[0] || 'Patient'}</h2>
        <p style={{ color: 'var(--text-muted)', marginTop: 6 }}>Your personal health portal.</p>
      </div>

      <div className="stats-grid" style={{ marginBottom: 36, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24 }}>
        <div className="stat-card cyan">
          <div className="stat-icon" style={{ background: 'var(--primary-bg)' }}><FaCalendarAlt /></div>
          <div className="stat-label">Appointments</div>
          <div className="stat-value">{appointments.length}</div>
          <Link to="/dashboard/my-appointments" style={{ fontSize: '0.8rem', color: 'var(--primary)', marginTop: 8, display: 'block' }}>View all →</Link>
        </div>
        <div className="stat-card orange">
          <div className="stat-icon" style={{ background: 'var(--warning-bg)' }}><FaFileInvoiceDollar /></div>
          <div className="stat-label">Pending Bills</div>
          <div className="stat-value">₹{pendingAmount.toFixed(0)}</div>
          <Link to="/dashboard/my-bills" style={{ fontSize: '0.8rem', color: 'var(--warning)', marginTop: 8, display: 'block' }}>View →</Link>
        </div>
        <div className="stat-card green" style={{ background: 'rgba(16, 185, 129, 0.03)', border: '1px solid rgba(16, 185, 129, 0.12)' }}>
          <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.08)', color: 'var(--success)' }}><FaLink /></div>
          <div className="stat-label">Refer a Friend</div>
          <div className="stat-value" style={{ fontSize: '1.2rem', color: 'var(--success)', marginTop: 4 }}>Help someone get care</div>
          <Link to="/dashboard/referral" style={{ fontSize: '0.8rem', color: 'var(--success)', marginTop: 8, display: 'block' }}>Refer now →</Link>
        </div>
      </div>

      <div className="dashboard-panels">
        {/* Appointments */}
        <div className="card">
          <div className="card-header"><h4 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><FaCalendarAlt /> My Appointments</h4></div>
          <div className="card-body" style={{ padding: 0 }}>
            {appointments.length === 0 ? (
              <div className="empty-state"><div className="icon"><FaCalendarAlt /></div><p>No appointments found</p></div>
            ) : (
              appointments.map(a => (
                <div key={a.id} style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-card)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{a.scheduled_date}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <FaClock size={12} /> {a.scheduled_time} · {a.doctor_name || 'Doctor'}
                    </div>
                  </div>
                  <span className={`badge badge-${a.status === 'completed' ? 'success' : a.status === 'cancelled' ? 'danger' : 'info'}`}>{a.status}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Bills */}
        <div className="card">
          <div className="card-header"><h4 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><FaFileInvoiceDollar /> My Bills</h4></div>
          <div className="card-body" style={{ padding: 0 }}>
            {bills.length === 0 ? (
              <div className="empty-state"><div className="icon"><FaFileInvoiceDollar /></div><p>No bills found</p></div>
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

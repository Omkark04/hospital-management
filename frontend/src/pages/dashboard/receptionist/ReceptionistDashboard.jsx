import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { getPatients, getAppointments } from '../../../api/patients';
import { getBills } from '../../../api/billing';
import { getLeaves } from '../../../api/hr';
import { getSlotCapacity, updateSlotCapacity } from '../../../api/branches';
import { 
  FaUserInjured, FaCalendarAlt, FaFileInvoiceDollar, FaEdit, 
  FaPlusCircle, FaCheckCircle, FaLink, FaFolderOpen, FaBolt, FaClock 
} from 'react-icons/fa';

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

export default function ReceptionistDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({});
  const [pendingLeaves, setPendingLeaves] = useState([]);

  const [maxPatients, setMaxPatients] = useState(5);
  const [capacityMsg, setCapacityMsg] = useState(null);
  const [savingCapacity, setSavingCapacity] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    Promise.allSettled([
      getPatients(),
      getAppointments({ date: today }),
      getBills({ status: 'pending' }),
      getLeaves({ status: 'pending' }),
      getSlotCapacity(),
    ]).then(([p, a, b, l, cap]) => {
      setStats({
        patients: p.status === 'fulfilled' ? (p.value.data.count ?? p.value.data.length) : 0,
        appointments: a.status === 'fulfilled' ? (a.value.data.count ?? a.value.data.length) : 0,
        pendingBills: b.status === 'fulfilled' ? (b.value.data.count ?? b.value.data.length) : 0,
        pendingLeaves: l.status === 'fulfilled' ? (l.value.data.count ?? l.value.data.length) : 0,
      });
      if (l.status === 'fulfilled') {
        setPendingLeaves((l.value.data.results || l.value.data).slice(0, 4));
      }
      if (cap.status === 'fulfilled') {
        setMaxPatients(cap.value.data.max_patients_per_slot);
      }
    });
  }, []);

  const handleSaveCapacity = async (e) => {
    e.preventDefault();
    setSavingCapacity(true);
    setCapacityMsg(null);
    try {
      const res = await updateSlotCapacity({ max_patients_per_slot: maxPatients });
      setCapacityMsg({ type: 'success', text: 'Slot capacity updated successfully.' });
      setTimeout(() => setCapacityMsg(null), 4000);
    } catch (err) {
      setCapacityMsg({ type: 'error', text: err.response?.data?.detail || 'Failed to update capacity.' });
    } finally {
      setSavingCapacity(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          Good day, {user?.full_name?.split(' ')[0] || 'Receptionist'} <FaFolderOpen style={{ color: 'var(--primary)' }} />
        </h2>
        <p style={{ color: 'var(--text-muted)', marginTop: 6 }}>Today's front desk summary.</p>
      </div>

      <div className="stats-grid" style={{ marginBottom: 36 }}>
        <StatCard icon={<FaUserInjured />} label="Patients" value={stats.patients} color="cyan" link="/dashboard/patients" />
        <StatCard icon={<FaCalendarAlt />} label="Today's Appointments" value={stats.appointments} color="purple" link="/dashboard/appointments" />
        <StatCard icon={<FaFileInvoiceDollar />} label="Pending Bills" value={stats.pendingBills} color="orange" link="/dashboard/billing" />
        <StatCard icon={<FaEdit />} label="Pending Leaves" value={stats.pendingLeaves} color="red" link="/dashboard/leaves" />
      </div>

      <div className="dashboard-panels">
        {/* Quick actions */}
        <div className="card card-body">
          <h4 style={{ marginBottom: 20, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <FaBolt /> Quick Actions
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { icon: <FaPlusCircle />, label: 'Register New Patient', to: '/dashboard/patients/register' },
              { icon: <FaCalendarAlt />, label: 'Book Appointment', to: '/dashboard/appointments' },
              { icon: <FaFileInvoiceDollar />, label: 'Generate Bill', to: '/dashboard/billing' },
              { icon: <FaCheckCircle />, label: 'Mark Attendance', to: '/dashboard/attendance' },
              { icon: <FaLink />, label: 'View Referrals', to: '/dashboard/referrals' },
            ].map(a => (
              <Link key={a.label} to={a.to} style={{ display: 'flex', gap: 14, padding: '12px 14px', borderRadius: 'var(--radius-md)', background: 'var(--bg-card)', textDecoration: 'none', alignItems: 'center', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: '1.1rem', color: 'var(--primary)' }}>{a.icon}</span>
                <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{a.label}</span>
                <span style={{ marginLeft: 'auto', color: 'var(--primary)' }}>→</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="card card-body">
          <h4 style={{ marginBottom: 20, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <FaClock /> Appointment Slot Settings
          </h4>
          <form onSubmit={handleSaveCapacity}>
            <div style={{ marginBottom: 15 }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                Max Patients Per 1-Hour Time Slot:
              </label>
              <input 
                type="number"
                min="1"
                className="form-control"
                value={maxPatients}
                onChange={(e) => setMaxPatients(parseInt(e.target.value) || 1)}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 6 }}
              />
            </div>
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={savingCapacity}
              style={{ width: '100%', padding: '10px 16px', fontWeight: 600 }}
            >
              {savingCapacity ? 'Saving...' : 'Save Settings'}
            </button>
            {capacityMsg && (
              <div style={{ 
                marginTop: 10, 
                padding: '8px 12px', 
                borderRadius: 6, 
                fontSize: '0.85rem',
                background: capacityMsg.type === 'success' ? '#e6f4ea' : '#fce8e6',
                color: capacityMsg.type === 'success' ? '#137333' : '#c5221f'
              }}>
                {capacityMsg.text}
              </div>
            )}
          </form>
        </div>

        {/* Pending leaves */}
        <div className="card">
          <div className="card-header">
            <h4 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FaEdit /> Pending Leave Requests
            </h4>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {pendingLeaves.length === 0 ? (
              <div className="empty-state">
                <div className="icon"><FaCheckCircle /></div>
                <p>No pending leave requests</p>
              </div>
            ) : (
              pendingLeaves.map(l => (
                <div key={l.id} style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-card)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{l.employee_name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{l.leave_type} · {l.from_date} to {l.to_date}</div>
                  </div>
                  <Link to="/dashboard/leaves" className="btn btn-sm btn-ghost">Review</Link>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

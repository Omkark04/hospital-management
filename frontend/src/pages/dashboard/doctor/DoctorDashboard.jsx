import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { getPatients } from '../../../api/patients';
import { getAppointments } from '../../../api/patients';
import { getPrescriptions } from '../../../api/medicines';
import { getMyCampaigns } from '../../../api/campaigns';
import { getSlotCapacity, updateSlotCapacity } from '../../../api/branches';
import { FaUserInjured, FaCalendarCheck, FaPrescriptionBottleAlt, FaBullhorn, FaCalendarAlt, FaClock, FaUsers, FaStethoscope, FaBolt, FaFileInvoiceDollar, FaUserPlus } from 'react-icons/fa';
import ConsultationWorkspace from './ConsultationWorkspace';

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
  const [activeConsultation, setActiveConsultation] = useState(null);

  const [maxPatients, setMaxPatients] = useState(5);
  const [capacityMsg, setCapacityMsg] = useState(null);
  const [savingCapacity, setSavingCapacity] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    Promise.allSettled([
      getPatients(),
      getAppointments({ date: today }),
      getPrescriptions(),
      getMyCampaigns(),
      getSlotCapacity(),
    ]).then(([p, a, rx, c, cap]) => {
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
        <h2>Welcome, Dr. {user?.full_name?.split(' ')[0] || 'Doctor'} <FaStethoscope /></h2>
        <p style={{ color: 'var(--text-muted)', marginTop: 6 }}>You have {stats.appointments ?? 0} appointments today.</p>
      </div>

      <div className="stats-grid" style={{ marginBottom: 36 }}>
        <StatCard icon={<FaUserInjured />} label="My Patients" value={stats.patients} color="cyan" link="/dashboard/patients" />
        <StatCard icon={<FaCalendarCheck />} label="Today's Appointments" value={stats.appointments} color="purple" link="/dashboard/appointments" />
        <StatCard icon={<FaPrescriptionBottleAlt />} label="Prescriptions Issued" value={stats.prescriptions} color="green" link="/dashboard/prescriptions" />
        <StatCard icon={<FaBullhorn />} label="Active Campaigns" value={stats.campaigns} color="orange" link="/dashboard/my-campaigns" />
      </div>

      <div className="dashboard-panels">
        {/* Today's appointments */}
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FaCalendarAlt style={{ color: 'var(--secondary)' }} /> Today's Appointments
            </h4>
            <span style={{ fontSize: '0.75rem', background: 'var(--primary-bg)', color: 'var(--primary)', padding: '4px 10px', borderRadius: 20 }}>{todayAppts.length} total</span>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {todayAppts.length === 0 ? (
              <div className="empty-state" style={{ padding: 40 }}><div className="icon"><FaCalendarAlt /></div><p>No appointments today</p></div>
            ) : (
              <div>
                {todayAppts.map(a => (
                  <div key={a.id} style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-card)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{a.patient_name || 'Patient'}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <FaClock size={12} /> {a.scheduled_time} · {a.reason || 'General'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span className={`badge badge-${a.status === 'completed' ? 'success' : a.status === 'cancelled' ? 'danger' : 'info'}`}>
                        {a.status}
                      </span>
                      {a.status === 'scheduled' && (
                        <button 
                          onClick={() => setActiveConsultation(a)} 
                          className="btn btn-sm btn-primary"
                          style={{ padding: '4px 10px' }}
                        >
                          Start Consult
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick actions & Recent Patients */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div className="card card-body">
            <h4 style={{ marginBottom: 20, color: 'var(--primary)' }}><FaBolt /> Quick Actions</h4>
            <div className="quick-actions-grid">
              {[
                { icon: <FaUserPlus />, label: 'Register Patient', to: '/dashboard/patients/register' },
                { icon: <FaUserInjured />, label: 'My Patients', to: '/dashboard/patients' },
                { icon: <FaPrescriptionBottleAlt />, label: 'Write Rx', to: '/dashboard/prescriptions' },
                { icon: <FaCalendarAlt />, label: 'Appointments', to: '/dashboard/appointments' },
                { icon: <FaFileInvoiceDollar />, label: 'Billing', to: '/dashboard/billing' },
                { icon: <FaBullhorn />, label: 'Campaigns', to: '/dashboard/my-campaigns' },
              ].map(a => (
                <Link key={a.label} to={a.to} style={{ display: 'flex', gap: 10, padding: '12px 14px', borderRadius: 'var(--radius-md)', background: 'var(--bg-card)', border: '1px solid var(--border)', textDecoration: 'none', alignItems: 'center', transition: 'all 0.2s' }}>
                  <span style={{ fontSize: '1.1rem', color: 'var(--primary)' }}>{a.icon}</span>
                  <span style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-primary)' }}>{a.label}</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="card card-body">
            <h4 style={{ marginBottom: 20, color: 'var(--primary)' }}><FaClock /> Appointment Slot Settings</h4>
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

          <div className="card">
            <div className="card-header">
              <h4><FaUsers /> Recent Patients</h4>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              {todayAppts.length === 0 ? (
                <div className="empty-state" style={{ padding: 30 }}><p>No recent patients</p></div>
              ) : (
                <div>
                  {todayAppts.filter(a => a.status === 'completed').slice(0, 3).map(a => (
                    <div key={a.id} style={{ padding: '12px 20px', borderBottom: '1px solid var(--border-card)', display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary-bg)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem' }}>
                        {a.patient_name?.[0]}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{a.patient_name}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Last visit: Today</div>
                      </div>
                      <Link to={`/dashboard/prescriptions?patientId=${a.patient}`} style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600 }}>History →</Link>
                    </div>
                  ))}
                  <div style={{ padding: 12, textAlign: 'center' }}>
                    <Link to="/dashboard/patients" style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>View all patients</Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {activeConsultation && (
        <ConsultationWorkspace appointment={activeConsultation} onClose={() => setActiveConsultation(null)} />
      )}
    </div>
  );
}

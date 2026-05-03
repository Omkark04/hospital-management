import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { getMyAttendance, getLeaves } from '../../../api/hr';
import { getMyCampaigns } from '../../../api/campaigns';
import { FaUserCircle, FaCheckCircle, FaEdit, FaBullhorn } from 'react-icons/fa';

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const [attendance, setAttendance] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [campaigns, setCampaigns] = useState([]);

  useEffect(() => {
    Promise.allSettled([getMyAttendance(), getLeaves(), getMyCampaigns()]).then(([a, l, c]) => {
      if (a.status === 'fulfilled') setAttendance((a.value.data.results || a.value.data).slice(0, 5));
      if (l.status === 'fulfilled') setLeaves((l.value.data.results || l.value.data).slice(0, 4));
      if (c.status === 'fulfilled') setCampaigns((c.value.data.results || c.value.data).slice(0, 3));
    });
  }, []);

  const presentDays = attendance.filter(a => a.status === 'present' || a.status === 'half_day').length;

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          Hello, {user?.full_name?.split(' ')[0] || 'Employee'} <FaUserCircle style={{ color: 'var(--primary)' }} />
        </h2>
        <p style={{ color: 'var(--text-muted)', marginTop: 6 }}>Your personal workspace.</p>
      </div>

      <div className="stats-grid" style={{ marginBottom: 36 }}>
        <div className="stat-card cyan">
          <div className="stat-icon" style={{ background: 'var(--primary-bg)' }}><FaCheckCircle /></div>
          <div className="stat-label">Days Present (Recent)</div>
          <div className="stat-value">{presentDays}</div>
          <Link to="/dashboard/my-attendance" style={{ fontSize: '0.8rem', color: 'var(--primary)', marginTop: 8, display: 'block' }}>View →</Link>
        </div>
        <div className="stat-card purple">
          <div className="stat-icon" style={{ background: 'var(--secondary-bg)' }}><FaEdit /></div>
          <div className="stat-label">Leave Applications</div>
          <div className="stat-value">{leaves.length}</div>
          <Link to="/dashboard/my-leaves" style={{ fontSize: '0.8rem', color: 'var(--secondary)', marginTop: 8, display: 'block' }}>View →</Link>
        </div>
        <div className="stat-card green">
          <div className="stat-icon" style={{ background: 'var(--success-bg)' }}><FaBullhorn /></div>
          <div className="stat-label">Active Campaigns</div>
          <div className="stat-value">{campaigns.length}</div>
          <Link to="/dashboard/my-campaigns" style={{ fontSize: '0.8rem', color: 'var(--success)', marginTop: 8, display: 'block' }}>View →</Link>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Recent Attendance */}
        <div className="card">
          <div className="card-header"><h4 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><FaCheckCircle /> Recent Attendance</h4></div>
          <div className="card-body" style={{ padding: 0 }}>
            {attendance.length === 0 ? (
              <div className="empty-state"><div className="icon"><FaCheckCircle /></div><p>No records yet</p></div>
            ) : (
              attendance.map(a => (
                <div key={a.id} style={{ padding: '12px 20px', borderBottom: '1px solid var(--border-card)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.875rem' }}>{a.date}</span>
                  <span className={`badge badge-${a.status === 'present' ? 'success' : a.status === 'absent' ? 'danger' : 'warning'}`}>{a.status}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Leave Applications */}
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><FaEdit /> My Leaves</h4>
            <Link to="/dashboard/my-leaves" className="btn btn-sm btn-primary">+ Apply</Link>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {leaves.length === 0 ? (
              <div className="empty-state"><div className="icon"><FaEdit /></div><p>No leave applications</p></div>
            ) : (
              leaves.map(l => (
                <div key={l.id} style={{ padding: '12px 20px', borderBottom: '1px solid var(--border-card)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{l.leave_type}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{l.from_date} → {l.to_date}</div>
                  </div>
                  <span className={`badge badge-${l.status === 'approved' ? 'success' : l.status === 'rejected' ? 'danger' : 'warning'}`}>{l.status}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

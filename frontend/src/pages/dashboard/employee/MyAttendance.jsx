import { useState, useEffect } from 'react';
import { getMyAttendance } from '../../../api/hr';

const STATUS_COLORS = { present: 'success', absent: 'danger', half_day: 'warning', on_leave: 'info', holiday: 'secondary' };
const STATUS_ICONS = { present: '✅', absent: '❌', half_day: '🌓', on_leave: '🏖️', holiday: '🎉' };

export default function MyAttendance() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [monthFilter, setMonthFilter] = useState(() => new Date().toISOString().slice(0, 7)); // YYYY-MM

  useEffect(() => {
    setLoading(true);
    getMyAttendance()
      .then(({ data }) => {
        const all = data.results || data;
        const filtered = monthFilter
          ? all.filter(r => r.date?.startsWith(monthFilter))
          : all;
        setRecords(filtered);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [monthFilter]);

  const presentDays  = records.filter(r => r.status === 'present').length;
  const halfDays     = records.filter(r => r.status === 'half_day').length;
  const absentDays   = records.filter(r => r.status === 'absent').length;
  const leaveDays    = records.filter(r => r.status === 'on_leave').length;

  return (
    <div>
      <div className="page-header">
        <h2>My Attendance</h2>
        <p>Your personal attendance records.</p>
        <div className="page-actions">
          <input
            type="month"
            className="input"
            value={monthFilter}
            onChange={e => setMonthFilter(e.target.value)}
            style={{ maxWidth: 200 }}
          />
        </div>
      </div>

      {/* Summary stats */}
      <div className="stats-grid" style={{ marginBottom: 28 }}>
        <div className="stat-card green">
          <div className="stat-icon" style={{ background: 'var(--success-bg)' }}>✅</div>
          <div className="stat-label">Present</div>
          <div className="stat-value">{presentDays}</div>
        </div>
        <div className="stat-card orange">
          <div className="stat-icon" style={{ background: 'var(--warning-bg)' }}>🌓</div>
          <div className="stat-label">Half Days</div>
          <div className="stat-value">{halfDays}</div>
        </div>
        <div className="stat-card red">
          <div className="stat-icon" style={{ background: 'var(--danger-bg)' }}>❌</div>
          <div className="stat-label">Absent</div>
          <div className="stat-value">{absentDays}</div>
        </div>
        <div className="stat-card cyan">
          <div className="stat-icon" style={{ background: 'var(--primary-bg)' }}>🏖️</div>
          <div className="stat-label">On Leave</div>
          <div className="stat-value">{leaveDays}</div>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
        ) : records.length === 0 ? (
          <div className="empty-state"><div className="icon">✅</div><p>No records for this month.</p></div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>Date</th><th>Day</th><th>Status</th><th>Check In</th><th>Check Out</th><th>Notes</th></tr>
              </thead>
              <tbody>
                {records.sort((a, b) => b.date.localeCompare(a.date)).map(r => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 600 }}>{r.date}</td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      {new Date(r.date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short' })}
                    </td>
                    <td>
                      <span className={`badge badge-${STATUS_COLORS[r.status]}`}>
                        {STATUS_ICONS[r.status]} {r.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.875rem', color: 'var(--success)' }}>{r.check_in || '—'}</td>
                    <td style={{ fontSize: '0.875rem', color: 'var(--danger)' }}>{r.check_out || '—'}</td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{r.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Working hours summary */}
      {records.some(r => r.check_in && r.check_out) && (
        <div className="card card-body" style={{ marginTop: 20 }}>
          <h4 style={{ marginBottom: 16, color: 'var(--primary)' }}>⏱️ Working Hours Summary</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
            {records.filter(r => r.check_in && r.check_out).slice(0, 6).map(r => {
              const [h1, m1] = r.check_in.split(':').map(Number);
              const [h2, m2] = r.check_out.split(':').map(Number);
              const hours = ((h2 * 60 + m2) - (h1 * 60 + m1)) / 60;
              return (
                <div key={r.id} style={{ padding: '10px 14px', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', fontSize: '0.85rem' }}>
                  <div style={{ fontWeight: 600, marginBottom: 2 }}>{r.date}</div>
                  <div style={{ color: 'var(--primary)' }}>{hours.toFixed(1)} hrs worked</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect, useCallback } from 'react';
import { getAttendance, getEmployees, closeDay } from '../../../api/hr';
import { useAuth } from '../../../context/AuthContext';
import { FaClipboardList, FaCheckCircle, FaFlag } from 'react-icons/fa';

const STATUS_COLORS = {
  present: 'success',
  absent: 'danger',
  half_day: 'warning',
  on_leave: 'info',
  holiday: 'secondary',
};

export default function AttendanceList() {
  const [records, setRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [employeeFilter, setEmployeeFilter] = useState('');
  const [closing, setClosing] = useState(false);
  const { user } = useAuth();
  
  const today = new Date().toISOString().split('T')[0];

  const fetchData = useCallback(() => {
    setLoading(true);
    const params = {};
    if (startDate) params.date_from = startDate;
    if (endDate) params.date_to = endDate;
    if (!startDate && !endDate) params.date = today; // default to today if no range selected
    if (employeeFilter) params.employee = employeeFilter;

    getAttendance(params)
      .then(({ data }) => setRecords(data.results || data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [startDate, endDate, employeeFilter, today]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Load employee list for filter dropdown
  useEffect(() => {
    getEmployees()
      .then(({ data }) => setEmployees(data.results || data))
      .catch(() => {});
  }, []);

  const summary = ['present', 'absent', 'half_day', 'on_leave', 'holiday'].map(s => ({
    key: s,
    count: records.filter(r => r.status === s).length,
  }));

  const handleCloseDay = async () => {
    const targetDate = startDate || today;
    if (!window.confirm(`Are you sure you want to close attendance for ${targetDate}? This will mark non-scanned employees as Absent and auto-checkout open records.`)) return;
    setClosing(true);
    try {
      const res = await closeDay(targetDate);
      alert(res.data.message);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to close day.');
    } finally {
      setClosing(false);
    }
  };

  const flaggedCount = records.filter(r => r.is_flagged).length;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Attendance Log</h2>
          <p>View employee check-ins and check-outs. Attendance is marked via QR scan.</p>
        </div>
        <div className="page-actions" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted, #666)' }}>From:</span>
            <input type="date" className="input" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ maxWidth: 130 }} />
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted, #666)' }}>To:</span>
            <input type="date" className="input" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ maxWidth: 130 }} />
          </div>
          
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {[
              { label: 'Today', days: 0 },
              { label: '7d', days: 7 },
              { label: '15d', days: 15 },
              { label: '30d', days: 30 },
            ].map(opt => {
              const cutoff = opt.days > 0 ? new Date(Date.now() - opt.days * 86400000).toISOString().split('T')[0] : today;
              const isActive = (startDate === cutoff && endDate === today) || (opt.days === 0 && !startDate && !endDate);
              return (
                <button
                  key={opt.label}
                  type="button"
                  className={`btn btn-sm ${isActive ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => {
                    if (opt.days === 0) { setStartDate(''); setEndDate(''); } // default implies today
                    else { setStartDate(cutoff); setEndDate(today); }
                  }}
                  style={{ padding: '6px 12px', minWidth: opt.label.length <= 3 ? '40px' : 'auto' }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          <select className="input" value={employeeFilter} onChange={e => setEmployeeFilter(e.target.value)} style={{ maxWidth: 220 }}>
            <option value="">All Employees</option>
            {employees.map(e => <option key={e.id} value={e.id}>{e.full_name} — {e.designation}</option>)}
          </select>

          {(user?.role === 'owner' || user?.role === 'doctor') && (
            <button className="btn btn-outline" onClick={handleCloseDay} disabled={closing}>
              {closing ? 'Closing...' : 'Close Day'}
            </button>
          )}
        </div>
      </div>

      {/* Summary chips */}
      <div style={{ marginBottom: 20, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {summary.map(s => (
          <div key={s.key} className="card" style={{ padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 10, borderRadius: 12 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: `var(--${STATUS_COLORS[s.key]})` }} />
            <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>
              {s.count} {s.key.replace('_', ' ')}
            </div>
          </div>
        ))}
        {flaggedCount > 0 && (
          <div className="card" style={{ padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 8, borderRadius: 12, background: 'var(--warning-bg)', border: '1px solid var(--warning)' }}>
            <FaFlag style={{ color: 'var(--warning)', fontSize: '0.9rem' }} />
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--warning)' }}>
              {flaggedCount} flagged (out of geofence)
            </div>
          </div>
        )}
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div className="spinner" style={{ margin: '0 auto' }} />
          </div>
        ) : records.length === 0 ? (
          <div className="empty-state" style={{ padding: 60 }}>
            <div className="icon" style={{ fontSize: '3rem', marginBottom: 16, color: 'var(--primary)' }}>
              <FaClipboardList />
            </div>
            <h3>No attendance records</h3>
            <p style={{ color: 'var(--text-muted)' }}>
              No records found for {startDate && endDate ? `${startDate} to ${endDate}` : startDate || endDate || today}. Attendance is logged automatically when staff scan the QR kiosk.
            </p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Status</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Marked By</th>
                  <th>Location</th>
                </tr>
              </thead>
              <tbody>
                {records.map(r => (
                  <tr key={r.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{r.employee_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{r.employee_designation}</div>
                    </td>
                    <td>
                      <span className={`badge badge-${STATUS_COLORS[r.status]}`}>
                        {r.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ fontWeight: 500, color: 'var(--success)' }}>{r.check_in || '—'}</td>
                    <td style={{ fontWeight: 500, color: 'var(--danger)' }}>{r.check_out || '—'}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {r.marked_by_name || 'QR Scan'}
                    </td>
                    <td>
                      {r.is_flagged ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--warning)', fontSize: '0.8rem', fontWeight: 600 }}>
                          <FaFlag /> Out of range
                        </span>
                      ) : r.recorded_lat ? (
                        <span style={{ fontSize: '0.75rem', color: 'var(--success)' }}>✓ Verified</span>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

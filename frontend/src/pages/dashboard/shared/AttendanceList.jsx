import { useState, useEffect, useCallback } from 'react';
import { getAttendance, markAttendance, updateAttendance } from '../../../api/hr';
import { getEmployees } from '../../../api/hr';

const STATUS_COLORS = { present: 'success', absent: 'danger', half_day: 'warning', on_leave: 'info', holiday: 'secondary' };

export default function AttendanceList() {
  const [records, setRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ employee: '', date: '', status: 'present', check_in: '', check_out: '' });
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(() => {
    setLoading(true);
    getAttendance({ date })
      .then(({ data }) => setRecords(data.results || data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [date]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openBulkMark = () => {
    getEmployees().then(({ data }) => setEmployees(data.results || data));
    setForm({ employee: '', date, status: 'present', check_in: '', check_out: '' });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await markAttendance(form);
      setShowModal(false);
      fetchData();
    } catch (err) { alert(err.response?.data?.non_field_errors?.[0] || JSON.stringify(err.response?.data) || 'Failed.'); }
    finally { setSaving(false); }
  };

  const quickUpdate = async (id, status) => {
    try { await updateAttendance(id, { status }); fetchData(); } catch { alert('Failed.'); }
  };

  return (
    <div>
      <div className="page-header">
        <h2>Attendance</h2>
        <p>Daily employee attendance records.</p>
        <div className="page-actions">
          <input type="date" className="input" value={date} onChange={e => setDate(e.target.value)} style={{ maxWidth: 200 }} />
          <button className="btn btn-primary" onClick={openBulkMark}>+ Mark Attendance</button>
        </div>
      </div>

      <div style={{ marginBottom: 16, display: 'flex', gap: 12 }}>
        {['present', 'absent', 'half_day', 'on_leave', 'holiday'].map(s => (
          <span key={s} className={`badge badge-${STATUS_COLORS[s]}`} style={{ fontSize: '0.8rem', padding: '4px 12px' }}>
            {records.filter(r => r.status === s).length} {s.replace('_', ' ')}
          </span>
        ))}
      </div>

      <div className="card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
        ) : records.length === 0 ? (
          <div className="empty-state"><div className="icon">✅</div><p>No attendance records for {date}.</p></div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>Employee</th><th>Date</th><th>Status</th><th>Check In</th><th>Check Out</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {records.map(r => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 600 }}>{r.employee_name || `Employee #${r.employee}`}</td>
                    <td style={{ fontSize: '0.875rem' }}>{r.date}</td>
                    <td><span className={`badge badge-${STATUS_COLORS[r.status]}`}>{r.status.replace('_', ' ')}</span></td>
                    <td style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{r.check_in || '—'}</td>
                    <td style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{r.check_out || '—'}</td>
                    <td>
                      {r.status !== 'present' && (
                        <button className="btn btn-success btn-sm" onClick={() => quickUpdate(r.id, 'present')}>✓ Present</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Mark Attendance</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Employee *</label>
                  <select className="input" required value={form.employee} onChange={e => setForm(p => ({ ...p, employee: e.target.value }))}>
                    <option value="">Select employee...</option>
                    {employees.map(e => <option key={e.id} value={e.id}>{e.full_name} — {e.designation}</option>)}
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div className="form-group">
                    <label className="form-label">Date *</label>
                    <input type="date" className="input" required value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Status *</label>
                    <select className="input" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                      <option value="present">Present</option>
                      <option value="absent">Absent</option>
                      <option value="half_day">Half Day</option>
                      <option value="on_leave">On Leave</option>
                      <option value="holiday">Holiday</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Check In</label>
                    <input type="time" className="input" value={form.check_in} onChange={e => setForm(p => ({ ...p, check_in: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Check Out</label>
                    <input type="time" className="input" value={form.check_out} onChange={e => setForm(p => ({ ...p, check_out: e.target.value }))} />
                  </div>
                </div>
                <div className="modal-footer" style={{ padding: 0, border: 'none' }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Mark Attendance'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

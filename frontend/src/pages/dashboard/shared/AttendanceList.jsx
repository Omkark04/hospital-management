import { useState, useEffect, useCallback } from 'react';
import { getAttendance, markAttendance, updateAttendance } from '../../../api/hr';
import { getEmployees } from '../../../api/hr';
import { FaClipboardList, FaCheckCircle, FaUserClock } from 'react-icons/fa';

const STATUS_COLORS = { present: 'success', absent: 'danger', half_day: 'warning', on_leave: 'info', holiday: 'secondary' };

export default function AttendanceList() {
  const [records, setRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [showModal, setShowModal] = useState(false);
  const [bulkRows, setBulkRows] = useState([]);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(() => {
    setLoading(true);
    getAttendance({ date })
      .then(({ data }) => setRecords(data.results || data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [date]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openBulkMark = async () => {
    setLoading(true);
    try {
      const { data } = await getEmployees();
      const emps = data.results || data;
      // Filter out employees who already have attendance for this date?
      // User says "modifiable for that day only", so maybe just show all and let them update.
      const rows = emps.map(e => {
        const existing = records.find(r => r.employee === e.id);
        return {
          employee: e.id,
          name: e.full_name,
          designation: e.designation,
          status: existing?.status || 'present',
          check_in: existing?.check_in || '09:00',
          check_out: existing?.check_out || '19:00',
          existing_id: existing?.id
        };
      });
      setBulkRows(rows);
      setShowModal(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateRow = (index, field, value) => {
    const newRows = [...bulkRows];
    newRows[index][field] = value;
    setBulkRows(newRows);
  };

  const handleBulkSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const promises = bulkRows.map(row => {
        const payload = {
          employee: row.employee,
          date: date,
          status: row.status,
          check_in: row.status === 'present' ? row.check_in : null,
          check_out: row.status === 'present' ? row.check_out : null
        };
        if (row.existing_id) {
          return updateAttendance(row.existing_id, payload);
        } else {
          return markAttendance(payload);
        }
      });
      await Promise.all(promises);
      setShowModal(false);
      fetchData();
    } catch (err) {
      alert('Some records failed to save. Please check and try again.');
    } finally {
      setSaving(false);
    }
  };

  const quickUpdate = async (id, status) => {
    try { await updateAttendance(id, { status }); fetchData(); } catch { alert('Failed.'); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Daily Attendance</h2>
          <p>Manage employee check-ins and check-outs for {date}.</p>
        </div>
        <div className="page-actions" style={{ display: 'flex', gap: 12 }}>
          <input type="date" className="input" value={date} onChange={e => setDate(e.target.value)} style={{ maxWidth: 160 }} />
          <button className="btn btn-primary" onClick={openBulkMark}>Mark Daily Attendance</button>
        </div>
      </div>

      <div style={{ marginBottom: 20, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {['present', 'absent', 'half_day', 'on_leave', 'holiday'].map(s => (
          <div key={s} className="card" style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 10, borderRadius: 12 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: `var(--${STATUS_COLORS[s]})` }} />
            <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>
              {records.filter(r => r.status === s).length} {s.replace('_', ' ')}
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
        ) : records.length === 0 ? (
          <div className="empty-state" style={{ padding: 60 }}>
            <div className="icon" style={{ fontSize: '3rem', marginBottom: 16, color: 'var(--primary)' }}><FaClipboardList /></div>
            <h3>No records for today</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>Ready to mark attendance for all employees?</p>
            <button className="btn btn-primary" onClick={openBulkMark}>Start Marking Attendance</button>
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
                </tr>
              </thead>
              <tbody>
                {records.map(r => (
                  <tr key={r.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{r.employee_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{r.employee_designation}</div>
                    </td>
                    <td><span className={`badge badge-${STATUS_COLORS[r.status]}`}>{r.status.replace('_', ' ')}</span></td>
                    <td style={{ fontWeight: 500 }}>{r.check_in || '--:--'}</td>
                    <td style={{ fontWeight: 500 }}>{r.check_out || '--:--'}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{r.marked_by_name || 'System'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 900, width: '95%' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>Mark Daily Attendance</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4 }}>Date: {date} | Default Shift: 09:00 - 19:00</p>
              </div>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto', padding: 0 }}>
              <form onSubmit={handleBulkSave}>
                <div className="table-wrapper">
                  <table className="table-compact">
                    <thead>
                      <tr>
                        <th>Employee</th>
                        <th style={{ width: 100, textAlign: 'center' }}>Present</th>
                        <th style={{ width: 100, textAlign: 'center' }}>Absent</th>
                        <th>Check In</th>
                        <th>Check Out</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bulkRows.map((row, idx) => (
                        <tr key={row.employee}>
                          <td>
                            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{row.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{row.designation}</div>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <input 
                              type="checkbox" 
                              checked={row.status === 'present'} 
                              onChange={() => updateRow(idx, 'status', 'present')}
                              style={{ width: 20, height: 20, cursor: 'pointer' }}
                            />
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <input 
                              type="checkbox" 
                              checked={row.status === 'absent'} 
                              onChange={() => updateRow(idx, 'status', 'absent')}
                              style={{ width: 20, height: 20, cursor: 'pointer' }}
                            />
                          </td>
                          <td>
                            <input 
                              type="time" 
                              className="input input-sm" 
                              disabled={row.status !== 'present'}
                              value={row.check_in} 
                              onChange={e => updateRow(idx, 'check_in', e.target.value)} 
                            />
                          </td>
                          <td>
                            <input 
                              type="time" 
                              className="input input-sm" 
                              disabled={row.status !== 'present'}
                              value={row.check_out} 
                              onChange={e => updateRow(idx, 'check_out', e.target.value)} 
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="modal-footer" style={{ background: 'var(--off-white)', position: 'sticky', bottom: 0, zIndex: 10 }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {bulkRows.filter(r => r.status === 'present').length} Present, {bulkRows.filter(r => r.status === 'absent').length} Absent
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                      {saving ? 'Saving...' : 'Save All Records'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

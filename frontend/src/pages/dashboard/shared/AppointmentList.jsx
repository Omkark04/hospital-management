import { useState, useEffect, useCallback } from 'react';
import { getAppointments, createAppointment, updateAppointment } from '../../../api/patients';
import { getPatients } from '../../../api/patients';
import { useAuth } from '../../../context/AuthContext';

const STATUS_COLORS = { scheduled: 'info', completed: 'success', cancelled: 'danger', rescheduled: 'warning', no_show: 'danger' };

export default function AppointmentList() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [patients, setPatients] = useState([]);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ patient: '', scheduled_date: '', scheduled_time: '', reason: '', branch: user?.branch_id || '' });
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(() => {
    setLoading(true);
    getAppointments({ date: filterDate || undefined })
      .then(({ data }) => setAppointments(data.results || data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filterDate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openNew = () => {
    setEditItem(null);
    setForm({ patient: '', scheduled_date: '', scheduled_time: '', reason: '', branch: user?.branch_id || '' });
    if (!patients.length) getPatients().then(({ data }) => setPatients(data.results || data));
    setShowModal(true);
  };

  const openEdit = (a) => {
    setEditItem(a);
    setForm({ patient: a.patient, scheduled_date: a.scheduled_date, scheduled_time: a.scheduled_time, reason: a.reason, branch: a.branch });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editItem) await updateAppointment(editItem.id, form);
      else await createAppointment(form);
      setShowModal(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || JSON.stringify(err.response?.data) || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (id, status) => {
    try { await updateAppointment(id, { status }); fetchData(); }
    catch { alert('Failed to update status.'); }
  };

  return (
    <div>
      <div className="page-header">
        <h2>Appointments</h2>
        <p>Manage patient appointments.</p>
        <div className="page-actions">
          <input type="date" className="input" value={filterDate} onChange={e => setFilterDate(e.target.value)} style={{ maxWidth: 200 }} />
          {filterDate && <button className="btn btn-ghost btn-sm" onClick={() => setFilterDate('')}>Clear</button>}
          <button className="btn btn-primary" onClick={openNew}>+ New Appointment</button>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
        ) : appointments.length === 0 ? (
          <div className="empty-state"><div className="icon">📅</div><p>No appointments found.</p></div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>Patient</th><th>Doctor</th><th>Date & Time</th><th>Reason</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {appointments.map(a => (
                  <tr key={a.id}>
                    <td style={{ fontWeight: 600 }}>{a.patient_name || `Patient #${a.patient}`}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{a.doctor_name || '—'}</td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{a.scheduled_date}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{a.scheduled_time}</div>
                    </td>
                    <td style={{ fontSize: '0.875rem', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.reason || '—'}</td>
                    <td><span className={`badge badge-${STATUS_COLORS[a.status] || 'primary'}`}>{a.status}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(a)}>Edit</button>
                        {a.status === 'scheduled' && (
                          <button className="btn btn-success btn-sm" onClick={() => updateStatus(a.id, 'completed')}>✓ Done</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editItem ? 'Edit Appointment' : 'New Appointment'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Patient *</label>
                  <select className="input" required value={form.patient} onChange={e => setForm(p => ({ ...p, patient: e.target.value }))}>
                    <option value="">Select patient...</option>
                    {patients.map(p => <option key={p.id} value={p.id}>{p.first_name} {p.last_name} ({p.uhid})</option>)}
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="form-group">
                    <label className="form-label">Date *</label>
                    <input type="date" className="input" required value={form.scheduled_date} onChange={e => setForm(p => ({ ...p, scheduled_date: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Time *</label>
                    <input type="time" className="input" required value={form.scheduled_time} onChange={e => setForm(p => ({ ...p, scheduled_time: e.target.value }))} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Reason</label>
                  <input className="input" value={form.reason} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))} placeholder="Reason for visit" />
                </div>
                <div className="modal-footer" style={{ padding: 0, border: 'none' }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Appointment'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

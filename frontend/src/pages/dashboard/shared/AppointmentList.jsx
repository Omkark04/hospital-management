import { useState, useEffect, useCallback } from 'react';
import { getAppointments, createAppointment, updateAppointment, getMyProfile } from '../../../api/patients';
import { getPatients } from '../../../api/patients';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../api/axios';
import { FaCalendarAlt, FaPlus, FaCheck, FaEdit, FaClock, FaTimes } from 'react-icons/fa';

const STATUS_COLORS = { scheduled: 'info', completed: 'success', cancelled: 'danger', rescheduled: 'warning', no_show: 'danger' };

export default function AppointmentList() {
  const { user } = useAuth();
  const isPatient = user?.role === 'patient';

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [patients, setPatients] = useState([]);
  const [editItem, setEditItem] = useState(null);
  const [myPatientId, setMyPatientId] = useState(null);
  const [form, setForm] = useState({ patient: '', scheduled_date: '', scheduled_time: '', reason: '', branch: user?.branch_id || '' });
  const [saving, setSaving] = useState(false);

  const [branches, setBranches] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // For patient role: load their own patient record ID
  useEffect(() => {
    if (isPatient) {
      getMyProfile()
        .then(({ data }) => setMyPatientId(data.id))
        .catch(console.error);
    }
  }, [isPatient]);

  // Fetch branches on mount
  useEffect(() => {
    api.get('/branches/public/')
      .then(({ data }) => setBranches(data.results || data))
      .catch(console.error);
  }, []);

  // Fetch available slots when branch or scheduled_date changes
  useEffect(() => {
    if (form.scheduled_date && form.branch) {
      setLoadingSlots(true);
      api.get(`/patients/public/available-slots/?date=${form.scheduled_date}&branch=${form.branch}`)
        .then(res => {
          setAvailableSlots(res.data.slots || []);
        })
        .catch(err => {
          console.error(err);
          setAvailableSlots([]);
        })
        .finally(() => setLoadingSlots(false));
    } else {
      setAvailableSlots([]);
    }
  }, [form.scheduled_date, form.branch]);

  const fetchData = useCallback(() => {
    setLoading(true);
    getAppointments({ date: filterDate || undefined })
      .then(({ data }) => setAppointments(data.results || data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filterDate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const ensurePatientsLoaded = () => {
    // ONLY call for staff — patients never need the full patient list
    if (user?.role && user.role !== 'patient' && !patients.length) {
      getPatients().then(({ data }) => setPatients(data.results || data)).catch(console.error);
    }
  };

  const openNew = () => {
    setEditItem(null);
    setForm({
      patient: isPatient ? myPatientId : '',
      scheduled_date: '',
      scheduled_time: '',
      reason: '',
      branch: user?.branch_id || ''
    });
    if (!isPatient) ensurePatientsLoaded();  // only staff load patient list
    setShowModal(true);
  };

  const openEdit = (a) => {
    setEditItem(a);
    setForm({ patient: a.patient, scheduled_date: a.scheduled_date, scheduled_time: a.scheduled_time, reason: a.reason, branch: a.branch });
    if (!isPatient) ensurePatientsLoaded();
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.scheduled_time) {
      alert("Please select an available 1-hour time slot.");
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form, patient: isPatient ? myPatientId : form.patient };
      if (editItem) await updateAppointment(editItem.id, payload);
      else await createAppointment(payload);
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
        <p>{isPatient ? 'Book and manage your appointments.' : 'Manage patient appointments.'}</p>
        <div className="page-actions">
          <input type="date" className="input" value={filterDate} onChange={e => setFilterDate(e.target.value)} style={{ maxWidth: 200 }} />
          {filterDate && <button className="btn btn-ghost btn-sm" onClick={() => setFilterDate('')}>Clear</button>}
          <button className="btn btn-primary" onClick={openNew} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <FaPlus /> Book Appointment
          </button>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
        ) : appointments.length === 0 ? (
          <div className="empty-state">
            <div className="icon" style={{ color: 'var(--primary)' }}><FaCalendarAlt /></div>
            <p>{isPatient ? 'No appointments booked yet.' : 'No appointments found.'}</p>
            {isPatient && (
              <button className="btn btn-primary btn-sm" onClick={openNew} style={{ marginTop: 12 }}>
                Book Your First Appointment
              </button>
            )}
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  {!isPatient && <th>Patient</th>}
                  <th>Date & Time</th>
                  <th>Doctor</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map(a => (
                  <tr key={a.id}>
                    {!isPatient && <td style={{ fontWeight: 600 }}>{a.patient_name || `Patient #${a.patient}`}</td>}
                    <td>
                      <div style={{ fontWeight: 500 }}>{a.scheduled_date}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <FaClock size={11} /> {a.scheduled_time}
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{a.doctor_name || '—'}</td>
                    <td style={{ fontSize: '0.875rem', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.reason || '—'}</td>
                    <td><span className={`badge badge-${STATUS_COLORS[a.status] || 'primary'}`}>{a.status}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {isPatient ? (
                          // Patient can only cancel scheduled appointments
                          a.status === 'scheduled' && (
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => updateStatus(a.id, 'cancelled')}
                              style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                            >
                              <FaTimes size={11} /> Cancel
                            </button>
                          )
                        ) : (
                          // Staff can edit and mark complete
                          <>
                            <button className="btn btn-ghost btn-sm" onClick={() => openEdit(a)} title="Edit">
                              <FaEdit />
                            </button>
                            {a.status === 'scheduled' && (
                              <button className="btn btn-success btn-sm" onClick={() => updateStatus(a.id, 'completed')} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <FaCheck /> Done
                              </button>
                            )}
                          </>
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
              <h3>{editItem ? 'Reschedule Appointment' : 'Book Appointment'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Patient selector — only for staff */}
                {!isPatient && (
                  <div className="form-group">
                    <label className="form-label">Patient *</label>
                    <select
                      className="input"
                      required
                      value={form.patient}
                      onChange={e => {
                        const pId = e.target.value;
                        const selectedPatient = patients.find(p => p.id === parseInt(pId));
                        setForm(prev => ({
                          ...prev,
                          patient: pId,
                          branch: selectedPatient?.branch || prev.branch
                        }));
                      }}
                    >
                      <option value="">Select patient...</option>
                      {patients.map(p => <option key={p.id} value={p.id}>{p.first_name} {p.last_name} ({p.uhid})</option>)}
                    </select>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Branch *</label>
                  <select
                    className="input"
                    required
                    value={form.branch}
                    onChange={e => setForm(p => ({ ...p, branch: e.target.value, scheduled_time: '' }))}
                  >
                    <option value="">Select Branch...</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Preferred Date *</label>
                  <input
                    type="date"
                    className="input"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={form.scheduled_date}
                    onChange={e => setForm(p => ({ ...p, scheduled_date: e.target.value, scheduled_time: '' }))}
                  />
                </div>

                {form.scheduled_date && form.branch && (
                  <div className="form-group">
                    <label className="form-label">Available Slots *</label>
                    {loadingSlots ? (
                      <div style={{ padding: 10, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Checking availability...</div>
                    ) : availableSlots.length === 0 ? (
                      <div style={{ padding: 10, textAlign: 'center', color: 'var(--text-muted)', background: 'var(--off-white)', borderRadius: 8, fontSize: '0.85rem' }}>
                        No slots available on this date. Please choose another date.
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10, maxHeight: '200px', overflowY: 'auto', padding: '4px' }}>
                        {availableSlots.map(slot => {
                          const isSelected = form.scheduled_time === slot.time;
                          const isFull = slot.available_capacity <= 0;
                          return (
                            <div 
                              key={slot.time}
                              onClick={() => !isFull && setForm(f => ({ ...f, scheduled_time: slot.time }))}
                              style={{
                                padding: '10px',
                                borderRadius: 8,
                                cursor: isFull ? 'not-allowed' : 'pointer',
                                border: isSelected 
                                  ? '2px solid var(--moss)' 
                                  : isFull 
                                    ? '1px dashed var(--border)' 
                                    : '1px solid var(--border)',
                                background: isSelected 
                                  ? 'rgba(5, 150, 105, 0.05)' 
                                  : isFull 
                                    ? '#fafafa' 
                                    : '#fff',
                                opacity: isFull ? 0.6 : 1,
                                transition: 'all 0.2s',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 4
                              }}
                            >
                              <div style={{ fontWeight: 700, fontSize: '0.85rem', color: isSelected ? 'var(--moss)' : isFull ? 'var(--text-muted)' : 'var(--navy)' }}>
                                {slot.label}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                                <span>{slot.day}</span>
                                <span>{slot.date}</span>
                              </div>
                              <div style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center', 
                                marginTop: 4, 
                                paddingTop: 4, 
                                borderTop: '1px solid var(--border)',
                                fontSize: '0.75rem' 
                              }}>
                                <span style={{ color: 'var(--text-secondary)' }}>
                                  {slot.patient_count} Booked
                                </span>
                                <span style={{ 
                                  fontWeight: 600, 
                                  color: isFull ? 'var(--danger)' : 'var(--success)'
                                }}>
                                  {isFull ? 'Full' : `${slot.available_capacity} Left`}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Reason for Visit</label>
                  <input
                    className="input"
                    value={form.reason}
                    onChange={e => setForm(p => ({ ...p, reason: e.target.value }))}
                    placeholder={isPatient ? 'e.g. Back pain, Follow-up, Consultation...' : 'Reason for visit'}
                  />
                </div>

                <div className="modal-footer" style={{ padding: 0, border: 'none' }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? 'Saving...' : editItem ? 'Update Appointment' : 'Book Appointment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

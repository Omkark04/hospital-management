import { useState, useEffect, useCallback } from 'react';
import { getPrescriptions } from '../../../api/medicines';
import { getPatients } from '../../../api/patients';
import { getMedicines } from '../../../api/medicines';
import { createPrescription } from '../../../api/medicines';
import { useAuth } from '../../../context/AuthContext';

export default function PrescriptionList() {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [patients, setPatients] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [form, setForm] = useState({ patient: '', notes: '', items: [{ medicine: '', dosage: '', duration: '', instructions: '', quantity: 1 }] });
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    getPrescriptions()
      .then(({ data }) => setPrescriptions(data.results || data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openNew = () => {
    setForm({ patient: '', notes: '', items: [{ medicine: '', dosage: '', duration: '', instructions: '', quantity: 1 }] });
    Promise.all([getPatients(), getMedicines()])
      .then(([p, m]) => {
        setPatients(p.data.results || p.data);
        setMedicines(m.data.results || m.data);
      });
    setShowModal(true);
  };

  const addItem = () => setForm(p => ({ ...p, items: [...p.items, { medicine: '', dosage: '', duration: '', instructions: '', quantity: 1 }] }));
  const removeItem = (i) => setForm(p => ({ ...p, items: p.items.filter((_, idx) => idx !== i) }));
  const updateItem = (i, field, val) => setForm(p => {
    const items = [...p.items];
    items[i] = { ...items[i], [field]: val };
    return { ...p, items };
  });

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createPrescription(form);
      setShowModal(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || JSON.stringify(err.response?.data) || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>Prescriptions</h2>
        <p>Patient prescriptions and medicines.</p>
        <div className="page-actions">
          {user?.role === 'doctor' && <button className="btn btn-primary" onClick={openNew}>+ New Prescription</button>}
        </div>
      </div>

      {/* List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
        ) : prescriptions.length === 0 ? (
          <div className="empty-state card card-body"><div className="icon">💊</div><p>No prescriptions yet.</p></div>
        ) : (
          prescriptions.map(rx => (
            <div key={rx.id} className="card card-body" style={{ cursor: 'pointer' }} onClick={() => setSelected(selected?.id === rx.id ? null : rx)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>{rx.patient_name || `Patient #${rx.patient}`}</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>UHID: {rx.patient_uhid} · Dr. {rx.doctor_name} · {rx.created_at?.split('T')[0]}</div>
                </div>
                <span className="badge badge-primary">{rx.items?.length || 0} medicines</span>
              </div>

              {selected?.id === rx.id && rx.items?.length > 0 && (
                <div style={{ marginTop: 16, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Medicines</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {rx.items.map((item, i) => (
                      <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 2fr', gap: 12, padding: '10px 12px', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', fontSize: '0.875rem' }}>
                        <div><span style={{ color: 'var(--primary)', fontWeight: 600 }}>💊 {item.medicine_name}</span></div>
                        <div><span style={{ color: 'var(--text-muted)' }}>Dosage:</span> {item.dosage}</div>
                        <div><span style={{ color: 'var(--text-muted)' }}>Duration:</span> {item.duration}</div>
                        <div style={{ color: 'var(--text-muted)' }}>{item.instructions}</div>
                      </div>
                    ))}
                  </div>
                  {rx.notes && <p style={{ marginTop: 10, fontSize: '0.875rem' }}>📝 {rx.notes}</p>}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* New Prescription Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 680 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>New Prescription</h3>
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

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center' }}>💊 Medicines *</label>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={addItem}>+ Add</button>
                  </div>
                  {form.items.map((item, i) => (
                    <div key={i} style={{ background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', padding: 14, marginBottom: 10 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10, marginBottom: 8 }}>
                        <div className="form-group">
                          <label className="form-label">Medicine</label>
                          <select className="input" value={item.medicine} onChange={e => updateItem(i, 'medicine', e.target.value)}>
                            <option value="">Select...</option>
                            {medicines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                          </select>
                        </div>
                        <div className="form-group">
                          <label className="form-label">Quantity</label>
                          <input type="number" min={1} className="input" value={item.quantity} onChange={e => updateItem(i, 'quantity', e.target.value)} />
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <div className="form-group">
                          <label className="form-label">Dosage</label>
                          <input className="input" value={item.dosage} onChange={e => updateItem(i, 'dosage', e.target.value)} placeholder="e.g. 1-0-1" />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Duration</label>
                          <input className="input" value={item.duration} onChange={e => updateItem(i, 'duration', e.target.value)} placeholder="e.g. 5 days" />
                        </div>
                      </div>
                      {form.items.length > 1 && (
                        <button type="button" className="btn btn-danger btn-sm" onClick={() => removeItem(i)} style={{ marginTop: 8 }}>Remove</button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="form-group">
                  <label className="form-label">Doctor's Notes</label>
                  <textarea className="input" rows={2} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Additional notes..." />
                </div>

                <div className="modal-footer" style={{ padding: 0, border: 'none' }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Prescription'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

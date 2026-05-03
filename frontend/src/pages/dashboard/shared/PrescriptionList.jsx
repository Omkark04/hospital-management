import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getPrescriptions } from '../../../api/medicines';
import { getPatients } from '../../../api/patients';
import { getMedicines } from '../../../api/medicines';
import { createPrescription } from '../../../api/medicines';
import { getPrescriptionProducts } from '../../../api/products';
import { useAuth } from '../../../context/AuthContext';

export default function PrescriptionList() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [patients, setPatients] = useState([]);
  const [availableItems, setAvailableItems] = useState([]);
  const [form, setForm] = useState({ patient: '', appointment: '', notes: '', items: [{ medicine: '', product: '', dosage: '', duration: '', instructions: '', quantity: 1 }] });
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState(null);

  // Parse query params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const pId = params.get('patientId');
    const aId = params.get('appointmentId');
    if (pId) {
      setForm(prev => ({ ...prev, patient: pId, appointment: aId || null }));
      Promise.all([getPatients(), getMedicines(), getPrescriptionProducts()])
        .then(([p, m, pr]) => {
          setPatients(p.data.results || p.data);
          const meds = (m.data.results || m.data).map(x => ({ ...x, type: 'medicine' }));
          const prods = (pr.data.results || pr.data).map(x => ({ ...x, type: 'product' }));
          setAvailableItems([...meds, ...prods]);
          setShowModal(true);
        });
    }
  }, [location.search]);

  const fetchData = useCallback(() => {
    setLoading(true);
    getPrescriptions()
      .then(({ data }) => setPrescriptions(data.results || data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openNew = () => {
    setForm({ patient: '', appointment: null, notes: '', items: [{ medicine: null, product: null, dosage: '', duration: '', instructions: '', quantity: 1 }] });
    Promise.all([getPatients(), getMedicines(), getPrescriptionProducts()])
      .then(([p, m, pr]) => {
        setPatients(p.data.results || p.data);
        const meds = (m.data.results || m.data).map(x => ({ ...x, type: 'medicine' }));
        const prods = (pr.data.results || pr.data).map(x => ({ ...x, type: 'product' }));
        setAvailableItems([...meds, ...prods]);
      });
    setShowModal(true);
  };

  const addItem = () => setForm(p => ({ ...p, items: [...p.items, { medicine: null, product: null, dosage: '', duration: '', instructions: '', quantity: 1 }] }));
  const removeItem = (i) => setForm(p => ({ ...p, items: p.items.filter((_, idx) => idx !== i) }));
  const updateItem = (i, field, val) => setForm(p => {
    const items = [...p.items];
    if (field === 'item_selection') {
      const selected = availableItems.find(x => x.id === parseInt(val.split(':')[1]) && x.type === val.split(':')[0]);
      if (selected?.type === 'medicine') {
        items[i] = { ...items[i], medicine: selected.id, product: null };
      } else if (selected?.type === 'product') {
        items[i] = { ...items[i], medicine: null, product: selected.id };
      } else {
        items[i] = { ...items[i], medicine: null, product: null };
      }
    } else {
      items[i] = { ...items[i], [field]: val };
    }
    return { ...p, items };
  });

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.patient) return alert('Please select a patient.');

    setSaving(true);
    const payload = {
      ...form,
      appointment: form.appointment || null,
      items: form.items.map(item => ({
        ...item,
        medicine: item.medicine || null,
        product: item.product || null
      }))
    };

    try {
      await createPrescription(payload);
      setShowModal(false);
      fetchData();
      if (form.appointment) navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data ? JSON.stringify(err.response.data) : 'Failed to save.';
      alert(msg);
      console.error('Prescription Error:', err.response?.data);
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
                        <div><span style={{ color: 'var(--primary)', fontWeight: 600 }}>💊 {item.item_name}</span></div>
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
          <div className="modal" style={{ maxWidth: 850 }} onClick={e => e.stopPropagation()}>
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
                  {form.items.length > 0 && (
                    <div className="table-wrapper" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                        <thead>
                          <tr style={{ background: 'var(--bg-input)', borderBottom: '1px solid var(--border)' }}>
                            <th style={{ padding: '8px 10px', textAlign: 'left' }}>Medicine / Product</th>
                            <th style={{ padding: '8px 10px', textAlign: 'left', width: 100 }}>Dosage</th>
                            <th style={{ padding: '8px 10px', textAlign: 'left', width: 100 }}>Duration</th>
                            <th style={{ padding: '8px 10px', textAlign: 'left', width: 70 }}>Qty</th>
                            <th style={{ padding: '8px 10px', textAlign: 'left' }}>Instructions</th>
                            <th style={{ padding: '8px 10px', textAlign: 'center', width: 50 }}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {form.items.map((item, i) => (
                            <tr key={i} style={{ borderBottom: i === form.items.length - 1 ? 'none' : '1px solid var(--border)' }}>
                              <td style={{ padding: '6px' }}>
                                <select 
                                  className="input input-sm" 
                                  value={item.medicine ? `medicine:${item.medicine}` : item.product ? `product:${item.product}` : ''} 
                                  onChange={e => updateItem(i, 'item_selection', e.target.value)}
                                  required
                                >
                                  <option value="">Select...</option>
                                  <optgroup label="Clinic Medicines">
                                    {availableItems.filter(x => x.type === 'medicine').map(m => <option key={`m${m.id}`} value={`medicine:${m.id}`}>{m.name}</option>)}
                                  </optgroup>
                                  <optgroup label="Health Store Products">
                                    {availableItems.filter(x => x.type === 'product').map(p => <option key={`p${p.id}`} value={`product:${p.id}`}>{p.name}</option>)}
                                  </optgroup>
                                </select>
                              </td>
                              <td style={{ padding: '6px' }}>
                                <input className="input input-sm" value={item.dosage} onChange={e => updateItem(i, 'dosage', e.target.value)} placeholder="1-0-1" />
                              </td>
                              <td style={{ padding: '6px' }}>
                                <input className="input input-sm" value={item.duration} onChange={e => updateItem(i, 'duration', e.target.value)} placeholder="5 days" />
                              </td>
                              <td style={{ padding: '6px' }}>
                                <input type="number" min={1} className="input input-sm" value={item.quantity} onChange={e => updateItem(i, 'quantity', e.target.value)} />
                              </td>
                              <td style={{ padding: '6px' }}>
                                <input className="input input-sm" value={item.instructions} onChange={e => updateItem(i, 'instructions', e.target.value)} placeholder="After food" />
                              </td>
                              <td style={{ padding: '6px', textAlign: 'center' }}>
                                {form.items.length > 1 && (
                                  <button type="button" className="btn btn-danger btn-sm" onClick={() => removeItem(i)} style={{ padding: '2px 8px' }}>×</button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
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

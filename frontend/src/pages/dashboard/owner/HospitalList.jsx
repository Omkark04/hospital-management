import { useState, useEffect, useCallback } from 'react';
import { getHospitals, createHospital, updateHospital } from '../../../api/branches';

export default function HospitalList() {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '' });
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(() => {
    setLoading(true);
    getHospitals()
      .then(({ data }) => setHospitals(data.results || data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openModal = (item = null) => {
    setEditItem(item);
    setForm(item ? { name: item.name, phone: item.phone, email: item.email, address: item.address } : { name: '', phone: '', email: '', address: '' });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editItem) await updateHospital(editItem.id, form);
      else await createHospital(form);
      setShowModal(false);
      fetchData();
    } catch (err) { alert(JSON.stringify(err.response?.data) || 'Failed.'); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <div className="page-header">
        <h2>Hospitals</h2>
        <p>Manage your registered hospitals.</p>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => openModal()}>+ Add Hospital</button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
      ) : hospitals.length === 0 ? (
        <div className="empty-state card card-body">
          <div className="icon">🏥</div>
          <p>No hospitals yet. Start by adding your first hospital.</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => openModal()}>+ Add Hospital</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
          {hospitals.map(h => (
            <div key={h.id} className="card card-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-md)', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>🏥</div>
                <button className="btn btn-ghost btn-sm" onClick={() => openModal(h)}>Edit</button>
              </div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: 8 }}>{h.name}</h3>
              {h.phone && <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 4 }}>📱 {h.phone}</div>}
              {h.email && <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 4 }}>📧 {h.email}</div>}
              {h.address && <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>📍 {h.address}</div>}
              <div className="sep" style={{ margin: '14px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                <span>{h.branches?.length || 0} branches</span>
                <span className="badge badge-success">Active</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editItem ? 'Edit Hospital' : 'Add Hospital'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Hospital Name *</label>
                  <input className="input" required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. City Care Hospital" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div className="form-group">
                    <label className="form-label">Phone</label>
                    <input className="input" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input type="email" className="input" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Address</label>
                  <textarea className="input" rows={2} value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} />
                </div>
                <div className="modal-footer" style={{ padding: 0, border: 'none' }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Hospital'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

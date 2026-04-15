import { useState, useEffect, useCallback } from 'react';
import { getBranches, createBranch, updateBranch, getHospitals } from '../../../api/branches';

export default function BranchList() {
  const [branches, setBranches] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ hospital: '', name: '', address: '', phone: '', email: '' });
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(() => {
    setLoading(true);
    Promise.all([getBranches(), getHospitals()]).then(([b, h]) => {
      setBranches(b.data.results || b.data);
      setHospitals(h.data.results || h.data);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openModal = (item = null) => {
    setEditItem(item);
    setForm(item ? { hospital: item.hospital, name: item.name, address: item.address, phone: item.phone, email: item.email } : { hospital: '', name: '', address: '', phone: '', email: '' });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editItem) await updateBranch(editItem.id, form);
      else await createBranch(form);
      setShowModal(false);
      fetchData();
    } catch (err) { alert(JSON.stringify(err.response?.data) || 'Failed.'); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <div className="page-header">
        <h2>Branches</h2>
        <p>Manage hospital branches across locations.</p>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => openModal()}>+ Add Branch</button>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
        ) : branches.length === 0 ? (
          <div className="empty-state"><div className="icon">🏢</div><p>No branches yet.</p></div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>Branch</th><th>Hospital</th><th>Phone</th><th>Email</th><th>Address</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {branches.map(b => (
                  <tr key={b.id}>
                    <td>
                      <div style={{ fontWeight: 700 }}>{b.name}</div>
                      <div style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: 'var(--primary)' }}>Code: {b.code || b.name?.slice(0,3).toUpperCase()}</div>
                    </td>
                    <td style={{ fontSize: '0.875rem' }}>{b.hospital_name || `Hospital #${b.hospital}`}</td>
                    <td style={{ fontSize: '0.875rem' }}>{b.phone || '—'}</td>
                    <td style={{ fontSize: '0.875rem' }}>{b.email || '—'}</td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.address}</td>
                    <td><span className={`badge badge-${b.is_active ? 'success' : 'danger'}`}>{b.is_active ? 'Active' : 'Inactive'}</span></td>
                    <td><button className="btn btn-ghost btn-sm" onClick={() => openModal(b)}>Edit</button></td>
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
              <h3>{editItem ? 'Edit Branch' : 'Add Branch'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Hospital *</label>
                  <select className="input" required value={form.hospital} onChange={e => setForm(p => ({ ...p, hospital: e.target.value }))}>
                    <option value="">Select hospital...</option>
                    {hospitals.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Branch Name *</label>
                  <input className="input" required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Main Branch" />
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
                  <label className="form-label">Address *</label>
                  <textarea className="input" required rows={2} value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} />
                </div>
                <div className="modal-footer" style={{ padding: 0, border: 'none' }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Branch'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

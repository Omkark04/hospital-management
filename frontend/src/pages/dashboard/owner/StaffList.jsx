import { useState, useEffect, useCallback } from 'react';
import { getStaff, createStaff, updateStaff } from '../../../api/auth';
import { getBranches } from '../../../api/branches';

const ROLES = ['doctor', 'receptionist', 'employee', 'patient'];
const ROLE_COLORS = { owner: 'primary', doctor: 'info', receptionist: 'secondary', employee: 'warning', patient: 'success' };

export default function StaffList() {
  const [staff, setStaff] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ username: '', password: '', first_name: '', last_name: '', email: '', phone: '', role: 'doctor', branch: '' });
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(() => {
    setLoading(true);
    Promise.all([getStaff({ role: roleFilter || undefined }), getBranches()])
      .then(([s, b]) => { setStaff(s.data.results || s.data); setBranches(b.data.results || b.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [roleFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openModal = (item = null) => {
    setEditItem(item);
    setForm(item
      ? { username: item.username, password: '', first_name: item.first_name, last_name: item.last_name, email: item.email || '', phone: item.phone || '', role: item.role, branch: item.branch || '' }
      : { username: '', password: '', first_name: '', last_name: '', email: '', phone: '', role: 'doctor', branch: '' });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = { ...form };
    if (editItem && !payload.password) delete payload.password;
    try {
      if (editItem) await updateStaff(editItem.id, payload);
      else await createStaff(payload);
      setShowModal(false);
      fetchData();
    } catch (err) { alert(JSON.stringify(err.response?.data) || 'Failed.'); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <div className="page-header">
        <h2>Staff</h2>
        <p>Manage all staff accounts across branches.</p>
        <div className="page-actions">
          <select className="input" value={roleFilter} onChange={e => setRoleFilter(e.target.value)} style={{ maxWidth: 180 }}>
            <option value="">All Roles</option>
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <button className="btn btn-primary" onClick={() => openModal()}>+ Create Staff</button>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
        ) : staff.length === 0 ? (
          <div className="empty-state"><div className="icon">👥</div><p>No staff found.</p></div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>Name</th><th>Username</th><th>Role</th><th>Branch</th><th>Phone</th><th>Email</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {staff.map(s => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 600 }}>{s.first_name} {s.last_name}</td>
                    <td style={{ fontFamily: 'monospace', color: 'var(--primary)', fontSize: '0.85rem' }}>@{s.username}</td>
                    <td><span className={`badge badge-${ROLE_COLORS[s.role] || 'primary'}`}>{s.role}</span></td>
                    <td style={{ fontSize: '0.875rem' }}>{s.branch_name || '—'}</td>
                    <td style={{ fontSize: '0.875rem' }}>{s.phone || '—'}</td>
                    <td style={{ fontSize: '0.875rem' }}>{s.email || '—'}</td>
                    <td><span className={`badge badge-${s.is_active ? 'success' : 'danger'}`}>{s.is_active ? 'Active' : 'Inactive'}</span></td>
                    <td><button className="btn btn-ghost btn-sm" onClick={() => openModal(s)}>Edit</button></td>
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
              <h3>{editItem ? 'Edit Staff' : 'Create Staff Account'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div className="form-group">
                    <label className="form-label">First Name *</label>
                    <input className="input" required value={form.first_name} onChange={e => setForm(p => ({ ...p, first_name: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Last Name</label>
                    <input className="input" value={form.last_name} onChange={e => setForm(p => ({ ...p, last_name: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Username *</label>
                    <input className="input" required value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{editItem ? 'New Password (leave blank)' : 'Password *'}</label>
                    <input type="password" className="input" required={!editItem} minLength={8} value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Role *</label>
                    <select className="input" value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
                      {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Branch</label>
                    <select className="input" value={form.branch} onChange={e => setForm(p => ({ ...p, branch: e.target.value }))}>
                      <option value="">No branch</option>
                      {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input type="email" className="input" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone</label>
                    <input className="input" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
                  </div>
                </div>
                <div className="modal-footer" style={{ padding: 0, border: 'none' }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : editItem ? 'Update Staff' : 'Create Account'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

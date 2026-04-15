import { useState, useEffect, useCallback } from 'react';
import { getEmployees, createEmployee, updateEmployee } from '../../../api/hr';
import { getStaff } from '../../../api/auth';
import { getBranches } from '../../../api/branches';
import { useAuth } from '../../../context/AuthContext';

export default function EmployeeList() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [branches, setBranches] = useState([]);
  const [staffUsers, setStaffUsers] = useState([]);
  const [form, setForm] = useState({ user: '', branch: user?.branch_id || '', designation: '', salary: '', date_of_joining: '' });
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(() => {
    setLoading(true);
    getEmployees()
      .then(({ data }) => setEmployees(data.results || data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openModal = (item = null) => {
    setEditItem(item);
    setForm(item ? { user: item.user, branch: item.branch, designation: item.designation, salary: item.salary || '', date_of_joining: item.date_of_joining || '' }
                  : { user: '', branch: user?.branch_id || '', designation: '', salary: '', date_of_joining: '' });
    Promise.all([getBranches(), getStaff()])
      .then(([b, s]) => { setBranches(b.data.results || b.data); setStaffUsers(s.data.results || s.data); });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editItem) await updateEmployee(editItem.id, form);
      else await createEmployee(form);
      setShowModal(false);
      fetchData();
    } catch (err) { alert(JSON.stringify(err.response?.data) || 'Failed to save.'); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <div className="page-header">
        <h2>Employees</h2>
        <p>Manage branch employees.</p>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => openModal()}>+ Add Employee</button>
        </div>
      </div>
      <div className="card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
        ) : employees.length === 0 ? (
          <div className="empty-state"><div className="icon">👥</div><p>No employees found.</p></div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>Name</th><th>Role</th><th>Designation</th><th>Branch</th><th>Salary</th><th>Joined</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {employees.map(e => (
                  <tr key={e.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{e.full_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{e.phone}</div>
                    </td>
                    <td><span className="badge badge-secondary">{e.role}</span></td>
                    <td>{e.designation}</td>
                    <td style={{ fontSize: '0.875rem' }}>{e.branch_name}</td>
                    <td style={{ fontWeight: 600 }}>{e.salary ? `₹${e.salary}` : '—'}</td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{e.date_of_joining || '—'}</td>
                    <td><button className="btn btn-ghost btn-sm" onClick={() => openModal(e)}>Edit</button></td>
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
              <h3>{editItem ? 'Edit Employee' : 'Add Employee'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {!editItem && (
                  <div className="form-group">
                    <label className="form-label">Staff User *</label>
                    <select className="input" required value={form.user} onChange={e => setForm(p => ({ ...p, user: e.target.value }))}>
                      <option value="">Select user...</option>
                      {staffUsers.map(u => <option key={u.id} value={u.id}>{u.full_name || u.username} ({u.role})</option>)}
                    </select>
                  </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div className="form-group">
                    <label className="form-label">Branch *</label>
                    <select className="input" required value={form.branch} onChange={e => setForm(p => ({ ...p, branch: e.target.value }))}>
                      <option value="">Select branch...</option>
                      {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Designation *</label>
                    <input className="input" required value={form.designation} onChange={e => setForm(p => ({ ...p, designation: e.target.value }))} placeholder="e.g. Nurse, Lab Tech" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Salary (₹/mo)</label>
                    <input type="number" className="input" value={form.salary} onChange={e => setForm(p => ({ ...p, salary: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Joining Date</label>
                    <input type="date" className="input" value={form.date_of_joining} onChange={e => setForm(p => ({ ...p, date_of_joining: e.target.value }))} />
                  </div>
                </div>
                <div className="modal-footer" style={{ padding: 0, border: 'none' }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Employee'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

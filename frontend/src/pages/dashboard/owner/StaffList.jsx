import { useState, useEffect, useCallback } from 'react';
import { getStaff, createStaff, updateStaff, deleteStaff } from '../../../api/auth';
import { getBranches, getHospitals } from '../../../api/branches';
import { FaUsers, FaTrash, FaEdit, FaBriefcase, FaLock, FaEye, FaEyeSlash, FaInfoCircle } from 'react-icons/fa';

const ROLES = ['doctor', 'receptionist', 'employee'];
const ROLE_COLORS = {
  owner: 'primary',
  doctor: 'info',
  receptionist: 'secondary',
  employee: 'warning',
  patient: 'success',
};

const EMPTY_FORM = {
  username: '', password: '', confirm_password: '',
  first_name: '', last_name: '', email: '', phone: '',
  role: 'doctor', branch: '', is_active: true,
  // HR profile fields
  designation: '', salary_type: 'monthly', salary: '', date_of_joining: '',
};

export default function StaffList() {
  const [staff, setStaff] = useState([]);
  const [branches, setBranches] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [selectedHospitalId, setSelectedHospitalId] = useState('');
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('account');

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchData = useCallback(() => {
    setLoading(true);
    Promise.all([
      getStaff({ 
        role: roleFilter || undefined,
        search: debouncedSearch.trim() || undefined,
        branch: selectedBranch || undefined
      }),
      getBranches(),
      getHospitals(),
    ])
      .then(([s, b, h]) => {
        setStaff(s.data.results || s.data);
        setBranches(b.data.results || b.data);
        setHospitals(h.data.results || h.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [roleFilter, debouncedSearch, selectedBranch]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openModal = (item = null) => {
    setEditItem(item);
    let initialHospitalId = '';
    if (item && item.branch) {
      const selectedBranch = branches.find((b) => b.id === item.branch);
      if (selectedBranch) {
        initialHospitalId = selectedBranch.hospital;
      }
    }
    setSelectedHospitalId(initialHospitalId);
    setForm(
      item
        ? {
            username: item.username,
            password: '',
            confirm_password: '',
            first_name: item.first_name || '',
            last_name: item.last_name || '',
            email: item.email || '',
            phone: item.phone || '',
            role: item.role,
            branch: item.branch || '',
            is_active: item.is_active,
            designation: item.designation || '',
            salary_type: item.salary_type || 'monthly',
            salary: item.salary || '',
            date_of_joining: item.date_of_joining || '',
          }
        : EMPTY_FORM
    );
    setSaveError('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setActiveTab('account');
    setShowModal(true);
  };

  const extractError = (err) => {
    const d = err.response?.data;
    if (!d) {
      const status = err.response?.status;
      if (status === 500) return 'Server error — please try again in a moment.';
      if (status === 400) return 'Invalid data submitted. Check all fields.';
      if (status === 403) return 'You do not have permission to perform this action.';
      return err.message || 'Network error — check your connection.';
    }
    if (typeof d === 'string') return d;
    // Django REST field errors: { field: ["msg"] } or { detail: "msg" }
    if (d.detail) return d.detail;
    if (d.non_field_errors) return d.non_field_errors[0];
    const fieldErrors = Object.entries(d)
      .map(([k, v]) => `${k}: ${Array.isArray(v) ? v[0] : v}`)
      .join(' | ');
    return fieldErrors || 'Failed to save.';
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (form.password && form.password !== form.confirm_password) {
      setSaveError('Passwords do not match!');
      return;
    }
    setSaving(true);
    setSaveError('');
    const payload = { ...form };

    // When editing and not changing password, don't send either field
    if (editItem && !payload.password) {
      delete payload.password;
      delete payload.confirm_password;
    }

    // Strip empty optional HR fields to avoid backend validation noise
    if (!payload.salary) payload.salary = null;
    if (!payload.date_of_joining) payload.date_of_joining = null;

    try {
      if (editItem) await updateStaff(editItem.id, payload);
      else await createStaff(payload);
      setShowModal(false);
      fetchData();
    } catch (err) {
      setSaveError(extractError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (member) => {
    if (!window.confirm(`Are you sure you want to delete "${member.full_name}"? This action is permanent and cannot be undone.`)) return;
    try {
      await deleteStaff(member.id);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete staff member.');
    }
  };

  // Shorthand helper to bind form field
  const f = (key) => ({
    value: form[key] ?? '',
    onChange: (e) => setForm((p) => ({ ...p, [key]: e.target.value })),
  });

  const tabStyle = (key) => ({
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '9px 22px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '0.875rem',
    color: activeTab === key ? 'var(--primary)' : 'var(--text-muted)',
    borderBottom: activeTab === key ? '2px solid var(--primary)' : '2px solid transparent',
    marginBottom: -2,
    transition: 'color 0.2s',
  });

  return (
    <div>
      <div className="page-header">
        <h2>Staff &amp; HR</h2>
        <p>Manage staff accounts, roles, and HR profiles across all branches.</p>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => openModal()}>
            + Add Staff
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          className="input"
          placeholder="Search by name, phone or designation..."
          style={{ flex: 1, minWidth: 200, maxWidth: 400 }}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        
        <select
          className="input"
          style={{ width: 180 }}
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="">All Roles</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        
        <select
          className="input"
          style={{ width: 180 }}
          value={selectedBranch}
          onChange={e => setSelectedBranch(e.target.value)}
        >
          <option value="">All Branches</option>
          {branches.map(b => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div className="spinner" style={{ margin: '0 auto' }} />
          </div>
        ) : staff.length === 0 ? (
          <div className="empty-state">
            <div className="icon"><FaUsers /></div>
            <p>No staff found.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Username</th>
                  <th>Role</th>
                  <th>Branch</th>
                  <th>Designation</th>
                  <th>Salary</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {staff.map((s) => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 600 }}>{s.full_name}</td>
                    <td style={{ fontFamily: 'monospace', color: 'var(--primary)', fontSize: '0.85rem' }}>
                      @{s.username}
                    </td>
                    <td>
                      <span className={`badge badge-${ROLE_COLORS[s.role] || 'primary'}`}>
                        {s.role}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.875rem' }}>{s.branch_name || '—'}</td>
                    <td style={{ fontSize: '0.875rem' }}>
                      {s.designation ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <FaBriefcase style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }} />
                          {s.designation}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                    <td style={{ fontSize: '0.875rem' }}>
                      {s.salary ? (
                        <span>
                          ₹{parseFloat(s.salary).toLocaleString('en-IN')}
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: 3 }}>
                            /{s.salary_type === 'daily' ? 'day' : 'mo'}
                          </span>
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                    <td style={{ fontSize: '0.875rem' }}>{s.phone || '—'}</td>
                    <td>
                      <span className={`badge badge-${s.is_active ? 'success' : 'danger'}`}>
                        {s.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => openModal(s)}
                        style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                      >
                        <FaEdit style={{ fontSize: '0.75rem' }} /> Edit
                      </button>
                      <button
                        className="btn btn-sm"
                        onClick={() => handleDelete(s)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 4,
                          background: 'var(--danger, #ef4444)', color: '#fff',
                          border: 'none', cursor: 'pointer',
                        }}
                      >
                        <FaTrash style={{ fontSize: '0.75rem' }} /> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modal ── */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 680, width: '95%' }}
          >
            <div className="modal-header">
              <h3>{editItem ? 'Edit Staff Member' : 'Add Staff Member'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>

            <div className="modal-body">
              {/* Tab bar */}
              <div style={{ display: 'flex', borderBottom: '2px solid var(--border)', marginBottom: 20 }}>
                <button type="button" style={tabStyle('account')} onClick={() => setActiveTab('account')}>
                  <FaLock /> Account
                </button>
                <button type="button" style={tabStyle('hr')} onClick={() => setActiveTab('hr')}>
                  <FaBriefcase /> HR Profile
                </button>
              </div>

              <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* ── Account Tab ── */}
                {activeTab === 'account' && (
                  <div className="form-grid">
                    <div className="form-group">
                      <label className="form-label">First Name *</label>
                      <input className="input" required {...f('first_name')} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Last Name</label>
                      <input className="input" {...f('last_name')} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Username *</label>
                      <input className="input" required {...f('username')} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">
                        {editItem ? 'New Password (leave blank to keep)' : 'Password *'}
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          className="input"
                          required={!editItem}
                          minLength={8}
                          {...f('password')}
                          style={{ paddingRight: '2.5rem' }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--text-muted)' }}
                        >
                          {showPassword ? <FaEye /> : <FaEyeSlash />}
                        </button>
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">
                        {editItem ? 'Confirm New Password' : 'Confirm Password *'}
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          className="input"
                          required={!!form.password}
                          minLength={8}
                          {...f('confirm_password')}
                          style={{ paddingRight: '2.5rem' }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--text-muted)' }}
                        >
                          {showConfirmPassword ? <FaEye /> : <FaEyeSlash />}
                        </button>
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Role *</label>
                      {editItem && editItem.role === 'owner' ? (
                        <input className="input" value="Owner" disabled />
                      ) : (
                        <select className="input" {...f('role')}>
                          {ROLES.map((r) => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                      )}
                    </div>
                    <div className="form-group">
                      <label className="form-label">Hospital</label>
                      <select
                        className="input"
                        value={selectedHospitalId}
                        onChange={(e) => {
                          const hid = e.target.value;
                          setSelectedHospitalId(hid);
                          setForm((p) => ({ ...p, branch: '' }));
                        }}
                      >
                        <option value="">No Hospital / Unassigned</option>
                        {hospitals.map((h) => (
                          <option key={h.id} value={h.id}>{h.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Branch</label>
                      <select
                        className="input"
                        {...f('branch')}
                        disabled={!selectedHospitalId}
                      >
                        <option value="">No branch</option>
                        {branches
                          .filter((b) => String(b.hospital) === String(selectedHospitalId))
                          .map((b) => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                          ))}
                      </select>
                    </div>
                    {editItem && (
                      <div className="form-group">
                        <label className="form-label">Status</label>
                        <select
                          className="input"
                          value={form.is_active ? 'true' : 'false'}
                          onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.value === 'true' }))}
                        >
                          <option value="true">Active</option>
                          <option value="false">Inactive</option>
                        </select>
                      </div>
                    )}
                    <div className="form-group">
                      <label className="form-label">Email</label>
                      <input type="email" className="input" {...f('email')} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Phone</label>
                      <input className="input" {...f('phone')} />
                    </div>
                  </div>
                )}

                {/* ── HR Profile Tab ── */}
                {activeTab === 'hr' && (
                  <div className="form-grid">
                    <div className="form-group">
                      <label className="form-label">Designation</label>
                      <input
                        className="input"
                        placeholder="e.g. Senior Doctor, Receptionist"
                        {...f('designation')}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Salary Type</label>
                      <select className="input" {...f('salary_type')}>
                        <option value="monthly">Monthly</option>
                        <option value="daily">Daily</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Salary (₹)</label>
                      <input
                        type="number"
                        className="input"
                        min="0"
                        step="0.01"
                        placeholder="e.g. 50000"
                        {...f('salary')}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Date of Joining</label>
                      <input type="date" className="input" {...f('date_of_joining')} />
                    </div>
                    <div
                      className="form-group"
                      style={{
                        gridColumn: '1 / -1',
                        background: 'var(--bg-subtle, #f8fafc)',
                        border: '1px solid var(--border)',
                        borderRadius: 8,
                        padding: '12px 16px',
                        fontSize: '0.825rem',
                        color: 'var(--text-muted)',
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                        <FaInfoCircle style={{ flexShrink: 0, marginTop: 2 }} />
                        <span>
                          HR profile (attendance, leave, payroll) is created automatically when a branch is
                          assigned. You can update it anytime from this panel.
                        </span>
                      </span>
                    </div>
                  </div>
                )}

                {saveError && (
                  <div style={{
                    margin: '0 0 12px 0',
                    padding: '10px 14px',
                    background: 'rgba(220,38,38,0.08)',
                    border: '1px solid rgba(220,38,38,0.3)',
                    borderRadius: 8,
                    color: 'var(--danger, #dc2626)',
                    fontSize: '0.875rem',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 8,
                  }}>
                    <span style={{ flexShrink: 0, marginTop: 1 }}>⚠️</span>
                    <span>{saveError}</span>
                  </div>
                )}

                <div className="modal-footer" style={{ padding: 0, border: 'none' }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? 'Saving…' : editItem ? 'Update Staff' : 'Create Staff'}
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

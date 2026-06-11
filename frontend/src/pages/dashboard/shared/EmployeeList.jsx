import { useState, useEffect, useCallback } from 'react';
import { getEmployees, createEmployee, updateEmployee, deleteEmployee } from '../../../api/hr';
import { getStaff } from '../../../api/auth';
import { getBranches, getHospitals } from '../../../api/branches';
import { useAuth } from '../../../context/AuthContext';
import { FaEye, FaEyeSlash, FaUsers, FaTrash, FaEdit } from 'react-icons/fa';

export default function EmployeeList() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [branches, setBranches] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [selectedHospital, setSelectedHospital] = useState('');
  const [form, setForm] = useState({ 
    branch: user?.branch || user?.branch_id || '', 
    designation: '', 
    salary_type: 'monthly', 
    salary: '', 
    date_of_joining: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    raw_username: '',
    raw_password: '',
    confirm_password: '',
    role_type: 'employee'
  });
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Search & Filter States
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedDesignation, setSelectedDesignation] = useState('');
  const [designations, setDesignations] = useState([]);

  // Fetch unique designations once initially
  useEffect(() => {
    getEmployees()
      .then(({ data }) => {
        const rows = data.results || data;
        const unique = Array.from(new Set(rows.map(e => e.designation).filter(Boolean)));
        setDesignations(unique);
      })
      .catch(console.error);
  }, []);

  // Fetch branches for filter options if owner
  useEffect(() => {
    if (user?.role === 'owner') {
      getBranches()
        .then(({ data }) => setBranches(data.results || data))
        .catch(console.error);
    }
  }, [user]);

  // Debounce Search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchData = useCallback(() => {
    setLoading(true);
    getEmployees({
      search: debouncedSearch.trim() || undefined,
      branch: selectedBranch || undefined,
      designation: selectedDesignation || undefined
    })
      .then(({ data }) => setEmployees(data.results || data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [debouncedSearch, selectedBranch, selectedDesignation]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openModal = (item = null) => {
    setEditItem(item);
    setForm(item ? { 
        branch: item.branch, 
        designation: item.designation, 
        salary_type: item.salary_type || 'monthly', 
        salary: item.salary || '', 
        date_of_joining: item.date_of_joining || '',
        email: item.email || ''
      }
      : { 
        branch: user?.role === 'owner' ? '' : user?.branch || user?.branch_id || '', 
        designation: '', 
        salary_type: 'monthly', 
        salary: '', 
        date_of_joining: '',
        first_name: '',
        last_name: '',
        email: '',
        phone_number: '',
        raw_username: '',
        raw_password: '',
        confirm_password: '',
        role_type: 'employee'
      });
    
    if (user?.role === 'owner') {
      Promise.all([getHospitals(), getBranches()])
        .then(([h, b]) => { 
          setHospitals(h.data.results || h.data); 
          setBranches(b.data.results || b.data); 
        });
    }
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!editItem && form.raw_password !== form.confirm_password) {
      alert("Passwords do not match.");
      return;
    }
    setSaving(true);
    try {
      const payload = { 
        ...form,
        raw_email: form.email,
        salary: form.salary ? parseFloat(form.salary) : null,
        date_of_joining: form.date_of_joining ? form.date_of_joining : null
      };
      delete payload.confirm_password;

      if (editItem) await updateEmployee(editItem.id, payload);
      else await createEmployee(payload);
      setShowModal(false);
      fetchData();
    } catch (err) { alert(JSON.stringify(err.response?.data) || 'Failed to save.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (emp, hard = false) => {
    const actionText = hard ? 'permanently DELETE' : 'deactivate';
    const warningText = hard 
      ? `Are you sure you want to permanently DELETE ${emp.full_name}? This action is irreversible and will delete their user account.`
      : `Are you sure you want to deactivate ${emp.full_name}? They will no longer be able to log in.`;
      
    if (!window.confirm(warningText)) return;
    try {
      await deleteEmployee(emp.id, hard);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || `Failed to ${actionText} employee.`);
    }
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
          value={selectedDesignation}
          onChange={e => setSelectedDesignation(e.target.value)}
        >
          <option value="">All Designations</option>
          {designations.map(d => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        
        {user?.role === 'owner' && (
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
        )}
      </div>

      <div className="card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
        ) : employees.length === 0 ? (
          <div className="empty-state"><div className="icon"><FaUsers /></div><p>No employees found.</p></div>
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
                      {e.email && <div style={{ fontSize: '0.75rem', color: 'var(--primary)' }}>{e.email}</div>}
                    </td>
                    <td><span className="badge badge-secondary">{e.role}</span></td>
                    <td>{e.designation}</td>
                    <td style={{ fontSize: '0.875rem' }}>{e.branch_name}</td>
                    <td style={{ fontWeight: 600 }}>{e.salary ? `₹${e.salary}` : '—'}</td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{e.date_of_joining || '—'}</td>
                    <td style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => openModal(e)} style={{ display: 'flex', alignItems: 'center', gap: 4 }}><FaEdit style={{ fontSize: '0.75rem' }} /> Edit</button>
                      
                      <button 
                        className="btn btn-ghost btn-sm" 
                        onClick={() => handleDelete(e, false)} 
                        style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--warning, #f59e0b)' }}
                      >
                        Deactivate
                      </button>
                      
                      {user?.role === 'owner' && (
                        <button 
                          className="btn btn-sm" 
                          onClick={() => handleDelete(e, true)} 
                          style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--danger, #ef4444)', color: '#fff', border: 'none', cursor: 'pointer' }}
                        >
                          <FaTrash style={{ fontSize: '0.75rem' }} /> Delete
                        </button>
                      )}
                    </td>
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
                  <>
                    <div className="form-grid">
                      <div className="form-group">
                        <label className="form-label">First Name *</label>
                        <input className="input" required value={form.first_name} onChange={e => setForm(p => ({ ...p, first_name: e.target.value }))} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Last Name</label>
                        <input className="input" value={form.last_name} onChange={e => setForm(p => ({ ...p, last_name: e.target.value }))} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Mobile Number *</label>
                        <input className="input" required value={form.phone_number} onChange={e => setForm(p => ({ ...p, phone_number: e.target.value }))} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Email *</label>
                        <input type="email" className="input" required value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="employee@example.com" />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Username *</label>
                        <input className="input" required value={form.raw_username} onChange={e => setForm(p => ({ ...p, raw_username: e.target.value }))} />
                      </div>
                      <div className="form-group" style={{ position: 'relative' }}>
                        <label className="form-label">Password *</label>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                          <input 
                            type={showPassword ? 'text' : 'password'} 
                            minLength={6} 
                            className="input" 
                            style={{ width: '100%', paddingRight: '40px' }}
                            required 
                            value={form.raw_password} 
                            onChange={e => setForm(p => ({ ...p, raw_password: e.target.value }))} 
                          />
                          <button 
                            type="button" 
                            onClick={() => setShowPassword(!showPassword)}
                            style={{ position: 'absolute', right: '10px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                          >
                            {showPassword ? <FaEyeSlash /> : <FaEye />}
                          </button>
                        </div>
                      </div>
                      <div className="form-group" style={{ position: 'relative' }}>
                        <label className="form-label">Confirm Password *</label>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                          <input 
                            type={showConfirmPassword ? 'text' : 'password'} 
                            minLength={6} 
                            className="input" 
                            style={{ width: '100%', paddingRight: '40px' }}
                            required 
                            value={form.confirm_password} 
                            onChange={e => setForm(p => ({ ...p, confirm_password: e.target.value }))} 
                          />
                          <button 
                            type="button" 
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            style={{ position: 'absolute', right: '10px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                          >
                            {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                          </button>
                        </div>
                      </div>
                    </div>
                    <hr style={{ border: 'none', borderBottom: '1px solid var(--border)', margin: '10px 0' }} />
                  </>
                )}
                <div className="form-grid">
                  {user?.role === 'owner' ? (
                    <>
                      <div className="form-group">
                        <label className="form-label">Hospital *</label>
                        <select className="input" required value={selectedHospital} onChange={e => { setSelectedHospital(e.target.value); setForm(p => ({ ...p, branch: '' })); }}>
                          <option value="">Select hospital...</option>
                          {hospitals.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Branch *</label>
                        <select className="input" required value={form.branch} onChange={e => setForm(p => ({ ...p, branch: e.target.value }))} disabled={!selectedHospital}>
                          <option value="">Select branch...</option>
                          {branches.filter(b => b.hospital === parseInt(selectedHospital)).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                      </div>
                    </>
                  ) : null}
                  
                  {!editItem && (
                    <div className="form-group">
                      <label className="form-label">Employee Type *</label>
                      <select className="input" value={form.role_type} onChange={e => setForm(p => ({ ...p, role_type: e.target.value }))}>
                        <option value="employee">Normal Employee</option>
                        <option value="receptionist">Receptionist</option>
                      </select>
                    </div>
                  )}
                  <div className="form-group">
                    <label className="form-label">Designation *</label>
                    <input className="input" required value={form.designation} onChange={e => setForm(p => ({ ...p, designation: e.target.value }))} placeholder="e.g. Nurse, Lab Tech" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Salary Type</label>
                    <select className="input" value={form.salary_type} onChange={e => setForm(p => ({ ...p, salary_type: e.target.value }))}>
                      <option value="monthly">Monthly</option>
                      <option value="daily">Daily</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Salary (₹)</label>
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

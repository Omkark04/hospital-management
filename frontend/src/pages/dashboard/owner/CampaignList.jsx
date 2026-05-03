import { useState, useEffect, useCallback } from 'react';
import { getCampaigns, createCampaign, updateCampaign, assignCampaignManager } from '../../../api/campaigns';
import { getStaff } from '../../../api/auth';
import { getBranches } from '../../../api/branches';

const STATUS_COLORS = { planned: 'secondary', active: 'success', completed: 'primary', cancelled: 'danger' };

export default function CampaignList() {
  const [campaigns, setCampaigns] = useState([]);
  const [branches, setBranches] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ name: '', branch: '', start_date: '', end_date: '', location: '', objective: '', status: 'planned', target_registrations: '', assigned_doctor: '' });
  const [assignForm, setAssignForm] = useState({ user: '', role_in_campaign: 'manager' });
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(() => {
    setLoading(true);
    Promise.all([getCampaigns(), getBranches(), getStaff()])
      .then(([c, b, s]) => {
        setCampaigns(c.data.results || c.data);
        setBranches(b.data.results || b.data);
        setStaff(s.data.results || s.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openModal = (item = null) => {
    setEditItem(item);
    setForm(item ? { name: item.name, branch: item.branch, start_date: item.start_date, end_date: item.end_date, location: item.location || '', objective: item.objective || '', status: item.status, target_registrations: item.target_registrations || '', assigned_doctor: '' }
                  : { name: '', branch: '', start_date: '', end_date: '', location: '', objective: '', status: 'planned', target_registrations: '', assigned_doctor: '' });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editItem) {
        await updateCampaign(editItem.id, form);
      } else {
        const res = await createCampaign(form);
        if (form.assigned_doctor) {
          try {
            await assignCampaignManager({ campaign: res.data.id, user: form.assigned_doctor });
          } catch(err) {
            console.error("Failed to automatically assign doctor", err);
          }
        }
      }
      setShowModal(false);
      fetchData();
    } catch (err) { alert(JSON.stringify(err.response?.data) || 'Failed.'); }
    finally { setSaving(false); }
  };

  const openAssign = (c) => {
    setShowAssignModal(c);
    setAssignForm({ user: '', role_in_campaign: 'manager' });
    getStaff().then(({ data }) => setStaff(data.results || data));
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await assignCampaignManager({ campaign: showAssignModal.id, ...assignForm });
      setShowAssignModal(null);
      alert('Manager assigned successfully!');
    } catch (err) { alert(JSON.stringify(err.response?.data) || 'Failed.'); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <div className="page-header">
        <h2>Campaigns</h2>
        <p>Create and manage health camp campaigns.</p>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => openModal()}>+ New Campaign</button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
      ) : campaigns.length === 0 ? (
        <div className="empty-state card card-body"><div className="icon">🎯</div><p>No campaigns yet.</p></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
          {campaigns.map(c => (
            <div key={c.id} className="card card-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <h3 style={{ fontSize: '1.05rem' }}>{c.name}</h3>
                <span className={`badge badge-${STATUS_COLORS[c.status]}`}>{c.status}</span>
              </div>
              {c.objective && <p style={{ fontSize: '0.85rem', marginBottom: 12, WebkitLineClamp: 2, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{c.objective}</p>}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 16 }}>
                <div>📅 {c.start_date} → {c.end_date}</div>
                {c.location && <div>📍 {c.location}</div>}
                {c.branch_name && <div>🏢 {c.branch_name}</div>}
                {c.target_registrations && <div>🎯 Target: {c.target_registrations} patients</div>}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => openModal(c)}>Edit</button>
                <button className="btn btn-secondary btn-sm" onClick={() => openAssign(c)}>+ Assign Manager</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Campaign Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editItem ? 'Edit Campaign' : 'New Campaign'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Campaign Name *</label>
                  <input className="input" required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div className="form-group">
                    <label className="form-label">Branch *</label>
                    <select className="input" required value={form.branch} onChange={e => setForm(p => ({ ...p, branch: e.target.value, assigned_doctor: '' }))}>
                      <option value="">Select branch...</option>
                      {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                  {!editItem && form.branch && (
                    <div className="form-group">
                      <label className="form-label">Assign Doctor to Campaign</label>
                      <select className="input" value={form.assigned_doctor} onChange={e => setForm(p => ({ ...p, assigned_doctor: e.target.value }))}>
                        <option value="">Do not assign yet</option>
                        {staff.filter(s => s.role === 'doctor' && s.branch == form.branch).map(s => (
                          <option key={s.id} value={s.id}>Dr. {s.first_name} {s.last_name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select className="input" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                      <option value="planned">Planned</option>
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Start Date *</label>
                    <input type="date" className="input" required value={form.start_date} onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">End Date *</label>
                    <input type="date" className="input" required value={form.end_date} onChange={e => setForm(p => ({ ...p, end_date: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Location</label>
                    <input className="input" value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} placeholder="Village / City" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Target Registrations</label>
                    <input type="number" className="input" min={1} value={form.target_registrations} onChange={e => setForm(p => ({ ...p, target_registrations: e.target.value }))} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Objective</label>
                  <textarea className="input" rows={2} value={form.objective} onChange={e => setForm(p => ({ ...p, objective: e.target.value }))} />
                </div>
                <div className="modal-footer" style={{ padding: 0, border: 'none' }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Campaign'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Assign Manager Modal */}
      {showAssignModal && (
        <div className="modal-overlay" onClick={() => setShowAssignModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Assign Manager — {showAssignModal.name}</h3>
              <button className="modal-close" onClick={() => setShowAssignModal(null)}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleAssign} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Select Staff *</label>
                  <select className="input" required value={assignForm.user} onChange={e => setAssignForm(p => ({ ...p, user: e.target.value }))}>
                    <option value="">Select staff member...</option>
                    {staff.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name} ({s.role})</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Role in Campaign</label>
                  <select className="input" value={assignForm.role_in_campaign} onChange={e => setAssignForm(p => ({ ...p, role_in_campaign: e.target.value }))}>
                    <option value="manager">Manager</option>
                    <option value="doctor">Doctor</option>
                    <option value="salesperson">Salesperson</option>
                    <option value="coordinator">Coordinator</option>
                  </select>
                </div>
                <div className="modal-footer" style={{ padding: 0, border: 'none' }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setShowAssignModal(null)}>Cancel</button>
                  <button type="submit" className="btn btn-secondary" disabled={saving}>{saving ? 'Assigning...' : 'Assign Manager'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

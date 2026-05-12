import { useState, useEffect, useCallback } from 'react';
import { getBranches, createBranch, updateBranch, getHospitals, resolveMapLink } from '../../../api/branches';
import { FaBuilding } from 'react-icons/fa';

export default function BranchList() {
  const [branches, setBranches] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ hospital: '', name: '', address: '', phone: '', email: '', latitude: '', longitude: '', attendance_radius_meters: 50, shift_start_time: '09:00', shift_end_time: '17:00' });
  const [saving, setSaving] = useState(false);
  const [mapLink, setMapLink] = useState('');
  const [resolving, setResolving] = useState(false);

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
    setForm(item ? { 
      hospital: item.hospital, 
      name: item.name, 
      address: item.address, 
      phone: item.phone, 
      email: item.email,
      latitude: item.latitude || '',
      longitude: item.longitude || '',
      attendance_radius_meters: item.attendance_radius_meters || 50,
      shift_start_time: item.shift_start_time?.slice(0, 5) || '09:00',
      shift_end_time: item.shift_end_time?.slice(0, 5) || '17:00'
    } : { hospital: '', name: '', address: '', phone: '', email: '', latitude: '', longitude: '', attendance_radius_meters: 50, shift_start_time: '09:00', shift_end_time: '17:00' });
    setMapLink('');
    setShowModal(true);
  };

  const handleResolveLink = async () => {
    if (!mapLink) return;
    setResolving(true);
    try {
      const res = await resolveMapLink(mapLink);
      const roundedLat = parseFloat(res.data.latitude).toFixed(6);
      const roundedLng = parseFloat(res.data.longitude).toFixed(6);
      setForm(p => ({
        ...p,
        latitude: roundedLat,
        longitude: roundedLng
      }));
      alert(`Coordinates extracted successfully!\nLat: ${roundedLat}, Lng: ${roundedLng}`);
    } catch (err) {
      alert(err.response?.data?.error || 'Could not auto-extract coordinates from this link. Please enter manually.');
    } finally {
      setResolving(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        latitude: form.latitude ? parseFloat(form.latitude).toFixed(6) : null,
        longitude: form.longitude ? parseFloat(form.longitude).toFixed(6) : null,
        attendance_radius_meters: parseInt(form.attendance_radius_meters, 10) || 50
      };
      if (editItem) await updateBranch(editItem.id, payload);
      else await createBranch(payload);
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
          <div className="empty-state"><div className="icon"><FaBuilding /></div><p>No branches yet.</p></div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>Branch</th><th>Hospital</th><th>Contact</th><th>Address</th><th>Shift Timings</th><th>Geofence</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {branches.map(b => (
                  <tr key={b.id}>
                    <td>
                      <div style={{ fontWeight: 700 }}>{b.name}</div>
                      <div style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: 'var(--primary)' }}>Code: {b.code || b.name?.slice(0,3).toUpperCase()}</div>
                    </td>
                    <td style={{ fontSize: '0.875rem' }}>{b.hospital_name || `Hospital #${b.hospital}`}</td>
                    <td style={{ fontSize: '0.875rem' }}>
                      <div>{b.phone || '—'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{b.email || '—'}</div>
                    </td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.address}</td>
                    <td style={{ fontSize: '0.82rem' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-color)' }}>
                        In: <span style={{ color: 'var(--primary)' }}>{b.shift_start_time?.slice(0,5) || '09:00'}</span>
                      </div>
                      <div style={{ fontWeight: 600, color: 'var(--text-color)', marginTop: 2 }}>
                        Out: <span style={{ color: 'var(--primary)' }}>{b.shift_end_time?.slice(0,5) || '17:00'}</span>
                      </div>
                    </td>
                    <td style={{ fontSize: '0.82rem' }}>
                      {b.latitude && b.longitude ? (
                        <div>
                          <span style={{ color: 'var(--success)', fontWeight: 600 }}>✓ Configured</span>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{b.attendance_radius_meters || 50}m radius</div>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--warning)', fontSize: '0.75rem' }}>⚠ Not set</span>
                      )}
                    </td>
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
                <div className="form-grid">
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
                <div className="form-group" style={{ padding: 12, background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', marginTop: 4 }}>
                  <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--primary)', marginBottom: 6 }}>✦ Auto-Extract from Google Maps Link</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input 
                      type="url" 
                      className="input" 
                      value={mapLink} 
                      onChange={e => setMapLink(e.target.value)} 
                      placeholder="Paste short/full link (e.g. maps.app.goo.gl/...)" 
                      style={{ fontSize: '0.8rem', padding: '6px 10px' }}
                    />
                    <button 
                      type="button" 
                      className="btn btn-primary btn-sm" 
                      onClick={handleResolveLink} 
                      disabled={resolving || !mapLink}
                      style={{ whiteSpace: 'nowrap', height: 'auto' }}
                    >
                      {resolving ? 'Extracting...' : 'Extract'}
                    </button>
                  </div>
                </div>
                <div className="form-grid" style={{ marginTop: 4 }}>
                  <div className="form-group">
                    <label className="form-label">Latitude (GPS)</label>
                    <input type="number" step="any" className="input" value={form.latitude} onChange={e => setForm(p => ({ ...p, latitude: e.target.value }))} placeholder="e.g. 19.0760" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Longitude (GPS)</label>
                    <input type="number" step="any" className="input" value={form.longitude} onChange={e => setForm(p => ({ ...p, longitude: e.target.value }))} placeholder="e.g. 72.8777" />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Attendance Radius (meters) *</label>
                  <input type="number" className="input" required value={form.attendance_radius_meters} onChange={e => setForm(p => ({ ...p, attendance_radius_meters: e.target.value }))} placeholder="e.g. 50" />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
                    Staff checking in via QR outside this radius will be flagged.
                  </span>
                </div>
                <div className="form-grid" style={{ marginTop: 4, padding: 12, background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>Shift Start (Check-in)</label>
                    <input type="time" className="input" required value={form.shift_start_time} onChange={e => setForm(p => ({ ...p, shift_start_time: e.target.value }))} style={{ padding: '6px 10px' }} />
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
                      QR active for 1 hr from start.
                    </span>
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>Shift End (Check-out)</label>
                    <input type="time" className="input" required value={form.shift_end_time} onChange={e => setForm(p => ({ ...p, shift_end_time: e.target.value }))} style={{ padding: '6px 10px' }} />
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
                      QR active for 1 hr from end.
                    </span>
                  </div>
                </div>
                <div className="modal-footer" style={{ padding: 0, border: 'none', marginTop: 8 }}>
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

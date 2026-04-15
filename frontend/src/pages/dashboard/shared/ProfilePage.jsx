import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { getProfile, updateProfile, changePassword } from '../../../api/auth';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [pwForm, setPwForm] = useState({ old_password: '', new_password: '', confirm: '' });
  const [pwMsg, setPwMsg] = useState('');
  const [pwError, setPwError] = useState('');

  useEffect(() => {
    getProfile()
      .then(({ data }) => { setProfile(data); setForm({ first_name: data.first_name, last_name: data.last_name, email: data.email || '', phone: data.phone || '' }); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveMsg('');
    try {
      await updateProfile(form);
      await refreshUser();
      setSaveMsg('✅ Profile updated successfully.');
      setEditing(false);
    } catch (err) {
      setSaveMsg('❌ ' + (err.response?.data?.detail || 'Failed to update.'));
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwMsg('');
    setPwError('');
    if (pwForm.new_password !== pwForm.confirm) {
      setPwError('Passwords do not match.');
      return;
    }
    setSaving(true);
    try {
      await changePassword({ old_password: pwForm.old_password, new_password: pwForm.new_password });
      setPwMsg('✅ Password changed successfully.');
      setPwForm({ old_password: '', new_password: '', confirm: '' });
    } catch (err) {
      setPwError(err.response?.data?.old_password?.[0] || err.response?.data?.detail || 'Failed to change password.');
    } finally {
      setSaving(false);
    }
  };

  const roleColors = { owner: 'primary', doctor: 'info', receptionist: 'secondary', employee: 'warning', patient: 'success' };

  if (loading) return <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>;

  return (
    <div style={{ maxWidth: 720 }}>
      <div className="page-header">
        <h2>My Profile</h2>
        <p>View and update your account information.</p>
      </div>

      {/* Profile card */}
      <div className="card card-body" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center', marginBottom: 24 }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 800, color: 'white', flexShrink: 0 }}>
            {profile?.first_name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ marginBottom: 6 }}>{profile?.first_name} {profile?.last_name}</h3>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <span className={`badge badge-${roleColors[profile?.role] || 'primary'}`}>
                {profile?.role}
              </span>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>@{profile?.username}</span>
              {profile?.branch_name && (
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>📍 {profile.branch_name}</span>
              )}
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => setEditing(!editing)}>
            {editing ? 'Cancel' : '✏️ Edit'}
          </button>
        </div>

        {saveMsg && <div className={`alert ${saveMsg.startsWith('✅') ? 'alert-success' : 'alert-danger'}`} style={{ marginBottom: 16 }}>{saveMsg}</div>}

        {editing ? (
          <form onSubmit={handleProfileSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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
                <label className="form-label">Email</label>
                <input className="input" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input className="input" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-ghost" onClick={() => setEditing(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
            </div>
          </form>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {[
              ['Username', profile?.username],
              ['Email', profile?.email || '—'],
              ['Phone', profile?.phone || '—'],
              ['Role', profile?.role],
              ['Branch', profile?.branch_name || '—'],
              ['Joined', profile?.date_joined?.split('T')[0] || '—'],
            ].map(([k, v]) => (
              <div key={k} style={{ padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>{k}</div>
                <div style={{ fontWeight: 500 }}>{v}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Change password */}
      <div className="card card-body">
        <h4 style={{ marginBottom: 20, color: 'var(--primary)' }}>🔐 Change Password</h4>
        {pwMsg && <div className="alert alert-success" style={{ marginBottom: 14 }}>{pwMsg}</div>}
        {pwError && <div className="alert alert-danger" style={{ marginBottom: 14 }}>{pwError}</div>}
        <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group">
            <label className="form-label">Current Password *</label>
            <input type="password" className="input" required value={pwForm.old_password} onChange={e => setPwForm(p => ({ ...p, old_password: e.target.value }))} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">New Password *</label>
              <input type="password" className="input" required minLength={8} value={pwForm.new_password} onChange={e => setPwForm(p => ({ ...p, new_password: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm Password *</label>
              <input type="password" className="input" required value={pwForm.confirm} onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))} />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-secondary" disabled={saving}>{saving ? 'Changing...' : '🔐 Change Password'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

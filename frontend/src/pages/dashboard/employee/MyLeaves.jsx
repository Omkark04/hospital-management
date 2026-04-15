import { useState, useEffect } from 'react';
import { getLeaves, applyLeave } from '../../../api/hr';

const STATUS_COLORS = { pending: 'warning', approved: 'success', rejected: 'danger' };
const TYPE_ICONS = { sick: '🤒', casual: '☀️', annual: '🏖️', other: '📋' };

export default function MyLeaves() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ leave_type: 'sick', from_date: '', to_date: '', reason: '' });
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchData = () => {
    setLoading(true);
    getLeaves()
      .then(({ data }) => setLeaves(data.results || data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleApply = async (e) => {
    e.preventDefault();
    if (form.from_date > form.to_date) {
      alert('End date must be after or equal to start date.');
      return;
    }
    setSaving(true);
    try {
      await applyLeave(form);
      setShowModal(false);
      setSuccessMsg('✅ Leave application submitted successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
      fetchData();
    } catch (err) {
      alert(JSON.stringify(err.response?.data) || 'Failed to submit application.');
    } finally {
      setSaving(false);
    }
  };

  const approved = leaves.filter(l => l.status === 'approved').length;
  const pending  = leaves.filter(l => l.status === 'pending').length;
  const rejected = leaves.filter(l => l.status === 'rejected').length;

  const totalApprovedDays = leaves
    .filter(l => l.status === 'approved')
    .reduce((sum, l) => sum + (l.total_days || 0), 0);

  return (
    <div>
      <div className="page-header">
        <h2>My Leaves</h2>
        <p>View and manage your leave applications.</p>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => { setForm({ leave_type: 'sick', from_date: '', to_date: '', reason: '' }); setShowModal(true); }}>
            + Apply for Leave
          </button>
        </div>
      </div>

      {successMsg && <div className="alert alert-success" style={{ marginBottom: 20 }}>{successMsg}</div>}

      {/* Summary */}
      <div className="stats-grid" style={{ marginBottom: 28 }}>
        <div className="stat-card green">
          <div className="stat-icon" style={{ background: 'var(--success-bg)' }}>✅</div>
          <div className="stat-label">Approved</div>
          <div className="stat-value">{approved}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>{totalApprovedDays} total days</div>
        </div>
        <div className="stat-card orange">
          <div className="stat-icon" style={{ background: 'var(--warning-bg)' }}>⏳</div>
          <div className="stat-label">Pending</div>
          <div className="stat-value">{pending}</div>
        </div>
        <div className="stat-card red">
          <div className="stat-icon" style={{ background: 'var(--danger-bg)' }}>❌</div>
          <div className="stat-label">Rejected</div>
          <div className="stat-value">{rejected}</div>
        </div>
      </div>

      {/* Leave history */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
      ) : leaves.length === 0 ? (
        <div className="empty-state card card-body">
          <div className="icon">📝</div>
          <p>No leave applications yet.</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowModal(true)}>Apply for Leave</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {leaves.map(l => (
            <div key={l.id} className="card card-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)', background: 'var(--bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0 }}>
                    {TYPE_ICONS[l.leave_type] || '📋'}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, marginBottom: 4, textTransform: 'capitalize' }}>{l.leave_type} Leave</div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      📅 {l.from_date} → {l.to_date}  ·  <strong style={{ color: 'var(--primary)' }}>{l.total_days} day{l.total_days !== 1 ? 's' : ''}</strong>
                    </div>
                    {l.reason && <p style={{ fontSize: '0.85rem', marginTop: 6, maxWidth: 500 }}>{l.reason}</p>}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 16 }}>
                  <span className={`badge badge-${STATUS_COLORS[l.status]}`} style={{ fontSize: '0.82rem', padding: '5px 14px' }}>{l.status}</span>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6 }}>{l.created_at?.split('T')[0]}</div>
                </div>
              </div>

              {/* Review notes */}
              {l.review_notes && (
                <div style={{ marginTop: 12, padding: '10px 14px', background: l.status === 'approved' ? 'var(--success-bg)' : 'var(--danger-bg)', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', borderLeft: `3px solid var(--${l.status === 'approved' ? 'success' : 'danger'})` }}>
                  <strong>Manager Note:</strong> {l.review_notes}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Apply Leave Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Apply for Leave</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleApply} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Leave Type *</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                    {[{ v: 'sick', l: '🤒 Sick' }, { v: 'casual', l: '☀️ Casual' }, { v: 'annual', l: '🏖️ Annual' }, { v: 'other', l: '📋 Other' }].map(opt => (
                      <button
                        key={opt.v}
                        type="button"
                        className={`btn ${form.leave_type === opt.v ? 'btn-primary' : 'btn-ghost'} btn-sm`}
                        style={{ justifyContent: 'center' }}
                        onClick={() => setForm(p => ({ ...p, leave_type: opt.v }))}
                      >
                        {opt.l}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div className="form-group">
                    <label className="form-label">From Date *</label>
                    <input
                      type="date"
                      className="input"
                      required
                      min={new Date().toISOString().split('T')[0]}
                      value={form.from_date}
                      onChange={e => setForm(p => ({ ...p, from_date: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">To Date *</label>
                    <input
                      type="date"
                      className="input"
                      required
                      min={form.from_date || new Date().toISOString().split('T')[0]}
                      value={form.to_date}
                      onChange={e => setForm(p => ({ ...p, to_date: e.target.value }))}
                    />
                  </div>
                </div>

                {form.from_date && form.to_date && form.to_date >= form.from_date && (
                  <div className="alert alert-info" style={{ padding: '8px 14px' }}>
                    📅 Duration: <strong>
                      {Math.round((new Date(form.to_date) - new Date(form.from_date)) / (1000 * 60 * 60 * 24) + 1)} day(s)
                    </strong>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Reason for Leave *</label>
                  <textarea
                    className="input"
                    required
                    rows={3}
                    placeholder="Please explain why you need this leave..."
                    value={form.reason}
                    onChange={e => setForm(p => ({ ...p, reason: e.target.value }))}
                  />
                </div>

                <div className="modal-footer" style={{ padding: 0, border: 'none' }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? '⏳ Submitting...' : '✅ Submit Application'}
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

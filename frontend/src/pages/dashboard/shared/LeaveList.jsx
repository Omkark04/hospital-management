import { useState, useEffect, useCallback } from 'react';
import { getLeaves, applyLeave, reviewLeave } from '../../../api/hr';
import { useAuth } from '../../../context/AuthContext';

const STATUS_COLORS = { pending: 'warning', approved: 'success', rejected: 'danger' };
const BADGE_TYPE = { sick: 'danger', casual: 'info', annual: 'success', other: 'secondary' };

export default function LeaveList() {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [showModal, setShowModal] = useState(false);
  const [reviewModal, setReviewModal] = useState(null);
  const [form, setForm] = useState({ leave_type: 'sick', from_date: '', to_date: '', reason: '' });
  const [reviewForm, setReviewForm] = useState({ status: 'approved', review_notes: '' });
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(() => {
    setLoading(true);
    getLeaves({ status: statusFilter || undefined })
      .then(({ data }) => setLeaves(data.results || data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [statusFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleApply = async (e) => {
    e.preventDefault();
    setSaving(true);
    try { await applyLeave(form); setShowModal(false); fetchData(); }
    catch (err) { alert(JSON.stringify(err.response?.data) || 'Failed.'); }
    finally { setSaving(false); }
  };

  const handleReview = async (e) => {
    e.preventDefault();
    setSaving(true);
    try { await reviewLeave(reviewModal.id, reviewForm); setReviewModal(null); fetchData(); }
    catch (err) { alert(err.response?.data?.detail || 'Failed.'); }
    finally { setSaving(false); }
  };

  const canReview = user?.role === 'owner' || user?.role === 'receptionist';
  const canApply = user?.role === 'employee' || user?.role === 'doctor';

  return (
    <div>
      <div className="page-header">
        <h2>Leave Requests</h2>
        <p>{ canReview ? 'Review leave applications.' : 'Your leave applications.' }</p>
        <div className="page-actions">
          <select className="input" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ maxWidth: 180 }}>
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          {canApply && <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Apply Leave</button>}
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
        ) : leaves.length === 0 ? (
          <div className="empty-state"><div className="icon">📝</div><p>No leave applications.</p></div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Type</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Days</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {leaves.map(l => (
                  <tr key={l.id}>
                    <td style={{ fontWeight: 600 }}>{l.employee_name}</td>
                    <td><span className={`badge badge-${BADGE_TYPE[l.leave_type] || 'primary'}`}>{l.leave_type}</span></td>
                    <td style={{ fontSize: '0.875rem' }}>{l.from_date}</td>
                    <td style={{ fontSize: '0.875rem' }}>{l.to_date}</td>
                    <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{l.total_days}</td>
                    <td><span className={`badge badge-${STATUS_COLORS[l.status]}`}>{l.status}</span></td>
                    <td>
                      {canReview && l.status === 'pending' && (
                        <button className="btn btn-ghost btn-sm" onClick={() => { setReviewModal(l); setReviewForm({ status: 'approved', review_notes: '' }); }}>
                          Review
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

      {/* Apply Leave Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Apply for Leave</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleApply} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Leave Type *</label>
                  <select className="input" value={form.leave_type} onChange={e => setForm(p => ({ ...p, leave_type: e.target.value }))}>
                    <option value="sick">Sick Leave</option>
                    <option value="casual">Casual Leave</option>
                    <option value="annual">Annual Leave</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div className="form-group">
                    <label className="form-label">From *</label>
                    <input type="date" className="input" required value={form.from_date} onChange={e => setForm(p => ({ ...p, from_date: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">To *</label>
                    <input type="date" className="input" required value={form.to_date} onChange={e => setForm(p => ({ ...p, to_date: e.target.value }))} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Reason *</label>
                  <textarea className="input" required rows={3} value={form.reason} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))} />
                </div>
                <div className="modal-footer" style={{ padding: 0, border: 'none' }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Submitting...' : 'Submit Application'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {reviewModal && (
        <div className="modal-overlay" onClick={() => setReviewModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Review: {reviewModal.employee_name}</h3>
              <button className="modal-close" onClick={() => setReviewModal(null)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ padding: 14, background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', marginBottom: 16, fontSize: '0.875rem' }}>
                <strong>{reviewModal.leave_type}</strong> — {reviewModal.from_date} to {reviewModal.to_date} ({reviewModal.total_days} days)<br />
                <span style={{ color: 'var(--text-muted)', marginTop: 6, display: 'block' }}>{reviewModal.reason}</span>
              </div>
              <form onSubmit={handleReview} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Decision *</label>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <button type="button" className={`btn ${reviewForm.status === 'approved' ? 'btn-success' : 'btn-ghost'}`} onClick={() => setReviewForm(p => ({ ...p, status: 'approved' }))}>✓ Approve</button>
                    <button type="button" className={`btn ${reviewForm.status === 'rejected' ? 'btn-danger' : 'btn-ghost'}`} onClick={() => setReviewForm(p => ({ ...p, status: 'rejected' }))}>✗ Reject</button>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <textarea className="input" rows={2} value={reviewForm.review_notes} onChange={e => setReviewForm(p => ({ ...p, review_notes: e.target.value }))} placeholder="Optional review notes..." />
                </div>
                <div className="modal-footer" style={{ padding: 0, border: 'none' }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setReviewModal(null)}>Cancel</button>
                  <button type="submit" className={`btn ${reviewForm.status === 'approved' ? 'btn-success' : 'btn-danger'}`} disabled={saving}>{saving ? 'Saving...' : 'Confirm Decision'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

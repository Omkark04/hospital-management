import { useCallback, useEffect, useState } from 'react';
import { FaBell, FaEnvelope, FaPaperPlane, FaSyncAlt } from 'react-icons/fa';
import { getAllNotifications, getMyNotifications, sendNotification } from '../../../api/notifications';
import { useAuth } from '../../../context/AuthContext';

const STATUS_COLORS = { sent: 'success', failed: 'danger', pending: 'warning' };
const TYPE_LABELS = {
  general: 'General',
  appointment_reminder: 'Appointment Reminder',
  bill_generated: 'Bill Generated',
  payment_received: 'Payment Received',
  prescription_ready: 'Prescription Ready',
  referral_update: 'Referral Update',
};

const INITIAL_FORM = {
  to_email: '',
  to_name: '',
  subject: '',
  message: '',
  notification_type: 'general',
};

export default function NotificationCenter() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [form, setForm] = useState(INITIAL_FORM);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState(null);
  const [sendError, setSendError] = useState('');

  const canSend = ['owner', 'doctor', 'receptionist'].includes(user?.role);
  const canViewAll = user?.role === 'owner';

  const fetchNotifications = useCallback(() => {
    setLoading(true);
    const params = { status: statusFilter || undefined };
    const request = canViewAll ? getAllNotifications(params) : getMyNotifications(params);

    request
      .then(({ data }) => setNotifications(data.results || data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [canViewAll, statusFilter]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const updateForm = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
    setSendError('');
    setSendResult(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSend) return;

    setSending(true);
    setSendError('');
    setSendResult(null);

    try {
      const { data } = await sendNotification(form);
      setSendResult(data);
      setForm(INITIAL_FORM);
      fetchNotifications();
    } catch (err) {
      setSendError(err.response?.data?.detail || 'Failed to send notification.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>Notifications</h2>
        <p>Send email notifications and review delivery history.</p>
        <div className="page-actions">
          <select className="input" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ maxWidth: 180 }}>
            <option value="">All Status</option>
            <option value="sent">Sent</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
          <button type="button" onClick={fetchNotifications} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <FaSyncAlt /> Refresh
          </button>
        </div>
      </div>

      {canSend && (
        <div className="card card-body" style={{ marginBottom: 20 }}>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Recipient Email</label>
              <input className="input" type="email" value={form.to_email} onChange={updateForm('to_email')} required />
            </div>
            <div className="form-group">
              <label className="form-label">Recipient Name</label>
              <input className="input" value={form.to_name} onChange={updateForm('to_name')} />
            </div>
            <div className="form-group">
              <label className="form-label">Type</label>
              <select className="input" value={form.notification_type} onChange={updateForm('notification_type')}>
                {Object.entries(TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Subject</label>
              <input className="input" value={form.subject} onChange={updateForm('subject')} required />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Message</label>
              <textarea className="input" value={form.message} onChange={updateForm('message')} required rows={5} style={{ resize: 'vertical' }} />
            </div>

            {sendError && (
              <div style={{ gridColumn: '1 / -1', color: 'var(--danger)', background: '#fef2f2', border: '1px solid #fee2e2', padding: 12, borderRadius: 8 }}>
                {sendError}
              </div>
            )}

            {sendResult && (
              <div style={{ gridColumn: '1 / -1', color: '#065f46', background: '#ecfdf5', border: '1px solid #d1fae5', padding: 12, borderRadius: 8 }}>
                Notification logged with status: {sendResult.status}
              </div>
            )}

            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary" disabled={sending} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FaPaperPlane /> {sending ? 'Sending...' : 'Send Email'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
        ) : notifications.length === 0 ? (
          <div className="empty-state"><div className="icon"><FaBell /></div><p>No notifications found.</p></div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Recipient</th>
                  <th>Type</th>
                  <th>Subject</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Sent</th>
                </tr>
              </thead>
              <tbody>
                {notifications.map(item => (
                  <tr key={item.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
                        <FaEnvelope style={{ color: 'var(--primary)' }} /> {item.recipient_name || item.recipient_email || 'User'}
                      </div>
                      {item.recipient_email && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>{item.recipient_email}</div>}
                    </td>
                    <td>{TYPE_LABELS[item.notification_type] || item.notification_type}</td>
                    <td style={{ maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.subject}</td>
                    <td>
                      <span className={`badge badge-${STATUS_COLORS[item.status] || 'secondary'}`}>{item.status}</span>
                      {item.error_message && <div style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: 4 }}>{item.error_message}</div>}
                    </td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{item.created_at?.split('T')[0]}</td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{item.sent_at?.split('T')[0] || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

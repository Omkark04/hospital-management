import { useState, useEffect, useCallback } from 'react';
import { getReferrals, updateReferralStatus } from '../../../api/referrals';

const STATUS_COLORS = { new: 'info', contacted: 'warning', registered: 'success', closed: 'secondary' };

export default function ReferralList() {
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [updating, setUpdating] = useState(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    getReferrals({ status: statusFilter || undefined })
      .then(({ data }) => setReferrals(data.results || data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [statusFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const changeStatus = async (id, status) => {
    setUpdating(id);
    try { await updateReferralStatus(id, { status }); fetchData(); }
    catch { alert('Failed to update.'); }
    finally { setUpdating(null); }
  };

  return (
    <div>
      <div className="page-header">
        <h2>Referrals</h2>
        <p>Manage patient referral submissions.</p>
        <div className="page-actions">
          <select className="input" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ maxWidth: 200 }}>
            <option value="">All Status</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="registered">Registered</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
        ) : referrals.length === 0 ? (
          <div className="empty-state"><div className="icon">🔗</div><p>No referrals found.</p></div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Patient</th><th>Phone</th><th>Referred By</th>
                  <th>Branch</th><th>Reason</th><th>Status</th><th>Date</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {referrals.map(r => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 600 }}>{r.patient_name}</td>
                    <td>{r.patient_phone}</td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {r.referred_by_user_name || r.referred_by_name || 'Anonymous'}
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>{r.branch || '—'}</td>
                    <td style={{ fontSize: '0.82rem', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.reason || '—'}
                    </td>
                    <td>
                      <span className={`badge badge-${STATUS_COLORS[r.status]}`}>{r.status}</span>
                    </td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{r.created_at?.split('T')[0]}</td>
                    <td>
                      <select
                        className="input"
                        value={r.status}
                        disabled={updating === r.id}
                        onChange={e => changeStatus(r.id, e.target.value)}
                        style={{ width: 130, padding: '6px 10px', fontSize: '0.8rem' }}
                      >
                        <option value="new">New</option>
                        <option value="contacted">Contacted</option>
                        <option value="registered">Registered</option>
                        <option value="closed">Closed</option>
                      </select>
                    </td>
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

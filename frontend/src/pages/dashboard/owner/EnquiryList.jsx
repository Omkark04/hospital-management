import { useState, useEffect, useCallback } from 'react';
import { getEnquiries, updateEnquiryStatus } from '../../../api/products';

const STATUS_COLORS = { new: 'info', responded: 'warning', closed: 'secondary' };

export default function EnquiryList() {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchData = useCallback(() => {
    setLoading(true);
    getEnquiries({ status: statusFilter || undefined })
      .then(({ data }) => setEnquiries(data.results || data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [statusFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const changeStatus = async (id, status) => {
    try { await updateEnquiryStatus(id, status); fetchData(); } catch { alert('Failed.'); }
  };

  return (
    <div>
      <div className="page-header">
        <h2>Product Enquiries</h2>
        <p>Customer enquiries from the product catalogue.</p>
        <div className="page-actions">
          <select className="input" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ maxWidth: 180 }}>
            <option value="">All</option>
            <option value="new">New</option>
            <option value="responded">Responded</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>
      <div className="card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
        ) : enquiries.length === 0 ? (
          <div className="empty-state"><div className="icon">💬</div><p>No enquiries found.</p></div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>Customer</th><th>Phone</th><th>Product</th><th>Message</th><th>Status</th><th>Date</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {enquiries.map(e => (
                  <tr key={e.id}>
                    <td style={{ fontWeight: 600 }}>{e.enquirer_name}</td>
                    <td>{e.enquirer_phone}</td>
                    <td style={{ fontSize: '0.875rem' }}>{e.product_name}</td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {e.message || '—'}
                    </td>
                    <td><span className={`badge badge-${STATUS_COLORS[e.status]}`}>{e.status}</span></td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{e.created_at?.split('T')[0]}</td>
                    <td>
                      <select
                        className="input"
                        value={e.status}
                        onChange={ev => changeStatus(e.id, ev.target.value)}
                        style={{ width: 130, padding: '6px 10px', fontSize: '0.8rem' }}
                      >
                        <option value="new">New</option>
                        <option value="responded">Responded</option>
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

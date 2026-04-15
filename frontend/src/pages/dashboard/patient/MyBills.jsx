import { useState, useEffect } from 'react';
import { getMyBills } from '../../../api/billing';

const STATUS_COLORS = { pending: 'danger', partial: 'warning', paid: 'success', cancelled: 'secondary' };

export default function MyBills() {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    getMyBills()
      .then(({ data }) => setBills(data.results || data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const totalDue = bills
    .filter(b => b.payment_status !== 'paid' && b.payment_status !== 'cancelled')
    .reduce((sum, b) => sum + parseFloat(b.balance_due || 0), 0);

  const totalPaid = bills
    .filter(b => b.payment_status === 'paid')
    .reduce((sum, b) => sum + parseFloat(b.total_amount || 0), 0);

  return (
    <div>
      <div className="page-header">
        <h2>My Bills</h2>
        <p>View all your billing statements and payment history.</p>
      </div>

      {/* Summary */}
      <div className="stats-grid" style={{ marginBottom: 28 }}>
        <div className="stat-card cyan">
          <div className="stat-icon" style={{ background: 'var(--primary-bg)' }}>🧾</div>
          <div className="stat-label">Total Bills</div>
          <div className="stat-value">{bills.length}</div>
        </div>
        <div className="stat-card green">
          <div className="stat-icon" style={{ background: 'var(--success-bg)' }}>✅</div>
          <div className="stat-label">Amount Paid</div>
          <div className="stat-value">₹{totalPaid.toFixed(0)}</div>
        </div>
        <div className="stat-card red">
          <div className="stat-icon" style={{ background: 'var(--danger-bg)' }}>⏳</div>
          <div className="stat-label">Amount Due</div>
          <div className="stat-value">₹{totalDue.toFixed(0)}</div>
        </div>
      </div>

      {/* Bills list */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
      ) : bills.length === 0 ? (
        <div className="empty-state card card-body"><div className="icon">🧾</div><p>No bills found.</p></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {bills.map(b => (
            <div
              key={b.id}
              className="card card-body"
              style={{ cursor: 'pointer', borderColor: selected?.id === b.id ? 'var(--primary)' : undefined }}
              onClick={() => setSelected(selected?.id === b.id ? null : b)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <span style={{ fontFamily: 'monospace', color: 'var(--primary)', fontWeight: 700, fontSize: '0.9rem' }}>Bill #{b.id}</span>
                    <span className={`badge badge-${STATUS_COLORS[b.payment_status]}`}>{b.payment_status}</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    📅 {b.created_at?.split('T')[0]} · 💳 {b.payment_method}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.4rem', color: b.payment_status === 'paid' ? 'var(--success)' : 'var(--text-primary)' }}>
                    ₹{b.total_amount}
                  </div>
                  {b.balance_due > 0 && (
                    <div style={{ fontSize: '0.78rem', color: 'var(--danger)' }}>₹{b.balance_due} due</div>
                  )}
                </div>
              </div>

              {/* Expanded items */}
              {selected?.id === b.id && b.items?.length > 0 && (
                <div style={{ marginTop: 16, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Items</div>
                  {b.items.map((item, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 'var(--radius-md)', background: 'var(--bg-card)', marginBottom: 6, fontSize: '0.875rem' }}>
                      <div>
                        <span style={{ fontWeight: 500 }}>{item.description}</span>
                        {item.medicine_name && <span style={{ color: 'var(--primary)', marginLeft: 8 }}>({item.medicine_name})</span>}
                        <span style={{ color: 'var(--text-muted)', marginLeft: 8 }}>× {item.quantity}</span>
                      </div>
                      <div style={{ fontWeight: 600 }}>₹{item.total_price}</div>
                    </div>
                  ))}
                  {b.discount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', color: 'var(--success)', fontSize: '0.875rem' }}>
                      <span>Discount</span>
                      <span>- ₹{b.discount}</span>
                    </div>
                  )}
                  {b.notes && <p style={{ marginTop: 8, fontSize: '0.8rem', color: 'var(--text-muted)' }}>📝 {b.notes}</p>}
                </div>
              )}

              {selected?.id !== b.id && b.payment_status !== 'paid' && (
                <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
                  <div className="alert alert-warning" style={{ padding: '6px 14px', fontSize: '0.82rem' }}>
                    Please visit the hospital reception to clear your dues.
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

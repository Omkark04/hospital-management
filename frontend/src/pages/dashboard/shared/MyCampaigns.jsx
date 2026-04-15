import { useState, useEffect } from 'react';
import { getMyCampaigns, getCampaignPatients, getCampaignSales, addCampaignSale } from '../../../api/campaigns';
import { useAuth } from '../../../context/AuthContext';

const STATUS_COLORS = { planned: 'secondary', active: 'success', completed: 'primary', cancelled: 'danger' };

export default function MyCampaigns() {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [patients, setPatients] = useState([]);
  const [sales, setSales] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [saleForm, setSaleForm] = useState({ item_name: '', quantity: 1, amount: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchFn = user?.role === 'owner'
      ? import('../../../api/campaigns').then(m => m.getCampaigns)
      : Promise.resolve(getMyCampaigns);

    getMyCampaigns()
      .then(({ data }) => setCampaigns(data.results || data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const selectCampaign = (c) => {
    setSelected(c);
    setDetailLoading(true);
    Promise.all([getCampaignPatients(c.id), getCampaignSales(c.id)])
      .then(([p, s]) => {
        setPatients(p.data.results || p.data);
        setSales(s.data.results || s.data);
      })
      .finally(() => setDetailLoading(false));
  };

  const handleSale = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await addCampaignSale(selected.id, saleForm);
      setShowSaleModal(false);
      const { data } = await getCampaignSales(selected.id);
      setSales(data.results || data);
      setSaleForm({ item_name: '', quantity: 1, amount: '' });
    } catch { alert('Failed to record sale.'); }
    finally { setSaving(false); }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>;

  return (
    <div>
      <div className="page-header">
        <h2>My Campaigns</h2>
        <p>Health camp activities you are managing.</p>
      </div>

      {campaigns.length === 0 ? (
        <div className="empty-state card card-body"><div className="icon">🎯</div><p>No campaigns assigned to you.</p></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: selected ? '320px 1fr' : '1fr', gap: 24 }}>
          {/* Campaign list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {campaigns.map(c => (
              <div
                key={c.id}
                className="card card-body"
                style={{ cursor: 'pointer', borderColor: selected?.id === c.id ? 'var(--primary)' : undefined }}
                onClick={() => selectCampaign(c)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <h4 style={{ fontSize: '1rem' }}>{c.name}</h4>
                  <span className={`badge badge-${STATUS_COLORS[c.status]}`}>{c.status}</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  📅 {c.start_date} → {c.end_date}
                </div>
                {c.location && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>📍 {c.location}</div>}
              </div>
            ))}
          </div>

          {/* Campaign detail */}
          {selected && (
            <div>
              <div className="card card-body" style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ marginBottom: 6 }}>{selected.name}</h3>
                    <p style={{ fontSize: '0.875rem' }}>{selected.objective || selected.description}</p>
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button className="btn btn-primary btn-sm" onClick={() => setShowSaleModal(true)}>+ Record Sale</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setSelected(null)}>✕ Close</button>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginTop: 16 }}>
                  <div style={{ textAlign: 'center', padding: 16, background: 'var(--primary-bg)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary)' }}>{patients.length}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Patients</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: 16, background: 'var(--success-bg)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--success)' }}>{sales.length}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Sales</div>
                  </div>
                  <div style={{ textAlign: 'center', padding: 16, background: 'var(--secondary-bg)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--secondary)' }}>
                      ₹{sales.reduce((sum, s) => sum + parseFloat(s.amount || 0), 0).toFixed(0)}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Total Revenue</div>
                  </div>
                </div>
              </div>

              {detailLoading ? (
                <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  {/* Patients */}
                  <div className="card">
                    <div className="card-header"><h4>🧑‍⚕️ Registered Patients ({patients.length})</h4></div>
                    <div className="card-body" style={{ padding: 0 }}>
                      {patients.length === 0 ? (
                        <div className="empty-state" style={{ padding: '24px' }}><p>No patients yet</p></div>
                      ) : (
                        patients.map(p => (
                          <div key={p.id} style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-card)' }}>
                            <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{p.patient_name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.patient_uhid}</div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Sales */}
                  <div className="card">
                    <div className="card-header"><h4>💰 Sales Records ({sales.length})</h4></div>
                    <div className="card-body" style={{ padding: 0 }}>
                      {sales.length === 0 ? (
                        <div className="empty-state" style={{ padding: '24px' }}><p>No sales yet</p></div>
                      ) : (
                        sales.map(s => (
                          <div key={s.id} style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-card)', display: 'flex', justifyContent: 'space-between' }}>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{s.item_name}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Qty: {s.quantity}</div>
                            </div>
                            <div style={{ fontWeight: 700, color: 'var(--success)' }}>₹{s.amount}</div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Sale Modal */}
      {showSaleModal && (
        <div className="modal-overlay" onClick={() => setShowSaleModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Record Sale — {selected?.name}</h3>
              <button className="modal-close" onClick={() => setShowSaleModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSale} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Item Name *</label>
                  <input className="input" required value={saleForm.item_name} onChange={e => setSaleForm(p => ({ ...p, item_name: e.target.value }))} placeholder="e.g. Ayurvedic kit" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div className="form-group">
                    <label className="form-label">Quantity *</label>
                    <input type="number" className="input" min={1} required value={saleForm.quantity} onChange={e => setSaleForm(p => ({ ...p, quantity: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Amount (₹) *</label>
                    <input type="number" className="input" required min={0} value={saleForm.amount} onChange={e => setSaleForm(p => ({ ...p, amount: e.target.value }))} />
                  </div>
                </div>
                <div className="modal-footer" style={{ padding: 0, border: 'none' }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setShowSaleModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-success" disabled={saving}>{saving ? 'Saving...' : '💰 Record Sale'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

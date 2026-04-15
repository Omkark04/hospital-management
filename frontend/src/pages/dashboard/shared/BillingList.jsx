import { useState, useEffect, useCallback } from 'react';
import { getBills, createBill, updatePayment } from '../../../api/billing';
import { getPatients } from '../../../api/patients';
import { getMedicines } from '../../../api/medicines';

const STATUS = { pending: 'danger', partial: 'warning', paid: 'success', cancelled: 'secondary' };

export default function BillingList() {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(null);
  const [patients, setPatients] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ patient: '', branch: '', payment_method: 'cash', notes: '', discount: 0, items: [{ description: '', medicine: '', quantity: 1, unit_price: '' }] });
  const [payForm, setPayForm] = useState({ paid_amount: '', payment_method: 'cash' });

  const fetchBills = useCallback(() => {
    setLoading(true);
    getBills({ status: statusFilter || undefined })
      .then(({ data }) => setBills(data.results || data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [statusFilter]);

  useEffect(() => { fetchBills(); }, [fetchBills]);

  const openCreate = () => {
    setForm({ patient: '', branch: '', payment_method: 'cash', notes: '', discount: 0, items: [{ description: '', medicine: '', quantity: 1, unit_price: '' }] });
    Promise.all([getPatients(), getMedicines()])
      .then(([p, m]) => { setPatients(p.data.results || p.data); setMedicines(m.data.results || m.data); });
    setShowCreateModal(true);
  };

  const addItem = () => setForm(p => ({ ...p, items: [...p.items, { description: '', medicine: '', quantity: 1, unit_price: '' }] }));
  const removeItem = (i) => setForm(p => ({ ...p, items: p.items.filter((_, idx) => idx !== i) }));
  const updateItem = (i, k, v) => setForm(p => { const items = [...p.items]; items[i] = { ...items[i], [k]: v }; return { ...p, items }; });

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createBill(form);
      setShowCreateModal(false);
      fetchBills();
    } catch (err) { alert(JSON.stringify(err.response?.data) || 'Failed to create bill.'); }
    finally { setSaving(false); }
  };

  const handlePay = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updatePayment(showPayModal.id, payForm);
      setShowPayModal(null);
      fetchBills();
    } catch { alert('Failed to update payment.'); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <div className="page-header">
        <h2>Billing</h2>
        <p>Manage patient invoices and payments.</p>
        <div className="page-actions">
          <select className="input" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ maxWidth: 180 }}>
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="partial">Partial</option>
            <option value="paid">Paid</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button className="btn btn-primary" onClick={openCreate}>+ Create Bill</button>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
        ) : bills.length === 0 ? (
          <div className="empty-state"><div className="icon">🧾</div><p>No bills found.</p></div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>Bill #</th><th>Patient</th><th>Total</th><th>Paid</th><th>Balance</th><th>Method</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {bills.map(b => (
                  <tr key={b.id}>
                    <td style={{ fontFamily: 'monospace', color: 'var(--primary)' }}>#{b.id}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{b.patient_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{b.patient_uhid}</div>
                    </td>
                    <td style={{ fontWeight: 700 }}>₹{b.total_amount}</td>
                    <td style={{ color: 'var(--success)' }}>₹{b.paid_amount}</td>
                    <td style={{ color: b.balance_due > 0 ? 'var(--danger)' : 'var(--success)', fontWeight: 600 }}>₹{b.balance_due}</td>
                    <td style={{ textTransform: 'capitalize', fontSize: '0.875rem' }}>{b.payment_method}</td>
                    <td><span className={`badge badge-${STATUS[b.payment_status] || 'primary'}`}>{b.payment_status}</span></td>
                    <td>
                      {b.payment_status !== 'paid' && b.payment_status !== 'cancelled' && (
                        <button className="btn btn-success btn-sm" onClick={() => { setPayForm({ paid_amount: b.total_amount - b.discount, payment_method: 'cash' }); setShowPayModal(b); }}>
                          💳 Pay
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

      {/* Create Bill Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" style={{ maxWidth: 700 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create Bill</h3>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div className="form-group">
                    <label className="form-label">Patient *</label>
                    <select className="input" required value={form.patient} onChange={e => setForm(p => ({ ...p, patient: e.target.value }))}>
                      <option value="">Select patient...</option>
                      {patients.map(p => <option key={p.id} value={p.id}>{p.first_name} {p.last_name} ({p.uhid})</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Payment Method</label>
                    <select className="input" value={form.payment_method} onChange={e => setForm(p => ({ ...p, payment_method: e.target.value }))}>
                      <option value="cash">Cash</option>
                      <option value="card">Card</option>
                      <option value="upi">UPI</option>
                      <option value="insurance">Insurance</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Items */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <label className="form-label">Bill Items *</label>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={addItem}>+ Add Item</button>
                  </div>
                  {form.items.map((item, i) => (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '3fr 2fr 1fr 1.5fr auto', gap: 8, marginBottom: 8, alignItems: 'end' }}>
                      <input className="input" placeholder="Description" value={item.description} onChange={e => updateItem(i, 'description', e.target.value)} required />
                      <select className="input" value={item.medicine} onChange={e => { const med = medicines.find(m => String(m.id) === e.target.value); updateItem(i, 'medicine', e.target.value); if (med) updateItem(i, 'unit_price', med.price); }}>
                        <option value="">No medicine</option>
                        {medicines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                      </select>
                      <input className="input" type="number" min={1} placeholder="Qty" value={item.quantity} onChange={e => updateItem(i, 'quantity', e.target.value)} />
                      <input className="input" type="number" placeholder="Unit price" value={item.unit_price} onChange={e => updateItem(i, 'unit_price', e.target.value)} required />
                      {form.items.length > 1 && <button type="button" className="btn btn-danger btn-sm" onClick={() => removeItem(i)}>×</button>}
                    </div>
                  ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div className="form-group">
                    <label className="form-label">Discount (₹)</label>
                    <input type="number" className="input" min={0} value={form.discount} onChange={e => setForm(p => ({ ...p, discount: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Notes</label>
                    <input className="input" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
                  </div>
                </div>

                <div className="modal-footer" style={{ padding: 0, border: 'none' }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setShowCreateModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Creating...' : 'Create Bill'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPayModal && (
        <div className="modal-overlay" onClick={() => setShowPayModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Record Payment — Bill #{showPayModal.id}</h3>
              <button className="modal-close" onClick={() => setShowPayModal(null)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16, padding: 16, background: 'var(--bg-card)', borderRadius: 'var(--radius-md)' }}>
                <div><span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Total</span><div style={{ fontWeight: 700 }}>₹{showPayModal.total_amount}</div></div>
                <div><span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Balance Due</span><div style={{ fontWeight: 700, color: 'var(--danger)' }}>₹{showPayModal.balance_due}</div></div>
              </div>
              <form onSubmit={handlePay} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Amount Paid (₹) *</label>
                  <input type="number" className="input" required min={1} value={payForm.paid_amount} onChange={e => setPayForm(p => ({ ...p, paid_amount: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Payment Method</label>
                  <select className="input" value={payForm.payment_method} onChange={e => setPayForm(p => ({ ...p, payment_method: e.target.value }))}>
                    <option value="cash">Cash</option><option value="card">Card</option><option value="upi">UPI</option><option value="insurance">Insurance</option>
                  </select>
                </div>
                <div className="modal-footer" style={{ padding: 0, border: 'none' }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setShowPayModal(null)}>Cancel</button>
                  <button type="submit" className="btn btn-success" disabled={saving}>{saving ? 'Processing...' : '💳 Confirm Payment'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

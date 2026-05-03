import { useState, useEffect, useCallback } from 'react';
import { getBills, createBill, updateBill, updatePayment, getBillPDF } from '../../../api/billing';
import { getPatients } from '../../../api/patients';
import { getMedicines } from '../../../api/medicines';
import { getPrescriptionProducts } from '../../../api/products';
import { FaFileInvoice, FaCreditCard, FaEdit, FaPlus, FaWhatsapp, FaCalendarAlt, FaHistory } from 'react-icons/fa';

const STATUS = { pending: 'danger', partial: 'warning', paid: 'success', cancelled: 'secondary' };

export default function BillingList() {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(null);
  const [showPayModal, setShowPayModal] = useState(null);
  const [patients, setPatients] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [products, setProducts] = useState([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ patient: '', branch: '', payment_method: 'cash', notes: '', discount: 0, items: [{ description: '', medicine: null, product: null, quantity: 1, unit_price: '' }] });
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
    setForm({ patient: '', branch: '', payment_method: 'cash', notes: '', discount: 0, items: [{ description: '', medicine: null, product: null, quantity: 1, unit_price: '' }] });
    Promise.all([getPatients(), getMedicines(), getPrescriptionProducts()])
      .then(([p, m, pr]) => { 
        setPatients(p.data.results || p.data); 
        setMedicines(m.data.results || m.data);
        setProducts(pr.data.results || pr.data);
      });
    setShowCreateModal(true);
  };

  const openEdit = (bill) => {
    setForm({
      patient: bill.patient,
      branch: bill.branch,
      payment_method: bill.payment_method,
      notes: bill.notes,
      discount: bill.discount,
      items: bill.items.map(i => ({ ...i }))
    });
    Promise.all([getPatients(), getMedicines(), getPrescriptionProducts()])
      .then(([p, m, pr]) => { 
        setPatients(p.data.results || p.data); 
        setMedicines(m.data.results || m.data);
        setProducts(pr.data.results || pr.data);
      });
    setShowEditModal(bill);
  };

  const addItem = () => setForm(p => ({ ...p, items: [...p.items, { description: '', medicine: null, product: null, quantity: 1, unit_price: '' }] }));
  const removeItem = (i) => setForm(p => ({ ...p, items: p.items.filter((_, idx) => idx !== i) }));
  const updateItem = (i, k, v) => setForm(p => { 
    const items = [...p.items]; 
    if (k === 'item_selection') {
      const type = v.split(':')[0];
      const id = v.split(':')[1];
      if (type === 'medicine') {
        const med = medicines.find(m => String(m.id) === id);
        items[i] = { ...items[i], medicine: id, product: null, unit_price: med?.price || 0, description: med?.name || '' };
      } else if (type === 'product') {
        const prod = products.find(x => String(x.id) === id);
        items[i] = { ...items[i], medicine: null, product: id, unit_price: prod?.final_price || 0, description: prod?.name || '' };
      } else {
        items[i] = { ...items[i], medicine: null, product: null };
      }
    } else {
      items[i] = { ...items[i], [k]: v === '' ? null : v }; 
    }
    return { ...p, items }; 
  });

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.patient) return alert('Please select a patient.');
    if (!form.branch) {
      const p = patients.find(x => String(x.id) === form.patient);
      if (p?.branch) form.branch = p.branch;
      else return alert('Patient branch not found. Please re-select the patient.');
    }

    setSaving(true);
    const payload = {
      ...form,
      items: form.items.map(item => ({
        ...item,
        medicine: item.medicine || null,
        product: item.product || null,
        unit_price: item.unit_price || 0
      }))
    };

    try {
      if (showEditModal) {
        await updateBill(showEditModal.id, payload);
        setShowEditModal(null);
      } else {
        await createBill(payload);
        setShowCreateModal(false);
      }
      fetchBills();
    } catch (err) {
      console.error('Billing Error Object:', err);
      const errorData = err.response?.data;
      const msg = errorData ? (typeof errorData === 'object' ? JSON.stringify(errorData) : errorData) : 'Failed to save bill. Check connection.';
      alert(`Error: ${msg}`);
      console.error('Billing Error Data:', errorData);
    }
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

  const handleDownloadPDF = async (bill) => {
    try {
      const { data } = await getBillPDF(bill.id, true);
      if (data.pdf_url) {
        // Trigger direct download using anchor tag
        const link = document.createElement('a');
        link.href = data.pdf_url;
        link.setAttribute('download', `bill_${bill.id}_${bill.patient_uhid}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        
        fetchBills();
      } else {
        alert('Could not retrieve PDF URL.');
      }
    } catch (err) {
      alert('Error fetching PDF. Make sure backend dependencies are installed.');
    }
  };

  const sendWhatsApp = (bill) => {
    const text = `Hello ${bill.patient_name}, your bill #${bill.id} for ₹${bill.total_amount} from Dr. SPINE & नस is ready.%0A%0APlease download it here: ${bill.pdf_url || '(Processing... please refresh)'}%0A%0AThank you!`;
    const url = `https://wa.me/91${bill.patient_phone || ''}?text=${text}`;
    window.open(url, '_blank');
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <FaFileInvoice style={{ color: 'var(--primary)' }} /> Clinical Billing
          </h2>
          <p>Generate invoices and track payments.</p>
        </div>
        <div className="page-actions">
          <select className="input" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ maxWidth: 180 }}>
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="partial">Partial</option>
            <option value="paid">Paid</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button className="btn btn-primary" onClick={openCreate} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <FaPlus /> Create Bill
          </button>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
        ) : bills.length === 0 ? (
          <div className="empty-state" style={{ padding: 60 }}>
            <div className="icon" style={{ fontSize: '3rem', marginBottom: 16, color: 'var(--primary)' }}><FaFileInvoice /></div>
            <h3>No bills yet</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>Invoices you create will appear here.</p>
            <button className="btn btn-primary" onClick={openCreate}>Create Your First Bill</button>
          </div>
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
                      <div style={{ display: 'flex', gap: 6 }}>
                        {b.payment_status !== 'paid' && b.payment_status !== 'cancelled' && (
                          <button className="btn btn-ghost btn-sm" onClick={() => openEdit(b)} title="Edit Bill">
                            <FaEdit />
                          </button>
                        )}
                        {b.payment_status !== 'paid' && b.payment_status !== 'cancelled' && (
                          <button className="btn btn-success btn-sm" onClick={() => { setPayForm({ paid_amount: b.total_amount - b.discount, payment_method: 'cash' }); setShowPayModal(b); }} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <FaCreditCard /> Pay
                          </button>
                        )}
                        <button className="btn btn-outline btn-sm" onClick={() => handleDownloadPDF(b)} title="Generate/Download PDF Invoice" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <FaFileInvoice /> Invoice
                        </button>
                        <button className="btn btn-ghost btn-sm" style={{ color: '#25D366', display: 'flex', alignItems: 'center', gap: 4 }} onClick={() => sendWhatsApp(b)} title="Send via WhatsApp">
                          <FaWhatsapp size={16} /> WhatsApp
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Bill Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="modal-overlay" onClick={() => { setShowCreateModal(false); setShowEditModal(null); }}>
          <div className="modal" style={{ maxWidth: 700 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{showEditModal ? `Edit Bill #${showEditModal.id}` : 'Create Bill'}</h3>
              <button className="modal-close" onClick={() => { setShowCreateModal(false); setShowEditModal(null); }}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div className="form-group">
                    <label className="form-label">Patient *</label>
                    <select className="input" required value={form.patient} onChange={e => {
                      const p = patients.find(x => String(x.id) === e.target.value);
                      setForm(prev => ({ ...prev, patient: e.target.value, branch: p?.branch || '' }));
                    }}>
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
                      <select 
                        className="input" 
                        value={item.medicine ? `medicine:${item.medicine}` : item.product ? `product:${item.product}` : ''} 
                        onChange={e => updateItem(i, 'item_selection', e.target.value)}
                      >
                        <option value="">Manual Entry / Other</option>
                        <optgroup label="Medicines">
                          {medicines.map(m => <option key={`m-${m.id}`} value={`medicine:${m.id}`}>{m.name}</option>)}
                        </optgroup>
                        <optgroup label="Products">
                          {products.map(p => <option key={`p-${p.id}`} value={`product:${p.id}`}>{p.name}</option>)}
                        </optgroup>
                      </select>
                      <input className="input" type="number" min={1} placeholder="Qty" value={item.quantity} onChange={e => updateItem(i, 'quantity', e.target.value)} />
                      <input className="input" type="number" placeholder="Unit price" value={item.unit_price} onChange={e => updateItem(i, 'unit_price', e.target.value)} required />
                      {form.items.length > 1 && <button type="button" className="btn btn-danger btn-sm" onClick={() => removeItem(i)}>×</button>}
                    </div>
                  ))}

                  {/* Total Calculation Display */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 24, marginTop: 16, padding: '12px', background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.9rem' }}>
                      <span style={{ opacity: 0.7 }}>Subtotal: </span>
                      <span style={{ fontWeight: 600 }}>₹{form.items.reduce((acc, item) => acc + (Number(item.quantity || 0) * Number(item.unit_price || 0)), 0).toFixed(2)}</span>
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#ef4444' }}>
                      <span style={{ opacity: 0.7 }}>Discount: </span>
                      <span style={{ fontWeight: 600 }}>-₹{Number(form.discount || 0).toFixed(2)}</span>
                    </div>
                    <div style={{ fontSize: '1.1rem', color: 'var(--primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ opacity: 0.8 }}>Final Total: </span>
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <span style={{ position: 'absolute', left: 10, fontSize: '1rem', opacity: 0.6 }}>₹</span>
                        <input 
                          type="number" 
                          className="input" 
                          step="0.01"
                          style={{ width: 140, fontWeight: 700, fontSize: '1.2rem', color: 'var(--primary)', padding: '6px 8px 6px 24px', border: '2px solid var(--primary-light)' }}
                          value={(form.items.reduce((acc, item) => acc + (Number(item.quantity || 0) * Number(item.unit_price || 0)), 0) - Number(form.discount || 0)).toFixed(2)}
                          onChange={e => {
                            const subtotal = form.items.reduce((acc, item) => acc + (Number(item.quantity || 0) * Number(item.unit_price || 0)), 0);
                            const val = Number(e.target.value);
                            const disc = subtotal - val;
                            setForm(p => ({ ...p, discount: disc > 0 ? disc.toFixed(2) : 0 }));
                          }}
                        />
                      </div>
                    </div>
                  </div>
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

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <button type="button" className="btn btn-ghost" onClick={() => { setShowCreateModal(false); setShowEditModal(null); }}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? 'Saving...' : showEditModal ? 'Update Bill' : 'Create Bill'}
                  </button>
                  {showEditModal && (
                    <button type="button" className="btn btn-outline" onClick={() => handleDownloadPDF(showEditModal)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <FaFileInvoice /> Generate PDF
                    </button>
                  )}
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
                  <button type="submit" className="btn btn-success" disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <FaCreditCard /> Confirm Payment
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

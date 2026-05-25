import React, { useState, useEffect } from 'react';
import { FaTimes, FaPrescriptionBottleAlt, FaFileInvoice, FaNotesMedical, FaSave, FaCheck, FaCalendarPlus, FaWhatsapp } from 'react-icons/fa';
import { getMedicines, createPrescription } from '../../../api/medicines';
import { getPrescriptionProducts } from '../../../api/products';
import { createBill, updatePayment } from '../../../api/billing';
import { createAppointment } from '../../../api/patients';
import api from '../../../api/axios';
import { useAuth } from '../../../context/AuthContext';

export default function ConsultationWorkspace({ appointment, onClose }) {
  const { user } = useAuth();
  const branchId = appointment.branch || user?.branch_id;
  const [activeTab, setActiveTab] = useState('prescription');
  const [medicines, setMedicines] = useState([]);
  const [products, setProducts] = useState([]);
  
  // Prescription State
  const [rxForm, setRxForm] = useState({ notes: '', items: [{ item_id: '', type: '', dosage: '', duration: '', instructions: '', quantity: 1 }] });
  const [rxSaved, setRxSaved] = useState(false);

  // Billing State
  const [billForm, setBillForm] = useState({ payment_method: 'cash', discount: 0, notes: '', items: [{ description: 'Consultation Fee', unit_price: 500, quantity: 1 }] });
  const [billSaved, setBillSaved] = useState(false);
  const [createdBill, setCreatedBill] = useState(null);

  // Follow-up State
  const [aptForm, setAptForm] = useState({ date: '', time: '', reason: 'Follow-up' });
  const [aptSaved, setAptSaved] = useState(false);

  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (branchId) {
      Promise.all([
        getMedicines({ branch: branchId }), 
        getPrescriptionProducts({ branch: branchId })
      ]).then(([m, p]) => {
        setMedicines(m.data.results || m.data);
        setProducts(p.data.results || p.data);
      });
    }
  }, [branchId]);

  useEffect(() => {
    if (aptForm.date && branchId) {
      setLoadingSlots(true);
      api.get(`/patients/public/available-slots/?date=${aptForm.date}&branch=${branchId}`)
        .then(res => {
          setAvailableSlots(res.data.slots || []);
        })
        .catch(err => {
          console.error(err);
          setAvailableSlots([]);
        })
        .finally(() => setLoadingSlots(false));
    } else {
      setAvailableSlots([]);
    }
  }, [aptForm.date, branchId]);

  // -- Prescription Logic --
  const addRxItem = () => setRxForm(p => ({ ...p, items: [...p.items, { item_id: '', type: '', dosage: '', duration: '', instructions: '', quantity: 1 }] }));
  const removeRxItem = (i) => setRxForm(p => ({ ...p, items: p.items.filter((_, idx) => idx !== i) }));
  
  const handleSaveRx = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        patient: appointment.patient,
        appointment: appointment.id,
        notes: rxForm.notes,
        items: rxForm.items.map(it => ({
          medicine: it.type === 'medicine' ? it.item_id : null,
          product: it.type === 'product' ? it.item_id : null,
          dosage: it.dosage,
          duration: it.duration,
          instructions: it.instructions,
          quantity: it.quantity
        }))
      };
      await createPrescription(payload);
      setRxSaved(true);
      
      // Auto-add medicines to bill
      const newBillItems = rxForm.items.map(it => {
        let price = 0, name = '';
        if (it.type === 'medicine') {
          const m = medicines.find(x => String(x.id) === String(it.item_id));
          price = m?.price || 0; name = m?.name || 'Medicine';
        } else if (it.type === 'product') {
          const p = products.find(x => String(x.id) === String(it.item_id));
          price = p?.final_price || 0; name = p?.name || 'Product';
        }
        return { description: name, medicine: it.type === 'medicine' ? it.item_id : null, product: it.type === 'product' ? it.item_id : null, unit_price: price, quantity: it.quantity };
      });
      setBillForm(p => ({ ...p, items: [...p.items, ...newBillItems] }));
      
      setActiveTab('billing');
    } catch (err) {
      alert('Failed to save prescription');
    } finally { setSaving(false); }
  };

  // -- Billing Logic --
  const addBillItem = () => setBillForm(p => ({ ...p, items: [...p.items, { description: '', unit_price: '', quantity: 1 }] }));
  const removeBillItem = (i) => setBillForm(p => ({ ...p, items: p.items.filter((_, idx) => idx !== i) }));

  const handleSaveBill = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        patient: appointment.patient,
        branch: branchId || '', // Will fallback to patient's branch in backend if empty
        payment_method: billForm.payment_method,
        discount: billForm.discount,
        notes: billForm.notes,
        items: billForm.items
      };
      const res = await createBill(payload);
      let newBill = res.data;

      const subtotal = billForm.items.reduce((acc, it) => acc + (it.unit_price * it.quantity), 0);
      const finalTotal = subtotal - billForm.discount;
      if (finalTotal > 0) {
        const updateRes = await updatePayment(newBill.id, { 
          paid_amount: finalTotal, 
          payment_method: billForm.payment_method 
        });
        newBill = updateRes.data;
      }
      setCreatedBill(newBill);
      setBillSaved(true);
    } catch (err) {
      alert('Failed to generate bill');
    } finally { setSaving(false); }
  };

  const handleDirectInvoiceDownload = async (bill) => {
    try {
      const res = await api.get(`/billing/${bill.id}/pdf/`, { 
        params: { download: 'true' }, 
        responseType: 'blob',
        timeout: 0 
      });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Invoice_${bill.id}_${bill.patient_uhid || 'document'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Error downloading binary invoice file directly.');
    }
  };

  const sendWhatsApp = (bill) => {
    const text = `Hello ${bill.patient_name}, your bill #${bill.id} for ₹${bill.total_amount} from Dr. SPINE & नस is ready.%0A%0APlease download it here: ${bill.pdf_url || '(Processing... please refresh)'}%0A%0AThank you!`;
    const url = `https://wa.me/91${bill.patient_phone || ''}?text=${text}`;
    window.open(url, '_blank');
  };

  // -- Appointment Logic --
  const handleSaveApt = async (e) => {
    e.preventDefault();
    if (!aptForm.time) {
      alert("Please select an available follow-up slot.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        patient: appointment.patient,
        branch: branchId,
        doctor: appointment.doctor,
        scheduled_date: aptForm.date,
        scheduled_time: aptForm.time,
        reason: aptForm.reason
      };
      await createAppointment(payload);
      setAptSaved(true);
      setTimeout(onClose, 1500);
    } catch (err) {
      alert('Failed to book follow-up appointment');
    } finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" style={{ background: 'rgba(0,0,0,0.8)', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="modal" style={{ width: '100%', maxWidth: '900px', height: '90vh', display: 'flex', flexDirection: 'column', padding: 0, borderRadius: '16px', overflow: 'hidden' }}>
        
        {/* Header */}
        <div style={{ padding: '16px 20px', background: 'var(--primary)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Consultation: {appointment.patient_name}</h3>
            <span style={{ fontSize: '0.85rem', opacity: 0.9 }}>{appointment.scheduled_time}</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.2rem', cursor: 'pointer' }}><FaTimes/></button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--bg-card)' }}>
          <button 
            style={{ flex: 1, padding: '16px', background: 'none', border: 'none', borderBottom: activeTab === 'prescription' ? '3px solid var(--primary)' : '3px solid transparent', color: activeTab === 'prescription' ? 'var(--primary)' : 'var(--text-muted)', fontWeight: 600, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, cursor: 'pointer' }}
            onClick={() => setActiveTab('prescription')}
          >
            <FaPrescriptionBottleAlt/> Prescription {rxSaved && <FaCheck color="var(--success)"/>}
          </button>
          <button 
            style={{ flex: 1, padding: '16px', background: 'none', border: 'none', borderBottom: activeTab === 'billing' ? '3px solid var(--primary)' : '3px solid transparent', color: activeTab === 'billing' ? 'var(--primary)' : 'var(--text-muted)', fontWeight: 600, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, cursor: 'pointer' }}
            onClick={() => setActiveTab('billing')}
          >
            <FaFileInvoice/> Billing {billSaved && <FaCheck color="var(--success)"/>}
          </button>
          <button 
            style={{ flex: 1, padding: '16px', background: 'none', border: 'none', borderBottom: activeTab === 'appointment' ? '3px solid var(--primary)' : '3px solid transparent', color: activeTab === 'appointment' ? 'var(--primary)' : 'var(--text-muted)', fontWeight: 600, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, cursor: 'pointer' }}
            onClick={() => setActiveTab('appointment')}
          >
            <FaCalendarPlus/> Follow-up {aptSaved && <FaCheck color="var(--success)"/>}
          </button>
        </div>

        {/* Content Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', background: 'var(--bg)' }}>
          
          {/* PRESCRIPTION TAB */}
          {activeTab === 'prescription' && (
            <form onSubmit={handleSaveRx}>
              {rxSaved && <div className="alert alert-success" style={{ marginBottom: 16 }}>Prescription saved successfully! Items added to billing.</div>}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, alignItems: 'center' }}>
                <h4 style={{ margin: 0 }}>Medicines & Products</h4>
                <button type="button" className="btn btn-ghost btn-sm" onClick={addRxItem}>+ Add Item</button>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                {rxForm.items.map((item, i) => (
                  <div key={i} className="card card-body" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong>Item #{i+1}</strong>
                      {rxForm.items.length > 1 && <button type="button" className="btn btn-danger btn-sm" style={{ padding: '2px 8px' }} onClick={() => removeRxItem(i)}>×</button>}
                    </div>
                    <div>
                      <label className="form-label">Medicine / Product</label>
                      <select className="input" required value={`${item.type}:${item.item_id}`} onChange={e => {
                          const [t, id] = e.target.value.split(':');
                          const newItems = [...rxForm.items];
                          newItems[i] = { ...newItems[i], type: t, item_id: id };
                          setRxForm({ ...rxForm, items: newItems });
                        }}>
                          <option value=":">Select Medicine/Product...</option>
                          <optgroup label="Medicines">{medicines.map(m => <option key={`m${m.id}`} value={`medicine:${m.id}`}>{m.name}</option>)}</optgroup>
                          <optgroup label="Products">{products.map(p => <option key={`p${p.id}`} value={`product:${p.id}`}>{p.name}</option>)}</optgroup>
                      </select>
                    </div>
                    <div className="quick-actions-grid">
                      <div>
                        <label className="form-label">Dosage</label>
                        <input className="input" placeholder="e.g., 1-0-1" value={item.dosage} onChange={e => { const items = [...rxForm.items]; items[i].dosage = e.target.value; setRxForm({...rxForm, items}); }} />
                      </div>
                      <div>
                        <label className="form-label">Duration</label>
                        <input className="input" placeholder="e.g., 5 days" value={item.duration} onChange={e => { const items = [...rxForm.items]; items[i].duration = e.target.value; setRxForm({...rxForm, items}); }} />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: 10 }}>
                      <div>
                        <label className="form-label">Qty</label>
                        <input type="number" min="1" className="input" placeholder="Qty" value={item.quantity} onChange={e => { const items = [...rxForm.items]; items[i].quantity = e.target.value; setRxForm({...rxForm, items}); }} />
                      </div>
                      <div>
                        <label className="form-label">Special Instructions</label>
                        <input className="input" placeholder="e.g., after food" value={item.instructions} onChange={e => { const items = [...rxForm.items]; items[i].instructions = e.target.value; setRxForm({...rxForm, items}); }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="form-group">
                <label className="form-label">Doctor's Notes</label>
                <textarea className="input" rows="3" value={rxForm.notes} onChange={e => setRxForm({...rxForm, notes: e.target.value})} placeholder="Any additional notes..."></textarea>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', fontSize: '1rem' }} disabled={saving}>
                {saving ? 'Saving...' : 'Save & Continue to Billing'}
              </button>
            </form>
          )}

          {/* BILLING TAB */}
          {activeTab === 'billing' && (
            <form onSubmit={handleSaveBill}>
              {billSaved && <div className="alert alert-success" style={{ marginBottom: 16 }}>Bill generated successfully!</div>}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, alignItems: 'center' }}>
                <h4 style={{ margin: 0 }}>Bill Details</h4>
                <button type="button" className="btn btn-ghost btn-sm" onClick={addBillItem}>+ Add Fee</button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                {billForm.items.map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input className="input" style={{ flex: 2 }} placeholder="Description" value={item.description} onChange={e => { const items = [...billForm.items]; items[i].description = e.target.value; setBillForm({...billForm, items}); }} required />
                    <input type="number" className="input" style={{ flex: 1 }} placeholder="Qty" value={item.quantity} onChange={e => { const items = [...billForm.items]; items[i].quantity = e.target.value; setBillForm({...billForm, items}); }} required min="1" />
                    <input type="number" className="input" style={{ flex: 1 }} placeholder="₹ Price" value={item.unit_price} onChange={e => { const items = [...billForm.items]; items[i].unit_price = e.target.value; setBillForm({...billForm, items}); }} required min="0" />
                    <button type="button" className="btn btn-danger btn-sm" style={{ padding: '8px' }} onClick={() => removeBillItem(i)}>×</button>
                  </div>
                ))}
              </div>

              <div className="card card-body" style={{ background: 'var(--bg-input)', marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.9rem' }}>
                  <span>Subtotal:</span>
                  <strong>₹{billForm.items.reduce((acc, it) => acc + (it.unit_price * it.quantity), 0).toFixed(2)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: '0.9rem' }}>Discount (₹):</span>
                  <input type="number" className="input input-sm" style={{ width: 100, textAlign: 'right' }} value={billForm.discount} onChange={e => setBillForm({...billForm, discount: e.target.value})} min="0" />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)', fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                  <span>Final Total:</span>
                  <span>₹{(billForm.items.reduce((acc, it) => acc + (it.unit_price * it.quantity), 0) - billForm.discount).toFixed(2)}</span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Payment Method</label>
                <select className="input" value={billForm.payment_method} onChange={e => setBillForm({...billForm, payment_method: e.target.value})}>
                  <option value="cash">Cash</option><option value="card">Card</option><option value="upi">UPI</option>
                </select>
              </div>

              {!billSaved ? (
                <button type="submit" className="btn btn-success" style={{ width: '100%', padding: '12px', fontSize: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }} disabled={saving}>
                  <FaFileInvoice /> {saving ? 'Processing...' : 'Generate & Pay Bill'}
                </button>
              ) : (
                <div style={{ display: 'flex', gap: 10 }}>
                  <button type="button" className="btn btn-outline" style={{ flex: 1, padding: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }} onClick={() => handleDirectInvoiceDownload(createdBill)}>
                    <FaFileInvoice /> Download Bill
                  </button>
                  <button type="button" className="btn" style={{ flex: 1, padding: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, background: '#25D366', color: 'white', border: 'none' }} onClick={() => sendWhatsApp(createdBill)}>
                    <FaWhatsapp size={20} /> Send via WhatsApp
                  </button>
                </div>
              )}
            </form>
          )}

          {/* APPOINTMENT TAB */}
          {activeTab === 'appointment' && (
            <form onSubmit={handleSaveApt}>
              {aptSaved && <div className="alert alert-success" style={{ marginBottom: 16 }}>Follow-up appointment booked successfully!</div>}
              <h4 style={{ marginBottom: 16 }}>Schedule Follow-up</h4>
              
              <div className="form-group">
                <label className="form-label">Date</label>
                <input type="date" className="input" required value={aptForm.date} onChange={e => setAptForm({...aptForm, date: e.target.value, time: ''})} />
              </div>

              {aptForm.date && (
                <div className="form-group" style={{ marginTop: 14 }}>
                  <label className="form-label">Available Slots</label>
                  {loadingSlots ? (
                    <div style={{ padding: 10, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Checking availability...</div>
                  ) : availableSlots.length === 0 ? (
                    <div style={{ padding: 10, textAlign: 'center', color: 'var(--text-muted)', background: 'var(--off-white)', borderRadius: 8, fontSize: '0.85rem' }}>
                      No slots available on this date. Please choose another date.
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10, maxHeight: '200px', overflowY: 'auto', padding: '4px' }}>
                      {availableSlots.map(slot => {
                        const isSelected = aptForm.time === slot.time;
                        const isFull = slot.available_capacity <= 0;
                        return (
                          <div 
                            key={slot.time}
                            onClick={() => !isFull && setAptForm(f => ({ ...f, time: slot.time }))}
                            style={{
                              padding: '10px',
                              borderRadius: 8,
                              cursor: isFull ? 'not-allowed' : 'pointer',
                              border: isSelected 
                                ? '2px solid var(--moss)' 
                                : isFull 
                                  ? '1px dashed var(--border)' 
                                  : '1px solid var(--border)',
                              background: isSelected 
                                ? 'rgba(5, 150, 105, 0.05)' 
                                : isFull 
                                  ? '#fafafa' 
                                  : '#fff',
                              opacity: isFull ? 0.6 : 1,
                              transition: 'all 0.2s',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 4
                            }}
                          >
                            <div style={{ fontWeight: 700, fontSize: '0.85rem', color: isSelected ? 'var(--moss)' : isFull ? 'var(--text-muted)' : 'var(--navy)' }}>
                              {slot.label}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                              <span>{slot.day}</span>
                              <span>{slot.date}</span>
                            </div>
                            <div style={{ 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              alignItems: 'center', 
                              marginTop: 4, 
                              paddingTop: 4, 
                              borderTop: '1px solid var(--border)',
                              fontSize: '0.75rem' 
                            }}>
                              <span style={{ color: 'var(--text-secondary)' }}>
                                {slot.patient_count} Booked
                              </span>
                              <span style={{ 
                                fontWeight: 600, 
                                color: isFull ? 'var(--danger)' : 'var(--success)'
                              }}>
                                {isFull ? 'Full' : `${slot.available_capacity} Left`}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Reason / Notes</label>
                <textarea className="input" rows="3" value={aptForm.reason} onChange={e => setAptForm({...aptForm, reason: e.target.value})} placeholder="Reason for follow-up..."></textarea>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', fontSize: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }} disabled={saving || aptSaved}>
                <FaCalendarPlus /> {saving ? 'Booking...' : 'Book Follow-up'}
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect, useCallback } from 'react';
import { FaTimes, FaPrescriptionBottleAlt, FaFileInvoice, FaNotesMedical, FaSave, FaCheck, FaCalendarPlus, FaWhatsapp, FaForward, FaLeaf, FaClipboardList } from 'react-icons/fa';
import { getMedicines, createPrescription } from '../../../api/medicines';
import { getPrescriptionProducts } from '../../../api/products';
import { createBill, updatePayment } from '../../../api/billing';
import { createAppointment } from '../../../api/patients';
import api from '../../../api/axios';
import { useAuth } from '../../../context/AuthContext';

function PatientHistoryPanel({ patientId }) {
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('medical'); // medical, prescriptions, bills, appointments, calls

  useEffect(() => {
    if (patientId) {
      setLoading(true);
      api.get(`/patients/${patientId}/full-history/`)
        .then(res => setHistory(res.data))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [patientId]);

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>;
  }

  if (!history) {
    return <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>Failed to load patient history.</div>;
  }

  const { patient, prescriptions, bills, appointments, call_logs } = history;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Mini Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--bg-light)', overflowX: 'auto' }}>
        {[
          { id: 'medical', label: 'Medical' },
          { id: 'prescriptions', label: 'Rx' },
          { id: 'bills', label: 'Bills' },
          { id: 'appointments', label: 'Apts' },
          { id: 'calls', label: 'Calls' }
        ].map(tab => (
          <button
            type="button"
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              padding: '12px 8px',
              border: 'none',
              background: 'none',
              borderBottom: activeTab === tab.id ? '2px solid var(--primary)' : '2px solid transparent',
              color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-muted)',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        {activeTab === 'medical' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Prakriti</span>
              <p style={{ margin: '2px 0 0', fontWeight: 600, textTransform: 'capitalize' }}>{patient.prakriti || 'Unknown'}</p>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Allergies</span>
              <p style={{ margin: '2px 0 0', color: patient.allergies ? 'var(--danger)' : 'var(--text)' }}>{patient.allergies || 'No known allergies'}</p>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Chronic Conditions</span>
              <p style={{ margin: '2px 0 0' }}>{patient.chronic_conditions || 'None'}</p>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Chief Complaint</span>
              <p style={{ margin: '2px 0 0' }}>{patient.chief_complaint || 'None'}</p>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Past Medical History</span>
              <p style={{ margin: '2px 0 0' }}>{patient.medical_history || 'None'}</p>
            </div>
          </div>
        )}

        {activeTab === 'prescriptions' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {prescriptions.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>No past prescriptions.</p>
            ) : (
              prescriptions.map(rx => (
                <div key={rx.id} className="card card-body" style={{ padding: '12px', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <strong>By Dr. {rx.doctor_name}</strong>
                    <span style={{ color: 'var(--text-muted)' }}>{new Date(rx.created_at).toLocaleDateString()}</span>
                  </div>
                  {rx.notes && <p style={{ fontStyle: 'italic', margin: '0 0 8px 0', background: 'var(--bg)', padding: '6px', borderRadius: '4px' }}>"{rx.notes}"</p>}
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                        <th style={{ textAlign: 'left', padding: '4px 0' }}>Item</th>
                        <th style={{ textAlign: 'left', padding: '4px 0' }}>Dosage</th>
                        <th style={{ textAlign: 'left', padding: '4px 0' }}>Duration</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rx.items.map((item, idx) => (
                        <tr key={idx}>
                          <td style={{ padding: '4px 0', fontWeight: 500 }}>{item.item_name}</td>
                          <td style={{ padding: '4px 0' }}>{item.dosage}</td>
                          <td style={{ padding: '4px 0' }}>{item.duration} ({item.instructions})</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'bills' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {bills.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>No past bills.</p>
            ) : (
              bills.map(bill => (
                <div key={bill.id} className="card card-body" style={{ padding: '12px', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <strong>Bill #{bill.id}</strong>
                    <span style={{ color: 'var(--text-muted)' }}>{new Date(bill.created_at).toLocaleDateString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 700, color: 'var(--primary)' }}>₹{parseFloat(bill.total_amount).toFixed(2)}</span>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      background: bill.payment_status === 'paid' ? 'var(--success-bg)' : 'var(--warning-bg)',
                      color: bill.payment_status === 'paid' ? 'var(--success)' : 'var(--warning)'
                    }}>
                      {bill.payment_status?.toUpperCase()}
                    </span>
                  </div>
                  {bill.items && bill.items.length > 0 && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {bill.items.map((it, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                          <span>{it.description} x{it.quantity}</span>
                          <span>₹{parseFloat(it.total_price).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'appointments' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {appointments.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>No past appointments.</p>
            ) : (
              appointments.map(apt => (
                <div key={apt.id} className="card card-body" style={{ padding: '12px', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <strong>{new Date(apt.scheduled_date).toLocaleDateString()} @ {apt.scheduled_time}</strong>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      background: apt.status === 'completed' ? 'var(--success-bg)' : apt.status === 'scheduled' ? 'var(--primary-light)' : 'var(--danger-bg)',
                      color: apt.status === 'completed' ? 'var(--success)' : apt.status === 'scheduled' ? 'var(--primary)' : 'var(--danger)'
                    }}>
                      {apt.status?.replace('_', ' ')?.toUpperCase()}
                    </span>
                  </div>
                  <p style={{ margin: 0, color: 'var(--text-muted)' }}>Reason: {apt.reason || 'Routine consultation'}</p>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'calls' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {call_logs.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>No telecalling call logs.</p>
            ) : (
              call_logs.map(log => (
                <div key={log.id} className="card card-body" style={{ padding: '12px', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <strong style={{ textTransform: 'capitalize' }}>{log.call_type?.replace('_', ' ')}</strong>
                    <span style={{ color: 'var(--text-muted)' }}>{new Date(log.timestamp).toLocaleDateString()}</span>
                  </div>
                  <p style={{ margin: '4px 0', fontStyle: 'italic' }}>"{log.note}"</p>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Called by: {log.caller_name || 'Staff'}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ConsultationWorkspace({ appointment, onClose }) {
  const { user } = useAuth();
  const branchId = appointment.branch || user?.branch_id;
  const [activeTab, setActiveTab] = useState('prescription');
  const [medicines, setMedicines] = useState([]);
  const [products, setProducts] = useState([]);
  
  // Prescription State
  const [rxForm, setRxForm] = useState({ notes: '', items: [] });
  const [rxSaved, setRxSaved] = useState(false);

  // Billing State
  const [billForm, setBillForm] = useState({ payment_method: 'cash', discount: 0, notes: '', items: [{ description: 'Consultation Fee', unit_price: 500, quantity: 1 }], udhari_due_date: '' });
  const [billSaved, setBillSaved] = useState(false);
  const [createdBill, setCreatedBill] = useState(null);

  // Follow-up State
  const [aptForm, setAptForm] = useState({ date: '', time: '', reason: 'Follow-up' });
  const [aptSaved, setAptSaved] = useState(false);

  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [saving, setSaving] = useState(false);

  // Patient History Drawer State
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);

  // Therapies State
  const [patientTherapies, setPatientTherapies] = useState([]);
  const [loadingPatientTherapies, setLoadingPatientTherapies] = useState(false);
  const [therapiesList, setTherapiesList] = useState([]);
  const [selectedTherapy, setSelectedTherapy] = useState(null);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSlots, setSelectedSlots] = useState({});
  const [slotsMap, setSlotsMap] = useState({});
  const [loadingSlotsMap, setLoadingSlotsMap] = useState(false);
  const [therapyNotes, setTherapyNotes] = useState('');
  const [assigningTherapy, setAssigningTherapy] = useState(false);

  const fetchPatientTherapies = useCallback(() => {
    if (appointment.patient) {
      setLoadingPatientTherapies(true);
      api.get(`/therapies/patient/${appointment.patient}/`)
        .then(res => setPatientTherapies(res.data.results || res.data))
        .catch(() => {})
        .finally(() => setLoadingPatientTherapies(false));
    }
  }, [appointment.patient]);

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
    fetchPatientTherapies();
    api.get('/therapies/')
      .then(res => setTherapiesList(res.data.results || res.data))
      .catch(() => {});
  }, [fetchPatientTherapies]);

  // Fetch slots for follow-up appointment date
  useEffect(() => {
    if (aptForm.date && branchId) {
      setLoadingSlots(true);
      api.get(`/patients/public/available-slots/?date=${aptForm.date}&branch=${branchId}`)
        .then(res => {
          setAvailableSlots(res.data.slots || []);
        })
        .catch(err => {

          setAvailableSlots([]);
        })
        .finally(() => setLoadingSlots(false));
    } else {
      setAvailableSlots([]);
    }
  }, [aptForm.date, branchId]);

  // Fetch slots for all dates when selectedTherapy or startDate changes
  useEffect(() => {
    if (selectedTherapy && startDate && branchId) {
      const dates = (selectedTherapy.timeline || []).map(row => {
        const d = new Date(startDate);
        d.setDate(d.getDate() + (parseInt(row.day_number) - 1));
        return d.toISOString().split('T')[0];
      });

      const uniqueDates = Array.from(new Set(dates));
      setLoadingSlotsMap(true);
      Promise.all(
        uniqueDates.map(date => 
          api.get(`/patients/public/available-slots/?date=${date}&branch=${branchId}`)
            .then(res => ({ date, slots: res.data.slots || [] }))
            .catch(() => ({ date, slots: [] }))
        )
      ).then(results => {
        const map = {};
        results.forEach(r => { map[r.date] = r.slots; });
        setSlotsMap(map);
      }).finally(() => setLoadingSlotsMap(false));
    } else {
      setSlotsMap({});
    }
  }, [selectedTherapy, startDate, branchId]);

  // -- Prescription Logic --
  const addRxItem = () => setRxForm(p => ({ ...p, items: [...p.items, { item_id: '', type: '', dosage: '', duration: '', instructions: '', quantity: 1 }] }));
  const removeRxItem = (i) => setRxForm(p => ({ ...p, items: p.items.filter((_, idx) => idx !== i) }));
  
  const handleSkipToBilling = () => {
    setRxSaved(true);
    setActiveTab('billing');
  };

  const handleSaveRx = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const validItems = rxForm.items.filter(it => it.item_id && it.type);
      
      const payload = {
        patient: appointment.patient,
        appointment: appointment.id,
        notes: rxForm.notes,
        items: validItems.map(it => ({
          medicine: it.type === 'medicine' ? it.item_id : null,
          product: it.type === 'product' ? it.item_id : null,
          dosage: it.dosage,
          duration: it.duration,
          instructions: it.instructions,
          quantity: it.quantity
        }))
      };
      
      if (validItems.length > 0) {
          await createPrescription(payload);
          // Auto-add medicines to bill
          const newBillItems = validItems.map(it => {
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
      }
      
      setRxSaved(true);
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
    if (billForm.payment_method === 'udhari' && !billForm.udhari_due_date) {
      alert('Please select a Promise to Pay Date.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        patient: appointment.patient,
        branch: branchId || '',
        payment_method: billForm.payment_method,
        discount: billForm.discount,
        notes: billForm.notes,
        items: billForm.items,
        is_udhari: billForm.payment_method === 'udhari',
        udhari_due_date: billForm.payment_method === 'udhari' ? billForm.udhari_due_date : null
      };
      const res = await createBill(payload);
      let newBill = res.data;

      const subtotal = billForm.items.reduce((acc, it) => acc + (it.unit_price * it.quantity), 0);
      const finalTotal = subtotal - billForm.discount;
      
      if (billForm.payment_method === 'udhari') {
        const updateRes = await updatePayment(newBill.id, { 
          paid_amount: 0, 
          payment_method: 'udhari' 
        });
        newBill = updateRes.data;
      } else if (finalTotal > 0) {
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

  // -- Therapies Logic --
  const handleUpdatePatientTherapyStatus = async (therapyId, newStatus) => {
    try {
      await api.patch(`/therapies/assigned/${therapyId}/`, { status: newStatus });
      fetchPatientTherapies();
    } catch {
      alert('Failed to update therapy status.');
    }
  };

  const handleAssignTherapy = async (e) => {
    e.preventDefault();
    if (!selectedTherapy) return;

    const missingSlots = [];
    const appointmentsPayload = [];
    selectedTherapy.timeline.forEach(row => {
      const d = new Date(startDate);
      d.setDate(d.getDate() + (parseInt(row.day_number) - 1));
      const dateStr = d.toISOString().split('T')[0];
      const selectedTime = selectedSlots[dateStr];
      if (!selectedTime) {
        missingSlots.push(`Day ${row.day_number}`);
      } else {
        appointmentsPayload.push({
          scheduled_date: dateStr,
          scheduled_time: selectedTime,
          doctor: appointment.doctor
        });
      }
    });

    if (missingSlots.length > 0) {
      alert(`Please select slot times for: ${missingSlots.join(', ')}`);
      return;
    }

    setAssigningTherapy(true);
    try {
      const payload = {
        patient: appointment.patient,
        therapy: selectedTherapy.id,
        start_date: startDate,
        notes: therapyNotes,
        appointments: appointmentsPayload
      };

      await api.post('/therapies/assign/', payload);
      alert('Therapy program assigned and appointments scheduled successfully!');
      setSelectedTherapy(null);
      setStartDate(new Date().toISOString().split('T')[0]);
      setSelectedSlots({});
      setTherapyNotes('');
      fetchPatientTherapies();
    } catch (err) {
      alert('Failed to assign therapy program: ' + JSON.stringify(err.response?.data || err.message));
    } finally {
      setAssigningTherapy(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ background: 'rgba(0,0,0,0.8)', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="modal" style={{ width: '100%', maxWidth: '900px', height: '90vh', display: 'flex', flexDirection: 'column', padding: 0, borderRadius: '16px', overflow: 'hidden', position: 'relative' }}>
        
        {/* Header */}
        <div style={{ padding: '16px 20px', background: 'var(--primary)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Consultation: {appointment.patient_name}</h3>
            <span style={{ fontSize: '0.85rem', opacity: 0.9 }}>{appointment.scheduled_time}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button 
              type="button"
              className="btn btn-sm"
              style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}
              onClick={() => setShowHistoryPanel(true)}
            >
              <FaClipboardList /> Patient History
            </button>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.2rem', cursor: 'pointer' }}><FaTimes/></button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--bg-card)' }}>
          <button 
            type="button"
            style={{ flex: 1, padding: '16px', background: 'none', border: 'none', borderBottom: activeTab === 'prescription' ? '3px solid var(--primary)' : '3px solid transparent', color: activeTab === 'prescription' ? 'var(--primary)' : 'var(--text-muted)', fontWeight: 600, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, cursor: 'pointer' }}
            onClick={() => setActiveTab('prescription')}
          >
            <FaPrescriptionBottleAlt/> Prescription {rxSaved && <FaCheck color="var(--success)"/>}
          </button>
          <button 
            type="button"
            style={{ flex: 1, padding: '16px', background: 'none', border: 'none', borderBottom: activeTab === 'billing' ? '3px solid var(--primary)' : '3px solid transparent', color: activeTab === 'billing' ? 'var(--primary)' : 'var(--text-muted)', fontWeight: 600, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, cursor: 'pointer' }}
            onClick={() => setActiveTab('billing')}
          >
            <FaFileInvoice/> Billing {billSaved && <FaCheck color="var(--success)"/>}
          </button>
          <button 
            type="button"
            style={{ flex: 1, padding: '16px', background: 'none', border: 'none', borderBottom: activeTab === 'therapies' ? '3px solid var(--primary)' : '3px solid transparent', color: activeTab === 'therapies' ? 'var(--primary)' : 'var(--text-muted)', fontWeight: 600, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, cursor: 'pointer' }}
            onClick={() => setActiveTab('therapies')}
          >
            <FaLeaf/> Therapies
          </button>
          <button 
            type="button"
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
                      <label className="form-label">Medicine / Product <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '0.8rem' }}>(optional)</span></label>
                      <select className="input" value={`${item.type}:${item.item_id}`} onChange={e => {
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

              {/* Empty state hint when no items added */}
              {rxForm.items.length === 0 && (
                <div style={{ textAlign: 'center', padding: '24px', background: 'var(--bg-card)', borderRadius: 12, border: '2px dashed var(--border)', marginBottom: 16 }}>
                  <div style={{ fontSize: '2rem', marginBottom: 8, color: 'var(--primary)', opacity: 0.4 }}><FaPrescriptionBottleAlt /></div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>No medicines added. Click <strong>+ Add Item</strong> to add, or skip directly to billing.</p>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Doctor's Notes</label>
                <textarea className="input" rows="3" value={rxForm.notes} onChange={e => setRxForm({...rxForm, notes: e.target.value})} placeholder="Any additional notes..."></textarea>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ flex: 1, padding: '12px', fontSize: '0.95rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, border: '1px solid var(--border)' }}
                  onClick={handleSkipToBilling}
                >
                  <FaForward size={14} /> Skip to Billing
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2, padding: '12px', fontSize: '0.95rem' }} disabled={saving}>
                  {saving ? 'Saving...' : rxForm.items.length === 0 ? 'Continue to Billing' : 'Save & Continue to Billing'}
                </button>
              </div>
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
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="upi">UPI</option>
                  <option value="udhari">Udhari (Credit)</option>
                </select>
              </div>

              {billForm.payment_method === 'udhari' && (
                <div className="form-group">
                  <label className="form-label">Promise to Pay Date (Due Date) *</label>
                  <input 
                    type="date" 
                    className="input" 
                    required 
                    value={billForm.udhari_due_date} 
                    onChange={e => setBillForm({...billForm, udhari_due_date: e.target.value})} 
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              )}

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

          {/* THERAPIES TAB */}
          {activeTab === 'therapies' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center' }}>
                <h4 style={{ margin: 0 }}>Active Therapies</h4>
                {!selectedTherapy && (
                  <button type="button" className="btn btn-primary btn-sm" onClick={() => setSelectedTherapy(therapiesList[0] || null)}>
                    + Assign Therapy
                  </button>
                )}
              </div>

              {selectedTherapy ? (
                <form onSubmit={handleAssignTherapy} className="card card-body" style={{ padding: '16px', gap: '14px', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h5 style={{ margin: 0 }}>Assign Therapy Program</h5>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSelectedTherapy(null)}>Cancel</button>
                  </div>

                  <div className="form-grid">
                    <div className="form-group">
                      <label className="form-label">Therapy *</label>
                      <select 
                        className="input" 
                        value={selectedTherapy.id}
                        onChange={e => {
                          const id = parseInt(e.target.value);
                          setSelectedTherapy(therapiesList.find(t => t.id === id));
                          setSelectedSlots({});
                        }}
                      >
                        {therapiesList.map(t => <option key={t.id} value={t.id}>{t.name} ({t.total_duration_days} days)</option>)}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Start Date *</label>
                      <input 
                        type="date" 
                        className="input" 
                        required 
                        value={startDate}
                        onChange={e => {
                          setStartDate(e.target.value);
                          setSelectedSlots({});
                        }}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Notes</label>
                    <textarea 
                      className="input" 
                      rows={2} 
                      placeholder="Special instructions for patient's therapy..."
                      value={therapyNotes}
                      onChange={e => setTherapyNotes(e.target.value)}
                    />
                  </div>

                  {/* Slot selection for timeline dates */}
                  <div>
                    <h5 style={{ marginBottom: '8px' }}>Select Slot for each session:</h5>
                    {loadingSlotsMap ? (
                      <div style={{ padding: 20, textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '400px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px' }}>
                        {selectedTherapy.timeline && selectedTherapy.timeline.length > 0 ? (
                          selectedTherapy.timeline.map((row, idx) => {
                            const d = new Date(startDate);
                            d.setDate(d.getDate() + (parseInt(row.day_number) - 1));
                            const dateStr = d.toISOString().split('T')[0];
                            const slots = slotsMap[dateStr] || [];
                            const formattedDate = d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

                            return (
                              <div key={idx} style={{ background: 'var(--bg)', borderRadius: '8px', padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '4px' }}>
                                  <div>
                                    <strong style={{ fontSize: '0.9rem' }}>Day {row.day_number} — {formattedDate}</strong>
                                    {row.session_label && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>{row.session_label}</div>}
                                  </div>
                                  {row.practices && (
                                    <span style={{ background: 'var(--primary-light)', color: 'var(--primary)', fontSize: '0.75rem', padding: '2px 8px', borderRadius: '4px', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={row.practices}>
                                      {row.practices}
                                    </span>
                                  )}
                                </div>

                                {/* Horizontal Slots Slider */}
                                <div style={{ 
                                  display: 'flex', 
                                  gap: '8px', 
                                  overflowX: 'auto', 
                                  paddingBottom: '6px',
                                  scrollbarWidth: 'thin',
                                  msOverflowStyle: 'none'
                                }}>
                                  {slots.length === 0 ? (
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', padding: '6px 0' }}>No slots available on this date.</span>
                                  ) : (
                                    slots.map(slot => {
                                      const isSelected = selectedSlots[dateStr] === slot.time;
                                      const isFull = slot.available_capacity <= 0;
                                      return (
                                        <button 
                                          type="button"
                                          key={slot.time}
                                          disabled={isFull}
                                          onClick={() => setSelectedSlots(prev => ({ ...prev, [dateStr]: slot.time }))}
                                          style={{
                                            flexShrink: 0,
                                            padding: '6px 12px',
                                            fontSize: '0.75rem',
                                            borderRadius: '6px',
                                            cursor: isFull ? 'not-allowed' : 'pointer',
                                            border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border)',
                                            background: isSelected ? 'var(--primary)' : isFull ? 'var(--bg)' : 'var(--bg-card)',
                                            color: isSelected ? 'white' : isFull ? 'var(--text-muted)' : 'var(--text)',
                                            fontWeight: isSelected ? 600 : 400
                                          }}
                                        >
                                          {slot.label} ({isFull ? 'Full' : `${slot.available_capacity} left`})
                                        </button>
                                      );
                                    })
                                  )}
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '16px', textAlign: 'center' }}>
                            This therapy program has no timeline sessions configured.
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <button 
                    type="submit" 
                    className="btn btn-primary" 
                    style={{ width: '100%', padding: '10px' }} 
                    disabled={assigningTherapy || (selectedTherapy.timeline || []).length === 0}
                  >
                    {assigningTherapy ? 'Assigning...' : 'Confirm & Schedule Therapy'}
                  </button>
                </form>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {loadingPatientTherapies ? (
                    <div style={{ textAlign: 'center', padding: '20px' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
                  ) : patientTherapies.length === 0 ? (
                    <div className="card card-body" style={{ textAlign: 'center', padding: '30px' }}>
                      <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🌿</div>
                      <p style={{ color: 'var(--text-muted)', margin: 0 }}>No active therapy programs assigned to this patient.</p>
                      <button type="button" className="btn btn-primary btn-sm" style={{ marginTop: '12px' }} onClick={() => setSelectedTherapy(therapiesList[0] || null)}>Assign Therapy</button>
                    </div>
                  ) : (
                    patientTherapies.map(pt => (
                      <div key={pt.id} className="card card-body" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <h5 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}><FaLeaf color="var(--primary)"/> {pt.therapy_name}</h5>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Assigned on: {pt.start_date} by Dr. {pt.assigned_by_name}</span>
                          </div>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            background: pt.status === 'active' ? 'var(--success-bg)' : pt.status === 'completed' ? 'var(--primary-light)' : 'var(--danger-bg)',
                            color: pt.status === 'active' ? 'var(--success)' : pt.status === 'completed' ? 'var(--primary)' : 'var(--danger)',
                            textTransform: 'uppercase'
                          }}>
                            {pt.status}
                          </span>
                        </div>
                        {pt.notes && <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>Notes: {pt.notes}</p>}

                        {/* Status Actions */}
                        <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                          {pt.status === 'active' && (
                            <>
                              <button type="button" className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={() => handleUpdatePatientTherapyStatus(pt.id, 'completed')}>Complete</button>
                              <button type="button" className="btn btn-ghost btn-sm" style={{ flex: 1, color: 'var(--warning)' }} onClick={() => handleUpdatePatientTherapyStatus(pt.id, 'paused')}>Pause</button>
                            </>
                          )}
                          {pt.status === 'paused' && (
                            <button type="button" className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={() => handleUpdatePatientTherapyStatus(pt.id, 'active')}>Resume</button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
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

      {/* Slide-in Patient History Drawer */}
      {showHistoryPanel && (
        <>
          <div 
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 108 }} 
            onClick={() => setShowHistoryPanel(false)}
          />
          <div 
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              bottom: 0,
              width: '450px',
              maxWidth: '100%',
              background: 'var(--bg-card)',
              boxShadow: '-4px 0 20px rgba(0,0,0,0.15)',
              zIndex: 109,
              display: 'flex',
              flexDirection: 'column',
              borderLeft: '1px solid var(--border)'
            }}
          >
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg)' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Patient History Panel</h3>
              <button type="button" onClick={() => setShowHistoryPanel(false)} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: 'var(--text)' }}>×</button>
            </div>
            <PatientHistoryPanel patientId={appointment.patient} />
          </div>
        </>
      )}
    </div>
  );
}

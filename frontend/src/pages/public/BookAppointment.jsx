import React, { useState, useEffect } from 'react';
import PublicNavbar from '../../components/layout/PublicNavbar';
import PublicFooter from '../../components/layout/PublicFooter';
import api from '../../api/axios';
import { FiCheckCircle, FiClock, FiCalendar, FiUser, FiPhone, FiMail, FiMapPin } from 'react-icons/fi';

const INITIAL = { 
  name: '', phone: '', email: '', message: '', 
  branch: '', department: '', treatment: '', 
  scheduled_date: '', scheduled_time: '' 
};

export default function BookAppointment() {
  const [form, setForm] = useState(INITIAL);
  const [branches, setBranches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [treatments, setTreatments] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Fetch master data
    api.get('/branches/public/').then(res => {
      const data = res.data.results || res.data;
      setBranches(data);
      if(data.length > 0) setForm(f => ({ ...f, branch: data[0].id }));
    }).catch(console.error);

    api.get('/patients/departments/').then(res => setDepartments(res.data.results || res.data)).catch(console.error);
  }, []);

  // Fetch treatments when department changes
  useEffect(() => {
    if (form.department) {
      api.get(`/patients/treatments/?department=${form.department}`)
        .then(res => setTreatments(res.data.results || res.data))
        .catch(console.error);
    } else {
      setTreatments([]);
    }
    setForm(f => ({ ...f, treatment: '' }));
  }, [form.department]);

  // Fetch slots when date or branch changes
  useEffect(() => {
    if (form.scheduled_date && form.branch) {
      setLoadingSlots(true);
      api.get(`/patients/public/available-slots/?date=${form.scheduled_date}&branch=${form.branch}`)
        .then(res => {
          setAvailableSlots(res.data.slots || []);
          setForm(f => ({ ...f, scheduled_time: '' })); // Reset time
        })
        .catch(err => {
          console.error(err);
          setAvailableSlots([]);
        })
        .finally(() => setLoadingSlots(false));
    } else {
      setAvailableSlots([]);
    }
  }, [form.scheduled_date, form.branch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.scheduled_time) {
      alert("Please select a time slot.");
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/patients/public/book/', form);
      setSent(true);
    } catch (err) {
      console.error(err);
      alert("There was an error booking your appointment. Please try again or call us.");
    } finally {
      setSubmitting(false);
    }
  };

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  // Get today's date formatted as YYYY-MM-DD for min date
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="public-layout">
      <PublicNavbar />
      <div style={{ paddingTop: 72 }}>
        <div className="page-banner">
          <div className="container" style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
            <div className="section-tag" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', borderColor: 'rgba(255,255,255,0.30)' }}>
              Online Booking
            </div>
            <h1 style={{ color: '#fff', marginTop: 16, marginBottom: 12, fontFamily: '"Cormorant Garamond", serif' }}>
              Schedule Your Visit
            </h1>
            <p style={{ color: 'rgba(255,252,240,0.85)', maxWidth: 500, margin: '0 auto', fontSize: '1.05rem' }}>
              Select a date and time that works best for you. Our specialist will be ready for your arrival.
            </p>
          </div>
        </div>

        <section className="section" style={{ background: 'var(--off-white)' }}>
          <div className="container" style={{ maxWidth: 800 }}>
            <div className="booking-card" style={{
              background: '#fff',
              borderRadius: 20, padding: 'var(--booking-padding, 40px 50px)',
              border: '1px solid var(--border)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.04)',
            }}>
              <style>{`
                @media (max-width: 640px) {
                  .booking-card { --booking-padding: 24px 20px; }
                }
              `}</style>
              {sent ? (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <div style={{ width: 80, height: 80, background: 'var(--success-bg)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                    <FiCheckCircle size={40} color="var(--moss)" />
                  </div>
                  <h2 style={{ marginBottom: 10, fontFamily: '"Cormorant Garamond", serif', color: 'var(--navy)' }}>
                    Appointment Confirmed!
                  </h2>
                  <p style={{ marginBottom: 28, color: 'var(--text-secondary)' }}>
                    Thank you, <strong>{form.name}</strong>. Your appointment is scheduled for {form.scheduled_date} at {form.scheduled_time}. We will send you a confirmation message shortly.
                  </p>
                  <button className="btn btn-primary" onClick={() => { setSent(false); setForm(INITIAL); }}>
                    Book Another Appointment
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  
                  {/* Step 1: Services */}
                  <div>
                    <h4 style={{ borderBottom: '1px solid var(--border)', paddingBottom: 10, marginBottom: 20, color: 'var(--navy)' }}>1. What do you need help with?</h4>
                    <div className="responsive-grid-2" style={{ gap: 16 }}>
                      <div className="form-group">
                        <label className="form-label">Branch *</label>
                        <select className="input" required value={form.branch} onChange={set('branch')}>
                          <option value="">Select Branch</option>
                          {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Department</label>
                        <select className="input" value={form.department} onChange={set('department')}>
                          <option value="">Select Department</option>
                          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                      </div>
                      <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                        <label className="form-label">Treatment Type</label>
                        <select className="input" value={form.treatment} onChange={set('treatment')}>
                          <option value="">Select Treatment</option>
                          {treatments.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Step 2: Date & Time */}
                  <div>
                    <h4 style={{ borderBottom: '1px solid var(--border)', paddingBottom: 10, marginBottom: 20, color: 'var(--navy)' }}>2. Choose Date & Time</h4>
                    <div className="form-group">
                      <label className="form-label">Preferred Date *</label>
                      <input type="date" required min={today} className="input" value={form.scheduled_date} onChange={set('scheduled_date')} />
                    </div>
                    
                    {form.scheduled_date && (
                      <div className="form-group" style={{ marginTop: 20 }}>
                        <label className="form-label">Available Slots *</label>
                        {loadingSlots ? (
                          <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>Checking availability...</div>
                        ) : availableSlots.length === 0 ? (
                          <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', background: 'var(--off-white)', borderRadius: 8 }}>
                            No slots available on this date. Please choose another date.
                          </div>
                        ) : (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10 }}>
                            {availableSlots.map(slot => (
                              <div 
                                key={slot.time}
                                onClick={() => setForm(f => ({ ...f, scheduled_time: slot.time }))}
                                style={{
                                  padding: '12px',
                                  textAlign: 'center',
                                  borderRadius: 8,
                                  cursor: 'pointer',
                                  border: form.scheduled_time === slot.time ? '2px solid var(--moss)' : '1px solid var(--border)',
                                  background: form.scheduled_time === slot.time ? 'rgba(5, 150, 105, 0.05)' : '#fff',
                                  transition: 'all 0.2s'
                                }}
                              >
                                <div style={{ fontWeight: 600, color: form.scheduled_time === slot.time ? 'var(--moss)' : 'var(--navy)' }}>
                                  {slot.time.slice(0, 5)}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                                  {slot.available_capacity} slots left
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Step 3: Patient Info */}
                  <div>
                    <h4 style={{ borderBottom: '1px solid var(--border)', paddingBottom: 10, marginBottom: 20, color: 'var(--navy)' }}>3. Your Details</h4>
                    <div className="responsive-grid-2" style={{ gap: 16 }}>
                      <div className="form-group">
                        <label className="form-label">Full Name *</label>
                        <div style={{ position: 'relative' }}>
                          <FiUser size={14} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                          <input className="input" required placeholder="Your name" value={form.name} onChange={set('name')} style={{ paddingLeft: 36 }} />
                        </div>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Phone Number *</label>
                        <div style={{ position: 'relative' }}>
                          <FiPhone size={14} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                          <input className="input" type="tel" required placeholder="+91 XXXXX XXXXX" value={form.phone} onChange={set('phone')} style={{ paddingLeft: 36 }} />
                        </div>
                      </div>
                    </div>
                    <div className="form-group" style={{ marginTop: 16 }}>
                      <label className="form-label">Email Address</label>
                      <div style={{ position: 'relative' }}>
                        <FiMail size={14} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                        <input className="input" type="email" placeholder="your@email.com" value={form.email} onChange={set('email')} style={{ paddingLeft: 36 }} />
                      </div>
                    </div>
                    <div className="form-group" style={{ marginTop: 16 }}>
                      <label className="form-label">Briefly describe your condition (Optional)</label>
                      <textarea className="input" rows={3} value={form.message} onChange={set('message')} />
                    </div>
                  </div>

                  <button type="submit" className="btn btn-primary btn-lg" style={{ marginTop: 10 }} disabled={submitting}>
                    {submitting ? 'Confirming...' : 'Confirm Appointment'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>
      </div>
      <PublicFooter />
    </div>
  );
}

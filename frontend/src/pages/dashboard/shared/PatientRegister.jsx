import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPatient, getDepartments, getTreatments, createAppointment } from '../../../api/patients';
import api from '../../../api/axios';
import { useAuth } from '../../../context/AuthContext';
import { FaCheckCircle, FaHourglassHalf, FaExclamationTriangle, FaCalendarAlt, FaUser, FaLeaf, FaFirstAid, FaHospital, FaStethoscope } from 'react-icons/fa';
import ConsultationWorkspace from '../doctor/ConsultationWorkspace';

const INITIAL = {
  first_name: '', last_name: '', phone: '', email: '',
  gender: 'other', blood_group: 'unknown', dob: '',
  address: '', emergency_contact_name: '', emergency_contact_phone: '',
  medical_history: '', allergies: '', chronic_conditions: '', branch: '',
  primary_department: '', interested_treatment: '', prakriti: 'unknown', chief_complaint: ''
};

// ⚠️ IMPORTANT: Keep Field defined OUTSIDE PatientRegister so React treats it as
// a stable component. If defined inside, every keystroke causes React to unmount
// and remount the input (new component reference), which kills focus mid-typing.
function Field({ label, name, type = 'text', required, options, span, form, onChange }) {
  return (
    <div className="form-group" style={span ? { gridColumn: '1 / -1' } : {}}>
      <label className="form-label">{label}{required && <span style={{ color: 'var(--danger)', marginLeft: 3 }}>*</span>}</label>
      {options ? (
        <select className="input" name={name} value={form[name]} onChange={onChange} required={required}>
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : type === 'textarea' ? (
        <textarea className="input" name={name} value={form[name]} onChange={onChange} rows={2} />
      ) : (
        <input className="input" type={type} name={name} value={form[name]} onChange={onChange} required={required} />
      )}
    </div>
  );
}

// Safe today string — computed once at module load to avoid re-computation
// and to prevent the "62026" year corruption issue on mobile browsers.
function getTodayISO() {
  const d = new Date();
  // Pad month and day to always produce YYYY-MM-DD
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Validate that a date string is a plausible YYYY-MM-DD and year is sane
function isValidDateString(val) {
  if (!val || typeof val !== 'string') return false;
  const match = val.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return false;
  const year = parseInt(match[1], 10);
  return year >= 2000 && year <= 2100;
}

export default function PatientRegister() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ ...INITIAL, branch: user?.branch_id || '' });

  const [departments, setDepartments] = useState([]);
  const [treatments, setTreatments] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);

  // Appointment states
  const [bookAppointment, setBookAppointment] = useState(false);
  const [branches, setBranches] = useState([]);
  const [aptBranch, setAptBranch] = useState(user?.branch_id || '');
  const [aptDate, setAptDate] = useState('');
  const [aptTime, setAptTime] = useState('');
  const [aptReason, setAptReason] = useState('Consultation');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [showConsultModal, setShowConsultModal] = useState(false);

  const todayISO = getTodayISO();

  useEffect(() => {
    getDepartments().then(({ data }) => setDepartments(data.results || data)).catch(() => {});
    
    // Fetch branches
    api.get('/branches/public/')
      .then(({ data }) => setBranches(data.results || data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (user?.branch_id) {
      setAptBranch(user.branch_id);
      setForm(p => ({ ...p, branch: user.branch_id }));
    }
  }, [user?.branch_id]);

  useEffect(() => {
    if (form.primary_department) {
      getTreatments(form.primary_department).then(({ data }) => setTreatments(data.results || data)).catch(() => {});
    } else {
      setTreatments([]);
    }
  }, [form.primary_department]);

  // Fetch available slots when branch or date changes.
  // Guard against malformed dates (e.g. "62026-05-01" from mobile browser year quirk).
  useEffect(() => {
    if (aptDate && aptBranch && isValidDateString(aptDate)) {
      setLoadingSlots(true);
      api.get(`/patients/public/available-slots/?date=${aptDate}&branch=${aptBranch}`)
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
  }, [aptDate, aptBranch]);

  const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.first_name || !form.phone) {
      setError('First name and phone are required.');
      return;
    }
    if (user?.role === 'owner' && !form.branch) {
      setError('Please select the patient branch.');
      return;
    }
    if (bookAppointment) {
      if (!aptBranch) {
        setError('Please select a branch for the appointment.');
        return;
      }
      if (!aptDate) {
        setError('Please select a preferred date for the appointment.');
        return;
      }
      if (!aptTime) {
        setError('Please select an available time slot.');
        return;
      }
    }
    setSaving(true);
    try {
      // Build clean payload: strip empty strings for FK/date fields so backend
      // doesn't receive "" for fields that expect an integer or date.
      const payload = { ...form };
      if (!payload.dob) delete payload.dob;
      if (!payload.primary_department) delete payload.primary_department;
      if (!payload.interested_treatment) delete payload.interested_treatment;
      // branch is auto-assigned server-side, but send it if we have it
      if (!payload.branch) delete payload.branch;

      const { data: patientData } = await createPatient(payload);

      let appointmentData = null;
      if (bookAppointment) {
        const aptPayload = {
          patient: patientData.id,
          branch: aptBranch,
          scheduled_date: aptDate,
          scheduled_time: aptTime,
          reason: aptReason || 'Consultation'
        };
        if (user?.role === 'doctor') aptPayload.doctor = user.id;
        const { data: createdApt } = await createAppointment(aptPayload);
        appointmentData = {
          ...createdApt,
          patient_name: `${patientData.first_name} ${patientData.last_name}`
        };
      }

      setSuccess({
        patient: patientData,
        appointment: appointmentData
      });
    } catch (err) {
      const d = err.response?.data;
      setError(d?.phone?.[0] || d?.branch?.[0] || d?.detail || JSON.stringify(d) || 'Registration/booking failed.');
    } finally {
      setSaving(false);
    }
  };

  if (success) {
    const patient = success.patient;
    const appointment = success.appointment;

    return (
      <div>
        <div className="page-header"><h2>Register Patient</h2></div>
        <div style={{ maxWidth: 540, margin: '40px auto', textAlign: 'center' }}>
          <div style={{ fontSize: '4rem', marginBottom: 16, color: 'var(--success)' }}><FaCheckCircle /></div>
          <h2 style={{ marginBottom: 8 }}>
            {appointment ? 'Patient Registered & Appointment Booked!' : 'Patient Registered!'}
          </h2>
          <p style={{ marginBottom: 16 }}>
            <strong>{patient.first_name} {patient.last_name}</strong> has been registered.
          </p>
          
          <div style={{ marginBottom: 24, padding: '16px', background: 'var(--primary-bg)', borderRadius: 'var(--radius-md)', display: 'inline-block' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>UNIQUE HEALTH ID</div>
            <div style={{ fontFamily: 'monospace', fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>{patient.uhid}</div>
          </div>

          {appointment && (
            <div className="card card-body" style={{ margin: '0 auto 24px', maxWidth: '400px', textAlign: 'left', border: '1px dashed var(--primary)' }}>
              <h4 style={{ color: 'var(--primary)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}><FaCalendarAlt /> Scheduled Appointment</h4>
              <div style={{ fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div><strong>Branch:</strong> {appointment.branch_name || branches.find(b => String(b.id) === String(appointment.branch))?.name || 'Main Branch'}</div>
                <div><strong>Date:</strong> {appointment.scheduled_date}</div>
                <div><strong>Time Slot:</strong> {appointment.scheduled_time}</div>
                {appointment.reason && <div><strong>Reason:</strong> {appointment.reason}</div>}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            {appointment && user?.role === 'doctor' && (
              <button 
                className="btn btn-primary" 
                onClick={() => setShowConsultModal(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 24px', fontSize: '1.05rem' }}
              >
                <FaStethoscope /> Start Consultation
              </button>
            )}
            <button 
              className={`btn ${(appointment && user?.role === 'doctor') ? 'btn-secondary' : 'btn-primary'}`} 
              onClick={() => { 
                setSuccess(null); 
                setForm({ ...INITIAL, branch: user?.branch_id || '' }); 
                setBookAppointment(false);
                setAptDate('');
                setAptTime('');
                setAptReason('Consultation');
              }}
            >
              Register Another
            </button>
            <button className="btn btn-ghost" onClick={() => navigate('/dashboard/patients')}>
              View All Patients
            </button>
          </div>
        </div>

        {showConsultModal && appointment && user?.role === 'doctor' && (
          <ConsultationWorkspace 
            appointment={appointment} 
            onClose={() => {
              setShowConsultModal(false);
              setSuccess(null);
              setForm({ ...INITIAL, branch: user?.branch_id || '' });
              setBookAppointment(false);
              setAptDate('');
              setAptTime('');
              setAptReason('Consultation');
              navigate('/dashboard/patients');
            }} 
          />
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h2>Register New Patient</h2>
        <p>Fill out the patient details. UHID will be auto-generated on save.</p>
      </div>

      <form onSubmit={handleSubmit}>
        {error && <div className="alert alert-danger" style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}><FaExclamationTriangle /> {error}</div>}

        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 16 }}>
          Fields marked <span style={{ color: 'var(--danger)', fontWeight: 700 }}>*</span> are required.
        </div>

        {/* Section 1: Basic Info */}
        <div className="card card-body" style={{ marginBottom: 20 }}>
          <h4 style={{ marginBottom: 20, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 6 }}><FaUser /> Personal Information</h4>
          <div className="form-grid">
            <Field label="First Name" name="first_name" required form={form} onChange={handleChange} />
            <Field label="Last Name" name="last_name" form={form} onChange={handleChange} />
            <Field label="Phone" name="phone" required form={form} onChange={handleChange} />
            <Field label="Email" name="email" type="email" form={form} onChange={handleChange} />
            <Field label="Date of Birth" name="dob" type="date" form={form} onChange={handleChange} />
            <Field label="Gender" name="gender" form={form} onChange={handleChange} options={[
              { value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }, { value: 'other', label: 'Other' }
            ]} />
            {user?.role === 'owner' && (
              <div className="form-group">
                <label className="form-label">Branch<span style={{ color: 'var(--danger)', marginLeft: 3 }}>*</span></label>
                <select
                  className="input"
                  name="branch"
                  value={form.branch}
                  onChange={e => {
                    handleChange(e);
                    setAptBranch(e.target.value);
                    setAptTime('');
                  }}
                  required
                >
                  <option value="">Select Branch</option>
                  {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
            )}
            <Field label="Blood Group" name="blood_group" form={form} onChange={handleChange} options={[
              { value: 'unknown', label: 'Unknown' }, { value: 'A+', label: 'A+' }, { value: 'A-', label: 'A-' },
              { value: 'B+', label: 'B+' }, { value: 'B-', label: 'B-' }, { value: 'AB+', label: 'AB+' },
              { value: 'AB-', label: 'AB-' }, { value: 'O+', label: 'O+' }, { value: 'O-', label: 'O-' },
            ]} />

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Address</label>
              <input className="input" name="address" value={form.address} onChange={handleChange} />
            </div>
          </div>
        </div>

        {/* Step 2 Toggle: Inline Appointment Booking Option */}
        <div className="card card-body" style={{ marginBottom: 20, border: bookAppointment ? '1.5px solid var(--moss)' : '1px solid var(--border)' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', margin: 0 }}>
            <input 
              type="checkbox" 
              checked={bookAppointment} 
              onChange={e => setBookAppointment(e.target.checked)} 
              style={{ width: 20, height: 20, cursor: 'pointer', accentColor: 'var(--moss)' }}
            />
            <div>
              <strong style={{ fontSize: '1.05rem', color: bookAppointment ? 'var(--moss)' : 'var(--navy)', display: 'flex', alignItems: 'center', gap: 6 }}><FaCalendarAlt /> Book Appointment Immediately</strong>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 2 }}>Automatically schedule a visit/consultation slot for this patient after registering.</div>
            </div>
          </label>

          {bookAppointment && (
            <div style={{ marginTop: 20, borderTop: '1px solid var(--border)', paddingTop: 20 }}>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Branch *</label>
                  <select
                    className="input"
                    required={bookAppointment}
                    value={aptBranch}
                    onChange={e => {
                      setAptBranch(e.target.value);
                      setForm(p => ({ ...p, branch: e.target.value }));
                      setAptTime('');
                    }}
                    disabled={!!user?.branch_id || user?.role === 'owner'}
                  >
                    <option value="">Select Branch...</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Preferred Date *</label>
                  <input
                    type="date"
                    className="input"
                    required={bookAppointment}
                    min={todayISO}
                    max="2100-12-31"
                    value={aptDate}
                    onChange={e => {
                      // Reject dates with corrupted years (mobile browser quirk: e.g. 62026)
                      if (e.target.value && !isValidDateString(e.target.value)) return;
                      setAptDate(e.target.value);
                      setAptTime('');
                    }}
                  />
                </div>

                {aptDate && aptBranch && (
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Available Slots *</label>
                    {loadingSlots ? (
                      <div style={{ padding: 10, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Checking availability...</div>
                    ) : availableSlots.length === 0 ? (
                      <div style={{ padding: 10, textAlign: 'center', color: 'var(--text-muted)', background: 'var(--off-white)', borderRadius: 8, fontSize: '0.85rem' }}>
                        No slots available on this date. Please choose another date.
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10, maxHeight: '200px', overflowY: 'auto', padding: '4px' }}>
                        {availableSlots.map(slot => {
                          const isSelected = aptTime === slot.time;
                          const isFull = slot.available_capacity <= 0;
                          return (
                            <div 
                              key={slot.time}
                              onClick={() => !isFull && setAptTime(slot.time)}
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

                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Reason for Visit</label>
                  <input
                    className="input"
                    value={aptReason}
                    onChange={e => setAptReason(e.target.value)}
                    placeholder="Reason for visit"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Section 3: Ayurvedic & Clinical Assessment */}
        <div className="card card-body" style={{ marginBottom: 20 }}>
          <h4 style={{ marginBottom: 20, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 6 }}><FaLeaf /> Ayurvedic &amp; Clinical Profile</h4>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Primary Department</label>
              <select className="input" name="primary_department" value={form.primary_department} onChange={handleChange}>
                <option value="">Select Department</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Interested Treatment</label>
              <select className="input" name="interested_treatment" value={form.interested_treatment} onChange={handleChange} disabled={!form.primary_department || treatments.length === 0}>
                <option value="">Select Treatment</option>
                {treatments.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <Field label="Prakriti (Constitution)" name="prakriti" form={form} onChange={handleChange} options={[
              { value: 'unknown', label: 'Unknown / Not Assessed' },
              { value: 'vata', label: 'Vata' },
              { value: 'pitta', label: 'Pitta' },
              { value: 'kapha', label: 'Kapha' },
              { value: 'vata_pitta', label: 'Vata-Pitta' },
              { value: 'pitta_kapha', label: 'Pitta-Kapha' },
              { value: 'vata_kapha', label: 'Vata-Kapha' },
              { value: 'tridosha', label: 'Tridosha' },
            ]} />
            <Field label="Chief Complaint" name="chief_complaint" type="textarea" span={true} form={form} onChange={handleChange} />
          </div>
        </div>

        {/* Section 4: Emergency Contact */}
        <div className="card card-body" style={{ marginBottom: 20 }}>
          <h4 style={{ marginBottom: 20, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 6 }}><FaFirstAid /> Emergency Contact</h4>
          <div className="form-grid">
            <Field label="Contact Name" name="emergency_contact_name" form={form} onChange={handleChange} />
            <Field label="Contact Phone" name="emergency_contact_phone" form={form} onChange={handleChange} />
          </div>
        </div>

        {/* Section 5: Medical History */}
        <div className="card card-body" style={{ marginBottom: 20 }}>
          <h4 style={{ marginBottom: 20, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 6 }}><FaHospital /> Medical History</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
            <Field label="Past Medical History" name="medical_history" type="textarea" form={form} onChange={handleChange} />
            <Field label="Known Allergies" name="allergies" type="textarea" form={form} onChange={handleChange} />
            <Field label="Chronic Conditions" name="chronic_conditions" type="textarea" form={form} onChange={handleChange} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-ghost" onClick={() => navigate('/dashboard/patients')}>Cancel</button>
          <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>
            {saving ? <><FaHourglassHalf /> Saving...</> : <><FaCheckCircle /> Register Patient</>}
          </button>
        </div>
      </form>
    </div>
  );
}

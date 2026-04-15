import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPatient } from '../../../api/patients';
import { getBranches } from '../../../api/branches';
import { useAuth } from '../../../context/AuthContext';

const INITIAL = {
  first_name: '', last_name: '', phone: '', email: '',
  gender: 'other', blood_group: 'unknown', dob: '',
  address: '', emergency_contact_name: '', emergency_contact_phone: '',
  medical_history: '', allergies: '', chronic_conditions: '', branch: '',
};

export default function PatientRegister() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ ...INITIAL, branch: user?.branch_id || '' });
  const [branches, setBranches] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    getBranches().then(({ data }) => setBranches(data.results || data)).catch(() => {});
  }, []);

  const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.first_name || !form.phone || !form.branch) {
      setError('First name, phone, and branch are required.');
      return;
    }
    setSaving(true);
    try {
      const { data } = await createPatient(form);
      setSuccess(data);
    } catch (err) {
      const d = err.response?.data;
      setError(d?.phone?.[0] || d?.detail || JSON.stringify(d) || 'Registration failed.');
    } finally {
      setSaving(false);
    }
  };

  if (success) {
    return (
      <div>
        <div className="page-header"><h2>Register Patient</h2></div>
        <div style={{ maxWidth: 540, margin: '40px auto', textAlign: 'center' }}>
          <div style={{ fontSize: '4rem', marginBottom: 16 }}>✅</div>
          <h2 style={{ marginBottom: 8 }}>Patient Registered!</h2>
          <p style={{ marginBottom: 8 }}>
            <strong>{success.first_name} {success.last_name}</strong> has been registered.
          </p>
          <div style={{ marginBottom: 24, padding: '16px', background: 'var(--primary-bg)', borderRadius: 'var(--radius-md)', display: 'inline-block' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>UNIQUE HEALTH ID</div>
            <div style={{ fontFamily: 'monospace', fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>{success.uhid}</div>
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button className="btn btn-primary" onClick={() => { setSuccess(null); setForm({ ...INITIAL, branch: user?.branch_id || '' }); }}>
              Register Another
            </button>
            <button className="btn btn-ghost" onClick={() => navigate('/dashboard/patients')}>
              View All Patients
            </button>
          </div>
        </div>
      </div>
    );
  }

  const Field = ({ label, name, type = 'text', required, options, span }) => (
    <div className="form-group" style={span ? { gridColumn: '1 / -1' } : {}}>
      <label className="form-label">{label}{required && ' *'}</label>
      {options ? (
        <select className="input" name={name} value={form[name]} onChange={handleChange} required={required}>
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : type === 'textarea' ? (
        <textarea className="input" name={name} value={form[name]} onChange={handleChange} rows={2} />
      ) : (
        <input className="input" type={type} name={name} value={form[name]} onChange={handleChange} required={required} />
      )}
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <h2>Register New Patient</h2>
        <p>Fill out the patient details. UHID will be auto-generated on save.</p>
      </div>

      <form onSubmit={handleSubmit}>
        {error && <div className="alert alert-danger" style={{ marginBottom: 20 }}>⚠️ {error}</div>}

        {/* Section 1: Basic Info */}
        <div className="card card-body" style={{ marginBottom: 20 }}>
          <h4 style={{ marginBottom: 20, color: 'var(--primary)' }}>👤 Personal Information</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Field label="First Name" name="first_name" required />
            <Field label="Last Name" name="last_name" />
            <Field label="Phone" name="phone" required />
            <Field label="Email" name="email" type="email" />
            <Field label="Date of Birth" name="dob" type="date" />
            <Field label="Gender" name="gender" options={[
              { value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }, { value: 'other', label: 'Other' }
            ]} />
            <Field label="Blood Group" name="blood_group" options={[
              { value: 'unknown', label: 'Unknown' }, { value: 'A+', label: 'A+' }, { value: 'A-', label: 'A-' },
              { value: 'B+', label: 'B+' }, { value: 'B-', label: 'B-' }, { value: 'AB+', label: 'AB+' },
              { value: 'AB-', label: 'AB-' }, { value: 'O+', label: 'O+' }, { value: 'O-', label: 'O-' },
            ]} />
            <div className="form-group">
              <label className="form-label">Branch *</label>
              <select className="input" name="branch" value={form.branch} onChange={handleChange} required>
                <option value="">Select Branch</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Address</label>
              <input className="input" name="address" value={form.address} onChange={handleChange} />
            </div>
          </div>
        </div>

        {/* Section 2: Emergency Contact */}
        <div className="card card-body" style={{ marginBottom: 20 }}>
          <h4 style={{ marginBottom: 20, color: 'var(--primary)' }}>🆘 Emergency Contact</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Field label="Contact Name" name="emergency_contact_name" />
            <Field label="Contact Phone" name="emergency_contact_phone" />
          </div>
        </div>

        {/* Section 3: Medical History */}
        <div className="card card-body" style={{ marginBottom: 20 }}>
          <h4 style={{ marginBottom: 20, color: 'var(--primary)' }}>🏥 Medical History</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
            <Field label="Past Medical History" name="medical_history" type="textarea" />
            <Field label="Known Allergies" name="allergies" type="textarea" />
            <Field label="Chronic Conditions" name="chronic_conditions" type="textarea" />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-ghost" onClick={() => navigate('/dashboard/patients')}>Cancel</button>
          <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>
            {saving ? '⏳ Saving...' : '✅ Register Patient'}
          </button>
        </div>
      </form>
    </div>
  );
}

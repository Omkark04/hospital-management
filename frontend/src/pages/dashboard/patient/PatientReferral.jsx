import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { submitReferral } from '../../../api/referrals';
import { getPublicBranches } from '../../../api/branches';
import { FiUserPlus, FiLink, FiCheckCircle, FiAlertCircle, FiSend } from 'react-icons/fi';

export default function PatientReferral() {
  const { user } = useAuth();
  const [branches, setBranches] = useState([]);
  const [form, setForm] = useState({
    patient_name: '', patient_phone: '', patient_email: '',
    patient_address: '', reason: '',
    referred_by_name: user?.full_name || '',
    referred_by_phone: user?.phone || '',
    branch: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getPublicBranches().then(({ data }) => setBranches(data.results || data)).catch(() => {});
  }, []);

  // Pre-fill referrer info once user loads
  useEffect(() => {
    if (user) {
      setForm(prev => ({
        ...prev,
        referred_by_name: user.full_name || prev.referred_by_name,
        referred_by_phone: user.phone || prev.referred_by_phone,
      }));
    }
  }, [user]);

  const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await submitReferral(form);
      setSubmitted(true);
    } catch {
      setError('Failed to submit referral. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSubmitted(false);
    setForm({
      patient_name: '', patient_phone: '', patient_email: '',
      patient_address: '', reason: '',
      referred_by_name: user?.full_name || '',
      referred_by_phone: user?.phone || '',
      branch: ''
    });
  };

  if (submitted) {
    return (
      <div>
        <div className="page-header">
          <h2>Refer a Friend</h2>
          <p>Help someone find the care they need.</p>
        </div>
        <div className="card card-body" style={{ maxWidth: 520, margin: '60px auto', textAlign: 'center', padding: '48px 40px' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--success-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <FiCheckCircle size={36} color="var(--success)" />
          </div>
          <h3 style={{ marginBottom: 10 }}>Referral Submitted!</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: 28, lineHeight: 1.6 }}>
            Thank you! Our team will reach out to the patient shortly.
          </p>
          <button className="btn btn-primary" onClick={resetForm}>
            Refer Another Friend
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h2>Refer a Friend</h2>
        <p>Know someone who needs care? We'll reach out to them right away.</p>
      </div>

      <div style={{ maxWidth: 680 }}>
        {error && (
          <div className="alert alert-danger" style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FiAlertCircle size={16} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Patient Details */}
          <div className="card card-body">
            <h4 style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, paddingBottom: 12, borderBottom: '1px solid var(--border-card)' }}>
              <FiUserPlus size={18} style={{ color: 'var(--primary)' }} /> Patient Details
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Patient Name *</label>
                  <input className="input" name="patient_name" required value={form.patient_name} onChange={handleChange} placeholder="Full name" />
                </div>
                <div className="form-group">
                  <label className="form-label">Patient Phone *</label>
                  <input className="input" name="patient_phone" required value={form.patient_phone} onChange={handleChange} placeholder="+91 XXXXX XXXXX" />
                </div>
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Patient Email</label>
                  <input className="input" name="patient_email" type="email" value={form.patient_email} onChange={handleChange} placeholder="email@example.com" />
                </div>
                <div className="form-group">
                  <label className="form-label">Preferred Branch</label>
                  <select className="input" name="branch" value={form.branch} onChange={handleChange}>
                    <option value="">Any Branch</option>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Patient Address</label>
                <input className="input" name="patient_address" value={form.patient_address} onChange={handleChange} placeholder="City, State" />
              </div>
              <div className="form-group">
                <label className="form-label">Reason for Referral</label>
                <textarea className="input" name="reason" value={form.reason} onChange={handleChange} placeholder="Why are you referring this person? Any health concerns?" rows={3} />
              </div>
            </div>
          </div>

          {/* Referrer Details — pre-filled, editable */}
          <div className="card card-body">
            <h4 style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, paddingBottom: 12, borderBottom: '1px solid var(--border-card)' }}>
              <FiLink size={18} style={{ color: 'var(--primary)' }} /> Your Details (Referrer)
            </h4>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Your Name</label>
                <input className="input" name="referred_by_name" value={form.referred_by_name} onChange={handleChange} placeholder="Your name" />
              </div>
              <div className="form-group">
                <label className="form-label">Your Phone</label>
                <input className="input" name="referred_by_phone" value={form.referred_by_phone} onChange={handleChange} placeholder="Your phone" />
              </div>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }} disabled={loading}>
            {loading ? 'Submitting...' : <><FiSend size={15} /> Submit Referral</>}
          </button>
        </form>
      </div>
    </div>
  );
}

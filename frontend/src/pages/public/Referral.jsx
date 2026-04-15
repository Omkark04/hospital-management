import { useState } from 'react';
import PublicNavbar from '../../components/layout/PublicNavbar';
import { submitReferral } from '../../api/referrals';
import { getPublicBranches } from '../../api/branches';
import { useEffect } from 'react';

export default function Referral() {
  const [branches, setBranches] = useState([]);
  const [form, setForm] = useState({ patient_name: '', patient_phone: '', patient_email: '', patient_address: '', reason: '', referred_by_name: '', referred_by_phone: '', branch: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getPublicBranches().then(({ data }) => setBranches(data.results || data)).catch(() => {});
  }, []);

  const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await submitReferral(form);
      setSubmitted(true);
    } catch (err) {
      setError('Failed to submit referral. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div>
        <PublicNavbar />
        <div style={{ paddingTop: 72, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', maxWidth: 480, padding: 40 }}>
            <div style={{ fontSize: '4rem', marginBottom: 20 }}>✅</div>
            <h2 style={{ marginBottom: 12 }}>Referral Submitted!</h2>
            <p style={{ marginBottom: 24 }}>Thank you for your referral. Our team will reach out to the patient shortly.</p>
            <button className="btn btn-primary" onClick={() => { setSubmitted(false); setForm({ patient_name: '', patient_phone: '', patient_email: '', patient_address: '', reason: '', referred_by_name: '', referred_by_phone: '', branch: '' }); }}>
              Submit Another Referral
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PublicNavbar />
      <div style={{ paddingTop: 72 }}>
        <section className="section">
          <div className="container" style={{ maxWidth: 720 }}>
            <div className="section-header centered" style={{ marginBottom: 36 }}>
              <div className="section-tag">Referral</div>
              <h2 className="section-title">Refer a <span>Patient</span></h2>
              <p className="section-desc">Know someone who needs medical care? Fill in their details and we'll contact them right away.</p>
            </div>

            <div className="card">
              <div className="card-body">
                {error && <div className="alert alert-danger" style={{ marginBottom: 20 }}>⚠️ {error}</div>}
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <h4 style={{ color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>🧑‍⚕️ Patient Details</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div className="form-group">
                      <label className="form-label">Patient Name *</label>
                      <input className="input" name="patient_name" required value={form.patient_name} onChange={handleChange} placeholder="Full name" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Patient Phone *</label>
                      <input className="input" name="patient_phone" required value={form.patient_phone} onChange={handleChange} placeholder="+91 XXXXX XXXXX" />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
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
                    <textarea className="input" name="reason" value={form.reason} onChange={handleChange} placeholder="Why are you referring this patient? Any health concerns?" rows={3} />
                  </div>

                  <h4 style={{ color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>🔗 Your Details (Referrer)</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div className="form-group">
                      <label className="form-label">Your Name</label>
                      <input className="input" name="referred_by_name" value={form.referred_by_name} onChange={handleChange} placeholder="Optional" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Your Phone</label>
                      <input className="input" name="referred_by_phone" value={form.referred_by_phone} onChange={handleChange} placeholder="Optional" />
                    </div>
                  </div>

                  <button type="submit" className="btn btn-primary btn-lg" style={{ justifyContent: 'center' }} disabled={loading}>
                    {loading ? '⏳ Submitting...' : '🔗 Submit Referral'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

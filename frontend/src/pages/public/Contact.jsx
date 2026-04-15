import { useState } from 'react';
import PublicNavbar from '../../components/layout/PublicNavbar';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div>
      <PublicNavbar />
      <div style={{ paddingTop: 72 }}>
        <section className="section">
          <div className="container" style={{ maxWidth: 1100 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60 }}>
              <div>
                <div className="section-tag">Contact</div>
                <h2 className="section-title" style={{ marginTop: 16 }}>Get in <span>Touch</span></h2>
                <p style={{ marginTop: 16, marginBottom: 36 }}>Have questions about HMS+? Reach out to us and we'll get back to you within 24 hours.</p>
                {[
                  { icon: '📱', label: 'Phone', value: '+91 97633 31118' },
                  { icon: '📧', label: 'Email', value: 'info@hmsplus.in' },
                  { icon: '📍', label: 'Location', value: 'Maharashtra, India' },
                ].map(c => (
                  <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)', background: 'var(--primary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>{c.icon}</div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>{c.label}</div>
                      <div style={{ fontWeight: 600 }}>{c.value}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="card">
                <div className="card-body">
                  {sent ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                      <div style={{ fontSize: '3rem', marginBottom: 16 }}>✅</div>
                      <h3>Message Sent!</h3>
                      <p style={{ marginTop: 8 }}>We'll get back to you soon.</p>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div className="form-group">
                          <label className="form-label">Name *</label>
                          <input className="input" required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Phone</label>
                          <input className="input" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
                        </div>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Email *</label>
                        <input className="input" type="email" required value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Subject *</label>
                        <input className="input" required value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Message *</label>
                        <textarea className="input" required rows={4} value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} placeholder="How can we help you?" />
                      </div>
                      <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center' }}>Send Message →</button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

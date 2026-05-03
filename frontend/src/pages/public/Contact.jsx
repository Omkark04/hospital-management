import { useState } from 'react';
import PublicNavbar from '../../components/layout/PublicNavbar';
import PublicFooter from '../../components/layout/PublicFooter';
import {
  FiPhone, FiMapPin, FiClock, FiCalendar, FiUser, FiMail,
  FiCheckCircle, FiMessageSquare, FiSend
} from 'react-icons/fi';
import { FaWhatsapp, FaLeaf } from 'react-icons/fa';

const INITIAL = { name: '', phone: '', email: '', message: '' };

export default function Contact() {
  const [form, setForm] = useState(INITIAL);
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => { setSent(true); setSubmitting(false); }, 800);
  };

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const contactItems = [
    { Icon: FiPhone,   label: 'Phone (Dr. Wagh)',     value: '+91 97633 31118', href: 'tel:+919763331118' },
    { Icon: FaWhatsapp,label: 'WhatsApp',             value: '+91 97633 31118', href: 'https://wa.me/919763331118' },

    { Icon: FiMapPin,  label: 'Location',             value: 'Maharashtra, India', href: null },
    { Icon: FiClock,   label: 'Monday – Saturday',    value: '9:00 AM – 7:00 PM', href: null },
    { Icon: FiClock,   label: 'Sunday',               value: 'By Appointment Only', href: null },
  ];

  return (
    <div style={{ background: 'var(--parchment)' }}>
      <PublicNavbar />
      <div style={{ paddingTop: 72 }}>
        {/* Banner */}
        <div className="page-banner">
          <div className="container" style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
            <div className="section-tag" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', borderColor: 'rgba(255,255,255,0.30)' }}>
              Get In Touch
            </div>
            <h1 style={{ color: '#fff', marginTop: 16, marginBottom: 12, fontFamily: '"Cormorant Garamond", serif' }}>
              Contact Us
            </h1>
            <p style={{ color: 'rgba(255,252,240,0.85)', maxWidth: 500, margin: '0 auto', fontSize: '1.05rem' }}>
              Have a question or need to get in touch? Send us a message or call us directly.
            </p>
          </div>
        </div>

        {/* Main content */}
        <section className="section">
          <div className="container" style={{ maxWidth: 1100 }}>
            <div className="responsive-grid-2-1-4">

              {/* Contact info panel */}
              <div>
                <h3 style={{ marginBottom: 28, fontFamily: '"Cormorant Garamond", serif' }}>Contact Information</h3>

                {contactItems.map(c => (
                  <div key={c.label} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 22 }}>
                    <div style={{
                      width: 44, height: 44,
                      background: 'var(--secondary-bg)',
                      borderRadius: 10, flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: '1px solid var(--border-gold)',
                    }}>
                      <c.Icon size={18} color="var(--clay)" />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        {c.label}
                      </div>
                      {c.href ? (
                        <a href={c.href} target={c.href.startsWith('http') ? '_blank' : undefined}
                          rel="noreferrer"
                          style={{ fontWeight: 600, color: 'var(--bark)', fontSize: '0.95rem' }}>
                          {c.value}
                        </a>
                      ) : (
                        <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--bark)' }}>{c.value}</div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Quick CTAs */}
                <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <a href="tel:+919763331118" className="btn btn-primary" style={{ justifyContent: 'center', gap: 8 }}>
                    <FiPhone size={15} /> Call Now
                  </a>
                  <a href="https://wa.me/919763331118" target="_blank" rel="noreferrer"
                    className="btn btn-ghost" style={{ justifyContent: 'center', gap: 8 }}>
                    <FaWhatsapp size={16} /> WhatsApp Us
                  </a>
                </div>

                {/* Note */}
                <div style={{
                  marginTop: 28, padding: 16,
                  background: 'var(--secondary-bg)',
                  border: '1px solid var(--border-gold)',
                  borderRadius: 12, fontSize: '0.85rem',
                  display: 'flex', gap: 10, alignItems: 'flex-start',
                }}>
                  <FaLeaf size={16} color="var(--moss)" style={{ flexShrink: 0, marginTop: 2 }} />
                  <span>
                    <strong>Note:</strong> We offer same-day consultations for urgent cases. Please call directly for immediate assistance.
                  </span>
                </div>
              </div>

              {/* General Inquiry form */}
              <div style={{
                background: 'var(--linen)',
                borderRadius: 20, padding: 40,
                border: '1px solid var(--border-gold)',
                boxShadow: 'var(--shadow-gold)',
              }}>
                {sent ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                    <div style={{ width: 80, height: 80, background: 'var(--success-bg)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                      <FiCheckCircle size={40} color="var(--moss)" />
                    </div>
                    <h3 style={{ marginBottom: 10, fontFamily: '"Cormorant Garamond", serif' }}>
                      Message Sent!
                    </h3>
                    <p style={{ marginBottom: 28 }}>
                      Thank you, <strong>{form.name}</strong>! We have received your inquiry and will get back to you shortly.
                    </p>
                    <button className="btn btn-primary" onClick={() => { setSent(false); setForm(INITIAL); }}>
                      Send Another Message
                    </button>
                  </div>
                ) : (
                  <>
                    <h3 style={{ marginBottom: 28, fontFamily: '"Cormorant Garamond", serif' }}>
                      Send us a Message
                    </h3>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
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

                      <div className="form-group">
                        <label className="form-label">Email Address</label>
                        <div style={{ position: 'relative' }}>
                          <FiMail size={14} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                          <input className="input" type="email" placeholder="your@email.com" value={form.email} onChange={set('email')} style={{ paddingLeft: 36 }} />
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Your Message *</label>
                        <div style={{ position: 'relative' }}>
                          <FiMessageSquare size={14} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: 14, pointerEvents: 'none' }} />
                          <textarea className="input" rows={5} required
                            placeholder="How can we help you?"
                            value={form.message} onChange={set('message')}
                            style={{ paddingLeft: 36 }} />
                        </div>
                      </div>

                      <button type="submit" className="btn btn-primary btn-lg"
                        style={{ justifyContent: 'center', gap: 8 }}
                        disabled={submitting}>
                        {submitting
                          ? <><FiClock size={16} /> Sending...</>
                          : <><FiSend size={16} /> Send Message</>
                        }
                      </button>

                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                        Your information is completely confidential.
                      </p>
                    </form>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
      <PublicFooter />
    </div>
  );
}

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiUser, FiMail, FiLock, FiPhone, FiCheckCircle,
  FiUserCheck, FiAtSign, FiAlertCircle, FiArrowRight,
  FiShield, FiHeart, FiStar, FiEye, FiEyeOff
} from 'react-icons/fi';
import { FaLeaf } from 'react-icons/fa';
import { GiSpineArrow } from 'react-icons/gi';
import api from '../../api/axios';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: '', email: '', phone: '',
    first_name: '', last_name: '',
    password: '', confirm_password: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/register/', form);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      const data = err.response?.data;
      setError(data ? Object.values(data).flat().join(' ') : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={styles.page}>
        <div style={styles.successOverlay}>
          <div style={styles.successCard}>
            <div style={styles.successIcon}>
              <FiCheckCircle size={48} color="#059669" />
            </div>
            <h2 style={styles.successTitle}>Account Created!</h2>
            <p style={styles.successDesc}>
              Welcome to the Dr. Spine &amp; Nerves family. Redirecting you to login…
            </p>
            <div style={styles.successDot} />
          </div>
        </div>
      </div>
    );
  }

  const field = (label, icon, name, type = 'text', extra = {}) => (
    <div style={styles.fieldGroup}>
      <label style={styles.label}>{label}</label>
      <div style={styles.inputWrap}>
        <span style={styles.inputIcon}>{icon}</span>
        <input
          type={type}
          style={styles.input}
          placeholder={`Enter your ${label.toLowerCase()}`}
          value={form[name]}
          onChange={e => setForm({ ...form, [name]: e.target.value })}
          required
          {...extra}
        />
      </div>
    </div>
  );

  return (
    <div style={styles.page} className="auth-container">
      {/* ── LEFT PANEL ── */}
      <div style={styles.leftPanel} className="auth-left">
        <div style={styles.blob1} />
        <div style={styles.blob2} />

        <div style={styles.leftContent}>
          <Link to="/" style={styles.logoRow}>
            <div style={styles.logoIcon}><GiSpineArrow size={24} color="#fff" /></div>
            <div>
              <div style={styles.logoTitle}>Dr. Spine &amp; Nerves</div>
              <div style={styles.logoSub}>Ayurvedic Healing Centre</div>
            </div>
          </Link>

          <div style={styles.headline}>
            <h1 style={styles.headlineTitle} className="auth-headline-title">
              Begin Your<br />
              <span style={styles.headlineAccent}>Healing Journey.</span>
            </h1>
            <p style={styles.headlineDesc}>
              Join thousands who have found lasting relief from spine and joint pain —
              without surgery, without drugs.
            </p>
          </div>

          <div style={styles.steps}>
            {[
              { icon: <FiCheckCircle size={16} />, text: 'Create your free account' },
              { icon: <FiHeart size={16} />, text: 'Book your first consultation' },
              { icon: <FaLeaf size={16} />, text: 'Start your natural recovery' },
            ].map((s, i) => (
              <div key={i} style={styles.step}>
                <div style={styles.stepIcon}>{s.icon}</div>
                <span style={styles.stepText}>{s.text}</span>
              </div>
            ))}
          </div>

          <div style={styles.quote}>
            <div style={styles.quoteText}>स्वस्थस्य स्वास्थ्य रक्षणं</div>
            <div style={styles.quoteSub}>Protect the health of the healthy</div>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div style={styles.rightPanel} className="auth-right">
        <div style={styles.formCard} className="auth-form-card">
          <div style={styles.formHeader}>
            <div style={styles.formTagline}>New Patient Registration</div>
            <h2 style={styles.formTitle}>Create Account</h2>
            <p style={styles.formSubtitle}>Join our healing community in seconds</p>
          </div>

          {error && (
            <div style={styles.errorBox}>
              <FiAlertCircle size={16} style={{ flexShrink: 0 }} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={styles.form}>
            {/* Name row */}
            <div style={styles.row}>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>First Name</label>
                <div style={styles.inputWrap}>
                  <span style={styles.inputIcon}><FiUserCheck size={15} /></span>
                  <input
                    type="text" style={styles.input}
                    placeholder="First name" required
                    value={form.first_name}
                    onChange={e => setForm({ ...form, first_name: e.target.value })}
                  />
                </div>
              </div>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Last Name</label>
                <div style={styles.inputWrap}>
                  <span style={styles.inputIcon}><FiUser size={15} /></span>
                  <input
                    type="text" style={styles.input}
                    placeholder="Last name" required
                    value={form.last_name}
                    onChange={e => setForm({ ...form, last_name: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Username */}
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Username</label>
              <div style={styles.inputWrap}>
                <span style={styles.inputIcon}><FiAtSign size={15} /></span>
                <input
                  type="text" style={styles.input}
                  placeholder="Choose a username" required
                  value={form.username}
                  onChange={e => setForm({ ...form, username: e.target.value })}
                />
              </div>
            </div>

            {/* Email */}
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Email Address</label>
              <div style={styles.inputWrap}>
                <span style={styles.inputIcon}><FiMail size={15} /></span>
                <input
                  type="email" style={styles.input}
                  placeholder="your@email.com" required
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                />
              </div>
            </div>

            {/* Phone */}
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Phone Number</label>
              <div style={styles.inputWrap}>
                <span style={styles.inputIcon}><FiPhone size={15} /></span>
                <input
                  type="tel" style={styles.input}
                  placeholder="+91 98765 43210" required
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                />
              </div>
            </div>

            {/* Password row */}
            <div style={styles.row}>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Password</label>
                <div style={styles.inputWrap}>
                  <span style={styles.inputIcon}><FiLock size={15} /></span>
                  <input
                    type={showPass ? 'text' : 'password'}
                    style={{ ...styles.input, paddingRight: 40 }}
                    placeholder="Create password" required
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                  />
                  <button type="button" style={styles.eyeBtn} onClick={() => setShowPass(!showPass)}>
                    {showPass ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                  </button>
                </div>
              </div>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Confirm Password</label>
                <div style={styles.inputWrap}>
                  <span style={styles.inputIcon}><FiShield size={15} /></span>
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    style={{ ...styles.input, paddingRight: 40 }}
                    placeholder="Repeat password" required
                    value={form.confirm_password}
                    onChange={e => setForm({ ...form, confirm_password: e.target.value })}
                  />
                  <button type="button" style={styles.eyeBtn} onClick={() => setShowConfirm(!showConfirm)}>
                    {showConfirm ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                  </button>
                </div>
              </div>
            </div>

            <button type="submit" style={styles.submitBtn} disabled={loading}>
              {loading
                ? <><span style={styles.spinner} /> Creating account...</>
                : <>Create Account <FiArrowRight size={16} /></>
              }
            </button>
          </form>

          <div style={styles.footer}>
            Already have an account?{' '}
            <Link to="/login" style={styles.linkAccent}>Sign In</Link>
          </div>

          <div style={{ textAlign: 'center', marginTop: 12 }}>
            <Link to="/" style={styles.backLink}>← Back to website</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    display: 'flex',
    minHeight: '100vh',
    fontFamily: "'DM Sans', system-ui, sans-serif",
  },

  /* Success */
  successOverlay: {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'linear-gradient(145deg, #0f172a 0%, #0e7490 45%, #059669 100%)',
  },
  successCard: {
    background: '#fff', borderRadius: 24, padding: '56px 48px',
    textAlign: 'center', maxWidth: 420,
    boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
  },
  successIcon: { marginBottom: 20 },
  successTitle: {
    fontFamily: "'Inter', sans-serif",
    fontSize: '2rem', fontWeight: 800, color: '#0f172a', marginBottom: 12,
  },
  successDesc: { color: '#64748b', fontSize: '1rem', lineHeight: 1.65 },
  successDot: {
    width: 40, height: 4, borderRadius: 2,
    background: 'linear-gradient(90deg,#047857,#06b6d4)',
    margin: '24px auto 0',
  },

  /* Left panel */
  leftPanel: {
    flex: '0 0 42%',
    background: 'linear-gradient(145deg, #0f172a 0%, #0e7490 45%, #059669 100%)',
    position: 'relative', overflow: 'hidden',
    display: 'flex', alignItems: 'center',
    padding: '60px 44px',
  },
  blob1: {
    position: 'absolute', top: '-60px', right: '-60px',
    width: 280, height: 280, borderRadius: '50%',
    background: 'rgba(16,185,129,0.20)', filter: 'blur(55px)',
    pointerEvents: 'none',
  },
  blob2: {
    position: 'absolute', bottom: '-40px', left: '-40px',
    width: 240, height: 240, borderRadius: '50%',
    background: 'rgba(6,182,212,0.18)', filter: 'blur(45px)',
    pointerEvents: 'none',
  },
  leftContent: {
    position: 'relative', zIndex: 1,
    display: 'flex', flexDirection: 'column', gap: 32,
  },

  logoRow: { display: 'flex', alignItems: 'center', gap: 14, textDecoration: 'none' },
  logoIcon: {
    width: 46, height: 46,
    background: 'rgba(255,255,255,0.15)',
    border: '1px solid rgba(255,255,255,0.25)',
    borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center',
    backdropFilter: 'blur(8px)',
  },
  logoTitle: { color: '#fff', fontWeight: 700, fontSize: '1.05rem', fontFamily: "'Inter', sans-serif" },
  logoSub: { color: 'rgba(255,255,255,0.55)', fontSize: '0.72rem', marginTop: 2 },

  headline: { maxWidth: 340 },
  headlineTitle: {
    fontFamily: "'Inter', sans-serif",
    fontSize: 'clamp(1.9rem, 3.5vw, 2.9rem)',
    fontWeight: 800, color: '#fff',
    lineHeight: 1.1, letterSpacing: '-0.02em',
    marginBottom: 14,
  },
  headlineAccent: {
    background: 'linear-gradient(135deg, #6ee7b7, #a5f3fc)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  headlineDesc: { color: 'rgba(255,255,255,0.70)', fontSize: '0.97rem', lineHeight: 1.7 },

  steps: { display: 'flex', flexDirection: 'column', gap: 12 },
  step: { display: 'flex', alignItems: 'center', gap: 12 },
  stepIcon: {
    width: 32, height: 32,
    background: 'rgba(110,231,183,0.15)',
    border: '1px solid rgba(110,231,183,0.30)',
    borderRadius: 9999,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#6ee7b7', flexShrink: 0,
  },
  stepText: { color: 'rgba(255,255,255,0.82)', fontSize: '0.875rem', fontWeight: 500 },

  quote: { borderLeft: '3px solid rgba(110,231,183,0.45)', paddingLeft: 14 },
  quoteText: { fontFamily: "'Noto Serif Devanagari', serif", fontSize: '1rem', color: 'rgba(255,255,255,0.82)' },
  quoteSub: { color: 'rgba(255,255,255,0.45)', fontSize: '0.76rem', marginTop: 4, fontStyle: 'italic' },

  /* Right panel */
  rightPanel: {
    flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
    background: '#f4f8fb', padding: '32px 24px',
    overflowY: 'auto',
  },
  formCard: {
    background: '#fff',
    border: '1px solid rgba(6,182,212,0.15)',
    borderRadius: 24, padding: '40px 36px',
    width: '100%', maxWidth: 520,
    boxShadow: '0 8px 40px rgba(15,23,42,0.10)',
    marginTop: 24, marginBottom: 24,
  },

  formHeader: { marginBottom: 28 },
  formTagline: {
    display: 'inline-block',
    background: 'rgba(16,185,129,0.09)',
    color: '#059669', fontSize: '0.70rem', fontWeight: 700,
    letterSpacing: '0.10em', textTransform: 'uppercase',
    padding: '4px 12px', borderRadius: 9999,
    marginBottom: 10, border: '1px solid rgba(16,185,129,0.18)',
  },
  formTitle: {
    fontFamily: "'Inter', sans-serif",
    fontSize: '1.85rem', fontWeight: 800,
    color: '#0f172a', letterSpacing: '-0.02em', marginBottom: 6,
  },
  formSubtitle: { color: '#64748b', fontSize: '0.9rem', lineHeight: 1.6 },

  errorBox: {
    background: 'rgba(239,68,68,0.08)',
    border: '1px solid rgba(239,68,68,0.22)',
    borderRadius: 10, padding: '11px 14px',
    color: '#ef4444', fontSize: '0.875rem',
    display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18,
  },

  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  row: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 },

  fieldGroup: { display: 'flex', flexDirection: 'column', gap: 5 },
  label: {
    fontSize: '0.72rem', fontWeight: 700,
    color: '#374151', letterSpacing: '0.06em', textTransform: 'uppercase',
  },
  inputWrap: { position: 'relative' },
  inputIcon: {
    position: 'absolute', left: 13, top: '50%',
    transform: 'translateY(-50%)',
    color: '#94a3b8', display: 'flex', pointerEvents: 'none',
  },
  input: {
    width: '100%',
    background: '#f8fafc',
    border: '1.5px solid #e2e8f0',
    borderRadius: 11, padding: '11px 14px 11px 38px',
    fontSize: '0.9rem', color: '#0f172a',
    outline: 'none',
    fontFamily: "'DM Sans', sans-serif",
    transition: 'border-color 0.2s, box-shadow 0.2s',
  },
  eyeBtn: {
    position: 'absolute', right: 12, top: '50%',
    transform: 'translateY(-50%)',
    background: 'none', border: 'none',
    color: '#94a3b8', cursor: 'pointer',
    display: 'flex', alignItems: 'center', padding: 3,
  },

  submitBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    background: 'linear-gradient(135deg, #047857, #059669)',
    color: '#fff', border: 'none', borderRadius: 12,
    padding: '14px 24px', fontSize: '1rem', fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 4px 16px rgba(16,185,129,0.28)',
    transition: 'all 0.2s', marginTop: 4,
  },
  spinner: {
    width: 17, height: 17,
    border: '2px solid rgba(255,255,255,0.35)',
    borderTopColor: '#fff', borderRadius: '50%',
    display: 'inline-block',
    animation: 'spin 0.8s linear infinite',
  },

  footer: { textAlign: 'center', color: '#64748b', fontSize: '0.875rem', marginTop: 20 },
  linkAccent: { color: '#059669', fontWeight: 700, textDecoration: 'none' },
  backLink: { color: '#94a3b8', fontSize: '0.80rem', textDecoration: 'none' },
};

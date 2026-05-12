import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  FiUser, FiLock, FiEye, FiEyeOff, FiAlertCircle,
  FiArrowRight, FiShield, FiHeart, FiStar
} from 'react-icons/fi';
import { FaLeaf } from 'react-icons/fa';
import { GiSpineArrow } from 'react-icons/gi';

const roleRedirects = {
  owner: '/dashboard',
  doctor: '/dashboard',
  receptionist: '/dashboard',
  employee: '/dashboard',
  patient: '/dashboard',
};

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.username || !form.password) {
      setError('Please enter both username and password.');
      return;
    }
    setLoading(true);
    try {
      const role = await login(form.username, form.password);
      navigate(roleRedirects[role] || '/dashboard');
    } catch (err) {
      const msg = err.response?.data?.detail || err.response?.data?.non_field_errors?.[0] || 'Login failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page} className="auth-container">
      {/* ── LEFT PANEL ── */}
      <div style={styles.leftPanel} className="auth-left">
        {/* Decorative blobs */}
        <div style={styles.blob1} />
        <div style={styles.blob2} />
        <div style={styles.blob3} />

        <div style={styles.leftContent}>
          {/* Logo */}
          <Link to="/" style={styles.logoRow}>
            <div style={styles.logoIcon}><GiSpineArrow size={24} color="#fff" /></div>
            <div>
              <div style={styles.logoTitle}>Dr. Spine &amp; Nerves</div>
              <div style={styles.logoSub}>Ayurvedic Healing Centre</div>
            </div>
          </Link>

          {/* Headline */}
          <div style={styles.headline}>
            <h1 style={styles.headlineTitle} className="auth-headline-title">
              Heal Without<br />
              <span style={styles.headlineAccent}>Surgery.</span>
            </h1>
            <p style={styles.headlineDesc}>
              Ancient wisdom. Modern care. Step back into a life free from pain —
              naturally, safely, and permanently.
            </p>
          </div>

          {/* Trust badges */}
          <div style={styles.badgeRow} className="auth-badge-row">
            {[
              { icon: <FiStar size={14} />, text: '5000+ Patients Healed' },
              { icon: <FiShield size={14} />, text: 'Non-Surgical Promise' },
              { icon: <FaLeaf size={14} />, text: '100% Ayurvedic' },
            ].map(b => (
              <div key={b.text} style={styles.badge} className="auth-badge">
                <span style={styles.badgeIcon}>{b.icon}</span>
                {b.text}
              </div>
            ))}
          </div>

          {/* Sanskrit quote */}
          <div style={styles.quote}>
            <div style={styles.quoteText}>आरोग्यं परमं भाग्यं</div>
            <div style={styles.quoteSub}>Health is the greatest wealth</div>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div style={styles.rightPanel} className="auth-right">
        <div style={styles.formCard} className="auth-form-card">
          {/* Header */}
          <div style={styles.formHeader}>
            <div style={styles.formTagline}>Welcome back</div>
            <h2 style={styles.formTitle}>Sign In</h2>
            <p style={styles.formSubtitle}>
              Access your patient portal or clinic dashboard
            </p>
          </div>

          {/* Error */}
          {error && (
            <div style={styles.errorBox}>
              <FiAlertCircle size={16} style={{ flexShrink: 0 }} />
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={styles.form}>
            {/* Username */}
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Username</label>
              <div style={styles.inputWrap}>
                <span style={styles.inputIcon}><FiUser size={16} /></span>
                <input
                  id="username"
                  name="username"
                  type="text"
                  style={styles.input}
                  placeholder="Enter your username"
                  value={form.username}
                  onChange={handleChange}
                  autoComplete="username"
                  autoFocus
                />
              </div>
            </div>

            {/* Password */}
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Password</label>
              <div style={styles.inputWrap}>
                <span style={styles.inputIcon}><FiLock size={16} /></span>
                <input
                  id="password"
                  name="password"
                  type={showPass ? 'text' : 'password'}
                  style={{ ...styles.input, paddingRight: 48 }}
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={styles.eyeBtn}
                >
                  {showPass ? <FiEyeOff size={17} /> : <FiEye size={17} />}
                </button>
              </div>
              <div style={{ textAlign: 'right', marginTop: 4 }}>
                <Link to="/forgot-password" style={styles.forgotLink}>Forgot password?</Link>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              style={styles.submitBtn}
              disabled={loading}
            >
              {loading
                ? <><span style={styles.spinner} /> Signing in...</>
                : <>Sign In <FiArrowRight size={16} /></>
              }
            </button>
          </form>

          {/* Divider */}
          <div style={styles.divider}><span>or</span></div>

          {/* Links */}
          <div style={styles.links}>
            <p style={styles.linkText}>
              New patient?{' '}
              <Link to="/register" style={styles.linkAccent}>Create Account</Link>
            </p>
            <p style={styles.linkText}>
              Want to refer a patient?{' '}
              <Link to="/referral" style={styles.linkAccent}>Submit Referral</Link>
            </p>
          </div>

          {/* Back */}
          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <Link to="/" style={styles.backLink}>← Back to website</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Styles ─── */
const styles = {
  page: {
    display: 'flex',
    minHeight: '100vh',
    fontFamily: "'DM Sans', system-ui, sans-serif",
  },

  /* ─ LEFT PANEL ─ */
  leftPanel: {
    flex: '0 0 45%',
    background: 'linear-gradient(145deg, #0f172a 0%, #0e7490 45%, #059669 100%)',
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    padding: '60px 48px',
  },
  blob1: {
    position: 'absolute', top: '-80px', right: '-80px',
    width: 320, height: 320, borderRadius: '50%',
    background: 'rgba(16,185,129,0.18)', filter: 'blur(60px)',
    pointerEvents: 'none',
  },
  blob2: {
    position: 'absolute', bottom: '-60px', left: '-60px',
    width: 280, height: 280, borderRadius: '50%',
    background: 'rgba(6,182,212,0.20)', filter: 'blur(50px)',
    pointerEvents: 'none',
  },
  blob3: {
    position: 'absolute', top: '45%', left: '55%',
    width: 180, height: 180, borderRadius: '50%',
    background: 'rgba(255,255,255,0.04)', filter: 'blur(30px)',
    pointerEvents: 'none',
  },
  leftContent: {
    position: 'relative', zIndex: 1,
    display: 'flex', flexDirection: 'column', gap: 36,
  },

  logoRow: {
    display: 'flex', alignItems: 'center', gap: 14,
    textDecoration: 'none',
  },
  logoIcon: {
    width: 48, height: 48,
    background: 'rgba(255,255,255,0.15)',
    border: '1px solid rgba(255,255,255,0.25)',
    borderRadius: 14,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    backdropFilter: 'blur(8px)',
  },
  logoTitle: {
    color: '#fff', fontWeight: 700, fontSize: '1.1rem',
    fontFamily: "'Inter', sans-serif",
  },
  logoSub: {
    color: 'rgba(255,255,255,0.60)', fontSize: '0.75rem', marginTop: 2,
  },

  headline: { maxWidth: 360 },
  headlineTitle: {
    fontFamily: "'Inter', sans-serif",
    fontSize: 'clamp(2.2rem, 4vw, 3.2rem)',
    fontWeight: 800, color: '#fff',
    lineHeight: 1.1, letterSpacing: '-0.02em',
    marginBottom: 16,
  },
  headlineAccent: {
    background: 'linear-gradient(135deg, #6ee7b7, #a5f3fc)',
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  headlineDesc: {
    color: 'rgba(255,255,255,0.72)', fontSize: '1.05rem', lineHeight: 1.7,
  },

  badgeRow: { display: 'flex', flexDirection: 'column', gap: 10 },
  badge: {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    background: 'rgba(255,255,255,0.10)',
    border: '1px solid rgba(255,255,255,0.18)',
    borderRadius: 9999, padding: '7px 16px',
    color: 'rgba(255,255,255,0.90)', fontSize: '0.82rem', fontWeight: 600,
    backdropFilter: 'blur(6px)',
    width: 'fit-content',
  },
  badgeIcon: { color: '#6ee7b7', display: 'flex' },

  quote: {
    borderLeft: '3px solid rgba(110,231,183,0.50)',
    paddingLeft: 16,
  },
  quoteText: {
    fontFamily: "'Noto Serif Devanagari', serif",
    fontSize: '1.1rem', color: 'rgba(255,255,255,0.85)',
  },
  quoteSub: { color: 'rgba(255,255,255,0.50)', fontSize: '0.8rem', marginTop: 4, fontStyle: 'italic' },

  /* ─ RIGHT PANEL ─ */
  rightPanel: {
    flex: 1,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: '#f4f8fb',
    padding: '40px 24px',
  },
  formCard: {
    background: '#fff',
    border: '1px solid rgba(6,182,212,0.15)',
    borderRadius: 24,
    padding: '48px 40px',
    width: '100%', maxWidth: 440,
    boxShadow: '0 8px 40px rgba(15,23,42,0.10)',
  },

  formHeader: { marginBottom: 32 },
  formTagline: {
    display: 'inline-block',
    background: 'rgba(16,185,129,0.10)',
    color: '#059669',
    fontSize: '0.72rem', fontWeight: 700,
    letterSpacing: '0.1em', textTransform: 'uppercase',
    padding: '4px 12px', borderRadius: 9999,
    marginBottom: 12,
    border: '1px solid rgba(16,185,129,0.20)',
  },
  formTitle: {
    fontFamily: "'Inter', sans-serif",
    fontSize: '2rem', fontWeight: 800,
    color: '#0f172a', letterSpacing: '-0.02em',
    marginBottom: 8,
  },
  formSubtitle: { color: '#64748b', fontSize: '0.925rem', lineHeight: 1.6 },

  errorBox: {
    background: 'rgba(239,68,68,0.08)',
    border: '1px solid rgba(239,68,68,0.25)',
    borderRadius: 10,
    padding: '12px 16px',
    color: '#ef4444',
    fontSize: '0.875rem',
    display: 'flex', alignItems: 'center', gap: 8,
    marginBottom: 20,
  },

  form: { display: 'flex', flexDirection: 'column', gap: 20 },

  fieldGroup: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: {
    fontSize: '0.75rem', fontWeight: 700,
    color: '#374151', letterSpacing: '0.06em',
    textTransform: 'uppercase',
  },
  inputWrap: { position: 'relative' },
  inputIcon: {
    position: 'absolute', left: 14, top: '50%',
    transform: 'translateY(-50%)',
    color: '#94a3b8', display: 'flex', pointerEvents: 'none',
  },
  input: {
    width: '100%',
    background: '#f8fafc',
    border: '1.5px solid #e2e8f0',
    borderRadius: 12,
    padding: '13px 16px 13px 42px',
    fontSize: '0.9375rem',
    color: '#0f172a',
    outline: 'none',
    fontFamily: "'DM Sans', sans-serif",
    transition: 'border-color 0.2s, box-shadow 0.2s',
  },
  eyeBtn: {
    position: 'absolute', right: 14, top: '50%',
    transform: 'translateY(-50%)',
    background: 'none', border: 'none',
    color: '#94a3b8', cursor: 'pointer',
    display: 'flex', alignItems: 'center',
    padding: 4,
  },
  forgotLink: { color: '#059669', fontSize: '0.8rem', fontWeight: 600, textDecoration: 'none' },

  submitBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    background: 'linear-gradient(135deg, #047857, #059669)',
    color: '#fff',
    border: 'none', borderRadius: 12,
    padding: '14px 24px',
    fontSize: '1rem', fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 4px 16px rgba(16,185,129,0.30)',
    transition: 'all 0.2s',
    marginTop: 4,
  },
  spinner: {
    width: 18, height: 18,
    border: '2px solid rgba(255,255,255,0.35)',
    borderTopColor: '#fff',
    borderRadius: '50%',
    display: 'inline-block',
    animation: 'spin 0.8s linear infinite',
  },

  divider: {
    display: 'flex', alignItems: 'center', gap: 12,
    color: '#94a3b8', fontSize: '0.78rem',
    margin: '24px 0 0',
  },

  links: { marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 },
  linkText: { textAlign: 'center', color: '#64748b', fontSize: '0.875rem' },
  linkAccent: { color: '#059669', fontWeight: 700, textDecoration: 'none' },

  backLink: { color: '#94a3b8', fontSize: '0.82rem', textDecoration: 'none' },
};

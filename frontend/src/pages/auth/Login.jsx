import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

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
    <div className="login-page">
      <div className="login-bg" />

      <div className="login-card fade-in">
        {/* Logo */}
        <div className="login-logo">
          <div className="logo-mark">H</div>
          <h1>Welcome Back</h1>
          <p>Sign in to Hospital Management System</p>
        </div>

        {/* Error */}
        {error && <div className="login-error" style={{ marginBottom: 16 }}>⚠️ {error}</div>}

        {/* Form */}
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              id="username"
              name="username"
              type="text"
              className="input"
              placeholder="Enter your username"
              value={form.username}
              onChange={handleChange}
              autoComplete="username"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                name="password"
                type={showPass ? 'text' : 'password'}
                className="input"
                placeholder="Enter your password"
                value={form.password}
                onChange={handleChange}
                autoComplete="current-password"
                style={{ paddingRight: 48 }}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1rem' }}
              >
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px' }} disabled={loading}>
            {loading ? <span className="spinner spinner-sm" /> : null}
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="login-divider">or</div>

        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Want to refer a patient?{' '}
            <Link to="/referral" style={{ color: 'var(--primary)' }}>Submit a referral</Link>
          </p>
        </div>

        {/* Role hints */}
        <div style={{ marginTop: 24, padding: 16, background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-card)' }}>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Role-Based Access
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
            {['👑 Owner', '🩺 Doctor', '🗂 Receptionist', '👤 Employee', '🧑‍⚕️ Patient'].map(r => (
              <span key={r} className="badge badge-primary" style={{ fontSize: '0.7rem' }}>{r}</span>
            ))}
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <Link to="/" style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>← Back to website</Link>
        </div>
      </div>
    </div>
  );
}

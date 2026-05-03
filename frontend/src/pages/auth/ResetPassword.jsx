import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { FiLock, FiCheckCircle } from 'react-icons/fi';
import api from '../../api/axios';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [form, setForm] = useState({
    new_password: '',
    confirm_password: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      setError('Invalid or missing reset token.');
      return;
    }
    
    setError('');
    setLoading(true);

    try {
      await api.post('/users/password-reset-confirm/', {
        token,
        ...form
      });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="auth-container">
        <div className="auth-card text-center">
          <h2 className="section-title text-danger mb-3">Invalid Link</h2>
          <p className="text-secondary mb-4">This password reset link is invalid or has expired.</p>
          <Link to="/forgot-password" size="sm" className="btn btn-outline-primary">Request New Link</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header text-center mb-4">
          <h2 className="section-title mb-1">Set New Password</h2>
          <p className="text-secondary">Please enter your new secure password</p>
        </div>

        {success ? (
          <div className="text-center py-4">
            <FiCheckCircle size={48} className="text-success mb-3" />
            <p className="fw-bold mb-2">Password Updated!</p>
            <p className="text-secondary">Your password has been reset successfully. Redirecting to login...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            {error && <div className="alert alert-danger mb-3">{error}</div>}

            <div className="mb-3">
              <label className="form-label">New Password</label>
              <div className="input-group">
                <span className="input-group-text"><FiLock /></span>
                <input
                  type="password"
                  className="form-control"
                  required
                  value={form.new_password}
                  onChange={e => setForm({ ...form, new_password: e.target.value })}
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="form-label">Confirm New Password</label>
              <div className="input-group">
                <span className="input-group-text"><FiLock /></span>
                <input
                  type="password"
                  className="form-control"
                  required
                  value={form.confirm_password}
                  onChange={e => setForm({ ...form, confirm_password: e.target.value })}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-100 py-2"
              disabled={loading}
            >
              {loading ? 'Updating...' : 'Reset Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

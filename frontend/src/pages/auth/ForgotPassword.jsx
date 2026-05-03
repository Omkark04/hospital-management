import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiMail, FiArrowLeft, FiCheckCircle } from 'react-icons/fi';
import api from '../../api/axios';

export default function ForgotPassword() {
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const { data } = await api.post('/users/password-reset/', { username });
      setMessage(data.detail);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <Link to="/login" className="btn btn-link text-secondary p-0 mb-4 d-inline-flex align-items-center">
          <FiArrowLeft className="me-2" /> Back to Login
        </Link>

        <div className="auth-header text-center mb-4">
          <h2 className="section-title mb-1">Forgot Password?</h2>
          <p className="text-secondary">Enter your username to reset your password</p>
        </div>

        {success ? (
          <div className="text-center py-4">
            <FiCheckCircle size={48} className="text-success mb-3" />
            <p className="fw-bold mb-2">Reset Link Sent!</p>
            <p className="text-secondary mb-4">{message}</p>
            <p className="small text-muted">Note: During development, please check the backend server console for the link.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            {error && <div className="alert alert-danger mb-3">{error}</div>}
            
            <div className="mb-4">
              <label className="form-label">Username</label>
              <div className="input-group">
                <span className="input-group-text"><FiMail /></span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter your username"
                  required
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-100 py-2"
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

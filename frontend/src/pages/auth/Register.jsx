import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiUser, FiMail, FiLock, FiPhone, FiCheckCircle } from 'react-icons/fi';
import api from '../../api/axios';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: '',
    email: '',
    phone: '',
    first_name: '',
    last_name: '',
    password: '',
    confirm_password: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post('/users/register/', form);
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
      <div className="auth-container">
        <div className="auth-card text-center">
          <FiCheckCircle size={64} className="text-success mb-4" />
          <h2 className="section-title mb-2">Registration Successful!</h2>
          <p className="text-secondary">Your account has been created. Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header text-center">
          <h2 className="section-title mb-1">Create Account</h2>
          <p className="text-secondary">Join our medical community</p>
        </div>

        {error && <div className="alert alert-danger mt-3">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form mt-4">
          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label">First Name</label>
              <div className="input-group">
                <span className="input-group-text"><FiUser /></span>
                <input
                  type="text"
                  className="form-control"
                  required
                  value={form.first_name}
                  onChange={e => setForm({ ...form, first_name: e.target.value })}
                />
              </div>
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label">Last Name</label>
              <div className="input-group">
                <span className="input-group-text"><FiUser /></span>
                <input
                  type="text"
                  className="form-control"
                  required
                  value={form.last_name}
                  onChange={e => setForm({ ...form, last_name: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label">Username</label>
            <div className="input-group">
              <span className="input-group-text"><FiUser /></span>
              <input
                type="text"
                className="form-control"
                required
                value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })}
              />
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label">Email Address</label>
            <div className="input-group">
              <span className="input-group-text"><FiMail /></span>
              <input
                type="email"
                className="form-control"
                required
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
              />
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label">Phone Number</label>
            <div className="input-group">
              <span className="input-group-text"><FiPhone /></span>
              <input
                type="tel"
                className="form-control"
                required
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label">Password</label>
              <div className="input-group">
                <span className="input-group-text"><FiLock /></span>
                <input
                  type="password"
                  className="form-control"
                  required
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                />
              </div>
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label">Confirm Password</label>
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
          </div>

          <button
            type="submit"
            className="btn btn-primary w-100 mt-3 py-2"
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Register Now'}
          </button>
        </form>

        <div className="auth-footer text-center mt-4">
          <p className="text-secondary">
            Already have an account? <Link to="/login" className="text-moss fw-bold">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

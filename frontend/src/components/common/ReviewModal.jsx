import { useState } from 'react';
import { FiX, FiStar, FiCheckCircle } from 'react-icons/fi';
import api from '../../api/axios';

export default function ReviewModal({ isOpen, onClose }) {
  const [form, setForm] = useState({ patient_name: '', treatment: '', rating: 5, quote: '' });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/patients/public/reviews/', form);
      setSuccess(true);
    } catch (err) {
      console.error('Failed to submit review', err);
      alert('There was an error submitting your review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setForm({ patient_name: '', treatment: '', rating: 5, quote: '' });
    setSuccess(false);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.6)', zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20
    }}>
      <div style={{
        background: 'var(--linen)', borderRadius: 20, width: '100%', maxWidth: 500,
        position: 'relative', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
      }}>
        {/* Header */}
        <div style={{ padding: '24px 32px', background: 'var(--secondary-bg)', borderBottom: '1px solid var(--border-gold)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontFamily: '"Cormorant Garamond", serif', color: 'var(--bark)' }}>Share Your Experience</h3>
          <button onClick={handleClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <FiX size={24} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 32 }}>
          {success ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <FiCheckCircle size={64} color="var(--moss)" style={{ marginBottom: 16 }} />
              <h4 style={{ marginBottom: 10, fontFamily: '"Cormorant Garamond", serif' }}>Thank You!</h4>
              <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>Your review has been submitted and is pending approval.</p>
              <button className="btn btn-primary" onClick={handleClose}>Close</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className="form-group">
                <label className="form-label">Your Name *</label>
                <input className="input" required value={form.patient_name} onChange={e => setForm(f => ({ ...f, patient_name: e.target.value }))} placeholder="John Doe" />
              </div>

              <div className="form-group">
                <label className="form-label">Treatment Received *</label>
                <input className="input" required value={form.treatment} onChange={e => setForm(f => ({ ...f, treatment: e.target.value }))} placeholder="e.g. Spine Therapy" />
              </div>

              <div className="form-group">
                <label className="form-label">Rating</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <FiStar 
                      key={star} 
                      size={28} 
                      onClick={() => setForm(f => ({ ...f, rating: star }))}
                      style={{ cursor: 'pointer', fill: star <= form.rating ? 'var(--gold)' : 'transparent', color: star <= form.rating ? 'var(--gold)' : 'var(--border-gold)' }} 
                    />
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Your Review *</label>
                <textarea className="input" required rows={4} value={form.quote} onChange={e => setForm(f => ({ ...f, quote: e.target.value }))} placeholder="Tell us about your experience..." />
              </div>

              <button type="submit" className="btn btn-primary btn-lg" disabled={submitting} style={{ marginTop: 10 }}>
                {submitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

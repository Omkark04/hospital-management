import React, { useState, useEffect } from 'react';
import api from '../../../api/axios';
import { FiCheck, FiX, FiTrash2 } from 'react-icons/fi';

export default function ReviewManage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = () => {
    setLoading(true);
    api.get('/patients/admin/reviews/')
      .then(res => setReviews(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  const updateStatus = (id, newStatus) => {
    api.patch(`/patients/admin/reviews/${id}/`, { status: newStatus })
      .then(() => {
        setReviews(reviews.map(r => r.id === id ? { ...r, status: newStatus } : r));
      })
      .catch(err => alert('Failed to update review status'));
  };

  const deleteReview = (id) => {
    if (window.confirm("Are you sure you want to delete this review?")) {
      api.delete(`/patients/admin/reviews/${id}/`)
        .then(() => {
          setReviews(reviews.filter(r => r.id !== id));
        })
        .catch(err => alert('Failed to delete review'));
    }
  };

  return (
    <div className="dashboard-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--navy)' }}>Review Management</h1>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading reviews...</div>
        ) : reviews.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>No reviews found.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', minWidth: 800 }}>
              <thead>
                <tr style={{ background: 'var(--off-white)', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: 16 }}>Patient</th>
                  <th style={{ padding: 16 }}>Rating</th>
                  <th style={{ padding: 16 }}>Review</th>
                  <th style={{ padding: 16 }}>Status</th>
                  <th style={{ padding: 16 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map(r => (
                  <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: 16 }}>
                      <div style={{ fontWeight: 500, color: 'var(--navy)' }}>{r.patient_name}</div>
                      {r.patient_email && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{r.patient_email}</div>}
                    </td>
                    <td style={{ padding: 16 }}>
                      <div style={{ color: 'var(--copper)' }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
                    </td>
                    <td style={{ padding: 16 }}>
                      <div style={{ fontSize: '0.9rem', maxWidth: 300, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={r.review_text}>
                        {r.review_text}
                      </div>
                    </td>
                    <td style={{ padding: 16 }}>
                      <span style={{
                        padding: '4px 8px', borderRadius: 4, fontSize: '0.8rem', fontWeight: 600,
                        background: r.status === 'approved' ? 'rgba(5, 150, 105, 0.1)' : r.status === 'rejected' ? 'rgba(220, 38, 38, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                        color: r.status === 'approved' ? 'var(--moss)' : r.status === 'rejected' ? '#dc2626' : '#f59e0b'
                      }}>
                        {r.status.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: 16 }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {r.status !== 'approved' && (
                          <button 
                            title="Approve"
                            onClick={() => updateStatus(r.id, 'approved')}
                            style={{ background: 'var(--success-bg)', color: 'var(--moss)', border: 'none', width: 32, height: 32, borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <FiCheck size={16} />
                          </button>
                        )}
                        {r.status !== 'rejected' && (
                          <button 
                            title="Reject"
                            onClick={() => updateStatus(r.id, 'rejected')}
                            style={{ background: 'rgba(220, 38, 38, 0.1)', color: '#dc2626', border: 'none', width: 32, height: 32, borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <FiX size={16} />
                          </button>
                        )}
                        <button 
                          title="Delete"
                          onClick={() => deleteReview(r.id)}
                          style={{ background: 'rgba(100, 116, 139, 0.1)', color: 'var(--text-muted)', border: 'none', width: 32, height: 32, borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

import React from 'react';
import { FaTimes, FaUsers, FaUserInjured, FaMoneyBillWave } from 'react-icons/fa';

export default function BranchDetailModal({ branch, onClose }) {
  if (!branch) return null;

  return (
    <div className="modal-overlay" onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
    }}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{
        background: '#fff',
        width: '100%',
        maxWidth: '500px',
        borderRadius: '16px',
        padding: '24px',
        position: 'relative'
      }}>
        <button onClick={onClose} style={{
          position: 'absolute', top: '16px', right: '16px',
          background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#666'
        }}>
          <FaTimes />
        </button>

        <h3 style={{ marginTop: 0, marginBottom: '24px', fontSize: '1.4rem' }}>
          {branch.name} Performance
        </h3>

        <div className="form-grid">
          <div style={{ padding: '16px', background: 'var(--cyan-bg)', borderRadius: '8px' }}>
            <div style={{ color: 'var(--primary)', marginBottom: '8px' }}><FaUserInjured size={24} /></div>
            <div style={{ fontSize: '0.9rem', color: '#666' }}>Total Patients</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{branch.patients}</div>
          </div>
          
          <div style={{ padding: '16px', background: 'var(--purple-bg)', borderRadius: '8px' }}>
            <div style={{ color: 'var(--secondary)', marginBottom: '8px' }}><FaUsers size={24} /></div>
            <div style={{ fontSize: '0.9rem', color: '#666' }}>Employees</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{branch.employees}</div>
          </div>

          <div style={{ gridColumn: '1 / -1', padding: '16px', background: 'var(--green-bg)', borderRadius: '8px' }}>
            <div style={{ color: 'var(--success)', marginBottom: '8px' }}><FaMoneyBillWave size={24} /></div>
            <div style={{ fontSize: '0.9rem', color: '#666' }}>Total Revenue</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>₹{branch.revenue.toLocaleString()}</div>
          </div>
        </div>

      </div>
    </div>
  );
}

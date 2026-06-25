import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { getQRToken } from '../../../api/attendance_qr';
import { useAuth } from '../../../context/AuthContext';

export default function AttendanceKiosk() {
  const { user } = useAuth();
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [windowInfo, setWindowInfo] = useState('');
  const [timeLeft, setTimeLeft] = useState(30);

  const fetchToken = async () => {
    try {
      const res = await getQRToken();
      setToken(res.data.qr_token);
      setWindowInfo(res.data.window_info || '');
      setTimeLeft(30);
      setError('');
    } catch (err) {

      setError(err.response?.data?.error || 'Failed to fetch QR code');
      setWindowInfo(err.response?.data?.window_info || '');
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchToken();

    // Setup interval to fetch new token every 30s
    const fetchInterval = setInterval(() => {
      fetchToken();
    }, 30000);

    // Setup countdown timer
    const countInterval = setInterval(() => {
      setTimeLeft(t => (t > 0 ? t - 1 : 0));
    }, 1000);

    return () => {
      clearInterval(fetchInterval);
      clearInterval(countInterval);
    };
  }, []);

  return (
    <div style={{ padding: '40px 20px', textAlign: 'center', minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', padding: '40px', borderRadius: '24px', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', maxWidth: 550, width: '100%' }}>
        <h2 style={{ marginBottom: 8, fontSize: '2rem' }}>Attendance Kiosk</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>
          Scan this QR code with your employee app to log your attendance.
        </p>

        {windowInfo && (
          <div style={{ padding: '10px 16px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 12, marginBottom: 24, fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)' }}>
            🕒 {windowInfo}
          </div>
        )}

        {error ? (
          <div style={{ padding: 20, background: '#fee2e2', color: '#dc2626', borderRadius: 12, marginBottom: 20, fontWeight: 500 }}>
            {error}
          </div>
        ) : (
          <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '16px', display: 'inline-block' }}>
            {token ? (
              <QRCodeSVG value={token} size={250} level="H" includeMargin={true} />
            ) : (
              <div style={{ width: 250, height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="spinner"></div>
              </div>
            )}
          </div>
        )}

        <div style={{ marginTop: 30 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <div style={{ width: '100%', height: 4, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', background: 'var(--primary)', width: `${(timeLeft / 30) * 100}%`, transition: 'width 1s linear' }}></div>
            </div>
            <span style={{ fontWeight: 600, color: 'var(--primary)', minWidth: 40 }}>{timeLeft}s</span>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 8 }}>
            QR Code refreshes automatically to prevent screenshot sharing.
          </p>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats, Html5QrcodeScanType } from 'html5-qrcode';
import { scanQRToken } from '../../../api/attendance_qr';
import { FaMapMarkerAlt, FaCheckCircle, FaTimesCircle, FaCamera } from 'react-icons/fa';

export default function ScanAttendance() {
  const [status, setStatus] = useState('idle'); // idle, scanning, location, processing, success, error
  const [message, setMessage] = useState('');
  const [flagged, setFlagged] = useState(false);
  const scannerRef = useRef(null);

  useEffect(() => {
    // Cleanup scanner on unmount
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }
    };
  }, []);

  const startScanning = () => {
    setStatus('scanning');
    setMessage('Please scan the QR code displayed at the reception kiosk.');
    
    setTimeout(() => {
      if (!scannerRef.current) {
        scannerRef.current = new Html5QrcodeScanner(
          "qr-reader",
          { 
            fps: 10, 
            qrbox: { width: 250, height: 250 },
            formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
            supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA]
          },
          false
        );

        scannerRef.current.render(onScanSuccess, onScanFailure);
      }
    }, 100);
  };

  const onScanFailure = (err) => {
    // Ignore routine scan failures
  };

  const onScanSuccess = async (decodedText) => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch(console.error);
      scannerRef.current = null;
    }
    
    setStatus('location');
    setMessage('Verifying your GPS location...');

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => processAttendance(decodedText, position.coords.latitude, position.coords.longitude),
        (error) => {
          setStatus('error');
          setMessage('Failed to get location. Please enable GPS permissions.');
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setStatus('error');
      setMessage('Geolocation is not supported by your browser.');
    }
  };

  const processAttendance = async (qrToken, lat, lng) => {
    setStatus('processing');
    setMessage('Validating attendance...');
    
    try {
      const res = await scanQRToken(qrToken, lat, lng);
      setStatus('success');
      setMessage(res.data.message);
      setFlagged(res.data.flagged);
    } catch (err) {
      setStatus('error');
      setMessage(err.response?.data?.error || 'Failed to mark attendance.');
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '20px' }}>
      <style>{`
        #qr-reader input[type="file"],
        #html5-qrcode-anchor-scan-type-change {
          display: none !important;
        }
      `}</style>
      <div className="page-header" style={{ textAlign: 'center', marginBottom: 30 }}>
        <h2><FaMapMarkerAlt /> Scan Attendance</h2>
        <p>Log your daily check-in/out via QR code.</p>
      </div>

      <div className="card" style={{ padding: 40, textAlign: 'center' }}>
        {status === 'idle' && (
          <div>
            <div style={{ fontSize: '4rem', color: 'var(--primary)', marginBottom: 20 }}>
              <FaCamera />
            </div>
            <h3>Ready to Scan</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: 30 }}>
              Ensure you are physically present at the clinic. Location verification is required.
            </p>
            <button className="btn btn-primary" onClick={startScanning} style={{ padding: '12px 30px', fontSize: '1.1rem' }}>
              Open Scanner
            </button>
          </div>
        )}

        {status === 'scanning' && (
          <div>
            <p style={{ marginBottom: 20, fontWeight: 500 }}>{message}</p>
            <div id="qr-reader" style={{ width: '100%', maxWidth: 400, margin: '0 auto', borderRadius: 12, overflow: 'hidden' }}></div>
            <button className="btn btn-ghost" onClick={() => {
              if (scannerRef.current) scannerRef.current.clear();
              setStatus('idle');
            }} style={{ marginTop: 20 }}>Cancel</button>
          </div>
        )}

        {status === 'location' && (
          <div style={{ padding: '40px 0' }}>
            <div className="spinner" style={{ margin: '0 auto', marginBottom: 20 }}></div>
            <h3 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              <FaMapMarkerAlt color="var(--primary)" /> {message}
            </h3>
          </div>
        )}

        {status === 'processing' && (
          <div style={{ padding: '40px 0' }}>
            <div className="spinner" style={{ margin: '0 auto', marginBottom: 20 }}></div>
            <h3>{message}</h3>
          </div>
        )}

        {status === 'success' && (
          <div style={{ padding: '20px 0' }}>
            <FaCheckCircle color="var(--success)" size={64} style={{ marginBottom: 20 }} />
            <h3 style={{ color: 'var(--success)' }}>Success!</h3>
            <p style={{ fontSize: '1.1rem', marginBottom: 10 }}>{message}</p>
            {flagged && (
              <div style={{ padding: 12, background: '#fffbeb', color: '#b45309', borderRadius: 8, fontSize: '0.9rem', marginBottom: 20 }}>
                Note: You were flagged for being outside the configured attendance radius.
              </div>
            )}
            <button className="btn btn-outline" onClick={() => setStatus('idle')} style={{ marginTop: 20 }}>Done</button>
          </div>
        )}

        {status === 'error' && (
          <div style={{ padding: '20px 0' }}>
            <FaTimesCircle color="var(--danger)" size={64} style={{ marginBottom: 20 }} />
            <h3 style={{ color: 'var(--danger)' }}>Failed</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>{message}</p>
            <button className="btn btn-primary" onClick={() => setStatus('idle')}>Try Again</button>
          </div>
        )}
      </div>
    </div>
  );
}

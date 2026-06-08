import React, { useState, useEffect, useCallback } from 'react';
import { FaPhoneAlt, FaWhatsapp, FaSms, FaSearch, FaHistory, FaTimes, FaDownload, FaStickyNote } from 'react-icons/fa';
import { getPatients } from '../../../api/patients';
import { getQuickNotes, createCallLog, getCallLogs } from '../../../api/telecalling';

const PATIENTS_PER_PAGE = 20;

export default function TelecallingDashboard() {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [quickNotes, setQuickNotes] = useState([]);
  const [callLogs, setCallLogs] = useState({}); // mapped by patientId
  
  const [activeModal, setActiveModal] = useState(null); // { patient, type: 'call' | 'whatsapp' | 'sms' }
  const [logForm, setLogForm] = useState({ quick_note: '', custom_note: '' });
  const [saving, setSaving] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(null); // patientId
  
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportDates, setExportDates] = useState({ start: '', end: '' });

  const fetchPatients = useCallback(() => {
    setLoading(true);
    getPatients({ search: debouncedSearch || undefined, page, ordering: 'first_name' })
      .then(({ data }) => {
        const rows = data.results || data;
        setPatients(rows);
        setTotalCount(data.count || rows.length);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [debouncedSearch, page]);

  useEffect(() => {
    getQuickNotes()
      .then(({ data }) => {
        setQuickNotes(data.results || data);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const fetchHistory = async (patientId) => {
    try {
      const res = await getCallLogs({ patient: patientId });
      setCallLogs(prev => ({ ...prev, [patientId]: res.data.results || res.data }));
      setShowHistoryModal(patientId);
    } catch (e) {
      alert("Failed to load history");
    }
  };

  const handleActionClick = (patient, type) => {
    setLogForm({ quick_note: '', custom_note: '' });
    setActiveModal({ patient, type });
  };

  const executeAction = (patient, type) => {
    const phone = patient.phone.replace(/[^0-9]/g, '');
    const cleanPhone = phone.length === 10 ? `91${phone}` : phone;
    
    if (type === 'call') {
      window.open(`tel:+${cleanPhone}`, '_self');
    } else if (type === 'whatsapp') {
      window.open(`https://wa.me/${cleanPhone}`, '_blank');
    } else if (type === 'sms') {
      window.open(`sms:+${cleanPhone}`, '_self');
    } else if (type === 'note') {
      // No external action needed for just adding a note
      return;
    }
  };

  const handleLogSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        patient: activeModal.patient.id,
        call_type: activeModal.type,
        quick_note: logForm.quick_note || null,
        custom_note: logForm.custom_note
      };
      await createCallLog(payload);
      
      // Execute the native action
      executeAction(activeModal.patient, activeModal.type);
      
      // Close modal
      setActiveModal(null);
    } catch (err) {
      alert("Failed to save log");
    } finally {
      setSaving(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / PATIENTS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);

  const handleExport = async (e) => {
    e.preventDefault();
    try {
      const { exportCallLogs } = await import('../../../api/telecalling');
      const res = await exportCallLogs({ start_date: exportDates.start, end_date: exportDates.end });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `telecalling_logs_${exportDates.start || 'all'}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setShowExportModal(false);
    } catch (err) {
      alert("Failed to export logs");
    }
  };

  return (
    <div>
      <div className="page-header" style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>📞 Telecalling</h2>
          <p>Follow up with patients directly.</p>
        </div>
        <button onClick={() => setShowExportModal(true)} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <FaDownload /> Export
        </button>
      </div>

      <div style={{ position: 'relative', marginBottom: 20 }}>
        <FaSearch style={{ position: 'absolute', top: 14, left: 14, color: 'var(--text-muted)' }} />
        <input 
          type="text" 
          className="input" 
          placeholder="Search patients by name or phone..." 
          style={{ paddingLeft: 40, width: '100%' }}
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>Loading patients...</div>
        ) : patients.length === 0 ? (
          <div className="card card-body" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No patients found.</div>
        ) : (
          patients.map(p => (
            <div key={p.id} className="card card-body" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ margin: 0 }}>{p.first_name} {p.last_name}</h4>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4 }}>{p.phone}</div>
                </div>
                <button onClick={() => fetchHistory(p.id)} className="btn btn-ghost btn-sm" style={{ color: 'var(--primary)' }}>
                  <FaHistory /> History
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10, marginTop: 8 }}>
                <button 
                  onClick={() => handleActionClick(p, 'call')}
                  className="btn btn-primary" 
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px' }}
                >
                  <FaPhoneAlt /> Call
                </button>
                <button 
                  onClick={() => handleActionClick(p, 'whatsapp')}
                  className="btn btn-success" 
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px' }}
                >
                  <FaWhatsapp /> WhatsApp
                </button>
                <button 
                  onClick={() => handleActionClick(p, 'sms')}
                  className="btn btn-outline" 
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px', color: 'var(--text-primary)', borderColor: 'var(--border)' }}
                >
                  <FaSms /> SMS
                </button>
                <button 
                  onClick={() => handleActionClick(p, 'note')}
                  className="btn btn-outline" 
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px', color: 'var(--text-primary)', borderColor: 'var(--border)' }}
                >
                  <FaStickyNote /> Note
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {!loading && totalCount > 0 && (
        <div style={{ padding: '16px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Showing {(currentPage - 1) * PATIENTS_PER_PAGE + 1}-{Math.min(currentPage * PATIENTS_PER_PAGE, totalCount)} of {totalCount} patients
          </span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button className="btn btn-ghost btn-sm" disabled={currentPage === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
              Prev
            </button>
            <span className="btn btn-ghost btn-sm">{currentPage} / {totalPages}</span>
            <button className="btn btn-ghost btn-sm" disabled={currentPage === totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>
              Next
            </button>
          </div>
        </div>
      )}

      {/* Action & Logging Modal */}
      {activeModal && (
        <div className="modal-overlay" onClick={() => !saving && setActiveModal(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'flex-end' }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ background: '#fff', width: '100%', borderTopLeftRadius: '20px', borderTopRightRadius: '20px', padding: '24px', animation: 'slideUp 0.3s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8, textTransform: 'capitalize' }}>
                {activeModal.type === 'call' && <FaPhoneAlt color="var(--primary)" />}
                {activeModal.type === 'whatsapp' && <FaWhatsapp color="var(--success)" />}
                {activeModal.type === 'sms' && <FaSms color="var(--text-primary)" />}
                {activeModal.type === 'note' && <FaStickyNote color="var(--text-primary)" />}
                {activeModal.type === 'note' ? 'Add Note' : `Log ${activeModal.type}`} — {activeModal.patient.first_name}
              </h3>
              <button onClick={() => !saving && setActiveModal(null)} className="btn btn-ghost" style={{ padding: 4 }}><FaTimes/></button>
            </div>

            <form onSubmit={handleLogSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Quick Note (Optional)</label>
                <select className="input" value={logForm.quick_note} onChange={e => setLogForm(p => ({ ...p, quick_note: e.target.value }))}>
                  <option value="">Select a frequent note...</option>
                  {quickNotes.map(qn => (
                    <option key={qn.id} value={qn.id}>{qn.title}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Custom Note</label>
                <textarea 
                  className="input" 
                  rows="3" 
                  placeholder="Additional details..."
                  value={logForm.custom_note} 
                  onChange={e => setLogForm(p => ({ ...p, custom_note: e.target.value }))}
                ></textarea>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '14px', fontSize: '1rem', marginTop: 10 }} disabled={saving}>
                {saving ? 'Logging...' : activeModal.type === 'note' ? 'Save Note' : `Log & Open ${activeModal.type.charAt(0).toUpperCase() + activeModal.type.slice(1)}`}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && (
        <div className="modal-overlay" onClick={() => setShowHistoryModal(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'flex-end' }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ background: '#fff', width: '100%', height: '70vh', borderTopLeftRadius: '20px', borderTopRightRadius: '20px', padding: '24px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0 }}>Interaction History</h3>
              <button onClick={() => setShowHistoryModal(null)} className="btn btn-ghost" style={{ padding: 4 }}><FaTimes/></button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {(!callLogs[showHistoryModal] || callLogs[showHistoryModal].length === 0) ? (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No history found for this patient.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {callLogs[showHistoryModal].map(log => (
                    <div key={log.id} style={{ padding: '12px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span className={`badge badge-${log.call_type === 'whatsapp' ? 'success' : log.call_type === 'sms' ? 'info' : 'primary'}`} style={{ textTransform: 'capitalize' }}>
                          {log.call_type}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                      {log.quick_note_text && <div style={{ fontSize: '0.9rem', fontWeight: 'bold', marginBottom: 4 }}>{log.quick_note_text}</div>}
                      {log.custom_note && <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{log.custom_note}</div>}
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 8, textAlign: 'right' }}>
                        By: {log.caller_name || 'Unknown'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div className="modal-overlay" onClick={() => setShowExportModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ background: '#fff', width: '90%', maxWidth: '400px', borderRadius: '12px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0 }}>Export Call Logs</h3>
              <button onClick={() => setShowExportModal(false)} className="btn btn-ghost" style={{ padding: 4 }}><FaTimes/></button>
            </div>
            <form onSubmit={handleExport} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Start Date</label>
                <input type="date" className="input" value={exportDates.start} onChange={e => setExportDates(p => ({ ...p, start: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">End Date</label>
                <input type="date" className="input" value={exportDates.end} onChange={e => setExportDates(p => ({ ...p, end: e.target.value }))} />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 10 }}>Download CSV</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

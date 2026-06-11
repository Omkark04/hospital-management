import React, { useState, useEffect, useCallback } from 'react';
import { 
  FaPhoneAlt, 
  FaWhatsapp, 
  FaSms, 
  FaSearch, 
  FaHistory, 
  FaTimes, 
  FaDownload, 
  FaStickyNote, 
  FaCalendarDay, 
  FaExclamationTriangle 
} from 'react-icons/fa';
import { 
  getQuickNotes, 
  createCallLog, 
  getCallLogs, 
  getTelecallingSmartList 
} from '../../../api/telecalling';
import api from '../../../api/axios';

const PATIENTS_PER_PAGE = 20;

const TABS = [
  { id: 'today', name: 'Coming Today', icon: <FaCalendarDay /> },
  { id: 'tomorrow', name: 'Coming Tomorrow', icon: <FaCalendarDay /> },
  { id: 'missed_7', name: 'Missed 7 Days', icon: <FaExclamationTriangle /> },
  { id: 'missed_15', name: 'Missed 15 Days', icon: <FaExclamationTriangle /> },
  { id: 'missed_30', name: 'Missed 1 Month', icon: <FaExclamationTriangle /> },
  { id: 'missed_90_180', name: 'Missed 3–6 Months', icon: <FaExclamationTriangle /> }
];

export default function TelecallingDashboard() {
  const [activeTab, setActiveTab] = useState('today');
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [quickNotes, setQuickNotes] = useState([]);
  const [callLogs, setCallLogs] = useState({}); // mapped by patientId
  
  const [activeModal, setActiveModal] = useState(null); // { patient, type: 'call' | 'whatsapp' | 'sms' | 'note' }
  const [logForm, setLogForm] = useState({ quick_note: '', custom_note: '' });
  const [saving, setSaving] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(null); // patientId

  const fetchPatients = useCallback(() => {
    setLoading(true);
    getTelecallingSmartList({ 
      list: activeTab, 
      search: debouncedSearch || undefined, 
      page 
    })
      .then(({ data }) => {
        const rows = data.results || data;
        setPatients(rows);
        setTotalCount(data.count || rows.length);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [activeTab, debouncedSearch, page]);

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
      
      executeAction(activeModal.patient, activeModal.type);
      setActiveModal(null);
    } catch (err) {
      alert("Failed to save log");
    } finally {
      setSaving(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / PATIENTS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);

  const handleExportList = async () => {
    try {
      setLoading(true);
      const res = await api.get('/telecalling/smart-lists/', {
        params: { 
          list: activeTab, 
          export: 'csv',
          search: debouncedSearch || undefined
        },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `telecalling_list_${activeTab}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert("Failed to export segment list");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <style>{`
        .telecalling-grid-layout {
          display: flex;
          gap: 20px;
          margin-top: 16px;
        }
        .telecalling-sidebar {
          width: 260px;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .telecalling-content-area {
          flex: 1;
        }
        .telecalling-action-buttons {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          margin-top: 8px;
        }
        @media (max-width: 768px) {
          .telecalling-grid-layout {
            flex-direction: column;
          }
          .telecalling-sidebar {
            width: 100%;
            flex-direction: row;
            overflow-x: auto;
            padding-bottom: 8px;
            border-bottom: 1px solid var(--border);
          }
          .telecalling-sidebar button {
            white-space: nowrap;
            width: auto !important;
          }
          .telecalling-action-buttons {
            grid-template-columns: 1fr 1fr;
          }
        }
      `}</style>

      <div className="page-header" style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>📞 Telecalling</h2>
          <p>Follow up with patients directly.</p>
        </div>
        <button onClick={handleExportList} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <FaDownload /> Export Segment
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

      <div className="telecalling-grid-layout">
        {/* Sidebar tabs */}
        <div className="telecalling-sidebar">
          {TABS.map(t => (
            <button
              key={t.id}
              className={`btn ${activeTab === t.id ? 'btn-primary' : 'btn-outline'}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                justifyContent: 'flex-start',
                width: '100%',
                padding: '12px 16px',
                textAlign: 'left'
              }}
              onClick={() => { setActiveTab(t.id); setPage(1); }}
            >
              {t.icon} {t.name}
            </button>
          ))}
        </div>

        {/* Content area */}
        <div className="telecalling-content-area">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <div className="spinner" style={{ margin: '0 auto 12px' }} />
                Loading patients...
              </div>
            ) : patients.length === 0 ? (
              <div className="card card-body" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>
                No patients found in this segment.
              </div>
            ) : (
              patients.map(p => (
                <div key={p.id} className="card card-body" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '1.05rem' }}>{p.first_name} {p.last_name}</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 6, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        <div>📱 Phone: {p.phone}</div>
                        {p.last_appointment_date && <div>📅 Last Visit: {p.last_appointment_date}</div>}
                        {p.next_appointment_date && <div>⏰ Next Visit: {p.next_appointment_date}</div>}
                      </div>
                    </div>
                    <button onClick={() => fetchHistory(p.id)} className="btn btn-ghost btn-sm" style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <FaHistory /> History
                    </button>
                  </div>

                  <div className="telecalling-action-buttons">
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
        </div>
      </div>

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
    </div>
  );
}

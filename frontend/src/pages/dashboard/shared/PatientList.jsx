import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getPatients, deletePatient } from '../../../api/patients';
import { FaDownload, FaUpload, FaTimes, FaUsers, FaHistory, FaPhone, FaMapMarkerAlt, FaFileInvoice, FaUserCircle, FaPrescriptionBottleAlt, FaTrash } from 'react-icons/fa';
import { useAuth } from '../../../context/AuthContext';
import { getPrescriptions } from '../../../api/medicines';
import { getBills } from '../../../api/billing';

export default function PatientList() {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [showExportModal, setShowExportModal] = useState(false);
  const [exportDates, setExportDates] = useState({ start: '', end: '' });

  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [importError, setImportError] = useState(null);

  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientHistory, setPatientHistory] = useState({ prescriptions: [], bills: [], loading: false });

  const fetchPatients = useCallback(() => {
    setLoading(true);
    getPatients({ search: search || undefined, page })
      .then(({ data }) => {
        setPatients(data.results || data);
        setTotalCount(data.count || (data.results || data).length);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [search, page]);

  useEffect(() => { fetchPatients(); }, [fetchPatients]);

  const handleDelete = async (patient) => {
    if (!window.confirm(`Are you sure you want to remove patient "${patient.first_name} ${patient.last_name}"? This will deactivate their profile.`)) return;
    try {
      await deletePatient(patient.id);
      fetchPatients();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to remove patient.');
    }
  };

  const genderBadge = (g) => ({ male: 'info', female: 'secondary', other: 'warning' }[g] || 'primary');

  const handleExport = async (e) => {
    e.preventDefault();
    try {
      const { exportPatients } = await import('../../../api/patients');
      const res = await exportPatients({ start_date: exportDates.start, end_date: exportDates.end });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `patients_export_${exportDates.start || 'all'}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setShowExportModal(false);
    } catch (err) {
      alert("Failed to export patients");
    }
  };

  const handleImport = async (e) => {
    e.preventDefault();
    if (!importFile) return alert("Please select a file.");
    setImporting(true);
    setImportError(null);
    setImportResult(null);
    try {
      const { importPatients } = await import('../../../api/patients');
      const formData = new FormData();
      formData.append('file', importFile);
      const res = await importPatients(formData);
      setImportResult(res.data);
      fetchPatients(); // refresh list
    } catch (err) {
      setImportError(err.response?.data?.error || "Failed to import patients");
    } finally {
      setImporting(false);
    }
  };

  useEffect(() => {
    if (selectedPatient) {
      setPatientHistory(p => ({ ...p, loading: true }));
      Promise.all([
        getPrescriptions({ patient: selectedPatient.id }),
        getBills({ patient: selectedPatient.id })
      ]).then(([rx, bills]) => {
        setPatientHistory({
          prescriptions: rx.data.results || rx.data,
          bills: bills.data.results || bills.data,
          loading: false
        });
      }).catch(() => setPatientHistory(p => ({ ...p, loading: false })));
    }
  }, [selectedPatient]);

  const downloadTemplate = () => {
    const headers = [
      'First Name', 'Last Name', 'Email', 'Phone', 'Gender', 'Blood Group',
      'Address', 'Age', 'Problem', 'Refer By', 'Medicine', 'Duration of Pain'
    ].join(',');
    const sampleRow = [
      'John', 'Doe', 'john@example.com', '9876543210', 'male', 'O+',
      '123 Street Address', '45', 'Chronic back pain', 'Dr. Smith', 'Aspirin', '6 months'
    ].join(',');
    const csvContent = `data:text/csv;charset=utf-8,${headers}\n${sampleRow}`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "patient_import_template.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div>
      <div className="page-header">
        <h2>Patients</h2>
        <p>All registered patients in your branch.</p>
        <div className="page-actions">
          <input
            className="input"
            placeholder="Search by name, phone, UHID..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            style={{ maxWidth: 320 }}
          />
          <button onClick={() => { setImportFile(null); setImportResult(null); setImportError(null); setShowImportModal(true); }} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <FaUpload /> Import
          </button>
          <button onClick={() => setShowExportModal(true)} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <FaDownload /> Export
          </button>
          {(user?.role === 'owner' || user?.role === 'receptionist') && (
            <Link to="/dashboard/patients/register" className="btn btn-primary">+ Register Patient</Link>
          )}
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
        ) : patients.length === 0 ? (
          <div className="empty-state"><div className="icon"><FaUsers /></div><p>No patients found.{search && ' Try a different search.'}</p></div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>UHID</th>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Gender</th>
                  <th>Blood Group</th>
                  <th>Registered</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {patients.map(p => (
                  <tr key={p.id}>
                    <td><span style={{ fontFamily: 'monospace', color: 'var(--primary)', fontSize: '0.85rem' }}>{p.uhid}</span></td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{p.first_name} {p.last_name}</div>
                      {p.email && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{p.email}</div>}
                    </td>
                    <td>{p.phone}</td>
                    <td><span className={`badge badge-${genderBadge(p.gender)}`}>{p.gender || '—'}</span></td>
                    <td><span className="badge badge-danger">{p.blood_group || '—'}</span></td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{p.created_at?.split('T')[0]}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => setSelectedPatient(p)} className="btn btn-ghost btn-sm">View</button>
                        {(user?.role === 'owner' || user?.role === 'receptionist') && (
                          <button onClick={() => handleDelete(p)} className="btn btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--danger, #ef4444)', color: '#fff', border: 'none', cursor: 'pointer' }}><FaTrash style={{ fontSize: '0.75rem' }} /> Remove</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalCount > 10 && (
          <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Showing {patients.length} of {totalCount} patients
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-ghost btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
              <span className="btn btn-ghost btn-sm">{page}</span>
              <button className="btn btn-ghost btn-sm" disabled={patients.length < 10} onClick={() => setPage(p => p + 1)}>Next →</button>
            </div>
          </div>
        )}
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div className="modal-overlay" onClick={() => setShowExportModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ background: '#fff', width: '90%', maxWidth: '400px', borderRadius: '12px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0 }}>Export Patients</h3>
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

      {/* Import Modal */}
      {showImportModal && (
        <div className="modal-overlay" onClick={() => !importing && setShowImportModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ background: '#fff', width: '90%', maxWidth: '550px', borderRadius: '12px', padding: '24px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexShrink: 0 }}>
              <h3 style={{ margin: 0 }}>Import Patients</h3>
              <button onClick={() => !importing && setShowImportModal(false)} className="btn btn-ghost" style={{ padding: 4 }}><FaTimes/></button>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', paddingRight: 4 }}>
              {importError && (
                <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', color: '#b91c1c', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: '0.9rem' }}>
                  <strong>Error:</strong> {importError}
                </div>
              )}

              {importing ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <div className="spinner" style={{ margin: '0 auto 16px auto' }} />
                  <p style={{ color: 'var(--text-muted)', margin: 0 }}>Processing and importing your patient data, please wait...</p>
                </div>
              ) : importResult ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ background: '#ecfdf5', border: '1px solid #d1fae5', color: '#065f46', padding: '16px', borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600 }}>Import Completed!</h4>
                    <p style={{ margin: 0, fontSize: '0.9rem' }}>{importResult.message}</p>
                  </div>

                  {/* Summary counts */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, textAlign: 'center' }}>
                    <div style={{ background: '#f3f4f6', padding: '12px 8px', borderRadius: 8 }}>
                      <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>{importResult.total_rows || 0}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>Total Rows</div>
                    </div>
                    <div style={{ background: '#ecfdf5', padding: '12px 8px', borderRadius: 8 }}>
                      <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#059669' }}>{importResult.created || 0}</div>
                      <div style={{ fontSize: '0.75rem', color: '#047857', marginTop: 2 }}>Created</div>
                    </div>
                    <div style={{ background: '#eff6ff', padding: '12px 8px', borderRadius: 8 }}>
                      <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#2563eb' }}>{importResult.updated || 0}</div>
                      <div style={{ fontSize: '0.75rem', color: '#1d4ed8', marginTop: 2 }}>Updated</div>
                    </div>
                  </div>

                  {/* Mapped columns */}
                  {importResult.detected_columns && (
                    <div>
                      <h4 style={{ margin: '0 0 8px 0', fontSize: '0.9rem', fontWeight: 600 }}>Column Mapping Results</h4>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {Object.entries(importResult.detected_columns).map(([col, target]) => (
                          <span 
                            key={col} 
                            style={{ 
                              display: 'inline-flex', 
                              alignItems: 'center', 
                              padding: '2px 8px', 
                              borderRadius: '4px', 
                              fontSize: '0.75rem', 
                              fontWeight: 500,
                              background: target === '(ignored)' ? '#f3f4f6' : '#d1fae5',
                              color: target === '(ignored)' ? '#6b7280' : '#065f46',
                              border: target === '(ignored)' ? '1px solid #e5e7eb' : '1px solid #a7f3d0'
                            }}
                          >
                            {col} &rarr; {target}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Skipped rows */}
                  {importResult.skipped && importResult.skipped.length > 0 && (
                    <div>
                      <h4 style={{ margin: '0 0 6px 0', fontSize: '0.9rem', color: '#d97706', fontWeight: 600 }}>
                        Skipped Rows ({importResult.skipped_count})
                      </h4>
                      <div style={{ maxHeight: '120px', overflowY: 'auto', border: '1px solid #fde68a', borderRadius: '6px', padding: '8px 12px', background: '#fffbeb', fontSize: '0.8rem', color: '#92400e' }}>
                        {importResult.skipped.map((s, idx) => (
                          <div key={idx} style={{ padding: '3px 0', borderBottom: idx < importResult.skipped.length - 1 ? '1px solid #fef3c7' : 'none' }}>
                            <strong>Row {s.row}:</strong> {s.reason}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Failed/Error rows */}
                  {importResult.errors && importResult.errors.length > 0 && (
                    <div>
                      <h4 style={{ margin: '0 0 6px 0', fontSize: '0.9rem', color: '#dc2626', fontWeight: 600 }}>
                        Failed Rows ({importResult.error_count})
                      </h4>
                      <div style={{ maxHeight: '120px', overflowY: 'auto', border: '1px solid #fca5a5', borderRadius: '6px', padding: '8px 12px', background: '#fef2f2', fontSize: '0.8rem', color: '#991b1b' }}>
                        {importResult.errors.map((e, idx) => (
                          <div key={idx} style={{ padding: '3px 0', borderBottom: idx < importResult.errors.length - 1 ? '1px solid #fee2e2' : 'none' }}>
                            <strong>Row {e.row}:</strong> {e.error}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                    <button 
                      onClick={() => { setImportResult(null); setImportFile(null); setImportError(null); }} 
                      className="btn btn-outline" 
                      style={{ flex: 1 }}
                    >
                      Import Another File
                    </button>
                    <button 
                      onClick={() => setShowImportModal(false)} 
                      className="btn btn-primary" 
                      style={{ flex: 1 }}
                    >
                      Done
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ marginBottom: 20, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    <p style={{ marginBottom: 12 }}>Upload a CSV (.csv) or Excel (.xlsx) file containing patient records. Existing patients (matched by phone number) will be updated dynamically.</p>
                    
                    <div style={{ background: 'var(--bg-secondary, #f8f9fa)', padding: '12px 16px', borderRadius: 8, marginBottom: 16 }}>
                      <h4 style={{ margin: '0 0 8px 0', fontSize: '0.95rem', color: 'var(--text-primary)', fontWeight: 600 }}>Supported Columns:</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', fontSize: '0.82rem' }}>
                        <div>
                          <strong>First Name</strong> <span style={{ color: 'var(--danger)', fontSize: '0.75rem' }}>*Required</span>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>or Name / Patient Name</div>
                        </div>
                        <div>
                          <strong>Last Name</strong> <span style={{ color: 'var(--danger)', fontSize: '0.75rem' }}>*Required</span>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>optional if full name provided</div>
                        </div>
                        <div>
                          <strong>Phone</strong> <span style={{ color: 'var(--danger)', fontSize: '0.75rem' }}>*Required</span>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>10 digits (mobile, contact)</div>
                        </div>
                        <div>
                          <strong>Gender</strong>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>male/female/other (m/f)</div>
                        </div>
                        <div>
                          <strong>Age / DOB</strong>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>age in years or date of birth</div>
                        </div>
                        <div>
                          <strong>Problem</strong>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>diagnosis / chief complaint</div>
                        </div>
                        <div>
                          <strong>Medicine</strong>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>past medications / history</div>
                        </div>
                        <div>
                          <strong>Refer By</strong>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>referred by person or source</div>
                        </div>
                        <div style={{ gridColumn: 'span 2' }}>
                          <strong>Duration of Pain</strong>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>appended to chief complaint</div>
                        </div>
                      </div>
                    </div>

                    <button onClick={downloadTemplate} type="button" className="btn btn-ghost btn-sm" style={{ color: 'var(--primary)', padding: 0, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <FaDownload size={12} /> Download Template CSV
                    </button>
                  </div>

                  <form onSubmit={handleImport} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div className="form-group">
                      <label className="form-label" style={{ fontWeight: 600 }}>Select File</label>
                      <input 
                        type="file" 
                        accept=".csv,.xlsx,.xls"
                        className="input" 
                        onChange={e => setImportFile(e.target.files[0])} 
                        required
                      />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 10 }} disabled={!importFile}>
                      Upload & Import
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Patient Detail Modal */}
      {selectedPatient && (
        <div className="modal-overlay" onClick={() => setSelectedPatient(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-card, #fff)', width: '100%', maxWidth: '800px', maxHeight: '90vh', borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ padding: '20px 24px', background: 'var(--primary)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>
                  <FaUserCircle />
                </div>
                <div>
                  <h3 style={{ margin: 0 }}>{selectedPatient.first_name} {selectedPatient.last_name}</h3>
                  <span style={{ fontSize: '0.85rem', opacity: 0.9 }}>UHID: {selectedPatient.uhid}</span>
                </div>
              </div>
              <button onClick={() => setSelectedPatient(null)} className="btn btn-ghost" style={{ color: 'white' }}><FaTimes/></button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* Info Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                <div className="card card-body" style={{ padding: 12, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>Contact</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem' }}><FaPhone size={12}/> {selectedPatient.phone}</div>
                </div>
                <div className="card card-body" style={{ padding: 12, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>Blood Group</div>
                  <div style={{ color: 'var(--danger)', fontWeight: 600 }}>{selectedPatient.blood_group || 'Not set'}</div>
                </div>
                <div className="card card-body" style={{ padding: 12, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>Gender</div>
                  <div style={{ textTransform: 'capitalize' }}>{selectedPatient.gender}</div>
                </div>
              </div>

              {selectedPatient.address && (
                <div className="card card-body" style={{ padding: 12, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>Address</div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: '0.9rem' }}><FaMapMarkerAlt size={12} style={{ marginTop: 4 }}/> {selectedPatient.address}</div>
                </div>
              )}

              {/* Tabs for history */}
              <div>
                <h4 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}><FaHistory/> Visit History</h4>
                {patientHistory.loading ? (
                   <div style={{ padding: 20, textAlign: 'center' }}><div className="spinner" /></div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {patientHistory.prescriptions.length === 0 && patientHistory.bills.length === 0 ? (
                      <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 20 }}>No clinical history found.</p>
                    ) : (
                      <>
                        {patientHistory.prescriptions.slice(0, 5).map(rx => (
                          <div key={rx.id} className="card card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--border-card)' }}>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}><FaPrescriptionBottleAlt/> Prescription</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(rx.created_at).toLocaleDateString()} · Dr. {rx.doctor_name || 'Medical Staff'}</div>
                            </div>
                            <Link to={`/dashboard/prescriptions/${rx.id}`} className="btn btn-ghost btn-sm" style={{ color: 'var(--primary)' }}>Details →</Link>
                          </div>
                        ))}
                        {patientHistory.bills.slice(0, 5).map(bill => (
                          <div key={bill.id} className="card card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--border-card)' }}>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}><FaFileInvoice/> Bill #{bill.bill_number || bill.id}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(bill.created_at).toLocaleDateString()} · ₹{bill.total_amount} · <span style={{ color: bill.status === 'paid' ? 'var(--success)' : 'var(--danger)' }}>{bill.status}</span></div>
                            </div>
                            <Link to={`/dashboard/billing`} className="btn btn-ghost btn-sm" style={{ color: 'var(--primary)' }}>View Bill →</Link>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            <div style={{ padding: '16px 24px', background: 'var(--bg-secondary, #f8f9fa)', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setSelectedPatient(null)} className="btn btn-outline">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

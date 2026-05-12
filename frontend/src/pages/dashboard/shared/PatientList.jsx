import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getPatients } from '../../../api/patients';
import { FaDownload, FaUpload, FaTimes, FaUsers, FaHistory, FaPhone, FaMapMarkerAlt, FaFileInvoice, FaUserCircle, FaPrescriptionBottleAlt } from 'react-icons/fa';
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
    try {
      const { importPatients } = await import('../../../api/patients');
      const formData = new FormData();
      formData.append('file', importFile);
      const res = await importPatients(formData);
      alert(res.data.message);
      setShowImportModal(false);
      setImportFile(null);
      fetchPatients(); // refresh list
    } catch (err) {
      alert(err.response?.data?.error || "Failed to import patients");
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
    const csvContent = "data:text/csv;charset=utf-8,First Name,Last Name,Email,Phone,Gender,Blood Group,Address\nJohn,Doe,john@example.com,9876543210,male,O+,123 Street";
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
          <button onClick={() => setShowImportModal(true)} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
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
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ background: '#fff', width: '90%', maxWidth: '500px', borderRadius: '12px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0 }}>Import Patients</h3>
              <button onClick={() => !importing && setShowImportModal(false)} className="btn btn-ghost" style={{ padding: 4 }}><FaTimes/></button>
            </div>
            
            <div style={{ marginBottom: 20, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              <p style={{ marginBottom: 12 }}>Upload a CSV file containing patient records. Existing patients (matched by phone number) will be updated.</p>
              
              <div style={{ background: 'var(--bg-secondary, #f8f9fa)', padding: '12px 16px', borderRadius: 8, marginBottom: 16 }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '0.95rem', color: 'var(--text-primary)' }}>Expected CSV Columns:</h4>
                <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <li><strong>First Name</strong> <span style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>*Required</span></li>
                  <li><strong>Last Name</strong> <span style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>*Required</span></li>
                  <li><strong>Phone</strong> <span style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>*Required</span> (10 digits)</li>
                  <li><strong>Email</strong> (Optional, valid email format)</li>
                  <li><strong>Gender</strong> (Optional, e.g., male, female, other)</li>
                  <li><strong>Blood Group</strong> (Optional, e.g., O+, A-, B+)</li>
                  <li><strong>Address</strong> (Optional)</li>
                </ul>
              </div>

              <button onClick={downloadTemplate} type="button" className="btn btn-ghost btn-sm" style={{ color: 'var(--primary)', padding: 0, fontWeight: 600 }}>
                Download Template CSV
              </button>
            </div>

            <form onSubmit={handleImport} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Select CSV File</label>
                <input 
                  type="file" 
                  accept=".csv"
                  className="input" 
                  onChange={e => setImportFile(e.target.files[0])} 
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 10 }} disabled={!importFile || importing}>
                {importing ? 'Importing...' : 'Upload & Import'}
              </button>
            </form>
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

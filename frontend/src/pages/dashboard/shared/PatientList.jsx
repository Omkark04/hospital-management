import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getPatients } from '../../../api/patients';
import { useAuth } from '../../../context/AuthContext';

export default function PatientList() {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

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

  return (
    <div>
      <div className="page-header">
        <h2>Patients</h2>
        <p>All registered patients in your branch.</p>
        <div className="page-actions">
          <input
            className="input"
            placeholder="🔍 Search by name, phone, UHID..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            style={{ maxWidth: 320 }}
          />
          {(user?.role === 'owner' || user?.role === 'receptionist') && (
            <Link to="/dashboard/patients/register" className="btn btn-primary">+ Register Patient</Link>
          )}
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
        ) : patients.length === 0 ? (
          <div className="empty-state"><div className="icon">🧑‍⚕️</div><p>No patients found.{search && ' Try a different search.'}</p></div>
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
                        <button className="btn btn-ghost btn-sm">View</button>
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
    </div>
  );
}

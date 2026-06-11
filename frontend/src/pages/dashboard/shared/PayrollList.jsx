import { useState, useEffect, useCallback } from 'react';
import { 
  getPayroll, 
  calculatePayroll, 
  getEmployees, 
  markPayrollPaid,
  getOvertimeConfigs,
  createOvertimeConfig,
  updateOvertimeConfig,
  getOvertimeRecords,
  reviewOvertimeRecord
} from '../../../api/hr';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../api/axios';
import { FaMoneyBillWave, FaCalculator, FaCheckCircle, FaClock, FaSlidersH, FaUserCheck } from 'react-icons/fa';

const STATUS_COLORS = { pending: 'warning', paid: 'success' };

export default function PayrollList() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('slips'); // 'slips', 'overtime_records', 'overtime_configs'
  
  // Salary slips state
  const [slips, setSlips] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [calcModal, setCalcModal] = useState(false);
  const [calcForm, setCalcForm] = useState({ employee: '', month: new Date().toISOString().slice(0, 7) });
  const [calculating, setCalculating] = useState(false);

  // Overtime state
  const [otRecords, setOtRecords] = useState([]);
  const [otConfigs, setOtConfigs] = useState([]);
  const [loadingOt, setLoadingOt] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [editingConfig, setEditingConfig] = useState(null);
  const [configForm, setConfigForm] = useState({ branch: '', rate_type: '1.5x', flat_rate: 0 });
  const [branches, setBranches] = useState([]);

  // Fetch Slips
  const fetchData = useCallback(() => {
    setLoading(true);
    getPayroll({ month })
      .then(({ data }) => setSlips(data.results || data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [month]);

  useEffect(() => { 
    if (activeTab === 'slips') {
      fetchData(); 
    }
  }, [activeTab, fetchData]);

  // Load employee list for calculator
  useEffect(() => {
    getEmployees()
      .then(({ data }) => setEmployees(data.results || data))
      .catch(console.error);
  }, []);

  // Fetch Overtime Records & Configs
  const fetchOtRecords = useCallback(() => {
    setLoadingOt(true);
    getOvertimeRecords()
      .then(({ data }) => setOtRecords(data.results || data))
      .catch(console.error)
      .finally(() => setLoadingOt(false));
  }, []);

  const fetchOtConfigs = useCallback(() => {
    setLoadingOt(true);
    getOvertimeConfigs()
      .then(({ data }) => setOtConfigs(data.results || data))
      .catch(console.error)
      .finally(() => setLoadingOt(false));
  }, []);

  useEffect(() => {
    if (activeTab === 'overtime_records') {
      fetchOtRecords();
    } else if (activeTab === 'overtime_configs') {
      fetchOtConfigs();
      api.get('/branches/public/')
        .then(({ data }) => setBranches(data.results || data))
        .catch(console.error);
    }
  }, [activeTab, fetchOtRecords, fetchOtConfigs]);

  // Calculate Salary
  const handleCalculate = async (e) => {
    e.preventDefault();
    setCalculating(true);
    try {
      await calculatePayroll(calcForm.employee, calcForm.month);
      setCalcModal(false);
      if (calcForm.month === month) fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to calculate payroll.');
    } finally {
      setCalculating(false);
    }
  };

  // Mark Paid
  const handleMarkPaid = async (id) => {
    if (!window.confirm("Mark this payroll slip as paid?")) return;
    try {
      await markPayrollPaid(id, 'Paid manually via dashboard.');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update status.');
    }
  };

  // Approve/Reject OT
  const handleReviewOt = async (id, status, notes = '') => {
    const actionText = status === 'approved' ? 'approve' : 'reject';
    if (!window.confirm(`Are you sure you want to ${actionText} this overtime record?`)) return;
    try {
      await reviewOvertimeRecord(id, { status, notes });
      fetchOtRecords();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to review overtime.');
    }
  };

  // Save/Edit OT Config
  const handleSaveConfig = async (e) => {
    e.preventDefault();
    try {
      if (editingConfig) {
        await updateOvertimeConfig(editingConfig.id, {
          rate_type: configForm.rate_type,
          flat_rate: configForm.rate_type === 'flat' ? configForm.flat_rate : 0
        });
      } else {
        await createOvertimeConfig({
          branch: configForm.branch,
          rate_type: configForm.rate_type,
          flat_rate: configForm.rate_type === 'flat' ? configForm.flat_rate : 0
        });
      }
      setShowConfigModal(false);
      fetchOtConfigs();
    } catch (err) {
      alert(err.response?.data?.detail || JSON.stringify(err.response?.data) || 'Failed to save configuration.');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Payroll & Overtime Hub</h2>
          <p>Configure overtime rates, review overtime work hours, and generate employee payroll slips.</p>
        </div>
        <div className="page-actions" style={{ display: 'flex', gap: 12 }}>
          {activeTab === 'slips' && (
            <>
              <input
                type="month"
                className="input"
                value={month}
                onChange={e => setMonth(e.target.value)}
              />
              <button className="btn btn-primary" onClick={() => setCalcModal(true)}>
                <FaCalculator /> Calculate Salary
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tabs Header */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, borderBottom: '1px solid #e2e8f0', paddingBottom: 10 }}>
        <button
          className={`btn ${activeTab === 'slips' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveTab('slips')}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <FaMoneyBillWave /> Salary Slips
        </button>
        <button
          className={`btn ${activeTab === 'overtime_records' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveTab('overtime_records')}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <FaUserCheck /> Overtime Approvals
        </button>
        <button
          className={`btn ${activeTab === 'overtime_configs' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveTab('overtime_configs')}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <FaSlidersH /> Overtime Rates Config
        </button>
      </div>

      {/* Slips Panel */}
      {activeTab === 'slips' && (
        <div className="card">
          {loading ? (
            <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
          ) : slips.length === 0 ? (
            <div className="empty-state">
              <div className="icon" style={{ fontSize: '3rem', color: 'var(--primary)', marginBottom: 16 }}><FaMoneyBillWave /></div>
              <h3>No payroll records</h3>
              <p style={{ color: 'var(--text-muted)' }}>No payroll slips generated for {month}. Click "Calculate Salary" to generate one.</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Base Salary</th>
                    <th>Metrics (Days)</th>
                    <th>Overtime & LOP</th>
                    <th>Total Payable</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {slips.map(s => (
                    <tr key={s.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{s.employee_name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.designation}</div>
                      </td>
                      <td>₹{s.base_salary} ({s.salary_type})</td>
                      <td style={{ fontSize: '0.85rem' }}>
                        <span style={{ color: 'var(--success)' }}>{s.present_days} P</span> •{' '}
                        <span style={{ color: 'var(--info)' }}>{s.paid_leave_days} L</span> •{' '}
                        <span style={{ color: 'var(--danger)' }}>{s.absent_days} A</span>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.85rem' }}>
                          {parseFloat(s.overtime_hours || 0) > 0 ? (
                            <div style={{ color: 'var(--success)', fontWeight: 500 }}>OT: +₹{s.overtime_amount} ({s.overtime_hours} hrs)</div>
                          ) : (
                            <div style={{ color: 'var(--text-muted)' }}>OT: 0.00</div>
                          )}
                          {parseFloat(s.lop_days || 0) > 0 ? (
                            <div style={{ color: 'var(--danger)', fontWeight: 500 }}>LOP: {s.lop_days} Days</div>
                          ) : (
                            <div style={{ color: 'var(--text-muted)' }}>LOP: 0.00</div>
                          )}
                        </div>
                      </td>
                      <td style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '1.1rem' }}>₹{s.total_payable}</td>
                      <td><span className={`badge badge-${STATUS_COLORS[s.status]}`}>{s.status}</span></td>
                      <td>
                        {s.status === 'pending' ? (
                          <button className="btn btn-success btn-sm" onClick={() => handleMarkPaid(s.id)}>Mark Paid</button>
                        ) : (
                          <span style={{ color: 'var(--success)', fontSize: '0.85rem', fontWeight: 600 }}><FaCheckCircle /> Paid on {s.payment_date}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Overtime Records Panel */}
      {activeTab === 'overtime_records' && (
        <div className="card">
          {loadingOt ? (
            <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
          ) : otRecords.length === 0 ? (
            <div className="empty-state">
              <div className="icon" style={{ fontSize: '3rem', color: 'var(--primary)', marginBottom: 16 }}><FaClock /></div>
              <h3>No overtime records</h3>
              <p style={{ color: 'var(--text-muted)' }}>Overtime requests will show up here when check-outs exceed 8 hours.</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Date</th>
                    <th>Check In</th>
                    <th>Check Out</th>
                    <th>Regular Hrs</th>
                    <th>OT Hrs</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {otRecords.map(r => (
                    <tr key={r.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{r.employee_name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{r.designation} ({r.branch_name})</div>
                      </td>
                      <td>{r.date}</td>
                      <td>{r.check_in || '—'}</td>
                      <td>{r.check_out || '—'}</td>
                      <td>{r.regular_hours}</td>
                      <td style={{ fontWeight: 600, color: 'var(--success)' }}>{r.overtime_hours} hrs</td>
                      <td>
                        <span className={`badge badge-${r.status === 'approved' ? 'success' : r.status === 'rejected' ? 'danger' : 'warning'}`}>
                          {r.status === 'pending' ? 'Pending Approval' : r.status}
                        </span>
                      </td>
                      <td>
                        {r.status === 'pending' ? (
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button className="btn btn-success btn-sm" onClick={() => handleReviewOt(r.id, 'approved')}>Approve</button>
                            <button className="btn btn-danger btn-sm" onClick={() => handleReviewOt(r.id, 'rejected')}>Reject</button>
                          </div>
                        ) : (
                          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                            Reviewed by {r.approved_by_name || 'System'}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Overtime Configs Panel */}
      {activeTab === 'overtime_configs' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h3>Overtime Rates Config</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: 4 }}>Configure flat rates or hourly multipliers per branch.</p>
            </div>
            {user?.role === 'owner' && (
              <button
                className="btn btn-primary"
                onClick={() => {
                  setEditingConfig(null);
                  setConfigForm({ branch: '', rate_type: '1.5x', flat_rate: 0 });
                  setShowConfigModal(true);
                }}
              >
                + Add Config
              </button>
            )}
          </div>
          {loadingOt ? (
            <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
          ) : otConfigs.length === 0 ? (
            <div className="empty-state">
              <div className="icon" style={{ fontSize: '3rem', color: 'var(--primary)', marginBottom: 16 }}><FaSlidersH /></div>
              <h3>No configs found</h3>
              <p style={{ color: 'var(--text-muted)' }}>
                {user?.role === 'owner' 
                  ? 'Click "+ Add Config" to configure overtime rates for your branches.' 
                  : 'No overtime rate configuration was found for your branch. Please ask the administrator to configure it.'}
              </p>
              {user?.role === 'owner' && (
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    setEditingConfig(null);
                    setConfigForm({ branch: '', rate_type: '1.5x', flat_rate: 0 });
                    setShowConfigModal(true);
                  }}
                  style={{ marginTop: 12 }}
                >
                  Configure Branch Rates
                </button>
              )}
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Branch</th>
                    <th>Rate Type</th>
                    <th>Flat Rate</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {otConfigs.map(c => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 600 }}>{c.branch_name}</td>
                      <td>{{
                        'flat': 'Flat Hourly Rate',
                        '1.5x': '1.5x Base Hourly Rate',
                        '2x': '2.0x Base Hourly Rate'
                      }[c.rate_type] || c.rate_type}</td>
                      <td style={{ fontWeight: 600 }}>{c.rate_type === 'flat' ? `₹${c.flat_rate}/hr` : '—'}</td>
                      <td>
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => {
                            setEditingConfig(c);
                            setConfigForm({ branch: c.branch, rate_type: c.rate_type, flat_rate: c.flat_rate });
                            setShowConfigModal(true);
                          }}
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Create Slip Modal */}
      {calcModal && (
        <div className="modal-overlay" onClick={() => setCalcModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Calculate Salary</h3>
              <button className="modal-close" onClick={() => setCalcModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleCalculate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Employee</label>
                  <select className="input" required value={calcForm.employee} onChange={e => setCalcForm(p => ({ ...p, employee: e.target.value }))}>
                    <option value="">Select Employee</option>
                    {employees.map(e => <option key={e.id} value={e.id}>{e.full_name} ({e.designation})</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Month</label>
                  <input type="month" className="input" required value={calcForm.month} onChange={e => setCalcForm(p => ({ ...p, month: e.target.value }))} />
                </div>
                <div className="modal-footer" style={{ padding: 0, border: 'none', marginTop: 10 }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setCalcModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={calculating}>{calculating ? 'Calculating...' : 'Generate Slip'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Overtime Config Modal */}
      {showConfigModal && (
        <div className="modal-overlay" onClick={() => setShowConfigModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingConfig ? 'Edit Overtime Rate Config' : 'Add Overtime Rate Config'}</h3>
              <button className="modal-close" onClick={() => setShowConfigModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSaveConfig} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {user?.role === 'owner' && !editingConfig ? (
                  <div className="form-group">
                    <label className="form-label">Branch *</label>
                    <select
                      className="input"
                      required
                      value={configForm.branch}
                      onChange={e => setConfigForm(p => ({ ...p, branch: e.target.value }))}
                    >
                      <option value="">Select Branch</option>
                      {branches.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="form-group">
                    <label className="form-label">Branch</label>
                    <input className="input" type="text" readOnly disabled value={editingConfig ? editingConfig.branch_name : user?.branch_name} />
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">Rate Type *</label>
                  <select
                    className="input"
                    required
                    value={configForm.rate_type}
                    onChange={e => setConfigForm(p => ({ ...p, rate_type: e.target.value }))}
                  >
                    <option value="1.5x">1.5x Base Hourly Rate</option>
                    <option value="2x">2.0x Base Hourly Rate</option>
                    <option value="flat">Flat Hourly Rate</option>
                  </select>
                </div>
                {configForm.rate_type === 'flat' && (
                  <div className="form-group">
                    <label className="form-label">Flat Rate (₹/hour) *</label>
                    <input
                      type="number"
                      className="input"
                      required
                      min={0}
                      value={configForm.flat_rate}
                      onChange={e => setConfigForm(p => ({ ...p, flat_rate: e.target.value }))}
                    />
                  </div>
                )}
                <div className="modal-footer" style={{ padding: 0, border: 'none', marginTop: 10 }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setShowConfigModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Save Config</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect, useCallback } from 'react';
import { getPayroll, calculatePayroll, getEmployees, markPayrollPaid } from '../../../api/hr';
import { useAuth } from '../../../context/AuthContext';
import { FaMoneyBillWave, FaCalculator, FaCheckCircle } from 'react-icons/fa';

const STATUS_COLORS = { pending: 'warning', paid: 'success' };

export default function PayrollList() {
  const { user } = useAuth();
  const [slips, setSlips] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [calcModal, setCalcModal] = useState(false);
  const [calcForm, setCalcForm] = useState({ employee: '', month: new Date().toISOString().slice(0, 7) });
  const [calculating, setCalculating] = useState(false);

  const fetchData = useCallback(() => {
    setLoading(true);
    getPayroll({ month })
      .then(({ data }) => setSlips(data.results || data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [month]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    getEmployees()
      .then(({ data }) => setEmployees(data.results || data))
      .catch(console.error);
  }, []);

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

  const handleMarkPaid = async (id) => {
    if (!window.confirm("Mark this payroll slip as paid?")) return;
    try {
      await markPayrollPaid(id, 'Paid manually via dashboard.');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update status.');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Payroll Management</h2>
          <p>Calculate and track employee salaries based on attendance.</p>
        </div>
        <div className="page-actions" style={{ display: 'flex', gap: 12 }}>
          <input
            type="month"
            className="input"
            value={month}
            onChange={e => setMonth(e.target.value)}
          />
          <button className="btn btn-primary" onClick={() => setCalcModal(true)}>
            <FaCalculator /> Calculate Salary
          </button>
        </div>
      </div>

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
    </div>
  );
}

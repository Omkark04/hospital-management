import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { getPatients } from '../../../api/patients';
import { getEmployees, getLeaves } from '../../../api/hr';
import { getCampaigns } from '../../../api/campaigns';
import { getBranches, getBranchStats } from '../../../api/branches';
import { getBills } from '../../../api/billing';
import api from '../../../api/axios';
import { getEnquiries } from '../../../api/products';
import { getReferrals } from '../../../api/referrals';
import { 
  FaUserInjured, FaUsers, FaBullhorn, FaBuilding, FaBox, 
  FaUserCircle, FaLink, FaBell, FaChartLine, FaBolt, FaPlane, 
  FaCommentAlt, FaCrown, FaMoneyBillWave, FaFileInvoiceDollar, FaDownload, FaTrash, FaExclamationTriangle
} from 'react-icons/fa';
import BranchDetailModal from './BranchDetailModal';

function StatCard({ icon, label, value, color, link, badge }) {
  const inner = (
    <>
      <div className="stat-icon" style={{ background: `var(--${color === 'cyan' ? 'primary' : color === 'purple' ? 'secondary' : color === 'green' ? 'success' : color === 'orange' ? 'warning' : 'danger'}-bg)` }}>
        {icon}
      </div>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value ?? '—'}</div>
      {badge && <div style={{ position: 'absolute', top: 16, right: 16, fontSize: '0.75rem', fontWeight: 600, color: 'var(--moss)', background: 'rgba(61,90,42,0.1)', padding: '2px 8px', borderRadius: '12px' }}>{badge}</div>}
      {link && <div style={{ fontSize: '0.8rem', color: 'var(--primary)', marginTop: 8 }}>View all →</div>}
    </>
  );

  if (link) {
    return (
      <Link
        to={link}
        className={`stat-card ${color}`}
        style={{ position: 'relative', textDecoration: 'none', display: 'block', cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s' }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.12)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
      >
        {inner}
      </Link>
    );
  }

  return (
    <div className={`stat-card ${color}`} style={{ position: 'relative' }}>
      {inner}
    </div>
  );
}

export default function OwnerDashboard() {
  const { user } = useAuth();
  const today = new Date().toISOString().split('T')[0];
  const [stats, setStats] = useState({ patients: null, employees: null, campaigns: null, branches: null, udhariDueToday: null });
  const [finances, setFinances] = useState({ totalRevenue: 0, pendingDues: 0, dayTotals: [0, 0, 0, 0, 0, 0, 0], dayHeights: [0, 0, 0, 0, 0, 0, 0] });
  const [focus, setFocus] = useState({ leaves: 0, enquiries: 0, referrals: 0 });
  const [branchStats, setBranchStats] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);

  // Bulk Invoice Administration State
  const [bulkFilter, setBulkFilter] = useState({ branch: '', start_date: '', end_date: '' });
  const [bulkLoading, setBulkLoading] = useState(false);
  const [dropboxUsage, setDropboxUsage] = useState(null);
  const [checkingUsage, setCheckingUsage] = useState(false);
  const [dropboxError, setDropboxError] = useState(null);

  const checkDropboxUsage = async () => {
    setCheckingUsage(true);
    setDropboxError(null);
    try {
      const res = await api.get('/billing/bulk-manage/', { params: { action: 'usage' } });
      setDropboxUsage(res.data);
    } catch (err) {

      setDropboxError('Could not fetch Dropbox storage usage. Check app permissions and token settings.');
    } finally {
      setCheckingUsage(false);
    }
  };

  const handleBulkAction = async (action) => {
    if (action === 'delete' && !confirm('Are you sure you want to bulk delete matching invoice PDFs from Dropbox? This cannot be undone.')) {
      return;
    }
    setBulkLoading(true);
    const params = { action };
    if (bulkFilter.branch) params.branch = bulkFilter.branch;
    if (bulkFilter.start_date) params.start_date = bulkFilter.start_date;
    if (bulkFilter.end_date) params.end_date = bulkFilter.end_date;

    try {
      if (action === 'download') {
        const res = await api.get('/billing/bulk-manage/', { 
          params, 
          responseType: 'blob',
          timeout: 0 // Disable default 15s client abortion limit for long-running stream compilations
        });
        const blob = new Blob([res.data], { type: 'application/zip' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `bulk_invoices_${bulkFilter.branch || 'all'}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        const res = await api.delete('/billing/bulk-manage/', { params });
        alert(res.data?.detail || 'Bulk deletion completed successfully.');
      }
    } catch (err) {
      alert(err.response?.status === 404 ? 'No matching invoice PDFs found for the selected filters.' : 'Error executing bulk action.');
    } finally {
      setBulkLoading(false);
    }
  };

  useEffect(() => {
    // 1. Stats
    Promise.allSettled([getPatients(), getEmployees(), getCampaigns(), getBranches(), getBills({ is_udhari: 'true', udhari_due_date: today })])
      .then(([p, e, c, b, u]) => {
        setStats({
          patients: p.status === 'fulfilled' ? (p.value.data.count ?? p.value.data.length) : 0,
          employees: e.status === 'fulfilled' ? (e.value.data.count ?? e.value.data.length) : 0,
          campaigns: c.status === 'fulfilled' ? (c.value.data.count ?? c.value.data.length) : 0,
          branches: b.status === 'fulfilled' ? (b.value.data.count ?? b.value.data.length) : 0,
          udhariDueToday: u.status === 'fulfilled' ? (u.value.data.count ?? u.value.data.length) : 0,
        });
      });

    // 2. Financials (Bills)
    getBills().then(res => {
      const bills = res.data.results || res.data || [];
      let total = 0;
      let dues = 0;
      const dayTotals = [0, 0, 0, 0, 0, 0, 0];

      bills.forEach(b => {
        const paid = Number(b.paid_amount || 0);
        total += paid;
        dues += Number(b.balance_due || 0);

        if (b.created_at) {
          const dObj = new Date(b.created_at);
          let dayIdx = dObj.getDay() - 1;
          if (dayIdx === -1) dayIdx = 6;
          dayTotals[dayIdx] += paid;
        }
      });

      const maxDay = Math.max(...dayTotals, 100);
      const dayHeights = dayTotals.map(v => Math.round((v / maxDay) * 100));

      setFinances({ totalRevenue: total, pendingDues: dues, dayTotals, dayHeights });
    }).catch(() => {});

    // 3. Actionable Focus
    Promise.allSettled([getLeaves(), getEnquiries(), getReferrals()])
      .then(([l, e, r]) => {
        const leaves = l.status === 'fulfilled' ? (l.value.data.results || l.value.data || []) : [];
        const enq = e.status === 'fulfilled' ? (e.value.data.results || e.value.data || []) : [];
        const refs = r.status === 'fulfilled' ? (r.value.data.results || r.value.data || []) : [];
        
        setFocus({
          leaves: leaves.filter(x => x.status === 'pending').length,
          enquiries: enq.filter(x => x.status === 'new' || x.status === 'pending').length,
          referrals: refs.filter(x => x.status === 'new' || x.status === 'pending').length,
        });
      });

    // 4. Branch Stats
    getBranchStats().then(res => setBranchStats(res.data)).catch(() => {});

    // 5. Cloud Storage Usage
    checkDropboxUsage();
  }, []);

  return (
    <div>
      {/* Welcome */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: '1.8rem', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 12 }}>
          Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}, {user?.full_name?.split(' ')[0] || 'Owner'} <FaCrown style={{ color: 'var(--turmeric)' }} />
        </h2>
        <p style={{ color: 'var(--text-muted)' }}>Here's a snapshot of your hospital operations today.</p>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: 36 }}>
        <StatCard icon={<FaUserInjured />} label="Total Patients" value={stats.patients} color="cyan" link="/dashboard/patients" />
        <StatCard icon={<FaUsers />} label="Employees" value={stats.employees} color="purple" link="/dashboard/staff" />
        <StatCard icon={<FaBullhorn />} label="Campaigns" value={stats.campaigns} color="green" link="/dashboard/campaigns" />
        <StatCard icon={<FaBuilding />} label="Branches" value={stats.branches} color="orange" link="/dashboard/branches" />
        <StatCard icon={<FaFileInvoiceDollar />} label="Udhari Due Today" value={stats.udhariDueToday} color="red" link={`/dashboard/billing?is_udhari=true&udhari_due_date=${today}`} />
      </div>

      <div style={{ marginBottom: 36 }}>
        <h3 style={{ marginBottom: 20, fontSize: '1.1rem' }}>Quick Actions</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
          {[
            { label: 'New Branch', icon: <FaBuilding />, to: '/dashboard/branches' },
            { label: 'New Campaign', icon: <FaBullhorn />, to: '/dashboard/campaigns' },
            { label: 'Add Product', icon: <FaBox />, to: '/dashboard/products' },
            { label: 'Create Staff', icon: <FaUserCircle />, to: '/dashboard/staff' },
            { label: 'View Referrals', icon: <FaLink />, to: '/dashboard/referrals' },
            { label: 'Notifications', icon: <FaBell />, to: '/dashboard/notifications' },
          ].map(a => (
            <Link key={a.label} to={a.to} className="card card-body" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 14, border: '1px solid var(--border)' }}>
              <span style={{ fontSize: '1.2rem', color: 'var(--primary)' }}>{a.icon}</span>
              <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{a.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Info cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
        
        {/* Financial Intelligence */}
        <div className="card card-body" style={{ background: 'linear-gradient(145deg, var(--parchment), #fff)', border: '1px solid var(--border)' }}>
          <h4 style={{ marginBottom: 20, color: 'var(--copper)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <FaChartLine /> Financial Overview
          </h4>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ padding: '16px', background: 'var(--bg)', borderRadius: 'var(--radius-md)', borderLeft: '4px solid var(--moss)' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 4 }}>Total Revenue (Collected)</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--bark)' }}>₹{finances.totalRevenue.toLocaleString()}</div>
            </div>
            
            <div style={{ padding: '16px', background: 'var(--bg)', borderRadius: 'var(--radius-md)', borderLeft: '4px solid var(--copper)' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 4 }}>Pending Dues</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--danger)' }}>₹{finances.pendingDues.toLocaleString()}</div>
            </div>
          </div>
          
          {/* Simple CSS Chart */}
          <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 20 }}>Weekly Trend (Day-wise Income)</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', height: 80, gap: 8 }}>
              {(finances.dayHeights || [0, 0, 0, 0, 0, 0, 0]).map((h, i) => {
                const todayIdx = new Date().getDay() - 1 === -1 ? 6 : new Date().getDay() - 1;
                const amt = finances.dayTotals?.[i] || 0;
                return (
                  <div 
                    key={i} 
                    style={{ 
                      flex: 1, 
                      backgroundColor: i === todayIdx ? 'var(--turmeric)' : 'var(--moss)', 
                      opacity: amt > 0 ? (i === todayIdx ? 1 : 0.8) : 0.2, 
                      height: `${Math.max(h, 4)}%`, 
                      borderRadius: '4px 4px 0 0', 
                      transition: 'height 0.5s ease',
                      position: 'relative'
                    }} 
                    title={`₹${amt.toLocaleString()}`}
                  >
                    {amt > 0 && (
                      <div style={{ position: 'absolute', top: -18, left: '50%', transform: 'translateX(-50%)', fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        ₹{amt >= 1000 ? `${(amt/1000).toFixed(amt%1000===0?0:1)}k` : amt}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
            </div>
          </div>
        </div>

        {/* Actionable Alerts */}
        <div className="card card-body" style={{ background: 'var(--bg)' }}>
          <h4 style={{ marginBottom: 16, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <FaBolt /> Operational Focus
          </h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 20 }}>
            Here are items requiring your immediate attention today.
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Link to="/dashboard/leaves" style={{ textDecoration: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px', borderRadius: 'var(--radius-md)', background: focus.leaves > 0 ? 'var(--warning-bg)' : 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: '1.1rem', color: 'var(--primary)' }}><FaPlane /></span>
                <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>Pending Leaves</span>
              </div>
              <span className="badge" style={{ background: focus.leaves > 0 ? 'var(--copper)' : 'var(--moss)', color: 'white' }}>{focus.leaves}</span>
            </Link>
 
            <Link to="/dashboard/products" style={{ textDecoration: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px', borderRadius: 'var(--radius-md)', background: focus.enquiries > 0 ? 'var(--warning-bg)' : 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: '1.1rem', color: 'var(--primary)' }}><FaCommentAlt /></span>
                <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>Product Enquiries</span>
              </div>
              <span className="badge" style={{ background: focus.enquiries > 0 ? 'var(--copper)' : 'var(--moss)', color: 'white' }}>{focus.enquiries}</span>
            </Link>
 
            <Link to="/dashboard/referrals" style={{ textDecoration: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px', borderRadius: 'var(--radius-md)', background: focus.referrals > 0 ? 'var(--warning-bg)' : 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: '1.1rem', color: 'var(--primary)' }}><FaLink /></span>
                <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>New Referrals</span>
              </div>
              <span className="badge" style={{ background: focus.referrals > 0 ? 'var(--copper)' : 'var(--moss)', color: 'white' }}>{focus.referrals}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Bulk Invoice Administration */}
      <div className="card card-body" style={{ marginTop: 36, background: 'linear-gradient(145deg, #fff, var(--bg))', border: '1px solid var(--border)' }}>
        <h3 style={{ marginBottom: 8, fontSize: '1.2rem', color: 'var(--bark)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <FaFileInvoiceDollar style={{ color: 'var(--copper)' }} /> Bulk Invoice Administration (Dropbox Cloud)
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 20 }}>
          Fetch, compile, and bulk download generated patient invoice PDFs straight from your Dropbox integration storage, or purge them synchronously.
        </p>

        {/* Dropbox Storage Usage Tracker */}
        <div style={{ background: 'var(--bg-card)', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border)', marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <FaBox style={{ color: 'var(--primary)' }} /> Dropbox Storage Consumption
            </span>
            <button 
              type="button" 
              className="btn btn-ghost btn-sm" 
              style={{ fontSize: '0.75rem', padding: '2px 8px', height: 'auto', minHeight: 0 }}
              onClick={checkDropboxUsage}
              disabled={checkingUsage}
            >
              {checkingUsage ? 'Refreshing...' : 'Refresh Quota'}
            </button>
          </div>
          {dropboxUsage ? (
            <div>
              <div style={{ width: '100%', background: '#e2e8f0', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
                <div 
                  style={{ 
                    height: '100%', 
                    width: `${Math.min(dropboxUsage.used_percent, 100)}%`, 
                    background: dropboxUsage.used_percent > 85 ? 'var(--danger)' : dropboxUsage.used_percent > 60 ? 'var(--warning)' : 'var(--success)',
                    transition: 'width 0.4s ease'
                  }} 
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                <span>Used: <strong>{(dropboxUsage.used_bytes / (1024 * 1024)).toFixed(2)} MB</strong></span>
                <span>Quota: <strong>{(dropboxUsage.allocated_bytes / (1024 * 1024 * 1024)).toFixed(2)} GB</strong> ({dropboxUsage.used_percent}%)</span>
              </div>
            </div>
          ) : dropboxError ? (
            <div style={{ fontSize: '0.8rem', color: 'var(--danger, #dc2626)', background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: 6, padding: '6px 10px' }}>
              <FaExclamationTriangle style={{ marginRight: 6, flexShrink: 0 }} /> {dropboxError}
            </div>
          ) : (
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              {checkingUsage ? 'Interrogating Dropbox API space quota metrics...' : 'Storage statistics currently unavailable.'}
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 20 }}>
          <div className="form-group">
            <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Filter by Branch</label>
            <select 
              className="input" 
              value={bulkFilter.branch} 
              onChange={e => setBulkFilter({ ...bulkFilter, branch: e.target.value })}
              style={{ width: '100%', background: '#fff', borderColor: 'var(--border)', padding: '10px 14px', borderRadius: 'var(--radius-md)', fontSize: '0.9rem' }}
            >
              <option value="">All Branches</option>
              {branchStats.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Start Date</label>
            <input 
              type="date" 
              className="input" 
              value={bulkFilter.start_date} 
              onChange={e => setBulkFilter({ ...bulkFilter, start_date: e.target.value })}
              style={{ width: '100%', background: '#fff', borderColor: 'var(--border)', padding: '10px 14px', borderRadius: 'var(--radius-md)', fontSize: '0.9rem' }}
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>End Date</label>
            <input 
              type="date" 
              className="input" 
              value={bulkFilter.end_date} 
              onChange={e => setBulkFilter({ ...bulkFilter, end_date: e.target.value })}
              style={{ width: '100%', background: '#fff', borderColor: 'var(--border)', padding: '10px 14px', borderRadius: 'var(--radius-md)', fontSize: '0.9rem' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <button 
            type="button" 
            className="btn btn-primary" 
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
            onClick={() => handleBulkAction('download')}
            disabled={bulkLoading}
          >
            <FaDownload /> {bulkLoading ? 'Compiling Archive...' : 'Bulk Download ZIP'}
          </button>

          <button 
            type="button" 
            className="btn" 
            style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--danger-bg)', color: 'var(--danger)', border: '1px solid currentColor' }}
            onClick={() => handleBulkAction('delete')}
            disabled={bulkLoading}
          >
            <FaTrash /> Bulk Delete from Dropbox
          </button>
        </div>
      </div>

      {/* Branch Performance Section */}
      <div style={{ marginTop: 36 }}>
        <h3 style={{ marginBottom: 20, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: 8 }}>
          <FaBuilding /> Branch Performance Overview
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {branchStats.map(branch => (
            <div key={branch.id} className="card card-body" style={{ background: 'var(--bg)', border: '1px solid var(--border)', cursor: 'pointer' }} onClick={() => setSelectedBranch(branch)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h4 style={{ margin: 0 }}>{branch.name}</h4>
                <span style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>View Details →</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                <span>Patients: <strong>{branch.patients}</strong></span>
                <span>Revenue: <strong style={{ color: 'var(--moss)' }}>₹{branch.revenue.toLocaleString()}</strong></span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedBranch && (
        <BranchDetailModal branch={selectedBranch} onClose={() => setSelectedBranch(null)} />
      )}
    </div>
  );
}

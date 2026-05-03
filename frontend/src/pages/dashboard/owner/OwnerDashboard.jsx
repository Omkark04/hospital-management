import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { getPatients } from '../../../api/patients';
import { getEmployees, getLeaves } from '../../../api/hr';
import { getCampaigns } from '../../../api/campaigns';
import { getBranches } from '../../../api/branches';
import { getBills } from '../../../api/billing';
import { getEnquiries } from '../../../api/products';
import { getReferrals } from '../../../api/referrals';
import { 
  FaUserInjured, FaUsers, FaBullhorn, FaBuilding, FaBox, 
  FaUserCircle, FaLink, FaBell, FaChartLine, FaBolt, FaPlane, 
  FaCommentAlt, FaCrown, FaMoneyBillWave 
} from 'react-icons/fa';

function StatCard({ icon, label, value, color, link, badge }) {
  return (
    <div className={`stat-card ${color}`} style={{ position: 'relative' }}>
      <div className="stat-icon" style={{ background: `var(--${color === 'cyan' ? 'primary' : color === 'purple' ? 'secondary' : color === 'green' ? 'success' : color === 'orange' ? 'warning' : 'danger'}-bg)` }}>
        {icon}
      </div>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value ?? '—'}</div>
      {badge && <div style={{ position: 'absolute', top: 16, right: 16, fontSize: '0.75rem', fontWeight: 600, color: 'var(--moss)', background: 'rgba(61,90,42,0.1)', padding: '2px 8px', borderRadius: '12px' }}>{badge}</div>}
      {link && <Link to={link} style={{ fontSize: '0.8rem', color: 'var(--primary)', marginTop: 8, display: 'block' }}>View all →</Link>}
    </div>
  );
}

export default function OwnerDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ patients: null, employees: null, campaigns: null, branches: null });
  const [finances, setFinances] = useState({ totalRevenue: 0, pendingDues: 0 });
  const [focus, setFocus] = useState({ leaves: 0, enquiries: 0, referrals: 0 });

  useEffect(() => {
    // 1. Stats
    Promise.allSettled([getPatients(), getEmployees(), getCampaigns(), getBranches()])
      .then(([p, e, c, b]) => {
        setStats({
          patients: p.status === 'fulfilled' ? (p.value.data.count ?? p.value.data.length) : 0,
          employees: e.status === 'fulfilled' ? (e.value.data.count ?? e.value.data.length) : 0,
          campaigns: c.status === 'fulfilled' ? (c.value.data.count ?? c.value.data.length) : 0,
          branches: b.status === 'fulfilled' ? (b.value.data.count ?? b.value.data.length) : 0,
        });
      });

    // 2. Financials (Bills)
    getBills().then(res => {
      const bills = res.data.results || res.data || [];
      let total = 0;
      let dues = 0;
      bills.forEach(b => {
        total += Number(b.amount_paid || 0);
        dues += (Number(b.total_amount || 0) - Number(b.amount_paid || 0));
      });
      setFinances({ totalRevenue: total, pendingDues: dues });
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
        <StatCard icon={<FaUsers />} label="Employees" value={stats.employees} color="purple" link="/dashboard/employees" />
        <StatCard icon={<FaBullhorn />} label="Campaigns" value={stats.campaigns} color="green" link="/dashboard/campaigns" />
        <StatCard icon={<FaBuilding />} label="Branches" value={stats.branches} color="orange" link="/dashboard/branches" />
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
          <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 12 }}>Weekly Trend</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', height: 60, gap: 8 }}>
              {[40, 70, 45, 90, 60, 100, 80].map((h, i) => (
                <div key={i} style={{ flex: 1, backgroundColor: i === 6 ? 'var(--turmeric)' : 'var(--moss)', opacity: i === 6 ? 1 : 0.4, height: `${h}%`, borderRadius: '4px 4px 0 0', transition: 'height 0.5s ease' }} />
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: '0.7rem', color: 'var(--text-muted)' }}>
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
    </div>
  );
}

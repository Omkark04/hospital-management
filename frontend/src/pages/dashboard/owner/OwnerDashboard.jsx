import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { getPatients } from '../../../api/patients';
import { getEmployees } from '../../../api/hr';
import { getCampaigns } from '../../../api/campaigns';
import { getBranches } from '../../../api/branches';

function StatCard({ icon, label, value, color, link }) {
  return (
    <div className={`stat-card ${color}`}>
      <div className="stat-icon" style={{ background: `var(--${color === 'cyan' ? 'primary' : color === 'purple' ? 'secondary' : color === 'green' ? 'success' : color === 'orange' ? 'warning' : 'danger'}-bg)` }}>
        {icon}
      </div>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value ?? '—'}</div>
      {link && <Link to={link} style={{ fontSize: '0.8rem', color: 'var(--primary)', marginTop: 8, display: 'block' }}>View all →</Link>}
    </div>
  );
}

export default function OwnerDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ patients: null, employees: null, campaigns: null, branches: null });

  useEffect(() => {
    Promise.allSettled([getPatients(), getEmployees(), getCampaigns(), getBranches()])
      .then(([p, e, c, b]) => {
        setStats({
          patients: p.status === 'fulfilled' ? (p.value.data.count ?? p.value.data.length) : 0,
          employees: e.status === 'fulfilled' ? (e.value.data.count ?? e.value.data.length) : 0,
          campaigns: c.status === 'fulfilled' ? (c.value.data.count ?? c.value.data.length) : 0,
          branches: b.status === 'fulfilled' ? (b.value.data.count ?? b.value.data.length) : 0,
        });
      });
  }, []);

  return (
    <div>
      {/* Welcome */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: '1.8rem', marginBottom: 6 }}>
          Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}, {user?.full_name?.split(' ')[0] || 'Owner'} 👑
        </h2>
        <p style={{ color: 'var(--text-muted)' }}>Here's a snapshot of your hospital operations today.</p>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: 36 }}>
        <StatCard icon="🧑‍⚕️" label="Total Patients" value={stats.patients} color="cyan" link="/dashboard/patients" />
        <StatCard icon="👥" label="Employees" value={stats.employees} color="purple" link="/dashboard/employees" />
        <StatCard icon="🎯" label="Campaigns" value={stats.campaigns} color="green" link="/dashboard/campaigns" />
        <StatCard icon="🏢" label="Branches" value={stats.branches} color="orange" link="/dashboard/branches" />
      </div>

      {/* Quick Actions */}
      <div style={{ marginBottom: 36 }}>
        <h3 style={{ marginBottom: 20, fontSize: '1.1rem' }}>Quick Actions</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
          {[
            { label: 'New Branch', icon: '🏢', to: '/dashboard/branches' },
            { label: 'New Campaign', icon: '🎯', to: '/dashboard/campaigns' },
            { label: 'Add Product', icon: '📦', to: '/dashboard/products' },
            { label: 'Create Staff', icon: '👤', to: '/dashboard/staff' },
            { label: 'View Referrals', icon: '🔗', to: '/dashboard/referrals' },
            { label: 'Notifications', icon: '🔔', to: '/dashboard/notifications' },
          ].map(a => (
            <Link key={a.label} to={a.to} className="card card-body" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={{ fontSize: '1.5rem' }}>{a.icon}</span>
              <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{a.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Info cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div className="card card-body">
          <h4 style={{ marginBottom: 16, color: 'var(--primary)' }}>📊 System Overview</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              ['Database', 'SQLite (dev)'],
              ['Email', 'SendGrid (configure .env)'],
              ['Cloudinary', 'Pending credentials'],
              ['Dropbox', 'Pending credentials'],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{k}</span>
                <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card card-body">
          <h4 style={{ marginBottom: 16, color: 'var(--primary)' }}>🗓️ Today's Focus</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { icon: '✅', label: 'Review pending leave requests' },
              { icon: '🎯', label: 'Check active campaign reports' },
              { icon: '💬', label: 'Respond to product enquiries' },
              { icon: '🔗', label: 'Convert today\'s referrals' },
            ].map(t => (
              <div key={t.label} style={{ display: 'flex', gap: 12, padding: '10px', borderRadius: 'var(--radius-md)', background: 'var(--bg-card)' }}>
                <span>{t.icon}</span>
                <span style={{ fontSize: '0.875rem' }}>{t.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

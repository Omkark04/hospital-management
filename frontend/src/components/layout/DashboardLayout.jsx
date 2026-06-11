import { useState, useRef, useEffect } from 'react';
import { Outlet, Navigate, useNavigate, NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Sidebar from './Sidebar';
import { FaMapMarkerAlt, FaUserCircle, FaSignOutAlt, FaChevronDown } from 'react-icons/fa';

const pageTitles = {
  '/dashboard': { title: 'Dashboard', desc: "Welcome back! Here's what's happening today." },
  '/dashboard/patients': { title: 'Patients', desc: 'Manage patient records and registrations.' },
  '/dashboard/patients/register': { title: 'Register Patient', desc: 'Add a new patient to the system.' },
  '/dashboard/appointments': { title: 'Appointments', desc: 'View and manage appointments.' },
  '/dashboard/prescriptions': { title: 'Prescriptions', desc: 'Manage patient prescriptions.' },
  '/dashboard/billing': { title: 'Billing', desc: 'Manage invoices and payments.' },
  '/dashboard/employees': { title: 'Employees', desc: 'Manage branch employees.' },
  '/dashboard/attendance': { title: 'Attendance', desc: 'Mark and view daily attendance.' },
  '/dashboard/leaves': { title: 'Leave Requests', desc: 'Review leave applications.' },
  '/dashboard/hospitals': { title: 'Hospitals', desc: 'Manage your hospitals.' },
  '/dashboard/branches': { title: 'Branches', desc: 'Manage hospital branches.' },
  '/dashboard/staff': { title: 'Staff & HR', desc: 'Manage staff accounts, roles, and HR profiles.' },
  '/dashboard/campaigns': { title: 'Campaigns', desc: 'Create and manage campaigns.' },
  '/dashboard/products': { title: 'Products', desc: 'Manage product listings.' },
  '/dashboard/enquiries': { title: 'Product Enquiries', desc: 'View and respond to enquiries.' },
  '/dashboard/referrals': { title: 'Referrals', desc: 'View referral submissions.' },
  '/dashboard/notifications': { title: 'Notifications', desc: 'View sent notifications.' },
  '/dashboard/my-appointments': { title: 'My Appointments', desc: 'View and manage your appointments.' },
  '/dashboard/my-records': { title: 'Medical Records', desc: 'Your prescriptions and treatment history.' },
  '/dashboard/my-bills': { title: 'My Bills', desc: 'View your billing statements.' },
  '/dashboard/my-attendance': { title: 'My Attendance', desc: 'Your attendance records.' },
  '/dashboard/my-leaves': { title: 'My Leaves', desc: 'Your leave applications.' },
  '/dashboard/my-campaigns': { title: 'My Campaigns', desc: 'Campaigns you manage.' },
  '/dashboard/profile': { title: 'My Profile', desc: 'View and update your profile.' },
  '/dashboard/referral': { title: 'Refer a Friend', desc: 'Know someone who needs care? Refer them here.' },
  '/dashboard/therapies': { title: 'Therapies', desc: 'Manage therapy programs for patients.' },
  '/dashboard/telecalling': { title: 'Telecalling', desc: 'Follow up with patients directly.' },
  '/dashboard/payroll': { title: 'Payroll', desc: 'Manage employee payroll slips.' },
  '/dashboard/inventory': { title: 'Inventory', desc: 'Manage medicines and stock.' },
};

const ROLE_COLORS = {
  owner: '#7c3aed',
  doctor: '#0f766e',
  receptionist: '#b45309',
  employee: '#1d4ed8',
  patient: '#be185d',
};

export default function DashboardLayout() {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  // Close overlay on outside click
  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    if (profileOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [profileOpen]);

  const handleLogout = async () => {
    setProfileOpen(false);
    await logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  const currentPath = window.location.pathname;
  const pageInfo = pageTitles[currentPath] || { title: 'HMS', desc: 'Hospital Management System' };
  const initials = user.full_name?.charAt(0)?.toUpperCase() || 'U';
  const roleColor = ROLE_COLORS[user.role] || 'var(--primary)';

  return (
    <div className="dashboard-layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="dashboard-main">
        {/* Top bar */}
        <header className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button className="hamburger" onClick={() => setSidebarOpen(true)}>☰</button>
            <div className="topbar-title">
              <h1>{pageInfo.title}</h1>
            </div>
          </div>
          <div className="topbar-actions">
            {user.branch_name && (
              <span className="badge badge-primary" style={{ fontSize: '0.75rem' }}>
                <FaMapMarkerAlt /> {user.branch_name}
              </span>
            )}

            {/* Profile Avatar with Overlay */}
            <div ref={profileRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setProfileOpen(v => !v)}
                title="Profile"
                style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: `linear-gradient(135deg, ${roleColor}, var(--secondary))`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: '0.9rem', color: 'white',
                  cursor: 'pointer', border: profileOpen ? '2px solid white' : '2px solid transparent',
                  boxShadow: profileOpen ? `0 0 0 3px ${roleColor}44` : 'none',
                  transition: 'all 0.2s',
                }}
              >
                {initials}
              </button>

              {/* Profile overlay */}
              {profileOpen && (
                <>
                  {/* Mobile backdrop */}
                  <div
                    style={{ display: 'none' }}
                    className="profile-mobile-backdrop"
                    onClick={() => setProfileOpen(false)}
                  />
                  <div
                    className="profile-overlay"
                    style={{
                      position: 'absolute', top: 'calc(100% + 10px)', right: 0,
                      background: 'var(--bg-card)', border: '1px solid var(--border)',
                      borderRadius: 16, minWidth: 240,
                      boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
                      zIndex: 9999, overflow: 'hidden',
                      animation: 'fadeSlideDown 0.18s ease-out',
                    }}
                  >
                    {/* Header gradient strip */}
                    <div style={{ background: `linear-gradient(135deg, ${roleColor}, var(--secondary))`, padding: '20px 20px 16px' }}>
                      <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', fontWeight: 700, color: 'white', marginBottom: 10, border: '2px solid rgba(255,255,255,0.4)' }}>
                        {initials}
                      </div>
                      <div style={{ color: 'white', fontWeight: 700, fontSize: '1rem', lineHeight: 1.2 }}>{user.full_name || user.username}</div>
                      {user.branch_name && (
                        <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.78rem', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <FaMapMarkerAlt size={10} /> {user.branch_name}
                        </div>
                      )}
                    </div>

                    {/* Role badge */}
                    <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ background: `${roleColor}18`, color: roleColor, padding: '3px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, textTransform: 'capitalize', letterSpacing: '0.5px' }}>
                        {user.role}
                      </span>
                    </div>

                    {/* Actions */}
                    <div style={{ padding: '8px' }}>
                      <NavLink
                        to="/dashboard/profile"
                        onClick={() => setProfileOpen(false)}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, color: 'var(--text-primary)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500, transition: 'background 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <FaUserCircle size={16} color={roleColor} /> View Profile
                      </NavLink>
                      <button
                        onClick={handleLogout}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, background: 'none', border: 'none', color: 'var(--danger)', fontSize: '0.9rem', fontWeight: 500, cursor: 'pointer', transition: 'background 0.15s', textAlign: 'left' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <FaSignOutAlt size={16} /> Logout
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="dashboard-content fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
}


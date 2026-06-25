import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Outlet, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Sidebar from './Sidebar';
import { FaMapMarkerAlt, FaUserCircle, FaSignOutAlt, FaChevronDown, FaBars } from 'react-icons/fa';

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
  owner:        '#047857',   /* green-darker */
  doctor:       '#059669',   /* green-dark    */
  receptionist: '#0891b2',   /* cyan-dark     */
  employee:     '#0e7490',   /* cyan-darker   */
  patient:      '#10b981',   /* green         */
};

export default function DashboardLayout() {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [overlayPos, setOverlayPos] = useState({ top: 0, right: 0 });
  const profileRef = useRef(null);
  const overlayRef = useRef(null);

  // Close overlay on outside click — must exclude the portal div too
  useEffect(() => {
    const handler = (e) => {
      const clickedInsideButton = profileRef.current && profileRef.current.contains(e.target);
      const clickedInsideOverlay = overlayRef.current && overlayRef.current.contains(e.target);
      if (!clickedInsideButton && !clickedInsideOverlay) {
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

  const handleViewProfile = () => {
    setProfileOpen(false);
    navigate('/dashboard/profile');
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
            <button className="hamburger" onClick={() => setSidebarOpen(true)}><FaBars size={18} /></button>
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
                onClick={() => {
                  if (profileRef.current) {
                    const rect = profileRef.current.getBoundingClientRect();
                    setOverlayPos({
                      top: rect.bottom + 10,
                      right: window.innerWidth - rect.right,
                    });
                  }
                  setProfileOpen(v => !v);
                }}
                title="Profile"
                style={{
                  width: 38, height: 38, borderRadius: '50%',
                  background: `linear-gradient(135deg, ${roleColor}, #06b6d4)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: '0.9rem', color: 'white',
                  cursor: 'pointer',
                  border: '2px solid white',
                  boxShadow: `0 0 0 2.5px ${roleColor}`,
                  transition: 'all 0.2s',
                }}
              >
                {initials}
              </button>

              {/* Profile overlay — rendered via portal to escape topbar stacking context */}
              {profileOpen && createPortal(
                <>
                  {/* Backdrop (always rendered, CSS shows it on mobile) */}
                  <div
                    style={{
                      position: 'fixed', inset: 0,
                      background: 'rgba(0,0,0,0.4)',
                      zIndex: 9998,
                      display: window.innerWidth <= 640 ? 'block' : 'none',
                    }}
                    onClick={() => setProfileOpen(false)}
                  />

                  {/* Overlay card */}
                  <div
                    ref={overlayRef}
                    style={{
                      position: 'fixed',
                      /* Desktop: anchor near avatar button */
                      top: window.innerWidth > 640 ? overlayPos.top : 'auto',
                      right: window.innerWidth > 640 ? overlayPos.right : 0,
                      /* Mobile: full-width bottom sheet */
                      bottom: window.innerWidth <= 640 ? 0 : 'auto',
                      left: window.innerWidth <= 640 ? 0 : 'auto',
                      borderRadius: window.innerWidth <= 640 ? '20px 20px 0 0' : 16,
                      width: window.innerWidth <= 640 ? '100%' : 240,
                      background: 'var(--bg-card)', border: '1px solid var(--border)',
                      boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
                      zIndex: 9999, overflow: 'hidden',
                      maxHeight: '80vh', overflowY: 'auto',
                      animation: window.innerWidth <= 640
                        ? 'slideUp 0.22s ease'
                        : 'fadeSlideDown 0.18s ease-out',
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
                      <button
                        onClick={handleViewProfile}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, background: 'none', border: 'none', color: 'var(--text-primary)', fontSize: '0.9rem', fontWeight: 500, cursor: 'pointer', transition: 'background 0.15s', textAlign: 'left' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <FaUserCircle size={16} color={roleColor} /> View Profile
                      </button>
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
                </>,
                document.body
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


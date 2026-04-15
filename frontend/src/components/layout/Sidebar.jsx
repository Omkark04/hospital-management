import { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const roleMenus = {
  owner: [
    { section: 'Overview' },
    { to: '/dashboard', label: 'Dashboard', icon: '📊', end: true },
    { section: 'Management' },
    { to: '/dashboard/hospitals', label: 'Hospitals', icon: '🏥' },
    { to: '/dashboard/branches', label: 'Branches', icon: '🏢' },
    { to: '/dashboard/staff', label: 'Staff', icon: '👥' },
    { to: '/dashboard/campaigns', label: 'Campaigns', icon: '🎯' },
    { to: '/dashboard/products', label: 'Products', icon: '📦' },
    { section: 'Reports' },
    { to: '/dashboard/enquiries', label: 'Enquiries', icon: '💬' },
    { to: '/dashboard/referrals', label: 'Referrals', icon: '🔗' },
    { to: '/dashboard/notifications', label: 'Notifications', icon: '🔔' },
    { section: 'Account' },
    { to: '/dashboard/profile', label: 'My Profile', icon: '👤' },
  ],
  doctor: [
    { section: 'Overview' },
    { to: '/dashboard', label: 'Dashboard', icon: '📊', end: true },
    { section: 'Clinical' },
    { to: '/dashboard/patients', label: 'Patients', icon: '🧑‍⚕️' },
    { to: '/dashboard/appointments', label: 'Appointments', icon: '📅' },
    { to: '/dashboard/prescriptions', label: 'Prescriptions', icon: '💊' },
    { section: 'Campaigns' },
    { to: '/dashboard/my-campaigns', label: 'My Campaigns', icon: '🎯' },
    { section: 'Account' },
    { to: '/dashboard/profile', label: 'My Profile', icon: '👤' },
  ],
  receptionist: [
    { section: 'Overview' },
    { to: '/dashboard', label: 'Dashboard', icon: '📊', end: true },
    { section: 'Patients' },
    { to: '/dashboard/patients', label: 'Patient List', icon: '🧑‍⚕️' },
    { to: '/dashboard/patients/register', label: 'Register Patient', icon: '➕' },
    { to: '/dashboard/appointments', label: 'Appointments', icon: '📅' },
    { section: 'Finance' },
    { to: '/dashboard/billing', label: 'Billing', icon: '🧾' },
    { section: 'HR' },
    { to: '/dashboard/employees', label: 'Employees', icon: '👥' },
    { to: '/dashboard/attendance', label: 'Attendance', icon: '✅' },
    { to: '/dashboard/leaves', label: 'Leave Requests', icon: '📝' },
    { section: 'Other' },
    { to: '/dashboard/referrals', label: 'Referrals', icon: '🔗' },
    { to: '/dashboard/profile', label: 'My Profile', icon: '👤' },
  ],
  employee: [
    { section: 'Overview' },
    { to: '/dashboard', label: 'Dashboard', icon: '📊', end: true },
    { section: 'My Records' },
    { to: '/dashboard/my-attendance', label: 'My Attendance', icon: '✅' },
    { to: '/dashboard/my-leaves', label: 'My Leaves', icon: '📝' },
    { to: '/dashboard/my-campaigns', label: 'My Campaigns', icon: '🎯' },
    { section: 'Account' },
    { to: '/dashboard/profile', label: 'My Profile', icon: '👤' },
  ],
  patient: [
    { section: 'Overview' },
    { to: '/dashboard', label: 'Dashboard', icon: '📊', end: true },
    { section: 'My Health' },
    { to: '/dashboard/my-appointments', label: 'Appointments', icon: '📅' },
    { to: '/dashboard/my-records', label: 'Medical Records', icon: '📋' },
    { to: '/dashboard/my-bills', label: 'My Bills', icon: '🧾' },
    { section: 'Other' },
    { to: '/dashboard/referral', label: 'Refer a Friend', icon: '🔗' },
    { to: '/dashboard/profile', label: 'My Profile', icon: '👤' },
  ],
};

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const menu = roleMenus[user?.role] || [];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 99, backdropFilter: 'blur(4px)' }}
          onClick={onClose}
        />
      )}

      <aside className={`sidebar${isOpen ? ' open' : ''}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="logo-icon">H</div>
          <div>
            <h2>HMS+</h2>
            <span>Hospital Management</span>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '8px 0', overflowY: 'auto' }}>
          {menu.map((item, idx) => {
            if (item.section) {
              return (
                <div key={idx} className="sidebar-section">
                  <div className="sidebar-section-label">{item.section}</div>
                </div>
              );
            }
            return (
              <div key={idx} className="sidebar-nav">
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
                  onClick={onClose}
                >
                  <span className="nav-icon">{item.icon}</span>
                  {item.label}
                </NavLink>
              </div>
            );
          })}
        </nav>

        {/* User / logout */}
        <div className="sidebar-bottom">
          <div className="sidebar-user" onClick={handleLogout} title="Logout">
            <div className="sidebar-avatar">
              {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="sidebar-user-info">
              <div className="name">{user?.full_name || user?.username}</div>
              <div className="role">{user?.role} · Logout</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

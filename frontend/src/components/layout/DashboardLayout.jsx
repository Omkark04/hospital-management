import { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Sidebar from './Sidebar';

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
  '/dashboard/staff': { title: 'Staff', desc: 'Manage staff across branches.' },
  '/dashboard/campaigns': { title: 'Campaigns', desc: 'Create and manage campaigns.' },
  '/dashboard/products': { title: 'Products', desc: 'Manage product listings.' },
  '/dashboard/enquiries': { title: 'Product Enquiries', desc: 'View and respond to enquiries.' },
  '/dashboard/referrals': { title: 'Referrals', desc: 'View referral submissions.' },
  '/dashboard/notifications': { title: 'Notifications', desc: 'View sent notifications.' },
  '/dashboard/my-appointments': { title: 'My Appointments', desc: 'View and manage your appointments.' },
  '/dashboard/my-records': { title: 'Medical Records', desc: 'Your health history and reports.' },
  '/dashboard/my-bills': { title: 'My Bills', desc: 'View your billing statements.' },
  '/dashboard/my-attendance': { title: 'My Attendance', desc: 'Your attendance records.' },
  '/dashboard/my-leaves': { title: 'My Leaves', desc: 'Your leave applications.' },
  '/dashboard/my-campaigns': { title: 'My Campaigns', desc: 'Campaigns you manage.' },
  '/dashboard/profile': { title: 'My Profile', desc: 'View and update your profile.' },
  '/dashboard/referral': { title: 'Refer a Friend', desc: 'Submit a new referral.' },
};

export default function DashboardLayout() {
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
              <p>{pageInfo.desc}</p>
            </div>
          </div>
          <div className="topbar-actions">
            {user.branch_name && (
              <span className="badge badge-primary" style={{ fontSize: '0.75rem' }}>
                📍 {user.branch_name}
              </span>
            )}
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem', color: 'white', cursor: 'default' }}>
              {user.full_name?.charAt(0)?.toUpperCase() || 'U'}
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

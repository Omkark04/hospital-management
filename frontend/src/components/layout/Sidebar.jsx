import { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  FaChartBar, FaHospital, FaBuilding, FaUsers, FaBullhorn, FaBox, 
  FaCommentAlt, FaLink, FaStar, FaBell, FaUserCircle, FaUserInjured, 
  FaCalendarAlt, FaPrescriptionBottleAlt, FaPlusCircle, FaFileInvoiceDollar, 
  FaCheckCircle, FaEdit, FaClipboardList, FaChartLine, FaPhoneAlt, FaQrcode, FaCamera,
  FaMoneyBillWave
} from 'react-icons/fa';

const roleMenus = {
  owner: [
    { section: 'Overview' },
    { to: '/dashboard', label: 'Dashboard', icon: <FaChartBar />, end: true },
    { section: 'Management' },
    { to: '/dashboard/hospitals', label: 'Hospitals', icon: <FaHospital /> },
    { to: '/dashboard/branches', label: 'Branches', icon: <FaBuilding /> },
    { to: '/dashboard/staff', label: 'Staff', icon: <FaUsers /> },
    { to: '/dashboard/campaigns', label: 'Campaigns', icon: <FaBullhorn /> },
    { to: '/dashboard/products', label: 'Store Products', icon: <FaBox /> },
    { to: '/dashboard/inventory', label: 'Inventory', icon: <FaClipboardList /> },
    { section: 'HR' },
    { to: '/dashboard/employees', label: 'Employees', icon: <FaUsers /> },
    { to: '/dashboard/attendance', label: 'Attendance Log', icon: <FaCheckCircle /> },
    { to: '/dashboard/leaves', label: 'Leave Requests', icon: <FaEdit /> },
    { to: '/dashboard/payroll', label: 'Payroll', icon: <FaMoneyBillWave /> },
    { section: 'Reports' },
    { to: '/dashboard/enquiries', label: 'Enquiries', icon: <FaCommentAlt /> },
    { to: '/dashboard/referrals', label: 'Referrals', icon: <FaLink /> },
    { to: '/dashboard/reviews', label: 'Reviews', icon: <FaStar /> },
    { to: '/dashboard/notifications', label: 'Notifications', icon: <FaBell /> },
    { section: 'Account' },
    { to: '/dashboard/profile', label: 'My Profile', icon: <FaUserCircle /> },
  ],
  doctor: [
    { section: 'Overview' },
    { to: '/dashboard', label: 'Dashboard', icon: <FaChartBar />, end: true },
    { section: 'Clinical' },
    { to: '/dashboard/patients', label: 'Patients', icon: <FaUserInjured /> },
    { to: '/dashboard/appointments', label: 'Appointments', icon: <FaCalendarAlt /> },
    { to: '/dashboard/prescriptions', label: 'Prescriptions', icon: <FaPrescriptionBottleAlt /> },
    { to: '/dashboard/telecalling', label: 'Telecalling', icon: <FaPhoneAlt /> },
    { to: '/dashboard/billing', label: 'Billing', icon: <FaFileInvoiceDollar /> },
    { to: '/dashboard/products', label: 'Prescription Medicines', icon: <FaBox /> },
    { to: '/dashboard/inventory', label: 'Inventory', icon: <FaClipboardList /> },
    { section: 'HR' },
    { to: '/dashboard/employees', label: 'Employees', icon: <FaUsers /> },
    { to: '/dashboard/attendance-kiosk', label: 'Attendance Kiosk', icon: <FaQrcode /> },
    { to: '/dashboard/scan-attendance', label: 'My Check-In', icon: <FaCamera /> },
    { to: '/dashboard/attendance', label: 'Branch Attendance', icon: <FaCheckCircle /> },
    { to: '/dashboard/my-attendance', label: 'My Attendance', icon: <FaClipboardList /> },
    { to: '/dashboard/leaves', label: 'Leave Requests', icon: <FaEdit /> },
    { to: '/dashboard/payroll', label: 'Payroll', icon: <FaMoneyBillWave /> },
    { to: '/dashboard/my-leaves', label: 'My Leaves', icon: <FaCalendarAlt /> },
    { section: 'Campaigns' },
    { to: '/dashboard/my-campaigns', label: 'My Campaigns', icon: <FaBullhorn /> },
    { section: 'Account' },
    { to: '/dashboard/profile', label: 'My Profile', icon: <FaUserCircle /> },
  ],
  receptionist: [
    { section: 'Overview' },
    { to: '/dashboard', label: 'Dashboard', icon: <FaChartBar />, end: true },
    { section: 'Patients' },
    { to: '/dashboard/patients', label: 'Patient List', icon: <FaUserInjured /> },
    { to: '/dashboard/patients/register', label: 'Register Patient', icon: <FaPlusCircle /> },
    { to: '/dashboard/appointments', label: 'Appointments', icon: <FaCalendarAlt /> },
    { to: '/dashboard/telecalling', label: 'Telecalling', icon: <FaPhoneAlt /> },
    { section: 'Finance & Inventory' },
    { to: '/dashboard/billing', label: 'Billing', icon: <FaFileInvoiceDollar /> },
    { to: '/dashboard/products', label: 'Prescription Medicines', icon: <FaBox /> },
    { to: '/dashboard/inventory', label: 'Inventory', icon: <FaClipboardList /> },
    { section: 'My Attendance' },
    { to: '/dashboard/scan-attendance', label: 'Scan Check-In', icon: <FaCamera /> },
    { to: '/dashboard/my-attendance', label: 'My Attendance', icon: <FaCheckCircle /> },
    { to: '/dashboard/my-leaves', label: 'My Leaves', icon: <FaEdit /> },
    { section: 'Other' },
    { to: '/dashboard/referrals', label: 'Referrals', icon: <FaLink /> },
    { to: '/dashboard/profile', label: 'My Profile', icon: <FaUserCircle /> },
  ],
  employee: [
    { section: 'Overview' },
    { to: '/dashboard', label: 'Dashboard', icon: <FaChartBar />, end: true },
    { section: 'My Records' },
    { to: '/dashboard/scan-attendance', label: 'Scan Check-In', icon: <FaCamera /> },
    { to: '/dashboard/my-attendance', label: 'My Attendance', icon: <FaCheckCircle /> },
    { to: '/dashboard/my-leaves', label: 'My Leaves', icon: <FaEdit /> },
    { to: '/dashboard/my-campaigns', label: 'My Campaigns', icon: <FaBullhorn /> },
    { section: 'Account' },
    { to: '/dashboard/profile', label: 'My Profile', icon: <FaUserCircle /> },
  ],
  patient: [
    { section: 'Overview' },
    { to: '/dashboard', label: 'Dashboard', icon: <FaChartBar />, end: true },
    { section: 'My Health' },
    { to: '/dashboard/my-appointments', label: 'Appointments', icon: <FaCalendarAlt /> },
    { to: '/dashboard/my-records', label: 'Medical Records', icon: <FaClipboardList /> },
    { to: '/dashboard/my-bills', label: 'My Bills', icon: <FaFileInvoiceDollar /> },
    { section: 'Other' },
    { to: '/dashboard/referral', label: 'Refer a Friend', icon: <FaLink /> },
    { to: '/dashboard/profile', label: 'My Profile', icon: <FaUserCircle /> },
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

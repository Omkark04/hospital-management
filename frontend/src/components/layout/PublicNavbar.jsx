import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function PublicNavbar() {
  const { isAuthenticated } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const links = [
    { to: '/', label: 'Home' },
    { to: '/about', label: 'About' },
    { to: '/services', label: 'Services' },
    { to: '/products', label: 'Products' },
    { to: '/blog', label: 'Blog' },
    { to: '/contact', label: 'Contact' },
  ];

  return (
    <nav className="public-nav">
      <NavLink to="/" className="logo">
        <div className="logo-mark">H</div>
        <span className="logo-text">HMS<span>+</span></span>
      </NavLink>

      <div className="public-nav-links">
        {links.map(l => (
          <NavLink
            key={l.to}
            to={l.to}
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            end={l.to === '/'}
          >
            {l.label}
          </NavLink>
        ))}
      </div>

      <div className="public-nav-actions">
        <NavLink to="/referral" className="btn btn-ghost btn-sm">Refer a Patient</NavLink>
        {isAuthenticated ? (
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/dashboard')}>
            Dashboard
          </button>
        ) : (
          <NavLink to="/login" className="btn btn-primary btn-sm">Login</NavLink>
        )}
      </div>
    </nav>
  );
}

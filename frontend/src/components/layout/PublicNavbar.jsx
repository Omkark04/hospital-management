import { useState, useEffect } from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Logo from '../../assets/Logo.png';
import {
  FiPhone, FiMenu, FiX, FiCalendar, FiGrid
} from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';

export default function PublicNavbar() {
  const { isAuthenticated } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const links = [
    { to: '/', label: 'Home' },
    { to: '/services', label: 'Services' },
    { to: '/about', label: 'About' },
    { to: '/blog', label: 'Blog' },
    { to: '/contact', label: 'Contact' },
  ];

  return (
    <nav className="public-nav" style={{ boxShadow: scrolled ? '0 2px 20px rgba(44,31,14,0.12)' : undefined }}>
      {/* Logo */}
      <Link to="/" className="public-nav-logo">
        <img src={Logo} alt="Dr. Spine & Nerves"
          style={{ height: 44, width: 44, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(200,144,48,0.35)', boxShadow: '0 2px 8px rgba(200,144,48,0.18)' }} />
        <div className="logo-text-block">
          <span className="logo-title">Dr. Spine <span style={{ color: 'var(--moss)' }}>&amp;</span> Nerves</span>
          <span className="logo-sub">Non-Surgical Spine &amp; Joint Specialist</span>
        </div>
      </Link>

      {/* Desktop Links */}
      <div className="public-nav-links">
        {links.map(l => (
          <NavLink key={l.to} to={l.to} end={l.to === '/'}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            {l.label}
          </NavLink>
        ))}
      </div>

      {/* Actions */}
      <div className="public-nav-actions">
        <a href="tel:+919763331118" className="btn btn-ghost btn-sm" style={{ gap: 6 }}>
          <FiPhone size={14} /> +91 97633 31118
        </a>
        <Link to="/referral" className="btn btn-secondary btn-sm">Refer a Patient</Link>
        {isAuthenticated ? (
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/dashboard')}>
            <FiGrid size={14} /> Dashboard
          </button>
        ) : (
          <Link to="/contact" className="btn btn-primary btn-sm">
            <FiCalendar size={14} /> Book Appointment
          </Link>
        )}
      </div>

      {/* Mobile hamburger */}
      <button className="hamburger" onClick={() => setMobileOpen(p => !p)} aria-label="Menu">
        {mobileOpen ? <FiX size={22} /> : <FiMenu size={22} />}
      </button>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="mobile-menu">
          {links.map(l => (
            <NavLink key={l.to} to={l.to} end={l.to === '/'}
              className={({ isActive }) => `mobile-link ${isActive ? 'active' : ''}`}
              onClick={() => setMobileOpen(false)}>
              {l.label}
            </NavLink>
          ))}
          <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <a href="tel:+919763331118" className="btn btn-ghost" style={{ justifyContent: 'center', gap: 8 }}>
              <FiPhone size={15} /> +91 97633 31118
            </a>
            <a href="https://wa.me/919763331118" target="_blank" rel="noreferrer"
              className="btn btn-ghost" style={{ justifyContent: 'center', gap: 8, color: '#128c4a' }}>
              <FaWhatsapp size={16} /> WhatsApp Us
            </a>
            <Link to="/contact" className="btn btn-primary" style={{ justifyContent: 'center' }} onClick={() => setMobileOpen(false)}>
              <FiCalendar size={15} /> Book Appointment
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}

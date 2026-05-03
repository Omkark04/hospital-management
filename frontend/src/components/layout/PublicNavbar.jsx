import { useState, useEffect } from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Logo from '../../assets/Logo.png';
import {
  FiPhone, FiMenu, FiX, FiCalendar, FiGrid, FiChevronDown
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
    { to: '/services', label: 'Services', isDropdown: true },
    { to: '/about', label: 'About Us' },
    { to: '/gallery', label: 'Gallery' },
    { to: '/testimonials', label: 'Testimonials' },
    { to: '/contact', label: 'Contact' },
  ];

  const megaMenuData = [
    {
      category: "Spine & Joint Treatments",
      items: ["Back Pain (Lower & Upper)", "Slip Disc (Disc Bulge / Herniation)", "Sciatica Pain", "Neck Pain (Cervical Spondylosis)", "Shoulder Pain (Frozen Shoulder)", "Knee Pain (Gap, Swelling, Stiffness)", "Ligament Injuries (ACL / PCL)", "Difficulty in Walking / Bending"]
    },
    {
      category: "Ayurvedic Therapies",
      items: ["Janu Basti (Knee Therapy)", "Kati Basti (Back Therapy)", "Snehan (Oil Massage Therapy)", "Potli Therapy", "Lep Therapy", "Steam Therapy"]
    },
    {
      category: "Sujok Therapy",
      items: ["Pain Management through Sujok", "Spine & Joint Related Sujok Treatment", "Non-invasive Drug-free Therapy"]
    },
    {
      category: "Advanced Therapy Support",
      items: ["Electric Stimulation Therapy", "Chiropractic Gun Therapy", "Dual Head Hammer Massage", "Crazy Fit Machine Therapy", "Full Body Massage Chair Relaxation"]
    },
    {
      category: "Counseling & Lifestyle",
      items: ["Pain Management Counseling", "Posture Correction Guidance", "Lifestyle Modification Advice"]
    }
  ];

  return (
    <>
      <nav className={`public-nav${scrolled ? ' scrolled' : ''}`}>
        {/* Logo */}
        <Link to="/" className="public-nav-logo">
          <img src={Logo} alt="Dr. Spine & Nerves"
            style={{ height: 54, width: 54, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(200,144,48,0.35)', boxShadow: '0 2px 8px rgba(200,144,48,0.18)' }} />
          <div className="logo-text-block">
            <span className="logo-title">Dr. Spine <span style={{ color: 'var(--moss)' }}>&amp;</span> नस</span>
          </div>
        </Link>

        {/* Desktop Links */}
        <div className="public-nav-links">
          {links.map(l => (
            <div key={l.to} className={`nav-link-wrapper ${l.isDropdown ? 'has-dropdown' : ''}`}>
              <NavLink to={l.to} end={l.to === '/'}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                {l.label}
                {l.isDropdown && <FiChevronDown style={{ marginLeft: 4, marginTop: 2 }} />}
              </NavLink>
              
              {l.isDropdown && (
                <div className="mega-menu">
                  <div className="mega-menu-grid">
                    {megaMenuData.map((section, idx) => (
                      <div key={idx} className="mega-menu-column">
                        <h4 className="mega-menu-title">{section.category}</h4>
                        <ul className="mega-menu-list">
                          {section.items.map((item, itemIdx) => (
                            <li key={itemIdx}>
                              <Link to={`/services#${item.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}>{item}</Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="public-nav-actions">
          {isAuthenticated ? (
            <button className="btn btn-primary nav-action-btn" onClick={() => navigate('/dashboard')}>
              <FiGrid size={18} /> Dashboard
            </button>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost nav-action-btn">Login</Link>
              <Link to="/book" className="btn btn-primary nav-action-btn" style={{ background: 'var(--moss)', color: '#fff' }}>
                Book Appointment
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button className="hamburger" onClick={() => setMobileOpen(p => !p)} aria-label="Menu">
          {mobileOpen ? <FiX size={22} /> : <FiMenu size={22} />}
        </button>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="mobile-menu" style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 80px)' }}>
            {links.map(l => (
              <div key={l.to}>
                <NavLink to={l.to} end={l.to === '/'}
                  className={({ isActive }) => `mobile-link ${isActive ? 'active' : ''}`}
                  onClick={() => !l.isDropdown && setMobileOpen(false)}>
                  {l.label}
                </NavLink>
                {l.isDropdown && (
                  <div style={{ background: 'rgba(0,0,0,0.03)', paddingLeft: 20 }}>
                    {megaMenuData.slice(0, 3).map((section, idx) => (
                      <div key={idx} style={{ padding: '8px 24px' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>{section.category}</div>
                        {section.items.slice(0, 4).map((item, itemIdx) => (
                          <Link key={itemIdx} 
                            to={`/services#${item.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                            style={{ display: 'block', padding: '6px 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}
                            onClick={() => setMobileOpen(false)}>
                            {item}
                          </Link>
                        ))}
                      </div>
                    ))}
                    <Link to="/services" style={{ display: 'block', padding: '12px 24px', color: 'var(--moss)', fontWeight: 600, fontSize: '0.9rem' }} onClick={() => setMobileOpen(false)}>
                      View All Services →
                    </Link>
                  </div>
                )}
              </div>
            ))}
            <div style={{ padding: '20px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <a href="tel:+919763331118" className="btn btn-ghost" style={{ justifyContent: 'center', fontSize: '0.9rem', padding: '10px' }}>
                  <FiPhone size={14} /> Call
                </a>
                <a href="https://wa.me/919763331118" target="_blank" rel="noreferrer"
                  className="btn btn-ghost" style={{ justifyContent: 'center', fontSize: '0.9rem', padding: '10px', color: '#128c4a' }}>
                  <FaWhatsapp size={15} /> WhatsApp
                </a>
              </div>
              {isAuthenticated ? (
                <Link to="/dashboard" className="btn btn-primary" style={{ justifyContent: 'center' }} onClick={() => setMobileOpen(false)}>
                  <FiGrid size={15} /> Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link to="/login" className="btn btn-ghost" style={{ justifyContent: 'center' }} onClick={() => setMobileOpen(false)}>
                    Login to Account
                  </Link>
                  <Link to="/book" className="btn btn-primary" style={{ justifyContent: 'center', background: 'var(--moss)', padding: '14px' }} onClick={() => setMobileOpen(false)}>
                    Book Appointment
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Floating Contact Buttons */}
      <div style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        zIndex: 9999
      }}>
        <a href="tel:+919763331118"
          style={{
            width: 56, height: 56,
            background: 'var(--copper)', color: 'white',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(181,98,42,0.35)',
            transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.12)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          aria-label="Call Now"
        >
          <FiPhone size={24} />
        </a>
        <a href="https://wa.me/919763331118" target="_blank" rel="noreferrer"
          style={{
            width: 56, height: 56,
            background: '#25D366', color: 'white',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(37,211,102,0.35)',
            transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.12)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          aria-label="WhatsApp Us"
        >
          <FaWhatsapp size={28} />
        </a>
      </div>
    </>
  );
}

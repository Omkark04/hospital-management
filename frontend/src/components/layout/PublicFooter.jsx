import { Link } from 'react-router-dom';
import Logo from '../../assets/Logo.png';
import { FiPhone, FiMapPin, FiClock } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';

export default function PublicFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="public-footer">
      <div className="container">
        <div className="footer-grid">
          {/* Brand */}
          <div className="footer-brand">
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
              <img src={Logo} alt="Dr. Spine & Nerves"
                style={{ height: 52, width: 52, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(200,144,48,0.40)', boxShadow: '0 4px 12px rgba(200,144,48,0.20)' }} />
              <div>
                <div style={{ fontFamily: '"Cormorant Garamond", serif', fontWeight: 700, fontSize: '1.15rem', color: 'rgba(255,252,240,0.95)', lineHeight: 1.2 }}>
                  Dr. Spine &amp; Nerves
                </div>
                <div style={{ fontSize: '0.68rem', color: 'rgba(255,252,240,0.45)', letterSpacing: '0.05em' }}>
                  Non-Surgical Spine &amp; Joint Specialist
                </div>
              </div>
            </div>
            <div style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', color: 'rgba(240,216,152,0.55)', fontSize: '0.9rem', marginBottom: 12, letterSpacing: '0.03em' }}>
              आरोग्यं परमं भाग्यं
            </div>
            <p style={{ color: 'rgba(255,252,240,0.60)', fontSize: '0.85rem', lineHeight: 1.7 }}>
              Non-surgical Ayurvedic and Advanced treatment for Spine, Joint, and Nerve-related conditions.
            </p>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <a href="tel:+919763331118" className="btn btn-ghost btn-sm"
                style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,252,240,0.85)', borderColor: 'rgba(255,255,255,0.15)', gap: 6 }}>
                <FiPhone size={13} /> Call
              </a>
              <a href="https://wa.me/919763331118" target="_blank" rel="noreferrer"
                className="btn btn-ghost btn-sm"
                style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,252,240,0.85)', borderColor: 'rgba(255,255,255,0.15)', gap: 6 }}>
                <FaWhatsapp size={14} /> WhatsApp
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-col">
            <h4>Quick Links</h4>
            <Link to="/">Home</Link>
            <Link to="/about">About Us</Link>
            <Link to="/services">Services</Link>
            <Link to="/gallery">Gallery</Link>
            <Link to="/testimonials">Testimonials</Link>
            <Link to="/contact">Contact</Link>
            <Link to="/referral">Refer a Patient</Link>
          </div>

          {/* Treatments */}
          <div className="footer-col">
            <h4>Treatments</h4>
            <Link to="/services#spine">Spine &amp; Joint</Link>
            <Link to="/services#ayurveda">Ayurvedic Therapies</Link>
            <Link to="/services#sujok">Sujok Therapy</Link>
            <Link to="/services#advanced">Advanced Therapy</Link>
            <Link to="/services#counseling">Counseling</Link>
          </div>

          {/* Contact */}
          <div className="footer-col">
            <h4>Contact</h4>
            <a href="tel:+919763331118" style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <FiPhone size={13} /> +91 97633 31118
            </a>

            <div style={{ color: 'rgba(255,252,240,0.55)', fontSize: '0.85rem', display: 'flex', gap: 7, alignItems: 'flex-start', marginTop: 4 }}>
              <FiMapPin size={13} style={{ flexShrink: 0, marginTop: 2 }} /><span>Maharashtra, India</span>
            </div>
            <div style={{ color: 'rgba(255,252,240,0.55)', fontSize: '0.85rem', display: 'flex', gap: 7, alignItems: 'center', marginTop: 8 }}>
              <FiClock size={13} /><span>Mon – Sat: 9 AM – 7 PM</span>
            </div>
          </div>
        </div>

        {/* Gold ornament divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 22 }}>
          <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, transparent, rgba(200,144,48,0.30))' }} />
          <span style={{ color: 'rgba(200,144,48,0.50)', fontSize: '1rem' }}>✿</span>
          <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, rgba(200,144,48,0.30), transparent)' }} />
        </div>

        <div className="footer-bottom">
          <p>© {year} Dr. Spine &amp; Nerves. All rights reserved.</p>
          <p style={{ color: 'rgba(240,216,152,0.45)' }}>
            Developed by <span style={{ color: 'rgba(240,216,152,0.65)' }}>Omkar Kangule</span>
          </p>
        </div>
      </div>
    </footer>
  );
}

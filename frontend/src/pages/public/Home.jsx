import { Link } from 'react-router-dom';
import PublicNavbar from '../../components/layout/PublicNavbar';

const features = [
  { icon: '🧑‍⚕️', title: 'Patient Management', desc: 'Register patients with auto-generated UHID, track medical history, appointments, and lab reports.' },
  { icon: '💊', title: 'Medicine & Prescriptions', desc: 'Doctor-assigned medicines with dosage, treatment courses, and prescription history.' },
  { icon: '🧾', title: 'Billing & Payments', desc: 'Generate invoices, track payment status, and manage balance due in real time.' },
  { icon: '🏥', title: 'Branch Management', desc: 'Owner registers multiple branches, manages services, and tracks branch-wise performance.' },
  { icon: '👥', title: 'HR Management', desc: 'Employee registration, daily attendance marking, and leave approval workflows.' },
  { icon: '🎯', title: 'Campaign Management', desc: 'Create health campaigns, assign managers, track patient registrations and sales.' },
  { icon: '📦', title: 'Product Listings', desc: 'Medicines and Ayurvedic products listed publicly with WhatsApp enquiry integration.' },
  { icon: '🔗', title: 'Referral System', desc: 'Open referral form for all users — track and convert referrals to registered patients.' },
];

const roles = [
  { emoji: '👑', title: 'Owner', desc: 'Full control over all branches, campaigns and products.' },
  { emoji: '🩺', title: 'Doctor', desc: 'View patients, assign medicines and treatment courses.' },
  { emoji: '🗂', title: 'Receptionist', desc: 'Register patients, manage billing and HR workflows.' },
  { emoji: '👤', title: 'Employee', desc: 'View own attendance, apply for leaves, campaign access.' },
  { emoji: '🧑‍⚕️', title: 'Patient', desc: 'View own records, bills, book appointments.' },
];

const stats = [
  { value: '5', label: 'User Roles' },
  { value: '10+', label: 'Modules' },
  { value: '25', label: 'Days to Launch' },
  { value: '∞', label: 'Branches Supported' },
];

export default function Home() {
  return (
    <div>
      <PublicNavbar />

      {/* Hero */}
      <section className="hero-section page-hero">
        <div className="hero-bg" />
        <div className="container">
          <div className="hero-grid">
            <div>
              <div className="hero-tag">🏥 Hospital Management System</div>
              <h1 className="hero-title">
                Modern Healthcare<br />
                <span>Management Platform</span>
              </h1>
              <p className="hero-desc">
                A complete hospital management solution with role-based access for owners, doctors, receptionists, employees, and patients. Streamline every workflow in one platform.
              </p>
              <div className="hero-buttons">
                <Link to="/login" className="btn btn-primary btn-lg">Get Started →</Link>
                <Link to="/services" className="btn btn-ghost btn-lg">View Services</Link>
              </div>
            </div>

            <div className="hero-visual">
              <div className="hero-card-stack">
                <div className="hero-card">
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>Patient Record</div>
                    <div style={{ fontWeight: 700 }}>Rahul Sharma</div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--primary)' }}>UHID: GEN-2026-00042</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span className="badge badge-success">Active</span>
                    <span className="badge badge-info">Appointment Today</span>
                  </div>
                </div>
                <div className="hero-card-float" style={{ top: -20, right: -20, width: 160 }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4 }}>Bill Status</div>
                  <div style={{ fontWeight: 700, color: 'var(--success)' }}>₹2,400 Paid ✓</div>
                </div>
                <div className="hero-card-float" style={{ bottom: -20, left: -20, width: 150 }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4 }}>Prescription</div>
                  <div style={{ fontWeight: 700, color: 'var(--primary)' }}>3 Medicines</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section style={{ padding: '40px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24 }}>
            {stats.map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem', fontWeight: 800, color: 'var(--primary)', lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 6 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="section">
        <div className="container">
          <div className="section-header centered">
            <div className="section-tag">Modules</div>
            <h2 className="section-title">Everything Your Hospital Needs<br /><span>In One Platform</span></h2>
            <p className="section-desc">From patient registration to campaign management — all modules work together in a single integrated workflow.</p>
          </div>
          <div className="features-grid">
            {features.map(f => (
              <div key={f.title} className="feature-card">
                <div className="feature-icon" style={{ background: 'var(--primary-bg)' }}>{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* User Roles */}
      <section className="section" style={{ background: 'linear-gradient(180deg, transparent, rgba(0,212,255,0.03), transparent)' }}>
        <div className="container">
          <div className="section-header centered">
            <div className="section-tag">Access Control</div>
            <h2 className="section-title">Role-Based <span>Dashboards</span></h2>
            <p className="section-desc">Each user role gets a tailored dashboard with exactly the features they need — nothing more, nothing less.</p>
          </div>
          <div className="roles-grid">
            {roles.map(r => (
              <div key={r.title} className="role-card">
                <span className="role-emoji">{r.emoji}</span>
                <h3>{r.title}</h3>
                <p>{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section">
        <div className="container">
          <div style={{ textAlign: 'center', padding: '60px 40px', background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-card)', backdropFilter: 'blur(12px)' }}>
            <div className="section-tag">Get Started</div>
            <h2 style={{ marginBottom: 16 }}>Ready to Modernize<br /><span style={{ color: 'var(--primary)' }}>Your Hospital?</span></h2>
            <p style={{ marginBottom: 32, fontSize: '1.05rem' }}>Join thousands of healthcare professionals already using HMS for seamless hospital management.</p>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/login" className="btn btn-primary btn-lg">Login to Dashboard →</Link>
              <Link to="/contact" className="btn btn-ghost btn-lg">Contact Us</Link>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}

function PublicFooter() {
  return (
    <footer className="public-footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg, var(--primary), var(--secondary))', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: 'white' }}>H</div>
              <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.1rem' }}>HMS+</span>
            </div>
            <p>A complete hospital management system for modern healthcare facilities.</p>
          </div>
          <div className="footer-col">
            <h4>Platform</h4>
            <Link to="/services">Services</Link>
            <Link to="/products">Products</Link>
            <Link to="/blog">Blog</Link>
          </div>
          <div className="footer-col">
            <h4>Access</h4>
            <Link to="/login">Login</Link>
            <Link to="/referral">Refer Patient</Link>
          </div>
          <div className="footer-col">
            <h4>Company</h4>
            <Link to="/about">About</Link>
            <Link to="/contact">Contact</Link>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2026 HMS+ — Hospital Management System. All rights reserved.</p>
          <p>Built by Omkar Kangule</p>
        </div>
      </div>
    </footer>
  );
}

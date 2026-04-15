import PublicNavbar from '../../components/layout/PublicNavbar';
import { Link } from 'react-router-dom';

const services = [
  { icon: '🧑‍⚕️', title: 'Patient Registration', desc: 'Auto-generated UHID, complete health profile, emergency contacts, and medical history.' },
  { icon: '📅', title: 'Appointment Booking', desc: 'Doctor-wise scheduling, appointment reminders via email, and status tracking.' },
  { icon: '💊', title: 'Prescription Management', desc: 'Digital prescriptions with medicines, dosages, and duration — linked to patient records.' },
  { icon: '🔬', title: 'Lab Reports', desc: 'Upload and store lab reports via Dropbox integration, accessible to patients.' },
  { icon: '🧾', title: 'Billing & Invoicing', desc: 'Itemized bills, partial payment tracking, UPI/Card/Cash/Insurance payment modes.' },
  { icon: '👥', title: 'Staff Management', desc: 'Multi-role staff management with branch assignments and permission control.' },
  { icon: '✅', title: 'Attendance Tracking', desc: 'Daily attendance marking for employees with check-in/check-out time records.' },
  { icon: '📝', title: 'Leave Management', desc: 'Employee leave applications with approval workflow for managers.' },
  { icon: '🎯', title: 'Camp Management', desc: 'Create camps, assign doctor/employee managers, track patients and sales.' },
  { icon: '📦', title: 'Product Catalogue', desc: 'Public product listings with WhatsApp enquiry integration for Ayurvedic/medicine sales.' },
  { icon: '🔗', title: 'Referral System', desc: 'Open referral portal — anyone can refer a patient. Staff tracks and converts referrals.' },
  { icon: '📧', title: 'Email Notifications', desc: 'Automated email via SendGrid for appointments, bills, prescriptions, and referrals.' },
];

export default function Services() {
  return (
    <div>
      <PublicNavbar />
      <div style={{ paddingTop: 72 }}>
        <section className="section">
          <div className="container">
            <div className="section-header centered">
              <div className="section-tag">Services</div>
              <h2 className="section-title">Complete Hospital <span>Services</span></h2>
              <p className="section-desc">Everything you need to run a modern, efficient hospital — from first patient contact to post-visit billing.</p>
            </div>
            <div className="features-grid">
              {services.map(s => (
                <div key={s.title} className="feature-card">
                  <div className="feature-icon" style={{ background: 'var(--primary-bg)' }}>{s.icon}</div>
                  <h3>{s.title}</h3>
                  <p>{s.desc}</p>
                </div>
              ))}
            </div>
            <div style={{ textAlign: 'center', marginTop: 60 }}>
              <Link to="/login" className="btn btn-primary btn-lg">Access Your Dashboard →</Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

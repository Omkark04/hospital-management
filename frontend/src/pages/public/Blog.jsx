import PublicNavbar from '../../components/layout/PublicNavbar';
import PublicFooter from '../../components/layout/PublicFooter';
import { FiUser, FiTarget, FiMail, FiGrid, FiLock, FiCloud, FiCalendar } from 'react-icons/fi';

const posts = [
  { title: 'How to Use UHID for Patient Tracking', tag: 'Guide', date: 'Apr 10, 2026', desc: 'Unique Health Identifier numbers are auto-generated on patient registration. Learn how they power the entire HMS workflow.', Icon: FiUser },
  { title: 'Campaign Management for Health Camps', tag: 'Feature', date: 'Apr 08, 2026', desc: 'Create campaigns, assign managers with overlay roles, track attendance and sales — all from one dashboard.', Icon: FiTarget },
  { title: 'SendGrid Email Notifications in HMS', tag: 'Tech', date: 'Apr 05, 2026', desc: 'Automated email sends for appointments, bills, prescriptions, and referrals using SendGrid API.', Icon: FiMail },
  { title: 'Multi-Branch Hospital Architecture', tag: 'Architecture', date: 'Apr 02, 2026', desc: 'How HMS handles multiple hospitals, each with multiple branches, all under a single owner account.', Icon: FiGrid },
  { title: 'Role-Based Access: A Deep Dive', tag: 'Security', date: 'Mar 30, 2026', desc: "Five roles, five dashboards. How we designed HMS's permission system to keep sensitive data safe.", Icon: FiLock },
  { title: 'Dropbox & Cloudinary Integrations', tag: 'Integration', date: 'Mar 28, 2026', desc: 'Lab reports stored on Dropbox, product images on Cloudinary — how HMS manages medical file storage.', Icon: FiCloud },
];

export default function Blog() {
  return (
    <div style={{ background: 'var(--parchment)' }}>
      <PublicNavbar />
      <div style={{ paddingTop: 72 }}>
        <section className="section" style={{ minHeight: 'calc(100vh - 120px)' }}>
          <div className="container">
            <div className="section-header centered">
              <div className="section-tag">Blog</div>
              <h2 className="section-title">HMS <span>Insights</span></h2>
              <p className="section-desc">Guides, feature deep-dives, and technical articles about the Hospital Management System.</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 28, marginTop: 48 }}>
              {posts.map(p => (
                <div key={p.title} className="card card-body" style={{ cursor: 'pointer', background: 'var(--linen)', border: '1px solid var(--border-gold)', boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                    <span className="badge" style={{ background: 'var(--moss)', color: '#fff' }}>{p.tag}</span>
                    <p.Icon size={24} color="var(--clay)" />
                  </div>
                  <h3 style={{ fontSize: '1.05rem', marginBottom: 10, fontFamily: '"Cormorant Garamond", serif' }}>{p.title}</h3>
                  <p style={{ fontSize: '0.88rem', marginBottom: 16, color: 'var(--bark-mid)' }}>{p.desc}</p>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <FiCalendar size={14} /> {p.date}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
      <PublicFooter />
    </div>
  );
}

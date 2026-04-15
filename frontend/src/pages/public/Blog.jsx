import PublicNavbar from '../../components/layout/PublicNavbar';

const posts = [
  { title: 'How to Use UHID for Patient Tracking', tag: 'Guide', date: 'Apr 10, 2026', desc: 'Unique Health Identifier numbers are auto-generated on patient registration. Learn how they power the entire HMS workflow.', icon: '🧑‍⚕️' },
  { title: 'Campaign Management for Health Camps', tag: 'Feature', date: 'Apr 08, 2026', desc: 'Create campaigns, assign managers with overlay roles, track attendance and sales — all from one dashboard.', icon: '🎯' },
  { title: 'SendGrid Email Notifications in HMS', tag: 'Tech', date: 'Apr 05, 2026', desc: 'Automated email sends for appointments, bills, prescriptions, and referrals using SendGrid API.', icon: '📧' },
  { title: 'Multi-Branch Hospital Architecture', tag: 'Architecture', date: 'Apr 02, 2026', desc: 'How HMS handles multiple hospitals, each with multiple branches, all under a single owner account.', icon: '🏥' },
  { title: 'Role-Based Access: A Deep Dive', tag: 'Security', date: 'Mar 30, 2026', desc: "Five roles, five dashboards. How we designed HMS's permission system to keep sensitive data safe.", icon: '🔐' },
  { title: 'Dropbox & Cloudinary Integrations', tag: 'Integration', date: 'Mar 28, 2026', desc: 'Lab reports stored on Dropbox, product images on Cloudinary — how HMS manages medical file storage.', icon: '☁️' },
];

export default function Blog() {
  return (
    <div>
      <PublicNavbar />
      <div style={{ paddingTop: 72 }}>
        <section className="section">
          <div className="container">
            <div className="section-header centered">
              <div className="section-tag">Blog</div>
              <h2 className="section-title">HMS <span>Insights</span></h2>
              <p className="section-desc">Guides, feature deep-dives, and technical articles about the Hospital Management System.</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 28, marginTop: 48 }}>
              {posts.map(p => (
                <div key={p.title} className="card card-body" style={{ cursor: 'pointer' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                    <span className="badge badge-primary">{p.tag}</span>
                    <span style={{ fontSize: '2rem' }}>{p.icon}</span>
                  </div>
                  <h3 style={{ fontSize: '1.05rem', marginBottom: 10 }}>{p.title}</h3>
                  <p style={{ fontSize: '0.88rem', marginBottom: 16 }}>{p.desc}</p>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>📅 {p.date}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

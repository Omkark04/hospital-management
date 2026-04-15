import PublicNavbar from '../../components/layout/PublicNavbar';

const team = [
  { name: 'Dr. Mangesh Wagh', role: 'Hospital Owner & Physician', emoji: '👨‍⚕️' },
];

export default function About() {
  return (
    <div>
      <PublicNavbar />
      <div style={{ paddingTop: 72 }}>
        <section className="section">
          <div className="container">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}>
              <div>
                <div className="section-tag">About HMS+</div>
                <h2 className="section-title" style={{ marginTop: 16 }}>Built for Modern <span>Healthcare</span></h2>
                <p style={{ fontSize: '1.05rem', lineHeight: 1.8, marginTop: 20 }}>
                  The Hospital Management System was developed to address the real operational challenges faced by multi-branch healthcare facilities. From patient registration to campaign management — every feature was designed with the actual workflows of doctors, receptionists, and hospital owners in mind.
                </p>
                <p style={{ marginTop: 16 }}>
                  The system supports 5 distinct user roles, each with tailored dashboards and permissions, ensuring staff only see what they need to do their job — no more, no less.
                </p>
                <div style={{ display: 'flex', gap: 32, marginTop: 36 }}>
                  {[['10+', 'Modules'], ['5', 'User Roles'], ['25-Day', 'Build']].map(([v, l]) => (
                    <div key={l}>
                      <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '2rem', color: 'var(--primary)' }}>{v}</div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{l}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {[
                  { title: 'Our Mission', desc: 'To give every hospital, regardless of size, access to world-class management tools that save time and improve patient care.' },
                  { title: 'Technology Stack', desc: 'React TypeScript frontend + Django REST backend on SQLite (dev) / PostgreSQL (prod), with Cloudinary, Dropbox, and SendGrid integrations.' },
                  { title: 'Our Vision', desc: 'A future where healthcare administration is fully digital, paperless, and accessible from anywhere.' },
                ].map(item => (
                  <div key={item.title} className="card card-body">
                    <h4 style={{ marginBottom: 8, color: 'var(--primary)' }}>{item.title}</h4>
                    <p style={{ fontSize: '0.9rem' }}>{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="section" style={{ paddingTop: 0 }}>
          <div className="container">
            <h3 style={{ marginBottom: 32, textAlign: 'center' }}>Our Team</h3>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              {team.map(t => (
                <div key={t.name} className="role-card" style={{ maxWidth: 280 }}>
                  <span className="role-emoji">{t.emoji}</span>
                  <h3>{t.name}</h3>
                  <p>{t.role}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

import { Link } from 'react-router-dom'
import { ROUTES } from '@/config/routes'
import styles from './HomePage.module.css'

const SERVICES = [
  { icon: '🩺', title: 'General Medicine',  desc: 'Expert diagnosis and treatment for all common ailments.' },
  { icon: '🦷', title: 'Dental Care',        desc: 'Complete oral health services from cleaning to surgery.' },
  { icon: '👶', title: 'Paediatrics',        desc: 'Specialized care for infants, children, and adolescents.' },
  { icon: '🧘', title: 'Ayurveda',           desc: 'Traditional healing with modern science integration.' },
  { icon: '💊', title: 'Pharmacy',           desc: 'In-house pharmacy with prescribed and OTC medicines.' },
  { icon: '🔬', title: 'Diagnostics',        desc: 'State-of-the-art lab and imaging services.' },
]

const STATS = [
  { value: '15,000+', label: 'Patients Served' },
  { value: '50+',     label: 'Expert Doctors' },
  { value: '4',       label: 'Branches' },
  { value: '24/7',    label: 'Emergency Care' },
]

export default function HomePage() {
  return (
    <>
      {/* HERO */}
      <section className={styles.hero}>
        <div className={styles.heroBlob1} aria-hidden />
        <div className={styles.heroBlob2} aria-hidden />
        <div className={styles.heroContent}>
          <span className={styles.heroBadge}>🏥 India's Trusted Healthcare Network</span>
          <h1 className={styles.heroTitle}>
            Advanced Healthcare,<br />
            <span className={styles.heroGradient}>Compassionate Care</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Providing world-class medical services across 4 branches.
            Your health is our mission — from primary care to specialized treatments.
          </p>
          <div className={styles.heroActions}>
            <Link to={ROUTES.REFERRAL} className={styles.heroPrimary} id="home-book-btn">
              Book an Appointment
            </Link>
            <Link to={ROUTES.SERVICES} className={styles.heroSecondary} id="home-services-btn">
              Explore Services →
            </Link>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className={styles.stats}>
        <div className={styles.container}>
          {STATS.map((s) => (
            <div key={s.label} className={styles.stat}>
              <p className={styles.statValue}>{s.value}</p>
              <p className={styles.statLabel}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SERVICES */}
      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Our Specialties</h2>
            <p className={styles.sectionSubtitle}>Comprehensive care under one roof</p>
          </div>
          <div className={styles.servicesGrid}>
            {SERVICES.map((s) => (
              <div key={s.title} className={styles.serviceCard}>
                <div className={styles.serviceIcon}>{s.icon}</div>
                <h3 className={styles.serviceName}>{s.title}</h3>
                <p className={styles.serviceDesc}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA BANNER */}
      <section className={styles.ctaBanner}>
        <div className={styles.container}>
          <h2>Ready to experience better healthcare?</h2>
          <p>Join over 15,000 patients who trust us with their health.</p>
          <Link to={ROUTES.LOGIN} className={styles.ctaBtn} id="home-cta-login">
            Patient Portal →
          </Link>
        </div>
      </section>
    </>
  )
}

import { Link } from 'react-router-dom';
import PublicNavbar from '../../components/layout/PublicNavbar';
import PublicFooter from '../../components/layout/PublicFooter';
import {
  FiPhone, FiCalendar, FiCheckCircle, FiArrowRight, FiHeart, FiEye, FiAward,
  FiShield, FiTarget
} from 'react-icons/fi';
import { FaLeaf, FaWhatsapp, FaSpa } from 'react-icons/fa';
import { MdOutlineHealthAndSafety } from 'react-icons/md';
import DoctorImg from '../../assets/Doctor.png';

const values = [
  { Icon: FiHeart, title: 'Patient First', desc: 'Every decision we make is guided by what is best for our patient.' },
  { Icon: FiCheckCircle, title: 'Evidence-Based', desc: 'Combining traditional Ayurveda with modern scientific methods.' },
  { Icon: FaLeaf, title: 'Natural Healing', desc: 'We believe the body can heal itself with the right support.' },
  { Icon: MdOutlineHealthAndSafety, title: 'Long-term Relationship', desc: 'We treat our patients like family and guide them through full recovery.' },
];

const qualifications = [
  'Specialist in Non-Surgical Spine & Joint Treatment',
  'Certified Sujok Therapy Practitioner',
  'Trained in Ayurvedic Panchakarma Therapies',
  'Advanced Pain Management & Counseling',
  '10 Years of Clinical Experience',
];

export default function About() {
  return (
    <div style={{ background: 'var(--parchment)' }}>
      <PublicNavbar />
      <div style={{ paddingTop: 72 }}>
        {/* Banner */}
        <div className="page-banner">
          <div className="container" style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
            <div className="section-tag" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', borderColor: 'rgba(255,255,255,0.30)' }}>
              About Us
            </div>
            <h1 style={{ color: '#fff', marginTop: 16, marginBottom: 12, fontFamily: '"Cormorant Garamond", serif' }}>
              About Us
            </h1>
            <p style={{ color: 'rgba(255,252,240,0.85)', maxWidth: 500, margin: '0 auto', fontSize: '1.05rem' }}>
              A clinic built on trust, expertise, and a commitment to drug-free, non-surgical healing.
            </p>
          </div>
        </div>


        {/* Story */}
        <section className="section" style={{ background: 'var(--linen)', paddingTop: 80 }}>
          <div className="container">
            <div>
              <div className="section-tag">Our Story</div>
              <h2 style={{ marginTop: 16, marginBottom: 18, fontFamily: '"Cormorant Garamond", serif' }}>
                Healing Through <span style={{ color: 'var(--moss)', fontStyle: 'italic' }}>Natural Methods</span>
              </h2>
              <p style={{ lineHeight: 1.85, marginBottom: 18, fontSize: '1.1rem' }}>
                Dr. Spine &amp; Nerves was founded by Dr. Mangesh Wagh with a single mission: to provide effective pain relief without surgery, injections, or heavy drugs. Having witnessed patients suffer unnecessarily through invasive procedures, Dr. Wagh dedicated his practice to mastering non-surgical alternatives.
              </p>
              <p style={{ lineHeight: 1.85, marginBottom: 18, fontSize: '1.1rem' }}>
                Today, the clinic is a leading centre for non-surgical Spine and Joint care in Maharashtra. We bring together the ancient wisdom of Ayurveda, the precision of Sujok therapy, and the power of modern advanced therapies — all under one roof.
              </p>
              <p style={{ lineHeight: 1.85, marginBottom: 32, fontSize: '1.1rem' }}>
                More than just treating symptoms, we focus on understanding the <strong>root cause</strong> of each condition and creating a personalised recovery program that delivers lasting results.
              </p>

              {/* Mission / Vision */}
              <div className="responsive-grid-2" style={{ marginBottom: 32 }}>
                {[
                  { Icon: FiTarget, title: 'Our Mission', text: 'To deliver non-surgical, drug-free pain relief that improves quality of life — naturally and permanently.' },
                  { Icon: FiEye, title: 'Our Vision', text: 'A world where every patient has access to safe, effective, and natural spine and joint care before considering surgery.' },
                ].map(v => (
                  <div key={v.title} style={{
                    padding: 20, background: 'var(--parchment)',
                    borderRadius: 12, border: '1px solid var(--border-gold)',
                    boxShadow: 'var(--shadow-sm)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <v.Icon size={16} color="var(--clay)" />
                      <div style={{ fontWeight: 700, color: 'var(--bark)' }}>{v.title}</div>
                    </div>
                    <p style={{ fontSize: '1.05rem', lineHeight: 1.6 }}>{v.text}</p>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <Link to="/services" className="btn btn-primary" style={{ gap: 8 }}>
                  <FiArrowRight size={14} /> View Our Services
                </Link>
                <Link to="/contact" className="btn btn-ghost" style={{ gap: 8 }}>
                  <FiCalendar size={14} /> Book Consultation
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ══ DOCTOR PROFILE ══ */}
        <section style={{ background: 'var(--off-white)', padding: '90px 0' }}>
          <div className="container">
            <div className="doctor-profile-split">
              <div className="doctor-info">
                <div className="section-tag" style={{ marginBottom: 14 }}>Best Physician</div>
                <h2 style={{ fontSize: '2.8rem', color: 'var(--navy)', marginBottom: 12 }}>
                  About Dr. Mangesh Wagh
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.15rem', lineHeight: 1.8, marginBottom: 28, maxWidth: 540 }}>
                  With over 10 years of experience, Dr. Mangesh Wagh is a leading expert in
                  non-surgical spine and joint treatments. Known for his unique multi-modal
                  approach combining Ayurvedic tradition, Sujok therapy, and advanced medical technology.
                </p>

                <h4 style={{ color: 'var(--navy)', marginBottom: 16, fontSize: '1.2rem' }}>Core Expertise</h4>
                <div className="doctor-skills-grid">
                  {[
                    'Non-Surgical Spine Treatment', 'Laser Assisted Therapy',
                    'Ayurvedic Therapies', 'Sujok Pain Management',
                    'Ligament Injury Recovery', 'Chronic Pain Management',
                    'Posture Correction', 'Advanced Therapy Support'
                  ].map(skill => (
                    <div key={skill} className="skill-item">
                      <FiCheckCircle size={16} color="var(--secondary)" />
                      <span>{skill}</span>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: 40, display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
                  <Link to="/contact" className="btn btn-primary btn-lg">
                    Appointment <FiArrowRight style={{ marginLeft: 8 }} />
                  </Link>
                  <div style={{ fontFamily: '"Great Vibes", cursive', fontSize: '2.4rem', color: 'var(--navy)', opacity: 0.8, transform: 'rotate(-4deg)' }}>
                    Mangesh Wagh
                  </div>
                </div>
              </div>

              <div className="doctor-image-wrapper">
                <div className="doctor-bg-shape" />
                <img src={DoctorImg} alt="Dr. Mangesh Wagh" className="doctor-portrait" />

                <div className="doctor-badge top-badge">
                  <div className="badge-icon"><FiShield size={24} color="var(--primary)" /></div>
                  <div>
                    <strong>Best Physician</strong>
                    <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Award Winner</span>
                  </div>
                </div>

                <div className="doctor-badge bottom-badge">
                  <div className="badge-value">10</div>
                  <div className="badge-text">
                    <strong>Years</strong>
                    <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Experienced</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="section" style={{ background: 'var(--parchment)', paddingTop: 70 }}>
          <div className="container">
            <div className="section-header centered">
              <div className="section-tag">What We Stand For</div>
              <h2 className="section-title">Our Core <span>Values</span></h2>
            </div>
            <div className="responsive-grid-4" style={{ gap: 20 }}>
              {values.map(v => (
                <div key={v.title} className="value-card" style={{
                  background: 'var(--white)',
                  borderRadius: 20, padding: '28px 20px',
                  border: '1px solid var(--border-gold)',
                  boxShadow: 'var(--shadow-sm)',
                  textAlign: 'center',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center'
                }}>
                  <div style={{ 
                    marginBottom: 16, 
                    width: 56, height: 56, 
                    background: 'var(--parchment)', 
                    borderRadius: '50%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    border: '1px solid var(--border-gold)',
                    boxShadow: '0 4px 10px rgba(180, 160, 140, 0.1)'
                  }}>
                    <v.Icon size={26} color="var(--clay)" />
                  </div>
                  <h4 style={{ 
                    marginBottom: 10, 
                    color: 'var(--bark)', 
                    fontFamily: '"Cormorant Garamond", serif',
                    fontSize: '1.4rem',
                    fontWeight: 700
                  }}>
                    {v.title}
                  </h4>
                  <p style={{ 
                    fontSize: '0.9rem', 
                    lineHeight: 1.6, 
                    color: 'var(--text-secondary)',
                    margin: '0 auto'
                  }}>
                    {v.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats */}
        <section style={{ background: 'linear-gradient(150deg, #2c4420 0%, #3d5a2a 55%, #4d7038 100%)', padding: '70px 0' }}>
          <div className="container">
            <div className="responsive-grid-4" style={{ textAlign: 'center' }}>
              {[
                ['5000+', 'Treated Patients'],
                ['10', 'Years Experience'],
                ['98%', 'Success Rate'],
                ['5', 'Therapy Types']
              ].map(([v, l]) => (
                <div key={l}>
                  <div style={{ fontFamily: '"Cormorant Garamond", serif', fontWeight: 700, fontSize: '2.8rem', color: '#fff' }}>{v}</div>
                  <div style={{ color: 'rgba(255,252,240,0.70)', fontSize: '0.875rem', marginTop: 6 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section style={{ background: 'var(--linen)', textAlign: 'center', padding: '70px 0' }}>
          <div className="container">
            <FaSpa size={40} color="var(--clay)" style={{ marginBottom: 16 }} />
            <h2 style={{ marginBottom: 12, fontFamily: '"Cormorant Garamond", serif' }}>Ready to Experience the Difference?</h2>
            <p style={{ marginBottom: 32, maxWidth: 480, margin: '0 auto 32px' }}>Come visit us and let Dr. Wagh create a personalised treatment plan for you.</p>
            <Link to="/contact" className="btn btn-primary btn-lg" style={{ gap: 8 }}>
              <FiCalendar size={16} /> Book an Appointment Today
            </Link>
          </div>
        </section>
      </div>
      <PublicFooter />
    </div>
  );
}



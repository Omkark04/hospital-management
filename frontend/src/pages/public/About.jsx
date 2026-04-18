import { Link } from 'react-router-dom';
import PublicNavbar from '../../components/layout/PublicNavbar';
import PublicFooter from '../../components/layout/PublicFooter';
import {
  FiPhone, FiCalendar, FiCheckCircle, FiArrowRight, FiHeart, FiEye, FiAward
} from 'react-icons/fi';
import { FaLeaf, FaWhatsapp, FaSpa } from 'react-icons/fa';
import { MdOutlineHealthAndSafety } from 'react-icons/md';

const values = [
  { Icon: FiHeart,                  title: 'Patient First',          desc: 'Every decision we make is guided by what is best for our patient.' },
  { Icon: FiCheckCircle,            title: 'Evidence-Based',          desc: 'Combining traditional Ayurveda with modern scientific methods.' },
  { Icon: FaLeaf,                   title: 'Natural Healing',         desc: 'We believe the body can heal itself with the right support.' },
  { Icon: MdOutlineHealthAndSafety, title: 'Long-term Relationship',  desc: 'We treat our patients like family and guide them through full recovery.' },
];

const qualifications = [
  'Specialist in Non-Surgical Spine & Joint Treatment',
  'Certified Sujok Therapy Practitioner',
  'Trained in Ayurvedic Panchakarma Therapies',
  'Advanced Pain Management & Counseling',
  '15+ Years of Clinical Experience',
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
              About Dr. Spine &amp; Nerves
            </h1>
            <p style={{ color: 'rgba(255,252,240,0.85)', maxWidth: 500, margin: '0 auto', fontSize: '1.05rem' }}>
              A clinic built on trust, expertise, and a commitment to drug-free, non-surgical healing.
            </p>
          </div>
        </div>

        {/* Doctor story */}
        <section className="section" style={{ background: 'var(--linen)', paddingTop: 80 }}>
          <div className="container">
            <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: 64, alignItems: 'start' }}>

              {/* Doctor card */}
              <div>
                <div style={{
                  width: '100%', aspectRatio: '1',
                  background: 'linear-gradient(135deg, var(--parchment-deep), #dff0d4)',
                  borderRadius: 24,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '1px solid var(--border-gold)',
                  boxShadow: 'var(--shadow-gold)',
                }}>
                  <MdOutlineHealthAndSafety size={120} color="var(--moss)" style={{ opacity: 0.7 }} />
                </div>
                <div style={{
                  background: 'var(--parchment)',
                  border: '1px solid var(--border-gold)',
                  borderRadius: 16, padding: 22, marginTop: 20,
                  boxShadow: 'var(--shadow-sm)',
                }}>
                  <div style={{ fontFamily: '"Cormorant Garamond", serif', fontWeight: 700, fontSize: '1.1rem', color: 'var(--bark)', marginBottom: 4 }}>
                    Dr. Mangesh Wagh
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 14 }}>
                    Spine &amp; Joint Specialist
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {qualifications.map(q => (
                      <div key={q} style={{ display: 'flex', gap: 8, fontSize: '0.82rem', alignItems: 'flex-start' }}>
                        <FiCheckCircle size={13} color="var(--moss)" style={{ flexShrink: 0, marginTop: 2 }} />
                        <span>{q}</span>
                      </div>
                    ))}
                  </div>
                  <a href="tel:+919763331118" className="btn btn-primary" style={{ marginTop: 20, justifyContent: 'center', width: '100%', gap: 8 }}>
                    <FiPhone size={14} /> Book with Dr. Wagh
                  </a>
                </div>
              </div>

              {/* Story */}
              <div>
                <div className="section-tag">Our Story</div>
                <h2 style={{ marginTop: 16, marginBottom: 18, fontFamily: '"Cormorant Garamond", serif' }}>
                  Healing Through <span style={{ color: 'var(--moss)', fontStyle: 'italic' }}>Natural Methods</span>
                </h2>
                <p style={{ lineHeight: 1.85, marginBottom: 18 }}>
                  Dr. Spine &amp; Nerves was founded by Dr. Mangesh Wagh with a single mission: to provide effective pain relief without surgery, injections, or heavy drugs. Having witnessed patients suffer unnecessarily through invasive procedures, Dr. Wagh dedicated his practice to mastering non-surgical alternatives.
                </p>
                <p style={{ lineHeight: 1.85, marginBottom: 18 }}>
                  Today, the clinic is a leading centre for non-surgical Spine and Joint care in Maharashtra. We bring together the ancient wisdom of Ayurveda, the precision of Sujok therapy, and the power of modern advanced therapies — all under one roof.
                </p>
                <p style={{ lineHeight: 1.85, marginBottom: 32 }}>
                  More than just treating symptoms, we focus on understanding the <strong>root cause</strong> of each condition and creating a personalised recovery program that delivers lasting results.
                </p>

                {/* Mission / Vision */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 32 }}>
                  {[
                    { Icon: FiTarget, title: 'Our Mission', text: 'To deliver non-surgical, drug-free pain relief that improves quality of life — naturally and permanently.' },
                    { Icon: FiEye,    title: 'Our Vision',  text: 'A world where every patient has access to safe, effective, and natural spine and joint care before considering surgery.' },
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
                      <p style={{ fontSize: '0.875rem' }}>{v.text}</p>
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
          </div>
        </section>

        {/* Values */}
        <section className="section" style={{ background: 'var(--parchment)', paddingTop: 70 }}>
          <div className="container">
            <div className="section-header centered">
              <div className="section-tag">What We Stand For</div>
              <h2 className="section-title">Our Core <span>Values</span></h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
              {values.map(v => (
                <div key={v.title} style={{
                  background: 'var(--linen)',
                  borderRadius: 16, padding: 28,
                  border: '1px solid var(--border-gold)',
                  boxShadow: 'var(--shadow-sm)',
                }}>
                  <div style={{ marginBottom: 16, width: 48, height: 48, background: 'var(--secondary-bg)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-gold)' }}>
                    <v.Icon size={22} color="var(--clay)" />
                  </div>
                  <h4 style={{ marginBottom: 8, color: 'var(--bark)', fontFamily: '"Cormorant Garamond", serif' }}>{v.title}</h4>
                  <p style={{ fontSize: '0.875rem' }}>{v.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats */}
        <section style={{ background: 'linear-gradient(150deg, #2c4420 0%, #3d5a2a 55%, #4d7038 100%)', padding: '70px 0' }}>
          <div className="container">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, textAlign: 'center' }}>
              {[['10,000+', 'Patients Helped'], ['15+', 'Years Experience'], ['98%', 'Success Rate'], ['5', 'Therapy Types']].map(([v, l]) => (
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

/* local ref for FiTarget / FiEye (already has FiEye but not FiTarget, fix below) */
function FiTarget({ size, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color || 'currentColor'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
    </svg>
  );
}

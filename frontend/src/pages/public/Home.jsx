import { Link } from 'react-router-dom';
import React from 'react';
import PublicNavbar from '../../components/layout/PublicNavbar';
import PublicFooter from '../../components/layout/PublicFooter';
import {
  FiPhone, FiCalendar, FiClock, FiMapPin, FiCheckCircle, FiArrowRight,
  FiStar, FiShield, FiHeart, FiTarget, FiUsers, FiBookOpen
} from 'react-icons/fi';
import {
  GiSpineArrow, GiHerbsBundle, GiHandBandage, GiMedicalThermometer,
  GiMuscleUp, GiMeditation
} from 'react-icons/gi';
import {
  MdOutlineSelfImprovement, MdOutlineHealthAndSafety, MdOutlineGroup
} from 'react-icons/md';
import { FaWhatsapp, FaLeaf, FaSpa } from 'react-icons/fa';
import { RiMentalHealthLine } from 'react-icons/ri';
import { BsLightningChargeFill } from 'react-icons/bs';
import { Canvas } from '@react-three/fiber';
import SpineModel from '../../components/3d/SpineModel';

/* ── Data ── */
const stats = [
  { value: '10,000+', label: 'Patients Healed' },
  { value: '98%',     label: 'Success Rate' },
  { value: '15+',     label: 'Years Experience' },
  { value: '5',       label: 'Therapies' },
];

const services = [
  {
    Icon: GiSpineArrow,
    title: 'Spine & Joint Treatment',
    desc: 'Non-surgical relief for Back Pain, Slip Disc, Sciatica, Cervical Spondylosis, Frozen Shoulder & Knee Pain.',
    link: '/services#spine',
    accent: '#3d5a2a',
  },
  {
    Icon: FaLeaf,
    title: 'Ayurvedic Therapies',
    desc: 'Ancient healing through Kati Basti, Janu Basti, Snehan, Potli, Lep, and Steam Therapy.',
    link: '/services#ayurveda',
    accent: '#5c7a42',
  },
  {
    Icon: GiHandBandage,
    title: 'Sujok Therapy',
    desc: 'Drug-free, non-invasive pain management through precision Sujok acupressure on hand and foot points.',
    link: '/services#sujok',
    accent: '#c89030',
  },
  {
    Icon: BsLightningChargeFill,
    title: 'Advanced Therapy',
    desc: 'Electric Stimulation, Chiropractic Gun, Crazy Fit Machine & Full Body Massage Chair.',
    link: '/services#advanced',
    accent: '#b5622a',
  },
  {
    Icon: RiMentalHealthLine,
    title: 'Counseling & Lifestyle',
    desc: 'Posture correction, pain management counseling & personalised lifestyle advice for lasting recovery.',
    link: '/services#counseling',
    accent: '#3d5a2a',
  },
];

const conditions = [
  'Lower & Upper Back Pain',
  'Slip Disc / Disc Herniation',
  'Sciatica Pain',
  'Neck Pain / Cervical Spondylosis',
  'Frozen Shoulder',
  'Knee Pain & Stiffness',
  'Ligament Injuries (ACL / PCL)',
  'Difficulty Walking / Bending',
];

const whyUs = [
  { Icon: FiShield,               title: 'Non-Surgical',       desc: 'Treat root causes of pain without surgery, injections, or heavy medications.' },
  { Icon: FaLeaf,                  title: 'Ayurvedic Heritage', desc: 'Combining 5,000-year-old Ayurvedic wisdom with modern clinical practice.' },
  { Icon: MdOutlineHealthAndSafety,title: 'Expert Guidance',    desc: 'Dr. Mangesh Wagh — 15+ years focused entirely on Spine & Joint conditions.' },
  { Icon: FaSpa,                   title: 'Drug-Free Options',  desc: 'Natural therapies completely safe for all ages and health conditions.' },
  { Icon: FiTarget,                title: 'Personalised Plans', desc: 'Every patient receives a customised multi-modal treatment program.' },
  { Icon: FiBookOpen,              title: 'Patient Education',  desc: 'Empowering patients with posture & lifestyle knowledge to prevent relapse.' },
];

const ayurvedaTherapies = [
  { icon: <FaSpa size={26} />,              label: 'Kati Basti',    desc: 'Warm medicated oil pool on the lower back' },
  { icon: <FaLeaf size={26} />,             label: 'Janu Basti',    desc: 'Nourishing knee therapy with herbal oils' },
  { icon: <MdOutlineSelfImprovement size={26} />, label: 'Snehan',  desc: 'Full body Ayurvedic oil massage therapy' },
  { icon: <GiMedicalThermometer size={26} />,label: 'Steam Therapy',desc: 'Herbal steam to open channels and release toxins' },
];

const process = [
  { step: '01', Icon: FiPhone,       title: 'Book Appointment', desc: 'Call or WhatsApp us. Same-day confirmation.' },
  { step: '02', Icon: FiCheckCircle, title: 'Assessment',       desc: 'Detailed physical examination and condition review by Dr. Wagh.' },
  { step: '03', Icon: FiTarget,      title: 'Personalised Plan',desc: 'A tailored multi-therapy program designed for your condition.' },
  { step: '04', Icon: FiHeart,       title: 'Begin Healing',    desc: 'Start your sessions monitored every step by our specialist team.' },
];

/* ── Component ── */
export default function Home() {
  return (
    <div>
      <PublicNavbar />

      {/* ══ HERO ══ */}
      <section className="clinic-hero" style={{ position: 'relative', background: 'transparent' }}>
        {/* 3D Canvas constrained purely to the Hero section */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          zIndex: 50, 
          pointerEvents: 'none',
        }}>
          <Canvas camera={{ position: [0, 0, 8], fov: 45 }} gl={{ preserveDrawingBuffer: true }}>
            <React.Suspense fallback={null}>
              <SpineModel />
            </React.Suspense>
          </Canvas>
        </div>

        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <div className="clinic-hero-content">
            <div className="clinic-hero-eyebrow">
              <FiStar size={12} /> Trusted Non-Surgical Specialist
            </div>

            <div className="clinic-hero-sanskrit">
              आरोग्यं परमं भाग्यं — Health is the greatest wealth
            </div>

            <h1 className="clinic-hero-title">
              Heal Without Surgery.<br />
              <span className="accent-word">Live Pain-Free.</span>
            </h1>

            <p className="clinic-hero-desc">
              Dr. Mangesh Wagh specialises in <strong>non-surgical treatment</strong> of Spine and
              Joint conditions — combining Ayurveda, Sujok Therapy, and advanced medical technology.
            </p>

            <div className="clinic-hero-ctas">
              <Link to="/contact" className="btn btn-primary btn-lg">
                <FiCalendar size={16} /> Book Appointment
              </Link>
              <Link to="/services" className="btn btn-outline btn-lg">
                View All Services <FiArrowRight size={16} />
              </Link>
            </div>

            <div className="clinic-hero-badges">
              <div className="hero-badge"><FiShield size={13} /> Non-Surgical</div>
              <div className="hero-badge"><FaLeaf size={13} /> Drug-Free Options</div>
              <div className="hero-badge"><FiClock size={13} /> Same-Day Appointments</div>
            </div>
          </div>
        </div>

      </section>

      {/* ══ QUICK CONTACT BAR ══ */}
      <div className="contact-bar">
        <div className="container">
          <div className="contact-bar-grid">
            <a href="tel:+919763331118" className="contact-bar-item">
              <FiPhone className="contact-bar-icon" size={22} />
              <div>
                <div className="contact-bar-label">Call Us Now</div>
                <div className="contact-bar-value">+91 97633 31118</div>
              </div>
            </a>
            <div className="contact-bar-item">
              <FiClock className="contact-bar-icon" size={22} />
              <div>
                <div className="contact-bar-label">Clinic Hours</div>
                <div className="contact-bar-value">Mon – Sat: 9 AM – 7 PM</div>
              </div>
            </div>
            <div className="contact-bar-item">
              <FiMapPin className="contact-bar-icon" size={22} />
              <div>
                <div className="contact-bar-label">Location</div>
                <div className="contact-bar-value">Maharashtra, India</div>
              </div>
            </div>
            <Link to="/contact" className="btn btn-gold" style={{ whiteSpace: 'nowrap' }}>
              <FiCalendar size={15} /> Book Appointment
            </Link>
          </div>
        </div>
      </div>

      {/* ══ STATS ══ */}
      <section style={{ background: 'var(--linen)', padding: '80px 0 90px' }}>
        <div className="container">
          <div className="stats-strip">
            {stats.map(s => (
              <div key={s.label} className="stats-strip-item">
                <div className="stats-strip-value">{s.value}</div>
                <div className="stats-strip-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ SERVICES ══ */}
      <section style={{ background: 'var(--parchment)', padding: '90px 0 100px', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(90deg, transparent, rgba(200,144,48,0.4), transparent)' }} />
        <div className="container">
          <div className="section-header centered">
            <div className="mandala-ring">
              <FaLeaf size={22} color="var(--moss)" />
            </div>
            <div className="section-tag">Our Core Specializations</div>
            <h2 className="section-title">Comprehensive <span>Treatment Programs</span></h2>
            <p className="section-desc">
              Five distinct healing paths — rooted in Ayurvedic tradition and enhanced by modern science.
            </p>
          </div>

          <div className="services-grid">
            {services.map(({ Icon, title, desc, link, accent }) => (
              <Link key={title} to={link} className="service-card"
                style={{ borderTop: `3px solid ${accent}25` }}>
                <div className="service-card-icon">
                  <Icon size={36} color={accent} />
                </div>
                <h3>{title}</h3>
                <p>{desc}</p>
                <div className="service-card-cta" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  Learn More <FiArrowRight size={13} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CONDITIONS — Deep Moss ══ */}
      <section style={{
        background: 'linear-gradient(150deg, #2c4420 0%, #3d5a2a 55%, #4d7038 100%)',
        padding: '88px 0', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: 'radial-gradient(circle 2px at 10% 20%, rgba(200,220,168,0.20) 0%, transparent 1px), radial-gradient(circle 2px at 90% 80%, rgba(240,216,152,0.18) 0%, transparent 1px)' }} />
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}>
            <div>
              <div className="section-tag" style={{ background: 'rgba(240,216,152,0.15)', color: 'var(--turmeric-pale)', borderColor: 'rgba(240,216,152,0.30)' }}>
                Conditions We Treat
              </div>
              <h2 style={{ color: '#fff', marginTop: 16, fontFamily: '"Cormorant Garamond", serif', lineHeight: 1.15 }}>
                Are You Suffering<br />
                <span style={{ color: 'var(--turmeric-pale)', fontStyle: 'italic' }}>From Any of These?</span>
              </h2>
              <p style={{ color: 'rgba(255,252,240,0.72)', marginTop: 16, lineHeight: 1.8 }}>
                Our specialist team provides non-surgical, evidence-based treatment for all these conditions — naturally and effectively.
              </p>
              <div style={{ marginTop: 32, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <Link to="/contact" className="btn btn-gold btn-lg">
                  <FiCalendar size={15} /> Book Consultation
                </Link>
                <a href="https://wa.me/919763331118" target="_blank" rel="noreferrer"
                  className="btn btn-lg"
                  style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.30)', backdropFilter: 'blur(8px)', gap: 8 }}>
                  <FaWhatsapp size={17} /> WhatsApp Us
                </a>
              </div>
            </div>
            <div className="conditions-grid">
              {conditions.map(c => (
                <div key={c} className="condition-chip">
                  <FiCheckCircle size={14} style={{ flexShrink: 0, color: 'var(--turmeric-pale)' }} />
                  {c}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ AYURVEDIC HERITAGE — Turmeric/Gold ══ */}
      <section style={{
        background: 'linear-gradient(135deg, #f7eedc 0%, #f5e8c4 50%, #f0dfa8 100%)',
        padding: '90px 0', position: 'relative', overflow: 'hidden',
      }}>
        {/* Mandala decoration */}
        <div style={{ position: 'absolute', top: '50%', right: '5%', transform: 'translateY(-50%)', width: 320, height: 320, borderRadius: '50%', border: '1px dashed rgba(200,144,48,0.25)', pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', inset: 20, borderRadius: '50%', border: '1px dashed rgba(200,144,48,0.20)' }} />
          <div style={{ position: 'absolute', inset: 50, borderRadius: '50%', border: '1px solid rgba(200,144,48,0.15)' }} />
          <div style={{ position: 'absolute', inset: '50%', transform: 'translate(-50%, -50%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FaSpa size={40} color="rgba(200,144,48,0.35)" />
          </div>
        </div>

        <div className="container">
          <div style={{ maxWidth: 680 }}>
            <div className="section-tag" style={{ background: 'rgba(200,144,48,0.12)', color: 'var(--clay)', borderColor: 'rgba(200,144,48,0.30)' }}>
              The Ayurvedic Approach
            </div>
            <h2 style={{ marginTop: 16, fontFamily: '"Cormorant Garamond", serif', fontSize: 'clamp(1.8rem, 3vw, 2.8rem)', color: 'var(--bark)', lineHeight: 1.2 }}>
              Thousands of Years of Healing<br />
              <span style={{ color: 'var(--moss)', fontStyle: 'italic' }}>Refined for Modern Health</span>
            </h2>
            <div className="clinic-hero-sanskrit" style={{ marginTop: 16, marginBottom: 16 }}>
              स्वस्थस्य स्वास्थ्य रक्षणं — Protect the health of the healthy
            </div>
            <p style={{ lineHeight: 1.85, color: 'var(--bark-mid)', marginBottom: 28, fontSize: '0.975rem' }}>
              Ayurveda — the "Science of Life" — forms the cornerstone of our treatment philosophy.
              Each therapy is rooted in these ancient principles, using natural oils, herbs, and healing
              techniques that restore balance to the body's Vata, Pitta, and Kapha doshas.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 32 }}>
              {ayurvedaTherapies.map(t => (
                <div key={t.label} style={{
                  padding: '16px', background: 'rgba(255,250,235,0.75)',
                  border: '1px solid rgba(200,144,48,0.25)', borderRadius: 12,
                  backdropFilter: 'blur(8px)',
                }}>
                  <div style={{ color: 'var(--clay)', marginBottom: 8 }}>{t.icon}</div>
                  <div style={{ fontFamily: '"Cormorant Garamond", serif', fontWeight: 600, color: 'var(--bark)', marginBottom: 3, fontSize: '1rem' }}>{t.label}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{t.desc}</div>
                </div>
              ))}
            </div>
            <Link to="/services#ayurveda" className="btn btn-primary btn-lg">
              <FaLeaf size={15} /> Explore Ayurvedic Treatments
            </Link>
          </div>
        </div>
      </section>

      {/* ══ HOW IT WORKS ══ */}
      <section style={{ background: 'var(--linen)', padding: '90px 0' }}>
        <div className="container">
          <div className="section-header centered">
            <div className="section-tag">Simple Process</div>
            <h2 className="section-title">Your Healing <span>Journey</span></h2>
            <p className="section-desc">Four steps from first contact to lasting relief.</p>
          </div>
          <div className="process-grid">
            {process.map(({ step, Icon, title, desc }) => (
              <div key={step} className="process-step">
                <div className="process-step-num">{step}</div>
                <div style={{ marginBottom: 12 }}>
                  <Icon size={28} color="var(--moss)" />
                </div>
                <h4>{title}</h4>
                <p>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ WHY CHOOSE US ══ */}
      <section style={{ background: 'var(--parchment)', padding: '90px 0' }}>
        <div className="container">
          <div className="section-header centered">
            <div className="section-tag">Why Choose Us</div>
            <h2 className="section-title">The Dr. Spine &amp; Nerves <span>Difference</span></h2>
            <p className="section-desc">Ancient wisdom, modern evidence, and a relentless commitment to your recovery.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
            {whyUs.map(({ Icon, title, desc }) => (
              <div key={title} className="why-card">
                <div className="why-icon"><Icon size={22} color="var(--clay)" /></div>
                <div>
                  <h4>{title}</h4>
                  <p>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ DOCTOR PROFILE ══ */}
      <section style={{ background: 'var(--linen)', padding: '80px 0 90px' }}>
        <div className="container">
          <div className="doctor-profile-card">
            <div className="doctor-avatar">
              <MdOutlineHealthAndSafety size={80} color="var(--moss)" />
            </div>
            <div>
              <div className="section-tag" style={{ marginBottom: 14 }}>Meet Our Specialist</div>
              <h2 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '2.4rem', marginBottom: 8 }}>
                Dr. Mangesh Wagh
              </h2>
              <p style={{ color: 'var(--moss)', fontWeight: 600, fontSize: '1rem', marginBottom: 18 }}>
                Spine &amp; Joint Specialist · Non-Surgical Treatment Expert
              </p>
              <p style={{ lineHeight: 1.85, marginBottom: 28, maxWidth: 520 }}>
                With over 15 years of experience, Dr. Wagh has helped thousands of patients recover from
                chronic spine and joint pain — without surgery. His unique multi-modal approach combines
                Ayurvedic tradition, Sujok therapy, and advanced medical technology.
              </p>
              <div style={{ display: 'flex', gap: 36, flexWrap: 'wrap', marginBottom: 28 }}>
                {[['10,000+', 'Patients'], ['15+', 'Years Exp.'], ['98%', 'Success Rate']].map(([v, l]) => (
                  <div key={l}>
                    <div style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '2.2rem', fontWeight: 700, color: 'var(--moss)' }}>{v}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{l}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <Link to="/about" className="btn btn-primary">About Dr. Wagh</Link>
                <Link to="/contact" className="btn btn-ghost">Book Consultation</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ CTA BANNER ══ */}
      <section className="cta-banner">
        <div className="container" style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <div style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', color: 'rgba(240,216,152,0.70)', fontSize: '1rem', marginBottom: 12 }}>
            आरोग्यं परमं भाग्यं
          </div>
          <h2 style={{ color: '#fff', marginBottom: 14, fontFamily: '"Cormorant Garamond", serif', fontSize: 'clamp(1.8rem, 3vw, 2.8rem)' }}>
            Ready to Start Your Recovery?
          </h2>
          <p style={{ color: 'rgba(255,252,240,0.80)', marginBottom: 36, fontSize: '1.05rem', maxWidth: 540, margin: '0 auto 36px' }}>
            Don't let pain control your life. Our team is ready to help you heal — naturally.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
            <a href="tel:+919763331118" className="btn btn-gold btn-lg">
              <FiPhone size={16} /> Call Now
            </a>
            <Link to="/contact" className="btn btn-lg"
              style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.32)', backdropFilter: 'blur(8px)' }}>
              <FiCalendar size={16} /> Book Appointment
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}

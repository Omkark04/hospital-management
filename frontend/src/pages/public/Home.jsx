import { Link } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import ReviewModal from '../../components/common/ReviewModal';
import PublicNavbar from '../../components/layout/PublicNavbar';
import PublicFooter from '../../components/layout/PublicFooter';
import { getPublicProducts } from '../../api/products';
import {
  FiPhone, FiCalendar, FiClock, FiMapPin, FiCheckCircle, FiArrowRight,
  FiStar, FiShield, FiHeart, FiTarget, FiUsers, FiBookOpen, FiTag
} from 'react-icons/fi';
import {
  GiSpineArrow, GiHerbsBundle, GiHandBandage, GiMedicalThermometer,
  GiMuscleUp, GiMeditation
} from 'react-icons/gi';
import {
  MdOutlineSelfImprovement, MdOutlineHealthAndSafety, MdOutlineGroup
} from 'react-icons/md';
import { FaWhatsapp, FaLeaf, FaSpa, FaStar, FaRupeeSign } from 'react-icons/fa';
import { RiMentalHealthLine } from 'react-icons/ri';
import { BsLightningChargeFill } from 'react-icons/bs';
import { Canvas } from '@react-three/fiber';
import SpineModel from '../../components/3d/SpineModel';
import HeroImg from '../../assets/Hero.png';
import ImgSpine from '../../assets/Services/Spine Treatment.jpg';
import ImgAyurveda from '../../assets/Services/Ayurvedic Therapies.jpg';
import ImgSujok from '../../assets/Services/Sujok Therapies.jpg';
import ImgAdvanced from '../../assets/Services/Advanced Therapy.jpg';
import ImgCounseling from '../../assets/Services/Councelling.jpg';

// Why Choose Us Images (Temporary using Services folder)
import ImgWhy1 from '../../assets/Services/Spine Treatment.jpg';
import ImgWhy2 from '../../assets/Services/Ayurvedic Therapies.jpg';
import ImgWhy3 from '../../assets/Services/Advanced Therapy.jpg';
import ImgWhy4 from '../../assets/Services/Councelling.jpg';
import ImgCollage1 from '../../assets/Services/Spine Treatment.jpg';
import ImgCollage2 from '../../assets/Services/Ayurvedic Therapies.jpg';
import ImgCollage3 from '../../assets/Services/Sujok Therapies.jpg';
import DoctorImg from '../../assets/Doctor.png';

/* ── Data ── */
const stats = [
  { value: '5000+', label: 'Treated Patients' },
  { value: '98%', label: 'Success Rate' },
  { value: '10 years', label: 'Years Experience' },
  { value: '5', label: 'Therapy Types' },
];


const services = [
  {
    Icon: GiSpineArrow,
    title: 'Spine & Joint Treatment',
    desc: 'Non-surgical relief for Back Pain, Slip Disc, Sciatica, Cervical Spondylosis, Frozen Shoulder & Knee Pain.',
    link: '/services#spine',
    accent: '#0891b2',
    image: ImgSpine,
  },
  {
    Icon: FaLeaf,
    title: 'Ayurvedic Therapies',
    desc: 'Ancient healing through Kati Basti, Janu Basti, Snehan, Potli, Lep, and Steam Therapy.',
    link: '/services#ayurveda',
    accent: '#059669',
    image: ImgAyurveda,
  },
  {
    Icon: GiHandBandage,
    title: 'Sujok Therapy',
    desc: 'Drug-free, non-invasive pain management through precision Sujok acupressure on hand and foot points.',
    link: '/services#sujok',
    accent: '#0e7490',
    image: ImgSujok,
  },
  {
    Icon: BsLightningChargeFill,
    title: 'Advanced Therapy',
    desc: 'Electric Stimulation, Chiropractic Gun, Crazy Fit Machine & Full Body Massage Chair.',
    link: '/services#advanced',
    accent: '#7c3aed',
    image: ImgAdvanced,
  },
  {
    Icon: RiMentalHealthLine,
    title: 'Counseling & Lifestyle',
    desc: 'Posture correction, pain management counseling & personalised lifestyle advice for lasting recovery.',
    link: '/services#counseling',
    accent: '#10b981',
    image: ImgCounseling,
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
  { id: '01', title: 'Non-Surgical Focus', desc: 'We treat the root causes of spine and joint pain without surgery, invasive injections, or heavy medications.', image: ImgWhy1 },
  { id: '02', title: 'Ayurvedic Heritage', desc: 'Our protocols combine 5,000-year-old Ayurvedic wisdom with modern clinical evidence to ensure safe healing.', image: ImgWhy2 },
  { id: '03', title: 'Expert Guidance', desc: 'Dr. Mangesh Wagh brings over 10 years of dedicated experience focused entirely on non-surgical rehabilitation.', image: ImgWhy3 },
  { id: '04', title: 'Personalised Plans', desc: 'Every patient receives a customised multi-modal treatment program designed specifically for their unique condition.', image: ImgWhy4 },
];

const ayurvedaTherapies = [
  { icon: <FaSpa size={26} />, label: 'Kati Basti', desc: 'Warm medicated oil pool on the lower back' },
  { icon: <FaLeaf size={26} />, label: 'Janu Basti', desc: 'Nourishing knee therapy with herbal oils' },
  { icon: <MdOutlineSelfImprovement size={26} />, label: 'Snehan', desc: 'Full body Ayurvedic oil massage therapy' },
  { icon: <GiMedicalThermometer size={26} />, label: 'Steam Therapy', desc: 'Herbal steam to open channels and release toxins' },
];

const process = [
  { step: '01', Icon: FiPhone, title: 'Book Appointment', desc: 'Call or WhatsApp us. Same-day confirmation.' },
  { step: '02', Icon: FiCheckCircle, title: 'Assessment', desc: 'Detailed physical examination and condition review by Dr. Wagh.' },
  { step: '03', Icon: FiTarget, title: 'Personalised Plan', desc: 'A tailored multi-therapy program designed for your condition.' },
  { step: '04', Icon: FiHeart, title: 'Begin Healing', desc: 'Start your sessions monitored every step by our specialist team.' },
];

/* ── Component ── */
export default function Home() {
  const [activeWhy, setActiveWhy] = useState(0);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [sliderIndex, setSliderIndex] = useState(0);
  const [slidesToShow, setSlidesToShow] = useState(window.innerWidth < 768 ? 1 : window.innerWidth < 1024 ? 2 : 3);

  const testimonialStories = [
    {
      name: "Rahul Deshmukh", treatment: "Sciatica Treatment", rating: 5,
      quote: "After suffering from severe lower back pain for 3 years, I thought surgery was my only option. Dr. Wagh's non-surgical approach and Kati Basti therapy gave me my life back."
    },
    {
      name: "Priya Sharma", treatment: "Frozen Shoulder", rating: 5,
      quote: "The combination of Sujok therapy and modern stimulation worked wonders. I couldn't even lift my arm to comb my hair, and now I have full mobility."
    },
    {
      name: "Amit Patel", treatment: "Slip Disc", rating: 5,
      quote: "Dr. Wagh's treatment is truly effective. I was able to avoid surgery and return to my daily routine within weeks. Highly recommended!"
    },
    {
      name: "Sneha Kulkarni", treatment: "Knee Pain", rating: 5,
      quote: "The Janu Basti therapy was a miracle for my knee pain. The staff is very professional and caring."
    }
  ];

  useEffect(() => {
    const handleResize = () => {
      setSlidesToShow(window.innerWidth < 768 ? 1 : window.innerWidth < 1024 ? 2 : 3);
    };
    window.addEventListener('resize', handleResize);

    getPublicProducts({ limit: 4, category: 'Ayurvedic Products' })
      .then(({ data }) => setFeaturedProducts(data.results || data.slice(0, 4)))
      .catch(console.error);

    // Auto slider for testimonials
    const interval = setInterval(() => {
      setSliderIndex(prev => (prev + 1) % (testimonialStories.length - (slidesToShow - 1)));
    }, 5000);
    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', handleResize);
    };
  }, [testimonialStories.length, slidesToShow]);

  return (
    <div>
      <PublicNavbar />

      {/* ══ HERO ══ */}
      <section
        className="clinic-hero"
        style={{
          position: 'relative',
          backgroundImage: `url(${HeroImg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        {/* Dark overlay for readability */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.25) 60%, rgba(0,0,0,0.55) 100%)',
          zIndex: 0,
        }} />

        <div className="container" style={{ position: 'relative', zIndex: 1, width: '100%' }}>
          <div className="clinic-hero-content" style={{ alignItems: 'flex-start', marginRight: 'auto' }}>
            <div className="clinic-hero-ctas" style={{ justifyContent: 'flex-start' }}>
              <Link to="/contact" className="btn btn-primary btn-lg">
                <FiCalendar size={16} /> Book Appointment
              </Link>
              <Link to="/services" className="btn btn-outline btn-lg" style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.75)', background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)' }}>
                View All Services <FiArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ══ SERVICES MARQUEE ══ */}
      <div className="services-marquee-wrapper">
        <div className="services-marquee-track">
          {[...Array(2)].map((_, i) => (
            <React.Fragment key={i}>
              {services.map(s => (
                <div key={`${i}-${s.title}`} className="services-marquee-item">
                  <div className="marquee-dot" />
                  {s.title}
                </div>
              ))}
              {conditions.slice(0, 4).map(c => (
                <div key={`${i}-${c}`} className="services-marquee-item">
                  <div className="marquee-dot" />
                  {c}
                </div>
              ))}
            </React.Fragment>
          ))}
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
      <section style={{ background: '#f0f9ff', padding: '90px 0 100px' }}>
        <div className="container">
          <div className="section-header centered">
            <div className="section-tag">Our Core Specializations</div>
            <h2 className="section-title">Comprehensive <span>Treatment Programs</span></h2>
          </div>

          <div className="svc-img-grid">
            {services.map(({ Icon, title, desc, link, accent, image }, i) => {
              const isWide = i === 3;
              return (
                <Link
                  key={title}
                  to={link}
                  className={`svc-img-card${isWide ? ' svc-img-card--wide' : ''}`}
                >
                  {isWide ? (
                    <>
                      <div className="svc-img-top svc-img-top--wide">
                        <div className="svc-wide-tag" style={{ color: accent }}>Featured Therapy</div>
                        <h3 className="svc-img-title svc-img-title--lg">{title}</h3>
                        <p className="svc-img-desc">{desc}</p>
                        <span className="svc-img-cta" style={{ color: accent }}>
                          Explore Treatment <FiArrowRight size={13} />
                        </span>
                      </div>
                      <div className="svc-img-photo svc-img-photo--wide">
                        <img src={image} alt={title} />
                        <div className="svc-img-overlay" style={{ background: `${accent}99` }} />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="svc-img-photo">
                        <img src={image} alt={title} />
                        <div className="svc-img-overlay" style={{ background: `${accent}99` }} />
                      </div>
                      <div className="svc-img-top">
                        <h3 className="svc-img-title">{title}</h3>
                        <p className="svc-img-desc">{desc}</p>
                        <span className="svc-img-cta" style={{ color: accent }}>
                          Learn More <FiArrowRight size={12} />
                        </span>
                      </div>
                    </>
                  )}
                </Link>
              );
            })}
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
          <div className="responsive-grid-2" style={{ alignItems: 'center' }}>
            <div>
              <div className="section-tag" style={{ background: 'rgba(240,216,152,0.15)', color: 'var(--turmeric-pale)', borderColor: 'rgba(240,216,152,0.30)' }}>
                Conditions We Treat
              </div>
              <h2 style={{ color: '#fff', marginTop: 16, fontFamily: '"Cormorant Garamond", serif', lineHeight: 1.15, fontSize: 'clamp(2.5rem, 6vw, 3.8rem)' }}>
                Are You Suffering<br />
                <span style={{ color: 'var(--turmeric-pale)', fontStyle: 'italic' }}>From Any of These?</span>
              </h2>
              <p style={{ color: 'rgba(255,252,240,0.85)', marginTop: 16, lineHeight: 1.8, fontSize: '1.2rem' }}>
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

      {/* ══ DOCTOR PROFILE ══ */}
      <section style={{ background: 'var(--off-white)', padding: '90px 0' }}>
        <div className="container">
          <div className="doctor-profile-split">
            <div className="doctor-info">
              <div className="section-tag" style={{ marginBottom: 14 }}>Best Physician</div>
              <h2 style={{ fontSize: '2.8rem', color: 'var(--navy)', marginBottom: 12 }}>
                About Dr. Mangesh Wagh
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: 1.7, marginBottom: 32 }}>
                With over <span style={{ color: 'var(--primary)', fontWeight: 700 }}>10 years of experience</span> in clinical Ayurveda, Dr. Wagh has successfully treated thousands of patients suffering from chronic spinal and neuromuscular conditions. His approach combining Ayurvedic tradition, Sujok therapy, and advanced medical technology.
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
                <div style={{ fontFamily: '"Cormorant Garamond", serif', fontWeight: 700, fontSize: '2.2rem', color: 'var(--navy)', opacity: 0.9, transform: 'rotate(-2deg)', borderBottom: '2px solid var(--gold-muted)' }}>
                  Dr. Mangesh Wagh
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

      {/* ══ TREATMENT SCIENCE ══ */}
      <section style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #0e7490 55%, #0891b2 100%)',
        padding: '60px 0', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'radial-gradient(circle 1px at 20% 30%, rgba(6,182,212,0.25) 0%, transparent 1px), radial-gradient(circle 1px at 80% 70%, rgba(16,185,129,0.20) 0%, transparent 1px)',
        }} />
        <div className="container">
          <div className="responsive-grid-2-1-4" style={{ alignItems: 'start' }}>

            {/* ── Left: text content ── */}
            <div style={{ paddingTop: 24 }}>
              <div className="section-tag" style={{ background: 'rgba(6,182,212,0.15)', color: '#a5f3fc', borderColor: 'rgba(6,182,212,0.35)' }}>
                The Holistic Approach
              </div>
              <h2 style={{ marginTop: 16, fontSize: 'clamp(1.8rem, 3vw, 2.8rem)', color: '#fff', lineHeight: 1.2 }}>
                Thousands of Years of Healing<br />
                <span style={{ color: '#6ee7b7' }}>Refined for Modern Health</span>
              </h2>
              <div className="clinic-hero-sanskrit" style={{ marginTop: 16, marginBottom: 16, color: '#a5f3fc', opacity: 0.9 }}>
                स्वस्थस्य स्वास्थ्य रक्षणं — Protect the health of the healthy
              </div>
              <p style={{ lineHeight: 1.85, color: 'rgba(255,255,255,0.85)', marginBottom: 28, fontSize: '1.15rem' }}>
                Ayurveda — the "Science of Life" — forms the cornerstone of our treatment philosophy.
                Each therapy is rooted in these ancient principles, using natural oils, herbs, and healing
                techniques that restore balance to the body's Vata, Pitta, and Kapha doshas.
              </p>
              <div className="responsive-grid-2" style={{ marginBottom: 32 }}>
                {ayurvedaTherapies.map(t => (
                  <div key={t.label} style={{
                    padding: '16px',
                    background: 'rgba(255,255,255,0.07)',
                    border: '1px solid rgba(6,182,212,0.30)',
                    borderRadius: 12,
                    backdropFilter: 'blur(8px)',
                  }}>
                    <div style={{ color: '#67e8f9', marginBottom: 8 }}>{t.icon}</div>
                    <div style={{ fontWeight: 600, color: '#fff', marginBottom: 3, fontSize: '1rem' }}>{t.label}</div>
                    <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.58)' }}>{t.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Right: 3D spine model + CTA below ── */}
            <div className="hide-on-mobile" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28 }}>
              <div className="spine-canvas-container" style={{
                position: 'relative',
                height: 'var(--spine-height, 600px)',
                width: '100%',
                borderRadius: 24,
                overflow: 'hidden',
                background: 'radial-gradient(ellipse at 50% 55%, rgba(6,182,212,0.22) 0%, rgba(15,23,42,0.0) 70%)',
              }}>
                <style>{`
                  @media (max-width: 768px) {
                    .spine-canvas-container { --spine-height: 400px; }
                  }
                  @media (max-width: 480px) {
                    .spine-canvas-container { --spine-height: 300px; }
                  }
                `}</style>
                {/* Decorative rings */}
                <div style={{
                  position: 'absolute', top: '50%', left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: 420, height: 420, borderRadius: '50%',
                  border: '1px dashed rgba(6,182,212,0.35)', pointerEvents: 'none', zIndex: 0,
                }}>
                  <div style={{ position: 'absolute', inset: 28, borderRadius: '50%', border: '1px dashed rgba(6,182,212,0.25)' }} />
                  <div style={{ position: 'absolute', inset: 70, borderRadius: '50%', border: '1px solid rgba(16,185,129,0.20)' }} />
                </div>
                <Canvas
                  camera={{ position: [0, 0, 7], fov: 45 }}
                  style={{ position: 'absolute', inset: 0, zIndex: 1 }}
                  gl={{ preserveDrawingBuffer: true, alpha: true }}
                >
                  <React.Suspense fallback={null}>
                    <SpineModel />
                  </React.Suspense>
                </Canvas>
              </div>
              {/* CTA below spine model */}
              <Link to="/services#ayurveda" className="btn btn-lg" style={{
                background: 'linear-gradient(135deg, #059669, #10b981)',
                color: '#fff',
                boxShadow: '0 4px 16px rgba(16,185,129,0.35)',
                alignSelf: 'center',
              }}>
                Explore Treatments
              </Link>
            </div>

          </div>
        </div>
      </section>


      {/* ══ WHY CHOOSE US ══ */}
      <section style={{ background: '#f8fafc', padding: '90px 0' }}>
        <div className="container">
          <div className="section-header">
            <h2 className="section-title" style={{ fontSize: '2.8rem', color: '#0f172a' }}>Why Choose <span style={{ color: '#0e7490' }}>Ayurvedic Care</span></h2>
            <p className="section-desc" style={{ maxWidth: '600px', marginLeft: 0 }}>
              Discover the benefits of treating root causes through proven, holistic, and non-invasive methods.
            </p>
          </div>

          <div className="why-layout">

            {/* ── Left: Accordion ── */}
            <div className="why-accordion">
              {whyUs.map((item, index) => {
                const isActive = activeWhy === index;
                return (
                  <div
                    key={item.id}
                    className={`why-acc-item ${isActive ? 'active' : ''}`}
                    onClick={() => setActiveWhy(index)}
                  >
                    {isActive ? (
                      <div className="why-acc-content-active">
                        <div className="why-acc-text">
                          <h4 className="why-acc-title">{item.title}</h4>
                          <p className="why-acc-desc">{item.desc}</p>
                        </div>
                        <div className="why-acc-img">
                          <img src={item.image} alt={item.title} />
                        </div>
                      </div>
                    ) : (
                      <div className="why-acc-content-inactive">
                        <h4 className="why-acc-title-inactive">{item.title}</h4>
                        <span className="why-acc-number">{item.id}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* ── Right: Collage (Hidden on Mobile) ── */}
            <div className="why-collage hide-on-mobile">
              {/* Animated dotted circle in background */}
              <div className="why-collage-bg-circle" />

              <div className="why-collage-main">
                <img src={ImgCollage1} alt="Happy Patient" className="why-col-img-main" />

                {/* Floating 5000+ Patient Badge */}
                <div className="why-floating-badge">
                  <div className="why-badge-avatars">
                    <img src={ImgCollage1} alt="Patient" />
                    <img src={ImgWhy3} alt="Doctor" />
                    <img src={ImgCollage2} alt="Treatment" />
                  </div>
                  <div className="why-badge-text">
                    <span className="why-badge-num">5000+</span>
                    <span className="why-badge-label">Patients Recovered</span>
                  </div>
                </div>
              </div>

              <div className="why-collage-side">
                <img src={ImgCollage2} alt="Kati Basti" className="why-col-img-top" />
                <img src={ImgCollage3} alt="Clinic" className="why-col-img-bottom" />
              </div>
            </div>

          </div>
        </div>
      </section>


      {/* ══ FEATURED PRODUCTS ══ */}
      {featuredProducts.length > 0 && (
        <section style={{ background: 'var(--parchment)', padding: '90px 0' }}>
          <div className="container">
            <div className="section-header centered">
              <div className="section-tag">Clinical Wellness Store</div>
              <h2 className="section-title">Health <span>Products</span></h2>
              <p className="section-desc">Carefully selected Ayurvedic products for your recovery.</p>
            </div>

            <div className="product-grid mobile-2-col" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 30,
              marginBottom: 40
            }}>
              {featuredProducts.map(product => (
                <div key={product.id} className="product-card" style={{
                  background: '#fff', borderRadius: 20, overflow: 'hidden',
                  border: '1px solid var(--border-gold)', boxShadow: 'var(--shadow-sm)',
                  display: 'flex', flexDirection: 'column',
                  transition: 'all 0.3s ease'
                }}>
                  <div style={{ position: 'relative', paddingTop: '80%', background: 'var(--parchment)' }}>
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                        <FiTag size={40} opacity={0.2} />
                      </div>
                    )}
                  </div>
                  <div style={{ padding: 20 }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--moss)', fontWeight: 700, marginBottom: 5 }}>
                      {product.category_name || 'Medicine'}
                    </div>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: 10, fontFamily: '"Cormorant Garamond", serif' }}>{product.name}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 15 }}>
                      <div style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: 2 }}>
                        <FaRupeeSign size={14} />{product.final_price}
                      </div>
                      {product.final_price < product.price && (
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textDecoration: 'line-through', display: 'flex', alignItems: 'center', gap: 2 }}>
                          <FaRupeeSign size={11} />{product.price}
                        </div>
                      )}
                    </div>
                    <div className="product-actions" style={{ display: 'flex', gap: 10 }}>
                      <Link to={`/products?id=${product.id}`} className="btn btn-ghost btn-sm" style={{ flex: 1 }}>Details</Link>
                      <a
                        href={`https://wa.me/919923880526?text=I%20am%20interested%20in%20${encodeURIComponent(product.name)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-whatsapp btn-sm"
                        style={{ flex: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                      >
                        <FaWhatsapp /> Enquire
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ textAlign: 'center' }}>
              <Link to="/products" className="btn btn-ghost btn-lg" style={{ gap: 8 }}>
                View All Products <FiArrowRight />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ══ TESTIMONIALS PREVIEW ══ */}
      <section style={{ background: '#fff', padding: '90px 0' }}>
        <div className="container">
          <div className="section-header centered">
            <div className="section-tag">Patient Success</div>
            <h2 className="section-title">Trusted by <span>5000+ Patients</span></h2>
            <p className="section-desc" style={{ maxWidth: 600 }}>
              Real stories from people who regained their health without surgery.
            </p>
          </div>

          <div className="testimonials-slider-container">
            <div className="testimonials-slider-track" style={{
              transform: `translateX(-${sliderIndex * (100 / testimonialStories.length)}%)`,
              width: `${(testimonialStories.length / slidesToShow) * 100}%`,
              display: 'flex'
            }}>
              {testimonialStories.map((story, i) => (
                <div key={i} className="testimonial-card-slide" style={{ flex: `0 0 ${100 / testimonialStories.length}%`, padding: '0 15px' }}>
                  <div className="testimonial-card" style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#fff', padding: '30px', borderRadius: '20px', border: '1px solid var(--border-gold)' }}>
                    <div className="testimonial-stars" style={{ display: 'flex', gap: 2, color: '#FFB800', marginBottom: 15 }}>
                      {[...Array(story.rating)].map((_, idx) => (
                        <FaStar key={idx} size={14} />
                      ))}
                    </div>
                    <p className="testimonial-quote" style={{ fontSize: '1rem', fontStyle: 'italic', color: 'var(--text-muted)', marginBottom: 20, textAlign: 'center' }}>"{story.quote}"</p>
                    <div className="testimonial-author" style={{ marginTop: 'auto', textAlign: 'center' }}>
                      <div className="author-info">
                        <h4 style={{ color: 'var(--navy)', marginBottom: 2 }}>{story.name}</h4>
                        <span style={{ fontSize: '0.85rem', color: 'var(--moss)', fontWeight: 600 }}>{story.treatment}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ textAlign: 'center', display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-primary btn-lg" onClick={() => setIsReviewModalOpen(true)}>
              Give Review
            </button>
            <Link to="/testimonials" className="btn btn-outline btn-lg" style={{ borderColor: 'var(--border)', color: 'var(--navy)' }}>
              Read All Patient Stories <FiArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      <ReviewModal isOpen={isReviewModalOpen} onClose={() => setIsReviewModalOpen(false)} />


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

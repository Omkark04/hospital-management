import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import PublicNavbar from '../../components/layout/PublicNavbar';
import PublicFooter from '../../components/layout/PublicFooter';
import { FiCheckCircle, FiArrowRight, FiPhone, FiCalendar } from 'react-icons/fi';
import { FaLeaf, FaWhatsapp, FaSpa } from 'react-icons/fa';
import { GiHandBandage, GiSpineArrow } from 'react-icons/gi';
import { BsLightningChargeFill } from 'react-icons/bs';
import { RiMentalHealthLine } from 'react-icons/ri';

import imgSpine from '../../assets/Services/Spine Treatment.jpg';
import imgAyurveda from '../../assets/Services/Ayurvedic Therapies.jpg';
import imgSujok from '../../assets/Services/Sujok Therapies.jpg';
import imgAdvanced from '../../assets/Services/Advanced Therapy.jpg';
import imgCounseling from '../../assets/Services/Councelling.jpg';

const categories = [
  {
    id: 'spine',
    image: imgSpine,
    Icon: GiSpineArrow,
    title: 'Spine & Joint Treatments',
    tagline: 'Non-Surgical Relief for Chronic Pain',
    desc: 'We specialise in diagnosing and treating the root cause of spine and joint problems without surgery, injections, or heavy medications. Our approach targets the underlying condition so that recovery is lasting.',
    color: '#3d5a2a',
    bg: 'rgba(61,90,42,0.07)',
    treatments: [
      'Back Pain (Lower & Upper)',
      'Slip Disc (Disc Bulge / Herniation)',
      'Sciatica Pain',
      'Neck Pain (Cervical Spondylosis)',
      'Shoulder Pain (Frozen Shoulder)',
      'Knee Pain (Gap, Swelling, Stiffness)',
      'Ligament Injuries (ACL / PCL)',
      'Difficulty in Walking / Bending',
    ],
  },
  {
    id: 'ayurveda',
    image: imgAyurveda,
    Icon: FaLeaf,
    title: 'Ayurvedic Therapies',
    tagline: 'Ancient Healing, Modern Results',
    desc: 'We use time-tested Ayurvedic therapies that improve circulation, reduce inflammation, and rejuvenate deep tissues. These natural treatments complement our medical protocols for lasting healing.',
    color: '#5c7a42',
    bg: 'rgba(92,122,66,0.08)',
    treatments: [
      'Janu Basti — Knee Therapy',
      'Kati Basti — Back Therapy',
      'Snehan — Oil Massage Therapy',
      'Potli Therapy',
      'Lep Therapy',
      'Steam Therapy',
    ],
  },
  {
    id: 'sujok',
    image: imgSujok,
    Icon: GiHandBandage,
    title: 'Sujok Therapy',
    tagline: 'Non-Invasive, Drug-Free Pain Relief',
    desc: 'Sujok is a powerful Korean therapy system that uses specific points on the hands and feet to treat the entire body. It is completely drug-free, non-invasive, and effective for both acute and chronic conditions.',
    color: '#c89030',
    bg: 'rgba(200,144,48,0.08)',
    treatments: [
      'Pain Management through Sujok',
      'Spine & Joint Specific Sujok',
      'Non-Invasive Drug-Free Therapy',
    ],
  },
  {
    id: 'advanced',
    image: imgAdvanced,
    Icon: BsLightningChargeFill,
    title: 'Advanced Therapy Support',
    tagline: 'Cutting-Edge Equipment for Faster Recovery',
    desc: 'We use advanced medical equipment to accelerate recovery, reduce muscle tension, and improve joint mobility. These therapies are used in combination with our other treatments for comprehensive care.',
    color: '#b5622a',
    bg: 'rgba(181,98,42,0.08)',
    treatments: [
      'Electric Stimulation Therapy',
      'Chiropractic Gun Therapy',
      'Dual Head Hammer Massage',
      'Crazy Fit Machine Therapy',
      'Full Body Massage Chair Relaxation',
    ],
  },
  {
    id: 'counseling',
    image: imgCounseling,
    Icon: RiMentalHealthLine,
    title: 'Counseling & Lifestyle Guidance',
    tagline: 'Long-Term Pain Prevention',
    desc: 'True healing goes beyond physical treatment. We educate our patients about the lifestyle factors that contribute to their condition and guide them on how to maintain recovery for the long term.',
    color: '#3d5a2a',
    bg: 'rgba(61,90,42,0.07)',
    treatments: [
      'Pain Management Counseling',
      'Posture Correction Guidance',
      'Lifestyle Modification Advice',
    ],
  },
];

export default function Services() {
  useEffect(() => {
    if (window.location.hash) {
      setTimeout(() => {
        const el = document.querySelector(window.location.hash);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, []);

  return (
    <div style={{ background: 'var(--parchment)' }}>
      <PublicNavbar />

      {/* Hero / Banner */}
      <div style={{ paddingTop: 72 }}>
        <div className="page-banner">
          <div className="container" style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
            <div className="section-tag" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', borderColor: 'rgba(255,255,255,0.30)' }}>
              Our Specializations
            </div>
            <h1 style={{ color: '#fff', marginTop: 16, marginBottom: 12, fontFamily: '"Cormorant Garamond", serif' }}>
              Comprehensive Treatment Services
            </h1>
            <p style={{ color: 'rgba(255,252,240,0.85)', maxWidth: 600, margin: '0 auto 28px', fontSize: '1.05rem' }}>
              Five distinct areas of specialization working together to treat your condition naturally and effectively — without surgery.
            </p>
            <Link to="/book" className="btn btn-gold btn-lg">
              <FiCalendar size={16} /> Book a Consultation
            </Link>
          </div>
        </div>
      </div>

      {/* Sticky quick-nav tabs */}
      <div style={{ background: 'var(--linen)', borderBottom: '1px solid var(--border-gold)', position: 'sticky', top: 72, zIndex: 50 }}>
        <div className="container">
          <div className="service-tabs">
            {categories.map(c => {
              const Icon = c.Icon;
              return (
                <a key={c.id} href={`#${c.id}`} className="service-tab">
                  <Icon size={15} color={c.color} />
                  {c.title.split(' ')[0]} {c.title.split(' ')[1] || ''}
                </a>
              );
            })}
          </div>
        </div>
      </div>

      {/* Service sections */}
      {categories.map((cat, i) => {
        const CatIcon = cat.Icon;
        return (
          <section key={cat.id} id={cat.id}
            className="section"
            style={{ background: i % 2 === 0 ? 'var(--linen)' : 'var(--parchment)', scrollMarginTop: 130 }}>
            <div className="container">
              <div className="responsive-grid-2" style={{ alignItems: 'center' }}>
                {/* Info block */}
                <div style={{ order: i % 2 === 0 ? 0 : 1 }}>
                  <div className="section-tag" style={{ background: cat.bg, color: cat.color, borderColor: `${cat.color}30` }}>
                    <CatIcon size={13} /> {cat.title}
                  </div>
                  <h2 style={{ marginTop: 18, marginBottom: 10 }}>{cat.tagline}</h2>
                  <p className="section-desc" style={{ lineHeight: 1.85, marginBottom: 28 }}>{cat.desc}</p>

                  <div className="responsive-grid-2" style={{ gap: 10, marginBottom: 28 }}>
                    {cat.treatments.map(t => (
                      <div key={t} style={{
                        display: 'flex', gap: 8, padding: '10px 12px',
                        background: cat.bg, borderRadius: 10, fontSize: '0.875rem',
                        border: `1px solid ${cat.color}18`,
                      }}>
                        <FiCheckCircle size={15} color={cat.color} style={{ flexShrink: 0, marginTop: 1 }} />
                        <span style={{ fontWeight: 500, color: 'var(--bark)' }}>{t}</span>
                      </div>
                    ))}
                  </div>

                  <Link to="/book" className="btn btn-primary" style={{ gap: 8 }}>
                    Book This Treatment <FiArrowRight size={14} />
                  </Link>
                </div>

                {/* Visual block */}
                <div style={{ order: i % 2 === 0 ? 1 : 0, height: '100%', minHeight: 380 }}>
                  <div style={{
                    position: 'relative',
                    borderRadius: 24,
                    overflow: 'hidden',
                    border: `1px solid ${cat.color}30`,
                    height: '100%',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.06)'
                  }}>
                    <img src={cat.image} alt={cat.title} style={{
                      width: '100%', height: '100%', objectFit: 'cover',
                      position: 'absolute', top: 0, left: 0
                    }} />
                    
                    {/* Overlay gradient */}
                    <div style={{
                      position: 'absolute', inset: 0,
                      background: `linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.1) 100%)`,
                      display: 'flex', flexDirection: 'column',
                      justifyContent: 'flex-end', padding: 40
                    }}>
                      <div style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 6, opacity: 0.9 }}>
                        {cat.treatments.length} Specialised Treatments
                      </div>
                      <h3 style={{ color: '#fff', marginBottom: 12 }}>{cat.title}</h3>
                      <div style={{ display: 'inline-block', padding: '8px 18px', background: cat.color, borderRadius: 999, color: '#fff', fontWeight: 600, fontSize: '0.8rem', alignSelf: 'flex-start' }}>
                        {cat.tagline}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        );
      })}

      {/* Final CTA */}
      <section className="cta-banner">
        <div className="container" style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <h2 style={{ color: '#fff', marginBottom: 12, fontFamily: '"Cormorant Garamond", serif' }}>
            Not Sure Which Treatment You Need?
          </h2>
          <p style={{ color: 'rgba(255,252,240,0.85)', marginBottom: 28 }}>
            Dr. Wagh will assess your condition and recommend the right combination of therapies.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
            <a href="tel:+919763331118" className="btn btn-gold btn-lg">
              <FiPhone size={16} /> Call Now
            </a>
            <a href="https://wa.me/919763331118" target="_blank" rel="noreferrer"
              className="btn btn-lg"
              style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.32)', backdropFilter: 'blur(8px)', gap: 8 }}>
              <FaWhatsapp size={18} /> WhatsApp
            </a>
            <Link to="/book" className="btn btn-lg"
              style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.32)', backdropFilter: 'blur(8px)', gap: 8 }}>
              <FiCalendar size={15} /> Book Consultation
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}

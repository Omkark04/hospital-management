import React from 'react';
import PublicNavbar from '../../components/layout/PublicNavbar';
import PublicFooter from '../../components/layout/PublicFooter';

// Use available images for now
import Img1 from '../../assets/Services/Ayurvedic Therapies.jpg';
import Img2 from '../../assets/Services/Spine Treatment.jpg';
import Img3 from '../../assets/Services/Advanced Therapy.jpg';
import Img4 from '../../assets/Services/Sujok Therapies.jpg';
import Img5 from '../../assets/Services/Councelling.jpg';

const galleryImages = [
  { id: 1, src: Img1, alt: 'Ayurvedic Therapy Session', span: 'col-span-2 row-span-2' },
  { id: 2, src: Img2, alt: 'Spine Treatment', span: 'col-span-1 row-span-1' },
  { id: 3, src: Img3, alt: 'Advanced Therapy Equipment', span: 'col-span-1 row-span-1' },
  { id: 4, src: Img4, alt: 'Sujok Therapy Consultation', span: 'col-span-1 row-span-2' },
  { id: 5, src: Img5, alt: 'Patient Counseling', span: 'col-span-1 row-span-1' },
];

export default function Gallery() {
  return (
    <div className="public-layout">
      <PublicNavbar />
      
      <div style={{ background: 'var(--off-white)', paddingTop: 140, paddingBottom: 100 }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <div className="section-tag">Our Clinic</div>
            <h1 style={{ color: 'var(--navy)', marginBottom: 16 }}>Healing Environment</h1>
            <p style={{ color: 'var(--text-secondary)', maxWidth: 600, margin: '0 auto', fontSize: '1.1rem' }}>
              Take a look inside our modern facility designed to provide a calming, 
              safe, and professional space for your recovery journey.
            </p>
          </div>

          <div className="gallery-grid">
            {galleryImages.map((img) => (
              <div key={img.id} className={`gallery-item ${img.span}`}>
                <img src={img.src} alt={img.alt} loading="lazy" />
                <div className="gallery-overlay">
                  <span>{img.alt}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <PublicFooter />
    </div>
  );
}

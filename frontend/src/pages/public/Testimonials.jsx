import React, { useState, useEffect } from 'react';
import { FaStar } from 'react-icons/fa';
import PublicNavbar from '../../components/layout/PublicNavbar';
import PublicFooter from '../../components/layout/PublicFooter';
import ReviewModal from '../../components/common/ReviewModal';
import api from '../../api/axios';

const patientStories = [
  {
    id: 1,
    name: "Rahul Deshmukh",
    treatment: "Sciatica Treatment",
    quote: "After suffering from severe lower back pain for 3 years, I thought surgery was my only option. Dr. Wagh's non-surgical approach and Kati Basti therapy gave me my life back. Within 4 weeks, the pain was completely gone.",
    rating: 5,
    date: "March 2026"
  },
  {
    id: 2,
    name: "Priya Sharma",
    treatment: "Frozen Shoulder",
    quote: "The combination of Sujok therapy and modern stimulation worked wonders. I couldn't even lift my arm to comb my hair, and now I have full mobility. The clinic environment is incredibly healing.",
    rating: 5,
    date: "February 2026"
  },
  {
    id: 3,
    name: "Anil Patil",
    treatment: "Knee Joint Pain",
    quote: "Ten years of experience really shows. They didn't just treat the pain, they explained the root cause and helped me with lifestyle changes. Highly recommend for anyone looking to avoid joint replacement.",
    rating: 5,
    date: "January 2026"
  },
  {
    id: 4,
    name: "Sunita Joshi",
    treatment: "Cervical Spondylosis",
    quote: "The Ayurvedic therapies here are authentic and very effective. The neck stiffness and vertigo I experienced daily have completely disappeared. A truly holistic healing center.",
    rating: 5,
    date: "December 2025"
  }
];

export default function Testimonials() {
  const [reviews, setReviews] = useState(patientStories);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    api.get('/patients/public/reviews/')
      .then(res => {
        if (res.data && res.data.length > 0) {
          // Replace or append hardcoded with fetched ones
          setReviews(res.data);
        }
      })
      .catch(err => console.error('Failed to load reviews:', err));
  }, []);

  return (
    <div className="public-layout">
      <PublicNavbar />
      
      <div style={{ background: 'var(--off-white)', paddingTop: 140, paddingBottom: 100, minHeight: '100vh' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <div className="section-tag">Patient Success</div>
            <h1 style={{ color: 'var(--navy)', marginBottom: 16 }}>Real Stories of Recovery</h1>
            <p style={{ color: 'var(--text-secondary)', maxWidth: 600, margin: '0 auto', fontSize: '1.1rem', marginBottom: 30 }}>
              We have helped over 5,000 patients regain their mobility and live pain-free lives. 
              Read about their experiences with our non-surgical treatments.
            </p>
            <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
              Give Review
            </button>
          </div>

          <div className="testimonials-grid">
            {reviews.map((story) => (
              <div key={story.id} className="testimonial-card">
                <div className="testimonial-stars" style={{ display: 'flex', gap: 2, color: '#FFB800', marginBottom: 15 }}>
                  {[...Array(story.rating || 5)].map((_, i) => (
                    <FaStar key={i} size={14} />
                  ))}
                </div>
                <p className="testimonial-quote">"{story.quote}"</p>
                <div className="testimonial-author">
                  <div className="author-info">
                    <h4>{story.patient_name || story.name}</h4>
                    <span>{story.treatment}</span>
                  </div>
                  <div className="author-date">{story.date || new Date(story.created_at).toLocaleDateString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <ReviewModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <PublicFooter />
    </div>
  );
}

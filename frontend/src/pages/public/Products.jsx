import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PublicNavbar from '../../components/layout/PublicNavbar';
import { getPublicProducts, submitEnquiry } from '../../api/products';

const categories = [
  { value: '', label: 'All Products' },
  { value: 'medicine', label: '💊 Medicine' },
  { value: 'ayurvedic', label: '🌿 Ayurvedic' },
  { value: 'supplement', label: '🧪 Supplement' },
  { value: 'equipment', label: '🩺 Equipment' },
  { value: 'other', label: '📦 Other' },
];

export default function Products() {
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [enquiryModal, setEnquiryModal] = useState(null);
  const [enquiryForm, setEnquiryForm] = useState({ enquirer_name: '', enquirer_phone: '', message: '' });
  const [enquirySent, setEnquirySent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setLoading(true);
    getPublicProducts({ category: category || undefined, search: search || undefined })
      .then(({ data }) => setProducts(data.results || data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [category, search]);

  const handleEnquiry = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await submitEnquiry({ ...enquiryForm, product: enquiryModal.id });
      setEnquirySent(true);
    } catch (err) {
      alert('Failed to submit enquiry. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PublicNavbar />
      <div style={{ paddingTop: 72 }}>
        {/* Header */}
        <section className="section" style={{ paddingBottom: 40 }}>
          <div className="container">
            <div className="section-header centered">
              <div className="section-tag">Products</div>
              <h2 className="section-title">Medicines & <span>Healthcare Products</span></h2>
              <p className="section-desc">Browse our range of medicines, Ayurvedic products, and health supplements. Click WhatsApp to enquire.</p>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', marginTop: 32 }}>
              <input
                className="input"
                placeholder="🔍 Search products..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ maxWidth: 300 }}
              />
              <select className="input" value={category} onChange={e => setCategory(e.target.value)} style={{ maxWidth: 200 }}>
                {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          </div>
        </section>

        {/* Product Grid */}
        <section style={{ paddingBottom: 80 }}>
          <div className="container">
            {loading ? (
              <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
            ) : products.length === 0 ? (
              <div className="empty-state"><div className="icon">📦</div><p>No products found.</p></div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 24 }}>
                {products.map(p => (
                  <div key={p.id} className="card" style={{ overflow: 'hidden' }}>
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name} style={{ width: '100%', height: 180, objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: 140, background: 'var(--primary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 3 + 'rem' }}>📦</div>
                    )}
                    <div className="card-body">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                        <h3 style={{ fontSize: '1rem', lineHeight: 1.3 }}>{p.name}</h3>
                        <span className="badge badge-secondary" style={{ marginLeft: 8, flexShrink: 0 }}>{p.category}</span>
                      </div>
                      {p.description && <p style={{ fontSize: '0.85rem', marginBottom: 12, WebkitLineClamp: 2, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.description}</p>}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                        <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '1.3rem', color: 'var(--primary)' }}>₹{p.price}</span>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <a href={p.whatsapp_link} target="_blank" rel="noopener noreferrer" className="btn btn-success btn-sm">
                            💬 WhatsApp
                          </a>
                          <button className="btn btn-ghost btn-sm" onClick={() => { setEnquiryModal(p); setEnquirySent(false); setEnquiryForm({ enquirer_name: '', enquirer_phone: '', message: '' }); }}>
                            Enquire
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Enquiry Modal */}
      {enquiryModal && (
        <div className="modal-overlay" onClick={() => setEnquiryModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Enquire: {enquiryModal.name}</h3>
              <button className="modal-close" onClick={() => setEnquiryModal(null)}>×</button>
            </div>
            <div className="modal-body">
              {enquirySent ? (
                <div className="alert alert-success">✅ Enquiry submitted! Our team will contact you shortly.</div>
              ) : (
                <form onSubmit={handleEnquiry} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div className="form-group">
                    <label className="form-label">Your Name *</label>
                    <input className="input" required value={enquiryForm.enquirer_name} onChange={e => setEnquiryForm(p => ({ ...p, enquirer_name: e.target.value }))} placeholder="Full name" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone Number *</label>
                    <input className="input" required value={enquiryForm.enquirer_phone} onChange={e => setEnquiryForm(p => ({ ...p, enquirer_phone: e.target.value }))} placeholder="+91 XXXXX XXXXX" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Message</label>
                    <textarea className="input" value={enquiryForm.message} onChange={e => setEnquiryForm(p => ({ ...p, message: e.target.value }))} placeholder="Any specific questions?" rows={3} />
                  </div>
                  <div className="modal-footer" style={{ padding: 0, border: 'none' }}>
                    <button type="button" className="btn btn-ghost" onClick={() => setEnquiryModal(null)}>Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Sending...' : 'Send Enquiry'}</button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

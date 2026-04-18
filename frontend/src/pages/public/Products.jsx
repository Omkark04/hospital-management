import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PublicNavbar from '../../components/layout/PublicNavbar';
import PublicFooter from '../../components/layout/PublicFooter';
import { getPublicProducts, submitEnquiry } from '../../api/products';
import { FiPackage, FiSearch, FiCheckCircle } from 'react-icons/fi';
import { FaLeaf, FaWhatsapp } from 'react-icons/fa';
import { GiPill, GiHealthCapsule, GiStethoscope } from 'react-icons/gi';

const categories = [
  { value: '', label: 'All Products', Icon: FiPackage },
  { value: 'medicine', label: 'Medicine', Icon: GiPill },
  { value: 'ayurvedic', label: 'Ayurvedic', Icon: FaLeaf },
  { value: 'supplement', label: 'Supplement', Icon: GiHealthCapsule },
  { value: 'equipment', label: 'Equipment', Icon: GiStethoscope },
  { value: 'other', label: 'Other', Icon: FiPackage },
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
    <div style={{ background: 'var(--parchment)' }}>
      <PublicNavbar />
      <div style={{ paddingTop: 72, minHeight: 'calc(100vh - 120px)' }}>
        {/* Header */}
        <section className="section" style={{ paddingBottom: 40 }}>
          <div className="container">
            <div className="section-header centered">
              <div className="section-tag">Products</div>
              <h2 className="section-title">Medicines &amp; <span>Healthcare Products</span></h2>
              <p className="section-desc">Browse our range of medicines, Ayurvedic products, and health supplements. Click WhatsApp to enquire.</p>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', marginTop: 32 }}>
              <div style={{ position: 'relative', maxWidth: 300, width: '100%' }}>
                <FiSearch size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input
                  className="input"
                  placeholder="Search products..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ paddingLeft: 40, width: '100%', background: 'var(--linen)', border: '1px solid var(--border-gold)' }}
                />
              </div>
              <select className="input" value={category} onChange={e => setCategory(e.target.value)} style={{ maxWidth: 200, width: '100%', background: 'var(--linen)', border: '1px solid var(--border-gold)' }}>
                {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          </div>
        </section>

        {/* Product Grid */}
        <section style={{ paddingBottom: 80 }}>
          <div className="container">
            {loading ? (
              <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner" style={{ margin: '0 auto', borderColor: 'var(--moss) transparent transparent transparent' }} /></div>
            ) : products.length === 0 ? (
              <div className="empty-state" style={{ background: 'var(--linen)', border: '1px solid var(--border-gold)' }}>
                <div className="icon" style={{ background: 'transparent' }}><FiPackage size={40} color="var(--clay)" /></div>
                <p style={{ color: 'var(--bark)' }}>No products found.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 24 }}>
                {products.map(p => {
                  const CategoryIcon = categories.find(c => c.value === p.category)?.Icon || FiPackage;
                  return (
                    <div key={p.id} className="card" style={{ overflow: 'hidden', background: 'var(--linen)', border: '1px solid var(--border-gold)', boxShadow: 'var(--shadow-sm)' }}>
                      {p.image_url ? (
                        <img src={p.image_url} alt={p.name} style={{ width: '100%', height: 180, objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: 140, background: 'var(--parchment)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid var(--border-gold)' }}>
                          <FiPackage size={48} color="rgba(200,144,48,0.25)" />
                        </div>
                      )}
                      <div className="card-body">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                          <h3 style={{ fontSize: '1rem', lineHeight: 1.3, color: 'var(--bark)', fontFamily: '"Cormorant Garamond", serif' }}>{p.name}</h3>
                          <span className="badge" style={{ background: 'var(--secondary-bg)', color: 'var(--bark)', border: '1px solid var(--border-gold)', marginLeft: 8, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <CategoryIcon size={10} color="var(--clay)" /> {p.category}
                          </span>
                        </div>
                        {p.description && <p style={{ fontSize: '0.85rem', marginBottom: 12, color: 'var(--bark-mid)', WebkitLineClamp: 2, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.description}</p>}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                          <span style={{ fontFamily: '"Cormorant Garamond", serif', fontWeight: 700, fontSize: '1.3rem', color: 'var(--moss)' }}>₹{p.price}</span>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <a href={p.whatsapp_link} target="_blank" rel="noopener noreferrer" className="btn btn-sm" style={{ background: '#25D366', color: '#fff', border: 'none', gap: 6 }}>
                              <FaWhatsapp size={14} /> WhatsApp
                            </a>
                            <button className="btn btn-primary btn-sm" onClick={() => { setEnquiryModal(p); setEnquirySent(false); setEnquiryForm({ enquirer_name: '', enquirer_phone: '', message: '' }); }}>
                              Enquire
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Enquiry Modal */}
      {enquiryModal && (
        <div className="modal-overlay" onClick={() => setEnquiryModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ background: 'var(--linen)', border: '1px solid var(--border-gold)' }}>
            <div className="modal-header" style={{ borderBottom: '1px solid var(--border-gold)' }}>
              <h3 style={{ fontFamily: '"Cormorant Garamond", serif', color: 'var(--bark)' }}>Enquire: {enquiryModal.name}</h3>
              <button className="modal-close" onClick={() => setEnquiryModal(null)}>×</button>
            </div>
            <div className="modal-body">
              {enquirySent ? (
                <div className="alert alert-success" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FiCheckCircle size={16} /> Enquiry submitted! Our team will contact you shortly.
                </div>
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
                  <div className="modal-footer" style={{ padding: 0, border: 'none', marginTop: 8 }}>
                    <button type="button" className="btn btn-ghost" onClick={() => setEnquiryModal(null)}>Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Sending...' : 'Send Enquiry'}</button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
      <PublicFooter />
    </div>
  );
}

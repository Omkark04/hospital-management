import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import PublicNavbar from '../../components/layout/PublicNavbar';
import PublicFooter from '../../components/layout/PublicFooter';
import { getPublicProduct } from '../../api/products';
import { FiArrowLeft, FiTag, FiCheckCircle, FiShield, FiTruck } from 'react-icons/fi';
import { FaWhatsapp, FaRupeeSign } from 'react-icons/fa';

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getPublicProduct(id)
      .then(({ data }) => setProduct(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div style={{ background: 'var(--parchment)', minHeight: '100vh' }}>
      <PublicNavbar />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div className="spinner" />
      </div>
    </div>
  );

  if (!product) return (
    <div style={{ background: 'var(--parchment)', minHeight: '100vh' }}>
      <PublicNavbar />
      <div style={{ textAlign: 'center', paddingTop: 150 }}>
        <h2>Product not found</h2>
        <Link to="/products" className="btn btn-primary" style={{ marginTop: 20 }}>Back to Store</Link>
      </div>
      <PublicFooter />
    </div>
  );

  const hasDiscount = product.final_price < product.price;
  const discountPerc = hasDiscount ? Math.round((1 - product.final_price / product.price) * 100) : 0;

  return (
    <div style={{ background: 'var(--parchment)' }}>
      <PublicNavbar />
      <div style={{ paddingTop: 120, paddingBottom: 80 }}>
        <div className="container">
          <Link to="/products" style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', marginBottom: 30, fontSize: '0.9rem' }}>
            <FiArrowLeft /> Back to Health Store
          </Link>

          <div style={{ 
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', 
            gap: 60, background: '#fff', padding: 40, borderRadius: 30, 
            boxShadow: 'var(--shadow-gold)', border: '1px solid var(--border-gold)' 
          }}>
            {/* Image Gallery */}
            <div className="product-image-section">
              <div style={{ 
                width: '100%', aspectRatio: '1', borderRadius: 20, overflow: 'hidden', 
                background: 'var(--linen)', border: '1px solid var(--border-gold)',
                position: 'relative'
              }}>
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                    <FiTag size={100} opacity={0.1} />
                  </div>
                )}
                {hasDiscount && (
                  <div style={{ 
                    position: 'absolute', top: 20, right: 20, background: 'var(--primary)', color: '#fff',
                    padding: '8px 16px', borderRadius: 12, fontWeight: 700, fontSize: '1rem', boxShadow: 'var(--shadow-sm)'
                  }}>
                    {discountPerc}% OFF
                  </div>
                )}
              </div>
            </div>

            {/* Info Section */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                <span className="badge badge-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                  {product.category_name || 'Health Product'}
                </span>
                {product.stock_quantity > 0 ? (
                  <span style={{ color: 'var(--moss)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <FiCheckCircle size={14} /> In Stock
                  </span>
                ) : (
                  <span style={{ color: 'var(--clay)', fontSize: '0.85rem' }}>Out of Stock</span>
                )}
              </div>

              <h1 style={{ fontSize: '3rem', color: 'var(--navy)', marginBottom: 4, fontFamily: '"Cormorant Garamond", serif', lineHeight: 1.1 }}>
                {product.name}
              </h1>
              {product.display_quantity && (
                <div style={{ color: 'var(--text-muted)', fontSize: '1.2rem', marginBottom: 12, fontWeight: 500 }}>
                  Quantity: {product.display_quantity}
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: 15, marginBottom: 24 }}>
                <div style={{ fontSize: '2.4rem', fontWeight: 700, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <FaRupeeSign size={24} />{product.final_price}
                </div>
                {hasDiscount && (
                  <div style={{ fontSize: '1.4rem', color: 'var(--text-muted)', textDecoration: 'line-through', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <FaRupeeSign size={16} />{product.price}
                  </div>
                )}
              </div>

              <p style={{ fontSize: '1.1rem', lineHeight: 1.8, color: 'var(--text-secondary)', marginBottom: 24 }}>
                {product.description || 'Our carefully selected health products are designed to support your journey to wellness. Quality tested and expert approved.'}
              </p>

              {product.features && product.features.length > 0 && (
                <div style={{ marginBottom: 32 }}>
                  <h4 style={{ fontSize: '0.9rem', color: 'var(--navy)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Key Features</h4>
                  <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 24px' }}>
                    {product.features.map((feat, i) => (
                      <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        <FiCheckCircle size={14} color="var(--primary)" /> {feat}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Trust Indicators */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 40 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', padding: 16, background: 'var(--parchment)', borderRadius: 12 }}>
                  <FiShield color="var(--primary)" size={20} />
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>100% Genuine</span>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', padding: 16, background: 'var(--parchment)', borderRadius: 12 }}>
                  <FiTruck color="var(--primary)" size={20} />
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Fast Shipping</span>
                </div>
              </div>

              <div style={{ marginTop: 'auto' }}>
                <a 
                  href={product.whatsapp_link}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-primary btn-lg"
                  style={{ 
                    width: '100%', justifyContent: 'center', background: '#25D366', 
                    borderColor: '#25D366', padding: '18px', fontSize: '1.1rem', gap: 12
                  }}
                >
                  <FaWhatsapp size={22} /> Enquire via WhatsApp
                </a>
                <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 12 }}>
                  Instant response from our clinical staff on availability and usage.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <PublicFooter />
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PublicNavbar from '../../components/layout/PublicNavbar';
import PublicFooter from '../../components/layout/PublicFooter';
import { getPublicProducts, getCategories } from '../../api/products';
import { FiSearch, FiFilter, FiShoppingCart, FiTag, FiInfo, FiArrowRight } from 'react-icons/fi';
import { FaWhatsapp, FaBox, FaRupeeSign } from 'react-icons/fa';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ category: 'Ayurvedic Products', search: '' });

  useEffect(() => {
    setLoading(true);
    Promise.all([getPublicProducts(filters), getCategories()])
      .then(([prodRes, catRes]) => {
        setProducts(prodRes.data.results || prodRes.data);
        setCategories(catRes.data.results || catRes.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filters]);

  const handleSearch = (e) => {
    e.preventDefault();
    // Filters update will trigger useEffect
  };

  return (
    <div style={{ background: 'var(--parchment)' }}>
      <PublicNavbar />
      <div style={{ paddingTop: 72 }}>
        {/* Banner */}
        <div className="page-banner" style={{ background: 'linear-gradient(135deg, #1e3a1a 0%, #2d5a27 100%)' }}>
          <div className="container" style={{ textAlign: 'center' }}>
            <div className="section-tag" style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.2)' }}>Health Store</div>
            <h1 style={{ color: '#fff', marginTop: 16, fontFamily: '"Cormorant Garamond", serif' }}>Essential Health Products</h1>
            <p style={{ color: 'rgba(255,255,255,0.8)', maxWidth: 500, margin: '16px auto 0' }}>
              Carefully curated Ayurvedic products for your recovery.
            </p>
          </div>
        </div>

        <section className="section">
          <div className="container">
            {/* Toolbar */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginBottom: 40, gap: 20, flexWrap: 'wrap',
              background: '#fff', padding: 20, borderRadius: 16, boxShadow: 'var(--shadow-sm)',
              border: '1px solid var(--border-gold)'
            }}>
              <form onSubmit={handleSearch} style={{ display: 'flex', gap: 10, flex: 1 }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <FiSearch style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    className="input"
                    placeholder="Search products..."
                    style={{ paddingLeft: 40, background: 'var(--parchment)' }}
                    value={filters.search}
                    onChange={e => setFilters(p => ({ ...p, search: e.target.value }))}
                  />
                </div>
              </form>

              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <FiFilter color="var(--moss)" />
                <select
                  className="input"
                  style={{ width: 200, background: 'var(--parchment)' }}
                  value={filters.category}
                  onChange={e => setFilters(p => ({ ...p, category: e.target.value }))}
                >
                  <option value="">All Categories</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '100px 0' }}>
                <div className="spinner" style={{ margin: '0 auto' }} />
                <p style={{ marginTop: 20, color: 'var(--text-muted)' }}>Loading products...</p>
              </div>
            ) : products.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '100px 0', background: '#fff', borderRadius: 20, border: '1px solid var(--border-gold)' }}>
                <div style={{ fontSize: '4rem', marginBottom: 20, color: 'var(--primary)' }}><FaBox /></div>
                <h3>No products found</h3>
                <p>Try adjusting your search or category filter.</p>
                <button className="btn btn-ghost" onClick={() => setFilters({ category: '', search: '' })} style={{ marginTop: 20 }}>Clear All Filters</button>
              </div>
            ) : (
              <div className="product-grid mobile-2-col" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 30 }}>
                {products.map(p => (
                   <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
      <PublicFooter />
    </div>
  );
}

function ProductCard({ product }) {
  const hasDiscount = product.discount_percentage > 0 || (product.category && product.category.discount_percentage > 0);

  return (
    <div className="product-card" style={{
      background: '#fff', borderRadius: 20, overflow: 'hidden',
      border: '1px solid var(--border-gold)', boxShadow: 'var(--shadow-sm)',
      display: 'flex', flexDirection: 'column', height: '100%',
      transition: 'all 0.3s ease'
    }}>
      <div style={{ position: 'relative', paddingTop: '100%', background: 'var(--parchment)' }}>
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

        {hasDiscount && (
          <div style={{
            position: 'absolute', top: 12, left: 12,
            background: 'var(--clay)', color: '#fff',
            padding: '4px 10px', borderRadius: 8, fontSize: '0.75rem', fontWeight: 700
          }}>
            OFFER
          </div>
        )}

        <div style={{
          position: 'absolute', top: 12, right: 12,
          background: 'rgba(255,255,255,0.9)',
          padding: '4px 8px', borderRadius: 8, fontSize: '0.7rem',
          fontWeight: 600, color: 'var(--moss)', border: '1px solid var(--border-gold)'
        }}>
          {product.category_name || 'Health'}
        </div>
      </div>

      <div style={{ padding: 20, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <h3 style={{ fontSize: '1.2rem', marginBottom: 8, fontFamily: '"Cormorant Garamond", serif', color: 'var(--navy)' }}>{product.name}</h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 16, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {product.description || 'Quality healthcare product for your well-being.'}
        </p>

        <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 2 }}>
            <FaRupeeSign size={14} />{product.final_price}
          </div>
          {product.final_price < product.price && (
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textDecoration: 'line-through', display: 'flex', alignItems: 'center', gap: 2 }}>
              <FaRupeeSign size={11} />{product.price}
            </div>
          )}
        </div>

        <div className="product-actions" style={{ display: 'flex', gap: 10 }}>
          <Link to={`/products/${product.id}`} className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }}>
            <FiInfo size={16} /> Details
          </Link>
          <a
            href={product.whatsapp_link}
            target="_blank"
            rel="noreferrer"
            className="btn btn-whatsapp"
            style={{ flex: 1.2, justifyContent: 'center' }}
          >
            <FaWhatsapp size={16} /> Enquire
          </a>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect, useCallback } from 'react';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../../../api/products';

const CATEGORIES = ['medicine', 'ayurvedic', 'supplement', 'equipment', 'other'];

export default function ProductManage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ name: '', category: 'medicine', description: '', price: '', stock_quantity: '', is_listed: true });
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(() => {
    setLoading(true);
    getProducts()
      .then(({ data }) => setProducts(data.results || data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openModal = (item = null) => {
    setEditItem(item);
    setForm(item ? { name: item.name, category: item.category, description: item.description || '', price: item.price, stock_quantity: item.stock_quantity || '', is_listed: item.is_listed } : { name: '', category: 'medicine', description: '', price: '', stock_quantity: '', is_listed: true });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editItem) await updateProduct(editItem.id, form);
      else await createProduct(form);
      setShowModal(false);
      fetchData();
    } catch (err) { alert(JSON.stringify(err.response?.data) || 'Failed.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return;
    try { await deleteProduct(id); fetchData(); } catch { alert('Failed to delete.'); }
  };

  const handleToggleListed = async (item) => {
    try { await updateProduct(item.id, { is_listed: !item.is_listed }); fetchData(); } catch { alert('Failed.'); }
  };

  return (
    <div>
      <div className="page-header">
        <h2>Products</h2>
        <p>Manage products listed on the public website.</p>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => openModal()}>+ Add Product</button>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
        ) : products.length === 0 ? (
          <div className="empty-state"><div className="icon">📦</div><p>No products yet.</p></div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Listed</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{p.name}</div>
                      {p.description && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.description}</div>}
                    </td>
                    <td><span className="badge badge-secondary">{p.category}</span></td>
                    <td style={{ fontWeight: 700, color: 'var(--primary)' }}>₹{p.price}</td>
                    <td style={{ fontSize: '0.875rem' }}>{p.stock_quantity ?? '—'}</td>
                    <td>
                      <button
                        className={`badge badge-${p.is_listed ? 'success' : 'danger'}`}
                        style={{ cursor: 'pointer', border: 'none', padding: '4px 12px' }}
                        onClick={() => handleToggleListed(p)}
                        title="Toggle listing"
                      >
                        {p.is_listed ? '✓ Listed' : '✗ Hidden'}
                      </button>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => openModal(p)}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p.id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editItem ? 'Edit Product' : 'Add Product'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Product Name *</label>
                  <input className="input" required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div className="form-group">
                    <label className="form-label">Category *</label>
                    <select className="input" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Price (₹) *</label>
                    <input type="number" className="input" required min={0} value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Stock Quantity</label>
                    <input type="number" className="input" min={0} value={form.stock_quantity} onChange={e => setForm(p => ({ ...p, stock_quantity: e.target.value }))} />
                  </div>
                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label className="form-label">Public Listing</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: 44 }}>
                      <input type="checkbox" id="is_listed" checked={form.is_listed} onChange={e => setForm(p => ({ ...p, is_listed: e.target.checked }))} style={{ width: 18, height: 18, accentColor: 'var(--primary)', cursor: 'pointer' }} />
                      <label htmlFor="is_listed" style={{ fontSize: '0.9rem', cursor: 'pointer' }}>Show on website</label>
                    </div>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="input" rows={3} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
                </div>
                <div className="modal-footer" style={{ padding: 0, border: 'none' }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Product'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

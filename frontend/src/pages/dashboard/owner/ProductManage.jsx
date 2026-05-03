import { useState, useEffect, useCallback } from 'react';
import { 
  getProducts, createProduct, updateProduct, deleteProduct,
  getCategories, createCategory 
} from '../../../api/products';
import { FiPlus, FiTag, FiImage, FiPercent, FiTrash2, FiEdit2 } from 'react-icons/fi';
import ImageUpload from '../../../components/dashboard/ImageUpload';

export default function ProductManage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  
  // Forms
  const [productForm, setProductForm] = useState({ 
    name: '', category: '', description: '', price: '', 
    discount_percentage: 0, stock_quantity: 0, is_active: true, 
    for_public: true, for_patients: false, image_url: '',
    display_quantity: '', features: [] 
  });
  const [categoryForm, setCategoryForm] = useState({ name: '', discount_percentage: 0 });
  
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([getProducts(), getCategories()]);
      setProducts(prodRes.data.results || prodRes.data);
      setCategories(catRes.data.results || catRes.data);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openProductModal = (item = null) => {
    setEditItem(item);
    if (item) {
      setProductForm({
        name: item.name,
        category: item.category || '',
        description: item.description || '',
        price: item.price,
        discount_percentage: item.discount_percentage || 0,
        stock_quantity: item.stock_quantity || 0,
        is_active: item.is_active,
        for_public: item.for_public,
        for_patients: item.for_patients,
        image_url: item.image_url || '',
        display_quantity: item.display_quantity || '',
        features: item.features || []
      });
    } else {
      setProductForm({ 
        name: '', category: categories[0]?.id || '', description: '', 
        price: '', discount_percentage: 0, stock_quantity: 0, 
        is_active: true, for_public: true, for_patients: false, image_url: '',
        display_quantity: '', features: [] 
      });
    }
    setShowProductModal(true);
  };

  const handleProductSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...productForm };
      if (!payload.category) delete payload.category; // Don't send empty string for ForeignKey
      
      if (editItem) await updateProduct(editItem.id, payload);
      else await createProduct(payload);
      setShowProductModal(false);
      fetchData();
    } catch (err) {
      console.error('Product Save Error:', err.response?.data);
      alert('Error saving product: ' + JSON.stringify(err.response?.data));
    } finally {
      setSaving(false);
    }
  };

  const handleCategorySave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createCategory(categoryForm);
      setShowCategoryModal(false);
      setCategoryForm({ name: '', discount_percentage: 0 });
      fetchData();
    } catch (err) {
      alert('Failed to add category. Maybe it already exists?');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await deleteProduct(id);
      fetchData();
    } catch {
      alert('Failed to delete.');
    }
  };

  return (
    <div className="dashboard-content">
      <div className="page-header">
        <div>
          <h2>Health Store Management</h2>
          <p>Manage products, categories, and discounts for the public website.</p>
        </div>
        <div className="page-actions" style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost" onClick={() => setShowCategoryModal(true)}>
            <FiTag /> Add Category
          </button>
          <button className="btn btn-primary" onClick={() => openProductModal()}>
            <FiPlus /> Add Product
          </button>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
        ) : products.length === 0 ? (
          <div className="empty-state">
            <div className="icon">📦</div>
            <p>No products listed yet.</p>
            <button className="btn btn-primary" onClick={() => openProductModal()} style={{ marginTop: 15 }}>Add Your First Product</button>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Discount</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {p.image_url ? (
                          <img src={p.image_url} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--linen)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <FiImage size={16} color="var(--text-muted)" />
                          </div>
                        )}
                        <div>
                          <div style={{ fontWeight: 600 }}>{p.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: #{p.id}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className="badge badge-secondary">{p.category_name || 'Uncategorized'}</span></td>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--primary)' }}>₹{p.final_price}</div>
                      {p.final_price < p.price && <div style={{ fontSize: '0.75rem', textDecoration: 'line-through', color: 'var(--text-muted)' }}>₹{p.price}</div>}
                    </td>
                    <td>
                      {p.discount_percentage > 0 ? (
                        <span style={{ color: 'var(--clay)', fontWeight: 600 }}>{p.discount_percentage}% OFF</span>
                      ) : '—'}
                    </td>
                    <td>{p.stock_quantity}</td>
                    <td>
                      <span className={`badge badge-${p.is_active ? 'success' : 'danger'}`}>
                        {p.is_active ? 'Active' : 'Hidden'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => openProductModal(p)}><FiEdit2 /></button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p.id)}><FiTrash2 /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Product Modal */}
      {showProductModal && (
        <div className="modal-overlay" onClick={() => setShowProductModal(false)}>
          <div className="modal" style={{ maxWidth: 600 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editItem ? 'Edit Product' : 'Add New Product'}</h3>
              <button className="modal-close" onClick={() => setShowProductModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleProductSave} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div className="form-group">
                      <label className="form-label">Product Name *</label>
                      <input className="input" required value={productForm.name} onChange={e => setProductForm(p => ({ ...p, name: e.target.value }))} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Category *</label>
                      <div style={{ display: 'flex', gap: 10 }}>
                        <select className="input" required value={productForm.category} onChange={e => setProductForm(p => ({ ...p, category: e.target.value }))}>
                          <option value="">Select Category</option>
                          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                  <ImageUpload 
                    currentImage={productForm.image_url} 
                    onUploadSuccess={(url) => setProductForm(p => ({ ...p, image_url: url }))} 
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                  <div className="form-group">
                    <label className="form-label">Base Price (₹) *</label>
                    <input type="number" className="input" required value={productForm.price} onChange={e => setProductForm(p => ({ ...p, price: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Discount (%)</label>
                    <input type="number" className="input" min={0} max={100} value={productForm.discount_percentage} onChange={e => setProductForm(p => ({ ...p, discount_percentage: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Stock</label>
                    <input type="number" className="input" value={productForm.stock_quantity} onChange={e => setProductForm(p => ({ ...p, stock_quantity: e.target.value }))} />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="input" rows={3} value={productForm.description} onChange={e => setProductForm(p => ({ ...p, description: e.target.value }))} />
                </div>

                <div className="form-group">
                  <label className="form-label">Display Quantity (e.g. 500ml, 100 Tablets)</label>
                  <input className="input" value={productForm.display_quantity} onChange={e => setProductForm(p => ({ ...p, display_quantity: e.target.value }))} placeholder="Optional" />
                </div>

                <div className="form-group">
                  <label className="form-label">Key Features</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {productForm.features.map((feat, i) => (
                      <div key={i} style={{ display: 'flex', gap: 8 }}>
                        <input 
                          className="input" 
                          value={feat} 
                          placeholder={`Feature ${i+1}`}
                          onChange={e => {
                            const newFeats = [...productForm.features];
                            newFeats[i] = e.target.value;
                            setProductForm(p => ({ ...p, features: newFeats }));
                          }} 
                        />
                        <button 
                          type="button" 
                          className="btn btn-danger btn-sm" 
                          onClick={() => setProductForm(p => ({ ...p, features: p.features.filter((_, idx) => idx !== i) }))}
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    ))}
                    <button 
                      type="button" 
                      className="btn btn-ghost btn-sm" 
                      onClick={() => setProductForm(p => ({ ...p, features: [...p.features, ''] }))}
                      style={{ alignSelf: 'flex-start' }}
                    >
                      <FiPlus /> Add Feature
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input type="checkbox" id="is_active" checked={productForm.is_active} onChange={e => setProductForm(p => ({ ...p, is_active: e.target.checked }))} style={{ width: 18, height: 18 }} />
                    <label htmlFor="is_active" style={{ fontSize: '0.9rem' }}>Active</label>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input type="checkbox" id="for_public" checked={productForm.for_public} onChange={e => setProductForm(p => ({ ...p, for_public: e.target.checked }))} style={{ width: 18, height: 18 }} />
                    <label htmlFor="for_public" style={{ fontSize: '0.9rem' }}>For Public (Store)</label>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input type="checkbox" id="for_patients" checked={productForm.for_patients} onChange={e => setProductForm(p => ({ ...p, for_patients: e.target.checked }))} style={{ width: 18, height: 18 }} />
                    <label htmlFor="for_patients" style={{ fontSize: '0.9rem' }}>For Patients (Prescription)</label>
                  </div>
                </div>

                <div className="modal-footer" style={{ padding: 0, border: 'none', marginTop: 10 }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setShowProductModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Product'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="modal-overlay" onClick={() => setShowCategoryModal(false)}>
          <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New Category</h3>
              <button className="modal-close" onClick={() => setShowCategoryModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleCategorySave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Category Name *</label>
                  <input className="input" required value={categoryForm.name} onChange={e => setCategoryForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Pain Relief" />
                </div>
                <div className="form-group">
                  <label className="form-label">Category Discount (%)</label>
                  <input type="number" className="input" min={0} max={100} value={categoryForm.discount_percentage} onChange={e => setCategoryForm(p => ({ ...p, discount_percentage: e.target.value }))} />
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4 }}>Applies to all products in this category unless a higher product discount is set.</p>
                </div>
                <div className="modal-footer" style={{ padding: 0, border: 'none', marginTop: 10 }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setShowCategoryModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>Add Category</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

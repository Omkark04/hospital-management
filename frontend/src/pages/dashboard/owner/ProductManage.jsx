import { useState, useEffect, useCallback } from 'react';
import { 
  getProducts, createProduct, updateProduct, deleteProduct,
  getCategories, createCategory 
} from '../../../api/products';
import { 
  getMedicines, createMedicine, updateMedicine, deleteMedicine 
} from '../../../api/medicines';
import { FiPlus, FiTag, FiImage, FiTrash2, FiEdit2 } from 'react-icons/fi';
import { FaBoxOpen, FaPrescriptionBottleAlt } from 'react-icons/fa';
import ImageUpload from '../../../components/dashboard/ImageUpload';
import { useAuth } from '../../../context/AuthContext';

const medicineCategories = [
  { id: 'tablet', name: 'Tablet' },
  { id: 'capsule', name: 'Capsule' },
  { id: 'syrup', name: 'Syrup' },
  { id: 'injection', name: 'Injection' },
  { id: 'cream', name: 'Cream' },
  { id: 'drops', name: 'Drops' },
  { id: 'ayurvedic', name: 'Ayurvedic' },
  { id: 'other', name: 'Other' },
];

export default function ProductManage() {
  const { user } = useAuth();
  const isOwner = user?.role === 'owner';
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
    display_quantity: '', features: [], low_stock_threshold: 10, unit: ''
  });
  const [categoryForm, setCategoryForm] = useState({ name: '', discount_percentage: 0 });
  
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (isOwner) {
        const [prodRes, catRes] = await Promise.all([getProducts(), getCategories()]);
        setProducts(prodRes.data.results || prodRes.data);
        setCategories(catRes.data.results || catRes.data);
      } else {
        const res = await getMedicines();
        setProducts(res.data.results || res.data);
        setCategories(medicineCategories);
      }
    } catch (err) {

    } finally {
      setLoading(false);
    }
  }, [isOwner]);

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
        is_active: item.is_active ?? true,
        for_public: item.for_public ?? true,
        for_patients: item.for_patients ?? false,
        image_url: item.image_url || '',
        display_quantity: item.display_quantity || '',
        features: item.features || [],
        low_stock_threshold: item.low_stock_threshold || 10,
        unit: item.unit || ''
      });
    } else {
      setProductForm({ 
        name: '', category: isOwner ? (categories[0]?.id || '') : 'tablet', description: '', 
        price: '', discount_percentage: 0, stock_quantity: 0, 
        is_active: true, for_public: true, for_patients: false, image_url: '',
        display_quantity: '', features: [], low_stock_threshold: 10, unit: ''
      });
    }
    setShowProductModal(true);
  };

  const handleProductSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...productForm };
      
      if (isOwner) {
        if (!payload.category) delete payload.category; // Don't send empty string for ForeignKey
        delete payload.low_stock_threshold;
        delete payload.unit;
        
        if (editItem) await updateProduct(editItem.id, payload);
        else await createProduct(payload);
      } else {
        if (!payload.category) payload.category = 'other';
        delete payload.discount_percentage;
        delete payload.for_public;
        delete payload.for_patients;
        delete payload.image_url;
        delete payload.display_quantity;
        delete payload.features;
        
        if (editItem) await updateMedicine(editItem.id, payload);
        else await createMedicine(payload);
      }
      
      setShowProductModal(false);
      fetchData();
    } catch (err) {

      alert('Error saving item: ' + JSON.stringify(err.response?.data));
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
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      if (isOwner) await deleteProduct(id);
      else await deleteMedicine(id);
      fetchData();
    } catch {
      alert('Failed to delete.');
    }
  };

  return (
    <div className="dashboard-content">
      <div className="page-header">
        <div>
          <h2>{isOwner ? 'Store Products Management' : 'Prescription Medicines Management'}</h2>
          <p>{isOwner ? 'Manage products, categories, and discounts for the public website.' : 'Manage clinical prescription medicines and stock for your branch.'}</p>
        </div>
        <div className="page-actions" style={{ display: 'flex', gap: 10 }}>
          {isOwner && (
            <button className="btn btn-ghost" onClick={() => setShowCategoryModal(true)}>
              <FiTag /> Add Category
            </button>
          )}
          <button className="btn btn-primary" onClick={() => openProductModal()}>
            <FiPlus /> {isOwner ? 'Add Store Product' : 'Add Medicine'}
          </button>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
        ) : products.length === 0 ? (
          <div className="empty-state">
            <div className="icon">{isOwner ? <FaBoxOpen /> : <FaPrescriptionBottleAlt />}</div>
            <p>No items listed yet.</p>
            <button className="btn btn-primary" onClick={() => openProductModal()} style={{ marginTop: 15 }}>
              Add Your First {isOwner ? 'Product' : 'Medicine'}
            </button>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>{isOwner ? 'Product' : 'Medicine'}</th>
                  <th>Category</th>
                  <th>Price</th>
                  {isOwner && <th>Discount</th>}
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
                        {isOwner ? (
                          p.image_url ? (
                            <img src={p.image_url} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--linen)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <FiImage size={16} color="var(--text-muted)" />
                            </div>
                          )
                        ) : (
                          <div style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                            <FaPrescriptionBottleAlt size={18} />
                          </div>
                        )}
                        <div>
                          <div style={{ fontWeight: 600 }}>{p.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {isOwner ? `ID: #${p.id}` : (p.unit ? `Unit: ${p.unit}` : `ID: #${p.id}`)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-secondary">
                        {isOwner 
                          ? (p.category_name || 'Uncategorized') 
                          : (medicineCategories.find(c => c.id === p.category)?.name || p.category?.toUpperCase() || 'Other')}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--primary)' }}>₹{p.final_price ?? p.price}</div>
                      {p.final_price && p.final_price < p.price && <div style={{ fontSize: '0.75rem', textDecoration: 'line-through', color: 'var(--text-muted)' }}>₹{p.price}</div>}
                    </td>
                    {isOwner && (
                      <td>
                        {p.discount_percentage > 0 ? (
                          <span style={{ color: 'var(--clay)', fontWeight: 600 }}>{p.discount_percentage}% OFF</span>
                        ) : '—'}
                      </td>
                    )}
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

      {/* Product / Medicine Modal */}
      {showProductModal && (
        <div className="modal-overlay" onClick={() => setShowProductModal(false)}>
          <div className="modal" style={{ maxWidth: 600 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editItem ? (isOwner ? 'Edit Store Product' : 'Edit Medicine') : (isOwner ? 'Add Store Product' : 'Add Medicine')}</h3>
              <button className="modal-close" onClick={() => setShowProductModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleProductSave} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ display: 'grid', gridTemplateColumns: isOwner ? '1.2fr 1fr' : '1fr', gap: 20 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div className="form-group">
                      <label className="form-label">{isOwner ? 'Product Name *' : 'Medicine Name *'}</label>
                      <input className="input" required value={productForm.name} onChange={e => setProductForm(p => ({ ...p, name: e.target.value }))} placeholder={isOwner ? '' : 'e.g. Paracetamol 500mg'} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Category *</label>
                      <select className="input" required value={productForm.category} onChange={e => setProductForm(p => ({ ...p, category: e.target.value }))}>
                        <option value="">Select Category</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                  </div>
                  {isOwner && (
                    <ImageUpload 
                      currentImage={productForm.image_url} 
                      onUploadSuccess={(url) => setProductForm(p => ({ ...p, image_url: url }))} 
                    />
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: isOwner ? '1fr 1fr 1fr' : '1fr 1fr 1fr', gap: 14 }}>
                  <div className="form-group">
                    <label className="form-label">Price (₹) *</label>
                    <input type="number" step="0.01" className="input" required value={productForm.price} onChange={e => setProductForm(p => ({ ...p, price: e.target.value }))} />
                  </div>
                  {isOwner ? (
                    <div className="form-group">
                      <label className="form-label">Discount (%)</label>
                      <input type="number" className="input" min={0} max={100} value={productForm.discount_percentage} onChange={e => setProductForm(p => ({ ...p, discount_percentage: e.target.value }))} />
                    </div>
                  ) : (
                    <div className="form-group">
                      <label className="form-label">Unit</label>
                      <input className="input" value={productForm.unit} onChange={e => setProductForm(p => ({ ...p, unit: e.target.value }))} placeholder="e.g. strip, ml, tab" />
                    </div>
                  )}
                  <div className="form-group">
                    <label className="form-label">Initial Stock</label>
                    <input type="number" className="input" value={productForm.stock_quantity} onChange={e => setProductForm(p => ({ ...p, stock_quantity: e.target.value }))} />
                  </div>
                </div>

                {!isOwner && (
                  <div className="form-group">
                    <label className="form-label">Low Stock Alert Threshold</label>
                    <input type="number" className="input" value={productForm.low_stock_threshold} onChange={e => setProductForm(p => ({ ...p, low_stock_threshold: e.target.value }))} />
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="input" rows={3} value={productForm.description} onChange={e => setProductForm(p => ({ ...p, description: e.target.value }))} />
                </div>

                {isOwner && (
                  <>
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
                  </>
                )}

                <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input type="checkbox" id="is_active" checked={productForm.is_active} onChange={e => setProductForm(p => ({ ...p, is_active: e.target.checked }))} style={{ width: 18, height: 18 }} />
                    <label htmlFor="is_active" style={{ fontSize: '0.9rem' }}>Active</label>
                  </div>
                  {isOwner && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input type="checkbox" id="for_public" checked={productForm.for_public} onChange={e => setProductForm(p => ({ ...p, for_public: e.target.checked }))} style={{ width: 18, height: 18 }} />
                      <label htmlFor="for_public" style={{ fontSize: '0.9rem' }}>For Public (Store)</label>
                    </div>
                  )}
                </div>

                <div className="modal-footer" style={{ padding: 0, border: 'none', marginTop: 10 }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setShowProductModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : `Save ${isOwner ? 'Product' : 'Medicine'}`}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Category Modal (Owner Only) */}
      {showCategoryModal && isOwner && (
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

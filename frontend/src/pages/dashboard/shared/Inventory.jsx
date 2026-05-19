import React, { useState, useEffect, useCallback } from 'react';
import api from '../../../api/axios';
import { useAuth } from '../../../context/AuthContext';
import LowStockBanner from '../../../components/common/LowStockBanner';
import { FaPlus, FaMinus, FaEdit, FaHistory, FaFilter } from 'react-icons/fa';
import { getBranches } from '../../../api/branches';

export default function Inventory() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(user?.role === 'owner' ? 'products' : 'medicines');
  const [items, setItems] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    if (user && user.role !== 'owner') {
      setActiveTab('medicines');
    }
  }, [user]);
  
  // Modal states
  const [movementType, setMovementType] = useState('in'); // in, out, adjustment
  const [quantity, setQuantity] = useState('');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const endpoint = activeTab === 'products' ? '/products/' : '/medicines/';
      const params = {};
      if (selectedBranch) {
        params.branch = selectedBranch;
      }
      const res = await api.get(endpoint, { params });
      setItems(res.data.results || res.data);
    } catch (err) {
      console.error('Failed to fetch items', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, selectedBranch]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  useEffect(() => {
    if (user?.role === 'owner') {
      getBranches().then(res => {
        setBranches(res.data.results || res.data);
      }).catch(err => console.error('Failed to fetch branches', err));
    }
  }, [user]);

  const handleStockUpdate = async (e) => {
    e.preventDefault();
    try {
      const endpoint = activeTab === 'products' ? '/products/stock-movement/' : '/medicines/stock-movement/';
      const payload = {
        quantity: parseInt(quantity),
        movement_type: movementType,
        reference,
        notes
      };
      
      if (activeTab === 'products') payload.product_id = selectedItem.id;
      else payload.medicine_id = selectedItem.id;

      await api.post(endpoint, payload);
      setShowModal(false);
      setQuantity('');
      setReference('');
      setNotes('');
      fetchItems();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update stock');
    }
  };

  return (
    <div className="dashboard-content">
      <h2>Inventory Management</h2>
      <LowStockBanner type={activeTab === 'products' ? 'product' : 'medicine'} />

      {/* Mobile-friendly Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
        {user?.role === 'owner' && (
          <button 
            className={`btn ${activeTab === 'products' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('products')}
            style={{ flex: 1 }}
          >
            Store Products
          </button>
        )}
        <button 
          className={`btn ${activeTab === 'medicines' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('medicines')}
          style={{ flex: 1 }}
        >
          Prescription Medicines
        </button>
      </div>

      {/* Branch Filter for Owner (Prescription Medicines only) */}
      {user?.role === 'owner' && activeTab === 'medicines' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', background: 'var(--bg-card)', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <FaFilter style={{ color: 'var(--primary)' }} />
          <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Filter Branch:</span>
          <select 
            className="input" 
            style={{ flex: 1, padding: '6px 10px', height: 'auto' }}
            value={selectedBranch} 
            onChange={(e) => setSelectedBranch(e.target.value)}
          >
            <option value="">All Branches</option>
            {branches.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
      )}

      {loading ? (
        <p>Loading...</p>
      ) : items.length === 0 ? (
        <div className="empty-state" style={{ padding: '40px', textAlign: 'center', background: '#fff', borderRadius: '8px', border: '1px solid #eee' }}>
          <p style={{ color: '#888', margin: 0 }}>No items found for the selected view.</p>
        </div>
      ) : (
        <div className="grid-list" style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
          {user?.role === 'owner' && activeTab === 'medicines' ? (
            (() => {
              const grouped = items.reduce((acc, item) => {
                const name = item.name || 'Unnamed Medicine';
                if (!acc[name]) {
                  acc[name] = {
                    name,
                    category: item.category || 'other',
                    branches: []
                  };
                }
                acc[name].branches.push(item);
                return acc;
              }, {});

              return Object.values(grouped).map(group => {
                // Build a unified list of all network branches to display
                const allBranchesToDisplay = [...branches];
                group.branches.forEach(b => {
                  const exists = allBranchesToDisplay.find(br => br.name === b.branch_name || br.id === b.branch);
                  if (!exists) {
                    allBranchesToDisplay.push({
                      id: b.branch || `custom-${b.id}`,
                      name: b.branch_name || 'Main Branch'
                    });
                  }
                });

                return (
                  <div key={group.name} className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <div className="card-header" style={{ background: 'var(--parchment-deep)', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--bark)' }}>{group.name}</h3>
                      <span className="badge badge-secondary" style={{ textTransform: 'capitalize' }}>{group.category}</span>
                    </div>
                    <div className="card-body" style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Branch-wise Stock Directory
                      </div>
                      {allBranchesToDisplay.map(branch => {
                        const found = group.branches.find(b => b.branch_name === branch.name || b.branch === branch.id);
                        const stockQty = found ? found.stock_quantity : 0;
                        const threshold = found ? found.low_stock_threshold : 10;
                        const isOptimal = stockQty > threshold;
                        
                        return (
                          <div key={branch.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--bg-base)', borderRadius: 'var(--radius-sm)', borderLeft: isOptimal ? '3px solid var(--success)' : (stockQty > 0 ? '3px solid var(--warning)' : '3px solid var(--danger)') }}>
                            <div>
                              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--bark)' }}>{branch.name}</div>
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>Threshold: {threshold}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: '1.15rem', fontWeight: 700, fontFamily: 'var(--font-display)', color: stockQty === 0 ? 'var(--danger)' : 'var(--bark)', lineHeight: 1 }}>
                                {stockQty}
                              </div>
                              <div style={{ fontSize: '0.65rem', color: isOptimal ? 'var(--success)' : (stockQty > 0 ? 'var(--warning)' : 'var(--danger)'), fontWeight: 600, marginTop: 4 }}>
                                {stockQty === 0 ? 'Out of Stock' : (isOptimal ? 'Optimal' : 'Low Stock')}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              });
            })()
          ) : (
            items.map(item => (
              <div key={item.id} className="card" style={{
                borderLeft: item.is_low_stock ? '4px solid var(--danger)' : '4px solid var(--success)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                overflow: 'hidden'
              }}>
                <div className="card-body" style={{ padding: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', gap: '8px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--bark)', wordBreak: 'break-word' }}>{item.name}</h3>
                    <span className="badge badge-secondary">
                      {item.branch_name ? item.branch_name : (item.for_public ? 'Public Store' : 'Main Branch')}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Stock:</span>
                    <strong style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: item.is_low_stock ? 'var(--danger)' : 'var(--bark)' }}>
                      {item.stock_quantity}
                    </strong>
                  </div>
                  <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.78rem' }}>Alert Threshold: {item.low_stock_threshold}</p>
                </div>
                
                <div style={{ padding: '12px 18px', background: 'var(--parchment-deep)', borderTop: '1px solid var(--border-card)', display: 'flex', gap: '8px' }}>
                  <button className="btn btn-primary btn-sm" onClick={() => {
                    setSelectedItem(item);
                    setMovementType('in');
                    setShowModal(true);
                  }} style={{ flex: 1, justifyContent: 'center' }}>
                    <FaPlus /> Stock In
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={() => {
                    setSelectedItem(item);
                    setMovementType('out');
                    setShowModal(true);
                  }} style={{ flex: 1, justifyContent: 'center' }}>
                    <FaMinus /> Stock Out
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Stock Update Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 style={{ margin: 0, color: 'var(--bark)', fontSize: '1.25rem' }}>Update Stock</h3>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>{selectedItem?.name}</p>
              </div>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            
            <form onSubmit={handleStockUpdate}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Action Type</label>
                  <select className="input" value={movementType} onChange={e => setMovementType(e.target.value)}>
                    <option value="in">Add Stock (In)</option>
                    <option value="out">Remove Stock (Out)</option>
                    <option value="adjustment">Set Exact Stock (Adjustment)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">{movementType === 'adjustment' ? 'New Exact Quantity *' : 'Quantity *'}</label>
                  <input 
                    type="number" 
                    className="input" 
                    min="1" 
                    required 
                    value={quantity} 
                    onChange={e => setQuantity(e.target.value)} 
                    placeholder="e.g., 50"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Reference / Source (Optional)</label>
                  <input 
                    type="text" 
                    className="input" 
                    value={reference} 
                    onChange={e => setReference(e.target.value)} 
                    placeholder="e.g., Invoice #1234, Shipment"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Notes (Optional)</label>
                  <textarea 
                    className="input" 
                    value={notes} 
                    onChange={e => setNotes(e.target.value)} 
                    rows="2"
                    placeholder="Add brief stock movement context..."
                    style={{ minHeight: 70 }}
                  ></textarea>
                </div>
              </div>

              <div className="modal-footer" style={{ background: 'var(--parchment-deep)', borderBottomLeftRadius: 'var(--radius-xl)', borderBottomRightRadius: 'var(--radius-xl)' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Confirm Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

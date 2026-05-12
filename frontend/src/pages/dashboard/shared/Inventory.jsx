import React, { useState, useEffect } from 'react';
import api from '../../../api/axios';
import { useAuth } from '../../../context/AuthContext';
import LowStockBanner from '../../../components/common/LowStockBanner';
import { FaPlus, FaMinus, FaEdit, FaHistory } from 'react-icons/fa';

export default function Inventory() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(user.role === 'owner' ? 'products' : 'medicines');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  
  // Modal states
  const [movementType, setMovementType] = useState('in'); // in, out, adjustment
  const [quantity, setQuantity] = useState('');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');

  const fetchItems = async () => {
    setLoading(true);
    try {
      const endpoint = activeTab === 'products' ? '/products/' : '/medicines/';
      const res = await api.get(endpoint);
      setItems(res.data.results || res.data);
    } catch (err) {
      console.error('Failed to fetch items', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [activeTab]);

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
      {user.role === 'owner' && (
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button 
            className={`btn ${activeTab === 'products' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('products')}
            style={{ flex: 1 }}
          >
            Public Products
          </button>
          <button 
            className={`btn ${activeTab === 'medicines' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('medicines')}
            style={{ flex: 1 }}
          >
            Prescription Medicines
          </button>
        </div>
      )}

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="grid-list" style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
          {items.map(item => (
            <div key={item.id} style={{
              background: '#fff',
              padding: '16px',
              borderRadius: '8px',
              border: '1px solid #eee',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
              borderLeft: item.is_low_stock ? '4px solid #dc3545' : '4px solid #28a745'
            }}>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '1.1rem' }}>{item.name}</h3>
              <p style={{ margin: '0 0 4px 0', color: '#666' }}>Current Stock: <strong style={{color: '#000'}}>{item.stock_quantity}</strong></p>
              <p style={{ margin: '0 0 16px 0', color: '#666', fontSize: '0.9rem' }}>Alert Threshold: {item.low_stock_threshold}</p>
              
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-primary btn-sm" onClick={() => {
                  setSelectedItem(item);
                  setMovementType('in');
                  setShowModal(true);
                }} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                  <FaPlus /> Stock In
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => {
                  setSelectedItem(item);
                  setMovementType('out');
                  setShowModal(true);
                }} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                  <FaMinus /> Stock Out
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stock Update Modal / Bottom Sheet on Mobile */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center'
        }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{
            background: '#fff',
            width: '100%',
            maxWidth: '500px',
            borderTopLeftRadius: '16px',
            borderTopRightRadius: '16px',
            padding: '24px',
            animation: 'slideUp 0.3s ease-out'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px' }}>
              Update Stock: {selectedItem?.name}
            </h3>
            
            <form onSubmit={handleStockUpdate}>
              <div className="form-group">
                <label>Action Type</label>
                <select className="form-control" value={movementType} onChange={e => setMovementType(e.target.value)}>
                  <option value="in">Add Stock (In)</option>
                  <option value="out">Remove Stock (Out)</option>
                  <option value="adjustment">Set Exact Stock (Adjustment)</option>
                </select>
              </div>

              <div className="form-group">
                <label>{movementType === 'adjustment' ? 'New Exact Quantity' : 'Quantity'}</label>
                <input 
                  type="number" 
                  className="form-control" 
                  min="1" 
                  required 
                  value={quantity} 
                  onChange={e => setQuantity(e.target.value)} 
                  placeholder="e.g., 50"
                />
              </div>

              <div className="form-group">
                <label>Reference (Optional)</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={reference} 
                  onChange={e => setReference(e.target.value)} 
                  placeholder="e.g., Invoice #1234, Prescription"
                />
              </div>

              <div className="form-group">
                <label>Notes (Optional)</label>
                <textarea 
                  className="form-control" 
                  value={notes} 
                  onChange={e => setNotes(e.target.value)} 
                  rows="2"
                ></textarea>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)} style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>
                  Confirm Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

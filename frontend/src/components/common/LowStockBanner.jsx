import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { FaExclamationTriangle } from 'react-icons/fa';
// import './LowStockBanner.css'; // Let's inline styles in a style object or use existing css

export default function LowStockBanner({ type = 'medicine' }) {
  const [lowStockItems, setLowStockItems] = useState([]);

  useEffect(() => {
    fetchLowStock();
  }, [type]);

  const fetchLowStock = async () => {
    try {
      const endpoint = type === 'medicine' ? '/medicines/low-stock/' : '/products/low-stock/';
      const res = await api.get(endpoint);
      setLowStockItems(res.data);
    } catch (err) {

    }
  };

  if (lowStockItems.length === 0) return null;

  return (
    <div style={{
      backgroundColor: '#fff3cd',
      color: '#856404',
      padding: '12px 16px',
      borderRadius: '8px',
      marginBottom: '16px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      borderLeft: '4px solid #ffeeba'
    }}>
      <FaExclamationTriangle size={20} />
      <div>
        <strong style={{ display: 'block', marginBottom: '4px' }}>Low Stock Alert</strong>
        <span style={{ fontSize: '0.9rem' }}>
          {lowStockItems.length} {type}(s) are running low on stock. Please restock soon.
        </span>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { FiUpload, FiX, FiCheck } from 'react-icons/fi';
import axios from 'axios';

export default function ImageUpload({ onUploadSuccess, currentImage }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    // Using Cloudinary Unsigned Upload
    // Note: In a real app, these should come from env/settings
    const CLOUD_NAME = 'demo'; // Placeholder
    const UPLOAD_PRESET = 'docs_upload_example_us_preset'; // Placeholder

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);

    try {
      const res = await axios.post(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        formData
      );
      onUploadSuccess(res.data.secure_url);
    } catch (err) {
      console.error('Upload error:', err);
      setError('Upload failed. Check console for details.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="image-upload-container">
      <label className="form-label">Product Image</label>
      <div style={{ 
        border: '2px dashed var(--border-gold)', 
        borderRadius: 12, 
        padding: 20, 
        textAlign: 'center',
        background: 'var(--parchment)',
        position: 'relative'
      }}>
        {currentImage ? (
          <div style={{ position: 'relative' }}>
            <img src={currentImage} alt="Preview" style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8 }} />
            <button 
              type="button"
              onClick={() => onUploadSuccess('')}
              style={{ 
                position: 'absolute', top: -10, right: -10, 
                background: 'var(--clay)', color: '#fff', 
                border: 'none', borderRadius: '50%', width: 24, height: 24,
                cursor: 'pointer'
              }}
            >
              <FiX size={14} />
            </button>
          </div>
        ) : (
          <div style={{ cursor: 'pointer' }} onClick={() => document.getElementById('file-input').click()}>
            <FiUpload size={32} color="var(--moss)" style={{ marginBottom: 10 }} />
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {uploading ? 'Uploading...' : 'Click to upload image'}
            </p>
            <input 
              id="file-input" 
              type="file" 
              hidden 
              onChange={handleUpload} 
              accept="image/*"
            />
          </div>
        )}
      </div>
      {error && <p style={{ color: 'var(--clay)', fontSize: '0.75rem', marginTop: 5 }}>{error}</p>}
      {uploading && <div className="progress-bar" style={{ height: 2, background: 'var(--moss)', width: '100%', marginTop: 10 }} />}
    </div>
  );
}

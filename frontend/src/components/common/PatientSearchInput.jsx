/**
 * PatientSearchInput — reusable searchable patient selector
 * Searches patients by name or phone number via API with debounce.
 *
 * Props:
 *   value        — currently selected patient ID (string or number)
 *   onSelect     — (patient) => void — called when a patient is chosen
 *   onClear      — () => void — called when selection is cleared
 *   placeholder  — string (optional)
 *   required     — boolean (optional)
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { FaSearch, FaTimes, FaUserInjured, FaPhone } from 'react-icons/fa';
import { getPatients } from '../../api/patients';

export default function PatientSearchInput({ value, onSelect, onClear, placeholder = 'Search by name or mobile…', required = false }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState('');
  const debounceRef = useRef(null);
  const containerRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setLoading(true);
      getPatients({ search: query.trim(), page_size: 10 })
        .then(({ data }) => {
          const rows = data.results || data;
          setResults(rows);
          setOpen(true);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }, 300);
  }, [query]);

  const handleSelect = (patient) => {
    setSelectedLabel(`${patient.first_name} ${patient.last_name} · ${patient.phone}`);
    setQuery('');
    setOpen(false);
    onSelect(patient);
  };

  const handleClear = () => {
    setSelectedLabel('');
    setQuery('');
    setResults([]);
    setOpen(false);
    if (onClear) onClear();
  };

  const hasSelection = !!value;

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      {/* Hidden native input for form validation */}
      {required && (
        <input
          type="text"
          required={required}
          value={value ? String(value) : ''}
          onChange={() => {}}
          style={{ position: 'absolute', opacity: 0, width: 1, height: 1, pointerEvents: 'none' }}
          tabIndex={-1}
        />
      )}

      {/* Selected patient chip */}
      {hasSelection ? (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 14px',
          background: 'var(--primary-bg)',
          border: '1px solid var(--border-active)',
          borderRadius: 'var(--radius-md)',
          fontSize: '0.9rem',
        }}>
          <FaUserInjured color="var(--primary)" size={14} />
          <span style={{ flex: 1, fontWeight: 500, color: 'var(--text-primary)' }}>{selectedLabel}</span>
          <button
            type="button"
            onClick={handleClear}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 2, display: 'flex', alignItems: 'center' }}
            title="Clear selection"
          >
            <FaTimes size={14} />
          </button>
        </div>
      ) : (
        <div style={{ position: 'relative' }}>
          <FaSearch style={{ position: 'absolute', top: '50%', left: 14, transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} size={13} />
          <input
            className="input"
            type="text"
            placeholder={placeholder}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => query.length >= 2 && setOpen(true)}
            style={{ paddingLeft: 38 }}
            autoComplete="off"
          />
          {loading && (
            <div style={{ position: 'absolute', top: '50%', right: 12, transform: 'translateY(-50%)' }}>
              <div className="spinner spinner-sm" />
            </div>
          )}
        </div>
      )}

      {/* Dropdown results */}
      {open && results.length > 0 && !hasSelection && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          zIndex: 2000,
          maxHeight: 240,
          overflowY: 'auto',
        }}>
          {results.map(p => (
            <button
              key={p.id}
              type="button"
              onClick={() => handleSelect(p)}
              style={{
                width: '100%', textAlign: 'left', padding: '11px 14px',
                background: 'none', border: 'none', cursor: 'pointer',
                display: 'flex', flexDirection: 'column', gap: 2,
                borderBottom: '1px solid var(--border)',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                {p.first_name} {p.last_name}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: 10 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><FaPhone size={10} /> {p.phone}</span>
                {p.uhid && <span>UHID: {p.uhid}</span>}
                {p.age && <span>Age: {p.age}</span>}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* No results */}
      {open && results.length === 0 && query.length >= 2 && !loading && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)', padding: '14px',
          zIndex: 2000, fontSize: '0.85rem', color: 'var(--text-muted)',
          textAlign: 'center',
        }}>
          No patients found for "{query}"
        </div>
      )}
    </div>
  );
}

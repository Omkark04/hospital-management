import React, { useState, useEffect, useCallback } from 'react';
import { FaLeaf, FaPlus, FaTimes, FaEdit, FaBan, FaTrash, FaCalendarAlt } from 'react-icons/fa';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../api/axios';

const THERAPY_TYPES = [
  { value: 'sujok', label: 'Sujok Therapy' },
  { value: 'acupuncture', label: 'Acupuncture' },
  { value: 'physiotherapy', label: 'Physiotherapy' },
  { value: 'ayurvedic', label: 'Ayurvedic' },
  { value: 'yoga', label: 'Yoga Therapy' },
  { value: 'panchakarma', label: 'Panchakarma' },
  { value: 'cupping', label: 'Cupping Therapy' },
  { value: 'marma', label: 'Marma Therapy' },
  { value: 'other', label: 'Other' },
];

const EMPTY_FORM = {
  name: '',
  therapy_type: 'sujok',
  description: '',
  materials_needed: '',
  total_duration_days: 30,
  sessions_per_week: 2,
  session_duration_minutes: 60,
  is_active: true,
  branches: [],
  medicines: [],
  products: [],
  timeline: [],
};

const EMPTY_TIMELINE_ROW = {
  day_number: '',
  session_label: '',
  practices: '',
  medicines_on_day: [],
  products_on_day: [],
  notes: '',
};

function MultiSelect({ label, options, selectedValues, onChange, placeholder = "Select options..." }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = options.filter(opt => 
    (opt.name || opt.label || '').toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (val) => {
    if (selectedValues.includes(val)) {
      onChange(selectedValues.filter(v => v !== val));
    } else {
      onChange([...selectedValues, val]);
    }
  };

  const selectedLabels = options
    .filter(opt => selectedValues.includes(opt.id))
    .map(opt => opt.name || opt.label);

  return (
    <div className="form-group" style={{ position: 'relative' }}>
      <label className="form-label">{label}</label>
      <div 
        onClick={() => setOpen(!open)}
        className="input"
        style={{
          minHeight: '40px',
          height: 'auto',
          cursor: 'pointer',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '4px',
          alignItems: 'center',
          padding: '6px 12px',
          justifyContent: 'space-between',
          background: 'var(--bg-card)'
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', flex: 1 }}>
          {selectedLabels.length === 0 ? (
            <span style={{ color: 'var(--text-muted)' }}>{placeholder}</span>
          ) : (
            selectedLabels.map(lbl => (
              <span 
                key={lbl} 
                style={{
                  background: 'var(--primary-light)',
                  color: 'var(--primary)',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                {lbl}
              </span>
            ))
          )}
        </div>
        <span style={{ fontSize: '0.8rem' }}>{open ? '▲' : '▼'}</span>
      </div>

      {open && (
        <>
          <div 
            style={{ position: 'fixed', inset: 0, zIndex: 100 }} 
            onClick={() => setOpen(false)} 
          />
          <div 
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              zIndex: 101,
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              boxShadow: 'var(--shadow)',
              marginTop: '4px',
              maxHeight: '200px',
              overflowY: 'auto',
              padding: '8px'
            }}
          >
            <input 
              className="input" 
              placeholder="Search..." 
              value={search} 
              onChange={e => setSearch(e.target.value)}
              style={{ marginBottom: '8px', padding: '6px 10px', fontSize: '0.85rem' }}
              onClick={e => e.stopPropagation()}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {filtered.map(opt => {
                const isSelected = selectedValues.includes(opt.id);
                return (
                  <label 
                    key={opt.id} 
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '6px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      background: isSelected ? 'var(--bg-hover)' : 'transparent'
                    }}
                    onClick={e => e.stopPropagation()}
                  >
                    <input 
                      type="checkbox" 
                      checked={isSelected} 
                      onChange={() => toggle(opt.id)}
                    />
                    {opt.name || opt.label}
                  </label>
                );
              })}
              {filtered.length === 0 && (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', padding: '8px', textAlign: 'center' }}>
                  No options found
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function TherapyList() {
  const { user } = useAuth();
  const isOwner = user?.role === 'owner';

  const [therapies, setTherapies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null); // therapy object for edit
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const [allMedicines, setAllMedicines] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [allBranches, setAllBranches] = useState([]);

  const fetchTherapies = useCallback(() => {
    setLoading(true);
    api.get('/therapies/')
      .then(res => setTherapies(res.data.results || res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchTherapies();
  }, [fetchTherapies]);

  useEffect(() => {
    api.get('/medicines/')
      .then(res => setAllMedicines(res.data.results || res.data))
      .catch(() => {});

    api.get('/products/prescription-products/')
      .then(res => setAllProducts(res.data.results || res.data))
      .catch(() => {});

    if (isOwner) {
      api.get('/branches/')
        .then(res => setAllBranches(res.data.results || res.data))
        .catch(() => {});
    }
  }, [isOwner]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (therapy) => {
    setEditing(therapy);
    setForm({
      name: therapy.name,
      therapy_type: therapy.therapy_type,
      description: therapy.description || '',
      materials_needed: therapy.materials_needed || '',
      total_duration_days: therapy.total_duration_days,
      sessions_per_week: therapy.sessions_per_week,
      session_duration_minutes: therapy.session_duration_minutes,
      is_active: therapy.is_active,
      branches: (therapy.branches_details || therapy.branches || []).map(b => b.id || b),
      medicines: (therapy.medicines_details || therapy.medicines || []).map(m => m.id || m),
      products: (therapy.products_details || therapy.products || []).map(p => p.id || p),
      timeline: (therapy.timeline || []).map(row => ({
        day_number: row.day_number,
        session_label: row.session_label || '',
        practices: row.practices || '',
        medicines_on_day: (row.medicines_on_day_details || row.medicines_on_day || []).map(m => m.id || m),
        products_on_day: (row.products_on_day_details || row.products_on_day || []).map(p => p.id || p),
        notes: row.notes || '',
      })),
    });
    setShowModal(true);
  };

  const handleDeactivate = async (therapy) => {
    if (!confirm(`Deactivate "${therapy.name}"?`)) return;
    try {
      await api.patch(`/therapies/${therapy.id}/`, { is_active: false });
      fetchTherapies();
    } catch { alert('Failed to deactivate'); }
  };

  const handleDelete = async (therapy) => {
    if (!confirm(`Permanently delete "${therapy.name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/therapies/${therapy.id}/`);
      fetchTherapies();
    } catch { alert('Failed to delete'); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/therapies/${editing.id}/`, form);
      } else {
        await api.post('/therapies/', form);
      }
      setShowModal(false);
      fetchTherapies();
    } catch (err) {
      alert(JSON.stringify(err.response?.data) || 'Save failed');
    } finally { setSaving(false); }
  };

  // Timeline helpers
  const addTimelineRow = () => setForm(p => ({
    ...p, timeline: [...p.timeline, { ...EMPTY_TIMELINE_ROW }]
  }));
  const removeTimelineRow = (i) => setForm(p => ({
    ...p, timeline: p.timeline.filter((_, idx) => idx !== i)
  }));
  const updateTimelineRow = (i, field, value) => setForm(p => {
    const tl = [...p.timeline];
    tl[i] = { ...tl[i], [field]: value };
    return { ...p, timeline: tl };
  });

  const filtered = therapies.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.therapy_type?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <FaLeaf color="var(--primary)" /> Therapy Programs
          </h2>
          <p>Manage structured therapy programs (Sujok, Physiotherapy, Ayurvedic & more).</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <FaPlus /> New Therapy
        </button>
      </div>

      {/* Search */}
      <div style={{ marginBottom: 20 }}>
        <input
          className="input"
          placeholder="Search therapies by name or type..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Cards Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
      ) : filtered.length === 0 ? (
        <div className="card card-body" style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>🌿</div>
          <h3 style={{ color: 'var(--text-muted)' }}>No therapies yet</h3>
          <p>Create your first therapy program to start assigning it to patients.</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={openCreate}>+ Add First Therapy</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 18 }}>
          {filtered.map(t => (
            <div key={t.id} className="card card-body" style={{ position: 'relative', opacity: t.is_active ? 1 : 0.6 }}>
              {/* Status ribbon */}
              {!t.is_active && (
                <div style={{ position: 'absolute', top: 12, right: 12, background: 'var(--danger-bg)', color: 'var(--danger)', fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>
                  INACTIVE
                </div>
              )}
              <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg, var(--primary), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <FaLeaf color="white" size={22} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1rem' }}>{t.name}</h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                    {THERAPY_TYPES.find(x => x.value === t.therapy_type)?.label || t.therapy_type}
                  </span>
                </div>
              </div>

              {t.description && (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 12, lineHeight: 1.5 }}>
                  {t.description.length > 100 ? t.description.slice(0, 100) + '…' : t.description}
                </p>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
                {[
                  { label: 'Duration', value: `${t.total_duration_days}d` },
                  { label: 'Frequency', value: `${t.sessions_per_week}/wk` },
                  { label: 'Session', value: `${t.session_duration_minutes}min` },
                ].map(stat => (
                  <div key={stat.label} style={{ background: 'var(--bg)', borderRadius: 8, padding: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>{stat.label}</div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary)' }}>{stat.value}</div>
                  </div>
                ))}
              </div>

              {t.timeline && t.timeline.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 12 }}>
                  <FaCalendarAlt size={12} />
                  {t.timeline.length} timeline sessions configured
                </div>
              )}

              {/* Branches Details */}
              {t.branches_details && t.branches_details.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Branches Available:</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {t.branches_details.map(b => (
                      <span key={b.id} style={{ background: 'var(--bg)', color: 'var(--text)', fontSize: '0.7rem', padding: '2px 8px', borderRadius: 4 }}>
                        {b.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={() => openEdit(t)}>
                  <FaEdit size={12} /> Edit
                </button>
                {t.is_active && (
                  <button className="btn btn-ghost btn-sm" style={{ color: 'var(--warning)', flex: 1 }} onClick={() => handleDeactivate(t)}>
                    <FaBan size={12} /> Deactivate
                  </button>
                )}
                {isOwner && (
                  <button className="btn btn-danger btn-sm" style={{ flex: 1 }} onClick={() => handleDelete(t)}>
                    <FaTrash size={12} /> Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => !saving && setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 720, maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h3>{editing ? 'Edit Therapy' : 'Create New Therapy'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

                {/* Basic Info */}
                <div className="form-grid">
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Therapy Name *</label>
                    <input className="input" required placeholder="e.g. Sujok Basic Protocol" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Therapy Type *</label>
                    <select className="input" value={form.therapy_type} onChange={e => setForm(p => ({ ...p, therapy_type: e.target.value }))}>
                      {THERAPY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Session Duration (minutes)</label>
                    <input type="number" min="15" className="input" value={form.session_duration_minutes} onChange={e => setForm(p => ({ ...p, session_duration_minutes: +e.target.value }))} />
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Total Duration (days)</label>
                    <input type="number" min="1" className="input" value={form.total_duration_days} onChange={e => setForm(p => ({ ...p, total_duration_days: +e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Sessions per Week</label>
                    <input type="number" min="1" max="7" className="input" value={form.sessions_per_week} onChange={e => setForm(p => ({ ...p, sessions_per_week: +e.target.value }))} />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="input" rows={2} placeholder="Brief description of this therapy program..." value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
                </div>

                {isOwner && (
                  <MultiSelect 
                    label="Offer at Branches"
                    options={allBranches}
                    selectedValues={form.branches}
                    onChange={val => setForm(p => ({ ...p, branches: val }))}
                    placeholder="Select branches..."
                  />
                )}

                <div className="form-group">
                  <label className="form-label">Materials / Equipment Needed</label>
                  <textarea className="input" rows={2} placeholder="Herbs, oils, needles, equipment..." value={form.materials_needed} onChange={e => setForm(p => ({ ...p, materials_needed: e.target.value }))} />
                </div>

                <div className="form-grid">
                  <MultiSelect 
                    label="Primary Medicines Involved"
                    options={allMedicines}
                    selectedValues={form.medicines}
                    onChange={val => setForm(p => ({ ...p, medicines: val }))}
                    placeholder="Select medicines..."
                  />
                  <MultiSelect 
                    label="Primary Products Involved"
                    options={allProducts}
                    selectedValues={form.products}
                    onChange={val => setForm(p => ({ ...p, products: val }))}
                    placeholder="Select products..."
                  />
                </div>

                {/* Timeline Builder */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div>
                      <h4 style={{ margin: 0 }}>📅 Appointment Timeline</h4>
                      <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Define session checkpoints. When assigned to a patient, appointments will be auto-scheduled on these days.
                      </p>
                    </div>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={addTimelineRow} style={{ flexShrink: 0 }}>
                      + Add Day
                    </button>
                  </div>

                  {form.timeline.length === 0 ? (
                    <div style={{ padding: '20px', background: 'var(--bg)', borderRadius: 10, border: '2px dashed var(--border)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      No timeline sessions yet. Click <strong>+ Add Day</strong> to define appointment checkpoints.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {form.timeline.map((row, i) => (
                        <div key={i} style={{ background: 'var(--bg)', borderRadius: 10, padding: 14, position: 'relative', border: '1px solid var(--border)' }}>
                          <button type="button" onClick={() => removeTimelineRow(i)} style={{ position: 'absolute', top: 8, right: 8, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1rem' }}>×</button>
                          <div className="form-grid" style={{ marginBottom: 8 }}>
                            <div className="form-group">
                              <label className="form-label">Day # *</label>
                              <input type="number" min="1" className="input" placeholder="1" required value={row.day_number} onChange={e => updateTimelineRow(i, 'day_number', e.target.value)} />
                            </div>
                            <div className="form-group">
                              <label className="form-label">Session Label</label>
                              <input className="input" placeholder="e.g. Initial Assessment" value={row.session_label} onChange={e => updateTimelineRow(i, 'session_label', e.target.value)} />
                            </div>
                          </div>
                          <div className="form-group" style={{ marginBottom: 8 }}>
                            <label className="form-label">Practices / Procedures for this day</label>
                            <textarea className="input" rows={2} placeholder="What to do on this day..." value={row.practices} onChange={e => updateTimelineRow(i, 'practices', e.target.value)} />
                          </div>

                          <div className="form-grid" style={{ marginBottom: 8 }}>
                            <MultiSelect 
                              label="Medicines for Day"
                              options={allMedicines}
                              selectedValues={row.medicines_on_day || []}
                              onChange={val => updateTimelineRow(i, 'medicines_on_day', val)}
                              placeholder="Select medicines..."
                            />
                            <MultiSelect 
                              label="Products for Day"
                              options={allProducts}
                              selectedValues={row.products_on_day || []}
                              onChange={val => updateTimelineRow(i, 'products_on_day', val)}
                              placeholder="Select products..."
                            />
                          </div>

                          <div className="form-group">
                            <label className="form-label">Notes</label>
                            <textarea className="input" rows={1} placeholder="Special instructions for session..." value={row.notes} onChange={e => updateTimelineRow(i, 'notes', e.target.value)} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : editing ? 'Save Changes' : 'Create Therapy'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

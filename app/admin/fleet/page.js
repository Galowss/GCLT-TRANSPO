'use client';

import AdminLayout from '@/components/AdminLayout';
import Image from 'next/image';
import { useRealtimeFirestore } from '@/lib/useRealtimeFirestore';
import { subscribeToFleetTypes, addFleetType, updateFleetType, deleteFleetType } from '@/lib/firebaseService';
import { compressImage } from '@/lib/compressImage';
import { useToast } from '@/components/Toast';
import { highlightAndFocusMissingFields } from '@/lib/validation';
import { useState } from 'react';
import { Truck, Plus, Pencil, Trash2, X, Upload, Image, XCircle, CheckCircle } from 'lucide-react';
import { FLEET_CATEGORIES } from '@/lib/constants';

const emptyForm = {
  name: '', capacity: '', description: '',
  available: true, category: 'Trailer',
};

export default function AdminFleet() {
  const { data: fleet, loading } = useRealtimeFirestore(
    (cb) => subscribeToFleetTypes(cb)
  );
  const { addToast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleImageChange = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    // Limit to 5 total images
    const remaining = 5 - imagePreviews.length;
    if (remaining <= 0) {
      addToast('Maximum 5 images allowed.', 'error');
      return;
    }
    const toProcess = files.slice(0, remaining);

    for (const file of toProcess) {
      try {
        const result = await compressImage(file, 600, 0.6);
        setImageFiles(prev => [...prev, result.dataUrl]);
        setImagePreviews(prev => [...prev, result.dataUrl]);
      } catch {
        const reader = new FileReader();
        reader.onload = (ev) => {
          setImageFiles(prev => [...prev, ev.target.result]);
          setImagePreviews(prev => [...prev, ev.target.result]);
        };
        reader.readAsDataURL(file);
      }
    }

    if (files.length > remaining) {
      addToast(`Only ${remaining} more image(s) allowed. Extra files were skipped.`, 'info');
    }
  };

  const removeImage = (index) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const openAddForm = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setImageFiles([]);
    setImagePreviews([]);
    setShowForm(true);
  };

  const openEditForm = (item) => {
    setEditingId(item.id);
    setFormData({
      name: item.name || '',
      capacity: item.capacity || '',
      description: item.description || '',
      available: item.available !== false,
      category: item.category || 'Trailer',
    });
    setImageFiles([]);
    const existingImages = item.imageUrls?.length ? [...item.imageUrls] : (item.imageUrl ? [item.imageUrl] : []);
    setImagePreviews(existingImages);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (highlightAndFocusMissingFields()) return;
    setSubmitting(true);

    try {
      const finalImageUrls = [...imagePreviews];

      const data = {
        name: formData.name,
        capacity: formData.capacity,
        description: formData.description,
        imageUrl: finalImageUrls[0] || '',
        imageUrls: finalImageUrls,
        available: formData.available,
        category: formData.category,
      };

      if (editingId) {
        await updateFleetType(editingId, data);
        addToast('Fleet truck updated successfully.', 'success');
      } else {
        await addFleetType(data);
        addToast('Fleet truck added successfully.', 'success');
      }

      setShowForm(false);
      setFormData(emptyForm);
      setImageFiles([]);
      setImagePreviews([]);
      setEditingId(null);
    } catch (err) {
      addToast('Failed to save: ' + err.message, 'error');
    }
    setSubmitting(false);
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete "${name}" from available fleet?`)) return;
    setDeleting(id);
    try {
      await deleteFleetType(id);
      addToast('Fleet truck removed.', 'success');
    } catch (err) {
      addToast('Failed to delete.', 'error');
    }
    setDeleting(null);
  };

  const handleToggleAvailability = async (id, name, currentStatus) => {
    try {
      await updateFleetType(id, { available: !currentStatus });
      addToast(`"${name}" marked as ${!currentStatus ? 'Available' : 'Unavailable'}.`, 'success');
    } catch (err) {
      addToast('Failed to update status.', 'error');
    }
  };

  return (
    <AdminLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Truck size={24} color="var(--primary)" /> Available Fleet for Booking
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Manage the trucks available for transport booking. These appear as choices when users book a transport.
          </p>
        </div>
        <button className="btn btn-accent" onClick={openAddForm} style={{ gap: '6px' }}>
          <Plus size={16} /> Add Fleet Truck
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
          <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary)' }}>{(fleet || []).length}</span>
          <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>Total Fleet Types</span>
        </div>
        <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
          <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--success)' }}>
            {(fleet || []).filter(f => f.available !== false).length}
          </span>
          <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>Available</span>
        </div>
        <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
          <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--danger)' }}>
            {(fleet || []).filter(f => f.available === false).length}
          </span>
          <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>Unavailable</span>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card card-lg" style={{ marginBottom: '24px', border: '2px solid var(--primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3>{editingId ? 'Edit Fleet Truck' : 'Add Fleet Truck'}</h3>
            <button style={{ background: 'none', color: 'var(--text-muted)' }} onClick={() => setShowForm(false)}><X size={20} /></button>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            {/* Multiple Image Upload */}
            <div style={{ marginBottom: '24px' }}>
              <label className="form-label">Fleet Truck Images (up to 5)</label>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                {imagePreviews.map((preview, idx) => (
                  <div key={idx} style={{
                    width: '120px', height: '90px', borderRadius: 'var(--border-radius)',
                    overflow: 'hidden', position: 'relative', flexShrink: 0, border: '1px solid var(--gray-200)',
                  }}>
                    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                      <Image src={preview} alt={`Preview ${idx + 1}`} fill sizes="120px" style={{ objectFit: 'cover' }} />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      style={{
                        position: 'absolute', top: '4px', right: '4px',
                        width: '20px', height: '20px', borderRadius: '50%',
                        background: 'rgba(0,0,0,0.6)', color: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.7rem', cursor: 'pointer', border: 'none',
                      }}
                    >✕</button>
                  </div>
                ))}
                {imagePreviews.length < 5 && (
                  <label style={{
                    width: '120px', height: '90px', borderRadius: 'var(--border-radius)',
                    border: '2px dashed var(--gray-300)', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
                    background: 'var(--gray-50)', flexDirection: 'column', gap: '4px',
                  }}>
                    <Upload size={18} color="var(--text-muted)" />
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Add Image</span>
                    <input type="file" accept="image/*" multiple onChange={handleImageChange} style={{ display: 'none' }} />
                  </label>
                )}
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                Upload up to 5 images. Images are auto-compressed before saving.
              </p>
            </div>

            {/* Fields */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Truck Name *</label>
                <input type="text" name="name" className="form-input" placeholder="e.g. Closed Van (4-6 Tons)" value={formData.name} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label">Capacity</label>
                <input type="text" name="capacity" className="form-input" placeholder="e.g. 4-6 Tons" value={formData.capacity} onChange={handleChange} />
              </div>

              {/* Category dropdown — drives user-facing booking dropdown */}
              <div className="form-group">
                <label className="form-label">Category *</label>
                <select name="category" className="form-select" value={formData.category} onChange={handleChange} required>
                  {FLEET_CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label} — {cat.desc}</option>
                  ))}
                </select>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                  This determines which category this truck appears under when users book transport.
                </span>
              </div>

              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '24px' }}>
                <input type="checkbox" name="available" checked={formData.available} onChange={handleChange} style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }} />
                <label style={{ fontSize: '0.9rem' }}>Available for Booking</label>
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '16px' }}>
              <label className="form-label">Description</label>
              <textarea name="description" className="form-input form-textarea" placeholder="Describe the truck specs, ideal use cases..." value={formData.description} onChange={handleChange} rows="2"></textarea>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
              <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Saving...' : editingId ? 'Update' : 'Add Fleet Truck'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Truck</th>
                <th>Category</th>
                <th>Capacity</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '32px' }}>Loading fleet...</td></tr>
              ) : !(fleet || []).length ? (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  <Truck size={28} style={{ display: 'block', margin: '0 auto 8px' }} />
                  No fleet trucks added. Users won't see any options when booking.
                </td></tr>
              ) : fleet.map(item => (
                <tr key={item.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '48px', height: '48px', borderRadius: 'var(--border-radius)',
                        overflow: 'hidden', background: 'var(--gray-100)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        {(item.imageUrls?.[0] || item.imageUrl) ? (
                          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                            <Image src={item.imageUrls?.[0] || item.imageUrl} alt={item.name} fill sizes="48px" style={{ objectFit: 'cover' }} />
                          </div>
                        ) : (
                          <Truck size={20} color="var(--text-muted)" />
                        )}
                      </div>
                      <div>
                        <strong style={{ fontSize: '0.9rem' }}>{item.name}</strong>
                        {item.description && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.description.slice(0, 60)}</div>}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      {FLEET_CATEGORIES.find(c => c.value === item.category)?.label || item.category || '—'}
                    </span>
                  </td>
                  <td>{item.capacity || '--'}</td>
                  <td>
                    <span className={`badge ${item.available !== false ? 'badge-success' : 'badge-warning'}`}>
                      {item.available !== false ? 'Available' : 'Unavailable'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        className="btn btn-outline btn-sm"
                        style={{ gap: '4px', color: item.available !== false ? 'var(--warning)' : 'var(--success)', borderColor: item.available !== false ? 'var(--warning)' : 'var(--success)' }}
                        onClick={() => handleToggleAvailability(item.id, item.name, item.available !== false)}
                      >
                        {item.available !== false ? <><XCircle size={14} /> Set Unavailable</> : <><CheckCircle size={14} /> Set Available</>}
                      </button>
                      <button className="btn btn-outline btn-sm" style={{ gap: '4px' }} onClick={() => openEditForm(item)}>
                        <Pencil size={14} /> Edit
                      </button>
                      <button
                        className="btn btn-outline btn-sm"
                        style={{ color: 'var(--danger)', borderColor: 'var(--danger)', gap: '4px' }}
                        onClick={() => handleDelete(item.id, item.name)}
                        disabled={deleting === item.id}
                      >
                        <Trash2 size={14} /> {deleting === item.id ? '...' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}

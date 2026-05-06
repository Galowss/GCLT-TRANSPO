'use client';

import AdminLayout from '@/components/AdminLayout';
import { useFirestore } from '@/lib/useFirestore';
import { getTrucksForSale, addTruck, updateTruck, deleteTruck } from '@/lib/firebaseService';
import { compressImage } from '@/lib/compressImage';
import { useToast } from '@/components/Toast';
import { useState } from 'react';
import { Truck, Plus, Pencil, Trash2, X, Upload, Image, MapPin } from 'lucide-react';

const emptyForm = {
  name: '', price: '', mileage: '', year: '', engine: '', type: 'Heavy Duty',
  condition: 'Good', locationStreet: '', locationBarangay: '', locationCity: 'SBMA',
  description: '',
  capacity: '', loadSize: '', transmission: 'Manual', speedGear: '6-Speed',
};

const TRANSMISSION_OPTIONS = ['Manual', 'Automatic'];
const SPEED_GEAR_OPTIONS = ['5-Speed', '6-Speed', '8-Speed', '10-Speed', '12-Speed'];

export default function AdminTrucks() {
  const { data: trucks, loading, refetch } = useFirestore(getTrucksForSale);
  const { addToast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  // Multiple images support
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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

  const openEditForm = (truck) => {
    setEditingId(truck.id);
    setFormData({
      name: truck.name || '',
      price: truck.price || '',
      mileage: truck.mileage || '',
      year: truck.year || '',
      engine: truck.engine || '',
      type: truck.type || 'Heavy Duty',
      condition: truck.condition || 'Good',
      locationStreet: truck.locationStreet || '',
      locationBarangay: truck.locationBarangay || '',
      locationCity: truck.locationCity || truck.location || 'SBMA',
      description: truck.description || '',
      capacity: truck.capacity || '',
      loadSize: truck.loadSize || '',
      transmission: truck.transmission || 'Manual',
      speedGear: truck.speedGear || '6-Speed',
    });
    setImageFiles([]);
    // Load existing images (support both legacy single and new multi-image)
    const existingImages = truck.imageUrls?.length ? [...truck.imageUrls] : (truck.imageUrl ? [truck.imageUrl] : []);
    setImagePreviews(existingImages);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Combine existing previews (that weren't from new uploads) with new files
      // imagePreviews contains all visible images (existing + newly added)
      const finalImageUrls = [...imagePreviews];

      const locationFull = [formData.locationStreet, formData.locationBarangay, formData.locationCity].filter(Boolean).join(', ');

      const truckData = {
        name: formData.name,
        price: Number(formData.price),
        mileage: formData.mileage,
        year: formData.year,
        engine: formData.engine,
        type: formData.type,
        condition: formData.condition,
        location: locationFull,
        locationStreet: formData.locationStreet,
        locationBarangay: formData.locationBarangay,
        locationCity: formData.locationCity,
        description: formData.description,
        // Keep legacy imageUrl for backward compatibility (first image)
        imageUrl: finalImageUrls[0] || '',
        imageUrls: finalImageUrls,
        capacity: formData.capacity,
        loadSize: formData.loadSize,
        transmission: formData.transmission,
        speedGear: formData.transmission === 'Manual' ? formData.speedGear : '',
        typeColor: '#1B7A3D',
      };

      if (editingId) {
        await updateTruck(editingId, truckData);
        addToast('Truck updated successfully.', 'success');
      } else {
        await addTruck(truckData);
        addToast('Truck added successfully.', 'success');
      }

      setShowForm(false);
      setFormData(emptyForm);
      setImageFiles([]);
      setImagePreviews([]);
      setEditingId(null);
      refetch();
    } catch (err) {
      addToast('Failed to save truck: ' + err.message, 'error');
    }
    setSubmitting(false);
  };

  const handleDelete = async (truckId, truckName) => {
    if (!confirm(`Are you sure you want to delete "${truckName}"?`)) return;
    setDeleting(truckId);
    try {
      await deleteTruck(truckId);
      addToast('Truck deleted successfully.', 'success');
      refetch();
    } catch (err) {
      addToast('Failed to delete truck.', 'error');
    }
    setDeleting(null);
  };

  return (
    <AdminLayout>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Truck size={24} color="var(--primary)" /> Truck Marketplace Management
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Manage used truck listings for the fleet sales marketplace.
          </p>
        </div>
        <button className="btn btn-accent" onClick={openAddForm} style={{ gap: '6px' }}>
          <Plus size={16} /> Add New Truck
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
          <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary)' }}>{(trucks || []).length}</span>
          <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>Total Listings</span>
        </div>
        <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
          <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--success)' }}>
            {(trucks || []).filter(t => t.condition === 'Excellent' || t.condition === 'Good').length}
          </span>
          <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>Good Condition</span>
        </div>
        <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
          <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--accent)' }}>
            {(trucks || []).filter(t => t.imageUrl || t.imageUrls?.length).length}
          </span>
          <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>With Images</span>
        </div>
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="card card-lg" style={{ marginBottom: '24px', border: '2px solid var(--primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3>{editingId ? 'Edit Truck Listing' : 'Add New Truck'}</h3>
            <button style={{ background: 'none', color: 'var(--text-muted)' }} onClick={() => setShowForm(false)}>
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Multiple Image Upload */}
            <div style={{ marginBottom: '24px' }}>
              <label className="form-label">Truck Images (up to 5)</label>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                {imagePreviews.map((preview, idx) => (
                  <div key={idx} style={{
                    width: '120px', height: '90px', borderRadius: 'var(--border-radius)',
                    overflow: 'hidden', position: 'relative', flexShrink: 0, border: '1px solid var(--gray-200)',
                  }}>
                    <img src={preview} alt={`Preview ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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

            {/* Form Fields */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Truck Name *</label>
                <input type="text" name="name" className="form-input" placeholder="e.g. Isuzu Giga 10W Dump Truck" value={formData.name} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label">Price (PHP) *</label>
                <input type="number" name="price" className="form-input" placeholder="e.g. 2500000" value={formData.price} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label">Mileage *</label>
                <input type="text" name="mileage" className="form-input" placeholder="e.g. 85,000 km" value={formData.mileage} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label">Year</label>
                <input type="text" name="year" className="form-input" placeholder="e.g. 2019" value={formData.year} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Engine</label>
                <input type="text" name="engine" className="form-input" placeholder="e.g. 6HK1-TC Diesel" value={formData.engine} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Type</label>
                <select name="type" className="form-select" value={formData.type} onChange={handleChange}>
                  <option>Heavy Duty</option>
                  <option>Medium Duty</option>
                  <option>Light Duty</option>
                  <option>Dump Truck</option>
                  <option>Flatbed</option>
                  <option>Wing Van</option>
                  <option>Refrigerated Van</option>
                  <option>Prime Mover</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Condition</label>
                <select name="condition" className="form-select" value={formData.condition} onChange={handleChange}>
                  <option>Excellent</option>
                  <option>Good</option>
                  <option>Fair</option>
                  <option>Needs Repair</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Location</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                  <div>
                    <input type="text" name="locationStreet" className="form-input" placeholder="Street / Yard" value={formData.locationStreet} onChange={handleChange} />
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>e.g. Yard 5, Rizal Hwy</span>
                  </div>
                  <div>
                    <input type="text" name="locationBarangay" className="form-input" placeholder="Barangay" value={formData.locationBarangay} onChange={handleChange} />
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>e.g. Brgy. Cubi</span>
                  </div>
                  <div>
                    <input type="text" name="locationCity" className="form-input" placeholder="City / Zone" value={formData.locationCity} onChange={handleChange} />
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>e.g. SBMA / Olongapo</span>
                  </div>
                </div>
              </div>

              {/* Transmission dropdown */}
              <div className="form-group">
                <label className="form-label">Transmission</label>
                <select name="transmission" className="form-select" value={formData.transmission} onChange={handleChange}>
                  {TRANSMISSION_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              {/* Speed/Gear dropdown — only for Manual transmission */}
              {formData.transmission === 'Manual' && (
                <div className="form-group">
                  <label className="form-label">Speed / Gear</label>
                  <select name="speedGear" className="form-select" value={formData.speedGear} onChange={handleChange}>
                    {SPEED_GEAR_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Capacity = person occupancy */}
              <div className="form-group">
                <label className="form-label">Seating Capacity (Persons)</label>
                <input type="text" name="capacity" className="form-input" placeholder="e.g. 3 persons" value={formData.capacity} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Max Load Size</label>
                <input type="text" name="loadSize" className="form-input" placeholder="e.g. 6m x 2.4m x 2.4m" value={formData.loadSize} onChange={handleChange} />
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '16px' }}>
              <label className="form-label">Description</label>
              <textarea name="description" className="form-input form-textarea" placeholder="Describe the truck condition, maintenance history, features..." value={formData.description} onChange={handleChange} rows="3"></textarea>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
              <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Saving...' : editingId ? 'Update Truck' : 'Add Truck'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Truck Listings Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Truck</th>
                <th>Type</th>
                <th>Price</th>
                <th>Mileage</th>
                <th>Transmission</th>
                <th>Condition</th>
                <th>Location</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="8" style={{ textAlign: 'center', padding: '32px' }}>Loading trucks...</td></tr>
              ) : !(trucks || []).length ? (
                <tr><td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  <Truck size={28} style={{ display: 'block', margin: '0 auto 8px' }} />
                  No trucks listed yet. Click "Add New Truck" to get started.
                </td></tr>
              ) : trucks.map(truck => (
                <tr key={truck.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '48px', height: '48px', borderRadius: 'var(--border-radius)',
                        overflow: 'hidden', background: 'var(--gray-100)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        {(truck.imageUrls?.[0] || truck.imageUrl) ? (
                          <img src={truck.imageUrls?.[0] || truck.imageUrl} alt={truck.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <Truck size={20} color="var(--text-muted)" />
                        )}
                      </div>
                      <div>
                        <strong style={{ fontSize: '0.9rem' }}>{truck.name}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{truck.year} - {truck.engine}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className="badge" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>{truck.type}</span></td>
                  <td style={{ fontWeight: 600 }}>PHP {truck.price?.toLocaleString()}</td>
                  <td>{truck.mileage}</td>
                  <td>
                    <span style={{ fontSize: '0.85rem' }}>
                      {truck.transmission || 'N/A'}
                      {truck.transmission === 'Manual' && truck.speedGear && (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>{truck.speedGear}</span>
                      )}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${truck.condition === 'Excellent' || truck.condition === 'Good' ? 'badge-success' : 'badge-warning'}`}>
                      {truck.condition}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={12} /> {truck.location}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn btn-outline btn-sm" style={{ gap: '4px' }} onClick={() => openEditForm(truck)}>
                        <Pencil size={14} /> Edit
                      </button>
                      <button
                        className="btn btn-outline btn-sm"
                        style={{ color: 'var(--danger)', borderColor: 'var(--danger)', gap: '4px' }}
                        onClick={() => handleDelete(truck.id, truck.name)}
                        disabled={deleting === truck.id}
                      >
                        <Trash2 size={14} /> {deleting === truck.id ? '...' : 'Delete'}
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

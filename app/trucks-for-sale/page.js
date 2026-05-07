'use client';

import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';
import { useState } from 'react';
import { useRealtimeFirestore } from '@/lib/useRealtimeFirestore';
import { subscribeToTrucksForSale } from '@/lib/firebaseService';
import { Truck, MapPin, DollarSign, Search, ArrowRight, Filter, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './trucks.module.css';

export default function TrucksForSale() {
  const { data: trucksForSale, loading } = useRealtimeFirestore(
    (cb) => subscribeToTrucksForSale(cb)
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterLocation, setFilterLocation] = useState('all');
  const [sortPrice, setSortPrice] = useState('none');
  const [imageIndexes, setImageIndexes] = useState({});

  const getImgIdx = (id) => imageIndexes[id] || 0;
  const prevImg = (e, id, total) => { e.preventDefault(); e.stopPropagation(); setImageIndexes(prev => ({ ...prev, [id]: (getImgIdx(id) - 1 + total) % total })); };
  const nextImg = (e, id, total) => { e.preventDefault(); e.stopPropagation(); setImageIndexes(prev => ({ ...prev, [id]: (getImgIdx(id) + 1) % total })); };

  // Compute unique types and locations from data
  const allTypes = [...new Set((trucksForSale || []).map(t => t.type).filter(Boolean))];
  const allLocations = [...new Set((trucksForSale || []).map(t => t.location).filter(Boolean))];

  let filteredTrucks = (trucksForSale || []).filter(truck => {
    const matchesSearch = !searchQuery ||
      truck.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      truck.type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      truck.engine?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || truck.type === filterType;
    const matchesLocation = filterLocation === 'all' || truck.location === filterLocation;
    return matchesSearch && matchesType && matchesLocation;
  });

  if (sortPrice === 'low') {
    filteredTrucks = [...filteredTrucks].sort((a, b) => (a.price || 0) - (b.price || 0));
  } else if (sortPrice === 'high') {
    filteredTrucks = [...filteredTrucks].sort((a, b) => (b.price || 0) - (a.price || 0));
  }

  const clearFilters = () => {
    setSearchQuery('');
    setFilterType('all');
    setFilterLocation('all');
    setSortPrice('none');
  };

  const hasFilters = searchQuery || filterType !== 'all' || filterLocation !== 'all' || sortPrice !== 'none';

  return (
    <DashboardLayout>

      {/* Search Bar */}
      <div className={styles.searchBar}>
        <div className={styles.searchInner}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search trucks by model, type, or engine..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '40px' }}
            />
          </div>
          <div className={styles.filterBtns}>
            <select
              className="form-select"
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              style={{ minWidth: '140px', padding: '8px 32px 8px 12px', fontSize: '0.8rem' }}
            >
              <option value="all">All Types</option>
              {allTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select
              className="form-select"
              value={filterLocation}
              onChange={e => setFilterLocation(e.target.value)}
              style={{ minWidth: '140px', padding: '8px 32px 8px 12px', fontSize: '0.8rem' }}
            >
              <option value="all">All Locations</option>
              {allLocations.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
            <select
              className="form-select"
              value={sortPrice}
              onChange={e => setSortPrice(e.target.value)}
              style={{ minWidth: '140px', padding: '8px 32px 8px 12px', fontSize: '0.8rem' }}
            >
              <option value="none">Sort by Price</option>
              <option value="low">Price: Low → High</option>
              <option value="high">Price: High → Low</option>
            </select>
            {hasFilters && (
              <button className="btn btn-outline btn-sm" onClick={clearFilters} style={{ gap: '4px' }}>
                <Filter size={14} /> Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Inventory */}
      <section className={styles.inventory}>
        <div className={styles.inventoryInner}>
          <div className={styles.inventoryHeader}>
            <div>
              <h1>Heavy Fleet Inventory</h1>
              <p>Showing {filteredTrucks.length} available truck{filteredTrucks.length !== 1 ? 's' : ''} in the SBMA and Olongapo region.</p>
            </div>
          </div>

          <div className={styles.truckGrid}>
            {loading ? (
              <p style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading trucks...</p>
            ) : !filteredTrucks.length ? (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
                <Truck size={36} style={{ display: 'block', margin: '0 auto 16px', color: 'var(--text-muted)' }} />
                <p style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '8px' }}>No trucks match your search</p>
                <p style={{ fontSize: '0.9rem' }}>Try adjusting your filters or <button onClick={clearFilters} className="btn btn-link" style={{ padding: 0 }}>clear all filters</button></p>
              </div>
            ) : filteredTrucks.map((truck) => (
              <div key={truck.id} className={styles.truckCard}>
                <Link href={`/trucks-for-sale/${truck.id}`} className={styles.cardLink}>
                  <div className={styles.truckImage}>
                    {(() => {
                      const imgs = truck.imageUrls?.length ? truck.imageUrls : (truck.imageUrl ? [truck.imageUrl] : []);
                      const idx = getImgIdx(truck.id);
                      return imgs.length > 0 ? (
                        <>
                          <img src={imgs[idx]} alt={truck.name} />
                          {imgs.length > 1 && (
                            <>
                              <button
                                type="button"
                                className={styles.imgArrow}
                                style={{ left: '8px' }}
                                onClick={e => prevImg(e, truck.id, imgs.length)}
                                aria-label="Previous image"
                              >
                                <ChevronLeft size={16} />
                              </button>
                              <button
                                type="button"
                                className={styles.imgArrow}
                                style={{ right: '8px' }}
                                onClick={e => nextImg(e, truck.id, imgs.length)}
                                aria-label="Next image"
                              >
                                <ChevronRight size={16} />
                              </button>
                              <span className={styles.photoCount}>{idx + 1} / {imgs.length}</span>
                            </>
                          )}
                        </>
                      ) : (
                        <div className={styles.truckImagePlaceholder}><Truck size={48} opacity={0.5} /></div>
                      );
                    })()}
                    <span className={styles.truckType} style={{ background: truck.typeColor || 'var(--primary)' }}>{truck.type}</span>
                    <span className={styles.truckPrice}>PHP {truck.price?.toLocaleString()}</span>
                  </div>
                  <div className={styles.truckInfo}>
                    <div className={styles.truckNameRow}>
                      <h3>{truck.name}</h3>
                      <span className={styles.truckYear}>{truck.year}</span>
                    </div>
                    <div className={styles.truckSpecs}>
                      <span className={styles.specItem}><MapPin size={14} color="var(--primary)" /> {truck.location}</span>
                      <span className={styles.specItem}>{truck.mileage}</span>
                    </div>
                    <div className={styles.truckSpecs}>
                      <span className={styles.specItem}>{truck.engine}</span>
                      <span className={styles.specItem}>{truck.condition}</span>
                    </div>
                  </div>
                </Link>
                <div className={styles.cardActions}>
                  <Link href={`/trucks-for-sale/${truck.id}`} className={styles.truckBtn}>
                    View Details <ArrowRight size={16} />
                  </Link>
                  <Link href={`/trucks-for-sale/${truck.id}/viewing`} className={styles.viewingBtn}>
                    <Calendar size={14} /> Book Viewing
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

    </DashboardLayout>
  );
}

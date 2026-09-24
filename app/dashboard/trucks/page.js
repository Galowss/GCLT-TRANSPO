'use client';

import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';
import TruckImage from '@/components/TruckImage';
import { useState, useMemo } from 'react';
import { useRealtimeFirestore } from '@/lib/useRealtimeFirestore';
import { subscribeToTrucksForSale } from '@/lib/firebaseService';
import { Truck, MapPin, Search, ArrowRight, Filter, Calendar, ChevronLeft, ChevronRight, ShoppingBag } from 'lucide-react';
import styles from '@/app/trucks-for-sale/trucks.module.css';

export default function DashboardBrowseTrucks() {
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

  const allTypes = [...new Set((trucksForSale || []).map(t => t.type).filter(Boolean))];
  const allLocations = [...new Set((trucksForSale || []).map(t => t.location).filter(Boolean))];

  const filteredTrucks = useMemo(() => {
    let filtered = (trucksForSale || []).filter(truck => {
      const matchesSearch = !searchQuery ||
        truck.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        truck.type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        truck.engine?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = filterType === 'all' || truck.type === filterType;
      const matchesLocation = filterLocation === 'all' || truck.location === filterLocation;
      return matchesSearch && matchesType && matchesLocation;
    });

    if (sortPrice === 'low') {
      filtered = [...filtered].sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (sortPrice === 'high') {
      filtered = [...filtered].sort((a, b) => (b.price || 0) - (a.price || 0));
    }
    return filtered;
  }, [trucksForSale, searchQuery, filterType, filterLocation, sortPrice]);

  const clearFilters = () => {
    setSearchQuery('');
    setFilterType('all');
    setFilterLocation('all');
    setSortPrice('none');
  };

  const hasFilters = searchQuery || filterType !== 'all' || filterLocation !== 'all' || sortPrice !== 'none';

  return (
    <DashboardLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ShoppingBag size={24} color="var(--primary)" /> Browse Trucks
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Available trucks in the SBMA and Olongapo region. Select a truck to view details or book a viewing.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '24px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Search trucks by model, type, or engine..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '36px', width: '100%' }}
          />
        </div>
        <select className="form-select" style={{ width: '160px' }} value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="all">All Types</option>
          {allTypes.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select className="form-select" style={{ width: '160px' }} value={filterLocation} onChange={e => setFilterLocation(e.target.value)}>
          <option value="all">All Locations</option>
          {allLocations.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
        <select className="form-select" style={{ width: '160px' }} value={sortPrice} onChange={e => setSortPrice(e.target.value)}>
          <option value="none">Sort by Price</option>
          <option value="low">Price: Low to High</option>
          <option value="high">Price: High to Low</option>
        </select>
        {hasFilters && (
          <button className="btn btn-outline btn-sm" onClick={clearFilters} style={{ gap: '4px', whiteSpace: 'nowrap' }}>
            <Filter size={14} /> Clear
          </button>
        )}
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
          {filteredTrucks.length} truck{filteredTrucks.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className={styles.truckGrid} style={{ marginBottom: 0 }}>
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
                      <TruckImage src={imgs[idx]} alt={truck.name} fill sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw" />
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
                <p className={styles.truckSubtitle}>{truck.type}{truck.drivetrain ? ` • ${truck.drivetrain}` : ''}</p>
                {truck.location && (
                  <p style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <MapPin size={14} /> {truck.location}
                  </p>
                )}
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
    </DashboardLayout>
  );
}
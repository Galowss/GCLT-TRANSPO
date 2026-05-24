'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, ArrowRight, Calendar, Gauge, Fuel, Truck } from 'lucide-react';
import { getTrucksForSale } from '@/lib/firebaseService';
import styles from './TruckInventoryCarousel.module.css';

/**
 * TruckInventoryCarousel
 * 
 * A dedicated inventory showcase carousel for the landing page.
 * Pulls trucks from Firebase "trucksForSale" collection and renders
 * them in a horizontal scrolling card carousel following the Stitch
 * "Industrial Excellence System" design spec.
 */

const CARDS_PER_VIEW = { desktop: 3, tablet: 2, mobile: 1 };

function getCardsPerView() {
  if (typeof window === 'undefined') return CARDS_PER_VIEW.desktop;
  if (window.innerWidth <= 768) return CARDS_PER_VIEW.mobile;
  if (window.innerWidth <= 1024) return CARDS_PER_VIEW.tablet;
  return CARDS_PER_VIEW.desktop;
}

function formatPrice(price) {
  if (!price && price !== 0) return 'Contact for Price';
  return `₱${Number(price).toLocaleString()}`;
}

function getStatusInfo(status) {
  const s = (status || 'available').toLowerCase();
  if (s === 'sold') return { label: 'Sold', className: styles.statusSold, dotClass: 'red' };
  if (s === 'reserved') return { label: 'Reserved', className: styles.statusReserved, dotClass: 'amber' };
  return { label: 'Available', className: styles.statusAvailable, dotClass: 'green' };
}

export default function TruckInventoryCarousel() {
  const [trucks, setTrucks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [perView, setPerView] = useState(CARDS_PER_VIEW.desktop);
  const trackRef = useRef(null);

  // Load trucks from Firebase
  useEffect(() => {
    getTrucksForSale()
      .then((data) => {
        setTrucks(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  // Responsive: update cards per view on resize
  useEffect(() => {
    function handleResize() {
      setPerView(getCardsPerView());
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const totalPages = Math.max(1, Math.ceil(trucks.length / perView));

  // Clamp current page when trucks or perView changes
  useEffect(() => {
    setCurrentPage((prev) => Math.min(prev, totalPages - 1));
  }, [totalPages]);

  const goTo = useCallback((page) => {
    setCurrentPage(Math.max(0, Math.min(page, totalPages - 1)));
  }, [totalPages]);

  const canPrev = currentPage > 0;
  const canNext = currentPage < totalPages - 1;

  // Calculate transform
  const cardWidthPercent = 100 / perView;
  const gapPx = 24;
  const translateX = currentPage * (perView * cardWidthPercent);

  // Touch/swipe support
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  function handleTouchStart(e) {
    touchStartX.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e) {
    touchEndX.current = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50) {
      if (diff > 0 && canNext) goTo(currentPage + 1);
      if (diff < 0 && canPrev) goTo(currentPage - 1);
    }
  }

  // ── Render ──

  if (loading) {
    return null;
  }

  if (trucks.length === 0) {
    return (
      <section className={styles.section} id="fleet-inventory">
        <div className={styles.inner}>
          <div className={styles.header}>
            <div className={styles.headerText}>
              <span className={styles.label}>
                <span className={styles.labelDot} />
                Fleet Inventory
              </span>
              <h2 className={styles.title}>Trucks for Sale</h2>
            </div>
          </div>
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <Truck size={48} />
            </div>
            <h3 className={styles.emptyTitle}>No Trucks Available</h3>
            <p className={styles.emptyDesc}>
              Our fleet inventory is currently being updated. Check back soon for new listings.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.section} id="fleet-inventory">
      <div className={styles.inner}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerText}>
            <span className={styles.label}>
              <span className={styles.labelDot} />
              Fleet Inventory
            </span>
            <h2 className={styles.title}>Trucks for Sale</h2>
            <p className={styles.subtitle}>
              Browse our selection of heavy-duty commercial vehicles ready for your fleet.
            </p>
          </div>
          <div className={styles.navArrows}>
            <button
              className={styles.navBtn}
              onClick={() => goTo(currentPage - 1)}
              disabled={!canPrev}
              aria-label="Previous trucks"
            >
              <ChevronLeft size={22} />
            </button>
            <button
              className={styles.navBtn}
              onClick={() => goTo(currentPage + 1)}
              disabled={!canNext}
              aria-label="Next trucks"
            >
              <ChevronRight size={22} />
            </button>
          </div>
        </div>

        {/* Carousel */}
        <div
          className={styles.carouselViewport}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className={styles.carouselTrack}
            ref={trackRef}
            style={{
              transform: `translateX(-${currentPage * (100 / totalPages)}%)`,
              width: `${(trucks.length / perView) * 100}%`,
            }}
          >
            {trucks.map((truck) => {
              const imgs = truck.imageUrls?.length ? truck.imageUrls : (truck.imageUrl ? [truck.imageUrl] : []);
              const heroImage = imgs[0] || null;
              const statusInfo = getStatusInfo(truck.status);

              return (
                <div key={truck.id} className={styles.card}>
                  {/* Image */}
                  <div className={styles.cardImageWrap}>
                    {heroImage ? (
                      <Image
                        src={heroImage}
                        alt={truck.name || 'Truck'}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className={styles.cardImage}
                      />
                    ) : (
                      <div style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#111827',
                        color: '#6f7a70',
                      }}>
                        <Truck size={48} />
                      </div>
                    )}
                    {/* Status badge */}
                    <span className={`${styles.statusBadge} ${statusInfo.className}`}>
                      <span className={`${styles.statusDot} ${styles[statusInfo.dotClass] || ''}`}
                        style={{ background: statusInfo.dotClass === 'green' ? '#006837' : statusInfo.dotClass === 'red' ? '#ba1a1a' : '#F59E0B' }}
                      />
                      {statusInfo.label}
                    </span>
                  </div>

                  {/* Body */}
                  <div className={styles.cardBody}>
                    <span className={styles.cardType}>{truck.type || 'Commercial Vehicle'}</span>
                    <h3 className={styles.cardTitle}>{truck.name || 'Unnamed Truck'}</h3>

                    {/* Meta chips */}
                    <div className={styles.cardMeta}>
                      {truck.year && (
                        <span className={styles.metaChip}>
                          <Calendar size={12} />
                          {truck.year}
                        </span>
                      )}
                      {truck.engine && (
                        <span className={styles.metaChip}>
                          <Gauge size={12} />
                          {truck.engine}
                        </span>
                      )}
                      {truck.fuelType && (
                        <span className={styles.metaChip}>
                          <Fuel size={12} />
                          {truck.fuelType}
                        </span>
                      )}
                    </div>

                    <div className={styles.cardDivider} />

                    {/* Footer: Price + CTA */}
                    <div className={styles.cardFooter}>
                      <div>
                        <span className={styles.cardPrice}>{formatPrice(truck.price)}</span>
                        {truck.price && <span className={styles.cardPriceLabel}>Asking Price</span>}
                      </div>
                      <Link href={`/trucks-for-sale/${truck.id}`} className={styles.cardCta}>
                        Details
                        <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer: Dots + View All */}
        <div className={styles.footer}>
          <div className={styles.dots}>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                className={`${styles.dot} ${i === currentPage ? styles.dotActive : ''}`}
                onClick={() => goTo(i)}
                aria-label={`Go to page ${i + 1}`}
              />
            ))}
          </div>
          <Link href="/trucks-for-sale" className={styles.viewAllLink}>
            View All Inventory
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}

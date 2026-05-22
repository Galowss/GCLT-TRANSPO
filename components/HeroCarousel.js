'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getTrucksForSale } from '@/lib/firebaseService';
import styles from './HeroCarousel.module.css';

// Fallback slides if no truck-for-sale data is available
const FALLBACK_SLIDES = [
  {
    image: '/hero-slide-1.jpg',
    badge: 'Featured Fleet',
    title: '2024 Heavy-Duty Long Hauler',
    subtitle: 'Our latest fleet addition — built for the long road, rigged for the heavy load.',
    cta: { label: 'Browse Fleet', href: '/trucks-for-sale' },
  },
  {
    image: '/hero-slide-2.jpg',
    badge: 'Transport Services',
    title: 'SBMA & Olongapo Region Logistics',
    subtitle: 'Reliable freight forwarding across Central Luzon — from SBMA Port to your destination.',
    cta: { label: 'Book a Transport', href: '/dashboard/book' },
  },
  {
    image: '/hero-slide-3.jpg',
    badge: 'Our Fleet',
    title: '50+ Active Commercial Units',
    subtitle: 'A well-maintained fleet of tractor heads, chassis units, and specialized carriers.',
    cta: { label: 'Get a Quote', href: '/login?tab=register' },
  },
];

export default function HeroCarousel() {
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  // Load trucks for sale from Firebase
  useEffect(() => {
    getTrucksForSale().then((trucks) => {
      const FALLBACK_IMGS = ['/hero-slide-1.jpg', '/hero-slide-2.jpg', '/hero-slide-3.jpg'];
      const mapped = trucks.map((truck, idx) => {
        const imgs = truck.imageUrls?.length ? truck.imageUrls : (truck.imageUrl ? [truck.imageUrl] : []);
        const heroImage = imgs[0] || FALLBACK_IMGS[idx % FALLBACK_IMGS.length];
        return {
          id: truck.id,
          image: heroImage,
          badge: truck.type || 'For Sale',
          title: truck.name,
          subtitle: truck.description
            || `${truck.year ? truck.year + ' · ' : ''}${truck.engine ? truck.engine + ' · ' : ''}PHP ${truck.price?.toLocaleString() || 'Contact for price'}`,
          cta: { label: 'View Details', href: `/trucks-for-sale/${truck.id}` },
        };
      });

      setSlides(mapped.length > 0 ? mapped : FALLBACK_SLIDES);
      setLoading(false);
    }).catch(() => {
      setSlides(FALLBACK_SLIDES);
      setLoading(false);
    });
  }, []);

  const goTo = useCallback((index) => {
    setCurrent((index + slides.length) % slides.length);
  }, [slides.length]);

  // Auto-advance every 2 seconds
  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 2000);
    return () => clearInterval(timer);
  }, [paused, slides.length]);

  if (loading) return null;

  return (
    <section
      className={styles.carousel}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-label="Hero image carousel"
    >
      {/* Slides */}
      {slides.map((slide, i) => (
        <div
          key={slide.id ?? `slide-${i}`}
          className={`${styles.slide} ${i === current ? styles.slideActive : ''}`}
          aria-hidden={i !== current}
        >
          {/* Background image — next/image with fill for known URLs, <img> for external data URLs */}
          {slide.image?.startsWith('data:') || slide.image?.startsWith('http') ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={slide.image}
              alt={slide.title}
              className={styles.slideImg}
            />
          ) : (
            <Image
              src={slide.image}
              alt={slide.title}
              fill
              className={styles.slideImg}
              priority={i === 0}
              sizes="100vw"
            />
          )}

          {/* Dark overlay */}
          <div className={styles.overlay} />

          {/* Content */}
          <div className={styles.content}>
            <span className={styles.badge}>{slide.badge}</span>
            <h1 className={styles.title}>{slide.title}</h1>
            <p className={styles.subtitle}>{slide.subtitle}</p>
            <Link href={slide.cta.href} className={styles.ctaBtn}>
              {slide.cta.label}
            </Link>
          </div>
        </div>
      ))}

      {/* Prev / Next arrows */}
      <button
        className={`${styles.arrow} ${styles.arrowLeft}`}
        onClick={() => { setPaused(true); goTo(current - 1); }}
        aria-label="Previous slide"
      >
        <ChevronLeft size={28} />
      </button>
      <button
        className={`${styles.arrow} ${styles.arrowRight}`}
        onClick={() => { setPaused(true); goTo(current + 1); }}
        aria-label="Next slide"
      >
        <ChevronRight size={28} />
      </button>

      {/* Dot indicators */}
      <div className={styles.indicators}>
        {slides.map((slide, i) => (
          <button
            key={slide.id ?? `dot-${i}`}
            className={`${styles.dot} ${i === current ? styles.dotActive : ''}`}
            onClick={() => { setPaused(true); goTo(i); }}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}

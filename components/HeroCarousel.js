'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './HeroCarousel.module.css';

const SLIDES = [
  {
    image: '/hero-slide-1.jpg',
    badge: 'Featured Inventory',
    title: '2024 Heavy-Duty Long Hauler',
    subtitle: 'Our latest fleet addition — built for the long road, rigged for the heavy load.',
    stats: [{ icon: '⚡', label: '500 HP Engine' }, { icon: '🚛', label: 'Heavy Duty' }],
    cta: { label: 'Browse Trucks for Sale', href: '/trucks-for-sale' },
  },
  {
    image: '/hero-slide-2.jpg',
    badge: 'Transport Services',
    title: 'SBMA & Olongapo Region Logistics',
    subtitle: 'Reliable freight forwarding across Central Luzon — from SBMA Port to your destination.',
    stats: [{ icon: '📍', label: 'SBMA Coverage' }, { icon: '⏱️', label: '24/7 Operations' }],
    cta: { label: 'Book a Transport', href: '/dashboard/book' },
  },
  {
    image: '/hero-slide-3.jpg',
    badge: 'Our Fleet',
    title: '50+ Active Commercial Units',
    subtitle: 'A well-maintained fleet of tractor heads, chassis units, and specialized carriers ready for dispatch.',
    stats: [{ icon: '🚚', label: '38 Tractor Heads' }, { icon: '🏗️', label: '85 Chassis Units' }],
    cta: { label: 'Get a Quote', href: '/login?tab=register' },
  },
];

export default function HeroCarousel() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  const goTo = useCallback((index) => {
    setCurrent((index + SLIDES.length) % SLIDES.length);
  }, []);

  // Auto-advance every 5s
  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => goTo(current + 1), 5000);
    return () => clearInterval(timer);
  }, [current, paused, goTo]);

  return (
    <section
      className={styles.carousel}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-label="Hero image carousel"
    >
      {/* Slides */}
      {SLIDES.map((slide, i) => (
        <div
          key={i}
          className={`${styles.slide} ${i === current ? styles.slideActive : ''}`}
          aria-hidden={i !== current}
        >
          {/* Background image */}
          <Image
            src={slide.image}
            alt={slide.title}
            fill
            className={styles.slideImg}
            priority={i === 0}
            sizes="100vw"
          />
          {/* Dark overlay */}
          <div className={styles.overlay} />

          {/* Content */}
          <div className={styles.content}>
            <span className={styles.badge}>{slide.badge}</span>
            <h1 className={styles.title}>{slide.title}</h1>
            <p className={styles.subtitle}>{slide.subtitle}</p>
            <div className={styles.stats}>
              {slide.stats.map((s) => (
                <div key={s.label} className={styles.statItem}>
                  <span>{s.icon}</span>
                  <span>{s.label}</span>
                </div>
              ))}
            </div>
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
        {SLIDES.map((_, i) => (
          <button
            key={i}
            className={`${styles.dot} ${i === current ? styles.dotActive : ''}`}
            onClick={() => { setPaused(true); goTo(i); }}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}

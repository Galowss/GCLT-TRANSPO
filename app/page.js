'use client';

import { useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import HeroCarousel from '@/components/HeroCarousel';
import TruckInventoryCarousel from '@/components/TruckInventoryCarousel';
import Link from 'next/link';
import Image from 'next/image';
import { Truck, ClipboardList, MessageCircle, Shield, Clock, DollarSign, Check, ArrowRight, MapPin, Phone, Mail, Eye, Target } from 'lucide-react';
import styles from './page.module.css';

export default function Home() {
  /* ── Scroll-reveal observer ── */
  useEffect(() => {
    const els = document.querySelectorAll(
      '.reveal, .reveal-left, .reveal-right, .reveal-scale'
    );
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -48px 0px' }
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <Navbar />

      {/* ===== HERO CAROUSEL ===== */}
      <HeroCarousel />

      {/* ===== STATS BAR ===== */}
      <section className={styles.stats}>
        <div className={styles.statsInner}>
          {[
            { value: '38',    label: 'Tractor Units',  delay: '' },
            { value: '85',    label: 'Chassis Units',  delay: 'reveal-delay-1' },
            { value: '24/7',  label: 'Operations',     delay: 'reveal-delay-2' },
            { value: '99.9%', label: 'On-Time Rate',   delay: 'reveal-delay-3' },
          ].map((stat) => (
            <div key={stat.label} className={`${styles.statItem} reveal ${stat.delay}`}>
              <span className={styles.statValue}>{stat.value}</span>
              <span className={styles.statLabel}>{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section className={styles.features}>
        <div className={styles.featuresInner}>
          <h2 className={`${styles.sectionTitle} reveal`}>What We Offer</h2>
          <div className={styles.featureGrid}>
            {[
              {
                icon: Truck,
                title: 'Truck Booking',
                desc: 'Real-time transport across SBMA and Olongapo.',
                color: '#1B7A3D',
                href: '/dashboard/book',
                delay: '',
              },
              {
                icon: ClipboardList,
                title: 'Fleet Sales',
                desc: 'Schedule a viewing and secure your next heavy-duty vehicle.',
                color: '#2DA65C',
                href: '/trucks-for-sale',
                delay: 'reveal-delay-1',
              },
              {
                icon: MessageCircle,
                title: 'AI Assistant',
                desc: '24/7 smart support for bookings and inquiries.',
                color: '#145F2F',
                href: '/dashboard/ai-assistant',
                delay: 'reveal-delay-2',
              },
            ].map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className={`card ${styles.featureCard} reveal ${feature.delay}`}>
                  <div
                    className={styles.featureIcon}
                    style={{ background: feature.color + '15', color: feature.color }}
                  >
                    <Icon size={22} />
                  </div>
                  <h3>{feature.title}</h3>
                  <p>{feature.desc}</p>
                  <Link href={feature.href} className={styles.featureLink}>
                    Get Started <ArrowRight size={14} />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== TRUCK INVENTORY CAROUSEL ===== */}
      <TruckInventoryCarousel />

      {/* ===== LOCAL PARTNER ===== */}
      <section className={styles.partner} id="about">
        <div className={styles.partnerInner}>
          <div className={`${styles.partnerImage} reveal-left`}>
            <div className={styles.partnerImagePlaceholder}>
              <Image
                src="/hero-slide-2.jpg"
                alt="SBMA Port Operations"
                fill
                style={{ objectFit: 'cover', borderRadius: 'var(--border-radius-xl)' }}
              />
              <div className={styles.partnerImageOverlay}>
                <MapPin size={24} />
                <p>SBMA Port Operations</p>
              </div>
            </div>
          </div>
          <div className={`${styles.partnerContent} reveal-right`}>
            <h2>Your SBMA Logistics Partner</h2>
            <p className={styles.partnerDesc}>
              Operating from the heart of the Subic Bay Freeport Zone since 2019 — 
              certified specialists in heavy-duty road freight.
            </p>
            <div className={styles.partnerChecklist}>
              {[
                'Optimized SBMA Port access routes',
                'Secure warehousing on Rizal Highway',
                '24/7 technical support fleet',
                'Certified heavy-duty specialists',
              ].map((item) => (
                <div key={item} className={styles.checkItem}>
                  <span className={styles.checkIcon}><Check size={12} /></span>
                  {item}
                </div>
              ))}
            </div>
            {/* Trust pillars inline */}
            <div className={styles.trustRow}>
              {[
                { icon: Shield,    label: 'GPS-Tracked & Insured' },
                { icon: Clock,     label: 'On-Time Guarantee' },
                { icon: DollarSign,label: 'Transparent Pricing' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className={styles.trustPill}>
                  <Icon size={14} />
                  {label}
                </div>
              ))}
            </div>
            <Link href="/#contact" className={styles.featureLink}>
              Contact Us <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* ===== CONTACT SECTION ===== */}
      <section className={styles.contact} id="contact">
        <div className={styles.contactInner}>
          <h2 className={`${styles.sectionTitle} reveal`}>Get in Touch</h2>
          <div className={styles.contactGrid}>
            {[
              {
                icon: MapPin,
                title: 'Address',
                lines: ['#17 25th St. East Bajac-Bajac, Olongapo City'],
                delay: '',
              },
              {
                icon: Phone,
                title: 'Phone & Fax',
                lines: ['(047) 222-4065', 'Fax: (047) 223-9225'],
                delay: 'reveal-delay-1',
              },
              {
                icon: Phone,
                title: 'Mobile',
                lines: ['Mr. G.C.L. Tan — 0939 925 4863', 'Ms. E.V. Francisco — 0998 562 2567'],
                delay: 'reveal-delay-2',
              },
              {
                icon: Mail,
                title: 'Email',
                email: 'gclttruckingservices@yahoo.com',
                delay: 'reveal-delay-3',
              },
            ].map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.title} className={`${styles.contactCard} reveal-scale ${card.delay}`}>
                  <div className={styles.contactIcon}><Icon size={18} /></div>
                  <h4>{card.title}</h4>
                  {card.lines && card.lines.map((l) => <p key={l}>{l}</p>)}
                  {card.email && (
                    <p>
                      <a href={`mailto:${card.email}`} style={{ color: 'var(--primary)', fontWeight: 600 }}>
                        {card.email}
                      </a>
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== CTA BANNER ===== */}
      <section className={styles.cta}>
        <div className={styles.ctaInner}>
          <h2 className="reveal">Move cargo smarter with GCLT.</h2>
          <Link href="/login?tab=register" className={`btn btn-accent btn-lg reveal reveal-delay-1`} style={{ background: '#fff', color: 'var(--primary)' }}>
            Start Your First Booking
          </Link>
        </div>
      </section>

      <Footer />
    </>
  );
}

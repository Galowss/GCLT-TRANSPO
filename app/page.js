'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import HeroCarousel from '@/components/HeroCarousel';
import TruckInventoryCarousel from '@/components/TruckInventoryCarousel';
import Link from 'next/link';
import Image from 'next/image';
import { Truck, ClipboardList, MessageCircle, Shield, Clock, DollarSign, Check, ArrowRight, MapPin, Phone, Mail, Eye, Target } from 'lucide-react';
import styles from './page.module.css';

export default function Home() {
  return (
    <>
      <Navbar />

      {/* ===== HERO CAROUSEL ===== */}
      <HeroCarousel />

      {/* ===== STATS BAR ===== */}
      <section className={styles.stats}>
        <div className={styles.statsInner}>
          {[
            { value: '38', label: 'Tractor Units' },
            { value: '85', label: 'Chassis Units' },
            { value: '24/7', label: 'Operations' },
            { value: '99.9%', label: 'On-Time Rate' },
          ].map((stat) => (
            <div key={stat.label} className={styles.statItem}>
              <span className={styles.statValue}>{stat.value}</span>
              <span className={styles.statLabel}>{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section className={styles.features}>
        <div className={styles.featuresInner}>
          <h2 className={styles.sectionTitle}>What We Offer</h2>
          <div className={styles.featureGrid}>
            {[
              {
                icon: Truck,
                title: 'Truck Booking',
                desc: 'Real-time transport across SBMA and Olongapo.',
                color: '#1B7A3D',
                href: '/dashboard/book',
              },
              {
                icon: ClipboardList,
                title: 'Fleet Sales',
                desc: 'Schedule a viewing and secure your next heavy-duty vehicle.',
                color: '#2DA65C',
                href: '/trucks-for-sale',
              },
              {
                icon: MessageCircle,
                title: 'AI Assistant',
                desc: '24/7 smart support for bookings and inquiries.',
                color: '#145F2F',
                href: '/dashboard/ai-assistant',
              },
            ].map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className={`card ${styles.featureCard}`}>
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
          <div className={styles.partnerImage}>
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
          <div className={styles.partnerContent}>
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
            {/* Trust pillars inline — removes separate section */}
            <div className={styles.trustRow}>
              {[
                { icon: Shield, label: 'GPS-Tracked & Insured' },
                { icon: Clock,  label: 'On-Time Guarantee' },
                { icon: DollarSign, label: 'Transparent Pricing' },
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
          <h2 className={styles.sectionTitle}>Get in Touch</h2>
          <div className={styles.contactGrid}>
            <div className={styles.contactCard}>
              <div className={styles.contactIcon}><MapPin size={18} /></div>
              <h4>Address</h4>
              <p>#17 25th St. East Bajac-Bajac, Olongapo City</p>
            </div>
            <div className={styles.contactCard}>
              <div className={styles.contactIcon}><Phone size={18} /></div>
              <h4>Phone & Fax</h4>
              <p>(047) 222-4065 &nbsp;·&nbsp; Fax: (047) 223-9225</p>
            </div>
            <div className={styles.contactCard}>
              <div className={styles.contactIcon}><Phone size={18} /></div>
              <h4>Mobile</h4>
              <p>Mr. G.C.L. Tan — 0939 925 4863</p>
              <p>Ms. E.V. Francisco — 0998 562 2567</p>
            </div>
            <div className={styles.contactCard}>
              <div className={styles.contactIcon}><Mail size={18} /></div>
              <h4>Email</h4>
              <p>
                <a href="mailto:gclttruckingservices@yahoo.com" style={{ color: 'var(--primary)', fontWeight: 600 }}>
                  gclttruckingservices@yahoo.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== CTA BANNER ===== */}
      <section className={styles.cta}>
        <div className={styles.ctaInner}>
          <h2>Move cargo smarter with GCLT.</h2>
          <Link href="/login?tab=register" className="btn btn-accent btn-lg" style={{ background: '#fff', color: 'var(--primary)' }}>
            Start Your First Booking
          </Link>
        </div>
      </section>

      <Footer />
    </>
  );
}

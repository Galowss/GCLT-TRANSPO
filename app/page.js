'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import Image from 'next/image';
import { Truck, ClipboardList, MessageCircle, Shield, Clock, DollarSign, Check, ArrowRight, MapPin, Phone, Mail, Eye, Target } from 'lucide-react';
import styles from './page.module.css';

export default function Home() {
  return (
    <>
      <Navbar />

      {/* ===== HERO SECTION ===== */}
      <section className={styles.hero}>
        {/* Logo watermark background */}
        <div className={styles.heroWatermark}>
          <Image
            src="/gclt-logo.png"
            alt=""
            width={600}
            height={600}
            style={{ objectFit: 'contain' }}
            aria-hidden="true"
            priority
          />
        </div>
        <div className={styles.heroInner}>
          <div className={styles.heroContent}>
            <span className={styles.heroBadge}>
              Incorporated 2019 · Domestic Freight Forwarding
            </span>
            <h1 className={styles.heroTitle}>
              <span className={styles.heroHighlight}>GCLT</span> Transport{' '}
              and Trucking Services, Inc.
            </h1>
            <p className={styles.heroDesc}>
              Specializing in Domestic Freight Forwarding, Trucking, Logistics,
              Transhipment and Transportation — serving the Subic Bay Freeport
              Zone and surrounding areas with excellence.
            </p>
            <div className={styles.heroActions}>
              <Link href="/login?tab=register" className="btn btn-accent btn-lg">
                Get Started
              </Link>
              <Link href="/trucks-for-sale" className="btn btn-outline btn-lg">
                Explore Fleet Inventory
              </Link>
            </div>
            <div className={styles.heroSocial}>
              <div className={styles.heroAvatars}>
                <span className={styles.heroAvatar} style={{ background: '#C8E6C9', color: '#2E7D32' }}>G</span>
                <span className={styles.heroAvatar} style={{ background: '#BBDEFB', color: '#1565C0' }}>C</span>
                <span className={styles.heroAvatar} style={{ background: '#FFE0B2', color: '#E65100' }}>L</span>
              </div>
              <span className={styles.heroAvatarText}>
                <strong>500+ Businesses</strong> trust GCLT for their needs
              </span>
            </div>
          </div>
          <div className={styles.heroImage}>
            <div className={styles.heroImagePlaceholder}>
              <Image
                src="/gclt-logo.png"
                alt="GCLT Transport"
                width={120}
                height={120}
                style={{ objectFit: 'contain', filter: 'brightness(0) invert(1)', opacity: 0.3 }}
              />
              <p>Heavy-Duty Transport</p>
            </div>
            <div className={styles.heroStatusBadge}>
              <span className={styles.statusDot}></span>
              Port Operations Normal
            </div>
          </div>
        </div>
      </section>

      {/* ===== STATS BAR ===== */}
      <section className={styles.stats}>
        <div className={styles.statsInner}>
          {[
            { value: '38', label: 'Tractor Head Units', color: '#1B7A3D' },
            { value: '85', label: 'Chassis Units', color: '#2DA65C' },
            { value: '24/7', label: 'Operations', color: '#145F2F' },
            { value: '99.9%', label: 'On-Time Rate', color: '#27AE60' },
          ].map((stat) => (
            <div key={stat.label} className={styles.statItem}>
              <span className={styles.statValue} style={{ color: stat.color }}>
                {stat.value}
              </span>
              <span className={styles.statLabel}>{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section className={styles.features}>
        <div className={styles.featuresInner}>
          <h2 className={styles.sectionTitle}>Engineered for Efficiency</h2>
          <p className={styles.sectionDesc}>
            Whether you&apos;re moving heavy cargo across Olongapo or purchasing a new fleet for your
            business, we&apos;ve digitized the entire logistics workflow.
          </p>
          <div className={styles.featureGrid}>
            {[
              {
                icon: Truck,
                title: 'Online Truck Booking',
                desc: 'Request and receive real-time transport services across SBMA and the broader Olongapo area.',
                color: '#1B7A3D',
                href: '/dashboard/book',
              },
              {
                icon: ClipboardList,
                title: 'Sales Appointments',
                desc: 'Schedule a visit to our fleet sales yard and secure your next heavy-duty vehicle easily and hassle-free.',
                color: '#2DA65C',
                href: '/trucks-for-sale',
              },
              {
                icon: MessageCircle,
                title: 'GCLT AI Assistant',
                desc: '24/7 smart support to track your bookings, check vehicle availability, and make inquiries instantly.',
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
                    Learn More <ArrowRight size={14} />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== MISSION & VISION ===== */}
      <section className={styles.missionVision}>
        <div className={styles.mvInner}>
          <div className={styles.mvCard}>
            <div className={styles.mvIconWrap} style={{ background: '#1B7A3D15', color: '#1B7A3D' }}>
              <Target size={28} />
            </div>
            <h3>Our Mission</h3>
            <p>
              To provide the highest level of transportation services, safe and timely
              deliveries, with fair and competitive pricing. To keep a safe workplace
              for employees and maintain integrity, fairness and honesty with clients
              and business affiliates.
            </p>
          </div>
          <div className={styles.mvCard}>
            <div className={styles.mvIconWrap} style={{ background: '#2DA65C15', color: '#2DA65C' }}>
              <Eye size={28} />
            </div>
            <h3>Our Vision</h3>
            <p>
              To become one of the recognized Leading Road Freight Transportation in
              the country for short and long-distance trucking and transportation of
              goods.
            </p>
          </div>
        </div>
      </section>

      {/* ===== LOCAL PARTNER ===== */}
      <section className={styles.partner}>
        <div className={styles.partnerInner}>
          <div className={styles.partnerImage}>
            <div className={styles.partnerImagePlaceholder}>
              <MapPin size={48} />
              <p>SBMA Port Operations</p>
            </div>
          </div>
          <div className={styles.partnerContent}>
            <h2>Your Local Partner for Global Logistics</h2>
            <p className={styles.partnerDesc}>
              Operating directly from the heart of SBMA, GCLT understands the unique
              regulatory and topographical challenges of the Freeport zone. Our drivers
              are seasoned professionals who know Olongapo and the surrounding
              provinces like the back of their hand.
            </p>
            <div className={styles.partnerChecklist}>
              {[
                'Optimized routes for SBMA Port access',
                'Secure warehousing in Rizal Highway, Olongapo',
                '24/7 technical support fleet on standby',
                'Certified heavy-duty transport specialists',
              ].map((item) => (
                <div key={item} className={styles.checkItem}>
                  <span className={styles.checkIcon}><Check size={12} /></span>
                  {item}
                </div>
              ))}
            </div>
            <Link href="/login" className={styles.featureLink}>
              Contact Us <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* ===== TRUST BADGES ===== */}
      <section className={styles.trust}>
        <div className={styles.trustInner}>
          {[
            { icon: Shield, title: 'Unmatched Security', desc: 'Every shipment is insured and tracked with state-of-the-art GPS systems.' },
            { icon: Clock, title: 'Timely Deliveries', desc: 'Our intelligent routing algorithms minimize downtime and ensure on-time arrivals.' },
            { icon: DollarSign, title: 'Transparent Pricing', desc: 'No hidden fees. What you see in your booking dashboard is exactly what you pay.' },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className={styles.trustItem}>
                <div className={styles.trustIcon}><Icon size={28} /></div>
                <h4>{item.title}</h4>
                <p>{item.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ===== CONTACT SECTION ===== */}
      <section className={styles.contact}>
        <div className={styles.contactInner}>
          <h2 className={styles.sectionTitle}>Get in Touch</h2>
          <p className={styles.sectionDesc}>
            Reach out to our team for bookings, inquiries, or fleet sales appointments.
          </p>
          <div className={styles.contactGrid}>
            <div className={styles.contactCard}>
              <div className={styles.contactIcon}>
                <MapPin size={20} />
              </div>
              <h4>Office Address</h4>
              <p>#17 25th St. East Bajac-Bajac, Olongapo City</p>
            </div>
            <div className={styles.contactCard}>
              <div className={styles.contactIcon}>
                <Phone size={20} />
              </div>
              <h4>Telephone &amp; Fax</h4>
              <p>Tel: (047) 222-4065</p>
              <p>Fax: (047) 223-9225</p>
            </div>
            <div className={styles.contactCard}>
              <div className={styles.contactIcon}>
                <Phone size={20} />
              </div>
              <h4>Mobile Contacts</h4>
              <p><strong>Mr. G.C.L. Tan</strong></p>
              <p>09399254863 / 09175144002</p>
              <p style={{ marginTop: '8px' }}><strong>Ms. E.V. Francisco</strong></p>
              <p>09985622567 / 09178957997</p>
            </div>
            <div className={styles.contactCard}>
              <div className={styles.contactIcon}>
                <Mail size={20} />
              </div>
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
          <h2>Ready to streamline your transport operations in Olongapo?</h2>
          <p>
            Join hundreds of companies in SBMA that rely on GCLT for their
            daily heavy-duty transport needs.
          </p>
          <Link href="/login?tab=register" className="btn btn-accent btn-lg" style={{ background: '#fff', color: 'var(--primary)' }}>
            Start Your First Booking
          </Link>
        </div>
      </section>

      <Footer />
    </>
  );
}

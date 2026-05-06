'use client';

import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { useFirestore } from '@/lib/useFirestore';
import { getTruckById, addPurchaseRequest, addNotification } from '@/lib/firebaseService';
import { useAuth } from '@/lib/AuthContext';
import { useToast } from '@/components/Toast';
import { Truck, Calendar, Check, ArrowLeft, CreditCard, Banknote, ShieldCheck } from 'lucide-react';
import styles from './detail.module.css';

export default function TruckDetail() {
  const params = useParams();
  const { user } = useAuth();
  const { addToast } = useToast();
  const { data: truck, loading: truckLoading } = useFirestore(
    () => getTruckById(params.id),
    [params.id]
  );
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [loading, setLoading] = useState(false);

  const [selectedImage, setSelectedImage] = useState(0);

  if (truckLoading) {
    return (
      <DashboardLayout>
        <div className="spinner-overlay" style={{ height: '60vh' }}>
          <div className="spinner"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!truck) {
    return (
      <DashboardLayout>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: '16px' }}>
          <Truck size={48} color="var(--text-muted)" />
          <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>Truck not found</p>
          <Link href="/trucks-for-sale" className="btn btn-primary">Browse All Trucks</Link>
        </div>
      </DashboardLayout>
    );
  }
  // Combine legacy single image + new multi-image array
  const allImages = truck.imageUrls?.length ? truck.imageUrls : (truck.imageUrl ? [truck.imageUrl] : []);

  const handleBuyNow = async () => {
    if (!user) {
      addToast('Please log in to submit a purchase request.', 'error');
      return;
    }

    setLoading(true);

    const now = new Date();
    const timeString = now.toLocaleString('en-PH', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

    if (paymentMethod === 'stripe') {
      try {
        const res = await fetch('/api/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'purchase',
            truckName: truck.name,
            truckId: truck.id,
            amount: truck.price,
          }),
        });
        const { url } = await res.json();

        // Save purchase request to Firestore
        await addPurchaseRequest({
          truckId: truck.id,
          truckName: truck.name,
          truckPrice: truck.price,
          paymentMethod: 'stripe',
          status: 'Pending Payment',
          userId: user.uid,
          userEmail: user.email,
          userName: user.displayName || 'User',
        });

        // Notify admin
        await addNotification({
          title: 'New Truck Purchase — Online Payment',
          message: `${user.displayName || 'A user'} is purchasing ${truck.name} (PHP ${truck.price?.toLocaleString()}) via Stripe.`,
          type: 'booking',
          isNew: true,
          time: timeString,
          forAdmin: true,
          userId: 'admin',
          userEmail: user.email,
        });

        window.location.href = url;
      } catch (err) {
        addToast('Payment failed. Please try again.', 'error');
        setLoading(false);
      }
    } else {
      try {
        // Save COD purchase request to Firestore
        await addPurchaseRequest({
          truckId: truck.id,
          truckName: truck.name,
          truckPrice: truck.price,
          paymentMethod: 'cod',
          status: 'Pending',
          userId: user.uid,
          userEmail: user.email,
          userName: user.displayName || 'User',
        });

        // Notify user
        await addNotification({
          title: 'Purchase Request Submitted',
          message: `Your purchase request for ${truck.name} (PHP ${truck.price?.toLocaleString()}) has been submitted. A sales representative will contact you to arrange inspection and payment.`,
          type: 'booking',
          isNew: true,
          time: timeString,
          userId: user.uid,
        });

        // Notify admin
        await addNotification({
          title: 'New Truck Purchase Request (COD)',
          message: `${user.displayName || 'A user'} (${user.email}) submitted a purchase request for ${truck.name} — PHP ${truck.price?.toLocaleString()}. Payment method: Cash on Delivery.`,
          type: 'booking',
          isNew: true,
          time: timeString,
          forAdmin: true,
          userId: 'admin',
          userEmail: user.email,
        });

        addToast(`Purchase request submitted for ${truck.name}! A sales representative will contact you shortly.`, 'success');
      } catch (err) {
        addToast('Failed to submit purchase request.', 'error');
      }
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className={styles.container}>
        <div className={styles.inner}>
          <Link href="/trucks-for-sale" className={styles.backLink}>
            <ArrowLeft size={16} /> Back to Fleet Inventory
          </Link>

          <div className={styles.grid}>
            {/* Image Gallery */}
            <div className={styles.gallery}>
              <div className={styles.mainImage}>
                {allImages.length > 0 ? (
                  <img src={allImages[selectedImage] || allImages[0]} alt={truck.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--border-radius-lg)' }} />
                ) : (
                  <div className={styles.imagePlaceholder}>
                    <Truck size={48} />
                    <p>{truck.name}</p>
                  </div>
                )}
                <span className={styles.truckType} style={{ background: truck.typeColor }}>
                  {truck.type}
                </span>
              </div>
              {/* Thumbnail strip */}
              {allImages.length > 1 && (
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px', overflowX: 'auto' }}>
                  {allImages.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedImage(idx)}
                      style={{
                        width: '72px', height: '54px', borderRadius: '8px',
                        overflow: 'hidden', flexShrink: 0, cursor: 'pointer',
                        border: selectedImage === idx ? '2px solid var(--primary)' : '2px solid transparent',
                        opacity: selectedImage === idx ? 1 : 0.6,
                        transition: 'all 0.2s ease', background: 'none', padding: 0,
                      }}
                    >
                      <img src={img} alt={`View ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '6px' }} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Details */}
            <div className={styles.details}>
              <h1>{truck.name}</h1>
              <div className={styles.priceRow}>
                <span className={styles.price}>PHP {truck.price?.toLocaleString()}</span>
                <span className={styles.year} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={14} /> {truck.year}</span>
              </div>

              <p className={styles.description}>{truck.description}</p>

              <div className={styles.specGrid}>
                <div className={styles.specItem}><span className={styles.specLabel}>Engine</span><span className={styles.specValue}>{truck.engine}</span></div>
                <div className={styles.specItem}><span className={styles.specLabel}>Mileage</span><span className={styles.specValue}>{truck.mileage}</span></div>
                <div className={styles.specItem}><span className={styles.specLabel}>Transmission</span><span className={styles.specValue}>{truck.specs?.transmission || 'N/A'}</span></div>
                <div className={styles.specItem}><span className={styles.specLabel}>Horsepower</span><span className={styles.specValue}>{truck.specs?.horsepower || 'N/A'}</span></div>
                <div className={styles.specItem}><span className={styles.specLabel}>GVW</span><span className={styles.specValue}>{truck.specs?.gvw || 'N/A'}</span></div>
                <div className={styles.specItem}><span className={styles.specLabel}>Condition</span><span className={styles.specValue}>{truck.condition}</span></div>
              </div>

              {truck.specs?.features?.length > 0 && (
                <div className={styles.features}>
                  <h4>Key Features</h4>
                  <div className={styles.featureList}>
                    {truck.specs.features.map(f => (
                      <span key={f} className={styles.featureTag}><Check size={12} /> {f}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Payment Selection */}
              <div className={styles.paymentSection}>
                <h4>Payment Method</h4>
                <div className="payment-methods">
                  <div
                    className={`payment-option ${paymentMethod === 'cod' ? 'selected' : ''}`}
                    onClick={() => setPaymentMethod('cod')}
                  >
                    <div className="payment-option-radio"></div>
                    <div className="payment-option-icon"><Banknote size={22} color="var(--success)" /></div>
                    <div className="payment-option-info">
                      <h4>Cash on Delivery</h4>
                      <p>Pay upon inspection and handover</p>
                    </div>
                  </div>
                  <div
                    className={`payment-option ${paymentMethod === 'stripe' ? 'selected' : ''}`}
                    onClick={() => setPaymentMethod('stripe')}
                  >
                    <div className="payment-option-radio"></div>
                    <div className="payment-option-icon"><CreditCard size={22} color="var(--primary)" /></div>
                    <div className="payment-option-info">
                      <h4>Pay Online (Stripe)</h4>
                      <p>Secure reservation deposit via card</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.actions}>
                <button
                  className="btn btn-accent btn-lg"
                  onClick={handleBuyNow}
                  disabled={loading}
                  style={{ flex: 1 }}
                >
                  {loading ? 'Processing...' : paymentMethod === 'stripe' ? 'Reserve Now (Pay Online)' : 'Submit Purchase Request'}
                </button>
                <Link
                  href={`/trucks-for-sale/${truck.id}/viewing`}
                  className="btn btn-outline btn-lg"
                  style={{ flex: 1, gap: '6px' }}
                >
                  <Calendar size={16} /> Schedule Viewing
                </Link>
              </div>

              {!user && (
                <p style={{ fontSize: '0.8rem', color: 'var(--danger)', textAlign: 'center', marginTop: '8px' }}>
                  <Link href="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Log in</Link> to submit a purchase request.
                </p>
              )}

              <p className={styles.locationInfo} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                Available at: {truck.location}
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', padding: '10px 14px', background: 'var(--success-light)', borderRadius: 'var(--border-radius)', fontSize: '0.8rem', color: 'var(--success)' }}>
                <ShieldCheck size={14} /> All purchases are backed by GCLT&apos;s inspection guarantee
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

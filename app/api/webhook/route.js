import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '@/lib/firebase';
import { doc, updateDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  let event;

  try {
    if (webhookSecret && sig) {
      // Verify the webhook signature in production
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } else {
      // Development fallback: parse without verification
      // WARNING: Do not use this in production without a webhook secret
      console.warn('[Webhook] No STRIPE_WEBHOOK_SECRET set — skipping signature verification.');
      event = JSON.parse(body);
    }
  } catch (err) {
    console.error('[Webhook] Verification failed:', err.message);
    return NextResponse.json({ error: 'Webhook verification failed' }, { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const { type, bookingId, truckId, truckName, fleet, pickup, delivery, date } = session.metadata || {};

      const now = new Date();
      const timeString = now.toLocaleString('en-PH', {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });

      if (type === 'booking' && bookingId) {
        try {
          const bookingRef = doc(db, 'bookings', bookingId);
          await updateDoc(bookingRef, {
            status: 'Confirmed',
            paymentStatus: 'paid',
            paymentMethod: 'stripe',
            paidAt: now.toISOString(),
            stripeSessionId: session.id,
            updatedAt: serverTimestamp(),
          });

          // Notify user — payment confirmed
          if (session.customer_email || session.metadata?.userEmail) {
            await addDoc(collection(db, 'notifications'), {
              title: 'Payment Confirmed',
              message: `Your Stripe payment for ${fleet || 'transport booking'} has been confirmed. Your booking is now active.`,
              type: 'booking',
              isNew: true,
              time: timeString,
              userId: session.metadata?.userId || 'anonymous',
              createdAt: serverTimestamp(),
            });
          }

          // Notify admin — payment received
          await addDoc(collection(db, 'notifications'), {
            title: 'Payment Received',
            message: `Stripe payment completed for booking ${bookingId.slice(-6)} (${fleet || 'transport'}). Route: ${pickup || 'N/A'} to ${delivery || 'N/A'}.`,
            type: 'booking',
            isNew: true,
            time: timeString,
            forAdmin: true,
            userId: 'admin',
            createdAt: serverTimestamp(),
          });

          console.log(`[Webhook] Booking ${bookingId} confirmed after Stripe payment.`);
        } catch (err) {
          console.error(`[Webhook] Failed to update booking ${bookingId}:`, err.message);
        }
      } else if (type === 'purchase' && truckId) {
        try {
          // Update the purchase request status
          // Note: We search by truckId since we may not have the purchaseRequest doc ID
          // For now, log the completion
          console.log(`[Webhook] Truck purchase deposit received: ${truckId} (${truckName})`);

          // Notify admin
          await addDoc(collection(db, 'notifications'), {
            title: 'Truck Purchase Payment Received',
            message: `Stripe deposit received for ${truckName || truckId}. Reservation is now active.`,
            type: 'booking',
            isNew: true,
            time: timeString,
            forAdmin: true,
            userId: 'admin',
            createdAt: serverTimestamp(),
          });
        } catch (err) {
          console.error(`[Webhook] Failed to process truck purchase:`, err.message);
        }
      }
      break;
    }

    case 'payment_intent.payment_failed': {
      const intent = event.data.object;
      console.log(`[Webhook] Payment failed: ${intent.id}`);
      break;
    }

    default:
      console.log(`[Webhook] Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}

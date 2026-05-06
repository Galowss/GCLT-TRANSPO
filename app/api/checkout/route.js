import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_fallback');

export async function POST(request) {
  try {
    const body = await request.json();
    const { type, fleetName, truckName, truckId, amount, pickup, delivery, date, bookingId, userId } = body;

    let lineItems;
    let metadata;

    if (type === 'booking') {
      lineItems = [
        {
          price_data: {
            currency: 'php',
            product_data: {
              name: `Transport Booking - ${fleetName}`,
              description: `Route: ${pickup} → ${delivery} | Date: ${date}`,
            },
            unit_amount: Math.round(amount * 100), // Convert to centavos
          },
          quantity: 1,
        },
      ];
      metadata = {
        type: 'booking',
        bookingId: bookingId || '',
        fleet: fleetName,
        pickup,
        delivery,
        date,
        userId: userId || '',
      };
    } else if (type === 'purchase') {
      lineItems = [
        {
          price_data: {
            currency: 'php',
            product_data: {
              name: `Truck Purchase - ${truckName}`,
              description: `Reservation deposit for ${truckName}`,
            },
            unit_amount: Math.round(amount * 100), // Convert to centavos
          },
          quantity: 1,
        },
      ];
      metadata = {
        type: 'purchase',
        truckName,
        truckId,
      };
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/cancel`,
      metadata,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

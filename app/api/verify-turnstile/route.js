import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Verification token is required' },
        { status: 400 }
      );
    }

    const secretKey = process.env.TURNSTILE_SECRET_KEY;
    if (!secretKey) {
      console.error('[Turnstile] Cloudflare secret key is missing from environment variables');
      return NextResponse.json(
        { success: false, error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Call Cloudflare Turnstile siteverify API
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        secret: secretKey,
        response: token,
      }),
    });

    const data = await response.json();

    if (data.success) {
      return NextResponse.json({ success: true });
    } else {
      console.warn('[Turnstile] Verification failed:', data['error-codes']);
      return NextResponse.json(
        { success: false, error: 'Bot verification failed. Please try again.', 'error-codes': data['error-codes'] },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('[Turnstile] Server error:', error?.message || error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred during verification' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/send-notification
 *
 * Dedicated endpoint for sending status notification emails via Mailjet.
 * Supports all GCLT notification types: booking confirmed, in transit,
 * delivery completed, payment received, and admin alerts.
 *
 * Request body:
 *   {
 *     to:   string  – recipient email (or 'admin' to send to GCLT admin inbox)
 *     type: string  – notification type:
 *                     'booking_confirmation', 'booking_status_update',
 *                     'payment_confirmation', 'in_transit',
 *                     'delivery_completed', 'admin_new_booking',
 *                     'quote_sent', 'quote_accepted', 'viewing_confirmation'
 *     data: object  – template-specific data
 *   }
 */

import { NextResponse } from 'next/server';
import { sendEmail, sendAdminEmail } from '@/lib/mailjet';
import templates from '@/lib/emailTemplates';

const VALID_NOTIFICATION_TYPES = [
  'booking_confirmation',
  'booking_status_update',
  'payment_confirmation',
  'in_transit',
  'delivery_completed',
  'admin_new_booking',
  'quote_sent',
  'quote_accepted',
  'viewing_confirmation',
];

export async function POST(request) {
  try {
    const { to, type, data } = await request.json();

    if (!type) {
      return NextResponse.json(
        { error: 'Missing required field: "type"' },
        { status: 400 }
      );
    }

    if (!VALID_NOTIFICATION_TYPES.includes(type)) {
      return NextResponse.json(
        { error: `Invalid notification type: "${type}". Valid types: ${VALID_NOTIFICATION_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    // Check Mailjet credentials
    if (!process.env.MAILJET_API_KEY || !process.env.MAILJET_SECRET_KEY) {
      console.log(`[Notification] Mailjet not configured – would send "${type}" to ${to || 'admin'}`, data);
      return NextResponse.json({
        success: true,
        message: 'Email service not configured (logged to console)',
      });
    }

    const template = templates[type];
    if (!template) {
      return NextResponse.json(
        { error: `Template not found for type: "${type}"` },
        { status: 400 }
      );
    }

    const { subject, html } = template(data || {});

    let result;
    if (type === 'admin_new_booking' || to === 'admin') {
      // Send to the GCLT admin inbox
      result = await sendAdminEmail({ subject, html });
    } else {
      if (!to) {
        return NextResponse.json(
          { error: 'Missing required field: "to" (recipient email)' },
          { status: 400 }
        );
      }
      result = await sendEmail({
        to,
        toName: data?.userName || '',
        subject,
        html,
      });
    }

    console.log(`[Notification] Sent "${type}" to ${to || 'admin'}`);

    return NextResponse.json({
      success: true,
      messageId: result?.Messages?.[0]?.To?.[0]?.MessageID,
    });
  } catch (error) {
    console.error('[Notification] Send error:', error?.message || error);
    return NextResponse.json(
      { error: 'Failed to send notification', details: error?.message },
      { status: 500 }
    );
  }
}

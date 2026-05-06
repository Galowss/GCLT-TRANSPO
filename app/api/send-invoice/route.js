/**
 * POST /api/send-invoice
 *
 * Dedicated endpoint for sending GCLT invoices via Mailjet.
 *
 * Request body:
 *   {
 *     to:           string  – client email
 *     userName:     string  – client name
 *     invoiceNumber: string – invoice reference number
 *     invoiceDate:  string  – date of invoice
 *     dueDate:      string  – payment due date (optional)
 *     items:        array   – line items [{ description, detail, amount }]
 *     tax:          number  – tax amount (optional, default 0)
 *     total:        number  – total amount (optional, calculated if omitted)
 *     truckRoute:   string  – truck/service type
 *     pickup:       string  – pickup location
 *     delivery:     string  – delivery location
 *     paymentMethod: string – 'stripe' or 'cod'
 *     bookingId:    string  – booking reference
 *   }
 */

import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/mailjet';
import templates from '@/lib/emailTemplates';

export async function POST(request) {
  try {
    const body = await request.json();
    const { to } = body;

    if (!to) {
      return NextResponse.json(
        { error: 'Missing required field: "to" (recipient email)' },
        { status: 400 }
      );
    }

    // Check Mailjet credentials
    if (!process.env.MAILJET_API_KEY || !process.env.MAILJET_SECRET_KEY) {
      console.log('[Invoice] Mailjet not configured – would send invoice to', to, body);
      return NextResponse.json({
        success: true,
        message: 'Email service not configured (logged to console)',
      });
    }

    const { subject, html } = templates.booking_invoice(body);

    const result = await sendEmail({
      to,
      toName: body.userName || '',
      subject,
      html,
    });

    console.log(`[Invoice] Sent invoice #${body.invoiceNumber || body.bookingId || '?'} to ${to}`);

    return NextResponse.json({
      success: true,
      messageId: result?.Messages?.[0]?.To?.[0]?.MessageID,
    });
  } catch (error) {
    console.error('[Invoice] Send error:', error?.message || error);
    return NextResponse.json(
      { error: 'Failed to send invoice', details: error?.message },
      { status: 500 }
    );
  }
}

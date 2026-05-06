/**
 * POST /api/send-email
 *
 * Unified email-sending endpoint powered by Mailjet REST API v3.1.
 * Supports all GCLT notification and invoice email types.
 *
 * Request body:
 *   {
 *     to:   string  – recipient email address
 *     type: string  – template key (e.g. 'booking_confirmation', 'booking_invoice')
 *     data: object  – template-specific data payload
 *   }
 */

import { NextResponse } from 'next/server';
import { sendEmail, sendAdminEmail } from '@/lib/mailjet';
import templates from '@/lib/emailTemplates';

export async function POST(request) {
  try {
    const { to, type, data } = await request.json();

    if (!to || !type) {
      return NextResponse.json(
        { error: 'Missing required fields: "to" and "type"' },
        { status: 400 }
      );
    }

    // Validate template exists
    const template = templates[type];
    if (!template) {
      return NextResponse.json(
        { error: `Invalid email type: "${type}". Valid types: ${Object.keys(templates).join(', ')}` },
        { status: 400 }
      );
    }

    // Check if Mailjet credentials are configured
    if (!process.env.MAILJET_API_KEY || !process.env.MAILJET_SECRET_KEY) {
      console.log(`[Email] Mailjet not configured – would send "${type}" to ${to}`, data);
      return NextResponse.json({
        success: true,
        message: 'Email service not configured (logged to console instead)',
      });
    }

    // Generate the email content from the template
    const { subject, html } = template(data || {});

    // Send the email via Mailjet
    const result = await sendEmail({
      to,
      toName: data?.userName || '',
      subject,
      html,
    });

    console.log(`[Email] Sent "${type}" to ${to} via Mailjet`);

    return NextResponse.json({ success: true, messageId: result?.Messages?.[0]?.To?.[0]?.MessageID });
  } catch (error) {
    console.error('[Email] Send error:', error?.message || error);
    return NextResponse.json(
      { error: 'Failed to send email', details: error?.message },
      { status: 500 }
    );
  }
}

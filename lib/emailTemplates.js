/**
 * GCLT Branded Email Templates
 * Professional HTML email templates for all GCLT Transport communications.
 * All templates are mobile-responsive and use the dark green brand palette.
 */

const LOGO_URL = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/gclt-logo.png`;

// ===== Shared layout wrapper =====
function emailLayout(contentHtml, { preheader = '' } = {}) {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <meta http-equiv="X-UA-Compatible" content="IE=edge"/>
    <title>GCLT Transport &amp; Trucking Services</title>
    <!--[if mso]><style>table,td{font-family:Arial,sans-serif;}</style><![endif]-->
  </head>
  <body style="margin:0;padding:0;background:#f4f6f8;font-family:'Inter','Segoe UI',Roboto,Arial,sans-serif;">
    ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;">${preheader}</div>` : ''}
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:32px 0;">
      <tr><td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
          <!-- HEADER -->
          <tr>
            <td style="background:linear-gradient(135deg,#145A2D 0%,#1B7A3D 100%);padding:28px 32px;text-align:center;">
              <img src="${LOGO_URL}" alt="GCLT" width="56" height="56" style="display:block;margin:0 auto 12px;border-radius:50%;border:2px solid rgba(255,255,255,0.25);"/>
              <h1 style="margin:0;color:#ffffff;font-size:1.15rem;font-weight:800;letter-spacing:0.5px;">GCLT Transport &amp; Trucking Services, Inc.</h1>
              <p style="margin:4px 0 0;color:rgba(255,255,255,0.7);font-size:0.75rem;">#17 25th St. East Bajac-Bajac, Olongapo City</p>
            </td>
          </tr>
          <!-- BODY -->
          <tr>
            <td style="padding:32px;">
              ${contentHtml}
            </td>
          </tr>
          <!-- FOOTER -->
          <tr>
            <td style="padding:20px 32px;border-top:1px solid #eaeaea;text-align:center;background:#fafbfc;">
              <p style="margin:0 0 6px;font-size:0.75rem;color:#9e9e9e;font-weight:600;">GCLT Transport &amp; Trucking Services, Inc.</p>
              <p style="margin:0 0 4px;font-size:0.7rem;color:#bdbdbd;">Tel: (047) 222-4065 | Fax: (047) 223-9225</p>
              <p style="margin:0;font-size:0.7rem;color:#bdbdbd;">Email: gclttruckingservices@yahoo.com</p>
            </td>
          </tr>
        </table>
      </td></tr>
    </table>
  </body>
  </html>`;
}

// ===== Helper: info box =====
function infoBox(rows) {
  const rowsHtml = rows
    .map(([label, value]) => `<tr><td style="padding:6px 12px;font-size:0.85rem;font-weight:600;color:#424242;white-space:nowrap;vertical-align:top;">${label}</td><td style="padding:6px 12px;font-size:0.85rem;color:#616161;">${value || 'N/A'}</td></tr>`)
    .join('');
  return `<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7f5;border-radius:8px;border:1px solid #e8efe8;margin:20px 0;">${rowsHtml}</table>`;
}

// ===== Helper: status pill =====
function statusPill(status) {
  const colors = {
    Confirmed: { bg: '#E8F5E9', text: '#2E7D32' },
    'In Transit': { bg: '#E3F2FD', text: '#1565C0' },
    Completed: { bg: '#E8F5E9', text: '#1B5E20' },
    Cancelled: { bg: '#FFEBEE', text: '#C62828' },
    Pending: { bg: '#FFF8E1', text: '#F57F17' },
    Quoted: { bg: '#F3E5F5', text: '#7B1FA2' },
  };
  const c = colors[status] || { bg: '#F5F5F5', text: '#616161' };
  return `<span style="display:inline-block;padding:6px 18px;border-radius:100px;background:${c.bg};color:${c.text};font-weight:700;font-size:0.9rem;">${status}</span>`;
}

// ==================================
//  TEMPLATE DEFINITIONS
// ==================================

const templates = {
  // ─── BOOKING CONFIRMATION ───────────────────
  booking_confirmation: (data) => ({
    subject: `Booking Confirmed – ${data.truckRoute || 'Transport Service'}`,
    html: emailLayout(`
      <h2 style="color:#1B7A3D;margin:0 0 16px;font-size:1.3rem;">Booking Confirmation</h2>
      <p style="color:#616161;line-height:1.6;margin:0 0 16px;">Your transport booking has been submitted successfully. Here are the details:</p>
      ${infoBox([
        ['Service:', data.truckRoute || 'N/A'],
        ['Pickup:', data.pickup || 'N/A'],
        ['Delivery:', data.delivery || 'N/A'],
        ['Date:', data.date || 'N/A'],
        ['Payment:', data.paymentMethod === 'stripe' ? '💳 Online (Stripe)' : '💵 Cash on Delivery'],
      ])}
      <p style="color:#616161;line-height:1.6;">A GCLT representative will contact you shortly to confirm the final details and schedule.</p>
    `, { preheader: 'Your GCLT transport booking has been received' }),
  }),

  // ─── VIEWING APPOINTMENT ────────────────────
  viewing_confirmation: (data) => ({
    subject: `Viewing Scheduled – ${data.truck || 'Fleet Vehicle'}`,
    html: emailLayout(`
      <h2 style="color:#1B7A3D;margin:0 0 16px;font-size:1.3rem;">Viewing Appointment Confirmed</h2>
      <p style="color:#616161;line-height:1.6;margin:0 0 16px;">Your viewing appointment has been scheduled. Details below:</p>
      ${infoBox([
        ['Vehicle:', data.truck || 'N/A'],
        ['Location:', data.location || 'N/A'],
        ['Date:', data.date || 'N/A'],
        ['Time:', data.time || 'N/A'],
      ])}
      <p style="color:#616161;line-height:1.6;">Our sales team in Olongapo will contact you to confirm this appointment.</p>
    `, { preheader: 'Your truck viewing appointment is confirmed' }),
  }),

  // ─── PAYMENT CONFIRMATION ──────────────────
  payment_confirmation: (data) => ({
    subject: `Payment Received – ${data.description || 'GCLT Service'}`,
    html: emailLayout(`
      <div style="text-align:center;margin-bottom:20px;">
        <span style="display:inline-block;width:56px;height:56px;border-radius:50%;background:#E8F5E9;color:#2E7D32;font-size:1.6rem;line-height:56px;font-weight:700;">✓</span>
      </div>
      <h2 style="color:#2E7D32;margin:0 0 16px;font-size:1.3rem;text-align:center;">Payment Successful</h2>
      <p style="color:#616161;line-height:1.6;text-align:center;margin:0 0 16px;">Your payment has been processed successfully.</p>
      ${infoBox([
        ['Description:', data.description || 'N/A'],
        ['Amount:', `PHP ${(data.amount || 0).toLocaleString?.() || data.amount}`],
      ])}
      <p style="color:#616161;line-height:1.6;">Thank you for choosing GCLT Transport & Trucking Services.</p>
    `, { preheader: 'Your GCLT payment was successful' }),
  }),

  // ─── BOOKING STATUS UPDATE ─────────────────
  booking_status_update: (data) => ({
    subject: `Booking Update: ${data.status} – Ref #${data.bookingId || ''}`,
    html: emailLayout(`
      <h2 style="color:#1B7A3D;margin:0 0 16px;font-size:1.3rem;">Booking Status Update</h2>
      <p style="color:#616161;line-height:1.6;margin:0 0 16px;">Your booking <strong>#${data.bookingId || ''}</strong> has been updated.</p>
      <div style="text-align:center;margin:24px 0;">
        ${statusPill(data.status)}
      </div>
      ${data.message ? `<p style="color:#616161;line-height:1.6;background:#f5f5f5;padding:16px;border-radius:8px;margin:16px 0;">${data.message}</p>` : ''}
      <p style="color:#616161;line-height:1.6;">If you have questions, please contact our support team.</p>
    `, { preheader: `Booking #${data.bookingId || ''} is now ${data.status}` }),
  }),

  // ─── QUOTE SENT ────────────────────────────
  quote_sent: (data) => ({
    subject: `Transport Quote Ready — Ref #${data.bookingId || ''}`,
    html: emailLayout(`
      <h2 style="color:#1B7A3D;margin:0 0 16px;font-size:1.3rem;">Your Quote is Ready</h2>
      <p style="color:#616161;line-height:1.6;">Hi ${data.userName || 'Customer'},</p>
      <p style="color:#616161;line-height:1.6;margin:0 0 16px;">We've reviewed your transport request and prepared a quotation for you.</p>
      ${infoBox([
        ['Reference:', `#${data.bookingId || 'N/A'}`],
        ['Service:', data.truckRoute || 'N/A'],
        ['Route:', `${data.pickup || 'N/A'} → ${data.delivery || 'N/A'}`],
      ])}
      <div style="text-align:center;margin:24px 0;padding:20px;background:#f5f7f5;border-radius:8px;border:1px solid #e8efe8;">
        <p style="margin:0;font-size:0.8rem;color:#888;">Quoted Amount</p>
        <p style="margin:4px 0 0;font-size:2rem;font-weight:800;color:#1B7A3D;">PHP ${(data.amount || 0).toLocaleString?.() || data.amount}</p>
      </div>
      <p style="color:#616161;line-height:1.6;">Log in to your GCLT dashboard to accept or decline this quote.</p>
    `, { preheader: `Your GCLT transport quote is PHP ${data.amount || ''}` }),
  }),

  // ─── QUOTE ACCEPTED ───────────────────────
  quote_accepted: (data) => ({
    subject: `Quote Accepted — Ref #${data.bookingId || ''}`,
    html: emailLayout(`
      <h2 style="color:#2E7D32;margin:0 0 16px;font-size:1.3rem;">✓ Quote Accepted & Confirmed</h2>
      <p style="color:#616161;line-height:1.6;margin:0 0 16px;">Your transport booking has been confirmed. Details below:</p>
      ${infoBox([
        ['Reference:', `#${data.bookingId || 'N/A'}`],
        ['Service:', data.truckRoute || 'N/A'],
        ['Route:', `${data.pickup || 'N/A'} → ${data.delivery || 'N/A'}`],
        ['Date:', data.date || 'N/A'],
        ['Amount:', `PHP ${(data.amount || 0).toLocaleString?.() || data.amount}`],
        ['Payment:', data.paymentMethod === 'stripe' ? '💳 Online (Stripe)' : '💵 Cash on Delivery'],
      ])}
      <p style="color:#616161;line-height:1.6;">A GCLT representative will coordinate your transport schedule.</p>
    `, { preheader: 'Your GCLT booking is confirmed' }),
  }),

  // ─── IN TRANSIT NOTIFICATION ──────────────
  in_transit: (data) => ({
    subject: `Delivery In Transit — Ref #${data.bookingId || ''}`,
    html: emailLayout(`
      <h2 style="color:#1565C0;margin:0 0 16px;font-size:1.3rem;">🚚 Your Delivery is In Transit</h2>
      <p style="color:#616161;line-height:1.6;margin:0 0 16px;">Your shipment is now on its way to the destination.</p>
      ${infoBox([
        ['Reference:', `#${data.bookingId || 'N/A'}`],
        ['Route:', `${data.pickup || 'N/A'} → ${data.delivery || 'N/A'}`],
        ['Truck:', data.truckRoute || 'N/A'],
      ])}
      <p style="color:#616161;line-height:1.6;">You will receive another notification once the delivery is complete.</p>
    `, { preheader: 'Your GCLT shipment is on its way' }),
  }),

  // ─── DELIVERY COMPLETED ───────────────────
  delivery_completed: (data) => ({
    subject: `Delivery Completed — Ref #${data.bookingId || ''}`,
    html: emailLayout(`
      <div style="text-align:center;margin-bottom:20px;">
        <span style="display:inline-block;width:56px;height:56px;border-radius:50%;background:#E8F5E9;color:#2E7D32;font-size:1.6rem;line-height:56px;font-weight:700;">✓</span>
      </div>
      <h2 style="color:#2E7D32;margin:0 0 16px;font-size:1.3rem;text-align:center;">Delivery Completed</h2>
      <p style="color:#616161;line-height:1.6;text-align:center;margin:0 0 16px;">Your shipment has been delivered successfully.</p>
      ${infoBox([
        ['Reference:', `#${data.bookingId || 'N/A'}`],
        ['Route:', `${data.pickup || 'N/A'} → ${data.delivery || 'N/A'}`],
      ])}
      <p style="color:#616161;line-height:1.6;">Thank you for choosing GCLT Transport & Trucking Services. We look forward to serving you again.</p>
    `, { preheader: 'Your GCLT delivery is complete' }),
  }),

  // ─── ADMIN: NEW BOOKING RECEIVED ──────────
  admin_new_booking: (data) => ({
    subject: `[New Booking] ${data.userName || 'Customer'} — ${data.truckRoute || 'Transport'}`,
    html: emailLayout(`
      <h2 style="color:#1B7A3D;margin:0 0 16px;font-size:1.3rem;">📋 New Booking Received</h2>
      <p style="color:#616161;line-height:1.6;margin:0 0 16px;">A new transport booking has been submitted and requires attention.</p>
      ${infoBox([
        ['Customer:', data.userName || 'N/A'],
        ['Email:', data.userEmail || 'N/A'],
        ['Service:', data.truckRoute || 'N/A'],
        ['Pickup:', data.pickup || 'N/A'],
        ['Delivery:', data.delivery || 'N/A'],
        ['Date:', data.date || 'N/A'],
        ['Payment:', data.paymentMethod === 'stripe' ? '💳 Online (Stripe)' : '💵 Cash on Delivery'],
      ])}
      <div style="text-align:center;margin-top:24px;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/bookings" style="display:inline-block;padding:12px 28px;background:#1B7A3D;color:#fff;font-weight:700;border-radius:8px;text-decoration:none;font-size:0.9rem;">View in Admin Panel →</a>
      </div>
    `, { preheader: `New booking from ${data.userName || 'customer'}` }),
  }),

  // ─── INVOICE ──────────────────────────────
  booking_invoice: (data) => {
    const items = data.items || [
      { description: data.truckRoute || 'Transport Service', detail: `${data.pickup || ''} → ${data.delivery || ''}`, amount: data.amount || 0 },
    ];
    const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    const tax = data.tax || 0;
    const total = data.total || (subtotal + tax);

    const itemRows = items.map(item => `
      <tr>
        <td style="padding:12px;border-bottom:1px solid #eee;">
          <strong style="color:#333;">${item.description}</strong><br/>
          <span style="font-size:0.8rem;color:#888;">${item.detail || ''}</span>
        </td>
        <td style="padding:12px;text-align:right;font-weight:600;border-bottom:1px solid #eee;color:#333;">
          PHP ${(parseFloat(item.amount) || 0).toLocaleString()}
        </td>
      </tr>
    `).join('');

    return {
      subject: `Invoice #${data.invoiceNumber || data.bookingId || ''} — GCLT Transport`,
      html: emailLayout(`
        <!-- Invoice Header Info -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
          <tr>
            <td style="vertical-align:top;">
              <p style="margin:0;font-weight:700;color:#333;font-size:0.9rem;">Invoice To:</p>
              <p style="margin:4px 0 0;color:#616161;font-size:0.9rem;">${data.userName || 'Customer'}</p>
              <p style="margin:2px 0;color:#888;font-size:0.8rem;">${data.userEmail || ''}</p>
              ${data.userPhone ? `<p style="margin:2px 0;color:#888;font-size:0.8rem;">${data.userPhone}</p>` : ''}
            </td>
            <td style="vertical-align:top;text-align:right;">
              <p style="margin:0;font-weight:800;color:#1B7A3D;font-size:1.1rem;">INVOICE</p>
              <p style="margin:4px 0 0;color:#333;font-size:0.85rem;font-weight:600;">#${data.invoiceNumber || data.bookingId || 'N/A'}</p>
              <p style="margin:4px 0 0;color:#888;font-size:0.8rem;">Date: ${data.invoiceDate || data.date || new Date().toLocaleDateString('en-PH')}</p>
              ${data.dueDate ? `<p style="margin:2px 0;color:#888;font-size:0.8rem;">Due: ${data.dueDate}</p>` : ''}
            </td>
          </tr>
        </table>

        <!-- Line Items Table -->
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 16px;">
          <thead>
            <tr style="background:#f5f7f5;">
              <th style="padding:12px;text-align:left;font-size:0.8rem;color:#616161;font-weight:600;border-bottom:2px solid #e0e0e0;">Description</th>
              <th style="padding:12px;text-align:right;font-size:0.8rem;color:#616161;font-weight:600;border-bottom:2px solid #e0e0e0;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${itemRows}
          </tbody>
          <tfoot>
            ${tax > 0 ? `
            <tr>
              <td style="padding:10px 12px;text-align:right;font-size:0.85rem;color:#888;">Subtotal</td>
              <td style="padding:10px 12px;text-align:right;font-size:0.85rem;color:#616161;">PHP ${subtotal.toLocaleString()}</td>
            </tr>
            <tr>
              <td style="padding:10px 12px;text-align:right;font-size:0.85rem;color:#888;">Tax</td>
              <td style="padding:10px 12px;text-align:right;font-size:0.85rem;color:#616161;">PHP ${tax.toLocaleString()}</td>
            </tr>` : ''}
            <tr style="background:#f5f7f5;">
              <td style="padding:14px 12px;font-weight:800;font-size:1rem;color:#333;">Total Due</td>
              <td style="padding:14px 12px;text-align:right;font-weight:800;font-size:1.15rem;color:#1B7A3D;">PHP ${total.toLocaleString()}</td>
            </tr>
          </tfoot>
        </table>

        <!-- Payment Method -->
        <div style="background:#E8F5E9;padding:14px;border-radius:8px;margin:16px 0;text-align:center;">
          <p style="margin:0;font-size:0.85rem;color:#2E7D32;font-weight:600;">
            Payment Method: ${data.paymentMethod === 'stripe' ? '💳 Paid Online (Stripe)' : '💵 Cash on Delivery'}
          </p>
        </div>

        <p style="color:#9E9E9E;font-size:0.75rem;text-align:center;margin-top:20px;">
          This is an auto-generated invoice. For questions, contact GCLT Transport at (047) 222-4065 or gclttruckingservices@yahoo.com.
        </p>
      `, { preheader: `Invoice #${data.invoiceNumber || data.bookingId || ''} from GCLT Transport` }),
    };
  },
};

export default templates;

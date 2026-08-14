import Navbar from '@/components/Navbar';

export const metadata = {
  title: 'Privacy Policy — GCLT Transport & Trucking Services',
  description: 'Data Privacy Policy of GCLT Transport & Trucking Services, aligned with RA 10173 (Data Privacy Act of the Philippines).',
};

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '80px 24px 60px', fontFamily: 'Inter, sans-serif', color: '#181d19', lineHeight: '1.8' }}>
        <div style={{ marginBottom: '40px' }}>
          <p style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.1em', color: '#6f7a70', textTransform: 'uppercase' }}>Legal</p>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#00522c', margin: '8px 0 12px' }}>Privacy Policy</h1>
          <p style={{ color: '#6f7a70', fontSize: '0.875rem' }}>Last updated: August 14, 2026 &nbsp;|&nbsp; Aligned with RA 10173 — Data Privacy Act of the Philippines</p>
          <div style={{ marginTop: '16px', padding: '12px 16px', background: '#f0f5ee', borderRadius: '8px', borderLeft: '4px solid #00522c', fontSize: '0.875rem', color: '#3f4941' }}>
            GCLT Transport &amp; Trucking Services, Inc. is committed to protecting the privacy and security of your personal data in compliance with <strong>Republic Act No. 10173</strong> (Data Privacy Act of 2012) and its Implementing Rules and Regulations.
          </div>
        </div>

        <Section title="1. Data Controller Information">
          <strong>GCLT Transport &amp; Trucking Services, Inc.</strong> is the Personal Information Controller (PIC) responsible for your personal data.<br /><br />
          Address: #17 25th St. East Bajac-Bajac, Olongapo City, Philippines<br />
          Tel: (047) 222-4065 | Email: gclttruckingservices@yahoo.com
        </Section>

        <Section title="2. Personal Data We Collect">
          We collect the following categories of personal data:
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '12px', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: '#f0f5ee' }}>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: '#3f4941', borderBottom: '2px solid #bec9be' }}>Data Category</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: '#3f4941', borderBottom: '2px solid #bec9be' }}>Specific Data Points</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Identity Data', 'Full name, date of birth'],
                ['Contact Data', 'Email address, mobile phone number'],
                ['Account Data', 'Password (encrypted), account role'],
                ['Booking Data', 'Pickup/delivery addresses, cargo type, weight, dimensions, preferred time slot, truck quantity'],
                ['Location Data', 'Geolocation coordinates (when you use "Use My Location" — only with your explicit consent)'],
                ['Payment Data', 'Transaction ID, payment method (Stripe or COD). Card details are processed directly by Stripe; we do not store card numbers.'],
                ['Technical Data', 'IP address, browser type, device type, pages visited, session duration (via server logs)'],
                ['Uploaded Files', 'Proof-of-payment receipt images (for COD bookings)'],
              ].map(([cat, data], i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f6fbf3' }}>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #ebefe8', fontWeight: 600, whiteSpace: 'nowrap', verticalAlign: 'top' }}>{cat}</td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #ebefe8', color: '#5f5e5e' }}>{data}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        <Section title="3. Purpose and Legal Basis of Processing">
          We process your personal data for the following purposes:
          <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
            <li><strong>Booking fulfillment:</strong> To process quote requests, confirm bookings, dispatch trucks, and issue invoices. <em>(Legal basis: Contractual necessity)</em></li>
            <li><strong>Account management:</strong> To create and maintain your user account, verify your identity, and provide customer support. <em>(Legal basis: Contractual necessity)</em></li>
            <li><strong>Email notifications:</strong> To send booking confirmations, status updates, invoices, and service announcements. <em>(Legal basis: Legitimate interest; consent for marketing)</em></li>
            <li><strong>Age verification:</strong> To ensure you meet the 18+ registration requirement. <em>(Legal basis: Compliance with terms)</em></li>
            <li><strong>Security:</strong> To detect and prevent fraud, unauthorized access, and bot activity (via Cloudflare Turnstile). <em>(Legal basis: Legitimate interest)</em></li>
            <li><strong>Legal compliance:</strong> To comply with Philippine tax, transport, and record-keeping laws. <em>(Legal basis: Legal obligation)</em></li>
          </ul>
        </Section>

        <Section title="4. Data Retention">
          <ul style={{ paddingLeft: '20px' }}>
            <li><strong>Account data:</strong> Retained for as long as your account is active. Deleted within 30 days of a verified account deletion request.</li>
            <li><strong>Booking records:</strong> Retained for 7 years in compliance with BIR requirements (RA 8792, E-Commerce Act).</li>
            <li><strong>Payment records:</strong> Retained for 5 years per BSP and AMLC regulations.</li>
            <li><strong>Server logs:</strong> Retained for 90 days, then purged.</li>
          </ul>
        </Section>

        <Section title="5. Third-Party Data Processors">
          We share your data only with processors who help us deliver our services, bound by data processing agreements:
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '12px', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: '#f0f5ee' }}>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: '#3f4941', borderBottom: '2px solid #bec9be' }}>Processor</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: '#3f4941', borderBottom: '2px solid #bec9be' }}>Purpose</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 700, color: '#3f4941', borderBottom: '2px solid #bec9be' }}>Location</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Firebase (Google)', 'Authentication, database, file storage', 'USA (adequacy safeguards)'],
                ['Mailjet (Sinch)', 'Transactional email delivery', 'EU (GDPR compliant)'],
                ['Stripe', 'Payment processing', 'USA (PCI-DSS compliant)'],
                ['Cloudflare', 'Bot protection (Turnstile)', 'USA'],
                ['OpenStreetMap / Nominatim', 'Map display and address geocoding', 'EU (open-source, anonymized)'],
              ].map(([proc, purpose, loc], i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f6fbf3' }}>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #ebefe8', fontWeight: 600 }}>{proc}</td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #ebefe8', color: '#5f5e5e' }}>{purpose}</td>
                  <td style={{ padding: '10px 12px', borderBottom: '1px solid #ebefe8', color: '#5f5e5e' }}>{loc}</td>
                </tr>
              ))}
            </tbody>
          </table>
          We do not sell, rent, or trade your personal data to third parties for marketing purposes.
        </Section>

        <Section title="6. Your Rights Under RA 10173">
          As a data subject, you have the following rights which you may exercise by contacting us:
          <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
            <li><strong>Right to be Informed:</strong> To know how your data is collected and used (this Policy).</li>
            <li><strong>Right to Access:</strong> To obtain a copy of the personal data we hold about you.</li>
            <li><strong>Right to Rectification:</strong> To correct inaccurate or incomplete data. You can update most data directly via your Dashboard → Profile.</li>
            <li><strong>Right to Erasure / Blocking:</strong> To request deletion or blocking of your personal data when it is no longer necessary for the stated purpose, subject to legal retention requirements.</li>
            <li><strong>Right to Data Portability:</strong> To receive your data in a structured, machine-readable format.</li>
            <li><strong>Right to Object:</strong> To object to processing based on legitimate interests.</li>
            <li><strong>Right to Lodge a Complaint:</strong> To file a complaint with the <strong>National Privacy Commission (NPC)</strong> at www.privacy.gov.ph.</li>
          </ul>
          To exercise these rights, email us at: <strong>gclttruckingservices@yahoo.com</strong> with subject "Privacy Request — [Your Full Name]".
          We will respond within <strong>15 business days</strong>.
        </Section>

        <Section title="7. Security Measures">
          We implement the following technical and organizational measures to protect your data:
          <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
            <li>All data in transit is encrypted using TLS/HTTPS.</li>
            <li>Passwords are hashed using Firebase Authentication (bcrypt-based).</li>
            <li>Firestore security rules restrict access to authenticated users and their own data only.</li>
            <li>Payment card data is never stored on our servers — processed directly by Stripe (PCI-DSS Level 1).</li>
            <li>Admin access is protected by role-based access control.</li>
          </ul>
        </Section>

        <Section title="8. Cookies and Tracking">
          We use session cookies for authentication (managed by Firebase Auth). We do not use third-party advertising or tracking cookies. You may disable cookies in your browser settings, but this may affect Platform functionality.
        </Section>

        <Section title="9. Changes to this Policy">
          We may update this Privacy Policy as our practices change or as required by law. We will notify registered users by email and update the "Last updated" date above. Continued use of the Platform after changes constitutes acceptance.
        </Section>

        <Section title="10. Contact Our Data Protection Officer">
          For privacy concerns or requests:<br /><br />
          <strong>Data Protection Officer</strong><br />
          GCLT Transport &amp; Trucking Services, Inc.<br />
          #17 25th St. East Bajac-Bajac, Olongapo City, Philippines<br />
          Email: gclttruckingservices@yahoo.com<br />
          Tel: (047) 222-4065
        </Section>

        <div style={{ marginTop: '48px', padding: '16px', background: '#f6fbf3', borderRadius: '8px', border: '1px solid #bec9be', fontSize: '0.8rem', color: '#6f7a70' }}>
          <a href="/legal/terms" style={{ color: '#00522c', fontWeight: 700 }}>← Terms &amp; Conditions</a>
          &nbsp;&nbsp;|&nbsp;&nbsp;
          <a href="/login?tab=register" style={{ color: '#00522c', fontWeight: 700 }}>Return to Registration →</a>
        </div>
      </div>
    </>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: '32px' }}>
      <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#181d19', marginBottom: '10px', paddingBottom: '8px', borderBottom: '1px solid #ebefe8' }}>{title}</h2>
      <div style={{ fontSize: '0.9rem', color: '#3f4941' }}>{children}</div>
    </div>
  );
}

import Navbar from '@/components/Navbar';

export const metadata = {
  title: 'Terms & Conditions — GCLT Transport & Trucking Services',
  description: 'Terms and Conditions governing the use of GCLT Transport & Trucking Services booking platform.',
};

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '80px 24px 60px', fontFamily: 'Inter, sans-serif', color: '#181d19', lineHeight: '1.8' }}>
        <div style={{ marginBottom: '40px' }}>
          <p style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.1em', color: '#6f7a70', textTransform: 'uppercase' }}>Legal</p>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#00522c', margin: '8px 0 12px' }}>Terms &amp; Conditions</h1>
          <p style={{ color: '#6f7a70', fontSize: '0.875rem' }}>Last updated: August 14, 2026 &nbsp;|&nbsp; Effective immediately upon registration</p>
        </div>

        <Section title="1. Acceptance of Terms">
          By creating an account and using the GCLT Transport &amp; Trucking Services online booking platform ("Platform"), you confirm that you have read, understood, and agree to be bound by these Terms &amp; Conditions. If you do not agree, you must not use the Platform.
        </Section>

        <Section title="2. Eligibility">
          You must be at least <strong>18 years of age</strong> to register and use this Platform. By registering, you represent that the information you have provided, including your date of birth, is accurate and truthful.
        </Section>

        <Section title="3. Scope of Services">
          GCLT Transport &amp; Trucking Services, Inc. ("GCLT") provides logistics and trucking services within the <strong>Subic Bay Metropolitan Authority (SBMA) and Olongapo City</strong> service area, including adjoining municipalities. The Platform allows registered users to:
          <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
            <li>Request transport and logistics quotations</li>
            <li>Book available truck fleet types for cargo transport</li>
            <li>Track booking statuses in real time</li>
            <li>View appointment schedules for truck sales</li>
            <li>Make secure online payments through Stripe</li>
          </ul>
        </Section>

        <Section title="4. Bookings and Quotations">
          <ul style={{ paddingLeft: '20px' }}>
            <li>All bookings begin as a <em>Quote Request</em>. No booking is confirmed until GCLT sets a quoted price and the user explicitly accepts it.</li>
            <li>GCLT reserves the right to decline any booking request without prior notice.</li>
            <li>Once a quote is accepted and payment is made or a COD agreement is reached, the booking is considered <em>Confirmed</em>.</li>
            <li>Bookings are only available between <strong>8:00 AM and 6:00 PM</strong>, Monday through Saturday. Sunday and public holiday requests are subject to approval and surcharge.</li>
          </ul>
        </Section>

        <Section title="5. Payment Terms">
          <ul style={{ paddingLeft: '20px' }}>
            <li><strong>Stripe (Online Payment):</strong> Processed via Stripe's secure payment infrastructure. All charges are in Philippine Peso (PHP). Upon successful payment, a confirmation email with an invoice will be sent to your registered email address.</li>
            <li><strong>Cash on Delivery (COD):</strong> Payment is collected by the assigned driver at the point of delivery. A proof-of-payment receipt must be uploaded to the Platform within 24 hours of delivery to complete the booking record.</li>
            <li>GCLT is not liable for payment processing failures caused by your bank, card issuer, or third-party payment processor.</li>
          </ul>
        </Section>

        <Section title="6. Cancellation Policy">
          <ul style={{ paddingLeft: '20px' }}>
            <li>Cancellations made <strong>more than 24 hours</strong> before the scheduled pickup time: No charge.</li>
            <li>Cancellations made <strong>less than 24 hours</strong> before pickup: Subject to a cancellation fee of up to 20% of the quoted amount.</li>
            <li>No-shows (failure to present cargo at pickup without prior notice): Subject to a fee of up to 30% of the quoted amount.</li>
            <li>To cancel a booking, use the <em>My Bookings</em> section in your dashboard.</li>
          </ul>
        </Section>

        <Section title="7. User Responsibilities">
          You agree to:
          <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
            <li>Provide accurate cargo details (weight, dimensions, type) when booking. Misrepresentation may result in additional charges.</li>
            <li>Ensure cargo is properly packaged and ready for transport at the agreed pickup time.</li>
            <li>Comply with all applicable Philippine laws on the transport of goods, including RA 4136 (Land Transportation &amp; Traffic Code) and relevant SBMA regulations.</li>
            <li>Not use this Platform for illegal, fraudulent, or harmful activities.</li>
          </ul>
        </Section>

        <Section title="8. Prohibited Cargo">
          GCLT does not transport the following without prior written authorization:
          <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
            <li>Illegal substances or contraband</li>
            <li>Hazardous materials without proper MSDS documentation</li>
            <li>Live animals without veterinary clearance</li>
            <li>Goods that violate customs or import/export regulations</li>
          </ul>
        </Section>

        <Section title="9. Intellectual Property">
          All content on this Platform — including logos, text, design, and software — is owned by GCLT and protected under applicable Philippine intellectual property laws. You may not reproduce, distribute, or create derivative works without prior written consent.
        </Section>

        <Section title="10. Limitation of Liability">
          To the fullest extent permitted by law, GCLT shall not be liable for:
          <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
            <li>Loss or damage to cargo caused by force majeure events (typhoons, floods, earthquakes, acts of government)</li>
            <li>Indirect, incidental, or consequential damages arising from use of the Platform</li>
            <li>Delays caused by traffic, road closures, or SBMA gate access restrictions</li>
          </ul>
          GCLT's maximum liability for any claim shall not exceed the amount paid for the specific booking in dispute.
        </Section>

        <Section title="11. Modifications">
          GCLT reserves the right to update these Terms at any time. Continued use of the Platform after changes are published constitutes acceptance of the revised Terms.
        </Section>

        <Section title="12. Governing Law">
          These Terms are governed by the laws of the <strong>Republic of the Philippines</strong>. Any disputes shall be resolved in the proper courts of <strong>Olongapo City</strong>, Philippines.
        </Section>

        <Section title="13. Contact">
          For questions about these Terms, contact us at:<br />
          <strong>GCLT Transport &amp; Trucking Services, Inc.</strong><br />
          #17 25th St. East Bajac-Bajac, Olongapo City<br />
          Tel: (047) 222-4065 | Email: gclttruckingservices@yahoo.com
        </Section>

        <div style={{ marginTop: '48px', padding: '16px', background: '#f6fbf3', borderRadius: '8px', border: '1px solid #bec9be', fontSize: '0.8rem', color: '#6f7a70' }}>
          <a href="/login?tab=register" style={{ color: '#00522c', fontWeight: 700 }}>← Return to Registration</a>
          &nbsp;&nbsp;|&nbsp;&nbsp;
          <a href="/legal/privacy" style={{ color: '#00522c', fontWeight: 700 }}>Privacy Policy →</a>
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

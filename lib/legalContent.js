// Single source of truth for the legal document content shown in the
// registration Terms & Conditions / Privacy modal.
// The full standalone pages remain at /legal/terms and /legal/privacy.

export const LEGAL_DOCS = {
  terms: {
    title: 'Terms & Conditions',
    lastUpdated: 'Last updated: August 14, 2026 | Effective immediately upon registration',
    intro:
      'By creating an account and using the GCLT Transport & Trucking Services online booking platform ("Platform"), you confirm that you have read, understood, and agree to be bound by these Terms & Conditions.',
    sections: [
      {
        heading: '1. Acceptance of Terms',
        paragraphs: [
          'By creating an account and using the GCLT Transport & Trucking Services online booking platform ("Platform"), you confirm that you have read, understood, and agree to be bound by these Terms & Conditions. If you do not agree, you must not use the Platform.',
        ],
        bullets: [],
      },
      {
        heading: '2. Eligibility',
        paragraphs: [
          'You must be at least 18 years of age to register and use this Platform. By registering, you represent that the information you have provided, including your date of birth, is accurate and truthful.',
        ],
        bullets: [],
      },
      {
        heading: '3. Scope of Services',
        paragraphs: [
          'GCLT Transport & Trucking Services, Inc. ("GCLT") provides logistics and trucking services within the Subic Bay Metropolitan Authority (SBMA) and Olongapo City service area, including adjoining municipalities. The Platform allows registered users to:',
        ],
        bullets: [
          'Request transport and logistics quotations',
          'Book available truck fleet types for cargo transport',
          'Track booking statuses in real time',
          'View appointment schedules for truck sales',
          'Make secure online payments through Stripe',
        ],
      },
      {
        heading: '4. Bookings and Quotations',
        paragraphs: [
          'All bookings begin as a Quote Request. No booking is confirmed until GCLT sets a quoted price and the user explicitly accepts it. GCLT reserves the right to decline any booking request without prior notice. Once a quote is accepted and payment is made or a COD agreement is reached, the booking is considered Confirmed. Bookings are only available between 8:00 AM and 6:00 PM, Monday through Saturday. Sunday and public holiday requests are subject to approval and surcharge.',
        ],
        bullets: [],
      },
      {
        heading: '5. Payment Terms',
        paragraphs: [
          'Stripe (Online Payment): Processed via Stripe\'s secure payment infrastructure. All charges are in Philippine Peso (PHP). Upon successful payment, a confirmation email with an invoice will be sent to your registered email address.',
          'Cash on Delivery (COD): Payment is collected by the assigned driver at the point of delivery. A proof-of-payment receipt must be uploaded to the Platform within 24 hours of delivery to complete the booking record.',
          'GCLT is not liable for payment processing failures caused by your bank, card issuer, or third-party payment processor.',
        ],
        bullets: [],
      },
      {
        heading: '6. Cancellation Policy',
        paragraphs: [],
        bullets: [
          'Cancellations made more than 24 hours before the scheduled pickup time: No charge.',
          'Cancellations made less than 24 hours before pickup: Subject to a cancellation fee of up to 20% of the quoted amount.',
          'No-shows (failure to present cargo at pickup without prior notice): Subject to a fee of up to 30% of the quoted amount.',
          'To cancel a booking, use the My Bookings section in your dashboard.',
        ],
      },
      {
        heading: '7. User Responsibilities',
        paragraphs: ['You agree to:'],
        bullets: [
          'Provide accurate cargo details (weight, dimensions, type) when booking. Misrepresentation may result in additional charges.',
          'Ensure cargo is properly packaged and ready for transport at the agreed pickup time.',
          'Comply with all applicable Philippine laws on the transport of goods, including RA 4136 (Land Transportation & Traffic Code) and relevant SBMA regulations.',
          'Not use this Platform for illegal, fraudulent, or harmful activities.',
        ],
      },
      {
        heading: '8. Prohibited Cargo',
        paragraphs: ['GCLT does not transport the following without prior written authorization:'],
        bullets: [
          'Illegal substances or contraband',
          'Hazardous materials without proper MSDS documentation',
          'Live animals without veterinary clearance',
          'Goods that violate customs or import/export regulations',
        ],
      },
      {
        heading: '9. Intellectual Property',
        paragraphs: [
          'All content on this Platform — including logos, text, design, and software — is owned by GCLT and protected under applicable Philippine intellectual property laws. You may not reproduce, distribute, or create derivative works without prior written consent.',
        ],
        bullets: [],
      },
      {
        heading: '10. Limitation of Liability',
        paragraphs: [
          'To the fullest extent permitted by law, GCLT shall not be liable for:',
          'GCLT\'s maximum liability for any claim shall not exceed the amount paid for the specific booking in dispute.',
        ],
        bullets: [
          'Loss or damage to cargo caused by force majeure events (typhoons, floods, earthquakes, acts of government)',
          'Indirect, incidental, or consequential damages arising from use of the Platform',
          'Delays caused by traffic, road closures, or SBMA gate access restrictions',
        ],
      },
      {
        heading: '11. Modifications',
        paragraphs: [
          'GCLT reserves the right to update these Terms at any time. Continued use of the Platform after changes are published constitutes acceptance of the revised Terms.',
        ],
        bullets: [],
      },
      {
        heading: '12. Governing Law',
        paragraphs: [
          'These Terms are governed by the laws of the Republic of the Philippines. Any disputes shall be resolved in the proper courts of Olongapo City, Philippines.',
        ],
        bullets: [],
      },
      {
        heading: '13. Contact',
        paragraphs: [
          'For questions about these Terms, contact us at:',
          'GCLT Transport & Trucking Services, Inc.',
          '#17 25th St. East Bajac-Bajac, Olongapo City',
          'Tel: (047) 222-4065 | Email: gclttruckingservices@yahoo.com',
        ],
        bullets: [],
      },
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    lastUpdated: 'Last updated: August 14, 2026 | Aligned with RA 10173 — Data Privacy Act of the Philippines',
    intro:
      'GCLT Transport & Trucking Services, Inc. is committed to protecting the privacy and security of your personal data in compliance with Republic Act No. 10173 (Data Privacy Act of 2012) and its implementing rules and regulations.',
    sections: [
      {
        heading: '1. Data Controller Information',
        paragraphs: [
          'GCLT Transport & Trucking Services, Inc. is the Personal Information Controller (PIC) responsible for your personal data.',
          'Address: #17 25th St. East Bajac-Bajac, Olongapo City, Philippines',
          'Tel: (047) 222-4065 | Email: gclttruckingservices@yahoo.com',
        ],
        bullets: [],
      },
      {
        heading: '2. Personal Data We Collect',
        paragraphs: [
          'Identity Data — Full name, date of birth',
          'Contact Data — Email address, mobile phone number',
          'Account Data — Password (encrypted), account role',
          'Booking Data — Pickup/delivery addresses, cargo type, weight, dimensions, preferred time slot, truck quantity',
          'Location Data — Geolocation coordinates (when you use "Use My Location" — only with your explicit consent)',
          'Payment Data — Transaction ID, payment method (Stripe or COD). Card details are processed directly by Stripe; we do not store card numbers.',
          'Technical Data — IP address, browser type, device type, pages visited, session duration (via server logs)',
          'Uploaded Files — Proof-of-payment receipt images (for COD bookings)',
        ],
        bullets: [],
      },
      {
        heading: '3. Purpose and Legal Basis of Processing',
        paragraphs: [
          'Booking fulfillment: To process quote requests, confirm bookings, dispatch trucks, and issue invoices. (Legal basis: Contractual necessity)',
          'Account management: To create and maintain your user account, verify your identity, and provide customer support. (Legal basis: Contractual necessity)',
          'Email notifications: To send booking confirmations, status updates, invoices, and service announcements. (Legal basis: Legitimate interest; consent for marketing)',
          'Age verification: To ensure you meet the 18+ registration requirement. (Legal basis: Compliance with terms)',
          'Security: To detect and prevent fraud, unauthorized access, and bot activity (via Cloudflare Turnstile). (Legal basis: Legitimate interest)',
          'Legal compliance: To comply with Philippine tax, transport, and record-keeping laws. (Legal basis: Legal obligation)',
        ],
        bullets: [],
      },
      {
        heading: '4. Data Retention',
        paragraphs: [],
        bullets: [
          'Account data: Retained for as long as your account is active. Deleted within 30 days of a verified account deletion request.',
          'Booking records: Retained for 7 years in compliance with BIR requirements (RA 8792, E-Commerce Act).',
          'Payment records: Retained for 5 years per BSP and AMLC regulations.',
          'Server logs: Retained for 90 days, then purged.',
        ],
      },
      {
        heading: '5. Third-Party Data Processors',
        paragraphs: [
          'Firebase (Google) — Authentication, database, file storage (USA, adequacy safeguards)',
          'Mailjet (Sinch) — Transactional email delivery (EU, GDPR compliant)',
          'Stripe — Payment processing (USA, PCI-DSS compliant)',
          'Cloudflare — Bot protection / Turnstile (USA)',
          'OpenStreetMap / Nominatim — Map display and address geocoding (EU, open-source, anonymized)',
          'We do not sell, rent, or trade your personal data to third parties for marketing purposes.',
        ],
        bullets: [],
      },
      {
        heading: '6. Your Rights Under RA 10173',
        paragraphs: [
          'Right to be Informed: To know how your data is collected and used.',
          'Right to Access: To obtain a copy of the personal data we hold about you.',
          'Right to Rectification: To correct inaccurate or incomplete data. You can update most data directly via your Dashboard → Profile.',
          'Right to Erasure / Blocking: To request deletion or blocking of your personal data when it is no longer necessary for the stated purpose, subject to legal retention requirements.',
          'Right to Data Portability: To receive your data in a structured, machine-readable format.',
          'Right to Object: To object to processing based on legitimate interests.',
          'Right to Lodge a Complaint: To file a complaint with the National Privacy Commission (NPC) at www.privacy.gov.ph.',
          'To exercise these rights, email gclttruckingservices@yahoo.com with subject "Privacy Request — [Your Full Name]". We will respond within 15 business days.',
        ],
        bullets: [],
      },
      {
        heading: '7. Security Measures',
        paragraphs: [
          'All data in transit is encrypted using TLS/HTTPS.',
          'Passwords are hashed using Firebase Authentication (bcrypt-based).',
          'Firestore security rules restrict access to authenticated users and their own data only.',
          'Payment card data is never stored on our servers — processed directly by Stripe (PCI-DSS Level 1).',
          'Admin access is protected by role-based access control.',
        ],
        bullets: [],
      },
      {
        heading: '8. Cookies and Tracking',
        paragraphs: [
          'We use session cookies for authentication (managed by Firebase Auth). We do not use third-party advertising or tracking cookies. You may disable cookies in your browser settings, but this may affect Platform functionality.',
        ],
        bullets: [],
      },
      {
        heading: '9. Changes to this Policy',
        paragraphs: [
          'We may update this Privacy Policy as our practices change or as required by law. We will notify registered users by email and update the "Last updated" date. Continued use of the Platform after changes constitutes acceptance.',
        ],
        bullets: [],
      },
      {
        heading: '10. Contact Our Data Protection Officer',
        paragraphs: [
          'Data Protection Officer',
          'GCLT Transport & Trucking Services, Inc.',
          '#17 25th St. East Bajac-Bajac, Olongapo City, Philippines',
          'Email: gclttruckingservices@yahoo.com',
          'Tel: (047) 222-4065',
        ],
        bullets: [],
      },
    ],
  },
};
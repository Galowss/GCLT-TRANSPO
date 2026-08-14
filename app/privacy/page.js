'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function PrivacyPolicy() {
  return (
    <>
      <Navbar />
      <div style={{ paddingTop: '80px', minHeight: '100vh', background: 'var(--gray-50)' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px' }}>
          <h1 style={{ marginBottom: '24px' }}>Data Privacy Policy</h1>
          <div className="card" style={{ padding: '32px' }}>
            <h3>1. Introduction</h3>
            <p>Welcome to GCLT Transport & Trucking Services. We respect your privacy and are committed to protecting your personal data in compliance with the Data Privacy Act.</p>
            <br />
            <h3>2. Information We Collect</h3>
            <p>We may collect personal information such as your name, email address, phone number, and location when you register, book a truck, or schedule a viewing.</p>
            <br />
            <h3>3. How We Use Your Information</h3>
            <p>Your information is used strictly to provide our services, process bookings, and communicate with you regarding your transactions and inquiries.</p>
            <br />
            <h3>4. Data Security</h3>
            <p>We implement strict security measures to ensure your personal data is protected against unauthorized access or disclosure.</p>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

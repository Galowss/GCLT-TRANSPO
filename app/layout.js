import './globals.css';
import './responsive.css';

import { AuthProvider } from '@/lib/AuthContext';
import { ToastProvider } from '@/components/Toast';
import Chatbot from '@/components/Chatbot';
import Head from 'next/head';

export const metadata = {
  title: 'GCLT Transport & Trucking Services | Heavy-Duty Logistics in SBMA & Olongapo',
  description: 'Professional logistics and fleet management services. Your trusted partner in heavy transport across Central Luzon, SBMA, and Olongapo.',
  keywords: 'GCLT, transport, trucking, logistics, SBMA, Olongapo, Subic Bay, fleet management, heavy duty transport',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=Manrope:wght@600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>
        <AuthProvider>
          <ToastProvider>
            {children}
            <Chatbot />
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

import './globals.css';
import './responsive.css';
import './admin.css';

import { AuthProvider } from '@/lib/AuthContext';
import { ToastProvider } from '@/components/Toast';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import { Inter, JetBrains_Mono, Manrope } from 'next/font/google';

const Chatbot = dynamic(() => import('@/components/Chatbot'), { ssr: false });

const inter = Inter({ 
  subsets: ['latin'], 
  variable: '--font-primary', 
  weight: ['400', '500', '600', '700'] 
});

const manrope = Manrope({ 
  subsets: ['latin'], 
  variable: '--font-heading', 
  weight: ['600', '700', '800'] 
});

const jetbrainsMono = JetBrains_Mono({ 
  subsets: ['latin'], 
  variable: '--font-mono', 
  weight: ['400', '500', '600', '700'] 
});

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export const metadata = {
  title: 'GCLT Transport & Trucking Services | Heavy-Duty Logistics in SBMA & Olongapo',
  description: 'Professional logistics and fleet management services. Your trusted partner in heavy transport across Central Luzon, SBMA, and Olongapo.',
  keywords: 'GCLT, transport, trucking, logistics, SBMA, Olongapo, Subic Bay, fleet management, heavy duty transport',
  icons: {
    icon: '/gclt-logo.png',
    shortcut: '/gclt-logo.png',
    apple: '/gclt-logo.png',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${manrope.variable} ${jetbrainsMono.variable}`}>
      <head>
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

import './globals.css';
import { AuthProvider } from '@/lib/AuthContext';
import { ToastProvider } from '@/components/Toast';
import Chatbot from '@/components/Chatbot';

export const metadata = {
  title: 'GCLT Transport & Trucking Services | Heavy-Duty Logistics in SBMA & Olongapo',
  description: 'Professional logistics and fleet management services. Your trusted partner in heavy transport across Central Luzon, SBMA, and Olongapo.',
  keywords: 'GCLT, transport, trucking, logistics, SBMA, Olongapo, Subic Bay, fleet management, heavy duty transport',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
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

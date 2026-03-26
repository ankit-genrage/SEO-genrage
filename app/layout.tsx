import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'GENRAGE Content Engine',
  description: 'Automated SEO + AEO content generation engine'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

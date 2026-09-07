import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'jiyu design | Interior Design Studio',
  description: 'Warm luxury interior design studio for refined commercial spaces and renovations.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className={`${inter.className} antialiased`}>
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(210,180,150,0.18),_transparent_40%)]">
          <Header />
          <main>{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}

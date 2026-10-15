import type { Metadata } from 'next';
import { Space_Grotesk } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-space-grotesk',
});

export const metadata: Metadata = {
  title: "Meme'd — Campaign Payout Tracker",
  description: 'Brands create campaigns. Creators earn from views.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={spaceGrotesk.variable}>
      <body className={`${spaceGrotesk.className} bg-app-bg min-h-screen text-[#1a1a1a]`}>
        <Navbar />
        <main className="pt-16">{children}</main>
      </body>
    </html>
  );
}

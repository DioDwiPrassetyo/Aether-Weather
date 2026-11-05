import type { Metadata, Viewport } from 'next';
import { Bricolage_Grotesque, Instrument_Sans, Geist_Mono } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { PwaRegister } from '@/components/PwaRegister';
import './globals.css';

const bricolageGrotesque = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-bricolage',
  display: 'swap',
});

const instrumentSans = Instrument_Sans({
  subsets: ['latin'],
  variable: '--font-instrument',
  display: 'swap',
});

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || 'https://weatheraether.vercel.app'
  ),
  title: 'WeatherAether — Stasiun Cuaca & Prakiraan Atmosfer',
  description:
    'Instrumen pemantauan cuaca real-time, prakiraan per jam, tren temperatur 24 jam, indeks kualitas udara (AQI), aviasi drone, pasang surut laut, dan radar presipitasi.',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
  openGraph: {
    title: 'WeatherAether — Stasiun Cuaca & Intelijen Atmosfer',
    description:
      'Pantau cuaca real-time, radar Doppler, indeks terbang drone, pasang surut laut, dan arsip iklim 50 tahun.',
    images: [{ url: '/api/og?city=Jakarta', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WeatherAether — Stasiun Cuaca & Intelijen Atmosfer',
    images: ['/api/og?city=Jakarta'],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: '#070b14',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id"
      className={`${bricolageGrotesque.variable} ${instrumentSans.variable} ${geistMono.variable}`}
    >
      <body>
        <PwaRegister />
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}

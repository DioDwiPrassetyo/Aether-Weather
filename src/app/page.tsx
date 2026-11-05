import type { Metadata } from 'next';
import { WeatherDashboardClient } from '@/components/WeatherDashboardClient';

type PageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const resolvedParams = await searchParams;
  const rawCity = resolvedParams?.city;
  const city =
    typeof rawCity === 'string' && rawCity.trim()
      ? rawCity.trim()
      : Array.isArray(rawCity) && rawCity[0]
        ? rawCity[0].trim()
        : 'Jakarta';

  const ogUrl = `/api/og?city=${encodeURIComponent(city)}`;

  return {
    title: `${city} — WeatherAether | Stasiun Cuaca & Intelijen Atmosfer`,
    description: `Pantau cuaca real-time, radar presipitasi Doppler, indeks terbang drone, pasang surut laut, dan arsip iklim 50 tahun untuk ${city}.`,
    openGraph: {
      title: `${city} — WeatherAether Live Telemetry`,
      description: `Prakiraan cuaca presisi, radar Doppler, indeks aviasi & kelautan untuk ${city}.`,
      images: [
        {
          url: ogUrl,
          width: 1200,
          height: 630,
          alt: `WeatherAether Live Telemetry - ${city}`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${city} — WeatherAether Live Telemetry`,
      description: `Pantau cuaca real-time, radar Doppler & intelijen atmosfer untuk ${city}.`,
      images: [ogUrl],
    },
  };
}

export default function WeatherPage() {
  return <WeatherDashboardClient />;
}

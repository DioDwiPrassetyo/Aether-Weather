import type { Metadata } from 'next';
import { WeatherDashboardClient } from '@/components/WeatherDashboardClient';

export const metadata: Metadata = {
  title: 'Mesin Waktu Iklim 50 Tahun, Kuis Kota Misteri & Studio Widget — WeatherAether',
  description:
    'Telusuri arsip perubahan iklim historis ERA5 50 tahun (1975–sekarang), cek cuaca pada tanggal lahir Anda, mainkan kuis harian AetherGeo, dan buat widget cuaca gratis untuk blog/website.',
};

export default function ExplorePage() {
  return <WeatherDashboardClient section="explore" />;
}


import type { Metadata } from 'next';
import { WeatherDashboardClient } from '@/components/WeatherDashboardClient';

export const metadata: Metadata = {
  title: 'Peta Radar Doppler Live & Jendela Aktivitas 24 Jam — WeatherAether',
  description:
    'Pantau citra radar presipitasi Doppler real-time, proyeksi nowcasting +30 menit, aliran angin, tutupan awan, serta jendela waktu aktivitas optimal 24 jam.',
};

export default function RadarPage() {
  return <WeatherDashboardClient section="radar" />;
}


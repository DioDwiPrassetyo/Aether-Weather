import type { Metadata } from 'next';
import { WeatherDashboardClient } from '@/components/WeatherDashboardClient';

export const metadata: Metadata = {
  title: 'Konsol Aviasi Drone, Kelautan & Sirine Peringatan Dini — WeatherAether',
  description:
    'Indeks keselamatan terbang drone (UAV wind shear 80m/120m AGL & Kp geomagnetik), hidrograf pasang surut air laut & spot selancar dunia, serta sistem sirine peringatan dini.',
};

export default function OperationalPage() {
  return <WeatherDashboardClient section="operational" />;
}


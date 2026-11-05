import type { Metadata } from 'next';
import { WeatherDashboardClient } from '@/components/WeatherDashboardClient';

export const metadata: Metadata = {
  title: 'Asisten Perjalanan, Checklist Packing & Gaya Hidup — WeatherAether',
  description:
    'Rencanakan perjalanan Anda dengan generator daftar barang bawaan (packing checklist) otomatis berbasis cuaca destinasi, rekomendasi pakaian berlapis, dan jendela keberangkatan terbaik.',
};

export default function TravelPage() {
  return <WeatherDashboardClient section="travel" />;
}


'use client';

import React from 'react';
import {
  Sparkles,
  Shirt,
  Umbrella,
  Bike,
  Sun,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import {
  CurrentWeatherResponse,
  AirPollutionResponse,
  ForecastResponse,
  UnitType,
} from '@/types/weather';

interface WeatherAdvisorProps {
  current: CurrentWeatherResponse;
  pollution: AirPollutionResponse | null;
  forecast: ForecastResponse | null;
  unit: UnitType;
}

export const WeatherAdvisor: React.FC<WeatherAdvisorProps> = ({
  current,
  pollution,
  forecast,
  unit,
}) => {
  const tempC =
    unit === 'metric' ? current.main.temp : ((current.main.temp - 32) * 5) / 9;
  const weatherId = current.weather[0]?.id || 800;
  const nextPoP = forecast?.list?.[0]?.pop ? Math.round(forecast.list[0].pop * 100) : 0;
  const aqiScore = pollution?.list?.[0]?.main?.aqi ?? 2;
  const isNight = current.weather[0]?.icon?.endsWith('n');

  // 1. Outfit Recommendation
  let outfitTitle = 'Pakaian Kasual Nyaman';
  let outfitDesc = 'Kenakan kaos santai atau pakaian katun harian.';
  if (tempC >= 31) {
    outfitTitle = 'Pakaian Tipis & Ringan';
    outfitDesc = 'Suhu cukup panas. Pilih bahan katun atau linen berpori agar tidak gerah.';
  } else if (tempC <= 19 && tempC > 12) {
    outfitTitle = 'Jaket Ringan / Cardigan';
    outfitDesc = 'Suhu agak sejuk. Siapkan jaket tipis, sweater, atau kemeja berlapis.';
  } else if (tempC <= 12) {
    outfitTitle = 'Jaket Tebal / Hoodie Hangat';
    outfitDesc = 'Suhu dingin. Disarankan memakai mantel, sweater tebal, atau syal.';
  }

  // 2. Umbrella Recommendation
  let umbrellaTitle = 'Payung Tidak Diperlukan';
  let umbrellaDesc = 'Langit terpantau aman tanpa indikasi hujan waktu dekat.';
  let umbrellaStatus = 'safe';
  if (weatherId >= 200 && weatherId < 600) {
    umbrellaTitle = 'Wajib Bawa Payung / Jas Hujan';
    umbrellaDesc = 'Sedang atau akan segera turun hujan. Bawa payung sebelum keluar.';
    umbrellaStatus = 'warn';
  } else if (nextPoP >= 45) {
    umbrellaTitle = 'Siapkan Payung Cadangan';
    umbrellaDesc = `Peluang presipitasi mencapai ${nextPoP}%. Waspada hujan tiba-tiba.`;
    umbrellaStatus = 'warn';
  }

  // 3. Outdoor Activity / Sports
  let activityTitle = 'Ideal untuk Olahraga Luar Ruangan';
  let activityDesc = 'Kondisi cuaca sangat mendukung untuk joging, bersepeda, atau jalan santai.';
  let activityStatus = 'good';
  if (weatherId >= 200 && weatherId < 600) {
    activityTitle = 'Sebaiknya Olahraga di Dalam Ruangan';
    activityDesc = 'Hujan dan jalanan licin. Lebih aman berolahraga di gym atau rumah.';
    activityStatus = 'bad';
  } else if (tempC >= 34) {
    activityTitle = 'Hindari Olahraga di Bawah Terik';
    activityDesc = 'Suhu ekstrem panas. Tunda aktivitas berat hingga sore hari tiba.';
    activityStatus = 'bad';
  } else if (aqiScore >= 4) {
    activityTitle = 'Batasi Lari / Kardio Outdoor';
    activityDesc = 'Partikel polusi tinggi dapat mengganggu pernapasan paru-paru.';
    activityStatus = 'bad';
  }

  // 4. Sunscreen / UV Protection
  let sunTitle = 'Perlindungan Surya Minimal';
  let sunDesc = 'Indeks UV relatif aman untuk paparan singkat.';
  if (!isNight && (weatherId === 800 || weatherId === 801) && tempC >= 27) {
    sunTitle = 'Gunakan Sunscreen (Tabir Surya)';
    sunDesc = 'Sinar matahari cerah langsung. Pakai sunscreen SPF 30+ & kacamata hitam.';
  } else if (isNight) {
    sunTitle = 'Malam Hari';
    sunDesc = 'Tidak memerlukan perlindungan sinar UV.';
  }

  // 5. Air Health
  let healthTitle = 'Udara Segar & Bersih';
  let healthDesc = 'Kualitas udara sangat baik, nyaman untuk bernapas bebas.';
  if (aqiScore === 3) {
    healthTitle = 'Kualitas Udara Sedang';
    healthDesc = 'Aman untuk masyarakat umum, kelompok hipersensitif perlu waspada.';
  } else if (aqiScore >= 4) {
    healthTitle = 'Disarankan Mengenakan Masker';
    healthDesc = 'Partikulat debu & polutan tinggi. Gunakan masker medis di luar.';
  }

  return (
    <div className="glass-card weather-advisor-card">
      <div className="card-header">
        <div className="card-title">
          <Sparkles size={20} color="#f59e0b" />
          <h3>Smart Weather Advisor</h3>
          <span className="badge-sub">Panduan Aktivitas & Gaya Hidup</span>
        </div>
      </div>

      <div className="advisor-grid">
        {/* Card 1: Outfit */}
        <div className="advisor-item">
          <div className="advisor-icon-box icon-outfit">
            <Shirt size={22} color="#38bdf8" />
          </div>
          <div className="advisor-text">
            <span className="advisor-category">Rekomendasi Pakaian</span>
            <h4>{outfitTitle}</h4>
            <p>{outfitDesc}</p>
          </div>
        </div>

        {/* Card 2: Umbrella */}
        <div className="advisor-item">
          <div
            className={`advisor-icon-box ${
              umbrellaStatus === 'warn' ? 'icon-warn' : 'icon-safe'
            }`}
          >
            <Umbrella
              size={22}
              color={umbrellaStatus === 'warn' ? '#f59e0b' : '#34d399'}
            />
          </div>
          <div className="advisor-text">
            <span className="advisor-category">Payung & Presipitasi</span>
            <h4>{umbrellaTitle}</h4>
            <p>{umbrellaDesc}</p>
          </div>
        </div>

        {/* Card 3: Sports & Activities */}
        <div className="advisor-item">
          <div
            className={`advisor-icon-box ${
              activityStatus === 'bad' ? 'icon-warn' : 'icon-safe'
            }`}
          >
            <Bike
              size={22}
              color={activityStatus === 'bad' ? '#f87171' : '#4ade80'}
            />
          </div>
          <div className="advisor-text">
            <span className="advisor-category">Aktivitas Outdoor</span>
            <h4>{activityTitle}</h4>
            <p>{activityDesc}</p>
          </div>
        </div>

        {/* Card 4: Sunscreen & Skin */}
        <div className="advisor-item">
          <div className="advisor-icon-box icon-sun">
            <Sun size={22} color="#fbbf24" />
          </div>
          <div className="advisor-text">
            <span className="advisor-category">Perlindungan Kulit & UV</span>
            <h4>{sunTitle}</h4>
            <p>{sunDesc}</p>
          </div>
        </div>

        {/* Card 5: Health & Air */}
        <div className="advisor-item advisor-item-wide">
          <div className="advisor-icon-box icon-health">
            <ShieldCheck size={22} color="#a855f7" />
          </div>
          <div className="advisor-text">
            <span className="advisor-category">Kesehatan Lingkungan & Masker</span>
            <h4>{healthTitle}</h4>
            <p>{healthDesc}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

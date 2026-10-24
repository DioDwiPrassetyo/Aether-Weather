'use client';

import React from 'react';
import {
  Sparkles,
  Shirt,
  Umbrella,
  Bike,
  Sun,
  ShieldCheck,
  Car,
} from 'lucide-react';
import {
  CurrentWeatherResponse,
  AirPollutionResponse,
  ForecastResponse,
  UnitType,
} from '@/types/weather';
import { Language, getTranslation } from '@/utils/i18n';

interface WeatherAdvisorProps {
  current: CurrentWeatherResponse;
  pollution: AirPollutionResponse | null;
  forecast: ForecastResponse | null;
  unit: UnitType;
  lang?: Language;
}

export const WeatherAdvisor: React.FC<WeatherAdvisorProps> = ({
  current,
  pollution,
  forecast,
  unit,
  lang = 'id',
}) => {
  const t = getTranslation(lang);
  const tempC =
    unit === 'metric' ? current.main.temp : ((current.main.temp - 32) * 5) / 9;
  const weatherId = current.weather[0]?.id || 800;
  const nextPoP = forecast?.list?.[0]?.pop ? Math.round(forecast.list[0].pop * 100) : 0;
  const aqiScore = pollution?.list?.[0]?.main?.aqi ?? 2;
  const isNight = current.weather[0]?.icon?.endsWith('n');
  const windKmh = current.wind.speed * (unit === 'metric' ? 3.6 : 1.60934);

  // 1. Outfit Recommendation
  let outfitBadge = lang === 'id' ? 'Kasual' : 'Casual';
  let outfitStatus: 'optimal' | 'caution' | 'hazard' = 'optimal';
  let outfitTitle = lang === 'id' ? 'Pakaian Kasual Nyaman' : 'Comfortable Casual Outfit';
  let outfitDesc =
    lang === 'id'
      ? 'Suhu seimbang. Kenakan pakaian santai katun harian bernapas.'
      : 'Mild temperature. Breathable casual cotton clothing recommended.';

  if (tempC >= 31) {
    outfitBadge = lang === 'id' ? 'Pakaian Sejuk' : 'Breathable';
    outfitStatus = 'caution';
    outfitTitle = lang === 'id' ? 'Pakaian Sejuk & Bernapas' : 'Cool & Breathable Clothes';
    outfitDesc =
      lang === 'id'
        ? `Suhu hangat (${Math.round(current.main.temp)}°). Pilih bahan katun atau linen agar nyaman.`
        : `Warm temperature (${Math.round(current.main.temp)}°). Opt for airy cotton or linen.`;
  } else if (tempC <= 19 && tempC > 12) {
    outfitBadge = lang === 'id' ? 'Jaket Tipis' : 'Light Jacket';
    outfitStatus = 'caution';
    outfitTitle = lang === 'id' ? 'Jaket Ringan / Cardigan' : 'Light Jacket or Layer';
    outfitDesc =
      lang === 'id'
        ? 'Udara sejuk. Siapkan jaket tipis, sweater, atau kemeja berlapis.'
        : 'Cool breeze. A light jacket, hoodie, or knitwear is recommended.';
  } else if (tempC <= 12) {
    outfitBadge = lang === 'id' ? 'Jaket Tebal' : 'Heavy Coat';
    outfitStatus = 'caution';
    outfitTitle = lang === 'id' ? 'Mantel / Jaket Tebal' : 'Warm Coat or Jacket';
    outfitDesc =
      lang === 'id'
        ? 'Suhu dingin menusuk. Kenakan jaket tebal, mantel, atau syal.'
        : 'Chilly temperature. Bundle up with a thick coat, jacket, or scarf.';
  }

  // 2. Umbrella Recommendation
  let umbrellaBadge = lang === 'id' ? 'Tidak Perlu' : 'Not Needed';
  let umbrellaStatus: 'optimal' | 'caution' | 'hazard' = 'optimal';
  let umbrellaTitle = lang === 'id' ? 'Payung Tidak Diperlukan' : 'No Umbrella Needed';
  let umbrellaDesc =
    lang === 'id'
      ? 'Langit terpantau aman tanpa ancaman hujan dalam waktu dekat.'
      : 'Skies are clear without immediate indication of rainfall.';

  if (weatherId >= 200 && weatherId < 600) {
    umbrellaBadge = lang === 'id' ? 'Wajib Bawa' : 'Carry Raincoat';
    umbrellaStatus = 'hazard';
    umbrellaTitle = lang === 'id' ? 'Wajib Bawa Payung / Jas Hujan' : 'Carry Umbrella or Raincoat';
    umbrellaDesc =
      lang === 'id'
        ? 'Hujan aktif atau akan turun. Lindungi diri dan barang bawaan Anda.'
        : 'Active rainfall. Keep an umbrella or waterproof layer ready.';
  } else if (nextPoP >= 40) {
    umbrellaBadge = lang === 'id' ? 'Sedia Payung' : 'Shower Risk';
    umbrellaStatus = 'caution';
    umbrellaTitle = lang === 'id' ? 'Siapkan Payung Cadangan' : 'Keep an Umbrella Handy';
    umbrellaDesc =
      lang === 'id'
        ? `Peluang presipitasi ${nextPoP}%. Waspada potensi hujan mendadak.`
        : `Precipitation chance at ${nextPoP}%. Prepare for sudden showers.`;
  }

  // 3. Outdoor Activity / Sports
  let activityBadge = lang === 'id' ? 'Sangat Baik' : 'Optimal';
  let activityStatus: 'optimal' | 'caution' | 'hazard' = 'optimal';
  let activityTitle = lang === 'id' ? 'Ideal untuk Olahraga Luar' : 'Ideal for Outdoor Sports';
  let activityDesc =
    lang === 'id'
      ? 'Kondisi cuaca sangat mendukung untuk joging, sepeda, atau jalan santai.'
      : 'Great conditions for running, cycling, or casual outdoor strolls.';

  if (weatherId >= 200 && weatherId < 600) {
    activityBadge = lang === 'id' ? 'Ruang Tertutup' : 'Indoor Only';
    activityStatus = 'hazard';
    activityTitle = lang === 'id' ? 'Olahraga di Dalam Ruangan' : 'Indoor Exercises Recommended';
    activityDesc =
      lang === 'id'
        ? 'Jalanan basah dan licin. Lebih aman berolahraga di gym atau rumah.'
        : 'Wet surfaces outside. Indoor gym or home workout recommended.';
  } else if (tempC >= 34) {
    activityBadge = lang === 'id' ? 'Hindari Terik' : 'Heat Caution';
    activityStatus = 'caution';
    activityTitle = lang === 'id' ? 'Hindari Olahraga Siang Terik' : 'Avoid Midday Heavy Cardio';
    activityDesc =
      lang === 'id'
        ? 'Suhu sangat terik. Tunda aktivitas luar hingga sore hari yang sejuk.'
        : 'High heat risk. Postpone heavy workouts until cooler twilight hours.';
  } else if (aqiScore >= 4) {
    activityBadge = lang === 'id' ? 'Polusi Tinggi' : 'Air Alert';
    activityStatus = 'hazard';
    activityTitle = lang === 'id' ? 'Batasi Aktivitas di Luar' : 'Limit Outdoor Workouts';
    activityDesc =
      lang === 'id'
        ? 'Partikulat polusi udara pekat dapat mengiritasi saluran pernapasan.'
        : 'High particulate matter can irritate lungs. Workout indoors.';
  }

  // 4. Sunscreen / UV Protection
  let sunBadge = lang === 'id' ? 'UV Rendah' : 'Low UV';
  let sunStatus: 'optimal' | 'caution' = 'optimal';
  let sunTitle = lang === 'id' ? 'Perlindungan Surya Minimal' : 'Minimal UV Exposure';
  let sunDesc =
    lang === 'id'
      ? 'Indeks radiasi UV rendah dan aman untuk aktivitas luar ruangan.'
      : 'UV index is low and safe for casual outdoor exposure.';

  if (!isNight && (weatherId === 800 || weatherId === 801) && tempC >= 27) {
    sunBadge = 'SPF 30+';
    sunStatus = 'caution';
    sunTitle = lang === 'id' ? 'Gunakan Sunscreen (SPF 30+)' : 'Apply Sunscreen (SPF 30+)';
    sunDesc =
      lang === 'id'
        ? 'Radiasi ultraviolet tinggi. Gunakan tabir surya dan kacamata hitam.'
        : 'High UV index. Wear broad-spectrum sunscreen and sunglasses.';
  } else if (isNight) {
    sunBadge = lang === 'id' ? 'Malam Hari' : 'Nighttime';
    sunStatus = 'optimal';
    sunTitle = lang === 'id' ? 'Malam Bebas Radiasi UV' : 'Nighttime — Zero UV Risk';
    sunDesc =
      lang === 'id'
        ? 'Kondisi malam hari tidak memerlukan pelindung tabir surya.'
        : 'No solar UV radiation at night. No sunscreen required.';
  }

  // 5. Air Health & Respiratory
  let healthBadge = lang === 'id' ? 'Udara Bersih' : 'Clean Air';
  let healthStatus: 'optimal' | 'caution' | 'hazard' = 'optimal';
  let healthTitle = lang === 'id' ? 'Udara Segar & Bersih' : 'Fresh & Clean Atmosphere';
  let healthDesc =
    lang === 'id'
      ? 'Kualitas udara sangat baik, nyaman dan aman untuk bernapas bebas.'
      : 'Excellent air quality, refreshing and safe for all activities.';

  if (aqiScore === 3) {
    healthBadge = lang === 'id' ? 'Sedang' : 'Moderate';
    healthStatus = 'caution';
    healthTitle = lang === 'id' ? 'Kualitas Udara Sedang' : 'Moderate Air Quality';
    healthDesc =
      lang === 'id'
        ? 'Aman untuk masyarakat umum, kelompok hipersensitif perlu waspada.'
        : 'Acceptable for most; sensitive individuals should take note.';
  } else if (aqiScore >= 4) {
    healthBadge = lang === 'id' ? 'Pakai Masker' : 'Mask Advised';
    healthStatus = 'hazard';
    healthTitle = lang === 'id' ? 'Disarankan Memakai Masker' : 'Protective Mask Advised';
    healthDesc =
      lang === 'id'
        ? 'Partikulat debu & polutan tinggi. Gunakan masker medis saat keluar.'
        : 'High particulate matter. Consider wearing a protective mask outdoors.';
  }

  // 6. Commute & Road Safety
  let drivingBadge = lang === 'id' ? 'Jalan Aman' : 'Safe Roads';
  let drivingStatus: 'optimal' | 'caution' | 'hazard' = 'optimal';
  let drivingTitle = lang === 'id' ? 'Kondisi Perjalanan Optimal' : 'Optimal Commute Conditions';
  let drivingDesc =
    lang === 'id'
      ? 'Aspal kering, jarak pandang jernih, dan angin tenang. Aman berkendara.'
      : 'Dry roads, clear visibility, and calm wind. Ideal driving conditions.';

  if (current.visibility <= 2000) {
    drivingBadge = lang === 'id' ? 'Kabut Tebal' : 'Fog Hazard';
    drivingStatus = 'hazard';
    drivingTitle = lang === 'id' ? 'Jarak Pandang Terbatas' : 'Reduced Driving Visibility';
    drivingDesc =
      lang === 'id'
        ? `Jarak pandang ${(current.visibility / 1000).toFixed(1)} km. Nyalakan lampu kabut & jaga jarak aman.`
        : `Visibility ${(current.visibility / 1000).toFixed(1)} km. Use fog lights & keep distance.`;
  } else if (weatherId >= 200 && weatherId < 600) {
    drivingBadge = lang === 'id' ? 'Rawan Licin' : 'Wet Roads';
    drivingStatus = 'caution';
    drivingTitle = lang === 'id' ? 'Waspadai Jalan Licin' : 'Wet Road Surface Caution';
    drivingDesc =
      lang === 'id'
        ? 'Hujan membuat aspal licin. Kurangi laju kecepatan berkendara Anda.'
        : 'Rain creates slick pavement and reduced tire traction. Slow down.';
  } else if (windKmh >= 35) {
    drivingBadge = lang === 'id' ? 'Angin Kencang' : 'High Winds';
    drivingStatus = 'caution';
    drivingTitle = lang === 'id' ? 'Waspada Angin Kencang' : 'Strong Lateral Wind Gusts';
    drivingDesc =
      lang === 'id'
        ? 'Pegang kemudi kuat saat melintasi jalan layang atau jembatan terbuka.'
        : 'Maintain firm grip on steering wheel over bridges and open highways.';
  }

  return (
    <div className="glass-card weather-advisor-card">
      <div className="card-header">
        <div className="card-title">
          <Sparkles size={20} color="#facc15" />
          <div>
            <h3>{t.advisorTitle}</h3>
            <span className="badge-sub">
              {lang === 'id'
                ? 'Panduan Aktivitas & Kenyamanan Harian'
                : 'Daily Activity & Comfort Guide'}
            </span>
          </div>
        </div>
        <span className="advisor-badge">
          6 {lang === 'id' ? 'Panduan Cerdas' : 'Smart Suggestions'}
        </span>
      </div>

      <div className="advisor-grid">
        {/* Item 1: Outfit */}
        <div className={`advisor-item status-${outfitStatus}`}>
          <div className="advisor-item-header">
            <div className="advisor-item-cat">
              <span className="advisor-icon-box">
                <Shirt
                  size={15}
                  color={outfitStatus === 'caution' ? '#fbbf24' : '#38bdf8'}
                />
              </span>
              <span className="advisor-cat-name">{t.outfitSuggestion}</span>
            </div>
            <span className={`advisor-pill advisor-pill-${outfitStatus}`}>
              {outfitBadge}
            </span>
          </div>
          <div className="advisor-item-body">
            <h4 className="advisor-title">{outfitTitle}</h4>
            <p className="advisor-desc">{outfitDesc}</p>
          </div>
        </div>

        {/* Item 2: Umbrella */}
        <div className={`advisor-item status-${umbrellaStatus}`}>
          <div className="advisor-item-header">
            <div className="advisor-item-cat">
              <span className="advisor-icon-box">
                <Umbrella
                  size={15}
                  color={umbrellaStatus === 'hazard' ? '#f87171' : umbrellaStatus === 'caution' ? '#fbbf24' : '#34d399'}
                />
              </span>
              <span className="advisor-cat-name">{t.umbrellaSuggestion}</span>
            </div>
            <span className={`advisor-pill advisor-pill-${umbrellaStatus}`}>
              {umbrellaBadge}
            </span>
          </div>
          <div className="advisor-item-body">
            <h4 className="advisor-title">{umbrellaTitle}</h4>
            <p className="advisor-desc">{umbrellaDesc}</p>
          </div>
        </div>

        {/* Item 3: Outdoor Activities */}
        <div className={`advisor-item status-${activityStatus}`}>
          <div className="advisor-item-header">
            <div className="advisor-item-cat">
              <span className="advisor-icon-box">
                <Bike
                  size={15}
                  color={activityStatus === 'hazard' ? '#f87171' : activityStatus === 'caution' ? '#fbbf24' : '#4ade80'}
                />
              </span>
              <span className="advisor-cat-name">{t.outdoorSports}</span>
            </div>
            <span className={`advisor-pill advisor-pill-${activityStatus}`}>
              {activityBadge}
            </span>
          </div>
          <div className="advisor-item-body">
            <h4 className="advisor-title">{activityTitle}</h4>
            <p className="advisor-desc">{activityDesc}</p>
          </div>
        </div>

        {/* Item 4: Sunscreen / UV */}
        <div className={`advisor-item status-${sunStatus}`}>
          <div className="advisor-item-header">
            <div className="advisor-item-cat">
              <span className="advisor-icon-box">
                <Sun size={15} color="#fbbf24" />
              </span>
              <span className="advisor-cat-name">{t.sunscreenProtection}</span>
            </div>
            <span className={`advisor-pill advisor-pill-${sunStatus}`}>
              {sunBadge}
            </span>
          </div>
          <div className="advisor-item-body">
            <h4 className="advisor-title">{sunTitle}</h4>
            <p className="advisor-desc">{sunDesc}</p>
          </div>
        </div>

        {/* Item 5: Air Health */}
        <div className={`advisor-item status-${healthStatus}`}>
          <div className="advisor-item-header">
            <div className="advisor-item-cat">
              <span className="advisor-icon-box">
                <ShieldCheck
                  size={15}
                  color={healthStatus === 'hazard' ? '#f87171' : healthStatus === 'caution' ? '#c084fc' : '#4ade80'}
                />
              </span>
              <span className="advisor-cat-name">{t.airHealth}</span>
            </div>
            <span className={`advisor-pill advisor-pill-${healthStatus}`}>
              {healthBadge}
            </span>
          </div>
          <div className="advisor-item-body">
            <h4 className="advisor-title">{healthTitle}</h4>
            <p className="advisor-desc">{healthDesc}</p>
          </div>
        </div>

        {/* Item 6: Commute & Road Safety */}
        <div className={`advisor-item status-${drivingStatus}`}>
          <div className="advisor-item-header">
            <div className="advisor-item-cat">
              <span className="advisor-icon-box">
                <Car
                  size={15}
                  color={drivingStatus === 'hazard' ? '#f87171' : drivingStatus === 'caution' ? '#fbbf24' : '#38bdf8'}
                />
              </span>
              <span className="advisor-cat-name">{t.commuteRoadSafety}</span>
            </div>
            <span className={`advisor-pill advisor-pill-${drivingStatus}`}>
              {drivingBadge}
            </span>
          </div>
          <div className="advisor-item-body">
            <h4 className="advisor-title">{drivingTitle}</h4>
            <p className="advisor-desc">{drivingDesc}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

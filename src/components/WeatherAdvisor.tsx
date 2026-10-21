'use client';

import React from 'react';
import {
  Sparkles,
  Shirt,
  Umbrella,
  Bike,
  Sun,
  ShieldCheck,
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

  // 1. Outfit Recommendation
  let outfitTitle = lang === 'id' ? 'Pakaian Kasual Nyaman' : 'Comfortable Casual Outfit';
  let outfitDesc =
    lang === 'id'
      ? 'Kenakan kaos santai atau pakaian katun harian.'
      : 'Breathable t-shirt or comfortable cotton clothing.';

  if (tempC >= 31) {
    outfitTitle = lang === 'id' ? 'Pakaian Tipis & Ringan' : 'Light & Breathable Clothing';
    outfitDesc =
      lang === 'id'
        ? 'Suhu cukup panas. Pilih bahan katun atau linen berpori agar tidak gerah.'
        : 'Warm weather. Opt for airy cotton or linen to stay cool and comfortable.';
  } else if (tempC <= 19 && tempC > 12) {
    outfitTitle = lang === 'id' ? 'Jaket Ringan / Cardigan' : 'Light Jacket or Layer';
    outfitDesc =
      lang === 'id'
        ? 'Suhu agak sejuk. Siapkan jaket tipis, sweater, atau kemeja berlapis.'
        : 'Mildly cool. A light windbreaker, hoodie, or sweater is recommended.';
  } else if (tempC <= 12) {
    outfitTitle = lang === 'id' ? 'Jaket Tebal / Hoodie Hangat' : 'Warm Coat or Heavy Jacket';
    outfitDesc =
      lang === 'id'
        ? 'Suhu dingin. Disarankan memakai mantel, sweater tebal, atau syal.'
        : 'Chilly temperature. Bundle up with a thick coat, thermal layer, or scarf.';
  }

  // 2. Umbrella Recommendation
  let umbrellaTitle = lang === 'id' ? 'Payung Tidak Diperlukan' : 'No Umbrella Needed';
  let umbrellaDesc =
    lang === 'id'
      ? 'Langit terpantau aman tanpa indikasi hujan waktu dekat.'
      : 'Clear skies without immediate indications of rain.';
  let umbrellaStatus = 'safe';

  if (weatherId >= 200 && weatherId < 600) {
    umbrellaTitle = lang === 'id' ? 'Wajib Bawa Payung / Jas Hujan' : 'Carry an Umbrella / Raincoat';
    umbrellaDesc =
      lang === 'id'
        ? 'Sedang atau akan segera turun hujan. Bawa payung sebelum keluar.'
        : 'Rain is actively falling or imminent. Don’t leave without rain gear.';
    umbrellaStatus = 'warn';
  } else if (nextPoP >= 45) {
    umbrellaTitle = lang === 'id' ? 'Siapkan Payung Cadangan' : 'Keep an Umbrella Handy';
    umbrellaDesc =
      lang === 'id'
        ? `Peluang presipitasi mencapai ${nextPoP}%. Waspada hujan tiba-tiba.`
        : `Precipitation chance reaches ${nextPoP}%. Be prepared for sudden showers.`;
    umbrellaStatus = 'warn';
  }

  // 3. Outdoor Activity / Sports
  let activityTitle = lang === 'id' ? 'Ideal untuk Olahraga Luar' : 'Ideal for Outdoor Activities';
  let activityDesc =
    lang === 'id'
      ? 'Kondisi cuaca sangat mendukung untuk joging, bersepeda, atau jalan santai.'
      : 'Atmospheric conditions are great for running, cycling, or casual walks.';
  let activityStatus = 'good';

  if (weatherId >= 200 && weatherId < 600) {
    activityTitle = lang === 'id' ? 'Sebaiknya Olahraga di Dalam' : 'Stick to Indoor Exercises';
    activityDesc =
      lang === 'id'
        ? 'Hujan dan jalanan licin. Lebih aman berolahraga di gym atau rumah.'
        : 'Wet and slippery pavements. Indoor gym or home workout is safer.';
    activityStatus = 'bad';
  } else if (tempC >= 34) {
    activityTitle = lang === 'id' ? 'Hindari Olahraga di Bawah Terik' : 'Avoid Intense Midday Sun';
    activityDesc =
      lang === 'id'
        ? 'Suhu ekstrem panas. Tunda aktivitas berat hingga sore hari tiba.'
        : 'Extreme heat risk. Postpone heavy cardio until cooler twilight.';
    activityStatus = 'bad';
  } else if (aqiScore >= 4) {
    activityTitle = lang === 'id' ? 'Batasi Lari Outdoor' : 'Limit Outdoor Cardio';
    activityDesc =
      lang === 'id'
        ? 'Partikel polusi tinggi dapat mengganggu pernapasan paru-paru.'
        : 'Elevated pollution particles can cause respiratory irritation.';
    activityStatus = 'bad';
  }

  // 4. Sunscreen / UV Protection
  let sunTitle = lang === 'id' ? 'Perlindungan Surya Minimal' : 'Low UV Exposure';
  let sunDesc =
    lang === 'id'
      ? 'Indeks UV relatif aman untuk paparan singkat.'
      : 'UV index is moderate to low for brief outdoor exposure.';

  if (!isNight && (weatherId === 800 || weatherId === 801) && tempC >= 27) {
    sunTitle = lang === 'id' ? 'Gunakan Sunscreen (SPF 30+)' : 'Apply Sunscreen (SPF 30+)';
    sunDesc =
      lang === 'id'
        ? 'Sinar matahari cerah langsung. Pakai sunscreen SPF 30+ & kacamata hitam.'
        : 'Direct solar radiation. Wear broad-spectrum sunscreen & sunglasses.';
  } else if (isNight) {
    sunTitle = lang === 'id' ? 'Malam Hari' : 'Nighttime';
    sunDesc =
      lang === 'id' ? 'Tidak memerlukan perlindungan sinar UV.' : 'No UV protection required.';
  }

  // 5. Air Health
  let healthTitle = lang === 'id' ? 'Udara Segar & Bersih' : 'Fresh & Clean Air';
  let healthDesc =
    lang === 'id'
      ? 'Kualitas udara sangat baik, nyaman untuk bernapas bebas.'
      : 'Excellent air quality, safe and refreshing to breathe.';

  if (aqiScore === 3) {
    healthTitle = lang === 'id' ? 'Kualitas Udara Sedang' : 'Moderate Air Quality';
    healthDesc =
      lang === 'id'
        ? 'Aman untuk masyarakat umum, kelompok hipersensitif perlu waspada.'
        : 'Acceptable for most; sensitive individuals should take note.';
  } else if (aqiScore >= 4) {
    healthTitle = lang === 'id' ? 'Disarankan Mengenakan Masker' : 'Mask Recommended Outdoors';
    healthDesc =
      lang === 'id'
        ? 'Partikulat debu & polutan tinggi. Gunakan masker medis di luar.'
        : 'High particulate matter. Consider wearing a protective mask outdoors.';
  }

  return (
    <div className="glass-card weather-advisor-card">
      <div className="card-header">
        <div className="card-title">
          <Sparkles size={20} color="#f59e0b" />
          <h3>{t.advisorTitle}</h3>
          <span className="badge-sub">{lang === 'id' ? 'Panduan Gaya Hidup' : 'Lifestyle Guidance'}</span>
        </div>
      </div>

      <div className="advisor-grid">
        {/* Card 1: Outfit */}
        <div className="advisor-item">
          <div className="advisor-icon-box icon-outfit">
            <Shirt size={22} color="#38bdf8" />
          </div>
          <div className="advisor-text">
            <span className="advisor-category">{t.outfitSuggestion}</span>
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
            <span className="advisor-category">{t.umbrellaSuggestion}</span>
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
            <span className="advisor-category">{t.outdoorSports}</span>
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
            <span className="advisor-category">{t.sunscreenProtection}</span>
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
            <span className="advisor-category">{t.airHealth}</span>
            <h4>{healthTitle}</h4>
            <p>{healthDesc}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

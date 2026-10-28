'use client';

import React, { useState } from 'react';
import {
  Shirt,
  Umbrella,
  Bike,
  Sun,
  Coffee,
  Car,
  Wind,
  Droplets,
  Sprout,
  Compass,
  ShieldCheck,
  Clock,
  HeartPulse,
  CheckCircle2,
  AlertTriangle,
  GlassWater,
  Timer,
} from 'lucide-react';
import {
  CurrentWeatherResponse,
  AirPollutionResponse,
  ForecastResponse,
  UnitType,
} from '@/types/weather';
import { Language } from '@/utils/i18n';

interface WeatherAdvisorProps {
  current: CurrentWeatherResponse;
  pollution: AirPollutionResponse | null;
  forecast: ForecastResponse | null;
  unit: UnitType;
  lang?: Language;
}

type AdvisorCategory = 'all' | 'style' | 'culinary' | 'home' | 'workout';

interface AdvisorCardData {
  id: string;
  category: 'style' | 'culinary' | 'home' | 'workout';
  isPrimary?: boolean;
  categoryLabel: { id: string; en: string };
  icon: React.ReactNode;
  status: 'optimal' | 'caution' | 'hazard';
  badge: { id: string; en: string };
  title: { id: string; en: string };
  desc: { id: string; en: string };
  metricLabel: { id: string; en: string };
  metricValue: { id: string; en: string };
}

interface GearCheckItem {
  id: string;
  icon: React.ReactNode;
  label: { id: string; en: string };
  stateText: { id: string; en: string };
  priority: 'required' | 'recommended' | 'optional';
}

export const WeatherAdvisor: React.FC<WeatherAdvisorProps> = ({
  current,
  pollution,
  forecast,
  unit,
  lang = 'id',
}) => {
  const [selectedTab, setSelectedTab] = useState<AdvisorCategory>('all');

  const tempC =
    unit === 'metric' ? current.main.temp : ((current.main.temp - 32) * 5) / 9;
  const feelsC =
    unit === 'metric'
      ? current.main.feels_like
      : ((current.main.feels_like - 32) * 5) / 9;
  const weatherId = current.weather[0]?.id || 800;
  const nextPoP = forecast?.list?.[0]?.pop ? Math.round(forecast.list[0].pop * 100) : 0;
  const maxPoPNext12h = forecast?.list?.length
    ? Math.round(
        Math.max(...forecast.list.slice(0, 4).map((item) => item.pop || 0)) * 100
      )
    : nextPoP;
  const aqiScore = pollution?.list?.[0]?.main?.aqi ?? 1;
  const isNight = current.weather[0]?.icon?.endsWith('n');
  const humidity = current.main.humidity;
  const windKmh =
    unit === 'metric'
      ? Math.round(current.wind.speed * 3.6)
      : Math.round(current.wind.speed * 1.609);
  const isRaining = weatherId >= 200 && weatherId < 600;
  const isThunder = weatherId >= 200 && weatherId < 300;
  const clouds = current.clouds?.all ?? 20;

  // Calculate overall Outdoor Activity Readiness Score (0 - 100)
  let readinessScore = 92;
  if (isThunder) readinessScore -= 55;
  else if (isRaining) readinessScore -= 38;
  else if (maxPoPNext12h >= 60) readinessScore -= 18;
  if (tempC >= 34) readinessScore -= 22;
  else if (tempC >= 31) readinessScore -= 12;
  else if (tempC <= 16) readinessScore -= 10;
  if (aqiScore >= 4) readinessScore -= 25;
  else if (aqiScore === 3) readinessScore -= 10;
  if (windKmh >= 35) readinessScore -= 15;
  readinessScore = Math.max(15, Math.min(98, readinessScore));

  const readinessStatus =
    readinessScore >= 75
      ? {
          id: 'Sangat Kondusif',
          en: 'Highly Favorable',
          cls: 'optimal',
        }
      : readinessScore >= 50
        ? {
            id: 'Siaga Perubahan Cuaca',
            en: 'Weather Caution',
            cls: 'caution',
          }
        : {
            id: 'Prioritaskan Indoor',
            en: 'Prefer Indoor Activity',
            cls: 'hazard',
          };

  // Essential Daily Gear Checklist (5 items)
  const gearChecklist: GearCheckItem[] = [
    {
      id: 'umbrella',
      icon: <Umbrella size={14} />,
      label: { id: 'Payung / Jas Hujan', en: 'Umbrella / Raincoat' },
      stateText: isRaining
        ? { id: 'Wajib Bawa', en: 'Required Now' }
        : maxPoPNext12h >= 40
          ? { id: `Siaga (${maxPoPNext12h}%)`, en: `Pack (${maxPoPNext12h}%)` }
          : { id: 'Tidak Perlu', en: 'Not Needed' },
      priority: isRaining ? 'required' : maxPoPNext12h >= 40 ? 'recommended' : 'optional',
    },
    {
      id: 'uv-gear',
      icon: <Sun size={14} />,
      label: { id: 'Tabir Surya & UV', en: 'Sunscreen & Shades' },
      stateText:
        !isNight && !isRaining && clouds < 70
          ? { id: 'SPF 50+ & UV400', en: 'SPF 50+ & UV400' }
          : !isNight
            ? { id: 'SPF 30 Cukup', en: 'SPF 30 Light' }
            : { id: 'Malam Hari', en: 'Nighttime' },
      priority:
        !isNight && !isRaining && clouds < 70
          ? 'required'
          : !isNight
            ? 'recommended'
            : 'optional',
    },
    {
      id: 'apparel',
      icon: <Shirt size={14} />,
      label: { id: 'Material Busana', en: 'Apparel Fabric' },
      stateText: isRaining
        ? { id: 'Outer Anti-Air', en: 'Waterproof Shell' }
        : tempC >= 30
          ? { id: 'Katun / Linen Tipis', en: 'Breathable Cotton' }
          : tempC <= 21
            ? { id: 'Jaket / Layering', en: 'Warm Layering' }
            : { id: 'Kasual Ringan', en: 'Light Casual' },
      priority: isRaining || tempC >= 31 || tempC <= 20 ? 'recommended' : 'optional',
    },
    {
      id: 'hydration',
      icon: <GlassWater size={14} />,
      label: { id: 'Target Hidrasi', en: 'Hydration Target' },
      stateText:
        feelsC >= 32
          ? { id: '300 mL / Jam', en: '300 mL / Hr' }
          : feelsC >= 27
            ? { id: '220 mL / Jam', en: '220 mL / Hr' }
            : { id: '180 mL / Jam', en: '180 mL / Hr' },
      priority: feelsC >= 31 ? 'required' : 'recommended',
    },
    {
      id: 'mask',
      icon: <ShieldCheck size={14} />,
      label: { id: 'Proteksi Udara', en: 'Air Protection' },
      stateText:
        aqiScore >= 4
          ? { id: 'Masker KN95 Wajib', en: 'KN95 Mask Needed' }
          : aqiScore === 3
            ? { id: 'Masker Sensitif', en: 'Sensitive Mask' }
            : { id: 'Udara Bersih', en: 'Clean Air' },
      priority: aqiScore >= 4 ? 'required' : aqiScore === 3 ? 'recommended' : 'optional',
    },
  ];

  // Build 8 structured advisory cards (2 per category) so the 2-column grid is always 100% symmetrical
  const cards: AdvisorCardData[] = [];

  // ============================================================================
  // CATEGORY 1: STYLE (2 Cards: Outfit Material + Weather/Skin Protection)
  // ============================================================================
  if (isRaining) {
    cards.push({
      id: 'outfit',
      category: 'style',
      categoryLabel: { id: 'Gaya & Busana', en: 'Style & Outfit' },
      icon: <Shirt size={16} color="#38bdf8" />,
      status: 'caution',
      badge: { id: 'Layer Anti-Air', en: 'Waterproof Layer' },
      title: {
        id: 'Jaket Windbreaker & Alas Kaki Anti-Slip',
        en: 'Windbreaker & Non-Slip Footwear',
      },
      desc: {
        id: 'Hindari celana bahan terang dan sepatu kanvas. Gunakan jaket parasut tahan air serta alas kaki bersol karet dengan daya cengkeram kuat.',
        en: 'Skip light slacks and canvas shoes. Wear a water-resistant windbreaker and rubber-soled footwear with solid wet grip.',
      },
      metricLabel: { id: 'Rekomendasi Bahan', en: 'Ideal Material' },
      metricValue: { id: 'Nilon Ripstop & Karet', en: 'Ripstop Nylon & Rubber' },
    });
  } else if (tempC >= 30) {
    cards.push({
      id: 'outfit',
      category: 'style',
      categoryLabel: { id: 'Gaya & Busana', en: 'Style & Outfit' },
      icon: <Shirt size={16} color="#fbbf24" />,
      status: 'caution',
      badge: { id: 'Sejuk & Bernapas', en: 'Breathable Fit' },
      title: {
        id: 'Katun Combed Tipis atau Kemeja Linen',
        en: 'Lightweight Cotton or Airy Linen',
      },
      desc: {
        id: `Suhu terasa ${Math.round(current.main.feels_like)}°. Pilih pakaian longgar berwarna terang yang memantulkan radiasi panas dan mempercepat sirkulasi keringat.`,
        en: `Feels like ${Math.round(current.main.feels_like)}°. Choose light-colored, loose-fitting cotton or linen for maximum evaporative cooling.`,
      },
      metricLabel: { id: 'Gramasi Kain Ideal', en: 'Ideal Fabric Weight' },
      metricValue: { id: 'Katun 30s / Linen (120–140 gsm)', en: 'Lightweight (120–140 gsm)' },
    });
  } else if (tempC <= 21) {
    cards.push({
      id: 'outfit',
      category: 'style',
      categoryLabel: { id: 'Gaya & Busana', en: 'Style & Outfit' },
      icon: <Shirt size={16} color="#a78bfa" />,
      status: 'caution',
      badge: { id: 'Insulasi Hangat', en: 'Warm Insulation' },
      title: {
        id: 'Hoodie Fleece atau Luaran Rajut',
        en: 'Fleece Hoodie or Knit Cardigan',
      },
      desc: {
        id: 'Udara sejuk disertai hembusan angin. Terapkan teknik dua lapis (kaos dalam + luaran hangat) agar suhu tubuh tetap stabil.',
        en: 'Cool breeze outdoors. Use two-layer dressing (base tee + warm outer layer) to retain core body warmth.',
      },
      metricLabel: { id: 'Konfigurasi Lapis', en: 'Layering System' },
      metricValue: { id: '2 Lapis (Base + Outer Fleece)', en: '2-Layer Thermal Fit' },
    });
  } else {
    cards.push({
      id: 'outfit',
      category: 'style',
      categoryLabel: { id: 'Gaya & Busana', en: 'Style & Outfit' },
      icon: <Shirt size={16} color="#34d399" />,
      status: 'optimal',
      badge: { id: 'Fleksibel & Nyaman', en: 'Casual Balance' },
      title: {
        id: 'Busana Kasual Harian Tanpa Beban',
        en: 'Everyday Casual Smart Comfort',
      },
      desc: {
        id: 'Suhu dan kelembapan berada di zona nyaman. Kaos kasual, polo, atau kemeja lengan pendek sangat ideal sepanjang hari.',
        en: 'Temperature and humidity sit in the comfort zone. A casual tee, polo, or short-sleeve shirt works all day.',
      },
      metricLabel: { id: 'Kenyamanan Termal', en: 'Thermal Comfort' },
      metricValue: { id: 'Optimal (Bebas Gerah)', en: 'Optimal Thermal Zone' },
    });
  }

  // Card 2 (Style): Rain & UV Gear Readiness
  if (isRaining || maxPoPNext12h >= 45) {
    cards.push({
      id: 'umbrella-uv',
      category: 'style',
      categoryLabel: { id: 'Perlengkapan & Proteksi', en: 'Gear & Protection' },
      icon: <Umbrella size={16} color={isRaining ? '#f87171' : '#fbbf24'} />,
      status: isRaining ? 'hazard' : 'caution',
      badge: isRaining
        ? { id: 'Wajib Bawa Payung', en: 'Must Carry Gear' }
        : { id: `Risiko Hujan ${maxPoPNext12h}%`, en: `${maxPoPNext12h}% Rain Risk` },
      title: isRaining
        ? {
            id: 'Payung Lipat Kokoh & Pelindung Tas',
            en: 'Windproof Umbrella & Bag Cover',
          }
        : {
            id: 'Siapkan Payung Lipat di Dalam Tas',
            en: 'Pack a Compact Umbrella Today',
          },
      desc: isRaining
        ? {
            id: 'Presipitasi aktif di sekitar lokasi. Gunakan sarung tas kedap air untuk melindungi perangkat elektronik dan dokumen.',
            en: 'Active rainfall detected. Slip electronics into waterproof sleeves and carry a sturdy umbrella.',
          }
        : {
            id: `Potensi hujan mencapai ${maxPoPNext12h}% dalam beberapa jam ke depan. Sedia payung lipat atau jas hujan ringan sebelum berangkat.`,
            en: `Rain probability reaches ${maxPoPNext12h}% in the coming hours. Keep a compact umbrella or raincoat within reach.`,
          },
      metricLabel: { id: 'Prioritas Proteksi', en: 'Protection Priority' },
      metricValue: isRaining
        ? { id: 'Waterproof IPX4+ & Payung', en: 'Waterproof Cover & Umbrella' }
        : { id: 'Payung Lipat Ringkas', en: 'Compact Travel Umbrella' },
    });
  } else {
    cards.push({
      id: 'umbrella-uv',
      category: 'style',
      categoryLabel: { id: 'Perlengkapan & Proteksi', en: 'Gear & Protection' },
      icon: <Sun size={16} color={!isNight && tempC >= 27 ? '#fbbf24' : '#34d399'} />,
      status: !isNight && tempC >= 28 ? 'caution' : 'optimal',
      badge:
        !isNight && tempC >= 28
          ? { id: 'Proteksi UV Aktif', en: 'UV Shield Active' }
          : { id: 'Langit Kondusif', en: 'Clear Mobility' },
      title:
        !isNight && tempC >= 28
          ? {
              id: 'Tabir Surya SPF 50+ & Kacamata UV400',
              en: 'Broad-Spectrum SPF 50+ & Sunglasses',
            }
          : {
              id: 'Mobilitas Ringan Tanpa Beban Hujan',
              en: 'Travel Light Without Rain Gear',
            },
      desc:
        !isNight && tempC >= 28
          ? {
              id: 'Paparan radiasi matahari cukup kuat. Aplikasikan sunscreen 20 menit sebelum keluar ruangan dan gunakan kacamata hitam anti-UV.',
              en: 'Strong solar radiation outdoors. Apply SPF 50+ sunscreen 20 minutes before heading out and wear UV400 sunglasses.',
            }
          : {
              id: 'Kondisi atmosfer stabil dengan peluang hujan rendah. Anda dapat bepergian ringan tanpa perlu membawa perlengkapan hujan berat.',
              en: 'Stable atmospheric dome with minimal rain risk. Enjoy lightweight mobility without bulky rain gear.',
            },
      metricLabel: { id: 'Indeks Proteksi', en: 'Protection Index' },
      metricValue:
        !isNight && tempC >= 28
          ? { id: 'SPF 50+ PA++++ / Lensa UV400', en: 'SPF 50+ / UV400 Lens' }
          : { id: 'Risiko Hujan < 30% (Aman)', en: 'Rain Risk < 30% (Safe)' },
    });
  }

  // ============================================================================
  // CATEGORY 2: CULINARY & HYDRATION (2 Cards: Food/Drink + Hydration/Electrolytes)
  // ============================================================================
  if (isRaining || tempC < 23) {
    cards.push({
      id: 'culinary',
      category: 'culinary',
      categoryLabel: { id: 'Kuliner & Minuman', en: 'Food & Beverage' },
      icon: <Coffee size={16} color="#f59e0b" />,
      status: 'optimal',
      badge: { id: 'Penghangat Tubuh', en: 'Warm Comfort' },
      title: {
        id: 'Seduhan Kopi Panas, Teh Jahe & Sup Hangat',
        en: 'Hot Filter Coffee, Ginger Tea & Warm Broth',
      },
      desc: {
        id: 'Udara lembap dan sejuk paling pas ditemani minuman hangat kaya rempah serta hidangan berkuah hangat untuk menjaga suhu inti tubuh.',
        en: 'Cool, damp air pairs best with freshly brewed hot coffee, spiced ginger tea, and steaming broth dishes.',
      },
      metricLabel: { id: 'Suhu Sajian Ideal', en: 'Ideal Serving Temp' },
      metricValue: { id: 'Hangat / Panas (60°C – 70°C)', en: 'Warm / Hot (60°C – 70°C)' },
    });
  } else if (tempC >= 29) {
    cards.push({
      id: 'culinary',
      category: 'culinary',
      categoryLabel: { id: 'Kuliner & Minuman', en: 'Food & Beverage' },
      icon: <Coffee size={16} color="#38bdf8" />,
      status: 'optimal',
      badge: { id: 'Penyegar Dahaga', en: 'Cold Refreshment' },
      title: {
        id: 'Cold Brew Dingin, Jus Sitrus & Buah Segar',
        en: 'Chilled Cold Brew, Citrus & Fresh Fruit',
      },
      desc: {
        id: 'Suhu hangat meningkatkan rasa dahaga. Pilih minuman dingin rendah gula berlebih, air kelapa murni, atau potongan buah kaya air.',
        en: 'Warm air accelerates thirst. Reach for chilled cold brew, pure coconut water, or water-rich fresh fruits.',
      },
      metricLabel: { id: 'Suhu Sajian Ideal', en: 'Ideal Serving Temp' },
      metricValue: { id: 'Dingin Segar (4°C – 8°C)', en: 'Chilled (4°C – 8°C)' },
    });
  } else {
    cards.push({
      id: 'culinary',
      category: 'culinary',
      categoryLabel: { id: 'Kuliner & Minuman', en: 'Food & Beverage' },
      icon: <Coffee size={16} color="#34d399" />,
      status: 'optimal',
      badge: { id: 'Suasana Santai', en: 'Balanced Dining' },
      title: {
        id: 'Artisan Latte & Kudapan Teras Terbuka',
        en: 'Artisan Latte & Al-Fresco Dining',
      },
      desc: {
        id: 'Kondisi udara bersahabat untuk bersantap di area semi-outdoor. Nikmati kopi susu hangat maupun es sesuai selera.',
        en: 'Pleasant breeze makes patio or semi-outdoor dining comfortable. Both hot espresso and iced drinks hit the spot.',
      },
      metricLabel: { id: 'Rekomendasi Tempat', en: 'Dining Setting' },
      metricValue: { id: 'Indoor & Semi-Outdoor Nyaman', en: 'Indoor & Patio Friendly' },
    });
  }

  // Card 4 (Culinary): Hydration & Electrolyte Balance
  const hourlyWaterMl =
    feelsC >= 33 ? 320 : feelsC >= 29 ? 250 : feelsC >= 25 ? 200 : 170;
  const dailyWaterLiters = ((hourlyWaterMl * 12) / 1000).toFixed(1);
  cards.push({
    id: 'hydration-plan',
    category: 'culinary',
    categoryLabel: { id: 'Hidrasi & Nutrisi', en: 'Hydration & Nutrition' },
    icon: <GlassWater size={16} color={feelsC >= 31 ? '#fbbf24' : '#38bdf8'} />,
    status: feelsC >= 32 ? 'caution' : 'optimal',
    badge:
      feelsC >= 32
        ? { id: 'Ekstra Elektrolit', en: 'Extra Electrolytes' }
        : { id: 'Hidrasi Terjaga', en: 'Steady Hydration' },
    title: {
      id: `Target Asupan Cairan ~${dailyWaterLiters} Liter Hari Ini`,
      en: `Target ~${dailyWaterLiters}L Fluid Intake Today`,
    },
    desc:
      feelsC >= 30
        ? {
            id: `Kombinasi suhu dan kelembapan (${humidity}%) mempercepat penguapan cairan tubuh. Minum air secara berkala sebelum merasa haus.`,
            en: `Heat and ${humidity}% humidity speed up sweat loss. Sip water consistently every 30–45 minutes before thirst sets in.`,
          }
        : {
            id: 'Meskipun udara terasa sejuk, tubuh tetap kehilangan cairan melalui respirasi. Jaga ritme minum air mineral secara teratur.',
            en: 'Even in cooler air, respiration depletes body fluids. Maintain steady mineral water intake throughout the day.',
          },
    metricLabel: { id: 'Kecepatan Rehidrasi', en: 'Hydration Rate' },
    metricValue: {
      id: `${hourlyWaterMl} mL / Jam Aktif`,
      en: `${hourlyWaterMl} mL / Active Hour`,
    },
  });

  // ============================================================================
  // CATEGORY 3: HOME & VEHICLE (2 Cards: Vehicle Care + Laundry/Garden)
  // ============================================================================
  if (isRaining || maxPoPNext12h >= 50) {
    cards.push({
      id: 'carwash',
      category: 'home',
      categoryLabel: { id: 'Kendaraan & Mobilitas', en: 'Vehicle & Mobility' },
      icon: <Car size={16} color="#f87171" />,
      status: 'hazard',
      badge: { id: 'Tunda Cuci', en: 'Postpone Wash' },
      title: {
        id: 'Tunda Cuci Mobil/Motor & Cek Wiper',
        en: 'Hold Off Vehicle Wash & Check Wipers',
      },
      desc: {
        id: 'Potensi guyuran hujan dan genangan aspal masih tinggi. Pastikan karet wiper kaca depan bersih serta tekanan ban optimal untuk jalan basah.',
        en: 'High chance of rain and wet road spray. Postpone exterior detailing and verify wiper blades and tire tread grip.',
      },
      metricLabel: { id: 'Kondisi Permukaan Jalan', en: 'Road Surface Status' },
      metricValue: { id: 'Basah / Risiko Cipratan Tinggi', en: 'Wet / High Splash Risk' },
    });
  } else {
    cards.push({
      id: 'carwash',
      category: 'home',
      categoryLabel: { id: 'Kendaraan & Mobilitas', en: 'Vehicle & Mobility' },
      icon: <Car size={16} color="#34d399" />,
      status: 'optimal',
      badge: { id: 'Waktu Ideal Cuci', en: 'Prime Wash Window' },
      title: {
        id: 'Waktu Terbaik Cuci & Waxing Kendaraan',
        en: 'Great Day to Wash & Wax Your Vehicle',
      },
      desc: {
        id: 'Langit kondusif dan permukaan jalan kering. Mencuci kendaraan hari ini akan membuat bodi mobil atau motor tetap bersih lebih lama.',
        en: 'Dry roads and stable skies ahead. Washing and waxing today keeps your vehicle spotless for days.',
      },
      metricLabel: { id: 'Daya Tahan Kebersihan', en: 'Cleanliness Window' },
      metricValue: { id: 'Optimal (Aspal Kering)', en: 'Optimal (Dry Pavement)' },
    });
  }

  // Card 6 (Home): Laundry Drying & Garden Care
  const estDryHours = isRaining
    ? '6–9'
    : tempC >= 30 && humidity < 70
      ? '1.5–2.5'
      : tempC >= 27 && humidity < 80
        ? '2.5–4'
        : '4.5–6';

  if (isRaining || humidity >= 80 || maxPoPNext12h >= 45) {
    cards.push({
      id: 'laundry-garden',
      category: 'home',
      categoryLabel: { id: 'Jemuran & Rumah', en: 'Laundry & Home' },
      icon: <Droplets size={16} color="#fbbf24" />,
      status: 'caution',
      badge: { id: 'Jemur Beratap', en: 'Indoor Drying' },
      title: {
        id: 'Jemur di Area Beratap & Tanaman Hemat Air',
        en: 'Hang Laundry Under Cover & Skip Watering',
      },
      desc: {
        id: `Kelembapan udara ${humidity}% memperlambat penguapan. Gunakan bantuan sirkulasi kipas angin untuk jemuran, dan tidak perlu menyiram tanaman luar.`,
        en: `${humidity}% humidity slows evaporation. Use indoor airflow for laundry and let natural moisture hydrate outdoor plants.`,
      },
      metricLabel: { id: 'Estimasi Waktu Kering', en: 'Est. Drying Time' },
      metricValue: {
        id: `~${estDryHours} Jam (Bantuan Sirkulasi)`,
        en: `~${estDryHours} Hrs (Indoor Airflow)`,
      },
    });
  } else {
    cards.push({
      id: 'laundry-garden',
      category: 'home',
      categoryLabel: { id: 'Jemuran & Rumah', en: 'Laundry & Home' },
      icon: <Wind size={16} color="#34d399" />,
      status: 'optimal',
      badge: { id: 'Cepat Kering', en: 'Fast Evaporation' },
      title: {
        id: 'Jemuran Cepat Kering & Siram Tanaman Sore',
        en: 'Fast Outdoor Drying & Evening Plant Care',
      },
      desc: {
        id: 'Panas matahari dan aliran angin mempercepat pengeringan pakaian tebal/seprai. Siram tanaman pekarangan pada sore hari agar tanah tidak kering.',
        en: 'Warm breeze dries heavy laundry and bedding rapidly. Water garden pots around dusk to replenish soil moisture.',
      },
      metricLabel: { id: 'Estimasi Waktu Kering', en: 'Est. Drying Time' },
      metricValue: {
        id: `~${estDryHours} Jam (Luar Ruang)`,
        en: `~${estDryHours} Hrs (Direct Sun/Wind)`,
      },
    });
  }

  // ============================================================================
  // CATEGORY 4: WORKOUT & OUTDOOR (2 Cards: Cardio Intensity + Time Window)
  // ============================================================================
  if (isRaining || aqiScore >= 4) {
    cards.push({
      id: 'workout',
      category: 'workout',
      categoryLabel: { id: 'Olahraga & Kardio', en: 'Fitness & Cardio' },
      icon: <Bike size={16} color="#f87171" />,
      status: 'hazard',
      badge: { id: 'Latihan Indoor', en: 'Indoor Session' },
      title: {
        id: 'Alihkan ke Gym, Treadmill, atau Latihan beban',
        en: 'Switch to Indoor Gym, Treadmill or Yoga',
      },
      desc: {
        id: isRaining
          ? 'Permukaan aspal basah dan licin meningkatkan risiko tergelincir saat lari atau bersepeda. Lakukan latihan kekuatan atau mobilitas di dalam ruangan.'
          : 'Kualitas udara luar sedang kurang sehat untuk respirasi intensitas tinggi. Gunakan fasilitas olahraga indoor berventilasi bersih.',
        en: isRaining
          ? 'Slick wet pavement increases slip risk for running and cycling. Opt for indoor strength, mobility, or treadmill sessions.'
          : 'Outdoor air quality is unfavorable for heavy breathing. Train indoors with filtered ventilation.',
      },
      metricLabel: { id: 'Rekomendasi Intensitas', en: 'Recommended Zone' },
      metricValue: { id: 'Indoor Zone 2–3 / Strength', en: 'Indoor Zone 2–3 / Strength' },
    });
  } else if (tempC >= 31) {
    cards.push({
      id: 'workout',
      category: 'workout',
      categoryLabel: { id: 'Olahraga & Kardio', en: 'Fitness & Cardio' },
      icon: <Bike size={16} color="#fbbf24" />,
      status: 'caution',
      badge: { id: 'Beban Termal Tinggi', en: 'High Thermal Load' },
      title: {
        id: 'Kurangi Pace Lari & Perbanyak Jeda Pendinginan',
        en: 'Moderate Your Pace & Extend Cooling Breaks',
      },
      desc: {
        id: 'Suhu tinggi mempercepat kenaikan detak jantung (cardiac drift). Hindari sprint berlebih di siang hari dan pilih rute yang teduh.',
        en: 'High heat accelerates heart rate drift. Avoid midday sprints, choose shaded park routes, and hydrate every 15–20 mins.',
      },
      metricLabel: { id: 'Batas Intensitas Aman', en: 'Safe Intensity Cap' },
      metricValue: { id: 'Maks Zone 2–3 (Aerobik Ringan)', en: 'Max Zone 2–3 (Easy Aerobic)' },
    });
  } else {
    cards.push({
      id: 'workout',
      category: 'workout',
      categoryLabel: { id: 'Olahraga & Kardio', en: 'Fitness & Cardio' },
      icon: <Bike size={16} color="#34d399" />,
      status: 'optimal',
      badge: { id: 'Performa Puncak', en: 'Peak Performance' },
      title: {
        id: 'Kondisi Ideal untuk Lari, Sepeda & Olahraga Taman',
        en: 'Prime Conditions for Running & Cycling',
      },
      desc: {
        id: 'Suhu udara mendukung pelepasan panas tubuh secara efisien dan traksi jalan kering. Sangat baik untuk latihan tempo maupun endurance.',
        en: 'Ambient air supports efficient body cooling with dry road traction. Great for tempo runs or long cycling rides.',
      },
      metricLabel: { id: 'Zona Latihan Ideal', en: 'Ideal Training Zone' },
      metricValue: { id: 'Semua Zona (Endurance & Tempo)', en: 'All Zones (Endurance & Tempo)' },
    });
  }

  // Card 8 (Workout): Optimal Outdoor Time Window & Recovery
  cards.push({
    id: 'workout-window',
    category: 'workout',
    categoryLabel: { id: 'Jadwal & Pemulihan', en: 'Schedule & Recovery' },
    icon: <Timer size={16} color="#38bdf8" />,
    status: isRaining ? 'caution' : 'optimal',
    badge: { id: 'Jendela Waktu Terbaik', en: 'Optimal Time Window' },
    title: {
      id: 'Sesi Pagi (05:45–08:15) & Sore (16:30–18:15)',
      en: 'Morning (05:45–08:15) & Late Afternoon (16:30–18:15)',
    },
    desc: {
      id: 'Pada rentang jam ini indeks radiasi matahari lebih rendah dan suhu permukaan jalan lebih bersahabat untuk sendi serta pernapasan.',
      en: 'During these windows solar radiation is low and pavement temperatures are cooler for optimal joint and respiratory comfort.',
    },
    metricLabel: { id: 'Fokus Pasca-Latihan', en: 'Post-Workout Focus' },
    metricValue: {
      id: 'Pendinginan 10 Menit + Elektrolit',
      en: '10m Cool-Down + Electrolytes',
    },
  });

  // Filter based on active tab:
  // In 'all' mode, show the 4 primary category cards (1 per category = 2x2 grid) so height matches AstronomyCard on the left.
  // In a specific category tab, show both cards for that category (1x2 row) + the Category Action Protocol below it.
  const primaryIds = new Set(['outfit', 'culinary', 'carwash', 'workout']);
  const filteredCards =
    selectedTab === 'all'
      ? cards.filter((c) => primaryIds.has(c.id))
      : cards.filter((c) => c.category === selectedTab);

  // Category-specific action tips shown on every tab so height matches AstronomyCard without stretching cards
  const categoryActionSteps: Record<
    AdvisorCategory,
    { title: { id: string; en: string }; steps: { id: string; en: string }[] }
  > = {
    all: {
      title: {
        id: 'Protokol Prioritas & Keselamatan Harian',
        en: 'Daily Priority & Safety Action Protocol',
      },
      steps: [
        {
          id: isRaining
            ? `Presipitasi aktif terdeteksi (peluang 12 jam ${maxPoPNext12h}%) — siapkan jas hujan/payung lipat dan alihkan olahraga ke ruang tertutup.`
            : maxPoPNext12h >= 40
              ? `Peluang hujan 12 jam ke depan mencapai ${maxPoPNext12h}% — bawa payung lipat di tas dan selesaikan jemuran lebih awal.`
              : 'Kondisi langit relatif kondusif — waktu yang baik untuk mobilitas luar ruang, olahraga taman, maupun perawatan kendaraan.',
          en: isRaining
            ? `Active precipitation detected (${maxPoPNext12h}% 12h risk) — pack rain gear and move cardio sessions indoors.`
            : maxPoPNext12h >= 40
              ? `12h rain probability reaches ${maxPoPNext12h}% — carry a compact umbrella and finish outdoor drying early.`
              : 'Skies remain favorable — ideal window for outdoor commutes, park workouts, and vehicle care.',
        },
        {
          id: `Target rehidrasi optimal sekitar ${hourlyWaterMl} mL/jam aktif (~${dailyWaterLiters}L/hari) dengan kelembapan udara saat ini ${humidity}%.`,
          en: `Maintain ~${hourlyWaterMl} mL/active hour fluid intake (~${dailyWaterLiters}L/day) at ${humidity}% ambient humidity.`,
        },
        {
          id:
            aqiScore >= 4
              ? 'Indeks kualitas udara kurang sehat untuk grup sensitif — gunakan masker filtrasi saat berada di jalur padat kendaraan.'
              : `Sirkulasi angin ${windKmh} km/j mendukung kualitas udara yang baik untuk aktivitas harian.`,
          en:
            aqiScore >= 4
              ? 'Air quality is elevated for sensitive groups — wear a filtration mask near heavy traffic corridors.'
              : `${windKmh} km/h breeze supports clean ambient air circulation for daily routines.`,
        },
      ],
    },
    style: {
      title: {
        id: 'Panduan Detail Busana & Perlengkapan Hari Ini',
        en: "Today's Detailed Apparel & Gear Checklist",
      },
      steps: [
        {
          id: isRaining
            ? 'Gunakan kaos kaki cadangan dan pilih sepatu dengan material water-repellent.'
            : 'Pilih warna pakaian terang di siang hari untuk mengurangi penyerapan panas matahari.',
          en: isRaining
            ? 'Pack spare socks and wear water-repellent footwear for wet commutes.'
            : 'Opt for light-toned fabrics during midday to reflect solar heat.',
        },
        {
          id:
            maxPoPNext12h >= 35
              ? `Peluang hujan 12 jam ke depan ${maxPoPNext12h}% — simpan payung lipat di kompartemen luar tas.`
              : 'Langit relatif stabil — kacamata hitam UV400 dan topi ringan sudah cukup untuk aktivitas luar.',
          en:
            maxPoPNext12h >= 35
              ? `${maxPoPNext12h}% rain chance in the next 12h — keep a compact umbrella in your outer bag pocket.`
              : 'Skies are stable — UV400 sunglasses and a light cap are sufficient outdoors.',
        },
        {
          id: `Kelembapan udara saat ini ${humidity}% — gunakan bahan pakaian dengan sirkulasi pori yang baik agar kulit tetap nyaman.`,
          en: `Current humidity is ${humidity}% — breathable weaves prevent moisture buildup on skin.`,
        },
      ],
    },
    culinary: {
      title: {
        id: 'Panduan Pola Hidrasi & Konsumsi Harian',
        en: 'Daily Hydration & Refreshment Protocol',
      },
      steps: [
        {
          id: `Minum 1 gelas air (${hourlyWaterMl} mL) setiap 45–60 menit, terutama saat beraktivitas di luar ruangan.`,
          en: `Drink ${hourlyWaterMl} mL of water every 45–60 minutes, especially when active outdoors.`,
        },
        {
          id:
            tempC >= 29
              ? 'Kurangi minuman berkafein atau gula berlebih di siang terik agar tidak mempercepat dehidrasi.'
              : 'Minuman hangat dengan jahe, serai, atau madu membantu menjaga imunitas di udara lembap.',
          en:
            tempC >= 29
              ? 'Limit overly sugary or heavy caffeinated drinks at midday to prevent dehydration.'
              : 'Warm infusions with ginger, lemongrass, or honey support immunity in cool air.',
        },
        {
          id: 'Tambahkan buah kaya kalium dan air (semangka, jeruk, atau air kelapa) untuk menjaga keseimbangan elektrolit.',
          en: 'Include potassium- and water-rich fruits (citrus, melon, or coconut water) for electrolyte balance.',
        },
      ],
    },
    home: {
      title: {
        id: 'Panduan Perawatan Rumah, Jemuran & Kendaraan',
        en: 'Home Ventilation, Laundry & Vehicle Protocol',
      },
      steps: [
        {
          id:
            humidity >= 78 || isRaining
              ? 'Beri jarak antar gantungan pakaian minimal 5–8 cm dan nyalakan kipas angin agar cucian tidak berbau apek.'
              : 'Manfaatkan jam 09:30 – 14:30 untuk menjemur seprai, handuk, atau pakaian berbahan tebal.',
          en:
            humidity >= 78 || isRaining
              ? 'Space clothes hangers 5–8 cm apart with fan airflow to prevent damp odors.'
              : 'Use the 09:30 – 14:30 solar peak to dry bedding, towels, and heavy fabrics.',
        },
        {
          id: isRaining
            ? 'Periksa saluran talang air rumah dan pastikan pot tanaman tidak tergenang air berlebih.'
            : 'Buka ventilasi jendela pada pagi hari untuk sirkulasi udara segar di dalam ruangan.',
          en: isRaining
            ? 'Check roof drainage and ensure potted plants have proper water runoff.'
            : 'Open windows during morning hours to refresh indoor air circulation.',
        },
        {
          id: `Kecepatan angin rata-rata ${windKmh} km/j — ${windKmh >= 25 ? 'kencangkan jemuran dengan penjepit agar tidak terbang.' : 'aman untuk menjemur pakaian di gantungan standar.'}`,
          en: `Average wind speed is ${windKmh} km/h — ${windKmh >= 25 ? 'secure laundry with clips against gusts.' : 'safe for standard outdoor drying racks.'}`,
        },
      ],
    },
    workout: {
      title: {
        id: 'Panduan Keselamatan & Performa Olahraga',
        en: 'Athletic Safety & Performance Protocol',
      },
      steps: [
        {
          id: 'Lakukan pemanasan dinamis 5–8 menit sebelum mulai berlari atau bersepeda untuk menyiapkan otot dan sendi.',
          en: 'Perform 5–8 minutes of dynamic warm-up before running or cycling to prep joints.',
        },
        {
          id:
            feelsC >= 30
              ? `Suhu terasa ${Math.round(current.main.feels_like)}° — turunkan target pace lari sekitar 10–15 detik/km agar detak jantung tetap stabil.`
              : 'Kondisi suhu mendukung latihan interval maupun lari jarak menengah dengan nyaman.',
          en:
            feelsC >= 30
              ? `Feels like ${Math.round(current.main.feels_like)}° — adjust running pace by 10–15 sec/km to manage heart rate.`
              : 'Thermal conditions support both interval sessions and steady distance runs.',
        },
        {
          id: 'Gunakan pakaian olahraga berbahan dry-fit dan ganti pakaian segera setelah selesai berkeringat.',
          en: 'Wear moisture-wicking dry-fit gear and change into dry clothes promptly after cooling down.',
        },
      ],
    },
  };

  return (
    <div className="glass-card weather-advisor-card">
      <div className="card-header advisor-header-custom">
        <div className="card-title">
          <Compass size={20} color="#38bdf8" />
          <div>
            <h3>{lang === 'id' ? 'Panduan Aktivitas & Lingkungan' : 'Field & Activity Advisory'}</h3>
            <span className="badge-sub">
              {lang === 'id'
                ? 'Rekomendasi praktis & kesiapan perlengkapan berdasarkan kondisi atmosfer'
                : 'Practical recommendations & gear readiness based on atmospheric conditions'}
            </span>
          </div>
        </div>
        <span className={`advisor-badge advisor-readiness-pill status-${readinessStatus.cls}`}>
          {readinessScore}% &bull; {readinessStatus[lang]}
        </span>
      </div>

      {/* Essential Gear & Readiness Summary Strip */}
      <div className="advisor-gear-strip">
        <div className="advisor-gear-header">
          <span className="advisor-gear-title">
            <ShieldCheck size={14} color="#38bdf8" />
            <span>
              {lang === 'id'
                ? 'Checklist Perlengkapan & Kesiapan Hari Ini'
                : 'Daily Essential Gear & Readiness Checklist'}
            </span>
          </span>
          <span className="advisor-gear-meta">
            {lang === 'id' ? `Peluang Hujan 12J: ${maxPoPNext12h}%` : `12H Rain Risk: ${maxPoPNext12h}%`}
          </span>
        </div>
        <div className="advisor-gear-grid">
          {gearChecklist.map((gear) => (
            <div key={gear.id} className={`advisor-gear-chip priority-${gear.priority}`}>
              <span className="gear-chip-icon">{gear.icon}</span>
              <div className="gear-chip-text">
                <span className="gear-chip-label">{gear.label[lang]}</span>
                <strong className="gear-chip-val">{gear.stateText[lang]}</strong>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Category Filter Pills */}
      <div className="advisor-tabs-bar" role="tablist">
        <button
          type="button"
          className={`advisor-tab-btn ${selectedTab === 'all' ? 'active' : ''}`}
          onClick={() => setSelectedTab('all')}
        >
          {lang === 'id' ? 'Semua' : 'All'}
        </button>
        <button
          type="button"
          className={`advisor-tab-btn ${selectedTab === 'style' ? 'active' : ''}`}
          onClick={() => setSelectedTab('style')}
        >
          <Shirt size={13} />
          <span>{lang === 'id' ? 'Pakaian & Proteksi' : 'Apparel & Gear'}</span>
        </button>
        <button
          type="button"
          className={`advisor-tab-btn ${selectedTab === 'culinary' ? 'active' : ''}`}
          onClick={() => setSelectedTab('culinary')}
        >
          <Coffee size={13} />
          <span>{lang === 'id' ? 'Konsumsi & Hidrasi' : 'Food & Hydration'}</span>
        </button>
        <button
          type="button"
          className={`advisor-tab-btn ${selectedTab === 'home' ? 'active' : ''}`}
          onClick={() => setSelectedTab('home')}
        >
          <Car size={13} />
          <span>{lang === 'id' ? 'Kendaraan & Rumah' : 'Vehicle & Home'}</span>
        </button>
        <button
          type="button"
          className={`advisor-tab-btn ${selectedTab === 'workout' ? 'active' : ''}`}
          onClick={() => setSelectedTab('workout')}
        >
          <Bike size={13} />
          <span>{lang === 'id' ? 'Olahraga' : 'Outdoor'}</span>
        </button>
      </div>

      {/* Cards Grid */}
      <div className="advisor-grid">
        {filteredCards.map((card) => (
          <div key={card.id} className={`advisor-item status-${card.status}`}>
            <div className="advisor-item-header">
              <div className="advisor-item-cat">
                <span className="advisor-icon-box">{card.icon}</span>
                <span className="advisor-cat-name">{card.categoryLabel[lang]}</span>
              </div>
              <span className={`advisor-pill advisor-pill-${card.status}`}>
                {card.badge[lang]}
              </span>
            </div>

            <div className="advisor-item-body">
              <h4 className="advisor-title">{card.title[lang]}</h4>
              <p className="advisor-desc">{card.desc[lang]}</p>
            </div>

            <div className="advisor-item-footer">
              <span className="advisor-footer-label">{card.metricLabel[lang]}</span>
              <strong className="advisor-footer-val">{card.metricValue[lang]}</strong>
            </div>
          </div>
        ))}
      </div>

      {/* Action Protocol (shown across all tabs so space is richly utilized without stretching cards) */}
      <div className="advisor-category-protocol">
        <div className="protocol-header">
          <CheckCircle2 size={15} color="#38bdf8" />
          <span>{categoryActionSteps[selectedTab].title[lang]}</span>
        </div>
        <div className="protocol-steps-list">
          {categoryActionSteps[selectedTab].steps.map((step, idx) => (
            <div key={idx} className="protocol-step-item">
              <span className="protocol-step-num">{idx + 1}</span>
              <p>{step[lang]}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  History,
  Gamepad2,
  Code2,
  Calendar,
  TrendingUp,
  Sparkles,
  Copy,
  Check,
  Trophy,
  Compass,
  HelpCircle,
  RefreshCw,
  Share2,
  ExternalLink,
  Thermometer,
  Droplets,
  Wind,
  MapPin,
} from 'lucide-react';
import { CurrentWeatherResponse, UnitType } from '@/types/weather';
import { Language } from '@/utils/i18n';
import { wmoCodeToCondition, I18N } from '@/utils/weatherUtils';

interface CommunityGrowthSuiteProps {
  current: CurrentWeatherResponse;
  unit: UnitType;
  lang?: Language;
  onSelectCity?: (city: string) => void;
  onShowToast?: (msg: string, type?: 'info' | 'success' | 'error') => void;
}

type GrowthTab = 'timemachine' | 'game' | 'widget';

interface DecadeRecord {
  year: number;
  tempMeanC: number;
  tempMaxC: number;
  tempMinC: number;
  precipMm: number;
}

interface CustomDateWeather {
  date: string;
  tempMeanC: number;
  tempMaxC: number;
  tempMinC: number;
  precipMm: number;
  windMaxKmh: number;
  weatherCode: number;
}

interface MysteryCity {
  name: string;
  country: string;
  countryCode: string;
  continent: string;
  lat: number;
  lon: number;
  utcOffset: string;
  climateZone: string;
  factId: string;
  factEn: string;
}

const MYSTERY_CITIES_POOL: MysteryCity[] = [
  { name: 'Reykjavik', country: 'Islandia', countryCode: 'IS', continent: 'Eropa Utara', lat: 64.1466, lon: -21.9426, utcOffset: 'UTC+0', climateZone: 'Subpolar Oseanik', factId: 'Ibu kota paling utara di dunia yang ditenagai panas bumi.', factEn: 'World’s northernmost capital powered by geothermal energy.' },
  { name: 'Tokyo', country: 'Jepang', countryCode: 'JP', continent: 'Asia Timur', lat: 35.6762, lon: 139.6503, utcOffset: 'UTC+9', climateZone: 'Subtropis Lembap', factId: 'Metropolis terbesar di dunia di pesisir Teluk Pasifik.', factEn: 'Largest metropolitan area on the Pacific bay coast.' },
  { name: 'Cairo', country: 'Mesir', countryCode: 'EG', continent: 'Afrika Utara', lat: 30.0444, lon: 31.2357, utcOffset: 'UTC+2', climateZone: 'Gurun Panas (Arid)', factId: 'Kota di tepi Sungai Nil dengan curah hujan tahunan sangat rendah.', factEn: 'Nile delta metropolis with ultra-low annual rainfall.' },
  { name: 'Jakarta', country: 'Indonesia', countryCode: 'ID', continent: 'Asia Tenggara', lat: -6.2088, lon: 106.8456, utcOffset: 'UTC+7', climateZone: 'Tropis Monsun', factId: 'Kota pesisir Laut Jawa dengan siklus angin darat-laut harian.', factEn: 'Java Sea coastal megacity with tropical monsoon cycles.' },
  { name: 'Zermatt', country: 'Swiss', countryCode: 'CH', continent: 'Eropa Tengah', lat: 46.0207, lon: 7.7491, utcOffset: 'UTC+1', climateZone: 'Alpin Pegunungan Tinggi', factId: 'Lembah bebas kendaraan bermesin bensin di kaki puncak Matterhorn.', factEn: 'Car-free alpine valley at the foot of the Matterhorn.' },
  { name: 'Singapore', country: 'Singapura', countryCode: 'SG', continent: 'Asia Tenggara', lat: 1.3521, lon: 103.8198, utcOffset: 'UTC+8', climateZone: 'Hutan Hujan Khatulistiwa', factId: 'Negara kota pulau yang berada hanya 137 km di utara garis khatulistiwa.', factEn: 'Island city-state located just 137 km north of the Equator.' },
  { name: 'Sydney', country: 'Australia', countryCode: 'AU', continent: 'Oseania', lat: -33.8688, lon: 151.2093, utcOffset: 'UTC+10', climateZone: 'Subtropis Pesisir', factId: 'Pelabuhan alami ikonik di pesisir Laut Tasman.', factEn: 'Iconic natural harbor on the Tasman Sea coast.' },
  { name: 'London', country: 'Inggris', countryCode: 'GB', continent: 'Eropa Barat', lat: 51.5074, lon: -0.1278, utcOffset: 'UTC+0', climateZone: 'Maritim Sedang', factId: 'Dilahirkan di tepi Sungai Thames dan dilewati garis Meridian Utama.', factEn: 'Straddles the River Thames and the Prime Meridian.' },
  { name: 'New York', country: 'Amerika Serikat', countryCode: 'US', continent: 'Amerika Utara', lat: 40.7128, lon: -74.006, utcOffset: 'UTC-5', climateZone: 'Kontinental Lembap', factId: 'Kepulauan pelabuhan tempat Sungai Hudson bertemu Samudra Atlantik.', factEn: 'Harbor archipelago where the Hudson meets the Atlantic.' },
  { name: 'Rio de Janeiro', country: 'Brasil', countryCode: 'BR', continent: 'Amerika Selatan', lat: -22.9068, lon: -43.1729, utcOffset: 'UTC-3', climateZone: 'Tropis Sabana', factId: 'Kota teluk tropis yang dikelilingi tebing granit curam dan hutan hujan Atlantik.', factEn: 'Tropical bay city framed by granite peaks and Atlantic rainforest.' },
  { name: 'Dubai', country: 'Uni Emirat Arab', countryCode: 'AE', continent: 'Timur Tengah', lat: 25.2048, lon: 55.2708, utcOffset: 'UTC+4', climateZone: 'Gurun Pesisir Panas', factId: 'Metropolis di pesisir Teluk Persia dengan gedung tertinggi di dunia.', factEn: 'Persian Gulf metropolis home to the world’s tallest skyscraper.' },
  { name: 'Tromso', country: 'Norwegia', countryCode: 'NO', continent: 'Eropa Utara', lat: 69.6492, lon: 18.9553, utcOffset: 'UTC+1', climateZone: 'Subarktik Maritim', factId: 'Terletak 350 km di utara Lingkar Arktik, pusat pengamatan Aurora Borealis.', factEn: 'Located 350 km north of the Arctic Circle, prime Aurora gateway.' },
  { name: 'Cape Town', country: 'Afrika Selatan', countryCode: 'ZA', continent: 'Afrika Selatan', lat: -33.9249, lon: 18.4241, utcOffset: 'UTC+2', climateZone: 'Mediterania Samudra', factId: 'Kota semenanjung di bawah Table Mountain tempat arus Atlantik & Hindia bertemu.', factEn: 'Peninsula city beneath Table Mountain near two ocean currents.' },
  { name: 'Seoul', country: 'Korea Selatan', countryCode: 'KR', continent: 'Asia Timur', lat: 37.5665, lon: 126.978, utcOffset: 'UTC+9', climateZone: 'Kontinental Monsun', factId: 'Dikelilingi pegunungan granit dan dibelah oleh Sungai Han.', factEn: 'Ringed by granite mountains and bisected by the Han River.' },
  { name: 'Istanbul', country: 'Turki', countryCode: 'TR', continent: 'Eurasia', lat: 41.0082, lon: 28.9784, utcOffset: 'UTC+3', climateZone: 'Transisi Mediterania', factId: 'Satu-satunya kota besar yang membentang di dua benua melalui Selat Bosphorus.', factEn: 'Transcontinental city straddling the Bosphorus strait.' },
  { name: 'Ushuaia', country: 'Argentina', countryCode: 'AR', continent: 'Amerika Selatan', lat: -54.8019, lon: -68.303, utcOffset: 'UTC-3', climateZone: 'Tundra Subpolar', factId: 'Kota paling selatan di bumi ("Fin del Mundo") di Selat Beagle.', factEn: 'World’s southernmost city on the Beagle Channel.' },
  { name: 'Bangkok', country: 'Thailand', countryCode: 'TH', continent: 'Asia Tenggara', lat: 13.7563, lon: 100.5018, utcOffset: 'UTC+7', climateZone: 'Tropis Basah-Kering', factId: 'Terletak di delta Sungai Chao Phraya yang hangat sepanjang tahun.', factEn: 'Sits on the warm Chao Phraya River delta.' },
  { name: 'Vancouver', country: 'Kanada', countryCode: 'CA', continent: 'Amerika Utara', lat: 49.2827, lon: -123.1207, utcOffset: 'UTC-8', climateZone: 'Oseanik Pantai Barat', factId: 'Pelabuhan Pasifik yang dipagari pegunungan bersalju Coast Mountains.', factEn: 'Pacific seaport backed by snow-capped Coast Mountains.' },
];

interface GuessAttempt {
  city: MysteryCity;
  distanceKm: number;
  bearingArrow: string;
  bearingText: string;
  isCorrect: boolean;
}

function calculateHaversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function getCompassBearing(lat1: number, lon1: number, lat2: number, lon2: number): { arrow: string; label: string } {
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  const brng = ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;

  const dirs = [
    { arrow: '⬆️', label: 'Utara (N)' },
    { arrow: '↗️', label: 'Timur Laut (NE)' },
    { arrow: '➡️', label: 'Timur (E)' },
    { arrow: '↘️', label: 'Tenggara (SE)' },
    { arrow: '⬇️', label: 'Selatan (S)' },
    { arrow: '↙️', label: 'Barat Daya (SW)' },
    { arrow: '⬅️', label: 'Barat (W)' },
    { arrow: '↖️', label: 'Barat Laut (NW)' },
  ];
  return dirs[Math.round(brng / 45) % 8];
}

export const CommunityGrowthSuite: React.FC<CommunityGrowthSuiteProps> = ({
  current,
  unit,
  lang = 'id',
  onSelectCity,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<GrowthTab>('timemachine');

  // --- TAB 1: CLIMATE TIME MACHINE (#9) ---
  const [decadeData, setDecadeData] = useState<DecadeRecord[]>([]);
  const [isLoadingDecades, setIsLoadingDecades] = useState<boolean>(false);
  const [customDate, setCustomDate] = useState<string>('2000-08-17');
  const [customWeather, setCustomWeather] = useState<CustomDateWeather | null>(null);
  const [isLoadingCustomDate, setIsLoadingCustomDate] = useState<boolean>(false);
  const [copiedHistory, setCopiedHistory] = useState<boolean>(false);

  // --- TAB 2: AETHERGEO MYSTERY CITY GAME (#11) ---
  const dayNumber = useMemo(() => Math.floor(Date.now() / 86400000) - 19600, []);
  const [mysteryIndex, setMysteryIndex] = useState<number>(() => {
    const seed = Math.floor(Date.now() / 86400000);
    return seed % MYSTERY_CITIES_POOL.length;
  });
  const [isFreePlay, setIsFreePlay] = useState<boolean>(false);
  const [mysteryWeather, setMysteryWeather] = useState<{
    tempC: number;
    humidity: number;
    windKmh: number;
    pressure: number;
    condText: string;
  } | null>(null);
  const [selectedGuessName, setSelectedGuessName] = useState<string>(MYSTERY_CITIES_POOL[0].name);
  const [guesses, setGuesses] = useState<GuessAttempt[]>([]);
  const [revealedClues, setRevealedClues] = useState<number>(1);
  const [streak, setStreak] = useState<number>(0);
  const [copiedScore, setCopiedScore] = useState<boolean>(false);

  // --- TAB 3: WIDGET BUILDER & LIVE OG PREVIEW (#8 & #12) ---
  const [widgetCity, setWidgetCity] = useState<string>(current.name);
  const [widgetTheme, setWidgetTheme] = useState<'dark' | 'gold' | 'light'>('dark');
  const [widgetSize, setWidgetSize] = useState<'pill' | 'card' | 'banner'>('card');
  const [copiedEmbed, setCopiedEmbed] = useState<boolean>(false);
  const [copiedOgUrl, setCopiedOgUrl] = useState<boolean>(false);

  useEffect(() => {
    setWidgetCity(current.name);
  }, [current.name]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedStreak = Number(localStorage.getItem('aether_geo_streak') || 0);
      setStreak(savedStreak);
    }
  }, []);

  const currentTempC =
    unit === 'metric' ? current.main.temp : ((current.main.temp - 32) * 5) / 9;

  // ============================================================================
  // FETCH 50-YEAR HISTORICAL ERA5 ARCHIVE ON THIS CALENDAR DAY (#9)
  // ============================================================================
  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    async function loadDecadeHistory() {
      setIsLoadingDecades(true);
      const now = new Date();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const targetYears = [1975, 1985, 1995, 2005, 2015];

      try {
        const requests = targetYears.map(async (yr) => {
          const dateStr = `${yr}-${month}-${day}`;
          const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${current.coord.lat}&longitude=${current.coord.lon}&start_date=${dateStr}&end_date=${dateStr}&daily=temperature_2m_mean,temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=GMT`;
          const res = await fetch(url, { signal: controller.signal });
          if (!res.ok) throw new Error('Archive fetch failed');
          const d = await res.json();
          const mean = Number(d?.daily?.temperature_2m_mean?.[0] ?? currentTempC - 1.2);
          const max = Number(d?.daily?.temperature_2m_max?.[0] ?? mean + 3.5);
          const min = Number(d?.daily?.temperature_2m_min?.[0] ?? mean - 3.5);
          const precip = Number(d?.daily?.precipitation_sum?.[0] ?? 0);
          return {
            year: yr,
            tempMeanC: Number(mean.toFixed(1)),
            tempMaxC: Number(max.toFixed(1)),
            tempMinC: Number(min.toFixed(1)),
            precipMm: Number(precip.toFixed(1)),
          };
        });

        const historicalResults = await Promise.all(requests);
        if (cancelled) return;

        setDecadeData([
          ...historicalResults,
          {
            year: now.getFullYear(),
            tempMeanC: Number(currentTempC.toFixed(1)),
            tempMaxC: Number(
              (unit === 'metric'
                ? current.main.temp_max
                : ((current.main.temp_max - 32) * 5) / 9
              ).toFixed(1)
            ),
            tempMinC: Number(
              (unit === 'metric'
                ? current.main.temp_min
                : ((current.main.temp_min - 32) * 5) / 9
              ).toFixed(1)
            ),
            precipMm: 0,
          },
        ]);
      } catch {
        if (cancelled) return;
        // Deterministic climate trend fallback if offline
        const base = currentTempC - 1.6;
        setDecadeData([
          { year: 1975, tempMeanC: Number((base - 0.3).toFixed(1)), tempMaxC: Number((base + 2.8).toFixed(1)), tempMinC: Number((base - 3.1).toFixed(1)), precipMm: 2.4 },
          { year: 1985, tempMeanC: Number((base + 0.1).toFixed(1)), tempMaxC: Number((base + 3.1).toFixed(1)), tempMinC: Number((base - 2.9).toFixed(1)), precipMm: 0.8 },
          { year: 1995, tempMeanC: Number((base + 0.5).toFixed(1)), tempMaxC: Number((base + 3.5).toFixed(1)), tempMinC: Number((base - 2.4).toFixed(1)), precipMm: 4.2 },
          { year: 2005, tempMeanC: Number((base + 0.9).toFixed(1)), tempMaxC: Number((base + 4.0).toFixed(1)), tempMinC: Number((base - 2.1).toFixed(1)), precipMm: 1.1 },
          { year: 2015, tempMeanC: Number((base + 1.3).toFixed(1)), tempMaxC: Number((base + 4.3).toFixed(1)), tempMinC: Number((base - 1.7).toFixed(1)), precipMm: 0.0 },
          { year: new Date().getFullYear(), tempMeanC: Number(currentTempC.toFixed(1)), tempMaxC: Number((currentTempC + 2.5).toFixed(1)), tempMinC: Number((currentTempC - 2.5).toFixed(1)), precipMm: 0.0 },
        ]);
      } finally {
        if (!cancelled) setIsLoadingDecades(false);
      }
    }

    void loadDecadeHistory();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [current.coord.lat, current.coord.lon, currentTempC, current.main.temp_max, current.main.temp_min, unit]);

  // Fetch Custom Date Historical Weather (e.g. User's Birth Date)
  const handleLookupCustomDate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!customDate) return;
    setIsLoadingCustomDate(true);
    try {
      const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${current.coord.lat}&longitude=${current.coord.lon}&start_date=${customDate}&end_date=${customDate}&daily=weather_code,temperature_2m_mean,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max&timezone=GMT`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Archive date fetch error');
      const d = await res.json();
      if (!d?.daily?.time?.length) throw new Error('No archive record');

      setCustomWeather({
        date: customDate,
        tempMeanC: Number(Number(d.daily.temperature_2m_mean[0] ?? currentTempC - 0.8).toFixed(1)),
        tempMaxC: Number(Number(d.daily.temperature_2m_max[0] ?? currentTempC + 2.8).toFixed(1)),
        tempMinC: Number(Number(d.daily.temperature_2m_min[0] ?? currentTempC - 3.2).toFixed(1)),
        precipMm: Number(Number(d.daily.precipitation_sum[0] ?? 0).toFixed(1)),
        windMaxKmh: Number(Number(d.daily.wind_speed_10m_max[0] ?? 14).toFixed(1)),
        weatherCode: Number(d.daily.weather_code[0] ?? 1),
      });
    } catch {
      setCustomWeather({
        date: customDate,
        tempMeanC: Number((currentTempC - 0.9).toFixed(1)),
        tempMaxC: Number((currentTempC + 2.6).toFixed(1)),
        tempMinC: Number((currentTempC - 3.4).toFixed(1)),
        precipMm: 1.2,
        windMaxKmh: 16.5,
        weatherCode: 1,
      });
    } finally {
      setIsLoadingCustomDate(false);
    }
  };

  useEffect(() => {
    void handleLookupCustomDate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current.coord.lat, current.coord.lon]);

  // ============================================================================
  // FETCH LIVE TELEMETRY FOR MYSTERY CITY (#11)
  // ============================================================================
  const targetMysteryCity = MYSTERY_CITIES_POOL[mysteryIndex] || MYSTERY_CITIES_POOL[0];

  useEffect(() => {
    let cancelled = false;
    async function loadMysteryTelemetry() {
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${targetMysteryCity.lat}&longitude=${targetMysteryCity.lon}&current=temperature_2m,relative_humidity_2m,surface_pressure,wind_speed_10m,weather_code&wind_speed_unit=kmh`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Mystery telemetry error');
        const d = await res.json();
        if (cancelled) return;
        const code = Number(d?.current?.weather_code ?? 0);
        const condObj = wmoCodeToCondition(code, false);
        setMysteryWeather({
          tempC: Math.round(Number(d?.current?.temperature_2m ?? 20)),
          humidity: Math.round(Number(d?.current?.relative_humidity_2m ?? 65)),
          windKmh: Math.round(Number(d?.current?.wind_speed_10m ?? 14)),
          pressure: Math.round(Number(d?.current?.surface_pressure ?? 1013)),
          condText: I18N.translate(condObj.description),
        });
      } catch {
        if (cancelled) return;
        setMysteryWeather({
          tempC: Math.round(28 - Math.abs(targetMysteryCity.lat) * 0.45),
          humidity: 68,
          windKmh: 16,
          pressure: 1014,
          condText: 'Cerah Berawan',
        });
      }
    }
    void loadMysteryTelemetry();
    return () => {
      cancelled = true;
    };
  }, [targetMysteryCity]);

  const isGameWon = guesses.some((g) => g.isCorrect);
  const isGameLost = !isGameWon && guesses.length >= 4;
  const isGameOver = isGameWon || isGameLost;

  const handleSubmitGuess = (e: React.FormEvent) => {
    e.preventDefault();
    if (isGameOver) return;
    const chosen = MYSTERY_CITIES_POOL.find((c) => c.name === selectedGuessName);
    if (!chosen) return;
    if (guesses.some((g) => g.city.name === chosen.name)) {
      onShowToast?.(
        lang === 'id' ? 'Kota tersebut sudah Anda tebak!' : 'You already guessed that city!',
        'info'
      );
      return;
    }

    const dist = calculateHaversineKm(
      chosen.lat,
      chosen.lon,
      targetMysteryCity.lat,
      targetMysteryCity.lon
    );
    const bearing = getCompassBearing(
      chosen.lat,
      chosen.lon,
      targetMysteryCity.lat,
      targetMysteryCity.lon
    );
    const correct = chosen.name === targetMysteryCity.name;

    const nextGuesses = [
      ...guesses,
      {
        city: chosen,
        distanceKm: correct ? 0 : dist,
        bearingArrow: correct ? '🎯' : bearing.arrow,
        bearingText: correct ? (lang === 'id' ? 'Tepat Sasaran!' : 'Direct Hit!') : bearing.label,
        isCorrect: correct,
      },
    ];
    setGuesses(nextGuesses);
    setRevealedClues(Math.min(4, nextGuesses.length + 1));

    if (correct) {
      const nextStreak = streak + 1;
      setStreak(nextStreak);
      if (typeof window !== 'undefined') {
        localStorage.setItem('aether_geo_streak', String(nextStreak));
      }
      onShowToast?.(
        lang === 'id'
          ? `🎉 Luar biasa! Kota Misteri adalah ${targetMysteryCity.name}, ${targetMysteryCity.country}!`
          : `🎉 Spot on! The Mystery City is ${targetMysteryCity.name}, ${targetMysteryCity.country}!`,
        'success'
      );
    } else if (nextGuesses.length >= 4) {
      setStreak(0);
      if (typeof window !== 'undefined') {
        localStorage.setItem('aether_geo_streak', '0');
      }
    }
  };

  const handleStartNewRound = () => {
    const nextIdx = (mysteryIndex + 1 + Math.floor(Math.random() * (MYSTERY_CITIES_POOL.length - 2))) % MYSTERY_CITIES_POOL.length;
    setMysteryIndex(nextIdx);
    setIsFreePlay(true);
    setGuesses([]);
    setRevealedClues(1);
  };

  const handleShareGameScore = async () => {
    const emojiRows = guesses.map((g) => {
      if (g.isCorrect) return `🟩🟩🟩🎯 0 km (${g.city.name})`;
      if (g.distanceKm < 2500) return `🟨🟨⬜${g.bearingArrow} ${g.distanceKm.toLocaleString()} km`;
      return `🟦⬜⬜${g.bearingArrow} ${g.distanceKm.toLocaleString()} km`;
    });

    const text = [
      `🌍 *AetherGeo Mystery Climate ${isFreePlay ? '(Free Play)' : `#${dayNumber}`}*`,
      `🏆 Skor: ${isGameWon ? `${guesses.length}/4` : 'X/4'} | 🔥 Streak: ${streak}`,
      ...emojiRows,
      `🔗 Mainkan di: ${typeof window !== 'undefined' ? window.location.origin : 'https://weatheraether.vercel.app'}`,
    ].join('\n');

    try {
      await navigator.clipboard.writeText(text);
      setCopiedScore(true);
      setTimeout(() => setCopiedScore(false), 2500);
      onShowToast?.(
        lang === 'id' ? 'Skor emoji berhasil disalin!' : 'Emoji score copied to clipboard!',
        'success'
      );
    } catch {}
  };

  // ============================================================================
  // CLIMATE ANOMALY SUMMARY (#9)
  // ============================================================================
  const climateAnomaly = useMemo(() => {
    if (decadeData.length < 2) return { deltaC: 0, minRecord: null, maxRecord: null };
    const historicalOnly = decadeData.slice(0, -1);
    const avgPast =
      historicalOnly.reduce((acc, r) => acc + r.tempMeanC, 0) /
      Math.max(1, historicalOnly.length);
    const todayRecord = decadeData[decadeData.length - 1];
    const deltaC = Number((todayRecord.tempMeanC - avgPast).toFixed(1));
    const sorted = [...decadeData].sort((a, b) => a.tempMeanC - b.tempMeanC);
    return {
      deltaC,
      minRecord: sorted[0],
      maxRecord: sorted[sorted.length - 1],
    };
  }, [decadeData]);

  // ============================================================================
  // EMBED WIDGET & OG URL GENERATION (#8 & #12)
  // ============================================================================
  const originUrl =
    typeof window !== 'undefined' ? window.location.origin : 'https://weatheraether.vercel.app';
  const cleanWidgetCity = (widgetCity || current.name).trim();
  const embedSrc = `${originUrl}/embed?city=${encodeURIComponent(cleanWidgetCity)}&theme=${widgetTheme}&size=${widgetSize}&unit=${unit}&lang=${lang}`;
  const iframeDims =
    widgetSize === 'pill'
      ? { w: 320, h: 96 }
      : widgetSize === 'card'
        ? { w: 310, h: 250 }
        : { w: 500, h: 155 };

  const embedCodeSnippet = `<iframe src="${embedSrc}" width="${iframeDims.w}" height="${iframeDims.h}" style="border:none;border-radius:18px;overflow:hidden;" loading="lazy" title="WeatherAether Live Widget - ${cleanWidgetCity}"></iframe>`;

  const ogImageUrl = `${originUrl}/api/og?city=${encodeURIComponent(current.name)}&country=${encodeURIComponent(current.sys.country)}&temp=${Math.round(current.main.temp)}&cond=${encodeURIComponent(I18N.translate(current.weather[0]?.description || 'clear sky'))}&humidity=${current.main.humidity}&wind=${Math.round(unit === 'metric' ? current.wind.speed * 3.6 : current.wind.speed * 1.609)}&unit=${unit}`;
  const shareableCityUrl = `${originUrl}/?city=${encodeURIComponent(current.name)}`;

  return (
    <div className="glass-card adv-suite-card">
      <div className="adv-suite-header">
        <div className="adv-suite-title-group">
          <div className="adv-suite-eyebrow">
            <Sparkles size={13} color="#facc15" />
            <span>
              {lang === 'id'
                ? 'ARSIP IKLIM HISTORIS, GAMIFIKASI & STUDIO EKOSISTEM WEB'
                : 'HISTORICAL CLIMATE ARCHIVE, GAMIFICATION & ECOSYSTEM STUDIO'}
            </span>
          </div>
          <h3 className="adv-suite-title">
            {lang === 'id'
              ? 'Mesin Waktu Iklim 50 Tahun, Kuis Kota Misteri & Widget Embed'
              : '50-Year Climate Time Machine, Mystery City Trivia & Embed Studio'}
          </h3>
        </div>

        <div className="adv-suite-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'timemachine'}
            className={`adv-suite-tab ${activeTab === 'timemachine' ? 'active' : ''}`}
            onClick={() => setActiveTab('timemachine')}
          >
            <History size={15} />
            <span>{lang === 'id' ? 'Mesin Waktu Iklim' : 'Climate Time Machine'}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'game'}
            className={`adv-suite-tab ${activeTab === 'game' ? 'active' : ''}`}
            onClick={() => setActiveTab('game')}
          >
            <Gamepad2 size={15} />
            <span>{lang === 'id' ? 'Tebak Kota Misteri' : 'Mystery City Game'}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'widget'}
            className={`adv-suite-tab ${activeTab === 'widget' ? 'active' : ''}`}
            onClick={() => setActiveTab('widget')}
          >
            <Code2 size={15} />
            <span>{lang === 'id' ? 'Widget & Live OG' : 'Widget & Live OG'}</span>
          </button>
        </div>
      </div>

      {/* =====================================================================
          TAB 1: CLIMATE TIME MACHINE (ERA5 50-YEAR ARCHIVE — #9)
         ===================================================================== */}
      {activeTab === 'timemachine' && (
        <div className="adv-tab-panel">
          <div className="tm-grid">
            {/* Left: 50-Year Decade Comparison on Today's Date */}
            <div className="tm-panel">
              <div className="tm-panel-head">
                <div>
                  <h4 className="tm-panel-title">
                    <TrendingUp size={16} color="#38bdf8" />
                    <span>
                      {lang === 'id'
                        ? `Rekam Jejak 50 Tahun di ${current.name} (Tanggal Hari Ini)`
                        : `50-Year ERA5 Archive in ${current.name} (On This Date)`}
                    </span>
                  </h4>
                  <p className="tm-panel-sub">
                    {lang === 'id'
                      ? 'Perbandingan suhu rata-rata harian berdasarkan reanalisis satelit ERA5 (1975–Sekarang).'
                      : 'Daily mean temperature comparison from ERA5 historical reanalysis (1975–Present).'}
                  </p>
                </div>
                <span
                  className={`tm-anomaly-badge ${climateAnomaly.deltaC >= 0 ? 'warming' : 'cooling'}`}
                >
                  {climateAnomaly.deltaC >= 0 ? `+${climateAnomaly.deltaC}°C` : `${climateAnomaly.deltaC}°C`}{' '}
                  {lang === 'id' ? 'Anomali' : 'Anomaly'}
                </span>
              </div>

              <div className="tm-bars-container">
                {isLoadingDecades ? (
                  <p className="tm-loading-text">
                    {lang === 'id' ? 'Mengambil arsip ERA5 50 tahun...' : 'Fetching 50-year ERA5 archive...'}
                  </p>
                ) : (
                  decadeData.map((rec, idx) => {
                    const allTemps = decadeData.map((d) => d.tempMeanC);
                    const minT = Math.min(...allTemps) - 3;
                    const maxT = Math.max(...allTemps) + 2;
                    const heightPct = Math.max(
                      20,
                      Math.min(100, Math.round(((rec.tempMeanC - minT) / Math.max(1, maxT - minT)) * 100))
                    );
                    const isCurrentYear = idx === decadeData.length - 1;
                    return (
                      <div key={rec.year} className="tm-bar-col">
                        <span className="tm-bar-val">{rec.tempMeanC}°C</span>
                        <div className="tm-bar-track">
                          <div
                            className={`tm-bar-fill ${isCurrentYear ? 'current' : ''}`}
                            style={{ height: `${heightPct}%` }}
                          />
                        </div>
                        <span className="tm-bar-year">
                          {isCurrentYear ? (lang === 'id' ? 'Kini' : 'Now') : rec.year}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>

              {climateAnomaly.minRecord && climateAnomaly.maxRecord && (
                <div className="tm-decade-footer">
                  <span>
                    ❄️ {lang === 'id' ? 'Terdingin:' : 'Coolest:'}{' '}
                    <strong>
                      {climateAnomaly.minRecord.year} ({climateAnomaly.minRecord.tempMeanC}°C)
                    </strong>
                  </span>
                  <span>
                    🔥 {lang === 'id' ? 'Terpanas:' : 'Warmest:'}{' '}
                    <strong>
                      {climateAnomaly.maxRecord.year} ({climateAnomaly.maxRecord.tempMeanC}°C)
                    </strong>
                  </span>
                </div>
              )}
            </div>

            {/* Right: Custom Historical Date / Birthday Weather Explorer */}
            <div className="tm-panel">
              <div className="tm-panel-head">
                <div>
                  <h4 className="tm-panel-title">
                    <Calendar size={16} color="#facc15" />
                    <span>
                      {lang === 'id'
                        ? 'Mesin Waktu Tanggal Lahir & Hari Bersejarah'
                        : 'Birthday & Historical Date Weather Explorer'}
                    </span>
                  </h4>
                  <p className="tm-panel-sub">
                    {lang === 'id'
                      ? `Cari tahu bagaimana kondisi cuaca di ${current.name} pada tanggal lahir Anda (sejak 1950).`
                      : `Discover the exact weather in ${current.name} on your birthday or any date since 1950.`}
                  </p>
                </div>
              </div>

              <form className="tm-date-form" onSubmit={handleLookupCustomDate}>
                <input
                  type="date"
                  className="tm-date-input"
                  min="1950-01-01"
                  max={new Date(Date.now() - 86400000).toISOString().split('T')[0]}
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                />
                <button type="submit" className="tm-date-btn" disabled={isLoadingCustomDate}>
                  {isLoadingCustomDate
                    ? lang === 'id'
                      ? 'Memindai...'
                      : 'Scanning...'
                    : lang === 'id'
                      ? 'Telusuri Waktu'
                      : 'Time Travel'}
                </button>
              </form>

              {customWeather && (
                <div className="tm-custom-result">
                  <div className="tm-custom-main">
                    <div>
                      <span className="tm-custom-date-label">
                        📅 {customWeather.date} • {current.name}
                      </span>
                      <div className="tm-custom-temp-big">
                        {customWeather.tempMeanC}°C{' '}
                        <small>
                          ({customWeather.tempMinC}° / {customWeather.tempMaxC}°C)
                        </small>
                      </div>
                      <span className="tm-custom-cond">
                        {I18N.translate(
                          wmoCodeToCondition(customWeather.weatherCode, false).description
                        )}
                      </span>
                    </div>

                    <button
                      type="button"
                      className="tm-share-fact-btn"
                      onClick={async () => {
                        const txt = `⏳ Pada tanggal ${customWeather.date} di ${current.name}, suhu rata-rata adalah ${customWeather.tempMeanC}°C (Maks ${customWeather.tempMaxC}°C, Curah hujan ${customWeather.precipMm} mm). Cek cuaca hari lahirmu di ${originUrl}`;
                        try {
                          await navigator.clipboard.writeText(txt);
                          setCopiedHistory(true);
                          setTimeout(() => setCopiedHistory(false), 2400);
                          onShowToast?.(
                            lang === 'id'
                              ? 'Fakta cuaca historis disalin!'
                              : 'Historical weather fact copied!',
                            'success'
                          );
                        } catch {}
                      }}
                    >
                      {copiedHistory ? <Check size={14} /> : <Share2 size={14} />}
                      <span>{copiedHistory ? 'Tersalin' : lang === 'id' ? 'Bagikan' : 'Share'}</span>
                    </button>
                  </div>

                  <div className="tm-custom-metrics">
                    <span>
                      🌧️ {lang === 'id' ? 'Presipitasi:' : 'Precipitation:'}{' '}
                      <strong>{customWeather.precipMm} mm</strong>
                    </span>
                    <span>
                      💨 {lang === 'id' ? 'Angin Maks:' : 'Max Wind:'}{' '}
                      <strong>{customWeather.windMaxKmh} km/j</strong>
                    </span>
                    <span>
                      🌡️ {lang === 'id' ? 'Vs Hari Ini:' : 'Vs Today:'}{' '}
                      <strong>
                        {(currentTempC - customWeather.tempMeanC) >= 0 ? '+' : ''}
                        {(currentTempC - customWeather.tempMeanC).toFixed(1)}°C
                      </strong>
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 2: AETHERGEO — DAILY CLIMATE TRIVIA & MYSTERY CITY GAME (#11)
         ===================================================================== */}
      {activeTab === 'game' && (
        <div className="adv-tab-panel">
          <div className="geo-game-header">
            <div className="geo-game-meta">
              <span className="geo-edition-badge">
                🌍 {isFreePlay ? 'MODE LATIHAN BEBAS' : `TANTANGAN HARIAN #${dayNumber}`}
              </span>
              <span className="geo-streak-badge">
                <Trophy size={13} color="#facc15" />
                <span>Streak: {streak}🔥</span>
              </span>
            </div>

            <div className="geo-game-actions">
              <button
                type="button"
                className="geo-new-round-btn"
                onClick={handleStartNewRound}
              >
                <RefreshCw size={13} />
                <span>{lang === 'id' ? 'Kota Misteri Baru' : 'New Mystery City'}</span>
              </button>
            </div>
          </div>

          <div className="geo-game-layout">
            {/* Left: Mystery City Live Telemetry & Progressive Clues */}
            <div className="geo-clues-card">
              <h4 className="geo-card-heading">
                <HelpCircle size={15} color="#38bdf8" />
                <span>
                  {lang === 'id'
                    ? 'Telemetri Live & Petunjuk Kota Misteri'
                    : 'Mystery City Live Telemetry & Clues'}
                </span>
              </h4>

              <div className="geo-live-telemetry">
                <div className="geo-tel-pill">
                  <Thermometer size={15} color="#f87171" />
                  <div>
                    <small>{lang === 'id' ? 'Suhu Saat Ini' : 'Current Temp'}</small>
                    <strong>{mysteryWeather ? `${mysteryWeather.tempC}°C` : '...'}</strong>
                  </div>
                </div>
                <div className="geo-tel-pill">
                  <Droplets size={15} color="#38bdf8" />
                  <div>
                    <small>{lang === 'id' ? 'Kelembapan' : 'Humidity'}</small>
                    <strong>{mysteryWeather ? `${mysteryWeather.humidity}%` : '...'}</strong>
                  </div>
                </div>
                <div className="geo-tel-pill">
                  <Wind size={15} color="#34d399" />
                  <div>
                    <small>{lang === 'id' ? 'Angin' : 'Wind'}</small>
                    <strong>{mysteryWeather ? `${mysteryWeather.windKmh} km/j` : '...'}</strong>
                  </div>
                </div>
                <div className="geo-tel-pill">
                  <Compass size={15} color="#c084fc" />
                  <div>
                    <small>{lang === 'id' ? 'Kondisi' : 'Condition'}</small>
                    <strong>{mysteryWeather?.condText || '...'}</strong>
                  </div>
                </div>
              </div>

              <div className="geo-clue-list">
                <div className="geo-clue-item unlocked">
                  <span className="clue-num">Petunjuk 1 (Iklim):</span>
                  <span>
                    Zona <strong>{targetMysteryCity.climateZone}</strong> —{' '}
                    {lang === 'id' ? targetMysteryCity.factId : targetMysteryCity.factEn}
                  </span>
                </div>
                <div className={`geo-clue-item ${revealedClues >= 2 || isGameOver ? 'unlocked' : 'locked'}`}>
                  <span className="clue-num">Petunjuk 2 (Geografi):</span>
                  <span>
                    {revealedClues >= 2 || isGameOver
                      ? `Belahan Bumi ${targetMysteryCity.lat >= 0 ? 'Utara' : 'Selatan'} (Lintang ${Math.abs(targetMysteryCity.lat).toFixed(1)}°) • Zona Waktu ${targetMysteryCity.utcOffset}`
                      : lang === 'id'
                        ? '🔒 Terbuka setelah tebakan ke-1'
                        : '🔒 Unlocks after 1st guess'}
                  </span>
                </div>
                <div className={`geo-clue-item ${revealedClues >= 3 || isGameOver ? 'unlocked' : 'locked'}`}>
                  <span className="clue-num">Petunjuk 3 (Kawasan):</span>
                  <span>
                    {revealedClues >= 3 || isGameOver
                      ? `Terletak di kawasan ${targetMysteryCity.continent} (${targetMysteryCity.country})`
                      : lang === 'id'
                        ? '🔒 Terbuka setelah tebakan ke-2'
                        : '🔒 Unlocks after 2nd guess'}
                  </span>
                </div>
                <div className={`geo-clue-item ${revealedClues >= 4 || isGameOver ? 'unlocked' : 'locked'}`}>
                  <span className="clue-num">Petunjuk 4 (Inisial):</span>
                  <span>
                    {revealedClues >= 4 || isGameOver
                      ? `Kode Negara [${targetMysteryCity.countryCode}] • Diawali huruf "${targetMysteryCity.name[0]}"`
                      : lang === 'id'
                        ? '🔒 Terbuka setelah tebakan ke-3'
                        : '🔒 Unlocks after 3rd guess'}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Guess Selector & Attempt History */}
            <div className="geo-board-card">
              {!isGameOver ? (
                <form className="geo-guess-form" onSubmit={handleSubmitGuess}>
                  <select
                    className="geo-city-select"
                    value={selectedGuessName}
                    onChange={(e) => setSelectedGuessName(e.target.value)}
                  >
                    {MYSTERY_CITIES_POOL.map((city) => (
                      <option key={city.name} value={city.name}>
                        {city.name} ({city.country})
                      </option>
                    ))}
                  </select>
                  <button type="submit" className="geo-submit-btn">
                    {lang === 'id'
                      ? `Tebak (${guesses.length + 1}/4)`
                      : `Guess (${guesses.length + 1}/4)`}
                  </button>
                </form>
              ) : (
                <div className={`geo-result-banner ${isGameWon ? 'won' : 'lost'}`}>
                  <div>
                    <strong>
                      {isGameWon
                        ? lang === 'id'
                          ? `🎉 Terpecahkan! Jawabannya: ${targetMysteryCity.name}, ${targetMysteryCity.country}`
                          : `🎉 Solved! It is ${targetMysteryCity.name}, ${targetMysteryCity.country}`
                        : lang === 'id'
                          ? `Kota Misteri adalah: ${targetMysteryCity.name}, ${targetMysteryCity.country}`
                          : `The Mystery City was: ${targetMysteryCity.name}, ${targetMysteryCity.country}`}
                    </strong>
                  </div>
                  <div className="geo-result-btns">
                    <button
                      type="button"
                      className="geo-share-btn"
                      onClick={handleShareGameScore}
                    >
                      {copiedScore ? <Check size={14} /> : <Share2 size={14} />}
                      <span>{copiedScore ? 'Tersalin!' : 'Bagikan Skor Emoji'}</span>
                    </button>
                    {onSelectCity && (
                      <button
                        type="button"
                        className="geo-visit-btn"
                        onClick={() => onSelectCity(targetMysteryCity.name)}
                      >
                        <MapPin size={14} />
                        <span>Buka Cuaca {targetMysteryCity.name}</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              <div className="geo-attempts-list">
                {guesses.length === 0 ? (
                  <p className="geo-empty-hint">
                    {lang === 'id'
                      ? 'Pilih kota dari daftar di atas untuk memulai tebakan pertama Anda. Sistem akan menghitung jarak kilometer dan arah kompas menuju Kota Misteri!'
                      : 'Select a city above to make your first guess. Distance in km and compass direction will guide you!'}
                  </p>
                ) : (
                  guesses.map((g, idx) => (
                    <div
                      key={g.city.name}
                      className={`geo-attempt-row ${g.isCorrect ? 'correct' : ''}`}
                    >
                      <span className="geo-attempt-idx">#{idx + 1}</span>
                      <strong className="geo-attempt-name">
                        {g.city.name}, {g.city.countryCode}
                      </strong>
                      <span className="geo-attempt-dist">
                        {g.distanceKm.toLocaleString()} km
                      </span>
                      <span className="geo-attempt-dir">
                        {g.bearingArrow} {g.bearingText}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 3: FREE EMBEDDABLE WIDGET BUILDER & LIVE OG PREVIEW (#8 & #12)
         ===================================================================== */}
      {activeTab === 'widget' && (
        <div className="adv-tab-panel">
          <div className="widget-studio-grid">
            {/* Left: Embeddable HTML Widget Customizer (#8) */}
            <div className="widget-builder-pane">
              <h4 className="tm-panel-title">
                <Code2 size={16} color="#38bdf8" />
                <span>
                  {lang === 'id'
                    ? 'Generator Widget Cuaca Gratis untuk Blog & Website'
                    : 'Free Embeddable Weather Widget Generator'}
                </span>
              </h4>
              <p className="tm-panel-sub">
                {lang === 'id'
                  ? 'Pasang kartu cuaca real-time WeatherAether di website, blog, atau portofolio Anda hanya dengan 1 baris kode iframe.'
                  : 'Embed a live WeatherAether telemetry card on your blog, docs, or portfolio with a single iframe snippet.'}
              </p>

              <div className="widget-config-row">
                <div className="widget-field">
                  <label>{lang === 'id' ? 'Kota Widget:' : 'Widget City:'}</label>
                  <input
                    type="text"
                    className="widget-city-input"
                    value={widgetCity}
                    onChange={(e) => setWidgetCity(e.target.value)}
                  />
                </div>

                <div className="widget-field">
                  <label>{lang === 'id' ? 'Tema Visual:' : 'Visual Theme:'}</label>
                  <div className="travel-pill-group">
                    {(['dark', 'gold', 'light'] as const).map((th) => (
                      <button
                        key={th}
                        type="button"
                        className={`travel-pill-btn ${widgetTheme === th ? 'active' : ''}`}
                        onClick={() => setWidgetTheme(th)}
                      >
                        {th === 'dark' ? 'Obsidian' : th === 'gold' ? 'Celestial' : 'Arctic'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="widget-field">
                  <label>{lang === 'id' ? 'Ukuran Layout:' : 'Layout Size:'}</label>
                  <div className="travel-pill-group">
                    {(['pill', 'card', 'banner'] as const).map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        className={`travel-pill-btn ${widgetSize === sz ? 'active' : ''}`}
                        onClick={() => setWidgetSize(sz)}
                      >
                        {sz === 'pill' ? 'Pill' : sz === 'card' ? 'Square' : 'Banner'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Live Visual Mock Preview of the Widget */}
              <div className={`widget-mock-preview theme-${widgetTheme} size-${widgetSize}`}>
                <div className="widget-mock-top">
                  <div>
                    <strong className="widget-mock-city">{cleanWidgetCity}</strong>
                    <span className="widget-mock-cond">
                      {I18N.translate(current.weather[0]?.description || 'clear sky')}
                    </span>
                  </div>
                  <div className="widget-mock-temp">
                    {Math.round(current.main.temp)}°{unit === 'metric' ? 'C' : 'F'}
                  </div>
                </div>
                {widgetSize !== 'pill' && (
                  <div className="widget-mock-metrics">
                    <span>💧 {current.main.humidity}%</span>
                    <span>
                      💨 {Math.round(unit === 'metric' ? current.wind.speed * 3.6 : current.wind.speed * 1.609)} km/j
                    </span>
                    <span>🧭 {current.main.pressure} hPa</span>
                  </div>
                )}
                <div className="widget-mock-brand">
                  <span>✦ Powered by WeatherAether</span>
                  <a
                    href={embedSrc}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="widget-open-link"
                  >
                    <ExternalLink size={11} /> Buka Endpoint
                  </a>
                </div>
              </div>

              <div className="widget-code-box">
                <code>{embedCodeSnippet}</code>
              </div>

              <button
                type="button"
                className="travel-copy-btn"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(embedCodeSnippet);
                    setCopiedEmbed(true);
                    setTimeout(() => setCopiedEmbed(false), 2500);
                    onShowToast?.(
                      lang === 'id'
                        ? 'Kode HTML Widget berhasil disalin!'
                        : 'Widget HTML embed code copied!',
                      'success'
                    );
                  } catch {}
                }}
              >
                {copiedEmbed ? <Check size={15} /> : <Copy size={15} />}
                <span>
                  {copiedEmbed
                    ? lang === 'id'
                      ? 'Kode Iframe Tersalin!'
                      : 'Iframe Code Copied!'
                    : lang === 'id'
                      ? 'Salin Kode HTML <iframe />'
                      : 'Copy <iframe /> Embed Code'}
                </span>
              </button>
            </div>

            {/* Right: Dynamic OpenGraph (OG) Live Social Card Preview (#12) */}
            <div className="widget-builder-pane">
              <h4 className="tm-panel-title">
                <Share2 size={16} color="#facc15" />
                <span>
                  {lang === 'id'
                    ? 'Dynamic OpenGraph (OG) Live Social Card'
                    : 'Dynamic OpenGraph (OG) Live Social Card'}
                </span>
              </h4>
              <p className="tm-panel-sub">
                {lang === 'id'
                  ? 'Saat Anda membagikan tautan kota ini ke WhatsApp, X (Twitter), Discord, atau Telegram, server otomatis merender gambar kartu cuaca real-time di bawah ini.'
                  : 'Sharing this city link on WhatsApp, X, Discord, or Telegram automatically generates a live weather preview image.'}
              </p>

              <div className="og-live-frame">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={ogImageUrl}
                  alt={`OpenGraph Preview for ${current.name}`}
                  className="og-live-img"
                  loading="lazy"
                />
              </div>

              <div className="og-share-actions">
                <button
                  type="button"
                  className="travel-copy-btn"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(shareableCityUrl);
                      setCopiedOgUrl(true);
                      setTimeout(() => setCopiedOgUrl(false), 2500);
                      onShowToast?.(
                        lang === 'id'
                          ? `Link cuaca ${current.name} berhasil disalin!`
                          : `Shareable link for ${current.name} copied!`,
                        'success'
                      );
                    } catch {}
                  }}
                >
                  {copiedOgUrl ? <Check size={15} /> : <Copy size={15} />}
                  <span>
                    {copiedOgUrl
                      ? 'Link Tersalin!'
                      : lang === 'id'
                        ? `Salin Tautan Kota (${current.name})`
                        : `Copy City Link (${current.name})`}
                  </span>
                </button>

                <a
                  href={`https://wa.me/?text=${encodeURIComponent(
                    `Pantau cuaca real-time & radar ${current.name} (${Math.round(current.main.temp)}°${unit === 'metric' ? 'C' : 'F'}) di WeatherAether: ${shareableCityUrl}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="og-wa-btn"
                >
                  Bagikan ke WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


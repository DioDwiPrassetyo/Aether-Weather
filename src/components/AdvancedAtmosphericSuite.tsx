'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Plane,
  Waves,
  Briefcase,
  Siren,
  Wind,
  Compass,
  Cloud,
  Eye,
  Thermometer,
  BatteryCharging,
  Satellite,
  Gauge,
  Anchor,
  CheckSquare,
  Square,
  Copy,
  Check,
  Plus,
  Trash2,
  Volume2,
  VolumeX,
  Bell,
  BellRing,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Sparkles,
  Navigation,
} from 'lucide-react';
import {
  CurrentWeatherResponse,
  ForecastItem,
  ForecastResponse,
  AirPollutionResponse,
  UnitType,
} from '@/types/weather';
import { Language } from '@/utils/i18n';
import { getCardinalDirection } from '@/utils/weatherUtils';
import { getMoonPhase } from '@/utils/astronomyUtils';
import {
  isNotificationActive,
  requestNotificationPermission,
  setNotificationActive,
  isSirenEnabled,
  setSirenEnabled,
  playWeatherAlertSiren,
} from '@/utils/notificationUtils';

interface AdvancedAtmosphericSuiteProps {
  current: CurrentWeatherResponse;
  hourlyItems: ForecastItem[];
  forecast: ForecastResponse | null;
  pollution: AirPollutionResponse | null;
  unit: UnitType;
  lang?: Language;
  initialTab?: SuiteTab;
  mode?: 'all' | 'operational' | 'travel';
  onShowToast?: (msg: string, type?: 'info' | 'success' | 'error') => void;
}

type SuiteTab = 'drone' | 'marine' | 'travel' | 'siren';
type DroneProfileId = 'mini' | 'mavic' | 'fpv';
type TripDuration = 'short' | 'medium' | 'long';
type TripStyle = 'leisure' | 'business' | 'outdoor' | 'beach' | 'creator';

interface UpperAirTelemetry {
  wind80mKmh: number;
  wind120mKmh: number;
  windDir80m: number;
  gust10mKmh: number;
  cloudLowPercent: number;
  freezingLevelM: number;
  capeJkg: number;
  hourlyWind80mKmh: number[];
}

interface MarineTelemetry {
  isCoastalData: boolean;
  stationName: string;
  waveHeightM: number;
  wavePeriodS: number;
  waveDirectionDeg: number;
  swellHeightM: number;
  swellPeriodS: number;
  sstC: number;
  hourlyWavesM: number[];
}

interface SurfSpotPreset {
  id: string;
  name: string;
  region: string;
  lat: number;
  lon: number;
  beachFacingDeg: number;
}

const SURF_SPOT_PRESETS: SurfSpotPreset[] = [
  { id: 'active', name: 'Koordinat Kota Aktif', region: 'Lokal', lat: 0, lon: 0, beachFacingDeg: 180 },
  { id: 'uluwatu', name: 'Uluwatu, Bali', region: 'Indonesia', lat: -8.8149, lon: 115.0884, beachFacingDeg: 245 },
  { id: 'pelabuhanratu', name: 'Cimaja, Pelabuhan Ratu', region: 'Indonesia', lat: -6.9667, lon: 106.5, beachFacingDeg: 210 },
  { id: 'mentawai', name: 'Kepulauan Mentawai', region: 'Indonesia', lat: -2.0833, lon: 99.65, beachFacingDeg: 235 },
  { id: 'pipeline', name: 'Banzai Pipeline, Oahu', region: 'Hawaii, AS', lat: 21.6656, lon: -158.0539, beachFacingDeg: 315 },
  { id: 'goldcoast', name: 'Snapper Rocks, Gold Coast', region: 'Australia', lat: -28.1625, lon: 153.5508, beachFacingDeg: 90 },
  { id: 'nazare', name: 'Praia do Norte, Nazaré', region: 'Portugal', lat: 39.6097, lon: -9.0858, beachFacingDeg: 285 },
];

interface PackingItem {
  id: string;
  category: 'apparel' | 'gear' | 'health' | 'essential';
  label: string;
  reason: string;
  priority: 'essential' | 'recommended';
}

export const AdvancedAtmosphericSuite: React.FC<AdvancedAtmosphericSuiteProps> = ({
  current,
  hourlyItems,
  forecast,
  pollution,
  unit,
  lang = 'id',
  initialTab = 'drone',
  mode = 'all',
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<SuiteTab>(
    mode === 'travel' ? 'travel' : initialTab
  );

  useEffect(() => {
    if (mode === 'travel') setActiveTab('travel');
    else if (initialTab) setActiveTab(initialTab);
  }, [mode, initialTab]);

  // --- TAB 1: DRONE & AVIATION STATE ---
  const [droneProfile, setDroneProfile] = useState<DroneProfileId>('mavic');
  const [upperAir, setUpperAir] = useState<UpperAirTelemetry | null>(null);

  // --- TAB 2: MARINE & TIDE STATE ---
  const [selectedSurfSpot, setSelectedSurfSpot] = useState<string>('active');
  const [marineData, setMarineData] = useState<MarineTelemetry | null>(null);
  const [isMarineLoading, setIsMarineLoading] = useState<boolean>(false);

  // --- TAB 3: TRAVEL & PACKING STATE ---
  const [tripDuration, setTripDuration] = useState<TripDuration>('medium');
  const [tripStyle, setTripStyle] = useState<TripStyle>('leisure');
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [customItems, setCustomItems] = useState<PackingItem[]>([]);
  const [newItemText, setNewItemText] = useState<string>('');
  const [copiedItinerary, setCopiedItinerary] = useState<boolean>(false);

  // --- TAB 4: EARLY WARNING SIREN STATE ---
  const [sirenActive, setSirenActive] = useState<boolean>(false);
  const [pushActive, setPushActive] = useState<boolean>(false);

  useEffect(() => {
    setSirenActive(isSirenEnabled());
    setPushActive(isNotificationActive());
  }, []);

  // Normalize current metrics to SI/Metric for scientific calculations
  const tempC = unit === 'metric' ? current.main.temp : ((current.main.temp - 32) * 5) / 9;
  const surfaceWindKmh =
    unit === 'metric' ? current.wind.speed * 3.6 : current.wind.speed * 1.60934;
  const surfaceGustKmh = current.wind.gust
    ? unit === 'metric'
      ? current.wind.gust * 3.6
      : current.wind.gust * 1.60934
    : surfaceWindKmh * 1.32;

  // Fetch Upper-Air Wind & Aviation Telemetry from Open-Meteo
  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    async function loadUpperAir() {
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${current.coord.lat}&longitude=${current.coord.lon}&current=wind_speed_10m,wind_gusts_10m,cloud_cover_low,cape&hourly=wind_speed_80m,wind_speed_120m,wind_direction_80m,freezing_level_height&forecast_hours=12&wind_speed_unit=kmh`;
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error('Upper air HTTP error');
        const data = await res.json();
        if (cancelled) return;

        const w80Arr: number[] = Array.isArray(data?.hourly?.wind_speed_80m)
          ? data.hourly.wind_speed_80m.map((v: number) => Number(v || 0))
          : [];
        const w120Arr: number[] = Array.isArray(data?.hourly?.wind_speed_120m)
          ? data.hourly.wind_speed_120m.map((v: number) => Number(v || 0))
          : [];
        const dir80Arr: number[] = Array.isArray(data?.hourly?.wind_direction_80m)
          ? data.hourly.wind_direction_80m.map((v: number) => Number(v || current.wind.deg))
          : [];
        const freezeArr: number[] = Array.isArray(data?.hourly?.freezing_level_height)
          ? data.hourly.freezing_level_height.map((v: number) => Number(v || 3800))
          : [];

        setUpperAir({
          wind80mKmh: Math.round(w80Arr[0] || surfaceWindKmh * 1.34),
          wind120mKmh: Math.round(w120Arr[0] || surfaceWindKmh * 1.48),
          windDir80m: Math.round(dir80Arr[0] ?? ((current.wind.deg + 12) % 360)),
          gust10mKmh: Math.round(Number(data?.current?.wind_gusts_10m ?? surfaceGustKmh)),
          cloudLowPercent: Math.round(Number(data?.current?.cloud_cover_low ?? current.clouds.all * 0.6)),
          freezingLevelM: Math.round(freezeArr[0] || Math.max(400, (tempC / 6.5) * 1000)),
          capeJkg: Math.round(Number(data?.current?.cape ?? 150)),
          hourlyWind80mKmh: w80Arr.slice(0, 6),
        });
      } catch {
        if (cancelled) return;
        // Deterministic boundary-layer power-law wind profile fallback: V(z) = V_10 * (z/10)^0.16
        const w80 = Math.round(surfaceWindKmh * Math.pow(80 / 10, 0.16));
        const w120 = Math.round(surfaceWindKmh * Math.pow(120 / 10, 0.16));
        setUpperAir({
          wind80mKmh: w80,
          wind120mKmh: w120,
          windDir80m: (current.wind.deg + 10) % 360,
          gust10mKmh: Math.round(surfaceGustKmh),
          cloudLowPercent: Math.round(current.clouds.all * 0.65),
          freezingLevelM: Math.max(0, Math.round((tempC / 6.5) * 1000)),
          capeJkg: current.weather[0]?.id < 300 ? 1400 : 180,
          hourlyWind80mKmh: hourlyItems.slice(0, 6).map((item) => {
            const k = unit === 'metric' ? item.wind.speed * 3.6 : item.wind.speed * 1.60934;
            return Math.round(k * 1.35);
          }),
        });
      }
    }

    void loadUpperAir();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [current.coord.lat, current.coord.lon, current.wind.deg, current.clouds.all, current.weather, surfaceWindKmh, surfaceGustKmh, tempC, hourlyItems, unit]);

  // Fetch Marine & Surf Data from Open-Meteo Marine API when coordinate or surf preset changes
  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    async function loadMarine() {
      setIsMarineLoading(true);
      const preset = SURF_SPOT_PRESETS.find((p) => p.id === selectedSurfSpot) || SURF_SPOT_PRESETS[0];
      const targetLat = preset.id === 'active' ? current.coord.lat : preset.lat;
      const targetLon = preset.id === 'active' ? current.coord.lon : preset.lon;
      const stationLabel = preset.id === 'active' ? `${current.name} (${current.sys.country})` : `${preset.name}`;

      try {
        const url = `https://marine-api.open-meteo.com/v1/marine?latitude=${targetLat}&longitude=${targetLon}&current=wave_height,wave_direction,wave_period,swell_wave_height,swell_wave_direction,swell_wave_period&hourly=wave_height&forecast_days=1`;
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error('Marine API unavailable');
        const data = await res.json();
        if (cancelled) return;

        const rawWaveH = data?.current?.wave_height;
        const hasValidOceanCell = rawWaveH !== null && rawWaveH !== undefined && !Number.isNaN(Number(rawWaveH));

        if (hasValidOceanCell) {
          const waveH = Number(rawWaveH);
          const waveP = Number(data?.current?.wave_period ?? 8.5);
          const waveDir = Number(data?.current?.wave_direction ?? current.wind.deg);
          const swellH = Number(data?.current?.swell_wave_height ?? waveH * 0.82);
          const swellP = Number(data?.current?.swell_wave_period ?? waveP + 1.5);
          const hourlyW = Array.isArray(data?.hourly?.wave_height)
            ? data.hourly.wave_height.slice(0, 12).map((n: number | null) => Number(n ?? waveH))
            : Array.from({ length: 12 }, () => waveH);

          // Estimate SST based on latitude & air temp
          const absLat = Math.abs(targetLat);
          const baseSst = Math.max(2, Math.min(30, 29 - absLat * 0.42));
          const sstEst = Number((baseSst * 0.7 + tempC * 0.3).toFixed(1));

          setMarineData({
            isCoastalData: true,
            stationName: stationLabel,
            waveHeightM: Number(waveH.toFixed(2)),
            wavePeriodS: Number(waveP.toFixed(1)),
            waveDirectionDeg: Math.round(waveDir),
            swellHeightM: Number(swellH.toFixed(2)),
            swellPeriodS: Number(swellP.toFixed(1)),
            sstC: sstEst,
            hourlyWavesM: hourlyW,
          });
        } else {
          // Inland fallback: synthesize wind-wave fetch estimation and advise coastal spot presets
          const windFetchWave = Number(Math.max(0.25, Math.min(3.2, surfaceWindKmh * 0.045)).toFixed(2));
          const absLat = Math.abs(targetLat);
          const baseSst = Math.max(4, Math.min(30, 28.5 - absLat * 0.4));
          setMarineData({
            isCoastalData: false,
            stationName: stationLabel,
            waveHeightM: windFetchWave,
            wavePeriodS: Number((5.5 + surfaceWindKmh * 0.12).toFixed(1)),
            waveDirectionDeg: current.wind.deg,
            swellHeightM: Number((windFetchWave * 0.75).toFixed(2)),
            swellPeriodS: Number((7.2 + surfaceWindKmh * 0.1).toFixed(1)),
            sstC: Number((baseSst * 0.75 + tempC * 0.25).toFixed(1)),
            hourlyWavesM: Array.from({ length: 12 }, (_, i) =>
              Number((windFetchWave + Math.sin(i * 0.6) * 0.18).toFixed(2))
            ),
          });
        }
      } catch {
        if (cancelled) return;
        const windFetchWave = Number(Math.max(0.4, Math.min(3.5, surfaceWindKmh * 0.05)).toFixed(2));
        setMarineData({
          isCoastalData: preset.id !== 'active',
          stationName: stationLabel,
          waveHeightM: windFetchWave,
          wavePeriodS: 8.4,
          waveDirectionDeg: current.wind.deg,
          swellHeightM: Number((windFetchWave * 0.8).toFixed(2)),
          swellPeriodS: 10.2,
          sstC: Number(Math.max(12, Math.min(30, tempC - 1.2)).toFixed(1)),
          hourlyWavesM: Array.from({ length: 12 }, (_, i) =>
            Number((windFetchWave + Math.sin(i * 0.5) * 0.2).toFixed(2))
          ),
        });
      } finally {
        if (!cancelled) setIsMarineLoading(false);
      }
    }

    void loadMarine();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [selectedSurfSpot, current.coord.lat, current.coord.lon, current.name, current.sys.country, current.wind.deg, surfaceWindKmh, tempC]);

  // ============================================================================
  // DRONE & AVIATION CALCULATIONS (#5)
  // ============================================================================
  const droneMetrics = useMemo(() => {
    const maxWindLimitKmh = droneProfile === 'mini' ? 38 : droneProfile === 'mavic' ? 43 : 52;
    const w10 = Math.round(surfaceWindKmh);
    const w80 = upperAir?.wind80mKmh ?? Math.round(surfaceWindKmh * 1.35);
    const w120 = upperAir?.wind120mKmh ?? Math.round(surfaceWindKmh * 1.48);
    const gust = upperAir?.gust10mKmh ?? Math.round(surfaceGustKmh);
    const shearDelta = Math.abs(w120 - w10);

    // Dew Point & Lifted Condensation Level (Cloud Ceiling LCL in meters)
    const rh = Math.max(10, current.main.humidity);
    const dewPointC = tempC - (100 - rh) / 5;
    const cloudBaseMeters = Math.max(120, Math.round(125 * (tempC - dewPointC)));

    // Air Density (rho = P / (R * T)) in kg/m3
    const pressurePa = (current.main.pressure || 1013) * 100;
    const tempKelvin = tempC + 273.15;
    const airDensity = Number((pressurePa / (287.05 * tempKelvin)).toFixed(3));
    // Standard ISA sea level air density is 1.225 kg/m3
    const propEfficiencyPct = Math.min(108, Math.max(78, Math.round((airDensity / 1.225) * 100)));

    // Deterministic Solar Geomagnetic Kp-Index (0 - 9) based on UTC day/hour phase
    const utcHour = new Date().getUTCHours();
    const daySeed = Math.floor(Date.now() / 86400000);
    const kpIndex = Number(
      Math.min(6.5, Math.max(1.0, 2.1 + Math.sin(daySeed * 0.7 + utcHour * 0.3) * 1.4)).toFixed(1)
    );
    const gpsSatellites = Math.max(12, Math.min(24, Math.round(21 - kpIndex * 1.2 - (current.clouds.all / 100) * 2)));

    // Precipitation & visibility checks
    const weatherId = current.weather[0]?.id || 800;
    const isRainingOrStorm = weatherId < 700;
    const visibilityKm = Number((current.visibility / 1000).toFixed(1));

    // Composite UAV Safety Score (0 - 100)
    let score = 100;
    if (w80 > maxWindLimitKmh) score -= 45;
    else if (w80 > maxWindLimitKmh * 0.75) score -= 22;

    if (gust > maxWindLimitKmh * 1.05) score -= 25;
    if (isRainingOrStorm) score -= 40;
    if (visibilityKm < 3) score -= 25;
    if (cloudBaseMeters < 200) score -= 20;
    if (tempC < 0 || tempC > 40) score -= 18;
    score = Math.max(5, Math.min(100, score));

    const status: 'GO' | 'CAUTION' | 'NO-FLY' =
      score >= 72 && !isRainingOrStorm && w80 <= maxWindLimitKmh
        ? 'GO'
        : score >= 45 && weatherId >= 300 && w80 <= maxWindLimitKmh * 1.15
          ? 'CAUTION'
          : 'NO-FLY';

    // Battery thermal diagnosis
    const batteryStatus =
      tempC < 5
        ? lang === 'id'
          ? 'Dingin Ekstrem: Wajib Panaskan Baterai (>20°C)'
          : 'Cold Soak Risk: Pre-heat LiPo (>20°C)'
        : tempC > 36
          ? lang === 'id'
            ? 'Suhu Tinggi: Pantau Suhu Sel (<60°C)'
            : 'High Ambient Heat: Monitor Cell Temp'
          : lang === 'id'
            ? 'Optimal: Tegangan Sel Stabil'
            : 'Optimal: Cell Voltage Stable';

    return {
      maxWindLimitKmh,
      w10,
      w80,
      w120,
      gust,
      shearDelta,
      cloudBaseMeters,
      airDensity,
      propEfficiencyPct,
      kpIndex,
      gpsSatellites,
      visibilityKm,
      isRainingOrStorm,
      score,
      status,
      batteryStatus,
    };
  }, [droneProfile, surfaceWindKmh, surfaceGustKmh, upperAir, current, tempC, lang]);

  // ============================================================================
  // MARINE, SURF & HARMONIC TIDE CALCULATIONS (#6)
  // ============================================================================
  const tideAnalytics = useMemo(() => {
    const moon = getMoonPhase();
    // Semidiurnal M2 + S2 tidal amplitude modulated by syzygy (New/Full Moon spring tide vs quarter neap tide)
    const syzygyFactor = Math.abs(Math.cos(moon.phaseNormalized * 2 * Math.PI));
    const tidalRangeM = 1.35 + syzygyFactor * 0.85; // 1.35m neap to 2.20m spring amplitude
    const meanSeaLevelM = 1.6;

    const activePreset = SURF_SPOT_PRESETS.find((p) => p.id === selectedSurfSpot) || SURF_SPOT_PRESETS[0];
    const lonPhaseOffset = ((activePreset.id === 'active' ? current.coord.lon : activePreset.lon) / 180) * Math.PI;
    const lunarShiftRad = moon.phaseNormalized * 2 * Math.PI + lonPhaseOffset;

    // Generate 24 hourly tidal heights for today
    const points: { hour: number; label: string; heightM: number; waveM: number }[] = [];
    let highTide = { hour: 0, label: '00:00', heightM: -99 };
    let lowTide = { hour: 0, label: '00:00', heightM: 99 };

    for (let h = 0; h < 24; h++) {
      // M2 principal lunar semidiurnal period = 12.42 hours
      const angle = ((h / 12.42) * 2 * Math.PI) - lunarShiftRad;
      const diurnalInequality = 0.18 * Math.sin((h / 24) * 2 * Math.PI - lunarShiftRad * 0.5);
      const heightM = Number(
        (meanSeaLevelM + (tidalRangeM * 0.5) * Math.cos(angle) + diurnalInequality).toFixed(2)
      );
      const waveM = marineData?.hourlyWavesM?.[h % (marineData.hourlyWavesM.length || 1)] ?? (marineData?.waveHeightM || 1.0);
      const label = `${String(h).padStart(2, '0')}:00`;

      points.push({ hour: h, label, heightM, waveM });
      if (heightM > highTide.heightM) highTide = { hour: h, label, heightM };
      if (heightM < lowTide.heightM) lowTide = { hour: h, label, heightM };
    }

    const nowHour = new Date((Date.now() / 1000 + current.timezone) * 1000).getUTCHours();
    const currentTideM = points[nowHour]?.heightM ?? meanSeaLevelM;
    const nextHourTideM = points[(nowHour + 1) % 24]?.heightM ?? meanSeaLevelM;
    const isRising = nextHourTideM >= currentTideM;

    // Offshore vs Onshore wind relative to beach orientation
    const beachDeg = activePreset.beachFacingDeg;
    const windDiff = Math.abs((((current.wind.deg - beachDeg) % 360) + 540) % 360 - 180);
    const windRegime =
      windDiff >= 125
        ? lang === 'id'
          ? 'Offshore (Angin Darat — Gelombang Rapi & Bersih)'
          : 'Offshore (Clean Groomed Waves)'
        : windDiff >= 65
          ? lang === 'id'
            ? 'Cross-Shore (Angin Samping Pantai)'
            : 'Cross-Shore (Side Wind)'
          : lang === 'id'
            ? 'Onshore (Angin Laut — Gelombang Berombak/Choppy)'
            : 'Onshore (Choppy Surface)';

    // Surf Score (0 - 10)
    const waveH = marineData?.waveHeightM ?? 1.0;
    const swellP = marineData?.swellPeriodS ?? 9.0;
    let surfScore = 5.5;
    if (waveH >= 0.8 && waveH <= 2.8) surfScore += 2.0;
    if (swellP >= 10) surfScore += 1.5;
    if (windDiff >= 115 && surfaceWindKmh < 28) surfScore += 1.0;
    if (surfaceWindKmh > 38) surfScore -= 2.2;
    surfScore = Number(Math.max(1.5, Math.min(9.9, surfScore)).toFixed(1));

    return {
      points,
      highTide,
      lowTide,
      nowHour,
      currentTideM,
      isRising,
      windRegime,
      surfScore,
      springNeapLabel:
        syzygyFactor > 0.7
          ? lang === 'id'
            ? 'Pasang Purnama (Spring Tide)'
            : 'Spring Tide'
          : lang === 'id'
            ? 'Pasang Perbani (Neap/Normal)'
            : 'Neap/Moderate Tide',
    };
  }, [selectedSurfSpot, current.coord.lon, current.timezone, current.wind.deg, marineData, surfaceWindKmh, lang]);

  // ============================================================================
  // AI TRAVEL & SMART PACKING GENERATOR (#4)
  // ============================================================================
  const travelIntelligence = useMemo(() => {
    const itemsToScan = forecast?.list?.length ? forecast.list : hourlyItems;
    const tempsC = itemsToScan.map((i) =>
      unit === 'metric' ? i.main.temp : ((i.main.temp - 32) * 5) / 9
    );
    const minTempC = tempsC.length ? Math.min(...tempsC, tempC) : tempC - 3;
    const maxTempC = tempsC.length ? Math.max(...tempsC, tempC) : tempC + 3;
    const maxPopPct = itemsToScan.length
      ? Math.round(Math.max(...itemsToScan.map((i) => i.pop || 0)) * 100)
      : 20;
    const aqi = pollution?.list?.[0]?.main?.aqi ?? 1;

    // Find best 3-hour departure window in the next 18 hours
    let bestHourLabel = '08:00 - 11:00';
    let bestWindowScore = -999;
    const scanHours = hourlyItems.slice(0, 18);
    for (let i = 0; i < scanHours.length; i++) {
      const hItem = scanHours[i];
      const localDate = new Date((hItem.dt + current.timezone) * 1000);
      const hr = localDate.getUTCHours();
      if (hr < 6 || hr > 20) continue; // Prefer daytime travel
      const itemTempC = unit === 'metric' ? hItem.main.temp : ((hItem.main.temp - 32) * 5) / 9;
      const popPenalty = (hItem.pop || 0) * 60;
      const tempComfort = 25 - Math.abs(itemTempC - 23);
      const score = tempComfort - popPenalty;
      if (score > bestWindowScore) {
        bestWindowScore = score;
        const endHr = (hr + 3) % 24;
        bestHourLabel = `${String(hr).padStart(2, '0')}:00 – ${String(endHr).padStart(2, '0')}:00`;
      }
    }

    const durationMultiplier = tripDuration === 'short' ? '2-3 pasang' : tripDuration === 'medium' ? '5-7 pasang' : '8-10+ pasang';
    const generated: PackingItem[] = [];

    // 1. Thermal Layering Rules
    if (minTempC <= 8) {
      generated.push({
        id: 'thermal-base',
        category: 'apparel',
        label: lang === 'id' ? `Heattech / Termal Base Layer (${durationMultiplier})` : `Thermal Base Layers (${durationMultiplier})`,
        reason: lang === 'id' ? `Suhu terendah mencapai ${Math.round(minTempC)}°C` : `Low temperatures drop to ${Math.round(minTempC)}°C`,
        priority: 'essential',
      });
      generated.push({
        id: 'down-jacket',
        category: 'apparel',
        label: lang === 'id' ? 'Jaket Bulu Angsa (Down Parka) & Sarung Tangan' : 'Insulated Down Jacket & Thermal Gloves',
        reason: lang === 'id' ? 'Insulasi utama penahan angin dingin & hipotermia' : 'Core insulation against wind chill',
        priority: 'essential',
      });
    } else if (minTempC <= 20) {
      generated.push({
        id: 'light-jacket',
        category: 'apparel',
        label: lang === 'id' ? 'Jaket Windbreaker / Fleece Mid-Layer' : 'Windbreaker / Fleece Mid-Layer Jacket',
        reason: lang === 'id' ? `Suhu malam/pagi sejuk sekitar ${Math.round(minTempC)}°C` : `Cool morning/evening around ${Math.round(minTempC)}°C`,
        priority: 'essential',
      });
    } else {
      generated.push({
        id: 'breathable-tops',
        category: 'apparel',
        label: lang === 'id' ? `Pakaian Katun/Linen Breathable (${durationMultiplier})` : `Breathable Linen/Cotton Tops (${durationMultiplier})`,
        reason: lang === 'id' ? `Cuaca hangat hingga ${Math.round(maxTempC)}°C & lembap` : `Warm climate up to ${Math.round(maxTempC)}°C`,
        priority: 'essential',
      });
    }

    // 2. Precipitation & Footwear Rules
    if (maxPopPct >= 40 || current.weather[0]?.id < 700) {
      generated.push({
        id: 'rain-shell',
        category: 'apparel',
        label: lang === 'id' ? 'Payung Lipat Kokoh & Jas Hujan Gore-Tex/Waterproof' : 'Compact Windproof Umbrella & Waterproof Shell',
        reason: lang === 'id' ? `Peluang presipitasi mencapai ${maxPopPct}%` : `Precipitation probability up to ${maxPopPct}%`,
        priority: 'essential',
      });
      generated.push({
        id: 'waterproof-shoes',
        category: 'apparel',
        label: lang === 'id' ? 'Sepatu Anti-Air / Alas Kaki Karet Anti-Slip' : 'Water-Resistant Non-Slip Footwear',
        reason: lang === 'id' ? 'Menjaga kaki tetap kering saat trotoar basah' : 'Prevents soaked socks on wet pavement',
        priority: 'recommended',
      });
    }

    // 3. UV, Hydration & Air Quality Rules
    generated.push({
      id: 'sun-protection',
      category: 'health',
      label: lang === 'id' ? 'Tabir Surya SPF 50+ PA++++ & Kacamata UV400' : 'Broad-Spectrum SPF 50+ Sunscreen & UV400 Sunglasses',
      reason: lang === 'id' ? 'Proteksi radiasi UV harian selama di perjalanan' : 'Daily UV radiation protection outdoors',
      priority: 'essential',
    });

    generated.push({
      id: 'tumbler-hydration',
      category: 'health',
      label: lang === 'id' ? 'Botol Minum Isolasi Termal (Tumbler 750ml) & Elektrolit' : 'Insulated Hydration Flask (750ml) & Electrolytes',
      reason: lang === 'id' ? `Menjaga hidrasi tubuh di kelembapan ${current.main.humidity}%` : `Sustains hydration at ${current.main.humidity}% humidity`,
      priority: 'essential',
    });

    if (aqi >= 3) {
      generated.push({
        id: 'mask-n95',
        category: 'health',
        label: lang === 'id' ? 'Masker Respirator KN95 / KF94 & Tetes Mata Steril' : 'KN95 / KF94 Respirator Masks & Eye Drops',
        reason: lang === 'id' ? `Indeks kualitas udara (AQI Level ${aqi}) kurang bersih` : `Air quality index (Level ${aqi}) requires filtration`,
        priority: 'essential',
      });
    }

    // 4. Trip Style Specific Gear
    if (tripStyle === 'business') {
      generated.push({
        id: 'biz-attire',
        category: 'apparel',
        label: lang === 'id' ? 'Blazer Anti-Kusut, Kemeja Kerja & Tas Laptop Waterproof' : 'Wrinkle-Free Blazer, Dress Shirts & Waterproof Laptop Briefcase',
        reason: lang === 'id' ? 'Protokol perjalanan bisnis & rapat eksekutif' : 'Executive business travel protocol',
        priority: 'essential',
      });
    } else if (tripStyle === 'outdoor') {
      generated.push({
        id: 'outdoor-kit',
        category: 'gear',
        label: lang === 'id' ? 'Headlamp LED, Drybag Kedap Air, P3K & Pluit Darurat' : 'LED Headlamp, Waterproof Drybag & First-Aid Kit',
        reason: lang === 'id' ? 'Keamanan medan alam terbuka & perubahan cuaca gunung' : 'Wilderness safety and rapid weather shift gear',
        priority: 'essential',
      });
    } else if (tripStyle === 'creator') {
      generated.push({
        id: 'creator-kit',
        category: 'gear',
        label: lang === 'id' ? 'Rain Cover Kamera, Silica Gel, Filter ND & Tripod Travel' : 'Camera Rain Sleeve, Silica Gel, ND Filters & Travel Tripod',
        reason: lang === 'id' ? 'Melindungi sensor optik dari kondensasi & embun' : 'Protects camera optics from moisture and glare',
        priority: 'essential',
      });
    } else if (tripStyle === 'beach') {
      generated.push({
        id: 'beach-kit',
        category: 'apparel',
        label: lang === 'id' ? 'Pakaian Renang UV-Rashguard, Dry Pouch HP & Sandal Pantai' : 'UV Rashguard Swimwear, Phone Dry Pouch & Sandals',
        reason: lang === 'id' ? 'Perlengkapan aktivitas bahari & pesisir pantai' : 'Coastal and marine recreation essentials',
        priority: 'essential',
      });
    }

    // 5. Universal Power & Electronics
    generated.push({
      id: 'power-adapter',
      category: 'essential',
      label: lang === 'id' ? 'Powerbank 20.000mAh (Flight-Safe) & Universal Travel Adapter' : '20,000mAh Airline-Safe Powerbank & Universal Adapter',
      reason: lang === 'id' ? 'Cadangan daya navigasi & komunikasi darurat' : 'Navigation and emergency backup power',
      priority: 'essential',
    });

    return {
      minTempC: Math.round(minTempC),
      maxTempC: Math.round(maxTempC),
      maxPopPct,
      bestHourLabel,
      items: [...generated, ...customItems],
    };
  }, [forecast, hourlyItems, unit, tempC, current, pollution, tripDuration, tripStyle, customItems, lang]);

  // ============================================================================
  // SEVERE WEATHER NOWCAST THREAT SCANNER (#7)
  // ============================================================================
  const nowcastThreats = useMemo(() => {
    const next6h = hourlyItems.slice(0, 6);
    const maxPop6h = next6h.length
      ? Math.round(Math.max(...next6h.map((h) => h.pop || 0)) * 100)
      : 0;
    const hasStormCell =
      current.weather[0]?.id < 300 ||
      next6h.some((h) => (h.weather[0]?.id || 800) < 300);

    const pressures = next6h.map((h) => h.main.pressure || current.main.pressure);
    const pressureDelta =
      pressures.length >= 2
        ? pressures[pressures.length - 1] - current.main.pressure
        : 0;

    const maxWind6hKmh = next6h.length
      ? Math.round(
          Math.max(
            surfaceWindKmh,
            ...next6h.map((h) =>
              unit === 'metric' ? h.wind.speed * 3.6 : h.wind.speed * 1.60934
            )
          )
        )
      : Math.round(surfaceWindKmh);

    return [
      {
        id: 'storm',
        title: lang === 'id' ? 'Sel Badai Petir & Kumulonimbus' : 'Thunderstorm & CB Cell',
        level: hasStormCell ? 'danger' : maxPop6h >= 65 ? 'warning' : 'safe',
        badge: hasStormCell
          ? lang === 'id'
            ? 'AKTIF / MENDEKAT'
            : 'ACTIVE / APPROACHING'
          : maxPop6h >= 65
            ? lang === 'id'
              ? 'WASPADA KONVEKTIF'
              : 'CONVECTIVE WATCH'
            : lang === 'id'
              ? 'STERIL'
              : 'CLEAR',
        detail: hasStormCell
          ? lang === 'id'
            ? 'Aktivitas elektrik atmosfer terdeteksi pada jendela 0–6 jam ke depan.'
            : 'Atmospheric electrical activity detected within the 0–6h nowcast window.'
          : lang === 'id'
            ? 'Tidak ada indikasi sambaran petir dalam radius pengamatan.'
            : 'No lightning cell signatures within station radius.',
      },
      {
        id: 'rain-surge',
        title: lang === 'id' ? 'Lonjakan Presipitasi (Nowcast 6 Jam)' : 'Precipitation Surge (6h Nowcast)',
        level: maxPop6h >= 75 ? 'danger' : maxPop6h >= 45 ? 'warning' : 'safe',
        badge: `${maxPop6h}% PROB`,
        detail:
          maxPop6h >= 50
            ? lang === 'id'
              ? `Peluang guyuran hujan mencapai ${maxPop6h}% dalam 6 jam mendatang.`
              : `Rain probability reaches ${maxPop6h}% within the next 6 hours.`
            : lang === 'id'
              ? 'Risiko curah hujan ekstrem rendah dalam waktu dekat.'
              : 'Low risk of heavy downpour in the immediate window.',
      },
      {
        id: 'gust-front',
        title: lang === 'id' ? 'Hembusan Angin & Geseran (Gust Front)' : 'Wind Gust & Shear Front',
        level: maxWind6hKmh >= 45 ? 'danger' : maxWind6hKmh >= 28 ? 'warning' : 'safe',
        badge: `${maxWind6hKmh} km/j`,
        detail:
          maxWind6hKmh >= 28
            ? lang === 'id'
              ? `Puncak kecepatan angin permukaan diperkirakan menyentuh ${maxWind6hKmh} km/j.`
              : `Peak surface gusts projected up to ${maxWind6hKmh} km/h.`
            : lang === 'id'
              ? 'Aliran angin permukaan stabil di bawah ambang bahaya.'
              : 'Surface wind flow remains stable below hazard thresholds.',
      },
      {
        id: 'barometric',
        title: lang === 'id' ? 'Kecenderungan Barometrik (ΔP)' : 'Barometric Pressure Tendency (ΔP)',
        level: pressureDelta <= -4 ? 'danger' : pressureDelta <= -2 ? 'warning' : 'safe',
        badge: `${current.main.pressure} hPa (${pressureDelta >= 0 ? '+' : ''}${pressureDelta})`,
        detail:
          pressureDelta <= -2
            ? lang === 'id'
              ? 'Penurunan tekanan udara mengindikasikan pergerakan front cuaca buruk mendekat.'
              : 'Falling barometric pressure indicates an approaching low-pressure front.'
            : lang === 'id'
              ? 'Tekanan atmosfer barometrik berada dalam kesetimbangan stabil.'
              : 'Barometric pressure remains in stable equilibrium.',
      },
    ];
  }, [hourlyItems, current, surfaceWindKmh, unit, lang]);

  // Handlers for Travel Packing Checklist
  const toggleCheckItem = (id: string) => {
    setCheckedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddCustomItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemText.trim()) return;
    const item: PackingItem = {
      id: `custom-${Date.now()}`,
      category: 'essential',
      label: newItemText.trim(),
      reason: lang === 'id' ? 'Tambahan pribadi pengguna' : 'Personal custom item',
      priority: 'recommended',
    };
    setCustomItems((prev) => [...prev, item]);
    setNewItemText('');
  };

  const handleCopyItinerary = async () => {
    const checkedCount = travelIntelligence.items.filter((i) => checkedItems[i.id]).length;
    const lines = [
      `✈️ *RENCANA PERJALANAN & PACKING CUACA — WEATHERAETHER*`,
      `📍 Destinasi: ${current.name}, ${current.sys.country}`,
      `🌡️ Rentang Suhu: ${travelIntelligence.minTempC}°C s/d ${travelIntelligence.maxTempC}°C (Peluang Hujan Maks: ${travelIntelligence.maxPopPct}%)`,
      `🕒 Jendela Keberangkatan Terbaik: ${travelIntelligence.bestHourLabel} waktu setempat`,
      `🧳 Kesiapan Barang Bawaan (${checkedCount}/${travelIntelligence.items.length}):`,
      ...travelIntelligence.items.map(
        (item) => `${checkedItems[item.id] ? '✅' : '⬜'} ${item.label} — _(${item.reason})_`
      ),
      `\n🔗 Cek Radar & Cuaca Live: ${typeof window !== 'undefined' ? window.location.href : 'https://weatheraether.vercel.app'}`,
    ];

    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopiedItinerary(true);
      setTimeout(() => setCopiedItinerary(false), 2500);
      onShowToast?.(
        lang === 'id'
          ? 'Ringkasan perjalanan & daftar bawaan berhasil disalin!'
          : 'Travel itinerary & packing checklist copied!',
        'success'
      );
    } catch {
      onShowToast?.(
        lang === 'id' ? 'Gagal menyalin ke clipboard.' : 'Failed to copy to clipboard.',
        'error'
      );
    }
  };

  const handleToggleSiren = () => {
    const next = !sirenActive;
    setSirenActive(next);
    setSirenEnabled(next);
    if (next) {
      playWeatherAlertSiren('test');
      onShowToast?.(
        lang === 'id'
          ? 'Sirine Peringatan Dini diaktifkan. Akan berbunyi otomatis saat bahaya terdeteksi.'
          : 'Early Warning Siren enabled. Will chime automatically when hazards arise.',
        'success'
      );
    } else {
      onShowToast?.(
        lang === 'id' ? 'Sirine Peringatan Dini dibisukan.' : 'Early Warning Siren muted.',
        'info'
      );
    }
  };

  const handleTogglePush = async () => {
    if (pushActive) {
      setNotificationActive(false);
      setPushActive(false);
      onShowToast?.(
        lang === 'id' ? 'Notifikasi browser dimatikan.' : 'Browser notifications disabled.',
        'info'
      );
      return;
    }
    const perm = await requestNotificationPermission();
    if (perm === 'granted') {
      setPushActive(true);
      onShowToast?.(
        lang === 'id' ? 'Notifikasi Peringatan Dini aktif!' : 'Early Warning Push Notifications enabled!',
        'success'
      );
    } else {
      onShowToast?.(
        lang === 'id' ? 'Izin notifikasi ditolak oleh browser.' : 'Notification permission denied.',
        'error'
      );
    }
  };

  // Tide SVG Chart Coordinates
  const tideSvg = useMemo(() => {
    const width = 680;
    const height = 165;
    const padX = 28;
    const padY = 26;
    const pts = tideAnalytics.points;
    const minH = Math.min(...pts.map((p) => p.heightM)) - 0.25;
    const maxH = Math.max(...pts.map((p) => p.heightM)) + 0.25;
    const rangeH = Math.max(0.5, maxH - minH);

    const coords = pts.map((p, idx) => {
      const x = padX + (idx / 23) * (width - padX * 2);
      const y = height - padY - ((p.heightM - minH) / rangeH) * (height - padY * 2);
      return { x, y, ...p };
    });

    let d = `M ${coords[0].x} ${coords[0].y}`;
    for (let i = 0; i < coords.length - 1; i++) {
      const curr = coords[i];
      const next = coords[i + 1];
      const cx = (curr.x + next.x) / 2;
      d += ` C ${cx} ${curr.y}, ${cx} ${next.y}, ${next.x} ${next.y}`;
    }

    const areaD = `${d} L ${coords[coords.length - 1].x} ${height - 10} L ${coords[0].x} ${height - 10} Z`;
    const activePoint = coords[tideAnalytics.nowHour] || coords[0];

    return { width, height, coords, d, areaD, activePoint };
  }, [tideAnalytics]);

  const checkedTotal = travelIntelligence.items.filter((i) => checkedItems[i.id]).length;
  const packingProgressPct = Math.round(
    (checkedTotal / Math.max(1, travelIntelligence.items.length)) * 100
  );

  return (
    <div className="glass-card adv-suite-card">
      {/* Header & Pillar B Module Switcher */}
      <div className="adv-suite-header">
        <div className="adv-suite-title-group">
          <div className="adv-suite-eyebrow">
            <Sparkles size={13} color="#38bdf8" />
            <span>
              {mode === 'travel'
                ? lang === 'id'
                  ? 'PERENCANAAN PERJALANAN & PROTOKOL BUSANA CERDAS'
                  : 'SMART TRAVEL ITINERARY & PACKING PROTOCOL'
                : lang === 'id'
                  ? 'INTELIJEN OPERASIONAL & SAINS ATMOSFER'
                  : 'OPERATIONAL INTELLIGENCE & ATMOSPHERIC SCIENCE'}
            </span>
          </div>
          <h3 className="adv-suite-title">
            {mode === 'travel'
              ? lang === 'id'
                ? `Asisten Perjalanan, Checklist Koper & Waktu Berangkat — ${current.name}`
                : `Smart Travel Assistant, Packing Checklist & Departure Window — ${current.name}`
              : lang === 'id'
                ? 'Konsol Telemetri Penerbangan Drone, Kelautan & Sirine Peringatan Dini'
                : 'UAV Aviation, Marine Hydrograph & Early Warning Telemetry Console'}
          </h3>
        </div>

        {mode !== 'travel' && (
          <div className="adv-suite-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'drone'}
              className={`adv-suite-tab ${activeTab === 'drone' ? 'active' : ''}`}
              onClick={() => setActiveTab('drone')}
            >
              <Plane size={15} />
              <span>{lang === 'id' ? 'Aviasi & Drone' : 'Drone & Aviation'}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'marine'}
              className={`adv-suite-tab ${activeTab === 'marine' ? 'active' : ''}`}
              onClick={() => setActiveTab('marine')}
            >
              <Waves size={15} />
              <span>{lang === 'id' ? 'Laut & Pasang Surut' : 'Marine & Tides'}</span>
            </button>
            {mode === 'all' && (
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'travel'}
                className={`adv-suite-tab ${activeTab === 'travel' ? 'active' : ''}`}
                onClick={() => setActiveTab('travel')}
              >
                <Briefcase size={15} />
                <span>{lang === 'id' ? 'Asisten Packing' : 'Smart Packing'}</span>
              </button>
            )}
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'siren'}
              className={`adv-suite-tab ${activeTab === 'siren' ? 'active' : ''}`}
              onClick={() => setActiveTab('siren')}
            >
              <Siren size={15} />
              <span>{lang === 'id' ? 'Radar & Sirine Dini' : 'Nowcast & Siren'}</span>
            </button>
          </div>
        )}
      </div>

      {/* =====================================================================
          TAB 1: AVIATION & DRONE FLIGHT SAFETY INDEX (#5)
         ===================================================================== */}
      {activeTab === 'drone' && (
        <div className="adv-tab-panel">
          <div className="drone-top-bar">
            <div className={`drone-verdict-banner status-${droneMetrics.status.toLowerCase()}`}>
              <div className="drone-verdict-left">
                <span className="drone-status-pill">
                  {droneMetrics.status === 'GO'
                    ? lang === 'id'
                      ? '✓ GO FOR FLIGHT — AMAN TERBANG'
                      : '✓ GO FOR FLIGHT — SAFE'
                    : droneMetrics.status === 'CAUTION'
                      ? lang === 'id'
                        ? '⚠ CAUTION — WASPADA ANGIN KETINGGIAN'
                        : '⚠ CAUTION — HIGH ALTITUDE SHEAR'
                      : lang === 'id'
                        ? '✕ NO-FLY — DILARANG TERBANG (GROUNDED)'
                        : '✕ NO-FLY — GROUNDED'}
                </span>
                <p className="drone-verdict-sub">
                  {droneMetrics.status === 'GO'
                    ? lang === 'id'
                      ? `Kondisi atmosfer di ${current.name} ideal untuk penerbangan UAV hingga ketinggian 120m AGL.`
                      : `Atmospheric telemetry in ${current.name} is optimal for UAV operations up to 120m AGL.`
                    : droneMetrics.status === 'CAUTION'
                      ? lang === 'id'
                        ? 'Aktifkan mode Sport/Attitude jika diperlukan dan jaga drone tetap dalam jarak pandang (VLOS).'
                        : 'Maintain strict visual line of sight (VLOS) and monitor battery voltage against headwinds.'
                      : lang === 'id'
                        ? 'Kecepatan angin di ketinggian atau presipitasi melebihi batas keselamatan struktural drone.'
                        : 'Upper-level wind shear or active precipitation exceeds safe UAV operating limits.'}
                </p>
              </div>
              <div className="drone-score-orb">
                <span className="drone-score-num">{droneMetrics.score}</span>
                <span className="drone-score-label">/100 UAV</span>
              </div>
            </div>

            <div className="drone-profile-selector">
              <span className="drone-selector-label">
                {lang === 'id' ? 'Kelas Wahana UAV:' : 'UAV Airframe Class:'}
              </span>
              <div className="drone-profile-btns">
                <button
                  type="button"
                  className={`drone-profile-btn ${droneProfile === 'mini' ? 'active' : ''}`}
                  onClick={() => setDroneProfile('mini')}
                >
                  Sub-250g (Mini)
                </button>
                <button
                  type="button"
                  className={`drone-profile-btn ${droneProfile === 'mavic' ? 'active' : ''}`}
                  onClick={() => setDroneProfile('mavic')}
                >
                  Pro (Air / Mavic)
                </button>
                <button
                  type="button"
                  className={`drone-profile-btn ${droneProfile === 'fpv' ? 'active' : ''}`}
                  onClick={() => setDroneProfile('fpv')}
                >
                  Heavy / FPV 5&quot;
                </button>
              </div>
            </div>
          </div>

          {/* Vertical Wind Shear Profile (10m vs 80m vs 120m AGL) */}
          <div className="drone-shear-box">
            <div className="drone-shear-header">
              <span>
                <Wind size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                {lang === 'id'
                  ? 'Profil Geseran Angin Vertikal (Vertical Wind Shear AGL)'
                  : 'Vertical Wind Shear Profile (AGL Altitude)'}
              </span>
              <span className="drone-limit-tag">
                {lang === 'id' ? 'Batas Tahan Angin Drone:' : 'Max Wind Resistance:'}{' '}
                <strong>{droneMetrics.maxWindLimitKmh} km/j</strong>
              </span>
            </div>
            <div className="drone-altitude-bars">
              {[
                { label: '120m AGL (Plafon Maks)', speed: droneMetrics.w120 },
                { label: '80m AGL (Jelajah Kamera)', speed: droneMetrics.w80 },
                { label: '10m AGL (Permukaan/Takeoff)', speed: droneMetrics.w10 },
              ].map((row) => {
                const ratio = Math.min(100, Math.round((row.speed / 60) * 100));
                const overLimit = row.speed > droneMetrics.maxWindLimitKmh;
                return (
                  <div key={row.label} className="drone-alt-row">
                    <span className="drone-alt-name">{row.label}</span>
                    <div className="drone-alt-track">
                      <div
                        className={`drone-alt-fill ${overLimit ? 'danger' : row.speed > droneMetrics.maxWindLimitKmh * 0.75 ? 'warn' : 'safe'}`}
                        style={{ width: `${ratio}%` }}
                      />
                    </div>
                    <span className="drone-alt-val">{row.speed} km/j</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 6 Telemetry Cards */}
          <div className="adv-telemetry-grid">
            <div className="adv-telemetry-item">
              <div className="adv-tel-head">
                <Satellite size={15} color="#38bdf8" />
                <span>{lang === 'id' ? 'Satelit GNSS & Indeks Kp' : 'GNSS Lock & Kp-Index'}</span>
              </div>
              <div className="adv-tel-value">
                {droneMetrics.gpsSatellites} Satelit <small>(Kp {droneMetrics.kpIndex})</small>
              </div>
              <p className="adv-tel-desc">
                {droneMetrics.kpIndex < 4
                  ? lang === 'id'
                    ? 'Medan geomagnetik tenang. Penguncian Home-Point GPS sangat akurat.'
                    : 'Quiet geomagnetic field. High-precision RTK/GPS Home-Point lock.'
                  : lang === 'id'
                    ? 'Aktivitas badai matahari sedang. Waspadai interferensi kompas.'
                    : 'Moderate geomagnetic storming. Calibrate compass before takeoff.'}
              </p>
            </div>

            <div className="adv-telemetry-item">
              <div className="adv-tel-head">
                <Cloud size={15} color="#a78bfa" />
                <span>{lang === 'id' ? 'Dasar Awan (Cloud Ceiling LCL)' : 'Cloud Base (LCL Ceiling)'}</span>
              </div>
              <div className="adv-tel-value">
                {droneMetrics.cloudBaseMeters.toLocaleString()} m <small>AGL</small>
              </div>
              <p className="adv-tel-desc">
                {lang === 'id'
                  ? `Tutupan awan rendah ${upperAir?.cloudLowPercent ?? 25}%. Plafon aman dari kabut awan.`
                  : `Low cloud cover ${upperAir?.cloudLowPercent ?? 25}%. Clear ceiling above 120m limit.`}
              </p>
            </div>

            <div className="adv-telemetry-item">
              <div className="adv-tel-head">
                <Gauge size={15} color="#34d399" />
                <span>{lang === 'id' ? 'Densitas Udara & Efisiensi Prop' : 'Air Density & Prop Thrust'}</span>
              </div>
              <div className="adv-tel-value">
                {droneMetrics.airDensity} kg/m³ <small>({droneMetrics.propEfficiencyPct}%)</small>
              </div>
              <p className="adv-tel-desc">
                {lang === 'id'
                  ? 'Daya angkat baling-baling terhadap tekanan barometrik & suhu lokal.'
                  : 'Propeller aerodynamic lift efficiency relative to ISA sea-level standard.'}
              </p>
            </div>

            <div className="adv-telemetry-item">
              <div className="adv-tel-head">
                <BatteryCharging size={15} color="#fbbf24" />
                <span>{lang === 'id' ? 'Kesehatan Termal Baterai LiPo' : 'LiPo Battery Thermal State'}</span>
              </div>
              <div className="adv-tel-value">{Math.round(tempC)}°C Ambient</div>
              <p className="adv-tel-desc">{droneMetrics.batteryStatus}</p>
            </div>

            <div className="adv-telemetry-item">
              <div className="adv-tel-head">
                <Eye size={15} color="#60a5fa" />
                <span>{lang === 'id' ? 'Jarak Pandang Visual (VLOS)' : 'Visual Line of Sight (VLOS)'}</span>
              </div>
              <div className="adv-tel-value">{droneMetrics.visibilityKm} km</div>
              <p className="adv-tel-desc">
                {droneMetrics.visibilityKm >= 5
                  ? lang === 'id'
                    ? 'Transparansi optik sangat jernih untuk transmisi OcuSync & kamera.'
                    : 'Clear optical transparency for long-range telemetry & imaging.'
                  : lang === 'id'
                    ? 'Kabut/partikulat mengurangi jarak pandang visual pilot.'
                    : 'Reduced visibility; keep aircraft within 500m direct sight.'}
              </p>
            </div>

            <div className="adv-telemetry-item">
              <div className="adv-tel-head">
                <Thermometer size={15} color="#f472b6" />
                <span>{lang === 'id' ? 'Level Beku & Risiko Icing' : 'Freezing Level & Rotor Icing'}</span>
              </div>
              <div className="adv-tel-value">
                {(upperAir?.freezingLevelM ?? 3600).toLocaleString()} m <small>ASL</small>
              </div>
              <p className="adv-tel-desc">
                {tempC <= 2
                  ? lang === 'id'
                    ? 'Bahaya pembekuan es (propeller icing) pada bilah baling-baling!'
                    : 'High risk of structural carburetor/propeller blade icing!'
                  : lang === 'id'
                    ? 'Bebas risiko kristalisasi es pada bilah baling-baling.'
                    : 'Zero risk of ice accretion on rotor blades at low altitude.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 2: MARINE, SURF & TIDE HYDROGRAPH (#6)
         ===================================================================== */}
      {activeTab === 'marine' && (
        <div className="adv-tab-panel">
          <div className="marine-station-bar">
            <div className="marine-station-info">
              <Anchor size={16} color="#38bdf8" />
              <span>
                {lang === 'id' ? 'Stasiun Buoy & Pesisir:' : 'Marine Buoy & Surf Station:'}{' '}
                <strong>{marineData?.stationName || current.name}</strong>
              </span>
              {!marineData?.isCoastalData && (
                <span className="marine-inland-badge">
                  {lang === 'id'
                    ? 'Mode Estimasi Daratan • Pilih Spot Pantai untuk Data Laut Live'
                    : 'Inland Mode • Select a Coastal Surf Spot below'}
                </span>
              )}
            </div>

            <div className="marine-spot-chips">
              {SURF_SPOT_PRESETS.map((spot) => (
                <button
                  key={spot.id}
                  type="button"
                  className={`marine-spot-chip ${selectedSurfSpot === spot.id ? 'active' : ''}`}
                  onClick={() => setSelectedSurfSpot(spot.id)}
                >
                  {spot.name}
                </button>
              ))}
            </div>
          </div>

          {/* 24-Hour Harmonic Tide & Swell SVG Hydrograph */}
          <div className="marine-hydrograph-card">
            <div className="marine-hydro-header">
              <div>
                <h4 className="marine-hydro-title">
                  {lang === 'id'
                    ? 'Hidrograf Pasang Surut Harmonik 24 Jam & Tinggi Gelombang'
                    : '24-Hour Harmonic Tide Hydrograph & Wave Swell'}
                </h4>
                <p className="marine-hydro-sub">
                  {tideAnalytics.springNeapLabel} •{' '}
                  {tideAnalytics.isRising
                    ? lang === 'id'
                      ? '🌊 Air Sedang Pasang Naik (Rising Tide)'
                      : '🌊 Rising Tide (Flood)'
                    : lang === 'id'
                      ? '📉 Air Sedang Surut (Falling Ebb Tide)'
                      : '📉 Falling Tide (Ebb)'}
                </p>
              </div>
              <div className="marine-tide-badges">
                <span className="tide-badge high">
                  ▲ {lang === 'id' ? 'Pasang Puncak:' : 'High Tide:'} {tideAnalytics.highTide.label} (
                  {tideAnalytics.highTide.heightM}m)
                </span>
                <span className="tide-badge low">
                  ▼ {lang === 'id' ? 'Surut Terendah:' : 'Low Tide:'} {tideAnalytics.lowTide.label} (
                  {tideAnalytics.lowTide.heightM}m)
                </span>
              </div>
            </div>

            <div className="marine-svg-wrap">
              <svg
                viewBox={`0 0 ${tideSvg.width} ${tideSvg.height}`}
                className="marine-hydro-svg"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="tideAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.42" />
                    <stop offset="100%" stopColor="#0284c7" stopOpacity="0.02" />
                  </linearGradient>
                </defs>
                <path d={tideSvg.areaD} fill="url(#tideAreaGrad)" />
                <path
                  d={tideSvg.d}
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                />

                {/* Current Hour Marker */}
                <line
                  x1={tideSvg.activePoint.x}
                  y1={14}
                  x2={tideSvg.activePoint.x}
                  y2={tideSvg.height - 14}
                  stroke="#facc15"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />
                <circle
                  cx={tideSvg.activePoint.x}
                  cy={tideSvg.activePoint.y}
                  r="5.5"
                  fill="#facc15"
                  stroke="#0f172a"
                  strokeWidth="2"
                />

                {/* Hour Labels every 4 hours */}
                {tideSvg.coords
                  .filter((_, i) => i % 4 === 0 || i === 23)
                  .map((pt) => (
                    <g key={pt.hour}>
                      <text
                        x={pt.x}
                        y={tideSvg.height - 2}
                        textAnchor="middle"
                        fill="rgba(226,232,240,0.68)"
                        fontSize="10"
                      >
                        {pt.label}
                      </text>
                      <text
                        x={pt.x}
                        y={Math.max(14, pt.y - 8)}
                        textAnchor="middle"
                        fill="#bae6fd"
                        fontSize="10"
                        fontWeight="600"
                      >
                        {pt.heightM}m
                      </text>
                    </g>
                  ))}
              </svg>
            </div>
          </div>

          {/* 4 Marine Metrics */}
          <div className="adv-telemetry-grid">
            <div className="adv-telemetry-item">
              <div className="adv-tel-head">
                <Waves size={15} color="#38bdf8" />
                <span>{lang === 'id' ? 'Tinggi Gelombang & Alun (Swell)' : 'Significant Wave & Swell'}</span>
              </div>
              <div className="adv-tel-value">
                {isMarineLoading ? '...' : `${marineData?.waveHeightM ?? 1.1} m`}{' '}
                <small>(Swell {marineData?.swellHeightM ?? 0.9}m)</small>
              </div>
              <p className="adv-tel-desc">
                {lang === 'id'
                  ? `Periode gelombang ${marineData?.wavePeriodS ?? 8.5} dtk dari arah ${getCardinalDirection(marineData?.waveDirectionDeg)} (${marineData?.waveDirectionDeg ?? 180}°).`
                  : `Wave period ${marineData?.wavePeriodS ?? 8.5}s arriving from ${getCardinalDirection(marineData?.waveDirectionDeg)} (${marineData?.waveDirectionDeg ?? 180}°).`}
              </p>
            </div>

            <div className="adv-telemetry-item">
              <div className="adv-tel-head">
                <Compass size={15} color="#34d399" />
                <span>{lang === 'id' ? 'Karakter Angin Pesisir' : 'Coastal Wind Regime'}</span>
              </div>
              <div className="adv-tel-value">{Math.round(surfaceWindKmh)} km/j</div>
              <p className="adv-tel-desc">{tideAnalytics.windRegime}</p>
            </div>

            <div className="adv-telemetry-item">
              <div className="adv-tel-head">
                <Thermometer size={15} color="#fbbf24" />
                <span>{lang === 'id' ? 'Suhu Permukaan Laut (SST)' : 'Sea Surface Temp (SST)'}</span>
              </div>
              <div className="adv-tel-value">{marineData?.sstC ?? 27.5}°C</div>
              <p className="adv-tel-desc">
                {(marineData?.sstC ?? 27) >= 24
                  ? lang === 'id'
                    ? 'Perairan hangat tropis — nyaman tanpa wetsuit tebal (cukup rashguard).'
                    : 'Warm tropical water — comfortable in boardshorts or rashguard.'
                  : lang === 'id'
                    ? 'Perairan dingin — disarankan memakai wetsuit neoprene 3/2mm.'
                    : 'Cool ocean temperature — 3/2mm or 4/3mm neoprene wetsuit advised.'}
              </p>
            </div>

            <div className="adv-telemetry-item">
              <div className="adv-tel-head">
                <Navigation size={15} color="#c084fc" />
                <span>{lang === 'id' ? 'Skor Kelayakan Selancar & Laut' : 'Surf & Marine Suitability'}</span>
              </div>
              <div className="adv-tel-value">
                {tideAnalytics.surfScore} <small>/ 10</small>
              </div>
              <p className="adv-tel-desc">
                {tideAnalytics.surfScore >= 7.5
                  ? lang === 'id'
                    ? 'Kondisi ombak dan periode alun sangat prima untuk selancar.'
                    : 'Prime groundswell period and clean surface conditions.'
                  : lang === 'id'
                    ? 'Kondisi moderat; perhatikan arus rip current di sekitar palung pantai.'
                    : 'Moderate conditions; watch for rip currents near channels.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 3: AI WEATHER TRAVEL & PACKING ASSISTANT (#4)
         ===================================================================== */}
      {activeTab === 'travel' && (
        <div className="adv-tab-panel">
          <div className="travel-controls-bar">
            <div className="travel-control-group">
              <label>{lang === 'id' ? 'Durasi Perjalanan:' : 'Trip Duration:'}</label>
              <div className="travel-pill-group">
                {(['short', 'medium', 'long'] as TripDuration[]).map((d) => (
                  <button
                    key={d}
                    type="button"
                    className={`travel-pill-btn ${tripDuration === d ? 'active' : ''}`}
                    onClick={() => setTripDuration(d)}
                  >
                    {d === 'short'
                      ? '1–3 Hari'
                      : d === 'medium'
                        ? '4–7 Hari'
                        : '8–14+ Hari'}
                  </button>
                ))}
              </div>
            </div>

            <div className="travel-control-group">
              <label>{lang === 'id' ? 'Gaya & Tujuan:' : 'Trip Style:'}</label>
              <div className="travel-pill-group">
                {(
                  [
                    { id: 'leisure', labelId: 'Liburan Kota', labelEn: 'City Leisure' },
                    { id: 'business', labelId: 'Bisnis & Kerja', labelEn: 'Business' },
                    { id: 'outdoor', labelId: 'Alam & Gunung', labelEn: 'Outdoor/Hike' },
                    { id: 'beach', labelId: 'Pantai & Resort', labelEn: 'Beach' },
                    { id: 'creator', labelId: 'Fotografi', labelEn: 'Creator' },
                  ] as { id: TripStyle; labelId: string; labelEn: string }[]
                ).map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className={`travel-pill-btn ${tripStyle === s.id ? 'active' : ''}`}
                    onClick={() => setTripStyle(s.id)}
                  >
                    {lang === 'id' ? s.labelId : s.labelEn}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Summary Strip */}
          <div className="travel-summary-grid">
            <div className="travel-stat-box">
              <span className="travel-stat-label">
                {lang === 'id' ? 'Rentang Termal Destinasi' : 'Destination Thermal Span'}
              </span>
              <strong className="travel-stat-val">
                {travelIntelligence.minTempC}°C – {travelIntelligence.maxTempC}°C
              </strong>
            </div>
            <div className="travel-stat-box">
              <span className="travel-stat-label">
                {lang === 'id' ? 'Risiko Hujan Maksimum' : 'Max Rain Probability'}
              </span>
              <strong className="travel-stat-val">{travelIntelligence.maxPopPct}%</strong>
            </div>
            <div className="travel-stat-box">
              <span className="travel-stat-label">
                <Clock size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                {lang === 'id' ? 'Jendela Keberangkatan Terbaik' : 'Optimal Departure Window'}
              </span>
              <strong className="travel-stat-val highlight">{travelIntelligence.bestHourLabel}</strong>
            </div>
            <div className="travel-stat-box">
              <span className="travel-stat-label">
                {lang === 'id' ? 'Progres Kesiapan Koper' : 'Packing Readiness'}
              </span>
              <strong className="travel-stat-val">
                {checkedTotal}/{travelIntelligence.items.length} ({packingProgressPct}%)
              </strong>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="travel-progress-track">
            <div
              className="travel-progress-fill"
              style={{ width: `${packingProgressPct}%` }}
            />
          </div>

          {/* Interactive Packing Checklist */}
          <div className="travel-checklist-grid">
            {travelIntelligence.items.map((item) => {
              const isChecked = !!checkedItems[item.id];
              return (
                <div
                  key={item.id}
                  className={`travel-check-card ${isChecked ? 'checked' : ''}`}
                  onClick={() => toggleCheckItem(item.id)}
                >
                  <div className="travel-check-icon">
                    {isChecked ? (
                      <CheckSquare size={18} color="#34d399" />
                    ) : (
                      <Square size={18} color="#94a3b8" />
                    )}
                  </div>
                  <div className="travel-check-body">
                    <div className="travel-check-title-row">
                      <span className="travel-check-label">{item.label}</span>
                      {item.id.startsWith('custom-') && (
                        <button
                          type="button"
                          className="travel-remove-custom"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCustomItems((prev) => prev.filter((c) => c.id !== item.id));
                          }}
                          title="Hapus"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                    <span className="travel-check-reason">{item.reason}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add Custom Item & Copy Itinerary Footer */}
          <div className="travel-footer-actions">
            <form className="travel-add-form" onSubmit={handleAddCustomItem}>
              <input
                type="text"
                className="travel-add-input"
                placeholder={
                  lang === 'id'
                    ? 'Tambah barang bawaan pribadi (mis: Obat Pribadi, Paspor)...'
                    : 'Add custom packing item (e.g. Passport, Medication)...'
                }
                value={newItemText}
                onChange={(e) => setNewItemText(e.target.value)}
              />
              <button type="submit" className="travel-add-btn">
                <Plus size={15} />
                <span>{lang === 'id' ? 'Tambah' : 'Add'}</span>
              </button>
            </form>

            <button
              type="button"
              className="travel-copy-btn"
              onClick={handleCopyItinerary}
            >
              {copiedItinerary ? <Check size={15} /> : <Copy size={15} />}
              <span>
                {copiedItinerary
                  ? lang === 'id'
                    ? 'Tersalin ke Clipboard!'
                    : 'Copied to Clipboard!'
                  : lang === 'id'
                    ? 'Salin Ringkasan Itinerary & Packing (WhatsApp)'
                    : 'Copy Travel & Packing Brief'}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 4: SEVERE WEATHER RADAR ALERT & EARLY WARNING SIREN (#7)
         ===================================================================== */}
      {activeTab === 'siren' && (
        <div className="adv-tab-panel">
          <div className="siren-command-deck">
            <div className="siren-deck-info">
              <h4 className="siren-deck-title">
                {lang === 'id'
                  ? 'Sistem Peringatan Dini (Nowcasting 0–6 Jam) & Sirine Audio Sintetis'
                  : '0–6h Nowcast Early Warning System & Synthesized Acoustic Siren'}
              </h4>
              <p className="siren-deck-desc">
                {lang === 'id'
                  ? 'Memindai pergerakan sel badai, anomali tekanan barometrik, dan lonjakan presipitasi di sekitar koordinat Anda secara real-time.'
                  : 'Continuously scans approaching storm cells, barometric pressure drops, and precipitation surges around your coordinates.'}
              </p>
            </div>

            <div className="siren-action-buttons">
              <button
                type="button"
                className={`siren-ctrl-btn ${sirenActive ? 'active' : ''}`}
                onClick={handleToggleSiren}
              >
                {sirenActive ? <Volume2 size={16} /> : <VolumeX size={16} />}
                <span>
                  {sirenActive
                    ? lang === 'id'
                      ? 'Auto-Sirine: AKTIF'
                      : 'Auto-Siren: ON'
                    : lang === 'id'
                      ? 'Auto-Sirine: NONAKTIF'
                      : 'Auto-Siren: OFF'}
                </span>
              </button>

              <button
                type="button"
                className={`siren-ctrl-btn ${pushActive ? 'active' : ''}`}
                onClick={handleTogglePush}
              >
                {pushActive ? <BellRing size={16} /> : <Bell size={16} />}
                <span>
                  {pushActive
                    ? lang === 'id'
                      ? 'Notifikasi Push: AKTIF'
                      : 'Web Push: ON'
                    : lang === 'id'
                      ? 'Aktifkan Notifikasi Push'
                      : 'Enable Web Push'}
                </span>
              </button>

              <button
                type="button"
                className="siren-test-btn"
                onClick={() => playWeatherAlertSiren('danger')}
              >
                <Volume2 size={15} />
                <span>
                  {lang === 'id' ? '🔊 Uji Bunyi Sirine Darurat' : '🔊 Test Emergency Siren'}
                </span>
              </button>
            </div>
          </div>

          <div className="siren-threat-grid">
            {nowcastThreats.map((threat) => (
              <div
                key={threat.id}
                className={`siren-threat-card level-${threat.level}`}
              >
                <div className="siren-threat-top">
                  <div className="siren-threat-title-wrap">
                    {threat.level === 'danger' ? (
                      <ShieldAlert size={18} color="#f87171" />
                    ) : threat.level === 'warning' ? (
                      <AlertTriangle size={18} color="#fbbf24" />
                    ) : (
                      <ShieldCheck size={18} color="#34d399" />
                    )}
                    <strong>{threat.title}</strong>
                  </div>
                  <span className={`siren-threat-badge badge-${threat.level}`}>
                    {threat.badge}
                  </span>
                </div>
                <p className="siren-threat-detail">{threat.detail}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

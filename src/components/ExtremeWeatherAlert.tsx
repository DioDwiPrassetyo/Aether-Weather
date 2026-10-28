'use client';

import React, { useEffect, useState } from 'react';
import {
  Flame,
  CloudLightning,
  CloudRain,
  Wind,
  ShieldAlert,
  X,
  ChevronRight,
  Eye,
  Snowflake,
} from 'lucide-react';
import {
  CurrentWeatherResponse,
  AirPollutionResponse,
  ForecastResponse,
  UnitType,
} from '@/types/weather';
import { Language, getTranslation } from '@/utils/i18n';
import {
  isNotificationActive,
  sendWeatherNotification,
} from '@/utils/notificationUtils';
import {
  DEFAULT_ALERT_PREFERENCES,
  getMaxRainProbability,
  normalizeWindSpeedToKmh,
  shouldAlertForExtremeHeat,
  shouldAlertForHeavyRain,
  shouldAlertForHighWind,
  shouldAlertForLowVisibility,
  shouldAlertForPoorAirQuality,
  shouldAlertForThunderstorm,
  WeatherAlertPreferences,
} from '@/utils/weatherRules';

interface ExtremeWeatherAlertProps {
  current: CurrentWeatherResponse;
  pollution: AirPollutionResponse | null;
  forecast: ForecastResponse | null;
  unit: UnitType;
  lang?: Language;
  preferences?: WeatherAlertPreferences;
}

interface AlertDetail {
  id: string;
  type: 'danger' | 'warning' | 'info';
  title: string;
  message: string;
  icon: React.ReactNode;
}

export const ExtremeWeatherAlert: React.FC<ExtremeWeatherAlertProps> = ({
  current,
  pollution,
  forecast,
  unit,
  lang = 'id',
  preferences = DEFAULT_ALERT_PREFERENCES,
}) => {
  const t = getTranslation(lang);
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    setDismissed([]);
    setIsExpanded(false);
  }, [current.id]);

  const alerts: AlertDetail[] = [];
  const weatherId = current.weather[0]?.id || 800;

  // Temperature normalized to Celsius for threshold evaluation
  const tempC =
    unit === 'metric'
      ? current.main.temp
      : ((current.main.temp - 32) * 5) / 9;
  const feelsLikeC =
    unit === 'metric'
      ? current.main.feels_like
      : ((current.main.feels_like - 32) * 5) / 9;

  // 1. Thunderstorm Alert
  if (shouldAlertForThunderstorm(weatherId, preferences)) {
    alerts.push({
      id: 'thunderstorm',
      type: 'danger',
      title: lang === 'id' ? 'Potensi Aktivitas Badai Petir' : 'Thunderstorm Conditions Detected',
      message:
        lang === 'id'
          ? 'Aktivitas petir dan kilat terdeteksi di sekitar area. Hindari berada di lapangan terbuka dan jauhi pohon tinggi.'
          : 'Lightning and storm activity detected in your area. Seek shelter indoors and avoid tall trees or open fields.',
      icon: <CloudLightning size={20} color="#facc15" />,
    });
  }

  // 1b. Blizzard, Heavy Snow & Freezing Rain Alert
  const isBlizzardCond = weatherId === 602 || weatherId === 622;
  const isSnowOrFreezing =
    weatherId === 511 || (weatherId >= 600 && weatherId < 700) || tempC <= 0;
  if (isSnowOrFreezing) {
    alerts.push({
      id: 'blizzard-snow',
      type: isBlizzardCond ? 'danger' : 'warning',
      title: isBlizzardCond
        ? lang === 'id'
          ? 'Peringatan Badai Salju Ekstrem (Blizzard)'
          : 'Severe Blizzard & Whiteout Warning'
        : lang === 'id'
          ? 'Kondisi Bersalju & Suhu Beku'
          : 'Snowfall & Freezing Conditions',
      message: isBlizzardCond
        ? lang === 'id'
          ? 'Badai salju lebat disertai hembusan angin membekukan dan jarak pandang whiteout. Tetap berada di dalam ruangan berpenghangat dan hindari perjalanan darat.'
          : 'Heavy blowing snow with sub-zero wind chill and whiteout visibility. Remain indoors and avoid road travel.'
        : lang === 'id'
          ? 'Presipitasi salju/es aktif di sekitar lokasi. Kenakan pakaian termal berlapis dan waspadai permukaan jalan licin beres (black ice).'
          : 'Active snow or freezing precipitation. Wear insulated thermal layers and watch for slippery black ice on roads.',
      icon: <Snowflake size={20} color="#bae6fd" />,
    });
  }

  // 2. Heavy Rain Alert
  const nextPoP = getMaxRainProbability(forecast);
  const heavyRainConditions = [502, 503, 504, 522].includes(weatherId);
  if (shouldAlertForHeavyRain(weatherId, nextPoP, preferences)) {
    alerts.push({
      id: 'heavy-rain',
      type: 'warning',
      title: lang === 'id' ? 'Potensi Hujan Deras' : 'Potential Heavy Rain',
      message:
        lang === 'id'
          ? heavyRainConditions && nextPoP < preferences.rainProbabilityThreshold
            ? 'Kondisi saat ini menunjukkan hujan intensitas tinggi. Siapkan payung atau jas hujan.'
            : `Peluang presipitasi mencapai ${nextPoP}%. Siapkan payung atau jas hujan.`
          : heavyRainConditions && nextPoP < preferences.rainProbabilityThreshold
            ? 'Current conditions indicate heavy rain. Keep rain gear prepared.'
            : `Precipitation probability reaches ${nextPoP}%. Keep rain gear prepared.`,
      icon: <CloudRain size={20} color="#38bdf8" />,
    });
  }

  // 3. Extreme Heat Warning
  if (shouldAlertForExtremeHeat(tempC, feelsLikeC, preferences)) {
    alerts.push({
      id: 'extreme-heat',
      type: 'danger',
      title: lang === 'id' ? 'Indikasi Panas Ekstrem' : 'Extreme Heat Conditions',
      message:
        lang === 'id'
          ? `Suhu terasa sangat menyengat (${Math.round(current.main.feels_like)}°). Cegah dehidrasi dengan minum air putih lebih sering dan batasi paparan terik matahari langsung.`
          : `Feels like ${Math.round(current.main.feels_like)}°. Stay hydrated, drink water frequently, and limit direct sun exposure.`,
      icon: <Flame size={20} color="#f87171" />,
    });
  }

  // 4. High Wind Warning
  const speedKmh = normalizeWindSpeedToKmh(current.wind.speed, unit);
  const gustKmh = current.wind.gust
    ? normalizeWindSpeedToKmh(current.wind.gust, unit)
    : 0;
  if (shouldAlertForHighWind(speedKmh, gustKmh, preferences)) {
    const observedWindKmh = Math.max(speedKmh, gustKmh);
    alerts.push({
      id: 'high-wind',
      type: 'warning',
      title: lang === 'id' ? 'Potensi Angin Kencang' : 'Potential High Winds',
      message:
        lang === 'id'
          ? `Kecepatan angin mencapai ${Math.round(observedWindKmh)} km/j. Waspadai benda yang mudah terlepas dan kurangi aktivitas di luar.`
          : `Wind speeds reach ${Math.round(observedWindKmh)} km/h. Secure loose items and consider limiting outdoor activity.`,
      icon: <Wind size={20} color="#60a5fa" />,
    });
  }

  // 5. Hazardous Air Quality (AQI >= 4)
  const aqiScore = pollution?.list?.[0]?.main?.aqi ?? 0;
  if (shouldAlertForPoorAirQuality(aqiScore, preferences)) {
    alerts.push({
      id: 'hazardous-aqi',
      type: 'danger',
      title: lang === 'id' ? 'Indikasi Kualitas Udara Buruk' : 'Poor Air Quality Indication',
      message:
        lang === 'id'
          ? 'Indeks pencemaran udara tinggi (PM2.5 meningkat). Kelompok sensitif disarankan mengenakan masker medis jika beraktivitas di luar.'
          : 'High particulate concentration (elevated PM2.5). Sensitive groups and outdoor exercisers should wear masks.',
      icon: <ShieldAlert size={20} color="#c084fc" />,
    });
  }

  // 6. Low Visibility
  if (shouldAlertForLowVisibility(current.visibility, preferences)) {
    alerts.push({
      id: 'low-visibility',
      type: 'warning',
      title: lang === 'id' ? 'Indikasi Jarak Pandang Rendah' : 'Low Visibility Indication',
      message:
        lang === 'id'
          ? `Jarak pandang hanya ${(current.visibility / 1000).toFixed(1)} km. Nyalakan lampu kabut kendaraan Anda dan jaga jarak aman saat berkendara.`
          : `Visibility reduced to ${(current.visibility / 1000).toFixed(1)} km. Turn on low beams or fog lights and maintain safe driving distances.`,
      icon: <Eye size={20} color="#cbd5e1" />,
    });
  }

  const activeAlerts = alerts.filter((a) => !dismissed.includes(a.id));
  const activeAlertKey = activeAlerts.map((alert) => alert.id).join('|');
  useEffect(() => {
    if (!isNotificationActive()) return;
    const now = Date.now();
    activeAlerts.forEach((alert) => {
      const key = `aether-alert-notified:${current.id}:${alert.id}`;
      const lastNotified = Number(localStorage.getItem(key) || 0);
      if (now - lastNotified < 3 * 60 * 60 * 1000) return;
      localStorage.setItem(key, String(now));
      sendWeatherNotification(alert.title, {
        body: `${current.name}: ${alert.message} ${
          lang === 'id'
            ? 'Indikasi otomatis, bukan peringatan resmi.'
            : 'Automated indication, not an official warning.'
        }`,
        tag: key,
      });
    });
  }, [current.id, current.name, current.dt, activeAlertKey, lang]);
  if (activeAlerts.length === 0) return null;

  const topAlert = activeAlerts[0];

  return (
    <div
      className={`weather-alert-banner alert-${topAlert.type}`}
      role="status"
      aria-live="polite"
    >
      <button
        className="alert-btn-dismiss"
        onClick={() => setDismissed((prev) => [...prev, topAlert.id])}
        title={lang === 'id' ? 'Tutup indikasi' : 'Dismiss indication'}
        aria-label={lang === 'id' ? 'Tutup indikasi' : 'Dismiss indication'}
      >
        <X size={16} />
      </button>

      <div className="alert-content-wrapper">
        <div className="alert-icon-wrap">{topAlert.icon}</div>
        <div className="alert-text-group">
          <div className="alert-header-row">
            <span className="alert-title">{topAlert.title}</span>
            <span className="alert-type-badge">
              {lang === 'id' ? 'INDIKASI' : 'ESTIMATE'}
            </span>
            {activeAlerts.length > 1 && (
              <span className="alert-badge-count">
                +{activeAlerts.length - 1} {lang === 'id' ? 'peringatan lainnya' : 'more alerts'}
              </span>
            )}
          </div>
          <p className="alert-desc">{topAlert.message}</p>
          <p className="alert-source-note">
            {lang === 'id'
              ? 'Indikasi otomatis berdasarkan data prakiraan, bukan peringatan resmi dari otoritas.'
              : 'Automatically estimated from forecast data; this is not an official authority warning.'}
          </p>

          {/* Actionable Health/Safety Chips */}
          <div className="alert-advice-chips">
            {topAlert.id === 'extreme-heat' && (
              <>
                <span className="advice-chip">💧 {lang === 'id' ? 'Perbanyak Minum Air' : 'Drink Water'}</span>
                <span className="advice-chip">🧢 {lang === 'id' ? 'Gunakan Payung / Topi' : 'Use Sun Hat'}</span>
                <span className="advice-chip">🧴 {lang === 'id' ? 'Pakai Tabir Surya' : 'Apply Sunscreen'}</span>
              </>
            )}
            {topAlert.id === 'thunderstorm' && (
              <>
                <span className="advice-chip">⚡ {lang === 'id' ? 'Jauhi Pohon Tinggi' : 'Avoid Tall Trees'}</span>
                <span className="advice-chip">🏠 {lang === 'id' ? 'Berlindung di Dalam' : 'Stay Indoors'}</span>
              </>
            )}
            {topAlert.id === 'heavy-rain' && (
              <>
                <span className="advice-chip">☂️ {lang === 'id' ? 'Siapkan Jas Hujan' : 'Rain Gear Ready'}</span>
                <span className="advice-chip">🚗 {lang === 'id' ? 'Waspadai Genangan' : 'Drive Safely'}</span>
              </>
            )}
            {topAlert.id === 'blizzard-snow' && (
              <>
                <span className="advice-chip">🧥 {lang === 'id' ? 'Gunakan Jaket Termal Berlapis' : 'Wear Thermal Layers'}</span>
                <span className="advice-chip">❄️ {lang === 'id' ? 'Waspada Jalanan Es (Black Ice)' : 'Watch for Black Ice'}</span>
                <span className="advice-chip">🧤 {lang === 'id' ? 'Cegah Hipotermia & Frostbite' : 'Prevent Frostbite'}</span>
              </>
            )}
          </div>

          {isExpanded && activeAlerts.length > 1 && (
            <div className="alert-expanded-list">
              {activeAlerts.slice(1).map((other) => (
                <div key={other.id} className="alert-expanded-item">
                  <div className="alert-sub-icon">{other.icon}</div>
                  <div>
                    <strong>{other.title}</strong>
                    <p>{other.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {activeAlerts.length > 1 && (
        <div className="alert-actions">
          <button
            className="alert-btn-toggle"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (lang === 'id' ? 'Tutup Detail' : 'Collapse') : (lang === 'id' ? 'Lihat Semua' : 'View All')}
            <ChevronRight
              size={14}
              style={{
                transform: isExpanded ? 'rotate(90deg)' : 'none',
                transition: 'transform 0.2s',
              }}
            />
          </button>
        </div>
      )}
    </div>
  );
};

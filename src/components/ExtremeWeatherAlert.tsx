'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  Flame,
  CloudLightning,
  CloudRain,
  Wind,
  ShieldAlert,
  X,
  ChevronRight,
  Eye,
} from 'lucide-react';
import {
  CurrentWeatherResponse,
  AirPollutionResponse,
  ForecastResponse,
  UnitType,
} from '@/types/weather';

interface ExtremeWeatherAlertProps {
  current: CurrentWeatherResponse;
  pollution: AirPollutionResponse | null;
  forecast: ForecastResponse | null;
  unit: UnitType;
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
}) => {
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

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
  if (weatherId >= 200 && weatherId < 300) {
    alerts.push({
      id: 'thunderstorm',
      type: 'danger',
      title: 'Peringatan Badai Petir (Thunderstorm)',
      message:
        'Aktivitas petir dan kilat terdeteksi di sekitar area. Hindari berada di lapangan terbuka dan jauhi pohon tinggi.',
      icon: <CloudLightning size={20} color="#facc15" />,
    });
  }

  // 2. Heavy Rain Alert
  const nextPoP = forecast?.list?.[0]?.pop ? Math.round(forecast.list[0].pop * 100) : 0;
  if ([502, 503, 504, 522].includes(weatherId) || nextPoP >= 80) {
    alerts.push({
      id: 'heavy-rain',
      type: 'warning',
      title: 'Potensi Hujan Deras / Genangan Air',
      message: `Peluang presipitasi tinggi (${nextPoP}%). Waspadai genangan air di jalan raya dan siapkan payung atau jas hujan.`,
      icon: <CloudRain size={20} color="#38bdf8" />,
    });
  }

  // 3. Extreme Heat Warning
  if (tempC >= 34 || feelsLikeC >= 38) {
    alerts.push({
      id: 'extreme-heat',
      type: 'danger',
      title: 'Peringatan Panas Ekstrem',
      message: `Suhu terasa sangat menyengat (${Math.round(current.main.feels_like)}°). Cegah dehidrasi dengan minum air putih lebih sering dan batasi paparan terik matahari langsung.`,
      icon: <Flame size={20} color="#f87171" />,
    });
  }

  // 4. High Wind Warning
  const speedKmh = current.wind.speed * (unit === 'metric' ? 3.6 : 1.60934);
  if (speedKmh >= 35 || (current.wind.gust && current.wind.gust * 3.6 >= 45)) {
    alerts.push({
      id: 'high-wind',
      type: 'warning',
      title: 'Peringatan Angin Kencang',
      message: `Kecepatan hembusan angin mencapai ${Math.round(speedKmh)} km/j. Hati-hati terhadap pohon rawan tumbang dan papan reklame.`,
      icon: <Wind size={20} color="#60a5fa" />,
    });
  }

  // 5. Hazardous Air Quality (AQI >= 4)
  const aqiScore = pollution?.list?.[0]?.main?.aqi ?? 0;
  if (aqiScore >= 4) {
    alerts.push({
      id: 'hazardous-aqi',
      type: 'danger',
      title: 'Kualitas Udara Buruk / Tidak Sehat',
      message:
        'Indeks pencemaran udara tinggi (PM2.5 meningkat). Kelompok sensitif disarankan mengenakan masker medis jika beraktivitas di luar.',
      icon: <ShieldAlert size={20} color="#c084fc" />,
    });
  }

  // 6. Low Visibility
  if (current.visibility <= 2000) {
    alerts.push({
      id: 'low-visibility',
      type: 'warning',
      title: 'Jarak Pandang Terbatas (Kabut Tebal)',
      message: `Jarak pandang hanya ${(current.visibility / 1000).toFixed(1)} km. Nyalakan lampu kabut kendaraan Anda dan jaga jarak aman saat berkendara.`,
      icon: <Eye size={20} color="#cbd5e1" />,
    });
  }

  const activeAlerts = alerts.filter((a) => !dismissed.includes(a.id));
  if (activeAlerts.length === 0) return null;

  const topAlert = activeAlerts[0];

  return (
    <div className={`weather-alert-banner alert-${topAlert.type}`}>
      <div className="alert-content-wrapper">
        <div className="alert-icon-wrap">{topAlert.icon}</div>
        <div className="alert-text-group">
          <div className="alert-header-row">
            <span className="alert-title">{topAlert.title}</span>
            {activeAlerts.length > 1 && (
              <span className="alert-badge-count">
                +{activeAlerts.length - 1} peringatan lainnya
              </span>
            )}
          </div>
          <p className="alert-desc">{topAlert.message}</p>

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

      <div className="alert-actions">
        {activeAlerts.length > 1 && (
          <button
            className="alert-btn-toggle"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Tutup Detail' : 'Lihat Semua'}
            <ChevronRight
              size={14}
              style={{
                transform: isExpanded ? 'rotate(90deg)' : 'none',
                transition: 'transform 0.2s',
              }}
            />
          </button>
        )}
        <button
          className="alert-btn-dismiss"
          onClick={() => setDismissed((prev) => [...prev, topAlert.id])}
          title="Tutup Peringatan"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

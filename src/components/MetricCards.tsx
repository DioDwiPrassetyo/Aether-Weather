'use client';

import React from 'react';
import {
  Wind,
  Droplet,
  Leaf,
  Sun,
  Sunrise,
  Sunset,
  Eye,
  Gauge,
  Cloud,
  CloudRain,
} from 'lucide-react';
import {
  CurrentWeatherResponse,
  AirPollutionResponse,
  ForecastResponse,
  UnitType,
} from '@/types/weather';
import { getCardinalDirection, getBeaufortScale } from '@/utils/weatherUtils';

interface MetricCardsProps {
  current: CurrentWeatherResponse;
  pollution: AirPollutionResponse | null;
  forecast: ForecastResponse | null;
  unit: UnitType;
}

export const MetricCards: React.FC<MetricCardsProps> = ({
  current,
  pollution,
  forecast,
  unit,
}) => {
  const speedUnit = unit === 'metric' ? 'km/j' : 'mph';
  const windDisplay =
    unit === 'metric' ? Math.round(current.wind.speed * 3.6) : Math.round(current.wind.speed);
  const gustDisplay = current.wind.gust
    ? unit === 'metric'
      ? Math.round(current.wind.gust * 3.6)
      : Math.round(current.wind.gust)
    : null;

  // Dew point calculation
  const unitSymbol = unit === 'metric' ? '°C' : '°F';
  const dewPoint = Math.round(current.main.temp - (100 - current.main.humidity) / 5);

  // AQI calculations
  const aqiItem = pollution?.list?.[0];
  const aqiScore = aqiItem?.main?.aqi ?? 0;
  const aqiConfig: Record<number, { label: string; className: string }> = {
    1: { label: 'Sangat Baik', className: 'aqi-good' },
    2: { label: 'Baik / Fair', className: 'aqi-fair' },
    3: { label: 'Sedang', className: 'aqi-moderate' },
    4: { label: 'Buruk', className: 'aqi-poor' },
    5: { label: 'Sangat Buruk', className: 'aqi-very-poor' },
  };
  const aqiInfo = aqiConfig[aqiScore] || { label: 'Memuat...', className: '' };

  // Sun Cycle calculation
  const formatTime = (ts: number, tz: number) => {
    const d = new Date((ts + tz) * 1000);
    return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
  };
  const sunriseStr = formatTime(current.sys.sunrise, current.timezone);
  const sunsetStr = formatTime(current.sys.sunset, current.timezone);

  const nowSec =
    Math.floor((Date.now() + new Date().getTimezoneOffset() * 60000) / 1000) + current.timezone;
  const totalDaySec = current.sys.sunset - current.sys.sunrise;
  const elapsedDaySec = nowSec - (current.sys.sunrise + current.timezone);
  const progress = Math.max(0, Math.min(1, elapsedDaySec / totalDaySec));
  const isDaytime =
    nowSec >= current.sys.sunrise + current.timezone &&
    nowSec <= current.sys.sunset + current.timezone;

  const angle = Math.PI - progress * Math.PI;
  const dotX = (80 + 70 * Math.cos(angle)).toFixed(1);
  const dotY = (75 - 70 * Math.sin(angle)).toFixed(1);

  // Visibility calculation
  const visDisplay =
    unit === 'metric'
      ? (current.visibility / 1000).toFixed(1)
      : (current.visibility * 0.000621371).toFixed(1);

  // Rain Chance calculation (PoP from first forecast)
  const nextPoP = forecast?.list?.[0]?.pop ? Math.round(forecast.list[0].pop * 100) : 0;

  return (
    <div className="highlights-grid">
      {/* 1. Wind & Compass */}
      <div className="glass-card metric-card">
        <div className="metric-header">
          <span className="metric-title">
            <Wind size={16} color="#38bdf8" /> Angin & Arah
          </span>
          <span className="metric-badge">{getBeaufortScale(current.wind.speed)}</span>
        </div>
        <div className="metric-body wind-body">
          <div className="compass-container">
            <div className="compass-dial">
              <span className="compass-point n">U</span>
              <span className="compass-point e">T</span>
              <span className="compass-point s">S</span>
              <span className="compass-point w">B</span>
              <div
                className="compass-arrow"
                style={{ transform: `rotate(${current.wind.deg || 0}deg)` }}
              >
                <div className="arrow-pointer"></div>
              </div>
            </div>
          </div>
          <div className="wind-info-group">
            <div className="metric-val-group">
              <span className="metric-main-value">{windDisplay}</span>
              <span className="metric-sub-unit">{speedUnit}</span>
            </div>
            <p className="metric-note">
              Arah: {getCardinalDirection(current.wind.deg)} ({current.wind.deg || 0}°)
            </p>
            <p className="metric-subtext">
              {gustDisplay ? `Hembusan: ${gustDisplay} ${speedUnit}` : 'Hembusan stabil'}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Humidity & Dew Point */}
      <div className="glass-card metric-card">
        <div className="metric-header">
          <span className="metric-title">
            <Droplet size={16} color="#38bdf8" /> Kelembapan
          </span>
          <span className="metric-badge">
            {current.main.humidity < 40 ? 'Kering' : current.main.humidity <= 65 ? 'Nyaman' : 'Lembap'}
          </span>
        </div>
        <div className="metric-body">
          <div className="metric-val-group">
            <span className="metric-main-value">{current.main.humidity}</span>
            <span className="metric-sub-unit">%</span>
          </div>
          <div className="progress-bar-wrap">
            <div
              className="progress-bar-fill"
              style={{ width: `${current.main.humidity}%` }}
            ></div>
          </div>
          <p className="metric-subtext">
            Titik Embun: {dewPoint}
            {unitSymbol}
          </p>
        </div>
      </div>

      {/* 3. Air Quality Index (AQI) */}
      <div className="glass-card metric-card">
        <div className="metric-header">
          <span className="metric-title">
            <Leaf size={16} color="#38bdf8" /> Kualitas Udara (AQI)
          </span>
          <span className={`aqi-badge-status ${aqiInfo.className}`}>{aqiInfo.label}</span>
        </div>
        <div className="metric-body">
          <div className="metric-val-group">
            <span className="metric-main-value">{aqiScore || '-'}</span>
            <span className="metric-sub-unit">/ 5</span>
          </div>
          <div className="aqi-meter">
            <div className="aqi-step" data-level="1"></div>
            <div className="aqi-step" data-level="2"></div>
            <div className="aqi-step" data-level="3"></div>
            <div className="aqi-step" data-level="4"></div>
            <div className="aqi-step" data-level="5"></div>
          </div>
          <div className="aqi-pollutants">
            <span>
              PM2.5: <b>{aqiItem?.components?.pm2_5?.toFixed(1) ?? '--'}</b>
            </span>
            <span>
              PM10: <b>{aqiItem?.components?.pm10?.toFixed(1) ?? '--'}</b>
            </span>
            <span>
              O₃: <b>{aqiItem?.components?.o3?.toFixed(1) ?? '--'}</b>
            </span>
          </div>
        </div>
      </div>

      {/* 4. Sun Cycle */}
      <div className="glass-card metric-card">
        <div className="metric-header">
          <span className="metric-title">
            <Sun size={16} color="#38bdf8" /> Siklus Surya
          </span>
          <span className="metric-badge">{isDaytime ? 'Siang Hari' : 'Malam Hari'}</span>
        </div>
        <div className="metric-body sun-cycle-body">
          <div className="sun-arc-wrap">
            <svg className="sun-arc-svg" viewBox="0 0 160 80">
              <path d="M 10 75 A 70 70 0 0 1 150 75" className="arc-bg" />
              <path d="M 10 75 A 70 70 0 0 1 150 75" className="arc-progress" />
              <circle
                cx={dotX}
                cy={dotY}
                r="6"
                className="sun-dot"
                style={{ opacity: isDaytime ? 1 : 0.35 }}
              />
            </svg>
          </div>
          <div className="sun-times-row">
            <div className="sun-time-box">
              <Sunrise size={18} color="#f59e0b" />
              <div>
                <span className="sun-sub">Terbit</span>
                <span className="sun-val">{sunriseStr}</span>
              </div>
            </div>
            <div className="sun-time-box">
              <Sunset size={18} color="#f59e0b" />
              <div>
                <span className="sun-sub">Terbenam</span>
                <span className="sun-val">{sunsetStr}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Visibility */}
      <div className="glass-card metric-card">
        <div className="metric-header">
          <span className="metric-title">
            <Eye size={16} color="#38bdf8" /> Jarak Pandang
          </span>
          <span className="metric-badge">
            {current.visibility >= 9000
              ? 'Sempurna'
              : current.visibility >= 5000
              ? 'Baik'
              : 'Terbatas'}
          </span>
        </div>
        <div className="metric-body">
          <div className="metric-val-group">
            <span className="metric-main-value">{visDisplay}</span>
            <span className="metric-sub-unit">{unit === 'metric' ? 'km' : 'mi'}</span>
          </div>
          <p className="metric-subtext">
            {current.visibility >= 9000
              ? 'Jarak pandang sangat jernih tanpa halangan.'
              : 'Jarak pandang memadai untuk aktivitas luar.'}
          </p>
        </div>
      </div>

      {/* 6. Pressure */}
      <div className="glass-card metric-card">
        <div className="metric-header">
          <span className="metric-title">
            <Gauge size={16} color="#38bdf8" /> Tekanan Udara
          </span>
          <span className="metric-badge">
            {current.main.pressure > 1013
              ? 'Tinggi'
              : current.main.pressure >= 1005
              ? 'Normal'
              : 'Rendah'}
          </span>
        </div>
        <div className="metric-body">
          <div className="metric-val-group">
            <span className="metric-main-value">{current.main.pressure}</span>
            <span className="metric-sub-unit">hPa</span>
          </div>
          <p className="metric-subtext">
            {current.main.pressure > 1013
              ? 'Tekanan tinggi, cuaca cenderung cerah.'
              : 'Tekanan atmosfer standar permukaan laut.'}
          </p>
        </div>
      </div>

      {/* 7. Cloud Cover */}
      <div className="glass-card metric-card">
        <div className="metric-header">
          <span className="metric-title">
            <Cloud size={16} color="#38bdf8" /> Tutupan Awan
          </span>
          <span className="metric-badge">
            {current.clouds.all <= 20
              ? 'Cerah'
              : current.clouds.all <= 60
              ? 'Sebagian'
              : 'Rapat'}
          </span>
        </div>
        <div className="metric-body">
          <div className="metric-val-group">
            <span className="metric-main-value">{current.clouds.all}</span>
            <span className="metric-sub-unit">%</span>
          </div>
          <div className="progress-bar-wrap">
            <div
              className="progress-bar-fill cloud-fill"
              style={{ width: `${current.clouds.all}%` }}
            ></div>
          </div>
          <p className="metric-subtext">Persentase langit tertutup oleh formasi awan.</p>
        </div>
      </div>

      {/* 8. Rain Chance */}
      <div className="glass-card metric-card">
        <div className="metric-header">
          <span className="metric-title">
            <CloudRain size={16} color="#38bdf8" /> Peluang Hujan
          </span>
          <span className="metric-badge">
            {nextPoP >= 60 ? 'Tinggi' : nextPoP >= 30 ? 'Sedang' : 'Rendah'}
          </span>
        </div>
        <div className="metric-body">
          <div className="metric-val-group">
            <span className="metric-main-value">{nextPoP}</span>
            <span className="metric-sub-unit">%</span>
          </div>
          <div className="progress-bar-wrap">
            <div
              className="progress-bar-fill rain-fill"
              style={{ width: `${nextPoP}%` }}
            ></div>
          </div>
          <p className="metric-subtext">
            {nextPoP >= 60
              ? 'Kemungkinan besar akan turun presipitasi.'
              : 'Kemungkinan presipitasi dalam beberapa jam ke depan.'}
          </p>
        </div>
      </div>
    </div>
  );
};

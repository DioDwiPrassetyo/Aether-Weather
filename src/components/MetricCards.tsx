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
import { Language, getTranslation } from '@/utils/i18n';
import { getCardinalDirection, getBeaufortScale } from '@/utils/weatherUtils';

interface MetricCardsProps {
  current: CurrentWeatherResponse;
  pollution: AirPollutionResponse | null;
  forecast: ForecastResponse | null;
  unit: UnitType;
  lang?: Language;
}

export const MetricCards: React.FC<MetricCardsProps> = ({
  current,
  pollution,
  forecast,
  unit,
  lang = 'id',
}) => {
  const t = getTranslation(lang);
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
  const aqiClassMap: Record<number, string> = {
    1: 'aqi-good',
    2: 'aqi-fair',
    3: 'aqi-moderate',
    4: 'aqi-poor',
    5: 'aqi-very-poor',
  };
  const aqiLabel = t.aqiLevels[aqiScore] || (lang === 'id' ? 'Memuat...' : 'Loading...');
  const aqiClassName = aqiClassMap[aqiScore] || '';

  // Sun Cycle calculation
  const formatTime = (ts: number, tz: number) => {
    const d = new Date((ts + tz) * 1000);
    return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
  };
  const sunriseStr = formatTime(current.sys.sunrise, current.timezone);
  const sunsetStr = formatTime(current.sys.sunset, current.timezone);

  const nowUtcSec = Math.floor(Date.now() / 1000);
  const isNightIcon = current.weather[0]?.icon?.endsWith('n');
  const isDaytime = isNightIcon
    ? false
    : current.weather[0]?.icon?.endsWith('d')
    ? true
    : nowUtcSec >= current.sys.sunrise && nowUtcSec < current.sys.sunset;

  // Progress of the sun across the daytime arc (0 at sunrise, 1 at sunset)
  let progress = 0;
  if (isDaytime) {
    const totalDaySec = Math.max(1, current.sys.sunset - current.sys.sunrise);
    const elapsedDaySec = nowUtcSec - current.sys.sunrise;
    progress = Math.max(0, Math.min(1, elapsedDaySec / totalDaySec));
  } else {
    progress = nowUtcSec >= current.sys.sunset ? 1 : 0;
  }

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
            <Wind size={16} color="#38bdf8" /> {t.windAndDirection}
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
              {lang === 'id' ? 'Arah' : 'Direction'}: {getCardinalDirection(current.wind.deg)} ({current.wind.deg || 0}°)
            </p>
            <p className="metric-subtext">
              {gustDisplay ? `${t.gustSpeed}: ${gustDisplay} ${speedUnit}` : (lang === 'id' ? 'Hembusan stabil' : 'Steady wind')}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Humidity & Dew Point */}
      <div className="glass-card metric-card">
        <div className="metric-header">
          <span className="metric-title">
            <Droplet size={16} color="#38bdf8" /> {t.humidityAndDew}
          </span>
          <span className="metric-badge">
            {current.main.humidity < 40
              ? t.dewComfortDry
              : current.main.humidity <= 65
              ? t.dewComfortNormal
              : t.dewComfortHumid}
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
            {t.dewPoint}: {dewPoint}
            {unitSymbol}
          </p>
        </div>
      </div>

      {/* 3. Air Quality Index (AQI) */}
      <div className="glass-card metric-card">
        <div className="metric-header">
          <span className="metric-title">
            <Leaf size={16} color="#38bdf8" /> {t.airQualityIndex}
          </span>
          <span className={`aqi-badge-status ${aqiClassName}`}>{aqiLabel}</span>
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
            <Sun size={16} color="#38bdf8" /> {t.sunCycle}
          </span>
          <span className="metric-badge">{isDaytime ? t.daytime : t.nighttime}</span>
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
                <span className="sun-sub">{t.sunrise}</span>
                <span className="sun-val">{sunriseStr}</span>
              </div>
            </div>
            <div className="sun-time-box">
              <Sunset size={18} color="#f59e0b" />
              <div>
                <span className="sun-sub">{t.sunset}</span>
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
            <Eye size={16} color="#38bdf8" /> {t.visibility}
          </span>
          <span className="metric-badge">
            {current.visibility >= 9000
              ? t.visibilityClear
              : current.visibility >= 5000
              ? t.visibilityGood
              : t.visibilityPoor}
          </span>
        </div>
        <div className="metric-body">
          <div className="metric-val-group">
            <span className="metric-main-value">{visDisplay}</span>
            <span className="metric-sub-unit">{unit === 'metric' ? 'km' : 'mi'}</span>
          </div>
          <p className="metric-subtext">
            {current.visibility >= 9000
              ? (lang === 'id' ? 'Jarak pandang sangat jernih tanpa halangan.' : 'Crystal clear visibility without obstruction.')
              : (lang === 'id' ? 'Jarak pandang memadai untuk aktivitas luar.' : 'Sufficient visibility for outdoor travel.')}
          </p>
        </div>
      </div>

      {/* 6. Pressure */}
      <div className="glass-card metric-card">
        <div className="metric-header">
          <span className="metric-title">
            <Gauge size={16} color="#38bdf8" /> {t.airPressure}
          </span>
          <span className="metric-badge">
            {current.main.pressure > 1013
              ? (lang === 'id' ? 'Tinggi' : 'High')
              : current.main.pressure >= 1005
              ? (lang === 'id' ? 'Normal' : 'Normal')
              : (lang === 'id' ? 'Rendah' : 'Low')}
          </span>
        </div>
        <div className="metric-body">
          <div className="metric-val-group">
            <span className="metric-main-value">{current.main.pressure}</span>
            <span className="metric-sub-unit">hPa</span>
          </div>
          <p className="metric-subtext">
            {current.main.pressure > 1013
              ? t.pressureRising
              : current.main.pressure < 1005
              ? t.pressureFalling
              : t.pressureStable}
          </p>
        </div>
      </div>

      {/* 7. Cloud Cover */}
      <div className="glass-card metric-card">
        <div className="metric-header">
          <span className="metric-title">
            <Cloud size={16} color="#38bdf8" /> {t.cloudCover}
          </span>
          <span className="metric-badge">
            {current.clouds.all <= 20
              ? (lang === 'id' ? 'Cerah' : 'Clear')
              : current.clouds.all <= 60
              ? (lang === 'id' ? 'Sebagian' : 'Scattered')
              : (lang === 'id' ? 'Rapat' : 'Overcast')}
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
          <p className="metric-subtext">
            {lang === 'id' ? 'Persentase langit tertutup oleh formasi awan.' : 'Cloud density covering the celestial dome.'}
          </p>
        </div>
      </div>

      {/* 8. Rain Chance */}
      <div className="glass-card metric-card">
        <div className="metric-header">
          <span className="metric-title">
            <CloudRain size={16} color="#38bdf8" /> {t.precipitationChance}
          </span>
          <span className="metric-badge">
            {nextPoP >= 60 ? (lang === 'id' ? 'Tinggi' : 'High') : nextPoP >= 30 ? (lang === 'id' ? 'Sedang' : 'Moderate') : (lang === 'id' ? 'Rendah' : 'Low')}
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
              ? (lang === 'id' ? 'Kemungkinan besar akan turun presipitasi.' : 'High likelihood of impending precipitation.')
              : (lang === 'id' ? 'Kemungkinan presipitasi dalam beberapa jam ke depan.' : 'Precipitation probability over incoming hours.')}
          </p>
        </div>
      </div>
    </div>
  );
};

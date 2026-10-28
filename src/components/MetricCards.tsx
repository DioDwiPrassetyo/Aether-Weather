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
  const totalDaySec = Math.max(1, current.sys.sunset - current.sys.sunrise);
  const daylightHours = Math.floor(totalDaySec / 3600);
  const daylightMins = Math.floor((totalDaySec % 3600) / 60);
  const daylightDurationStr =
    lang === 'id' ? `${daylightHours}j ${daylightMins}m` : `${daylightHours}h ${daylightMins}m`;

  let progress = 0;
  let sunCountdownStr = '';
  if (isDaytime) {
    const elapsedDaySec = Math.max(0, nowUtcSec - current.sys.sunrise);
    progress = Math.max(0, Math.min(1, elapsedDaySec / totalDaySec));
    const remSec = Math.max(0, current.sys.sunset - nowUtcSec);
    const remH = Math.floor(remSec / 3600);
    const remM = Math.floor((remSec % 3600) / 60);
    sunCountdownStr =
      lang === 'id'
        ? `${remH}j ${remM}m menuju senja`
        : `${remH}h ${remM}m until sunset`;
  } else {
    progress = nowUtcSec >= current.sys.sunset ? 1 : 0;
    const nextSunrise =
      nowUtcSec >= current.sys.sunset ? current.sys.sunrise + 86400 : current.sys.sunrise;
    const remSec = Math.max(0, nextSunrise - nowUtcSec);
    const remH = Math.floor(remSec / 3600);
    const remM = Math.floor((remSec % 3600) / 60);
    sunCountdownStr =
      lang === 'id'
        ? `${remH}j ${remM}m menuju fajar`
        : `${remH}h ${remM}m until sunrise`;
  }

  // Estimate real-time UV Index from solar elevation & cloud cover
  const solarElevationFactor = isDaytime ? Math.sin(progress * Math.PI) : 0;
  const latFactor = Math.max(0.45, Math.cos((Math.abs(current.coord.lat) * Math.PI) / 180));
  const cloudTransmittance = 1 - (current.clouds.all / 100) * 0.68;
  const estimatedUV = isDaytime
    ? Math.max(0, Math.round(11.5 * solarElevationFactor * latFactor * cloudTransmittance))
    : 0;

  const angle = Math.PI - progress * Math.PI;
  const dotX = (80 + 70 * Math.cos(angle)).toFixed(1);
  const dotY = (75 - 70 * Math.sin(angle)).toFixed(1);

  // Visibility calculation
  const visDisplay =
    unit === 'metric'
      ? (current.visibility / 1000).toFixed(1)
      : (current.visibility * 0.000621371).toFixed(1);

  // Rain Chance & 24h Accumulation calculation
  const nextPoP = forecast?.list?.[0]?.pop ? Math.round(forecast.list[0].pop * 100) : 0;
  const totalRain24hMm = (forecast?.list || []).slice(0, 8).reduce((acc, item) => {
    const r3h = item.rain?.['3h'] ?? item.rain?.['1h'] ?? 0;
    return acc + r3h;
  }, 0);

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
            {[1, 2, 3, 4, 5].map((lvl) => (
              <div
                key={lvl}
                className={`aqi-step ${aqiScore >= lvl ? 'step-active' : ''}`}
                data-level={lvl}
              ></div>
            ))}
          </div>
          <div className="aqi-pollutants aqi-pollutants-grid">
            <span>
              PM2.5: <b>{aqiItem?.components?.pm2_5?.toFixed(1) ?? '--'}</b>
            </span>
            <span>
              PM10: <b>{aqiItem?.components?.pm10?.toFixed(1) ?? '--'}</b>
            </span>
            <span>
              O₃: <b>{aqiItem?.components?.o3?.toFixed(1) ?? '--'}</b>
            </span>
            <span>
              NO₂: <b>{aqiItem?.components?.no2?.toFixed(1) ?? '--'}</b>
            </span>
            <span>
              SO₂: <b>{aqiItem?.components?.so2?.toFixed(1) ?? '--'}</b>
            </span>
            <span>
              CO: <b>{aqiItem?.components?.co ? Math.round(aqiItem.components.co) : '--'}</b>
            </span>
          </div>
          <p className="metric-subtext" style={{ marginTop: '0.4rem', fontSize: '0.74rem' }}>
            {aqiScore <= 2
              ? (lang === 'id' ? 'Udara bersih untuk aktivitas pernapasan luar ruang.' : 'Fresh & clean air for all outdoor activities.')
              : aqiScore === 3
              ? (lang === 'id' ? 'Kelompok sensitif sebaiknya kurangi latihan berat di luar.' : 'Sensitive individuals should limit strenuous outdoor efforts.')
              : (lang === 'id' ? 'Gunakan masker pelindung jika beraktivitas lama di luar.' : 'Protective mask recommended for outdoor stays.')}
          </p>
        </div>
      </div>

      {/* 4. Sun Cycle & UV Telemetry */}
      <div className="glass-card metric-card">
        <div className="metric-header">
          <span className="metric-title">
            <Sun size={16} color="#38bdf8" /> {t.sunCycle}
          </span>
          <span className="metric-badge">
            {isDaytime ? `UV ${estimatedUV} • ${t.daytime}` : t.nighttime}
          </span>
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
          <div className="sun-meta-footer">
            <span>
              {lang === 'id' ? 'Durasi Siang:' : 'Daylight:'} <strong>{daylightDurationStr}</strong>
            </span>
            <span>{sunCountdownStr}</span>
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
          <div className="progress-bar-wrap">
            <div
              className="progress-bar-fill vis-fill"
              style={{ width: `${Math.min(100, Math.max(10, (current.visibility / 10000) * 100))}%` }}
            ></div>
          </div>
          <p className="metric-subtext">
            {current.visibility >= 9000
              ? (lang === 'id' ? 'Jarak pandang sangat jernih tanpa halangan.' : 'Crystal clear visibility without obstruction.')
              : (lang === 'id' ? 'Jarak pandang memadai untuk perjalanan.' : 'Sufficient visibility for outdoor travel.')}
          </p>
        </div>
      </div>

      {/* 6. Air Pressure & Barometer Instrument */}
      {(() => {
        const pVal = current.main.pressure;
        const clampedP = Math.max(975, Math.min(1045, pVal));
        const needleAngle = ((clampedP - 975) / (1045 - 975)) * 260 - 130;

        let trendText =
          lang === 'id'
            ? 'Kondisi stabil, seimbang di dekat standar 1013 hPa.'
            : 'Balanced conditions near standard 1013 hPa.';
        let trendBadge = lang === 'id' ? 'Stabil (Normal)' : 'Steady (Normal)';
        let trendColor = '#38bdf8';

        if (pVal > 1018) {
          trendText =
            lang === 'id'
              ? 'Tekanan tinggi: Atmosfer mantap, pembentukan awan minim.'
              : 'High pressure: Stable air mass, clear fair skies.';
          trendBadge = lang === 'id' ? 'Tinggi (Cerah)' : 'High (Fair)';
          trendColor = '#34d399';
        } else if (pVal < 1006) {
          trendText =
            lang === 'id'
              ? 'Tekanan rendah: Udara lembap naik, potensi hujan & angin.'
              : 'Low pressure: Rising moist air, rain & storm risk.';
          trendBadge = lang === 'id' ? 'Rendah (Hujan)' : 'Low (Rain)';
          trendColor = '#f87171';
        }

        return (
          <div className="glass-card metric-card barometer-card">
            <div className="metric-header">
              <span className="metric-title">
                <Gauge size={16} color="#38bdf8" /> {t.airPressure}
              </span>
              <span className="metric-badge" style={{ color: trendColor }}>
                {pVal > 1013
                  ? (lang === 'id' ? 'Tinggi' : 'High')
                  : pVal >= 1005
                  ? (lang === 'id' ? 'Normal' : 'Normal')
                  : (lang === 'id' ? 'Rendah' : 'Low')}
              </span>
            </div>
            <div className="metric-body barometer-body">
              {/* Circular Barometer Instrument Dial (matches Compass layout) */}
              <div className="barometer-dial-container">
                <div className="barometer-dial-disc">
                  <svg className="barometer-dial-svg" viewBox="0 0 76 76" width="76" height="76">
                    <defs>
                      <linearGradient id="baroGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#f43f5e" />
                        <stop offset="35%" stopColor="#38bdf8" />
                        <stop offset="65%" stopColor="#34d399" />
                        <stop offset="100%" stopColor="#facc15" />
                      </linearGradient>
                    </defs>

                    {/* Scale Arc Track (260 degrees) */}
                    <path
                      d="M 18.5 57.5 A 28 28 0 1 1 57.5 57.5"
                      fill="none"
                      stroke="rgba(255, 255, 255, 0.12)"
                      strokeWidth="5"
                      strokeLinecap="round"
                    />
                    <path
                      d="M 18.5 57.5 A 28 28 0 1 1 57.5 57.5"
                      fill="none"
                      stroke="url(#baroGrad)"
                      strokeWidth="2.5"
                      strokeDasharray="2 3"
                      strokeLinecap="round"
                    />

                    {/* Scale Reference Notches */}
                    <circle cx="18.5" cy="57.5" r="1.5" fill="#f43f5e" />
                    <circle cx="38" cy="10" r="1.8" fill="#38bdf8" />
                    <circle cx="57.5" cy="57.5" r="1.5" fill="#facc15" />

                    {/* Unit Label */}
                    <text x="38" y="52" fontSize="7" fill="#94a3b8" fontWeight="600" textAnchor="middle">
                      hPa
                    </text>

                    {/* Pivot Rotating Needle */}
                    <g transform={`rotate(${needleAngle}, 38, 38)`}>
                      <line
                        x1="38"
                        y1="38"
                        x2="38"
                        y2="14"
                        stroke="#f43f5e"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                      <circle cx="38" cy="13" r="2" fill="#f43f5e" />
                      <circle cx="38" cy="38" r="4" fill="#0f172a" stroke="#cbd5e1" strokeWidth="1.5" />
                      <circle cx="38" cy="38" r="1.5" fill="#f43f5e" />
                    </g>
                  </svg>
                </div>
              </div>

              {/* Barometer Info Values */}
              <div className="barometer-info-group">
                <div className="metric-val-group">
                  <span className="metric-main-value">{pVal}</span>
                  <span className="metric-sub-unit">hPa</span>
                </div>
                <p className="metric-note">
                  {lang === 'id' ? 'Indeks' : 'Status'}: <strong>{trendBadge}</strong>
                </p>
                <p className="metric-subtext">{trendText}</p>
              </div>
            </div>
          </div>
        );
      })()}

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
            {lang === 'id' ? 'Persentase langit tertutup oleh awan.' : 'Cloud density covering the celestial dome.'}
          </p>
        </div>
      </div>

      {/* 8. Rain Chance & 24h Accumulation */}
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
            {totalRain24hMm > 0
              ? lang === 'id'
                ? `Estimasi akumulasi 24 jam: ${totalRain24hMm.toFixed(1)} mm.`
                : `Est. 24h rainfall accumulation: ${totalRain24hMm.toFixed(1)} mm.`
              : nextPoP >= 60
                ? lang === 'id'
                  ? 'Kemungkinan besar akan turun hujan.'
                  : 'High probability of rain coming soon.'
                : lang === 'id'
                  ? 'Peluang turun hujan beberapa jam ke depan.'
                  : 'Precipitation probability over incoming hours.'}
          </p>
        </div>
      </div>
    </div>
  );
};

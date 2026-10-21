'use client';

import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Clock,
  ArrowUp,
  ArrowDown,
  Wind,
  Droplets,
  Share2,
  WifiOff,
} from 'lucide-react';
import { CurrentWeatherResponse, UnitType } from '@/types/weather';
import { Language, getTranslation } from '@/utils/i18n';
import { WeatherHeroArt } from './WeatherIcons';

interface HeroCardProps {
  weather: CurrentWeatherResponse;
  unit: UnitType;
  lang?: Language;
  onOpenShare?: () => void;
  isOffline?: boolean;
}

export const HeroCard: React.FC<HeroCardProps> = ({
  weather,
  unit,
  lang = 'id',
  onOpenShare,
  isOffline = false,
}) => {
  const t = getTranslation(lang);
  const [localTimeStr, setLocalTimeStr] = useState('--:--:--');
  const [localDateStr, setLocalDateStr] = useState('...');

  // Smooth count-up animation for main temperature
  const targetTemp = Math.round(weather.main.temp);
  const [displayTemp, setDisplayTemp] = useState(targetTemp);

  useEffect(() => {
    let start = displayTemp;
    const end = targetTemp;
    if (start === end) return;

    const duration = 500;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const ease = 1 - Math.pow(1 - progress, 3);
      const currentVal = Math.round(start + (end - start) * ease);
      setDisplayTemp(currentVal);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    const handle = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(handle);
  }, [targetTemp]);

  useEffect(() => {
    const updateTime = () => {
      const nowUtc = Date.now() + new Date().getTimezoneOffset() * 60000;
      const cityTime = new Date(nowUtc + weather.timezone * 1000);

      const hours = String(cityTime.getHours()).padStart(2, '0');
      const minutes = String(cityTime.getMinutes()).padStart(2, '0');
      const seconds = String(cityTime.getSeconds()).padStart(2, '0');
      setLocalTimeStr(`${hours}:${minutes}:${seconds}`);

      const dayName = t.days[cityTime.getDay()];
      const dateNum = cityTime.getDate();
      const monthName = t.months[cityTime.getMonth()];
      const yearNum = cityTime.getFullYear();
      setLocalDateStr(`${dayName}, ${dateNum} ${monthName} ${yearNum}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [weather.timezone, t]);

  const condition = weather.weather[0];
  const isNight = condition.icon.endsWith('n');
  const unitSymbol = unit === 'metric' ? '°C' : '°F';
  const speedUnit = unit === 'metric' ? 'km/j' : 'mph';
  const windDisplay =
    unit === 'metric' ? Math.round(weather.wind.speed * 3.6) : Math.round(weather.wind.speed);

  const translatedDesc =
    t.descriptions[condition.description.toLowerCase()] || condition.description;

  return (
    <div className="glass-card hero-card">
      <div className="hero-top">
        <div className="location-info">
          <div className="location-title-row">
            <MapPin size={20} color="#38bdf8" />
            <h2>{weather.name}</h2>
            <span className="country-badge">{weather.sys.country || '--'}</span>
            {isOffline && (
              <span className="offline-badge" title={t.offlineNotice}>
                <WifiOff size={12} /> {t.offlineMode}
              </span>
            )}
          </div>
          <p className="local-time">
            <Clock size={14} color="#7dd3fc" />
            <span>{localTimeStr}</span> &bull; <span>{localDateStr}</span>
          </p>
        </div>

        <div className="hero-top-actions">
          <div className="weather-condition-pill">
            <span>{translatedDesc}</span>
          </div>
          {onOpenShare && (
            <button
              className="hero-share-action-btn"
              onClick={onOpenShare}
              title={t.shareWeather}
            >
              <Share2 size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="hero-center">
        <div className="hero-icon-container">
          <WeatherHeroArt weatherId={condition.id} isNight={isNight} />
        </div>

        <div className="hero-temp-group">
          <div className="temp-row">
            <span className="temp-value">{displayTemp}</span>
            <span className="temp-unit">{unitSymbol}</span>
          </div>
          <p className="feels-like-text">
            {t.feelsLike} <strong>{Math.round(weather.main.feels_like)}°</strong>
          </p>
        </div>
      </div>

      <div className="hero-stats-bar">
        <div className="hero-stat-item">
          <ArrowUp size={18} className="stat-icon-up" />
          <div>
            <span className="stat-label">{t.tempHigh}</span>
            <span className="stat-val">{Math.round(weather.main.temp_max)}°</span>
          </div>
        </div>
        <div className="stat-divider"></div>
        <div className="hero-stat-item">
          <ArrowDown size={18} className="stat-icon-down" />
          <div>
            <span className="stat-label">{t.tempLow}</span>
            <span className="stat-val">{Math.round(weather.main.temp_min)}°</span>
          </div>
        </div>
        <div className="stat-divider"></div>
        <div className="hero-stat-item">
          <Wind size={18} color="#38bdf8" />
          <div>
            <span className="stat-label">{t.wind}</span>
            <span className="stat-val">
              {windDisplay} {speedUnit}
            </span>
          </div>
        </div>
        <div className="stat-divider"></div>
        <div className="hero-stat-item">
          <Droplets size={18} color="#38bdf8" />
          <div>
            <span className="stat-label">{t.humidity}</span>
            <span className="stat-val">{weather.main.humidity}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

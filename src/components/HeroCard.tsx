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
  Sparkles,
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
  const [periodBadge, setPeriodBadge] = useState('🌙 Malam');

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

      const h = cityTime.getHours();
      let period = lang === 'id' ? '🌙 Malam' : '🌙 Night';
      if (h >= 5 && h < 11) period = lang === 'id' ? '🌅 Pagi' : '🌅 Morning';
      else if (h >= 11 && h < 15) period = lang === 'id' ? '☀️ Siang' : '☀️ Midday';
      else if (h >= 15 && h < 19) period = lang === 'id' ? '🌇 Sore' : '🌇 Evening';
      setPeriodBadge(period);

      const dayName = t.days[cityTime.getDay()];
      const dateNum = cityTime.getDate();
      const monthName = t.months[cityTime.getMonth()];
      const yearNum = cityTime.getFullYear();
      setLocalDateStr(`${dayName}, ${dateNum} ${monthName} ${yearNum}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [weather.timezone, t, lang]);

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
      {/* 1. Top Bar: Location & Share Action */}
      <div className="hero-top">
        <div className="location-info">
          <div className="location-title-row">
            <MapPin size={20} className="location-pin-icon" />
            <h2>{weather.name}</h2>
            <span className="country-badge">{weather.sys.country || '--'}</span>
            {isOffline && (
              <span className="offline-badge" title={t.offlineNotice}>
                <WifiOff size={12} /> {t.offlineMode}
              </span>
            )}
          </div>
          <div className="local-time-row">
            <Clock size={13} className="time-clock-icon" />
            <span className="live-clock-digits">{localTimeStr}</span>
            <span className="time-divider">&bull;</span>
            <span className="local-date-text">{localDateStr}</span>
            <span className="period-pill">{periodBadge}</span>
          </div>
        </div>

        <div className="hero-top-actions">
          {onOpenShare && (
            <button
              className="hero-share-action-btn"
              onClick={onOpenShare}
              title={lang === 'id' ? 'Bagikan & Unduh Kartu Cuaca' : 'Share & Download Weather Card'}
              aria-label={lang === 'id' ? 'Bagikan & Unduh Kartu Cuaca' : 'Share & Download Weather Card'}
              id="hero-share-btn"
            >
              <Share2 size={15} />
              <span className="hero-share-btn-text">
                {lang === 'id' ? 'Bagikan & Unduh' : 'Share & Download'}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Center: 3D Artwork + Temperature + Integrated Condition & Feels-Like */}
      <div className="hero-center">
        <div className="hero-icon-container">
          <WeatherHeroArt weatherId={condition.id} isNight={isNight} />
        </div>

        <div className="hero-temp-group">
          <div className="temp-row">
            <span className="temp-value">{displayTemp}</span>
            <span className="temp-unit">{unitSymbol}</span>
          </div>

          <div className="hero-condition-wrap">
            <span className="hero-condition-pill">
              <Sparkles size={13} className="condition-sparkle" />
              <span>{translatedDesc}</span>
            </span>
            <span className="hero-feels-like-pill">
              {t.feelsLike} <strong>{Math.round(weather.main.feels_like)}°</strong>
            </span>
          </div>
        </div>
      </div>

      {/* 3. Bottom Stats: 4 Equal Symmetrical Micro-Cards with Zero Truncation */}
      <div className="hero-stats-bar">
        <div className="hero-stat-card">
          <span className="hero-stat-icon-wrap stat-icon-up">
            <ArrowUp size={14} />
          </span>
          <span className="stat-val">{Math.round(weather.main.temp_max)}°</span>
          <span className="stat-label">{t.tempHigh}</span>
        </div>

        <div className="hero-stat-card">
          <span className="hero-stat-icon-wrap stat-icon-down">
            <ArrowDown size={14} />
          </span>
          <span className="stat-val">{Math.round(weather.main.temp_min)}°</span>
          <span className="stat-label">{t.tempLow}</span>
        </div>

        <div className="hero-stat-card">
          <span className="hero-stat-icon-wrap stat-icon-wind">
            <Wind size={14} />
          </span>
          <span className="stat-val">
            {windDisplay} <small className="stat-unit">{speedUnit}</small>
          </span>
          <span className="stat-label">{t.wind}</span>
        </div>

        <div className="hero-stat-card">
          <span className="hero-stat-icon-wrap stat-icon-humidity">
            <Droplets size={14} />
          </span>
          <span className="stat-val">{weather.main.humidity}%</span>
          <span className="stat-label">{t.humidity}</span>
        </div>
      </div>
    </div>
  );
};


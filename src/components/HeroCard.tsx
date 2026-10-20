'use client';

import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Clock,
  ArrowUp,
  ArrowDown,
  Wind,
  Droplets,
} from 'lucide-react';
import { CurrentWeatherResponse, UnitType } from '@/types/weather';
import { I18N } from '@/utils/weatherUtils';
import { WeatherHeroArt } from './WeatherIcons';

interface HeroCardProps {
  weather: CurrentWeatherResponse;
  unit: UnitType;
}

export const HeroCard: React.FC<HeroCardProps> = ({ weather, unit }) => {
  const [localTimeStr, setLocalTimeStr] = useState('--:--:--');
  const [localDateStr, setLocalDateStr] = useState('Memuat tanggal...');

  useEffect(() => {
    const updateTime = () => {
      const nowUtc = Date.now() + new Date().getTimezoneOffset() * 60000;
      const cityTime = new Date(nowUtc + weather.timezone * 1000);

      const hours = String(cityTime.getHours()).padStart(2, '0');
      const minutes = String(cityTime.getMinutes()).padStart(2, '0');
      const seconds = String(cityTime.getSeconds()).padStart(2, '0');
      setLocalTimeStr(`${hours}:${minutes}:${seconds}`);

      const dayName = I18N.days[cityTime.getDay()];
      const dateNum = cityTime.getDate();
      const monthName = I18N.months[cityTime.getMonth()];
      const yearNum = cityTime.getFullYear();
      setLocalDateStr(`${dayName}, ${dateNum} ${monthName} ${yearNum}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [weather.timezone]);

  const condition = weather.weather[0];
  const isNight = condition.icon.endsWith('n');
  const unitSymbol = unit === 'metric' ? '°C' : '°F';
  const speedUnit = unit === 'metric' ? 'km/j' : 'mph';
  const windDisplay =
    unit === 'metric' ? Math.round(weather.wind.speed * 3.6) : Math.round(weather.wind.speed);

  return (
    <div className="glass-card hero-card">
      <div className="hero-top">
        <div className="location-info">
          <div className="location-title-row">
            <MapPin size={20} color="#38bdf8" />
            <h2>{weather.name}</h2>
            <span className="country-badge">{weather.sys.country || '--'}</span>
          </div>
          <p className="local-time">
            <Clock size={14} color="#7dd3fc" />
            <span>{localTimeStr}</span> &bull; <span>{localDateStr}</span>
          </p>
        </div>
        <div className="weather-condition-pill">
          <span>{I18N.translate(condition.description)}</span>
        </div>
      </div>

      <div className="hero-center">
        <div className="hero-icon-container">
          <WeatherHeroArt weatherId={condition.id} isNight={isNight} />
        </div>

        <div className="hero-temp-group">
          <div className="temp-row">
            <span className="temp-value">{Math.round(weather.main.temp)}</span>
            <span className="temp-unit">{unitSymbol}</span>
          </div>
          <p className="feels-like-text">
            Terasa seperti <strong>{Math.round(weather.main.feels_like)}°</strong>
          </p>
        </div>
      </div>

      <div className="hero-stats-bar">
        <div className="hero-stat-item">
          <ArrowUp size={18} className="stat-icon-up" />
          <div>
            <span className="stat-label">Tertinggi</span>
            <span className="stat-val">{Math.round(weather.main.temp_max)}°</span>
          </div>
        </div>
        <div className="stat-divider"></div>
        <div className="hero-stat-item">
          <ArrowDown size={18} className="stat-icon-down" />
          <div>
            <span className="stat-label">Terendah</span>
            <span className="stat-val">{Math.round(weather.main.temp_min)}°</span>
          </div>
        </div>
        <div className="stat-divider"></div>
        <div className="hero-stat-item">
          <Wind size={18} color="#38bdf8" />
          <div>
            <span className="stat-label">Angin</span>
            <span className="stat-val">
              {windDisplay} {speedUnit}
            </span>
          </div>
        </div>
        <div className="stat-divider"></div>
        <div className="hero-stat-item">
          <Droplets size={18} color="#38bdf8" />
          <div>
            <span className="stat-label">Kelembapan</span>
            <span className="stat-val">{weather.main.humidity}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

'use client';

import React, { useEffect } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Wind,
  Droplets,
  CloudRain,
  Eye,
  Gauge,
  Cloud,
  Thermometer,
  Compass,
} from 'lucide-react';
import { ForecastItem, UnitType } from '@/types/weather';
import { Language, getTranslation } from '@/utils/i18n';
import { getCardinalDirection } from '@/utils/weatherUtils';
import { WeatherHeroArt } from './WeatherIcons';

interface HourlyDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: ForecastItem[];
  currentIndex: number;
  onSelectIndex: (index: number) => void;
  timezoneOffset: number;
  unit: UnitType;
  lang?: Language;
}

export const HourlyDetailModal: React.FC<HourlyDetailModalProps> = ({
  isOpen,
  onClose,
  items,
  currentIndex,
  onSelectIndex,
  timezoneOffset,
  unit,
  lang = 'id',
}) => {
  const t = getTranslation(lang);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && currentIndex > 0) onSelectIndex(currentIndex - 1);
      if (e.key === 'ArrowRight' && currentIndex < items.length - 1)
        onSelectIndex(currentIndex + 1);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, items.length, onClose, onSelectIndex]);

  if (!isOpen || !items[currentIndex]) return null;

  const item = items[currentIndex];
  const unitSymbol = unit === 'metric' ? '°C' : '°F';
  const speedUnit = unit === 'metric' ? 'km/j' : 'mph';

  const windSpeed =
    unit === 'metric' ? Math.round(item.wind.speed * 3.6) : Math.round(item.wind.speed);
  const windGust = item.wind.gust
    ? unit === 'metric'
      ? Math.round(item.wind.gust * 3.6)
      : Math.round(item.wind.gust)
    : null;

  const d = new Date((item.dt + timezoneOffset) * 1000);
  const hourStr = `${String(d.getUTCHours()).padStart(2, '0')}:00`;
  const dayName = t.days[d.getUTCDay()];
  const dateStr = `${d.getUTCDate()} ${t.months[d.getUTCMonth()]}`;

  const condition = item.weather[0] || { id: 800, description: 'clear sky' };
  const isNight = item.sys.pod === 'n';
  const popPercent = Math.round((item.pop || 0) * 100);
  const dewPoint = Math.round(item.main.temp - (100 - item.main.humidity) / 5);

  const translatedDesc =
    t.descriptions[condition.description.toLowerCase()] || condition.description;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="glass-card modal-container hourly-detail-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div>
            <h3 className="modal-title">{t.hourlyDetailTitle}</h3>
            <span className="modal-subtitle">
              {dayName}, {dateStr} &bull; {hourStr}
            </span>
          </div>
          <button className="modal-close-btn" onClick={onClose} title={t.closeHourlyDetail}>
            <X size={20} />
          </button>
        </div>

        {/* Modal Hero Section */}
        <div className="hourly-modal-hero">
          <div className="hourly-hero-icon">
            <WeatherHeroArt weatherId={condition.id} isNight={isNight} />
          </div>

          <div className="hourly-hero-temps">
            <div className="hourly-temp-main">
              <span className="temp-num">{Math.round(item.main.temp)}</span>
              <span className="temp-deg">{unitSymbol}</span>
            </div>
            <p className="hourly-feels">
              {t.feelsLike} <strong>{Math.round(item.main.feels_like)}°</strong>
            </p>
            <span className="hourly-desc-pill">{translatedDesc}</span>
          </div>
        </div>

        {/* Detailed Grid of Atmospheric Metrics */}
        <div className="hourly-metrics-grid">
          {/* 1. Rain Chance */}
          <div className="hourly-metric-item">
            <div className="item-icon-title">
              <CloudRain size={16} color="#38bdf8" />
              <span>{t.rainChance}</span>
            </div>
            <strong className="item-value">{popPercent}%</strong>
          </div>

          {/* 2. Wind & Gust */}
          <div className="hourly-metric-item">
            <div className="item-icon-title">
              <Wind size={16} color="#38bdf8" />
              <span>{t.wind}</span>
            </div>
            <strong className="item-value">
              {windSpeed} {speedUnit} ({getCardinalDirection(item.wind.deg)})
            </strong>
            {windGust && (
              <span className="item-sub">
                {t.gustSpeed}: {windGust} {speedUnit}
              </span>
            )}
          </div>

          {/* 3. Humidity & Dew point */}
          <div className="hourly-metric-item">
            <div className="item-icon-title">
              <Droplets size={16} color="#38bdf8" />
              <span>{t.humidity}</span>
            </div>
            <strong className="item-value">{item.main.humidity}%</strong>
            <span className="item-sub">
              {t.dewPoint}: {dewPoint}°
            </span>
          </div>

          {/* 4. Pressure */}
          <div className="hourly-metric-item">
            <div className="item-icon-title">
              <Gauge size={16} color="#38bdf8" />
              <span>{t.airPressure}</span>
            </div>
            <strong className="item-value">{item.main.pressure} hPa</strong>
          </div>

          {/* 5. Cloudiness */}
          <div className="hourly-metric-item">
            <div className="item-icon-title">
              <Cloud size={16} color="#38bdf8" />
              <span>{t.cloudCover}</span>
            </div>
            <strong className="item-value">{item.clouds.all}%</strong>
          </div>

          {/* 6. Visibility */}
          <div className="hourly-metric-item">
            <div className="item-icon-title">
              <Eye size={16} color="#38bdf8" />
              <span>{t.visibility}</span>
            </div>
            <strong className="item-value">
              {unit === 'metric'
                ? `${(item.visibility / 1000).toFixed(1)} km`
                : `${(item.visibility * 0.000621371).toFixed(1)} mi`}
            </strong>
          </div>
        </div>

        {/* Modal Footer with Scrub Navigation */}
        <div className="modal-nav-footer">
          <button
            className="modal-nav-btn"
            disabled={currentIndex <= 0}
            onClick={() => onSelectIndex(currentIndex - 1)}
          >
            <ChevronLeft size={16} /> {t.prevHour}
          </button>
          <span className="nav-index-counter">
            {currentIndex + 1} / {items.length}
          </span>
          <button
            className="modal-nav-btn"
            disabled={currentIndex >= items.length - 1}
            onClick={() => onSelectIndex(currentIndex + 1)}
          >
            {t.nextHour} <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

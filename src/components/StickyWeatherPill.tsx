'use client';

import React, { useState, useEffect } from 'react';
import { ArrowUp, ArrowRightLeft, Search } from 'lucide-react';
import { CurrentWeatherResponse, UnitType } from '@/types/weather';
import { Language, getTranslation } from '@/utils/i18n';
import { MiniWeatherIcon } from './WeatherIcons';

interface StickyWeatherPillProps {
  weather: CurrentWeatherResponse | null;
  unit: UnitType;
  lang?: Language;
  onOpenComparison: () => void;
}

export const StickyWeatherPill: React.FC<StickyWeatherPillProps> = ({
  weather,
  unit,
  lang = 'id',
  onOpenComparison,
}) => {
  const t = getTranslation(lang);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 360) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!weather || !isVisible) return null;

  const condition = weather.weather[0];
  const isNight = condition.icon.endsWith('n');
  const unitSymbol = unit === 'metric' ? '°C' : '°F';
  const translatedDesc =
    t.descriptions[condition.description.toLowerCase()] || condition.description;

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const focusSearch = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      document.getElementById('city-input')?.focus();
    }, 300);
  };

  return (
    <div className="sticky-weather-pill-container">
      <div className="glass-card sticky-pill">
        <div className="pill-left" onClick={scrollToTop} title={t.scrollToTop}>
          <MiniWeatherIcon weatherId={condition.id} isNight={isNight} size={22} />
          <div className="pill-text-info">
            <span className="pill-city">
              {weather.name} <strong>{Math.round(weather.main.temp)}{unitSymbol}</strong>
            </span>
            <span className="pill-desc">{translatedDesc}</span>
          </div>
        </div>

        <div className="pill-actions">
          <button className="pill-action-btn" onClick={onOpenComparison} title={t.compareButton}>
            <ArrowRightLeft size={14} />
          </button>
          <button className="pill-action-btn" onClick={focusSearch} title={t.searchPlaceholder}>
            <Search size={14} />
          </button>
          <button className="pill-action-btn scroll-top-btn" onClick={scrollToTop} title={t.scrollToTop}>
            <ArrowUp size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

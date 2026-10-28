'use client';

import React, { useRef, useState, useMemo } from 'react';
import {
  Clock3,
  Droplet,
  ChevronLeft,
  ChevronRight,
  Wind,
  Thermometer,
  Navigation,
} from 'lucide-react';
import { ForecastItem, UnitType } from '@/types/weather';
import { Language, getTranslation } from '@/utils/i18n';
import { MiniWeatherIcon } from './WeatherIcons';
import { getCardinalDirection } from '@/utils/weatherUtils';

interface HourlyForecastProps {
  items: ForecastItem[];
  timezoneOffset: number;
  onSelectHour?: (index: number) => void;
  unit?: UnitType;
  lang?: Language;
}

type HourlyViewMode = 'summary' | 'wind' | 'comfort';

export const HourlyForecast: React.FC<HourlyForecastProps> = ({
  items,
  timezoneOffset,
  onSelectHour,
  unit = 'metric',
  lang = 'id',
}) => {
  const t = getTranslation(lang);
  const scrollTrackRef = useRef<HTMLDivElement | null>(null);
  const [viewMode, setViewMode] = useState<HourlyViewMode>('summary');

  // Show all 24 consecutive 1-hour slots
  const displayItems = useMemo(() => items.slice(0, 24), [items]);

  // Identify peak temperature and peak rain index for micro-markers
  const { maxTempIdx, maxPopIdx } = useMemo(() => {
    let hiTemp = -Infinity;
    let hiTempIdx = -1;
    let hiPop = 0.39; // only highlight rain peak if >= 40%
    let hiPopIdx = -1;

    displayItems.forEach((it, idx) => {
      if (idx > 0 && it.main.temp > hiTemp) {
        hiTemp = it.main.temp;
        hiTempIdx = idx;
      }
      if (idx > 0 && (it.pop || 0) > hiPop) {
        hiPop = it.pop || 0;
        hiPopIdx = idx;
      }
    });

    return { maxTempIdx: hiTempIdx, maxPopIdx: hiPopIdx };
  }, [displayItems]);

  const handleScroll = (dir: 'left' | 'right') => {
    if (!scrollTrackRef.current) return;
    const offset = dir === 'left' ? -320 : 320;
    scrollTrackRef.current.scrollBy({ left: offset, behavior: 'smooth' });
  };

  return (
    <div className="glass-card hourly-card">
      <div className="card-header hourly-header-upgraded">
        <div className="card-title">
          <Clock3 size={20} color="#38bdf8" />
          <div>
            <h3>{t.hourlyTitle}</h3>
            <span className="badge-sub">
              {lang === 'id' ? 'Interval 1 Jam • Klik untuk detail' : '1-Hour Intervals • Click for details'}
            </span>
          </div>
        </div>

        <div className="hourly-controls-right">
          <div className="hourly-mode-pills" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === 'summary'}
              className={`hourly-mode-btn ${viewMode === 'summary' ? 'active' : ''}`}
              onClick={() => setViewMode('summary')}
            >
              {lang === 'id' ? 'Utama' : 'Overview'}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === 'wind'}
              className={`hourly-mode-btn ${viewMode === 'wind' ? 'active' : ''}`}
              onClick={() => setViewMode('wind')}
            >
              <Wind size={11} />
              <span>{lang === 'id' ? 'Angin' : 'Wind'}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === 'comfort'}
              className={`hourly-mode-btn ${viewMode === 'comfort' ? 'active' : ''}`}
              onClick={() => setViewMode('comfort')}
            >
              <Thermometer size={11} />
              <span>{lang === 'id' ? 'Terasa' : 'Comfort'}</span>
            </button>
          </div>

          <div className="hourly-scroll-nav">
            <button
              type="button"
              className="hourly-nav-btn"
              onClick={() => handleScroll('left')}
              aria-label={lang === 'id' ? 'Geser ke kiri' : 'Scroll left'}
              title={lang === 'id' ? 'Geser ke kiri' : 'Scroll left'}
            >
              <ChevronLeft size={15} />
            </button>
            <button
              type="button"
              className="hourly-nav-btn"
              onClick={() => handleScroll('right')}
              aria-label={lang === 'id' ? 'Geser ke kanan' : 'Scroll right'}
              title={lang === 'id' ? 'Geser ke kanan' : 'Scroll right'}
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>

      <div className="hourly-scroll-track" ref={scrollTrackRef}>
        {displayItems.map((item, index) => {
          const date = new Date((item.dt + timezoneOffset) * 1000);
          const hour = date.getUTCHours();
          const timeLabel = index === 0 ? t.now : `${String(hour).padStart(2, '0')}:00`;
          const isMidnight = index > 0 && hour === 0;
          const temp = Math.round(item.main.temp);
          const feelsLike = Math.round(item.main.feels_like);
          const humidity = item.main.humidity;
          const weather = item.weather[0];
          const isNight = weather.icon.endsWith('n');
          const pop = Math.round((item.pop || 0) * 100);
          const windSpeed =
            unit === 'metric'
              ? Math.round((item.wind?.speed || 0) * 3.6)
              : Math.round(item.wind?.speed || 0);
          const windDeg = item.wind?.deg || 0;
          const windCard = getCardinalDirection(windDeg);

          const isPeakTemp = index === maxTempIdx;
          const isPeakRain = index === maxPopIdx && index !== maxTempIdx;

          return (
            <React.Fragment key={item.dt}>
              {isMidnight && (
                <div
                  className="hourly-midnight-divider"
                  title={lang === 'id' ? 'Pergantian Hari (Pukul 00:00)' : 'Midnight Day Boundary'}
                >
                  <span className="midnight-pill">
                    {lang === 'id' ? 'Hari Baru' : 'Next Day'}
                  </span>
                </div>
              )}
              <div
                className={`hourly-capsule ${index === 0 ? 'active-now' : ''} ${isPeakTemp ? 'capsule-peak-temp' : ''} ${isPeakRain ? 'capsule-peak-rain' : ''} clickable-capsule`}
                onClick={() => onSelectHour && onSelectHour(index)}
                title={`${t.clickForDetails} (${timeLabel})`}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectHour && onSelectHour(index);
                  }
                }}
              >
                {isPeakTemp && (
                  <span className="capsule-Tag tag-peak-temp">
                    {lang === 'id' ? 'Puncak' : 'Peak'}
                  </span>
                )}
                {isPeakRain && (
                  <span className="capsule-Tag tag-peak-rain">
                    {lang === 'id' ? 'Hujan' : 'Rain'}
                  </span>
                )}
                <span className="hourly-time">{timeLabel}</span>
                <div className="hourly-icon-wrap">
                  <MiniWeatherIcon weatherId={weather.id} isNight={isNight} size={28} />
                </div>

                {viewMode === 'summary' && (
                  <>
                    {pop > 10 ? (
                      <span className="hourly-pop">
                        <Droplet size={10} />
                        {pop}%
                      </span>
                    ) : (
                      <span className="hourly-sub-placeholder">—</span>
                    )}
                    <span className="hourly-temp">{temp}°</span>
                  </>
                )}

                {viewMode === 'wind' && (
                  <>
                    <span className="hourly-wind-dir" title={`${windDeg}° (${windCard})`}>
                      <Navigation
                        size={11}
                        style={{ transform: `rotate(${windDeg}deg)` }}
                      />
                      {windCard}
                    </span>
                    <span className="hourly-wind-val">
                      {windSpeed}
                      <small>{unit === 'metric' ? 'km/j' : 'mph'}</small>
                    </span>
                  </>
                )}

                {viewMode === 'comfort' && (
                  <>
                    <span className="hourly-humidity-sub">
                      <Droplet size={10} />
                      {humidity}%
                    </span>
                    <span className="hourly-temp" title={lang === 'id' ? 'Suhu Terasa' : 'Feels Like'}>
                      {feelsLike}°
                    </span>
                  </>
                )}
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

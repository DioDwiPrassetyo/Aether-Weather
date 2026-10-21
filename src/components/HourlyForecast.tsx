'use client';

import React from 'react';
import { Clock3, MoveHorizontal, Droplet, Sparkles } from 'lucide-react';
import { ForecastItem } from '@/types/weather';
import { Language, getTranslation } from '@/utils/i18n';
import { MiniWeatherIcon } from './WeatherIcons';

interface HourlyForecastProps {
  items: ForecastItem[];
  timezoneOffset: number;
  onSelectHour?: (index: number) => void;
  lang?: Language;
}

export const HourlyForecast: React.FC<HourlyForecastProps> = ({
  items,
  timezoneOffset,
  onSelectHour,
  lang = 'id',
}) => {
  const t = getTranslation(lang);
  const displayItems = items.slice(0, 10);

  return (
    <div className="glass-card hourly-card">
      <div className="card-header">
        <div className="card-title">
          <Clock3 size={20} color="#38bdf8" />
          <h3>{t.hourlyTitle}</h3>
          <span className="badge-sub">{t.hourlySubtitle}</span>
        </div>
        <span className="scroll-hint" title={t.clickForDetails}>
          <MoveHorizontal size={14} /> {lang === 'id' ? 'Geser & Klik' : 'Scroll & Click'}
        </span>
      </div>

      <div className="hourly-scroll-track">
        {displayItems.map((item, index) => {
          const date = new Date((item.dt + timezoneOffset) * 1000);
          const hour = date.getUTCHours();
          const timeLabel = index === 0 ? t.now : `${String(hour).padStart(2, '0')}:00`;
          const temp = Math.round(item.main.temp);
          const weather = item.weather[0];
          const isNight = weather.icon.endsWith('n');
          const pop = Math.round((item.pop || 0) * 100);

          return (
            <div
              key={item.dt}
              className={`hourly-capsule ${index === 0 ? 'active-now' : ''} clickable-capsule`}
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
              <span className="hourly-time">{timeLabel}</span>
              <div className="hourly-icon-wrap">
                <MiniWeatherIcon weatherId={weather.id} isNight={isNight} size={30} />
              </div>
              {pop > 10 ? (
                <span className="hourly-pop">
                  <Droplet size={10} />
                  {pop}%
                </span>
              ) : (
                <span style={{ height: '14px' }}></span>
              )}
              <span className="hourly-temp">{temp}°</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

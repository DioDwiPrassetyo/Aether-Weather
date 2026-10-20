'use client';

import React from 'react';
import { Clock3, MoveHorizontal, Droplet } from 'lucide-react';
import { ForecastItem } from '@/types/weather';
import { MiniWeatherIcon } from './WeatherIcons';

interface HourlyForecastProps {
  items: ForecastItem[];
  timezoneOffset: number;
}

export const HourlyForecast: React.FC<HourlyForecastProps> = ({ items, timezoneOffset }) => {
  const displayItems = items.slice(0, 10);

  return (
    <div className="glass-card hourly-card">
      <div className="card-header">
        <div className="card-title">
          <Clock3 size={20} color="#38bdf8" />
          <h3>Prakiraan Tiap Jam</h3>
          <span className="badge-sub">24 Jam ke Depan</span>
        </div>
        <span className="scroll-hint">
          <MoveHorizontal size={14} /> Geser
        </span>
      </div>

      <div className="hourly-scroll-track">
        {displayItems.map((item, index) => {
          const date = new Date((item.dt + timezoneOffset) * 1000);
          const hour = date.getUTCHours();
          const timeLabel = index === 0 ? 'Sekarang' : `${String(hour).padStart(2, '0')}:00`;
          const temp = Math.round(item.main.temp);
          const weather = item.weather[0];
          const isNight = weather.icon.endsWith('n');
          const pop = Math.round((item.pop || 0) * 100);

          return (
            <div
              key={item.dt}
              className={`hourly-capsule ${index === 0 ? 'active-now' : ''}`}
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

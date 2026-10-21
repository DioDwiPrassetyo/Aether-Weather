'use client';

import React from 'react';
import { Calendar, Droplet } from 'lucide-react';
import { ForecastItem } from '@/types/weather';
import { Language, getTranslation } from '@/utils/i18n';
import { MiniWeatherIcon } from './WeatherIcons';

interface FiveDayForecastProps {
  items: ForecastItem[];
  lang?: Language;
}

export const FiveDayForecast: React.FC<FiveDayForecastProps> = ({ items, lang = 'id' }) => {
  const t = getTranslation(lang);

  // Group by date
  const dailyGroups: Record<string, ForecastItem[]> = {};
  items.forEach((item) => {
    const dateStr = item.dt_txt.split(' ')[0];
    if (!dailyGroups[dateStr]) dailyGroups[dateStr] = [];
    dailyGroups[dateStr].push(item);
  });

  const dayKeys = Object.keys(dailyGroups).slice(0, 5);

  let weekMin = Infinity;
  let weekMax = -Infinity;

  const processedDays = dayKeys.map((dateStr, idx) => {
    const dayItems = dailyGroups[dateStr];
    let min = Infinity;
    let max = -Infinity;
    let maxPop = 0;
    const weatherCount: Record<number, number> = {};

    dayItems.forEach((it) => {
      if (it.main.temp_min < min) min = it.main.temp_min;
      if (it.main.temp_max > max) max = it.main.temp_max;
      if (it.pop > maxPop) maxPop = it.pop;
      const id = it.weather[0].id;
      weatherCount[id] = (weatherCount[id] || 0) + 1;
    });

    let dominantId = 800;
    let maxCount = 0;
    for (const [wId, cnt] of Object.entries(weatherCount)) {
      if (cnt > maxCount) {
        maxCount = cnt;
        dominantId = Number(wId);
      }
    }

    const representativeItem =
      dayItems.find((it) => it.weather[0].id === dominantId) || dayItems[0];

    min = Math.round(min);
    max = Math.round(max);
    if (min < weekMin) weekMin = min;
    if (max > weekMax) weekMax = max;

    const dateObj = new Date(dateStr + 'T00:00:00');
    const dayLabel =
      idx === 0
        ? t.today
        : idx === 1
        ? lang === 'id'
          ? 'Besok'
          : 'Tomorrow'
        : t.days[dateObj.getDay()];
    const dateFormatted = `${dateObj.getDate()} ${t.months[dateObj.getMonth()]}`;

    return {
      dayLabel,
      dateFormatted,
      min,
      max,
      pop: Math.round(maxPop * 100),
      weather: representativeItem.weather[0],
    };
  });

  const tempRangeSpan = Math.max(1, weekMax - weekMin);

  return (
    <section className="section-forecast-5day">
      <div className="glass-card forecast-5day-card">
        <div className="card-header">
          <div className="card-title">
            <Calendar size={20} color="#38bdf8" />
            <h3>{t.extendedForecastTitle}</h3>
            <span className="badge-sub">{lang === 'id' ? 'Analisis Suhu & Presipitasi Mingguan' : 'Weekly Temperature & Precipitation'}</span>
          </div>
        </div>

        <div className="forecast-list">
          {processedDays.map((day, idx) => {
            const leftPercent = Math.max(0, ((day.min - weekMin) / tempRangeSpan) * 100);
            const widthPercent = Math.max(8, ((day.max - day.min) / tempRangeSpan) * 100);
            const translatedDesc =
              t.descriptions[day.weather.description.toLowerCase()] || day.weather.description;

            return (
              <div key={idx} className="forecast-row">
                <div className="row-col-day">
                  <span className="row-day-name">{day.dayLabel}</span>
                  <span className="row-date">{day.dateFormatted}</span>
                </div>
                <div className="row-icon-wrap">
                  <MiniWeatherIcon weatherId={day.weather.id} isNight={false} size={28} />
                </div>
                <div className="row-desc">
                  {translatedDesc}
                  {day.pop > 15 && (
                    <span className="row-pop-badge">
                      <Droplet size={11} />
                      {day.pop}%
                    </span>
                  )}
                </div>
                <div className="row-temp-bar-container">
                  <span className="temp-min-label">{day.min}°</span>
                  <div className="temp-bar-track">
                    <div
                      className="temp-bar-fill"
                      style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}
                    ></div>
                  </div>
                  <span className="temp-max-label">{day.max}°</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

'use client';

import React, { useState } from 'react';
import {
  Calendar,
  Droplet,
  Wind,
  ChevronDown,
  ChevronUp,
  Thermometer,
  Gauge,
} from 'lucide-react';
import { ForecastItem, UnitType } from '@/types/weather';
import { Language, getTranslation } from '@/utils/i18n';
import { MiniWeatherIcon } from './WeatherIcons';
import { getEffectiveCityDate, getCardinalDirection } from '@/utils/weatherUtils';

interface FiveDayForecastProps {
  items: ForecastItem[];
  timezoneOffset?: number;
  currentTemp?: number;
  unit?: UnitType;
  lang?: Language;
}

export const FiveDayForecast: React.FC<FiveDayForecastProps> = ({
  items,
  timezoneOffset = 0,
  currentTemp,
  unit = 'metric',
  lang = 'id',
}) => {
  const t = getTranslation(lang);
  const [expandedDate, setExpandedDate] = useState<string | null>(null);

  // Real-time current date in target city
  const cityNow = getEffectiveCityDate(timezoneOffset);
  const todayYear = cityNow.getUTCFullYear();
  const todayMonth = cityNow.getUTCMonth();
  const todayDate = cityNow.getUTCDate();
  const todayDateStr = `${todayYear}-${String(todayMonth + 1).padStart(2, '0')}-${String(
    todayDate
  ).padStart(2, '0')}`;

  // Group items by LOCAL DATE in city timezone (NOT raw UTC dt_txt)
  const dailyGroups: Record<string, ForecastItem[]> = {};
  items.forEach((item) => {
    const itemCity = new Date((item.dt + timezoneOffset) * 1000);
    const itemYear = itemCity.getUTCFullYear();
    const itemMonth = itemCity.getUTCMonth();
    const itemDate = itemCity.getUTCDate();
    const dateStr = `${itemYear}-${String(itemMonth + 1).padStart(2, '0')}-${String(
      itemDate
    ).padStart(2, '0')}`;

    // Discard any past days that have already passed before today
    if (dateStr < todayDateStr) {
      return;
    }

    if (!dailyGroups[dateStr]) dailyGroups[dateStr] = [];
    dailyGroups[dateStr].push(item);
  });

  // Sort dates chronologically and take up to 5 upcoming days
  const dayKeys = Object.keys(dailyGroups).sort().slice(0, 5);

  // If fewer than 5 days remain in forecast, extrapolate subsequent days
  if (dayKeys.length > 0 && dayKeys.length < 5) {
    const lastDateStr = dayKeys[dayKeys.length - 1];
    const lastDate = new Date(`${lastDateStr}T00:00:00Z`);
    const lastItems = dailyGroups[lastDateStr] || [];

    while (dayKeys.length < 5) {
      lastDate.setUTCDate(lastDate.getUTCDate() + 1);
      const nextDateStr = `${lastDate.getUTCFullYear()}-${String(
        lastDate.getUTCMonth() + 1
      ).padStart(2, '0')}-${String(lastDate.getUTCDate()).padStart(2, '0')}`;

      dailyGroups[nextDateStr] = lastItems.map((it) => ({
        ...it,
        dt: it.dt + 86400 * (dayKeys.length - Object.keys(dailyGroups).indexOf(lastDateStr)),
      }));
      dayKeys.push(nextDateStr);
    }
  }

  let weekMin = Infinity;
  let weekMax = -Infinity;

  const processedDays = dayKeys.map((dateStr) => {
    const dayItems = dailyGroups[dateStr] || [];
    let min = Infinity;
    let max = -Infinity;
    let maxPop = 0;
    let maxWind = 0;
    let sumHumidity = 0;
    let sumPressure = 0;
    const weatherCount: Record<number, number> = {};

    dayItems.forEach((it) => {
      if (it.main.temp_min < min) min = it.main.temp_min;
      if (it.main.temp_max > max) max = it.main.temp_max;
      if (it.pop > maxPop) maxPop = it.pop;
      if ((it.wind?.speed || 0) > maxWind) maxWind = it.wind?.speed || 0;
      sumHumidity += it.main.humidity || 0;
      sumPressure += it.main.pressure || 1013;
      const id = it.weather[0]?.id || 800;
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
      dayItems.find((it) => it.weather[0]?.id === dominantId) || dayItems[0] || items[0];

    min = Number.isFinite(min) ? Math.round(min) : 24;
    max = Number.isFinite(max) ? Math.round(max) : 32;
    if (min < weekMin) weekMin = min;
    if (max > weekMax) weekMax = max;

    const avgHumidity =
      dayItems.length > 0 ? Math.round(sumHumidity / dayItems.length) : 70;
    const avgPressure =
      dayItems.length > 0 ? Math.round(sumPressure / dayItems.length) : 1013;
    const maxWindDisplay =
      unit === 'metric' ? Math.round(maxWind * 3.6) : Math.round(maxWind);

    // Calculate calendar day difference relative to real-time today in the city
    const targetD = new Date(`${dateStr}T00:00:00Z`);
    const todayD = new Date(`${todayDateStr}T00:00:00Z`);
    const diffDays = Math.round((targetD.getTime() - todayD.getTime()) / (86400 * 1000));

    let dayLabel = '';
    if (diffDays === 0) {
      dayLabel = t.today; // "Hari ini"
    } else if (diffDays === 1) {
      dayLabel = lang === 'id' ? 'Besok' : 'Tomorrow';
    } else {
      dayLabel = t.days[targetD.getUTCDay()];
    }

    const dateFormatted = `${targetD.getUTCDate()} ${t.months[targetD.getUTCMonth()]}`;

    return {
      dateStr,
      isToday: diffDays === 0,
      dayLabel,
      dateFormatted,
      min,
      max,
      pop: Math.round(maxPop * 100),
      avgHumidity,
      avgPressure,
      maxWindDisplay,
      dayItems,
      weather: representativeItem?.weather[0] || {
        id: 800,
        main: 'Clear',
        description: 'clear sky',
        icon: '01d',
      },
    };
  });

  const tempRangeSpan = Math.max(1, weekMax - weekMin);
  const speedUnit = unit === 'metric' ? 'km/j' : 'mph';

  return (
    <section className="section-forecast-5day">
      <div className="glass-card forecast-5day-card">
        <div className="card-header">
          <div className="card-title">
            <Calendar size={20} color="#38bdf8" />
            <div>
              <h3>{t.extendedForecastTitle}</h3>
              <span className="badge-sub">
                {lang === 'id'
                  ? 'Real-Time 5 Hari ke Depan • Klik baris hari untuk rincian per 3 jam'
                  : 'Real-Time 5-Day Outlook • Click any day row for 3-hour breakdown'}
              </span>
            </div>
          </div>
        </div>

        <div className="forecast-list">
          {processedDays.map((day, idx) => {
            const leftPercent = Math.max(0, ((day.min - weekMin) / tempRangeSpan) * 100);
            const widthPercent = Math.max(8, ((day.max - day.min) / tempRangeSpan) * 100);
            const translatedDesc =
              t.descriptions[day.weather.description.toLowerCase()] || day.weather.description;
            const isExpanded = expandedDate === day.dateStr;

            // Current temp dot position for Today's row
            const showCurrentDot =
              day.isToday && currentTemp !== undefined && Number.isFinite(currentTemp);
            const currentDotPercent = showCurrentDot
              ? Math.max(
                  0,
                  Math.min(100, (((currentTemp as number) - weekMin) / tempRangeSpan) * 100)
                )
              : null;

            return (
              <div
                key={day.dateStr || idx}
                className={`forecast-day-group ${isExpanded ? 'day-expanded' : ''}`}
              >
                <div
                  className="forecast-row forecast-row-interactive"
                  onClick={() =>
                    setExpandedDate((prev) => (prev === day.dateStr ? null : day.dateStr))
                  }
                  role="button"
                  tabIndex={0}
                  aria-expanded={isExpanded}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setExpandedDate((prev) => (prev === day.dateStr ? null : day.dateStr));
                    }
                  }}
                >
                  <div className="row-col-day">
                    <span className="row-day-name">{day.dayLabel}</span>
                    <span className="row-date">{day.dateFormatted}</span>
                  </div>
                  <div className="row-icon-wrap">
                    <MiniWeatherIcon weatherId={day.weather.id} isNight={false} size={28} />
                  </div>
                  <div className="row-desc">
                    <span className="row-desc-text">{translatedDesc}</span>
                    <div className="row-inline-badges">
                      {day.pop > 15 && (
                        <span className="row-pop-badge" title={lang === 'id' ? 'Peluang Hujan' : 'Rain Probability'}>
                          <Droplet size={11} />
                          {day.pop}%
                        </span>
                      )}
                      <span className="row-meta-chip" title={lang === 'id' ? 'Angin Maksimum' : 'Max Wind'}>
                        <Wind size={11} />
                        {day.maxWindDisplay} {speedUnit}
                      </span>
                    </div>
                  </div>
                  <div className="row-temp-bar-container">
                    <span className="temp-min-label">{day.min}°</span>
                    <div className="temp-bar-track">
                      <div
                        className="temp-bar-fill"
                        style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}
                      ></div>
                      {currentDotPercent !== null && (
                        <span
                          className="temp-current-dot"
                          style={{ left: `${currentDotPercent}%` }}
                          title={`${lang === 'id' ? 'Suhu Saat Ini' : 'Current Temp'}: ${Math.round(currentTemp as number)}°`}
                        />
                      )}
                    </div>
                    <span className="temp-max-label">{day.max}°</span>
                  </div>
                  <div className="row-expand-icon">
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </div>

                {/* Expandable 3-Hour Intraday Breakdown */}
                {isExpanded && (
                  <div className="forecast-day-drawer">
                    <div className="day-drawer-summary">
                      <div className="day-summary-pill">
                        <Thermometer size={13} color="#38bdf8" />
                        <span>
                          {lang === 'id' ? 'Rentang Suhu:' : 'Temp Range:'}{' '}
                          <strong>
                            {day.min}° – {day.max}°
                          </strong>
                        </span>
                      </div>
                      <div className="day-summary-pill">
                        <Droplet size={13} color="#60a5fa" />
                        <span>
                          {lang === 'id' ? 'Kelembapan Rata-Rata:' : 'Avg Humidity:'}{' '}
                          <strong>{day.avgHumidity}%</strong>
                        </span>
                      </div>
                      <div className="day-summary-pill">
                        <Wind size={13} color="#34d399" />
                        <span>
                          {lang === 'id' ? 'Angin Puncak:' : 'Peak Wind:'}{' '}
                          <strong>
                            {day.maxWindDisplay} {speedUnit}
                          </strong>
                        </span>
                      </div>
                      <div className="day-summary-pill">
                        <Gauge size={13} color="#a78bfa" />
                        <span>
                          {lang === 'id' ? 'Tekanan:' : 'Pressure:'}{' '}
                          <strong>{day.avgPressure} hPa</strong>
                        </span>
                      </div>
                    </div>

                    <div className="day-slots-grid">
                      {day.dayItems.map((slot) => {
                        const slotDate = new Date((slot.dt + timezoneOffset) * 1000);
                        const slotHour = `${String(slotDate.getUTCHours()).padStart(2, '0')}:00`;
                        const slotIsNight = slot.weather[0]?.icon?.endsWith('n');
                        const slotPop = Math.round((slot.pop || 0) * 100);
                        const slotWind =
                          unit === 'metric'
                            ? Math.round((slot.wind?.speed || 0) * 3.6)
                            : Math.round(slot.wind?.speed || 0);
                        const slotDir = getCardinalDirection(slot.wind?.deg);

                        return (
                          <div key={slot.dt} className="day-slot-card">
                            <span className="slot-time">{slotHour}</span>
                            <MiniWeatherIcon
                              weatherId={slot.weather[0]?.id || 800}
                              isNight={slotIsNight}
                              size={22}
                            />
                            <span className="slot-temp">{Math.round(slot.main.temp)}°</span>
                            <span className="slot-feels">
                              {lang === 'id' ? 'Terasa' : 'Feels'} {Math.round(slot.main.feels_like)}°
                            </span>
                            <div className="slot-bottom-meta">
                              <span className={`slot-pop ${slotPop >= 40 ? 'high-pop' : ''}`}>
                                <Droplet size={10} /> {slotPop}%
                              </span>
                              <span className="slot-wind">
                                {slotWind} {speedUnit} ({slotDir})
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

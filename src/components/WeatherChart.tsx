'use client';

import React, { useState, useRef } from 'react';
import { TrendingUp, Droplets, Wind, Sparkles } from 'lucide-react';
import { ForecastItem, UnitType } from '@/types/weather';
import { Language, getTranslation } from '@/utils/i18n';
import { MiniWeatherIcon } from './WeatherIcons';

interface WeatherChartProps {
  items: ForecastItem[];
  timezoneOffset: number;
  unit: UnitType;
  lang?: Language;
}

export const WeatherChart: React.FC<WeatherChartProps> = ({
  items,
  timezoneOffset,
  unit,
  lang = 'id',
}) => {
  const t = getTranslation(lang);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Take next 8 slots (24 hours) or 12 slots (36 hours)
  const chartSlots = items.slice(0, 10);
  if (chartSlots.length < 2) return null;

  const temps = chartSlots.map((it) => Math.round(it.main.temp));
  const minTemp = Math.min(...temps);
  const maxTemp = Math.max(...temps);
  const tempRange = Math.max(1, maxTemp - minTemp);

  // SVG Chart Geometry
  const width = 800;
  const height = 240;
  const paddingX = 40;
  const paddingTop = 36;
  const paddingBottom = 45;
  const usableHeight = height - paddingTop - paddingBottom;
  const usableWidth = width - paddingX * 2;
  const stepX = usableWidth / (chartSlots.length - 1);

  // Calculate coordinates for points
  const points = chartSlots.map((item, index) => {
    const x = paddingX + index * stepX;
    const itemTemp = Math.round(item.main.temp);
    // Inverted Y: higher temp = lower Y
    const y = paddingTop + usableHeight - ((itemTemp - minTemp) / tempRange) * usableHeight;
    const pop = Math.round((item.pop || 0) * 100);
    const date = new Date((item.dt + timezoneOffset) * 1000);
    const hour = date.getUTCHours();
    const timeLabel = index === 0 ? t.now : `${String(hour).padStart(2, '0')}:00`;

    return { x, y, temp: itemTemp, pop, timeLabel, item };
  });

  // Construct smooth cubic Bezier path
  let pathD = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const cpX1 = p0.x + (p1.x - p0.x) / 2;
    const cpY1 = p0.y;
    const cpX2 = p0.x + (p1.x - p0.x) / 2;
    const cpY2 = p1.y;
    pathD += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
  }

  // Area fill path closing down to bottom
  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - paddingBottom} L ${points[0].x} ${height - paddingBottom} Z`;

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * width;
    let closestIdx = 0;
    let minDiff = Infinity;
    points.forEach((pt, idx) => {
      const diff = Math.abs(pt.x - mouseX);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = idx;
      }
    });
    setHoverIndex(closestIdx);
  };

  const handleTouchMove = (e: React.TouchEvent<SVGSVGElement>) => {
    if (!e.touches[0]) return;
    const touch = e.touches[0];
    const rect = e.currentTarget.getBoundingClientRect();
    const touchX = ((touch.clientX - rect.left) / rect.width) * width;
    let closestIdx = 0;
    let minDiff = Infinity;
    points.forEach((pt, idx) => {
      const diff = Math.abs(pt.x - touchX);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = idx;
      }
    });
    setHoverIndex(closestIdx);
  };

  const handleMouseLeave = () => {
    setHoverIndex(null);
  };

  const activePoint = hoverIndex !== null ? points[hoverIndex] : null;

  return (
    <div className="glass-card weather-chart-card" ref={containerRef}>
      <div className="card-header">
        <div className="card-title">
          <TrendingUp size={20} color="#38bdf8" />
          <h3>{t.chartTitle}</h3>
          <span className="badge-sub">{lang === 'id' ? '24 Jam ke Depan' : 'Next 24 Hours'}</span>
        </div>

        {activePoint && (
          <div className="chart-active-pill">
            <span className="chart-pill-time">{activePoint.timeLabel}</span>
            <span className="chart-pill-temp">{activePoint.temp}°</span>
            <span className="chart-pill-pop">
              <Droplets size={12} color="#7dd3fc" /> {activePoint.pop}%
            </span>
          </div>
        )}
      </div>

      <div className="chart-svg-container">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="chart-svg"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleMouseLeave}
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.45" />
              <stop offset="50%" stopColor="#0ea5e9" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0.0" />
            </linearGradient>

            <linearGradient id="popBarGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7dd3fc" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0.2" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line
            x1={paddingX}
            y1={paddingTop}
            x2={width - paddingX}
            y2={paddingTop}
            stroke="rgba(255, 255, 255, 0.08)"
            strokeDasharray="4 4"
          />
          <line
            x1={paddingX}
            y1={height - paddingBottom}
            x2={width - paddingX}
            y2={height - paddingBottom}
            stroke="rgba(255, 255, 255, 0.14)"
          />

          {/* Precipitation bars at the base */}
          {points.map((pt, idx) => {
            const barHeight = Math.max(0, (pt.pop / 100) * 36);
            const barWidth = 14;
            return (
              <g key={`bar-${idx}`}>
                <rect
                  x={pt.x - barWidth / 2}
                  y={height - paddingBottom - barHeight}
                  width={barWidth}
                  height={barHeight}
                  rx="3"
                  fill="url(#popBarGradient)"
                />
              </g>
            );
          })}

          {/* Area Fill */}
          <path d={areaD} fill="url(#chartGradient)" />

          {/* Temperature Curve Line */}
          <path
            d={pathD}
            fill="none"
            stroke="#38bdf8"
            strokeWidth="3.5"
            strokeLinecap="round"
          />

          {/* Data points & labels */}
          {points.map((pt, idx) => (
            <g key={`pt-${idx}`}>
              {/* Temperature text above point */}
              <text
                x={pt.x}
                y={pt.y - 12}
                textAnchor="middle"
                className="chart-temp-label"
              >
                {pt.temp}°
              </text>

              {/* Dot */}
              <circle
                cx={pt.x}
                cy={pt.y}
                r={hoverIndex === idx ? 6.5 : 4}
                className={`chart-dot ${hoverIndex === idx ? 'active' : ''}`}
              />

              {/* Time label below */}
              <text
                x={pt.x}
                y={height - paddingBottom + 24}
                textAnchor="middle"
                className="chart-time-label"
              >
                {pt.timeLabel}
              </text>

              {/* Rain chance below time */}
              {pt.pop > 10 && (
                <text
                  x={pt.x}
                  y={height - paddingBottom + 38}
                  textAnchor="middle"
                  className="chart-pop-label"
                >
                  💧{pt.pop}%
                </text>
              )}
            </g>
          ))}

          {/* Hover Crosshair Vertical Line */}
          {activePoint && (
            <line
              x1={activePoint.x}
              y1={paddingTop - 10}
              x2={activePoint.x}
              y2={height - paddingBottom}
              stroke="rgba(255, 255, 255, 0.45)"
              strokeDasharray="3 3"
              strokeWidth="1.5"
            />
          )}
        </svg>
      </div>
    </div>
  );
};

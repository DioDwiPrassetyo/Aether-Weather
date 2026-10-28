'use client';

import React, { useState, useRef, useMemo } from 'react';
import {
  TrendingUp,
  Droplets,
  Wind,
  Thermometer,
  CloudRain,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { ForecastItem, UnitType } from '@/types/weather';
import { Language, getTranslation } from '@/utils/i18n';
import { MiniWeatherIcon } from './WeatherIcons';
import { I18N, getCardinalDirection } from '@/utils/weatherUtils';

interface WeatherChartProps {
  items: ForecastItem[];
  timezoneOffset: number;
  unit: UnitType;
  lang?: Language;
}

type ChartMetricMode = 'temp' | 'rain' | 'wind';

interface ChartPoint {
  index: number;
  x: number;
  yTemp: number;
  yFeels: number;
  yRain: number;
  yWind: number;
  temp: number;
  feelsLike: number;
  pop: number; // 0 - 100
  rainAmount: number; // mm in 3h
  windSpeed: number; // in km/h or mph
  windGust: number | null;
  windDeg: number;
  humidity: number;
  weatherId: number;
  weatherDesc: string;
  isNight: boolean;
  timeLabel: string;
  dayLabel: string;
  isMaxTemp: boolean;
  isMinTemp: boolean;
  item: ForecastItem;
}

export const WeatherChart: React.FC<WeatherChartProps> = ({
  items,
  timezoneOffset,
  unit,
  lang = 'id',
}) => {
  const t = getTranslation(lang);
  const [metricMode, setMetricMode] = useState<ChartMetricMode>('temp');
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const unitSymbol = unit === 'metric' ? '°C' : '°F';
  const speedUnit = unit === 'metric' ? (lang === 'id' ? 'km/j' : 'km/h') : 'mph';

  // 24 slots = 24 consecutive 1-hour forecast slots
  const chartSlots = useMemo(() => items.slice(0, 24), [items]);

  // Geometry dimensions (optimized aspect ratio for dashboard column & mobile)
  const width = 560;
  const height = 240;
  const paddingX = 34;
  const paddingTop = 44;
  const paddingBottom = 56;
  const usableHeight = height - paddingTop - paddingBottom;
  const curveBottomPad = 26;
  const curveHeight = usableHeight - curveBottomPad;
  const usableWidth = width - paddingX * 2;
  const stepX = chartSlots.length > 1 ? usableWidth / (chartSlots.length - 1) : usableWidth;

  // Compute points and high/low stats
  const { points, stats } = useMemo(() => {
    if (chartSlots.length < 2) return { points: [], stats: null };

    const temps = chartSlots.map((it) => Math.round(it.main.temp));
    const feelsList = chartSlots.map((it) => Math.round(it.main.feels_like));
    const allTemps = [...temps, ...feelsList];
    const minTemp = Math.min(...allTemps);
    const maxTemp = Math.max(...allTemps);
    const tempRange = Math.max(2, maxTemp - minTemp);

    // Wind speed conversion
    const winds = chartSlots.map((it) =>
      unit === 'metric' ? Math.round(it.wind.speed * 3.6) : Math.round(it.wind.speed)
    );
    const maxWind = Math.max(10, ...winds);

    // Rain pops
    const pops = chartSlots.map((it) => Math.round((it.pop || 0) * 100));
    const maxPop = Math.max(...pops);

    // Identify peak and trough temperature indices
    let maxTempIdx = 0;
    let minTempIdx = 0;
    temps.forEach((val, idx) => {
      if (val > temps[maxTempIdx]) maxTempIdx = idx;
      if (val < temps[minTempIdx]) minTempIdx = idx;
    });

    const calculatedPoints: ChartPoint[] = chartSlots.map((item, index) => {
      const x = paddingX + index * stepX;
      const itemTemp = Math.round(item.main.temp);
      const itemFeels = Math.round(item.main.feels_like);

      // Inverted Y: higher value = smaller Y (keep curveBottomPad above baseline for ▼ Min badge & area fill)
      const yTemp = paddingTop + curveHeight - ((itemTemp - minTemp) / tempRange) * curveHeight;
      const yFeels = paddingTop + curveHeight - ((itemFeels - minTemp) / tempRange) * curveHeight;

      // Rain bar baseline
      const popVal = Math.round((item.pop || 0) * 100);
      const yRain = paddingTop + 16 + (usableHeight - 16) - (popVal / 100) * (usableHeight - 16);

      // Wind curve (leave space below for compass arrows)
      const windVal =
        unit === 'metric' ? Math.round(item.wind.speed * 3.6) : Math.round(item.wind.speed);
      const windGustVal = item.wind.gust
        ? unit === 'metric'
          ? Math.round(item.wind.gust * 3.6)
          : Math.round(item.wind.gust)
        : null;
      const yWind = paddingTop + curveHeight - (windVal / maxWind) * (curveHeight - 12);

      const date = new Date((item.dt + timezoneOffset) * 1000);
      const hour = date.getUTCHours();
      const timeLabel = index === 0 ? t.now : `${String(hour).padStart(2, '0')}:00`;

      // Day label for cross-midnight display
      const nowUtc = new Date((chartSlots[0].dt + timezoneOffset) * 1000);
      const isTomorrow = date.getUTCDate() !== nowUtc.getUTCDate();
      const dayLabel = isTomorrow
        ? lang === 'id'
          ? 'Besok'
          : 'Tomorrow'
        : lang === 'id'
          ? 'Hari ini'
          : 'Today';

      const weather = item.weather[0] || { id: 800, main: 'Clear', description: 'clear sky', icon: '01d' };
      const isNight = weather.icon?.endsWith('n') || (hour < 6 || hour >= 18);
      const weatherDesc =
        lang === 'id' ? I18N.translate(weather.description) : weather.description;
      const rainAmount = item.rain?.['3h'] || 0;

      return {
        index,
        x,
        yTemp,
        yFeels,
        yRain,
        yWind,
        temp: itemTemp,
        feelsLike: itemFeels,
        pop: popVal,
        rainAmount,
        windSpeed: windVal,
        windGust: windGustVal,
        windDeg: item.wind.deg || 0,
        humidity: item.main.humidity,
        weatherId: weather.id,
        weatherDesc,
        isNight,
        timeLabel,
        dayLabel,
        isMaxTemp: index === maxTempIdx,
        isMinTemp: index === minTempIdx,
        item,
      };
    });

    const avgTemp = Math.round(temps.reduce((a, b) => a + b, 0) / temps.length);

    return {
      points: calculatedPoints,
      stats: {
        peakTemp: temps[maxTempIdx],
        peakTime: calculatedPoints[maxTempIdx]?.timeLabel,
        lowestTemp: temps[minTempIdx],
        lowestTime: calculatedPoints[minTempIdx]?.timeLabel,
        avgTemp,
        maxPop,
        maxPopTime: calculatedPoints[pops.indexOf(maxPop)]?.timeLabel,
        maxWind,
      },
    };
  }, [chartSlots, stepX, paddingX, paddingTop, usableHeight, curveHeight, timezoneOffset, t.now, lang, unit]);

  if (chartSlots.length < 2 || !stats) return null;

  // Cubic Bezier curve path helper
  const getSmoothPath = (pts: { x: number; y: number }[]) => {
    if (pts.length < 2) return '';
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i];
      const p1 = pts[i + 1];
      const mx = (p0.x + p1.x) / 2;
      d += ` C ${mx} ${p0.y}, ${mx} ${p1.y}, ${p1.x} ${p1.y}`;
    }
    return d;
  };

  // Temperature primary curve & area
  const tempPathD = getSmoothPath(points.map((p) => ({ x: p.x, y: p.yTemp })));
  const tempAreaD = `${tempPathD} L ${points[points.length - 1].x} ${height - paddingBottom} L ${points[0].x} ${height - paddingBottom} Z`;

  // Feels-like secondary curve
  const feelsPathD = getSmoothPath(points.map((p) => ({ x: p.x, y: p.yFeels })));

  // Wind speed curve & area
  const windPathD = getSmoothPath(points.map((p) => ({ x: p.x, y: p.yWind })));
  const windAreaD = `${windPathD} L ${points[points.length - 1].x} ${height - paddingBottom} L ${points[0].x} ${height - paddingBottom} Z`;

  // Rain probability spline
  const rainPathD = getSmoothPath(points.map((p) => ({ x: p.x, y: p.yRain })));

  // Pointer interaction
  const handlePointerMove = (clientX: number) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const relativeX = ((clientX - rect.left) / rect.width) * width;

    let closestIdx = 0;
    let minDistance = Infinity;
    points.forEach((pt, idx) => {
      const distance = Math.abs(pt.x - relativeX);
      if (distance < minDistance) {
        minDistance = distance;
        closestIdx = idx;
      }
    });
    setHoverIndex(closestIdx);
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    handlePointerMove(e.clientX);
  };

  const handleTouchMove = (e: React.TouchEvent<SVGSVGElement>) => {
    if (e.touches[0]) {
      handlePointerMove(e.touches[0].clientX);
    }
  };

  const handleMouseLeave = () => {
    setHoverIndex(null);
  };

  const activePoint = hoverIndex !== null ? points[hoverIndex] : null;

  return (
    <div className="glass-card weather-chart-card">
      {/* Header with Title and Mode Switcher */}
      <div className="card-header chart-header-row">
        <div className="card-title">
          <div className="chart-title-icon-wrap">
            <TrendingUp size={20} color="#38bdf8" />
          </div>
          <div>
            <h3>{t.chartTitle}</h3>
            <span className="badge-sub">
              {lang === 'id' ? 'Prakiraan Ritme Atmosfer 24 Jam' : '24-Hour Atmospheric Rhythm'}
            </span>
          </div>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="chart-mode-pill-group" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={metricMode === 'temp'}
            className={`chart-mode-btn ${metricMode === 'temp' ? 'active' : ''}`}
            onClick={() => setMetricMode('temp')}
          >
            <Thermometer size={13} />
            <span>{t.chartTempMode}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={metricMode === 'rain'}
            className={`chart-mode-btn ${metricMode === 'rain' ? 'active' : ''}`}
            onClick={() => setMetricMode('rain')}
          >
            <CloudRain size={13} />
            <span>{t.chartRainMode}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={metricMode === 'wind'}
            className={`chart-mode-btn ${metricMode === 'wind' ? 'active' : ''}`}
            onClick={() => setMetricMode('wind')}
          >
            <Wind size={13} />
            <span>{t.chartWindMode}</span>
          </button>
        </div>
      </div>

      {/* 24-Hour Highlights Ribbon */}
      <div className="chart-summary-ribbon">
        <div className="chart-stat-chip chip-peak">
          <span className="chip-label">
            <ArrowUp size={12} color="#f59e0b" /> {t.chartPeak}
          </span>
          <span className="chip-value">
            {stats.peakTemp}° <small>{stats.peakTime}</small>
          </span>
        </div>

        <div className="chart-stat-chip chip-lowest">
          <span className="chip-label">
            <ArrowDown size={12} color="#38bdf8" /> {t.chartLowest}
          </span>
          <span className="chip-value">
            {stats.lowestTemp}° <small>{stats.lowestTime}</small>
          </span>
        </div>

        <div className="chart-stat-chip chip-avg">
          <span className="chip-label">
            <Thermometer size={12} color="#818cf8" /> {t.chartAverage}
          </span>
          <span className="chip-value">{stats.avgTemp}°</span>
        </div>

        <div className="chart-stat-chip chip-rain">
          <span className="chip-label">
            <Droplets size={12} color="#60a5fa" /> {lang === 'id' ? 'Max Hujan' : 'Max Rain'}
          </span>
          <span className="chip-value">
            {stats.maxPop}% <small>{stats.maxPopTime}</small>
          </span>
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div className="chart-svg-container">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="chart-svg"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleMouseLeave}
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {/* Luminous Glow Filter */}
            <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Area Fill Gradient - Temperature */}
            <linearGradient id="chartTempGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.45" />
              <stop offset="45%" stopColor="#0ea5e9" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0.01" />
            </linearGradient>

            {/* Area Fill Gradient - Wind */}
            <linearGradient id="chartWindGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
              <stop offset="60%" stopColor="#059669" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#047857" stopOpacity="0.0" />
            </linearGradient>

            {/* Rain Bar Gradient */}
            <linearGradient id="chartRainBarGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.85" />
              <stop offset="60%" stopColor="#38bdf8" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0.2" />
            </linearGradient>

            {/* Rain High Bar Gradient */}
            <linearGradient id="chartRainHighGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a855f7" stopOpacity="0.9" />
              <stop offset="60%" stopColor="#38bdf8" stopOpacity="0.65" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0.25" />
            </linearGradient>
          </defs>

          {/* Dotted Reference Gridlines */}
          <line
            x1={paddingX}
            y1={paddingTop}
            x2={width - paddingX}
            y2={paddingTop}
            stroke="rgba(255, 255, 255, 0.07)"
            strokeDasharray="4 6"
          />
          <line
            x1={paddingX}
            y1={paddingTop + usableHeight / 2}
            x2={width - paddingX}
            y2={paddingTop + usableHeight / 2}
            stroke="rgba(255, 255, 255, 0.05)"
            strokeDasharray="4 6"
          />
          <line
            x1={paddingX}
            y1={height - paddingBottom}
            x2={width - paddingX}
            y2={height - paddingBottom}
            stroke="rgba(255, 255, 255, 0.12)"
          />

          {/* MODE: RAIN PRECIPITATION */}
          {metricMode === 'rain' && (
            <>
              {/* Rain Bars at each time slot */}
              {points.map((pt, idx) => {
                const barHeight = Math.max(0, (pt.pop / 100) * (usableHeight - 16));
                const barWidth = Math.max(7, Math.min(16, (usableWidth / points.length) * 0.64));
                const isHovered = hoverIndex === idx;
                const isHigh = pt.pop >= 60;
                const isNearHover =
                  hoverIndex !== null && !isHovered && Math.abs(idx - hoverIndex) <= 1;
                const showRainLabel = isHovered || (idx % 3 === 0 && !isNearHover);

                return (
                  <g key={`rain-bar-${idx}`}>
                    {/* Background Bar Slot */}
                    <rect
                      x={pt.x - barWidth / 2}
                      y={paddingTop + 16}
                      width={barWidth}
                      height={usableHeight - 16}
                      rx="4"
                      fill="rgba(255, 255, 255, 0.02)"
                    />
                    {/* Filled Bar */}
                    <rect
                      x={pt.x - barWidth / 2}
                      y={height - paddingBottom - barHeight}
                      width={barWidth}
                      height={barHeight}
                      rx="4"
                      fill={isHigh ? 'url(#chartRainHighGradient)' : 'url(#chartRainBarGradient)'}
                      filter={isHovered ? 'url(#neonGlow)' : undefined}
                      opacity={isHovered ? 1 : 0.85}
                    />
                    {/* Percentage on top of bar */}
                    {showRainLabel && (
                      <text
                        x={pt.x}
                        y={height - paddingBottom - barHeight - 7}
                        textAnchor="middle"
                        className={`chart-val-text ${isHigh ? 'chart-val-high' : ''}`}
                      >
                        {pt.pop}%
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Rain Probability Guide Line */}
              <path
                d={rainPathD}
                fill="none"
                stroke="#60a5fa"
                strokeWidth="2"
                strokeDasharray="3 3"
                opacity="0.6"
              />
            </>
          )}

          {/* MODE: WIND SPEED & DIRECTION */}
          {metricMode === 'wind' && (
            <>
              {/* Area fill */}
              <path d={windAreaD} fill="url(#chartWindGradient)" />

              {/* Wind curve */}
              <path
                d={windPathD}
                fill="none"
                stroke="#10b981"
                strokeWidth="3"
                strokeLinecap="round"
                filter="url(#neonGlow)"
              />

              {/* Data points & Direction arrows */}
              {points.map((pt, idx) => {
                const isHovered = hoverIndex === idx;
                const isNearHover =
                  hoverIndex !== null && !isHovered && Math.abs(idx - hoverIndex) <= 2;
                const showWindDetail =
                  isHovered ||
                  ((idx % 4 === 0 || idx === points.length - 1) && !isNearHover);

                return (
                  <g key={`wind-pt-${idx}`}>
                    {/* Wind speed text */}
                    {showWindDetail && (
                      <text
                        x={pt.x}
                        y={pt.yWind - 10}
                        textAnchor="middle"
                        className="chart-val-text"
                      >
                        {pt.windSpeed}
                        <tspan fontSize="9.5" fill="rgba(255,255,255,0.65)">
                          {' '}{speedUnit}
                        </tspan>
                      </text>
                    )}

                    {/* Dot */}
                    <circle
                      cx={pt.x}
                      cy={pt.yWind}
                      r={isHovered ? 6 : showWindDetail ? 4 : 2.2}
                      fill="#10b981"
                      stroke="#ffffff"
                      strokeWidth={isHovered || showWindDetail ? '1.8' : '1'}
                    />

                    {/* Cardinal Direction with rotating arrow */}
                    {showWindDetail && (
                      <g transform={`translate(${pt.x}, ${height - paddingBottom - 13})`}>
                        <circle
                          r="9"
                          fill="rgba(16, 185, 129, 0.15)"
                          stroke="rgba(16, 185, 129, 0.35)"
                          strokeWidth="1"
                        />
                        <g transform={`rotate(${pt.windDeg})`}>
                          <line
                            x1="0"
                            y1="5"
                            x2="0"
                            y2="-5"
                            stroke="#34d399"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                          />
                          <polyline
                            points="-2.5,-1.5 0,-5 2.5,-1.5"
                            fill="none"
                            stroke="#34d399"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                          />
                        </g>
                      </g>
                    )}
                  </g>
                );
              })}
            </>
          )}

          {/* MODE: TEMPERATURE & FEELS LIKE */}
          {metricMode === 'temp' && (
            <>
              {/* Temperature Area Fill */}
              <path d={tempAreaD} fill="url(#chartTempGradient)" />

              {/* Secondary Feels Like Curve (dashed warm rose) */}
              <path
                d={feelsPathD}
                fill="none"
                stroke="#fb7185"
                strokeWidth="2"
                strokeDasharray="5 4"
                strokeLinecap="round"
                opacity="0.85"
              />

              {/* Primary Actual Temperature Curve (solid glowing cyan) */}
              <path
                d={tempPathD}
                fill="none"
                stroke="#38bdf8"
                strokeWidth="3.2"
                strokeLinecap="round"
                filter="url(#neonGlow)"
              />

              {/* Data points, labels, and badges */}
              {points.map((pt, idx) => {
                const isHovered = hoverIndex === idx;
                const isNearHover =
                  hoverIndex !== null && !isHovered && Math.abs(idx - hoverIndex) <= 1;
                const isNearExtreme = points.some(
                  (p) =>
                    p.index !== idx &&
                    (p.isMaxTemp || p.isMinTemp) &&
                    Math.abs(p.index - idx) <= 1
                );
                const showTempLabel =
                  isHovered ||
                  ((pt.isMaxTemp || pt.isMinTemp) && !isNearHover) ||
                  (idx % 3 === 0 && !isNearHover && !isNearExtreme);
                const badgeX = Math.max(30, Math.min(width - 30, pt.x));

                return (
                  <g key={`temp-pt-${idx}`}>
                    {/* Peak / High Badge */}
                    {pt.isMaxTemp && (
                      <g transform={`translate(${badgeX}, ${pt.yTemp - 27})`}>
                        <rect
                          x="-25"
                          y="-9"
                          width="50"
                          height="17"
                          rx="8.5"
                          fill="rgba(245, 158, 11, 0.25)"
                          stroke="#f59e0b"
                          strokeWidth="1.2"
                        />
                        <text
                          x="0"
                          y="3"
                          textAnchor="middle"
                          fill="#fef08a"
                          fontSize="9.5"
                          fontWeight="700"
                        >
                          ▲ {lang === 'id' ? 'Maks' : 'Max'}
                        </text>
                      </g>
                    )}

                    {/* Lowest / Min Badge (kept above baseline so it never overlaps X-axis icons) */}
                    {pt.isMinTemp && (
                      <g transform={`translate(${badgeX}, ${pt.yTemp + 16})`}>
                        <rect
                          x="-23"
                          y="-9"
                          width="46"
                          height="17"
                          rx="8.5"
                          fill="rgba(56, 189, 248, 0.25)"
                          stroke="#38bdf8"
                          strokeWidth="1.2"
                        />
                        <text
                          x="0"
                          y="3"
                          textAnchor="middle"
                          fill="#bae6fd"
                          fontSize="9.5"
                          fontWeight="700"
                        >
                          ▼ Min
                        </text>
                      </g>
                    )}

                    {/* Actual Temperature Label */}
                    {showTempLabel && (
                      <text
                        x={pt.x}
                        y={pt.yTemp - 10}
                        textAnchor="middle"
                        className={`chart-temp-label ${isHovered ? 'active' : ''}`}
                      >
                        {pt.temp}°
                      </text>
                    )}

                    {/* Dot on Primary Line */}
                    <circle
                      cx={pt.x}
                      cy={pt.yTemp}
                      r={isHovered ? 6 : pt.isMaxTemp || pt.isMinTemp || idx % 3 === 0 ? 3.6 : 2.2}
                      className={`chart-dot ${isHovered ? 'active' : ''}`}
                    />

                    {/* Dot on Feels Like Line */}
                    <circle
                      cx={pt.x}
                      cy={pt.yFeels}
                      r={isHovered ? 4 : idx % 3 === 0 ? 2.2 : 1.5}
                      fill="#fb7185"
                      opacity="0.9"
                    />
                  </g>
                );
              })}
            </>
          )}

          {/* Time Labels & Weather Condition Glyphs along Bottom Axis */}
          {points.map((pt, idx) => {
            const isHovered = hoverIndex === idx;
            const isBaseTick = idx === 0 || idx % 4 === 0 || idx === points.length - 1;
            const isNearHover =
              hoverIndex !== null && !isHovered && Math.abs(idx - hoverIndex) <= 2;
            const showAxisItem = isHovered || (isBaseTick && !isNearHover);

            return (
              <g key={`axis-col-${idx}`}>
                {/* Weather Icon Embedded inside foreignObject */}
                {showAxisItem && (
                  <foreignObject
                    x={pt.x - 11}
                    y={height - paddingBottom + 6}
                    width="22"
                    height="22"
                    className="chart-weather-glyph"
                  >
                    <div className="chart-glyph-wrap" title={pt.weatherDesc}>
                      <MiniWeatherIcon weatherId={pt.weatherId} isNight={pt.isNight} size={17} />
                    </div>
                  </foreignObject>
                )}

                {/* Time Label */}
                {showAxisItem && (
                  <text
                    x={pt.x}
                    y={height - paddingBottom + 42}
                    textAnchor="middle"
                    className={`chart-time-label ${isHovered ? 'active' : ''} ${
                      idx === 0 ? 'label-now' : ''
                    }`}
                  >
                    {pt.timeLabel}
                  </text>
                )}
              </g>
            );
          })}

          {/* Laser Crosshair Line & Active Halo on Hover */}
          {activePoint && (
            <g className="chart-hover-laser">
              {/* Vertical Laser Guideline */}
              <line
                x1={activePoint.x}
                y1={paddingTop - 12}
                x2={activePoint.x}
                y2={height - paddingBottom + 5}
                stroke="rgba(56, 189, 248, 0.55)"
                strokeDasharray="3 3"
                strokeWidth="1.5"
              />

              {/* Pulsing Target Halo */}
              <circle
                cx={activePoint.x}
                cy={
                  metricMode === 'temp'
                    ? activePoint.yTemp
                    : metricMode === 'wind'
                      ? activePoint.yWind
                      : activePoint.yRain
                }
                r="10"
                fill="none"
                stroke="#38bdf8"
                strokeWidth="1.8"
                opacity="0.8"
                className="chart-pulse-ring"
              />
            </g>
          )}
        </svg>

        {/* Floating HUD Tooltip card (docked opposite to active point to prevent clipping & occlusion) */}
        {activePoint && (
          <div
            className={`chart-floating-hud ${
              activePoint.index < points.length / 2 ? 'hud-dock-right' : 'hud-dock-left'
            }`}
          >
            <div className="hud-header">
              <span className="hud-time">{activePoint.timeLabel}</span>
              <span className="hud-day">{activePoint.dayLabel}</span>
            </div>

            <div className="hud-condition">
              <MiniWeatherIcon weatherId={activePoint.weatherId} isNight={activePoint.isNight} size={16} />
              <span className="hud-desc">{activePoint.weatherDesc}</span>
            </div>

            <div className="hud-grid">
              <div className="hud-item">
                <span className="hud-item-label">{t.tempTrend}:</span>
                <span className="hud-item-val hud-val-temp">
                  {activePoint.temp}{unitSymbol}
                </span>
              </div>
              <div className="hud-item">
                <span className="hud-item-label">{t.chartFeelsLike}:</span>
                <span className="hud-item-val hud-val-feels">
                  {activePoint.feelsLike}{unitSymbol}
                </span>
              </div>
              <div className="hud-item">
                <span className="hud-item-label">{t.rainChance}:</span>
                <span className="hud-item-val hud-val-rain">{activePoint.pop}%</span>
              </div>
              <div className="hud-item">
                <span className="hud-item-label">{t.windAndDirection}:</span>
                <span className="hud-item-val hud-val-wind">
                  {activePoint.windSpeed} {speedUnit} ({getCardinalDirection(activePoint.windDeg)})
                </span>
              </div>
              <div className="hud-item">
                <span className="hud-item-label">{lang === 'id' ? 'Kelembapan' : 'Humidity'}:</span>
                <span className="hud-item-val">{activePoint.humidity}%</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Dynamic Legend at the Card Footer */}
      <div className="chart-legend-row">
        {metricMode === 'temp' && (
          <>
            <div className="legend-chip">
              <span className="legend-dot legend-dot-temp"></span>
              <span>{t.tempTrend} ({unitSymbol})</span>
            </div>
            <div className="legend-chip">
              <span className="legend-dash"></span>
              <span>{t.chartFeelsLike} ({unitSymbol})</span>
            </div>
          </>
        )}
        {metricMode === 'rain' && (
          <div className="legend-chip">
            <span className="legend-bar-sample"></span>
            <span>{lang === 'id' ? 'Probabilitas Curah Hujan (%)' : 'Rain Probability (%)'}</span>
          </div>
        )}
        {metricMode === 'wind' && (
          <div className="legend-chip">
            <span className="legend-dot legend-dot-wind"></span>
            <span>{lang === 'id' ? 'Kecepatan & Arah Angin' : 'Wind Speed & Heading'}</span>
          </div>
        )}

        <span className="chart-touch-hint">
          <span>{t.chartSubtitle}</span>
        </span>
      </div>
    </div>
  );
};

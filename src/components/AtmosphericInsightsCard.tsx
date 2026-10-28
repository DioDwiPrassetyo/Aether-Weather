'use client';

import React, { useState, useMemo } from 'react';
import {
  Activity,
  Cloud,
  Thermometer,
  Droplets,
  Zap,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Navigation,
} from 'lucide-react';
import {
  CurrentWeatherResponse,
  ForecastItem,
  UnitType,
} from '@/types/weather';
import { Language } from '@/utils/i18n';

interface AtmosphericInsightsCardProps {
  current: CurrentWeatherResponse;
  hourlyItems: ForecastItem[];
  unit: UnitType;
  lang?: Language;
  onSelectHour?: (index: number) => void;
}

export const AtmosphericInsightsCard: React.FC<AtmosphericInsightsCardProps> = ({
  current,
  hourlyItems,
  unit,
  lang = 'id',
  onSelectHour,
}) => {
  const [hoveredSlotIdx, setHoveredSlotIdx] = useState<number | null>(null);

  const slots = useMemo(() => hourlyItems.slice(0, 24), [hourlyItems]);

  // 1. Meteorological Physics Calculations
  const tempC =
    unit === 'metric' ? current.main.temp : ((current.main.temp - 32) * 5) / 9;
  const rh = Math.max(1, Math.min(100, current.main.humidity));

  // Magnus-Tetens Dew Point formula (°C)
  const alpha = (17.27 * tempC) / (237.7 + tempC) + Math.log(rh / 100);
  const dewPointC = (237.7 * alpha) / (17.27 - alpha);

  // Espy's LCL (Lifting Condensation Level / Cloud Base Altitude in meters)
  const cloudBaseMeters = Math.max(80, Math.round(125 * Math.max(0.5, tempC - dewPointC)));
  const cloudBaseDisplay =
    unit === 'metric'
      ? `${cloudBaseMeters.toLocaleString()} m`
      : `${Math.round(cloudBaseMeters * 3.28084).toLocaleString()} ft`;

  // Stull's Empirical Wet-Bulb Temperature Formula (°C)
  const wetBulbC =
    tempC * Math.atan(0.151977 * Math.pow(rh + 8.313659, 0.5)) +
    Math.atan(tempC + rh) -
    Math.atan(rh - 1.676331) +
    0.00391838 * Math.pow(rh, 1.5) * Math.atan(0.023101 * rh) -
    4.686035;
  const wetBulbDisplay =
    unit === 'metric'
      ? `${wetBulbC.toFixed(1)}°C`
      : `${((wetBulbC * 9) / 5 + 32).toFixed(1)}°F`;

  // Saturation Vapor Pressure (es) & Vapor Pressure Deficit (VPD in kPa)
  const es = 0.61078 * Math.exp((17.27 * tempC) / (tempC + 237.3));
  const ea = es * (rh / 100);
  const vpdKpa = Math.max(0, es - ea);

  // Convective Storm Potential Index (0 - 100%)
  const maxUpcomingPop = useMemo(
    () => Math.max(0, ...slots.slice(0, 12).map((s) => s.pop || 0)),
    [slots]
  );
  const hasThunderCode = useMemo(
    () =>
      (current.weather[0]?.id >= 200 && current.weather[0]?.id < 300) ||
      slots.slice(0, 12).some((s) => {
        const id = s.weather[0]?.id || 800;
        return id >= 200 && id < 300;
      }),
    [current, slots]
  );

  let convectiveIndex = 15;
  if (tempC >= 27 && rh >= 70) convectiveIndex += 25;
  if (current.main.pressure < 1009) convectiveIndex += (1009 - current.main.pressure) * 4;
  convectiveIndex += maxUpcomingPop * 35;
  if (hasThunderCode) convectiveIndex = Math.max(convectiveIndex, 85);
  convectiveIndex = Math.max(8, Math.min(98, Math.round(convectiveIndex)));

  // 2. Scan 24h Slots for Optimal Activity Windows
  const windows = useMemo(() => {
    if (slots.length === 0) return null;

    const formatHour = (dt: number) => {
      const d = new Date((dt + current.timezone) * 1000);
      return `${String(d.getUTCHours()).padStart(2, '0')}:00`;
    };

    // A. Best 3-Hour Daytime Window (06:00 - 18:00)
    let bestStartIdx = 0;
    let bestScore = -Infinity;
    for (let i = 0; i < Math.max(1, slots.length - 2); i++) {
      const d = new Date((slots[i].dt + current.timezone) * 1000);
      const hr = d.getUTCHours();
      if (hr < 6 || hr > 17) continue;

      const slice = slots.slice(i, i + 3);
      const avgPop = slice.reduce((a, b) => a + (b.pop || 0), 0) / slice.length;
      const avgTempC =
        slice.reduce(
          (a, b) =>
            a + (unit === 'metric' ? b.main.temp : ((b.main.temp - 32) * 5) / 9),
          0
        ) / slice.length;
      const score = 100 - avgPop * 80 - Math.abs(avgTempC - 24) * 3.2;
      if (score > bestScore) {
        bestScore = score;
        bestStartIdx = i;
      }
    }

    const endOutdoorIdx = Math.min(slots.length - 1, bestStartIdx + 2);
    const outdoorWindowStr = `${formatHour(slots[bestStartIdx].dt)} – ${formatHour(
      slots[endOutdoorIdx].dt + 3600
    )}`;

    // B. Longest Dry Commute Streak (pop < 35%)
    let curRunStart = -1;
    let curRunLen = 0;
    let maxRunStart = 0;
    let maxRunLen = 0;

    slots.forEach((s, idx) => {
      const id = s.weather[0]?.id || 800;
      const isDry = (s.pop || 0) < 0.35 && !(id >= 200 && id < 600);
      if (isDry) {
        if (curRunStart === -1) curRunStart = idx;
        curRunLen++;
        if (curRunLen > maxRunLen) {
          maxRunLen = curRunLen;
          maxRunStart = curRunStart;
        }
      } else {
        curRunStart = -1;
        curRunLen = 0;
      }
    });

    const dryWindowStr =
      maxRunLen >= 2
        ? `${formatHour(slots[maxRunStart].dt)} – ${formatHour(
            slots[Math.min(slots.length - 1, maxRunStart + maxRunLen - 1)].dt + 3600
          )} (${maxRunLen} ${lang === 'id' ? 'jam' : 'hrs'})`
        : lang === 'id'
          ? 'Sedia payung sepanjang hari'
          : 'Keep rain gear ready all day';

    // C. Peak Rain / Storm Watch Hour
    let peakRainIdx = -1;
    let peakPopVal = 0.25;
    slots.forEach((s, idx) => {
      if ((s.pop || 0) > peakPopVal) {
        peakPopVal = s.pop || 0;
        peakRainIdx = idx;
      }
    });

    const rainWatchStr =
      peakRainIdx >= 0
        ? `${lang === 'id' ? 'Pukul' : 'At'} ${formatHour(slots[peakRainIdx].dt)} (${Math.round(
            peakPopVal * 100
          )}%)`
        : lang === 'id'
          ? 'Nihil (<25% selama 24 jam)'
          : 'None (<25% for next 24h)';

    return {
      outdoorWindowStr,
      dryWindowStr,
      rainWatchStr,
      hasRainRisk: peakRainIdx >= 0,
    };
  }, [slots, current.timezone, unit, lang]);

  const activeSlot = hoveredSlotIdx !== null ? slots[hoveredSlotIdx] : slots[0];

  return (
    <div className="glass-card atmospheric-insights-card">
      <div className="card-header">
        <div className="card-title">
          <Activity size={20} color="#38bdf8" />
          <div>
            <h3>
              {lang === 'id'
                ? 'Intelijen Atmosfer & Jendela Waktu 24 Jam'
                : 'Atmospheric Intelligence & 24H Windows'}
            </h3>
            <span className="badge-sub">
              {lang === 'id'
                ? 'Telemetri Fisika Udara & Rekomendasi Waktu Aktivitas'
                : 'Air Physics Telemetry & Optimal Scheduling Windows'}
            </span>
          </div>
        </div>
      </div>

      {/* 1. Interactive 24-Hour Weather Matrix Bar */}
      {slots.length > 0 && (
        <div className="atmo-timeline-section">
          <div className="atmo-timeline-header">
            <span className="atmo-timeline-label">
              {lang === 'id' ? 'Peta Kondisi 24 Jam ke Depan' : '24-Hour Condition Matrix'}
            </span>
            {activeSlot && (
              <span className="atmo-timeline-readout">
                <strong>
                  {(() => {
                    const d = new Date((activeSlot.dt + current.timezone) * 1000);
                    return `${String(d.getUTCHours()).padStart(2, '0')}:00`;
                  })()}
                </strong>{' '}
                • {Math.round(activeSlot.main.temp)}° •{' '}
                {lang === 'id' ? 'Hujan' : 'Rain'} {Math.round((activeSlot.pop || 0) * 100)}%
              </span>
            )}
          </div>

          <div
            className="atmo-matrix-bar"
            onMouseLeave={() => setHoveredSlotIdx(null)}
          >
            {slots.map((slot, idx) => {
              const id = slot.weather[0]?.id || 800;
              const pop = slot.pop || 0;
              let statusClass = 'slot-clear';
              if (id >= 200 && id < 300) statusClass = 'slot-thunder';
              else if ((id >= 300 && id < 600) || pop >= 0.55) statusClass = 'slot-rain';
              else if (id >= 803 || pop >= 0.3) statusClass = 'slot-cloudy';

              const d = new Date((slot.dt + current.timezone) * 1000);
              const hrStr = `${String(d.getUTCHours()).padStart(2, '0')}:00`;

              return (
                <button
                  key={slot.dt}
                  type="button"
                  className={`atmo-matrix-cell ${statusClass} ${hoveredSlotIdx === idx ? 'cell-active' : ''}`}
                  onMouseEnter={() => setHoveredSlotIdx(idx)}
                  onFocus={() => setHoveredSlotIdx(idx)}
                  onClick={() => onSelectHour && onSelectHour(idx)}
                  title={`${hrStr} • ${Math.round(slot.main.temp)}° • ${Math.round(pop * 100)}%`}
                  aria-label={`${hrStr}`}
                />
              );
            })}
          </div>

          <div className="atmo-matrix-legend">
            <span className="matrix-legend-item">
              <i className="matrix-dot slot-clear" />
              {lang === 'id' ? 'Optimal / Cerah' : 'Clear / Optimal'}
            </span>
            <span className="matrix-legend-item">
              <i className="matrix-dot slot-cloudy" />
              {lang === 'id' ? 'Berawan' : 'Cloudy'}
            </span>
            <span className="matrix-legend-item">
              <i className="matrix-dot slot-rain" />
              {lang === 'id' ? 'Berpotensi Hujan' : 'Rain Likely'}
            </span>
            <span className="matrix-legend-item">
              <i className="matrix-dot slot-thunder" />
              {lang === 'id' ? 'Badai Petir' : 'Thunderstorm'}
            </span>
          </div>
        </div>
      )}

      {/* 2. Optimal Activity Windows */}
      {windows && (
        <div className="atmo-windows-grid">
          <div className="atmo-window-card">
            <div className="window-icon-wrap win-optimal">
              <CheckCircle2 size={15} />
            </div>
            <div className="window-info">
              <span className="window-label">
                {lang === 'id' ? 'Waktu Luar Ruang Terbaik' : 'Best Outdoor Window'}
              </span>
              <strong className="window-val">{windows.outdoorWindowStr}</strong>
            </div>
          </div>

          <div className="atmo-window-card">
            <div className="window-icon-wrap win-commute">
              <Navigation size={15} />
            </div>
            <div className="window-info">
              <span className="window-label">
                {lang === 'id' ? 'Rentang Cuaca Kering' : 'Longest Dry Streak'}
              </span>
              <strong className="window-val">{windows.dryWindowStr}</strong>
            </div>
          </div>

          <div className="atmo-window-card">
            <div
              className={`window-icon-wrap ${windows.hasRainRisk ? 'win-caution' : 'win-optimal'}`}
            >
              {windows.hasRainRisk ? <AlertTriangle size={15} /> : <Clock size={15} />}
            </div>
            <div className="window-info">
              <span className="window-label">
                {lang === 'id' ? 'Puncak Risiko Hujan' : 'Peak Rain Watch'}
              </span>
              <strong className="window-val">{windows.rainWatchStr}</strong>
            </div>
          </div>
        </div>
      )}

      {/* 3. Precision Atmospheric Physics 4-Card Grid */}
      <div className="atmo-physics-grid">
        <div className="atmo-physics-item">
          <div className="physics-top">
            <span className="physics-label">
              <Cloud size={13} color="#38bdf8" />
              {lang === 'id' ? 'Tinggi Dasar Awan (LCL)' : 'Cloud Base (LCL)'}
            </span>
            <span className="physics-tag">
              {cloudBaseMeters < 600
                ? lang === 'id'
                  ? 'Rendah'
                  : 'Low'
                : cloudBaseMeters <= 1500
                  ? lang === 'id'
                    ? 'Menengah'
                    : 'Mid'
                  : lang === 'id'
                    ? 'Tinggi'
                    : 'High'}
            </span>
          </div>
          <div className="physics-val">{cloudBaseDisplay}</div>
          <p className="physics-desc">
            {lang === 'id'
              ? 'Estimasi ketinggian kondensasi uap air menjadi awan.'
              : 'Estimated altitude where rising air condenses into clouds.'}
          </p>
        </div>

        <div className="atmo-physics-item">
          <div className="physics-top">
            <span className="physics-label">
              <Thermometer size={13} color="#f59e0b" />
              {lang === 'id' ? 'Suhu Bola Basah' : 'Wet-Bulb Temp'}
            </span>
            <span className="physics-tag">
              {wetBulbC >= 28
                ? lang === 'id'
                  ? 'Ekstrem'
                  : 'Extreme'
                : wetBulbC >= 24
                  ? lang === 'id'
                    ? 'Hangat'
                    : 'Warm'
                  : lang === 'id'
                    ? 'Aman'
                    : 'Safe'}
            </span>
          </div>
          <div className="physics-val">{wetBulbDisplay}</div>
          <p className="physics-desc">
            {lang === 'id'
              ? 'Batas suhu terendah pendinginan alami melalui penguapan.'
              : 'Lowest temperature reachable via evaporative cooling.'}
          </p>
        </div>

        <div className="atmo-physics-item">
          <div className="physics-top">
            <span className="physics-label">
              <Droplets size={13} color="#34d399" />
              {lang === 'id' ? 'Defisit Uap (VPD)' : 'Vapor Deficit (VPD)'}
            </span>
            <span className="physics-tag">
              {vpdKpa < 0.4
                ? lang === 'id'
                  ? 'Lembap Jenuh'
                  : 'Humid'
                : vpdKpa <= 1.4
                  ? 'Ideal'
                  : lang === 'id'
                    ? 'Kering'
                    : 'Arid'}
            </span>
          </div>
          <div className="physics-val">{vpdKpa.toFixed(2)} kPa</div>
          <p className="physics-desc">
            {lang === 'id'
              ? 'Daya serap uap atmosfer untuk transpirasi tanaman & pengeringan.'
              : 'Atmospheric drying power & plant transpiration rate.'}
          </p>
        </div>

        <div className="atmo-physics-item">
          <div className="physics-top">
            <span className="physics-label">
              <Zap size={13} color="#facc15" />
              {lang === 'id' ? 'Potensi Konvektif' : 'Convective Potential'}
            </span>
            <span className="physics-tag">
              {convectiveIndex >= 65
                ? lang === 'id'
                  ? 'Aktif'
                  : 'High'
                : convectiveIndex >= 38
                  ? lang === 'id'
                    ? 'Sedang'
                    : 'Moderate'
                  : lang === 'id'
                    ? 'Stabil'
                    : 'Stable'}
            </span>
          </div>
          <div className="physics-val">{convectiveIndex}%</div>
          <p className="physics-desc">
            {lang === 'id'
              ? 'Indeks ketidakstabilan termal pembentuk awan cumulonimbus.'
              : 'Thermal instability index for storm cloud development.'}
          </p>
        </div>
      </div>
    </div>
  );
};


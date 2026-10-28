'use client';

import React, { useState } from 'react';
import {
  Moon,
  Camera,
  Sunrise,
  Sunset,
  Telescope,
  Eye,
  Compass,
  Waves,
  ArrowUpRight,
  ArrowDownRight,
  RotateCcw,
} from 'lucide-react';
import { getMoonPhase, getGoldenHourInfo, MoonPhaseKey } from '@/utils/astronomyUtils';
import { Language, getTranslation } from '@/utils/i18n';

interface AstronomyCardProps {
  sunrise: number;
  sunset: number;
  timezone: number;
  lang?: Language;
}

const LUNAR_CYCLE_PHASES: {
  key: MoonPhaseKey;
  norm: number;
  illum: number;
  age: number;
}[] = [
  { key: 'new_moon', norm: 0.0, illum: 0, age: 0.0 },
  { key: 'waxing_crescent', norm: 0.125, illum: 15, age: 3.7 },
  { key: 'first_quarter', norm: 0.25, illum: 50, age: 7.4 },
  { key: 'waxing_gibbous', norm: 0.375, illum: 85, age: 11.1 },
  { key: 'full_moon', norm: 0.5, illum: 100, age: 14.8 },
  { key: 'waning_gibbous', norm: 0.625, illum: 85, age: 18.5 },
  { key: 'last_quarter', norm: 0.75, illum: 50, age: 22.1 },
  { key: 'waning_crescent', norm: 0.875, illum: 15, age: 25.8 },
];

function computeTerminatorPath(p: number, cx: number, cy: number, r: number): string {
  const isWaxing = p < 0.5;
  const factor = Math.cos(p * 2 * Math.PI);
  const rx = Math.max(0.1, Math.abs(factor) * r);

  if (p < 0.02 || p >= 0.98) {
    return '';
  }
  if (p >= 0.48 && p <= 0.52) {
    return `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx} ${cy + r} A ${r} ${r} 0 1 1 ${cx} ${cy - r}`;
  }
  if (isWaxing) {
    if (factor < 0) {
      return `M ${cx} ${cy - r} A ${r} ${r} 0 0 1 ${cx} ${cy + r} A ${rx} ${r} 0 0 1 ${cx} ${cy - r}`;
    }
    return `M ${cx} ${cy - r} A ${r} ${r} 0 0 1 ${cx} ${cy + r} A ${rx} ${r} 0 0 0 ${cx} ${cy - r}`;
  } else {
    if (factor < 0) {
      return `M ${cx} ${cy - r} A ${r} ${r} 0 0 0 ${cx} ${cy + r} A ${rx} ${r} 0 0 0 ${cx} ${cy - r}`;
    }
    return `M ${cx} ${cy - r} A ${r} ${r} 0 0 0 ${cx} ${cy + r} A ${rx} ${r} 0 0 1 ${cx} ${cy - r}`;
  }
}

export const AstronomyCard: React.FC<AstronomyCardProps> = ({
  sunrise,
  sunset,
  timezone,
  lang = 'id',
}) => {
  const t = getTranslation(lang);
  const liveMoon = getMoonPhase();
  const goldenHour = getGoldenHourInfo(sunrise, sunset, timezone);

  const [previewPhaseKey, setPreviewPhaseKey] = useState<MoonPhaseKey | null>(null);

  const previewPreset = previewPhaseKey
    ? LUNAR_CYCLE_PHASES.find((item) => item.key === previewPhaseKey) || null
    : null;

  const activePhaseKey = previewPreset ? previewPreset.key : liveMoon.key;
  const activeNorm = previewPreset ? previewPreset.norm : liveMoon.phaseNormalized;
  const activeIllum = previewPreset ? previewPreset.illum : liveMoon.illuminationPct;
  const activeAge = previewPreset ? previewPreset.age : liveMoon.ageDays;
  const activePhaseAngle = Math.round(activeNorm * 360);
  const activeIsWaxing = activeNorm <= 0.5;

  const phaseTitle = t.moonPhases[activePhaseKey] || activePhaseKey;

  // Render clean vector mini-moon for the 8-phase strip
  const renderMiniMoonSvg = (norm: number, idSuffix: string) => {
    const cx = 12;
    const cy = 12;
    const r = 9.5;
    const pathD = computeTerminatorPath(norm, cx, cy, r);
    return (
      <svg viewBox="0 0 24 24" width="22" height="22" className="mini-lunar-svg">
        <defs>
          <clipPath id={`miniClip-${idSuffix}`}>
            <circle cx={cx} cy={cy} r={r} />
          </clipPath>
        </defs>
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="#0f172a"
          stroke="rgba(148, 163, 184, 0.35)"
          strokeWidth="1"
        />
        {pathD && (
          <path
            d={pathD}
            fill="#e2e8f0"
            clipPath={`url(#miniClip-${idSuffix})`}
          />
        )}
      </svg>
    );
  };

  // Render photorealistic 3D SVG lunar disc with orbital degree ring & lunar topography
  const renderMoonSvg = () => {
    const p = activeNorm;
    const r = 36;
    const orbitR = 45;
    const cx = 54;
    const cy = 54;

    const pathD = computeTerminatorPath(p, cx, cy, r);

    // Orbital marker position around the outer ring (-90 deg = top = New Moon)
    const orbitRad = ((p * 360 - 90) * Math.PI) / 180;
    const orbX = (cx + orbitR * Math.cos(orbitRad)).toFixed(1);
    const orbY = (cy + orbitR * Math.sin(orbitRad)).toFixed(1);

    return (
      <svg className="moon-visual-svg" viewBox="0 0 108 108" width="110" height="110">
        <defs>
          {/* Outer Lunar Corona / Halo */}
          <radialGradient id="lunarHalo" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(226, 232, 240, 0.28)" />
            <stop offset="55%" stopColor="rgba(56, 189, 248, 0.1)" />
            <stop offset="100%" stopColor="rgba(15, 23, 42, 0)" />
          </radialGradient>

          {/* Unlit Dark Lunar Surface with Subtle Earthshine */}
          <radialGradient id="moonDarkBase" cx="38%" cy="38%" r="65%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="65%" stopColor="#0f172a" />
            <stop offset="100%" stopColor="#060a12" />
          </radialGradient>

          {/* Lit Lunar Surface Texture */}
          <radialGradient id="moonLitSurface" cx="38%" cy="34%" r="68%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="40%" stopColor="#f1f5f9" />
            <stop offset="78%" stopColor="#cbd5e1" />
            <stop offset="100%" stopColor="#94a3b8" />
          </radialGradient>

          {/* 3D Spherical Volume Overlay (Limb darkening) */}
          <radialGradient id="sphereLimbShading" cx="38%" cy="34%" r="62%">
            <stop offset="0%" stopColor="rgba(255, 255, 255, 0.14)" />
            <stop offset="62%" stopColor="rgba(0, 0, 0, 0)" />
            <stop offset="90%" stopColor="rgba(0, 0, 0, 0.42)" />
            <stop offset="100%" stopColor="rgba(0, 0, 0, 0.82)" />
          </radialGradient>

          <clipPath id="moonFullDiscClip">
            <circle cx={cx} cy={cy} r={r} />
          </clipPath>

          {pathD && (
            <clipPath id="moonIllumClip">
              <path d={pathD} />
            </clipPath>
          )}
        </defs>

        {/* Outer Lunar Corona */}
        <circle cx={cx} cy={cy} r={r + 10} fill="url(#lunarHalo)" />

        {/* Orbital Telemetry Ring & Cardinal Ticks */}
        <circle
          cx={cx}
          cy={cy}
          r={orbitR}
          fill="none"
          stroke="rgba(148, 163, 184, 0.18)"
          strokeWidth="1"
          strokeDasharray="2 3"
        />
        <line x1={cx} y1={cy - orbitR - 2} x2={cx} y2={cy - orbitR + 2} stroke="rgba(148,163,184,0.45)" strokeWidth="1" />
        <line x1={cx + orbitR - 2} y1={cy} x2={cx + orbitR + 2} y2={cy} stroke="rgba(148,163,184,0.45)" strokeWidth="1" />
        <line x1={cx} y1={cy + orbitR - 2} x2={cx} y2={cy + orbitR + 2} stroke="rgba(148,163,184,0.45)" strokeWidth="1" />
        <line x1={cx - orbitR - 2} y1={cy} x2={cx - orbitR + 2} y2={cy} stroke="rgba(148,163,184,0.45)" strokeWidth="1" />

        {/* 1. Base Dark Moon with Mare Basins (Earthshine visibility) */}
        <g clipPath="url(#moonFullDiscClip)">
          <circle cx={cx} cy={cy} r={r} fill="url(#moonDarkBase)" />
          <ellipse cx="44" cy="43" rx="12" ry="8.5" fill="rgba(0, 0, 0, 0.32)" />
          <ellipse cx="61" cy="46" rx="10.5" ry="9.5" fill="rgba(0, 0, 0, 0.26)" />
          <ellipse cx="67" cy="57" rx="8" ry="7" fill="rgba(0, 0, 0, 0.24)" />
          <ellipse cx="41" cy="64" rx="10" ry="8" fill="rgba(0, 0, 0, 0.28)" />
          <circle cx="54" cy="75" r="3.5" fill="rgba(0, 0, 0, 0.32)" />
        </g>

        {/* 2. Illuminated Lunar Surface (Clipped to Terminator) */}
        {pathD && (
          <g clipPath="url(#moonIllumClip)">
            <circle cx={cx} cy={cy} r={r} fill="url(#moonLitSurface)" />

            {/* Selenographic Maria & Crater Ray Systems */}
            <g opacity="0.42">
              {/* Mare Imbrium */}
              <ellipse cx="44" cy="43" rx="11.5" ry="8" fill="#64748b" />
              {/* Mare Serenitatis & Tranquillitatis */}
              <ellipse cx="61" cy="46" rx="10" ry="9" fill="#64748b" />
              {/* Mare Crisium */}
              <ellipse cx="73" cy="49" rx="4.5" ry="5.5" fill="#475569" />
              {/* Oceanus Procellarum */}
              <ellipse cx="38" cy="56" rx="9" ry="12.5" fill="#64748b" />
              {/* Tycho Crater Ray System */}
              <circle cx="55" cy="75" r="2.6" fill="#ffffff" />
              <path
                d="M 55 75 L 45 62 M 55 75 L 59 58 M 55 75 L 68 66 M 55 75 L 42 79"
                stroke="#ffffff"
                strokeWidth="0.75"
                opacity="0.65"
              />
              {/* Copernicus Crater */}
              <circle cx="48" cy="54" r="2.8" fill="#ffffff" />
              <circle cx="48" cy="54" r="1.8" fill="#94a3b8" />
            </g>
          </g>
        )}

        {/* 3. 3D Spherical Volume Overlay */}
        <g clipPath="url(#moonFullDiscClip)">
          <circle cx={cx} cy={cy} r={r} fill="url(#sphereLimbShading)" />
        </g>

        {/* Outer Crisp Lunar Rim */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="rgba(226, 232, 240, 0.25)"
          strokeWidth="1"
        />

        {/* Orbital Angle Node on Outer Ring */}
        <circle
          cx={orbX}
          cy={orbY}
          r="3"
          fill="#38bdf8"
          stroke="#0f172a"
          strokeWidth="1.2"
        />
      </svg>
    );
  };

  const distanceLabel =
    liveMoon.distanceStatus === 'perigee'
      ? lang === 'id'
        ? 'Perigee (Dekat)'
        : 'Perigee (Close)'
      : liveMoon.distanceStatus === 'apogee'
        ? lang === 'id'
          ? 'Apogee (Jauh)'
          : 'Apogee (Far)'
        : lang === 'id'
          ? 'Orbit Rata-Rata'
          : 'Mean Orbit';

  const tidalLabel =
    liveMoon.tidalState === 'spring'
      ? lang === 'id'
        ? 'Pasang Purnama'
        : 'Spring Tide'
      : liveMoon.tidalState === 'neap'
        ? lang === 'id'
          ? 'Pasang Perbani'
          : 'Neap Tide'
        : lang === 'id'
          ? 'Pasang Menengah'
          : 'Moderate Tide';

  return (
    <div className="glass-card astronomy-card">
      {/* Header */}
      <div className="metric-header astronomy-header">
        <div className="astronomy-title-wrap">
          <span className="metric-title">
            <Moon size={16} color="#38bdf8" /> {t.astronomyTitle}
          </span>
          <span className="badge-sub">
            {lang === 'id'
              ? 'Epemeris Bulan, Pasang Surut & Jam Fotografi'
              : 'Lunar Ephemeris, Tides & Photography Windows'}
          </span>
        </div>

        <div className="astronomy-header-badges">
          {previewPhaseKey && (
            <button
              type="button"
              className="moon-reset-btn"
              onClick={() => setPreviewPhaseKey(null)}
              title={lang === 'id' ? 'Kembali ke fase bulan saat ini' : 'Return to live moon phase'}
            >
              <RotateCcw size={11} />
              <span>{lang === 'id' ? 'Saat Ini' : 'Live'}</span>
            </button>
          )}
          <span className="metric-badge moon-badge">
            {activeIllum}% {lang === 'id' ? 'Iluminasi' : 'Lit'}
          </span>
        </div>
      </div>

      <div className="astronomy-content">
        {/* Main Lunar Ephemeris Hero Panel */}
        <div className="moon-hero-panel">
          <div className="moon-graphic-wrap">
            {renderMoonSvg()}
            <span className="moon-orbit-deg-tag">{activePhaseAngle}°</span>
          </div>

          <div className="moon-info-col">
            <div className="moon-phase-header-row">
              <span className="moon-phase-name">{phaseTitle}</span>
              <span className="moon-waxing-pill">
                {activeIsWaxing ? (
                  <>
                    <ArrowUpRight size={12} />
                    {lang === 'id' ? 'Menuju Purnama' : 'Waxing'}
                  </>
                ) : (
                  <>
                    <ArrowDownRight size={12} />
                    {lang === 'id' ? 'Menuju Bulan Baru' : 'Waning'}
                  </>
                )}
              </span>
            </div>

            {/* 4-Item Lunar Telemetry Micro-Grid */}
            <div className="moon-telemetry-grid">
              <div className="moon-stat-cell">
                <span className="moon-stat-label">{t.moonAge}</span>
                <strong className="moon-stat-val">
                  {activeAge} {lang === 'id' ? 'hr' : 'd'} / 29.5
                </strong>
              </div>
              <div className="moon-stat-cell">
                <span className="moon-stat-label">{t.lunarDistance}</span>
                <strong className="moon-stat-val" title={distanceLabel}>
                  {liveMoon.lunarDistanceKm.toLocaleString()} km
                </strong>
              </div>
              <div className="moon-stat-cell">
                <span className="moon-stat-label">
                  {lang === 'id' ? 'Terbit Bulan' : 'Est. Moonrise'}
                </span>
                <strong className="moon-stat-val">{goldenHour.moonriseTime}</strong>
              </div>
              <div className="moon-stat-cell">
                <span className="moon-stat-label">
                  {lang === 'id' ? 'Terbenam Bulan' : 'Est. Moonset'}
                </span>
                <strong className="moon-stat-val">{goldenHour.moonsetTime}</strong>
              </div>
            </div>

            {/* Illumination Progress Bar */}
            <div className="moon-progress-container">
              <div className="moon-progress-labels">
                <span>{t.moonIllumination}</span>
                <strong>{activeIllum}%</strong>
              </div>
              <div className="moon-progress-track">
                <div
                  className="moon-progress-fill"
                  style={{ width: `${activeIllum}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive 8-Phase Vector Lunar Cycle Strip */}
        <div className="lunar-cycle-bar">
          <div className="lunar-cycle-header">
            <span className="lunar-cycle-title">{t.lunarCycleOverview}</span>
            <span className="lunar-cycle-hint">
              {lang === 'id' ? 'Klik fase untuk pratinjau' : 'Click phase to inspect'}
            </span>
          </div>
          <div className="lunar-phases-strip">
            {LUNAR_CYCLE_PHASES.map((p) => {
              const isCurrentLive = p.key === liveMoon.key;
              const isSelected = p.key === activePhaseKey;
              const phaseLabel = t.moonPhases[p.key] || p.key;

              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() =>
                    setPreviewPhaseKey((prev) =>
                      prev === p.key || p.key === liveMoon.key ? null : p.key
                    )
                  }
                  className={`lunar-phase-pill ${isSelected ? 'phase-active' : ''} ${isCurrentLive ? 'phase-live' : ''}`}
                  title={`${phaseLabel} (${p.illum}%)`}
                >
                  {renderMiniMoonSvg(p.norm, p.key)}
                  <span className="lunar-phase-pct">{p.illum}%</span>
                  {isCurrentLive && <div className="phase-dot-indicator" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Celestial Milestones, Tidal Force & Stargazing Grid */}
        <div className="astronomy-milestones-row">
          <div className="milestone-item">
            <span className="milestone-label">{t.nextFullMoon}</span>
            <span className="milestone-val">
              {liveMoon.nextFullMoonDays} {lang === 'id' ? 'hari lagi' : 'days away'}
            </span>
          </div>

          <div className="milestone-item">
            <span className="milestone-label">{t.nextNewMoon}</span>
            <span className="milestone-val">
              {liveMoon.nextNewMoonDays} {lang === 'id' ? 'hari lagi' : 'days away'}
            </span>
          </div>

          <div className="milestone-item">
            <span className="milestone-label">
              <Waves size={13} color="#38bdf8" />{' '}
              {lang === 'id' ? 'Gravitasi Pasang' : 'Lunar Tide'}
            </span>
            <span className="milestone-val">
              {tidalLabel} &bull; {liveMoon.tidalStrengthPct}%
            </span>
          </div>

          <div className="milestone-item">
            <span className="milestone-label">
              <Compass size={13} color="#a78bfa" />{' '}
              {lang === 'id' ? 'Posisi Orbit' : 'Orbital Dist.'}
            </span>
            <span className="milestone-val">{distanceLabel}</span>
          </div>

          <div className="milestone-item stargazing-item">
            <span className="milestone-label">
              <Telescope size={13} color="#38bdf8" /> {t.stargazingRating}
            </span>
            <span className={`stargazing-status stargazing-${liveMoon.stargazingQuality}`}>
              {liveMoon.stargazingQuality === 'excellent' && <Eye size={11} />}
              {liveMoon.stargazingQuality === 'good' && <Eye size={11} />}
              {liveMoon.stargazingQuality === 'bright' && <Moon size={11} />}
              {liveMoon.stargazingQuality === 'excellent'
                ? t.stargazingExcellent
                : liveMoon.stargazingQuality === 'good'
                  ? t.stargazingGood
                  : t.stargazingBright}
            </span>
          </div>
        </div>

        {/* Jam Emas & Blue Hour Photography Suite with 24h Light Spectrum */}
        <div className="golden-hour-section">
          <div className="golden-hour-header">
            <span className="golden-title">
              <Camera size={14} color="#f59e0b" /> {t.goldenHour}
            </span>
            {(goldenHour.isGoldenHourNow || goldenHour.isBlueHourNow) ? (
              <span className="golden-active-pill">
                {goldenHour.activePeriodName || t.goldenHourActive}
              </span>
            ) : (
              <span className="golden-sub-badge">
                {lang === 'id' ? 'Jadwal Pencahayaan Alami' : 'Natural Light Schedule'}
              </span>
            )}
          </div>

          {/* 24-Hour Daylight & Twilight Spectrum Bar */}
          <div className="twilight-spectrum-wrap">
            <div className="twilight-spectrum-bar">
              <span
                className="twilight-now-pin"
                style={{ left: `${goldenHour.solarDayProgressPct}%` }}
                title={lang === 'id' ? 'Posisi Waktu Saat Ini' : 'Current Time Position'}
              />
            </div>
            <div className="twilight-spectrum-labels">
              <span>00:00</span>
              <span>{goldenHour.morningBlueStart}</span>
              <span>12:00</span>
              <span>{goldenHour.eveningBlueEnd}</span>
              <span>24:00</span>
            </div>
          </div>

          {/* Morning & Evening Dual Schedule */}
          <div className="photography-schedule-grid">
            {/* Morning Slot */}
            <div className="photo-slot-card morning-slot">
              <div className="photo-slot-header">
                <Sunrise size={14} color="#facc15" />
                <span>{lang === 'id' ? 'Pagi (Fajar)' : 'Morning (Dawn)'}</span>
              </div>
              <div className="photo-time-rows">
                <div className="photo-time-row">
                  <span className="photo-type-tag tag-blue">{t.blueHour}</span>
                  <span className="photo-time-val">
                    {goldenHour.morningBlueStart} – {goldenHour.morningBlueEnd}
                  </span>
                </div>
                <div className="photo-time-row">
                  <span className="photo-type-tag tag-golden">{t.morningGoldenHour}</span>
                  <span className="photo-time-val">
                    {goldenHour.morningGoldenStart} – {goldenHour.morningGoldenEnd}
                  </span>
                </div>
              </div>
            </div>

            {/* Evening Slot */}
            <div className="photo-slot-card evening-slot">
              <div className="photo-slot-header">
                <Sunset size={14} color="#fb923c" />
                <span>{lang === 'id' ? 'Sore (Senja)' : 'Evening (Dusk)'}</span>
              </div>
              <div className="photo-time-rows">
                <div className="photo-time-row">
                  <span className="photo-type-tag tag-golden">{t.eveningGoldenHour}</span>
                  <span className="photo-time-val">
                    {goldenHour.eveningGoldenStart} – {goldenHour.eveningGoldenEnd}
                  </span>
                </div>
                <div className="photo-time-row">
                  <span className="photo-type-tag tag-blue">{t.blueHour}</span>
                  <span className="photo-time-val">
                    {goldenHour.eveningBlueStart} – {goldenHour.eveningBlueEnd}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <p className="astronomy-tip">{t.astronomyTip}</p>
        </div>
      </div>
    </div>
  );
};

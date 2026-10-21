'use client';

import React from 'react';
import {
  Moon,
  Sparkles,
  Camera,
  Sunrise,
  Sunset,
  Telescope,
  Eye,
} from 'lucide-react';
import { getMoonPhase, getGoldenHourInfo, MoonPhaseKey } from '@/utils/astronomyUtils';
import { Language, getTranslation } from '@/utils/i18n';

interface AstronomyCardProps {
  sunrise: number;
  sunset: number;
  timezone: number;
  lang?: Language;
}

const LUNAR_CYCLE_PHASES: { key: MoonPhaseKey; emoji: string }[] = [
  { key: 'new_moon', emoji: '🌑' },
  { key: 'waxing_crescent', emoji: '🌒' },
  { key: 'first_quarter', emoji: '🌓' },
  { key: 'waxing_gibbous', emoji: '🌔' },
  { key: 'full_moon', emoji: '🌕' },
  { key: 'waning_gibbous', emoji: '🌖' },
  { key: 'last_quarter', emoji: '🌗' },
  { key: 'waning_crescent', emoji: '🌘' },
];

export const AstronomyCard: React.FC<AstronomyCardProps> = ({
  sunrise,
  sunset,
  timezone,
  lang = 'id',
}) => {
  const t = getTranslation(lang);
  const moon = getMoonPhase();
  const goldenHour = getGoldenHourInfo(sunrise, sunset, timezone);

  const phaseTitle = t.moonPhases[moon.key] || moon.key;

  // Render photorealistic 3D SVG lunar disc with dynamic terminator and lunar topography
  const renderMoonSvg = () => {
    const p = moon.phaseNormalized; // 0 to 1
    const isWaxing = p < 0.5;
    const r = 40;
    const cx = 50;
    const cy = 50;

    // Scale factor from -1 (concave/crescent) to 1 (convex/gibbous)
    const factor = Math.cos(p * 2 * Math.PI);
    const rx = Math.max(0.1, Math.abs(factor) * r);

    let pathD = '';
    if (p < 0.02 || p >= 0.98) {
      // New Moon: dark circle
      pathD = '';
    } else if (p >= 0.48 && p <= 0.52) {
      // Full Moon: full disc illuminated
      pathD = `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx} ${cy + r} A ${r} ${r} 0 1 1 ${cx} ${cy - r}`;
    } else if (isWaxing) {
      // Light on the right side
      if (factor < 0) {
        // Crescent (concave inner curve)
        pathD = `M ${cx} ${cy - r} A ${r} ${r} 0 0 1 ${cx} ${cy + r} A ${rx} ${r} 0 0 1 ${cx} ${cy - r}`;
      } else {
        // Gibbous (convex inner curve)
        pathD = `M ${cx} ${cy - r} A ${r} ${r} 0 0 1 ${cx} ${cy + r} A ${rx} ${r} 0 0 0 ${cx} ${cy - r}`;
      }
    } else {
      // Waning: Light on the left side
      if (factor < 0) {
        // Crescent (concave inner curve)
        pathD = `M ${cx} ${cy - r} A ${r} ${r} 0 0 0 ${cx} ${cy + r} A ${rx} ${r} 0 0 0 ${cx} ${cy - r}`;
      } else {
        // Gibbous (convex inner curve)
        pathD = `M ${cx} ${cy - r} A ${r} ${r} 0 0 0 ${cx} ${cy + r} A ${rx} ${r} 0 0 1 ${cx} ${cy - r}`;
      }
    }

    return (
      <svg className="moon-visual-svg" viewBox="0 0 100 100" width="96" height="96">
        <defs>
          {/* Outer Lunar Corona / Halo */}
          <radialGradient id="lunarHalo" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(254, 240, 138, 0.4)" />
            <stop offset="50%" stopColor="rgba(254, 240, 138, 0.12)" />
            <stop offset="100%" stopColor="rgba(254, 240, 138, 0)" />
          </radialGradient>

          {/* Unlit Dark Lunar Surface */}
          <radialGradient id="moonDarkBase" cx="45%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="65%" stopColor="#0f172a" />
            <stop offset="100%" stopColor="#050811" />
          </radialGradient>

          {/* Lit Lunar Surface Texture */}
          <radialGradient id="moonLitSurface" cx="42%" cy="36%" r="64%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="45%" stopColor="#fef08a" />
            <stop offset="75%" stopColor="#cbd5e1" />
            <stop offset="100%" stopColor="#94a3b8" />
          </radialGradient>

          {/* 3D Spherical Volume Overlay (Limb darkening) */}
          <radialGradient id="sphereLimbShading" cx="40%" cy="35%" r="60%">
            <stop offset="0%" stopColor="rgba(255, 255, 255, 0.15)" />
            <stop offset="60%" stopColor="rgba(0, 0, 0, 0)" />
            <stop offset="90%" stopColor="rgba(0, 0, 0, 0.45)" />
            <stop offset="100%" stopColor="rgba(0, 0, 0, 0.85)" />
          </radialGradient>

          {/* Glow filter for bright phase */}
          <filter id="lunarGlow" x="-25%" y="-25%" width="150%" height="150%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {/* Full Moon Disc Clip */}
          <clipPath id="moonFullDiscClip">
            <circle cx={cx} cy={cy} r={r} />
          </clipPath>

          {/* Illuminated Terminator Clip */}
          {pathD && (
            <clipPath id="moonIllumClip">
              <path d={pathD} />
            </clipPath>
          )}
        </defs>

        {/* Outer Lunar Corona */}
        <circle cx={cx} cy={cy} r={r + 8} fill="url(#lunarHalo)" />

        {/* Outer Subtle Atmosphere Ring */}
        <circle
          cx={cx}
          cy={cy}
          r={r + 1}
          fill="none"
          stroke="rgba(254, 240, 138, 0.25)"
          strokeWidth="1.5"
        />

        {/* 1. Base Dark Moon with Mare Basins */}
        <g clipPath="url(#moonFullDiscClip)">
          <circle cx={cx} cy={cy} r={r} fill="url(#moonDarkBase)" />

          {/* Dark Basalt Plains (Lunar Maria) Silhouettes */}
          <ellipse cx="40" cy="38" rx="14" ry="10" fill="rgba(0, 0, 0, 0.28)" />
          <ellipse cx="58" cy="42" rx="12" ry="11" fill="rgba(0, 0, 0, 0.24)" />
          <ellipse cx="64" cy="54" rx="9" ry="8" fill="rgba(0, 0, 0, 0.22)" />
          <ellipse cx="36" cy="62" rx="11" ry="9" fill="rgba(0, 0, 0, 0.25)" />
          <circle cx="50" cy="74" r="4" fill="rgba(0, 0, 0, 0.3)" />
        </g>

        {/* 2. Illuminated Lunar Surface (Clipped to Terminator) */}
        {pathD && (
          <g clipPath="url(#moonIllumClip)">
            <circle
              cx={cx}
              cy={cy}
              r={r}
              fill="url(#moonLitSurface)"
              filter={moon.illuminationPct > 45 ? 'url(#lunarGlow)' : undefined}
            />

            {/* Craters & Maria on lit surface */}
            <g opacity="0.45">
              {/* Mare Imbrium */}
              <ellipse cx="40" cy="38" rx="13" ry="9" fill="#64748b" />
              {/* Mare Serenitatis & Tranquillitatis */}
              <ellipse cx="58" cy="42" rx="11" ry="10" fill="#64748b" />
              {/* Oceanus Procellarum */}
              <ellipse cx="34" cy="52" rx="10" ry="14" fill="#64748b" />
              {/* Tycho Crater Ray Center */}
              <circle cx="52" cy="74" r="3" fill="#ffffff" />
              {/* Tycho radiating rays */}
              <path
                d="M 52 74 L 42 60 M 52 74 L 56 55 M 52 74 L 66 64 M 52 74 L 38 78"
                stroke="#ffffff"
                strokeWidth="0.8"
                opacity="0.6"
              />
              {/* Copernicus Crater */}
              <circle cx="44" cy="50" r="3.2" fill="#ffffff" />
              <circle cx="44" cy="50" r="2.2" fill="#94a3b8" />
            </g>
          </g>
        )}

        {/* 3. 3D Spherical Volume Overlay */}
        <g clipPath="url(#moonFullDiscClip)">
          <circle cx={cx} cy={cy} r={r} fill="url(#sphereLimbShading)" />
        </g>
      </svg>
    );
  };

  return (
    <div className="glass-card metric-card astronomy-card">
      {/* Header */}
      <div className="metric-header">
        <span className="metric-title">
          <Moon size={16} color="#facc15" /> {t.astronomyTitle}
        </span>
        <span className="metric-badge moon-badge">
          {moon.emoji} {moon.illuminationPct}%
        </span>
      </div>

      <div className="astronomy-content">
        {/* Main Moon Row */}
        <div className="moon-row">
          <div className="moon-graphic-wrap">{renderMoonSvg()}</div>

          <div className="moon-info-col">
            <span className="moon-phase-name">{phaseTitle}</span>

            <div className="moon-meta-row">
              <span className="moon-meta-item">
                {t.moonAge}: <strong>{moon.ageDays} {lang === 'id' ? 'hari' : 'days'}</strong>
              </span>
              <span className="moon-meta-item">
                {t.lunarDistance}: <strong>{moon.lunarDistanceKm.toLocaleString()} km</strong>
              </span>
            </div>

            {/* Illumination Progress Bar with indicator */}
            <div className="moon-progress-container">
              <div className="moon-progress-labels">
                <span>{t.moonIllumination}</span>
                <strong>{moon.illuminationPct}%</strong>
              </div>
              <div className="moon-progress-track">
                <div
                  className="moon-progress-fill"
                  style={{ width: `${moon.illuminationPct}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* 8-Phase Lunar Cycle Mini-Timeline */}
        <div className="lunar-cycle-bar">
          <span className="lunar-cycle-title">{t.lunarCycleOverview}</span>
          <div className="lunar-phases-strip">
            {LUNAR_CYCLE_PHASES.map((p) => {
              const isActive = p.key === moon.key;
              return (
                <div
                  key={p.key}
                  className={`lunar-phase-pill ${isActive ? 'phase-active' : ''}`}
                  title={t.moonPhases[p.key] || p.key}
                >
                  <span className="lunar-phase-emoji">{p.emoji}</span>
                  {isActive && <div className="phase-dot-indicator"></div>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Celestial Milestones & Stargazing Banner */}
        <div className="astronomy-milestones-row">
          <div className="milestone-item">
            <span className="milestone-label">🌕 {t.nextFullMoon}</span>
            <span className="milestone-val">
              {moon.nextFullMoonDays} {lang === 'id' ? 'hari lagi' : 'days away'}
            </span>
          </div>

          <div className="milestone-item">
            <span className="milestone-label">🌑 {t.nextNewMoon}</span>
            <span className="milestone-val">
              {moon.nextNewMoonDays} {lang === 'id' ? 'hari lagi' : 'days away'}
            </span>
          </div>

          <div className="milestone-item stargazing-item">
            <span className="milestone-label">
              <Telescope size={13} color="#38bdf8" /> {t.stargazingRating}
            </span>
            <span className={`stargazing-status stargazing-${moon.stargazingQuality}`}>
              {moon.stargazingQuality === 'excellent' && <Sparkles size={11} />}
              {moon.stargazingQuality === 'good' && <Eye size={11} />}
              {moon.stargazingQuality === 'bright' && <Moon size={11} />}
              {moon.stargazingQuality === 'excellent'
                ? t.stargazingExcellent
                : moon.stargazingQuality === 'good'
                ? t.stargazingGood
                : t.stargazingBright}
            </span>
          </div>
        </div>

        {/* Jam Emas & Blue Hour Photography Suite */}
        <div className="golden-hour-section">
          <div className="golden-hour-header">
            <span className="golden-title">
              <Camera size={14} color="#f59e0b" /> {t.goldenHour}
            </span>
            {(goldenHour.isGoldenHourNow || goldenHour.isBlueHourNow) && (
              <span className="golden-active-pill">
                <Sparkles size={12} /> {goldenHour.activePeriodName || t.goldenHourActive}
              </span>
            )}
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

          <p className="astronomy-tip">
            <Sparkles size={12} color="#facc15" /> {t.astronomyTip}
          </p>
        </div>
      </div>
    </div>
  );
};

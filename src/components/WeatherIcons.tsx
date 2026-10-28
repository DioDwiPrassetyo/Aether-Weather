import React from 'react';
import {
  Sun,
  Moon,
  CloudSun,
  CloudMoon,
  Cloud,
  CloudRain,
  CloudLightning,
  Snowflake,
  CloudFog,
} from 'lucide-react';

interface WeatherHeroArtProps {
  weatherId: number;
  isNight: boolean;
}

export const WeatherHeroArt: React.FC<WeatherHeroArtProps> = ({ weatherId, isNight }) => {
  // Clear Day
  if (weatherId === 800 && !isNight) {
    return (
      <svg className="weather-art-svg" viewBox="0 0 160 160">
        <defs>
          <radialGradient id="sunGlowNext" cx="38%" cy="36%" r="62%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="35%" stopColor="#fef08a" />
            <stop offset="75%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#d97706" />
          </radialGradient>
          <radialGradient id="sunHaloAura" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(254, 240, 138, 0.50)" />
            <stop offset="50%" stopColor="rgba(245, 158, 11, 0.20)" />
            <stop offset="100%" stopColor="rgba(0, 0, 0, 0)" />
          </radialGradient>
        </defs>
        <circle cx="80" cy="80" r="74" fill="url(#sunHaloAura)" />
        <g className="anim-spin-slow">
          <circle
            cx="80"
            cy="80"
            r="42"
            fill="url(#sunGlowNext)"
            filter="drop-shadow(0 0 24px rgba(254, 240, 138, 0.75))"
          />
          <line x1="80" y1="12" x2="80" y2="28" stroke="#fef08a" strokeWidth="4.5" strokeLinecap="round" />
          <line x1="80" y1="132" x2="80" y2="148" stroke="#fef08a" strokeWidth="4.5" strokeLinecap="round" />
          <line x1="12" y1="80" x2="28" y2="80" stroke="#fef08a" strokeWidth="4.5" strokeLinecap="round" />
          <line x1="132" y1="80" x2="148" y2="80" stroke="#fef08a" strokeWidth="4.5" strokeLinecap="round" />
          <line x1="32" y1="32" x2="43" y2="43" stroke="#fef08a" strokeWidth="4" strokeLinecap="round" />
          <line x1="117" y1="117" x2="128" y2="128" stroke="#fef08a" strokeWidth="4" strokeLinecap="round" />
          <line x1="32" y1="128" x2="43" y2="117" stroke="#fef08a" strokeWidth="4" strokeLinecap="round" />
          <line x1="117" y1="43" x2="128" y2="32" stroke="#fef08a" strokeWidth="4" strokeLinecap="round" />
        </g>
      </svg>
    );
  }

  // Clear Night: 3D Lunar Silhouette with Celestial Starlight Corona
  if (weatherId === 800 && isNight) {
    return (
      <svg className="weather-art-svg anim-float" viewBox="0 0 160 160">
        <defs>
          <radialGradient id="nightMoonGlow" cx="40%" cy="38%" r="62%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="45%" stopColor="#fef08a" />
            <stop offset="85%" stopColor="#cbd5e1" />
            <stop offset="100%" stopColor="#94a3b8" />
          </radialGradient>
          <radialGradient id="nightMoonHalo" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(254, 240, 138, 0.40)" />
            <stop offset="65%" stopColor="rgba(99, 102, 241, 0.15)" />
            <stop offset="100%" stopColor="rgba(0, 0, 0, 0)" />
          </radialGradient>
        </defs>
        <circle cx="80" cy="80" r="72" fill="url(#nightMoonHalo)" />
        <path
          d="M98 42 A 46 46 0 1 0 118 116 A 52 52 0 0 1 98 42 Z"
          fill="url(#nightMoonGlow)"
          filter="drop-shadow(0 0 24px rgba(254, 240, 138, 0.6))"
        />
        {/* Subtle Maria crater silhouettes */}
        <circle cx="70" cy="65" r="4.5" fill="rgba(100, 116, 139, 0.35)" />
        <circle cx="62" cy="85" r="6" fill="rgba(100, 116, 139, 0.3)" />
        <circle cx="85" cy="100" r="4" fill="rgba(100, 116, 139, 0.25)" />
        {/* Orbital sparkling stars */}
        <path d="M 126 50 L 128 54 L 132 56 L 128 58 L 126 62 L 124 58 L 120 56 L 124 54 Z" fill="#fef08a" />
        <circle cx="44" cy="46" r="2" fill="#ffffff" />
        <circle cx="132" cy="104" r="2.2" fill="#fef08a" />
      </svg>
    );
  }

  // Few Clouds
  if (weatherId === 801 || weatherId === 802) {
    return (
      <svg className="weather-art-svg" viewBox="0 0 160 160">
        <circle
          cx={isNight ? '62' : '65'}
          cy="58"
          r="30"
          fill={isNight ? '#e0e7ff' : '#fbbf24'}
          filter={`drop-shadow(0 0 16px ${isNight ? 'rgba(165,180,252,0.5)' : 'rgba(251,191,36,0.6)'})`}
        />
        <g className="anim-float">
          <path
            d="M 52 115 A 24 24 0 0 1 88 94 A 32 32 0 0 1 136 102 A 22 22 0 0 1 132 125 L 50 125 A 14 14 0 0 1 52 115 Z"
            fill="#f8fafc"
            filter="drop-shadow(0 8px 18px rgba(0,0,0,0.25))"
          />
        </g>
      </svg>
    );
  }

  // Overcast / Broken Clouds (Enhanced Volumetric 3D Cloud with Day/Night Celestial Starlight Glow)
  if (weatherId >= 803) {
    return (
      <svg className="weather-art-svg anim-float" viewBox="0 0 160 160">
        <defs>
          <radialGradient id="cloudGlowNext" cx="50%" cy="45%" r="55%">
            <stop offset="0%" stopColor={isNight ? 'rgba(99, 102, 241, 0.35)' : 'rgba(254, 240, 138, 0.35)'} />
            <stop offset="60%" stopColor={isNight ? 'rgba(56, 189, 248, 0.15)' : 'rgba(245, 158, 11, 0.15)'} />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <linearGradient id="cloudGradBack" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={isNight ? '#64748b' : '#94a3b8'} />
            <stop offset="100%" stopColor={isNight ? '#334155' : '#475569'} />
          </linearGradient>
          <linearGradient id="cloudGradFront" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="65%" stopColor={isNight ? '#cbd5e1' : '#e2e8f0'} />
            <stop offset="100%" stopColor={isNight ? '#94a3b8' : '#cbd5e1'} />
          </linearGradient>
          <linearGradient id="silverRim" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(255, 255, 255, 0.85)" />
            <stop offset="50%" stopColor="rgba(254, 240, 138, 0.50)" />
            <stop offset="100%" stopColor="rgba(255, 255, 255, 0.25)" />
          </linearGradient>
        </defs>

        {/* Outer Aura Halo */}
        <circle cx="80" cy="80" r="72" fill="url(#cloudGlowNext)" />

        {/* Celestial body peeking behind cloud */}
        {isNight ? (
          <g>
            <path
              d="M 68 38 A 20 20 0 1 0 78 68 A 24 24 0 0 1 68 38 Z"
              fill="#fef08a"
              filter="drop-shadow(0 0 12px rgba(254, 240, 138, 0.7))"
              opacity="0.9"
            />
            {/* Twinkling star */}
            <circle cx="98" cy="40" r="1.8" fill="#fef08a" />
            <circle cx="114" cy="52" r="1.2" fill="#ffffff" />
          </g>
        ) : (
          <circle
            cx="65"
            cy="52"
            r="24"
            fill="#facc15"
            filter="drop-shadow(0 0 16px rgba(250, 204, 21, 0.7))"
            opacity="0.9"
          />
        )}

        {/* Back Cloud */}
        <path
          d="M 38 84 A 24 24 0 0 1 74 62 A 32 32 0 0 1 122 72 A 22 22 0 0 1 120 98 L 36 98 Z"
          fill="url(#cloudGradBack)"
          opacity="0.9"
        />

        {/* Front Volumetric Cloud with Rim Highlight */}
        <path
          d="M 28 114 A 28 28 0 0 1 72 88 A 38 38 0 0 1 132 98 A 26 26 0 0 1 128 128 L 26 128 A 16 16 0 0 1 28 114 Z"
          fill="url(#cloudGradFront)"
          stroke="url(#silverRim)"
          strokeWidth="1.2"
          filter="drop-shadow(0 14px 28px rgba(0, 0, 0, 0.40))"
        />
      </svg>
    );
  }

  // Thunderstorm (Hujan Berpetir / Badai Petir: 200 - 299)
  if (weatherId >= 200 && weatherId < 300) {
    return (
      <svg className="weather-art-svg" viewBox="0 0 160 160">
        <defs>
          <radialGradient id="stormGlow" cx="50%" cy="54%" r="52%">
            <stop offset="0%" stopColor="rgba(250, 204, 21, 0.42)" />
            <stop offset="45%" stopColor="rgba(99, 102, 241, 0.24)" />
            <stop offset="100%" stopColor="rgba(15, 23, 42, 0)" />
          </radialGradient>
          <linearGradient id="thunderCloudBack" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#475569" />
            <stop offset="100%" stopColor="#1e293b" />
          </linearGradient>
          <linearGradient id="thunderCloudFront" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#64748b" />
            <stop offset="55%" stopColor="#334155" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
          <linearGradient id="lightningBoltGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="45%" stopColor="#fef08a" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
          <linearGradient id="thunderRainGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(56, 189, 248, 0.05)" />
            <stop offset="65%" stopColor="rgba(125, 211, 252, 0.85)" />
            <stop offset="100%" stopColor="#ffffff" />
          </linearGradient>
        </defs>

        {/* Ambient Storm Halo */}
        <circle cx="80" cy="80" r="72" fill="url(#stormGlow)" className="anim-cloud-flash" />

        {/* Back Thunderhead Cloud */}
        <g className="anim-storm-cloud-back">
          <path
            d="M 38 78 A 24 24 0 0 1 74 54 A 32 32 0 0 1 124 64 A 22 22 0 0 1 122 92 L 36 92 Z"
            fill="url(#thunderCloudBack)"
            opacity="0.92"
          />
        </g>

        {/* Front Cumulonimbus Storm Cloud */}
        <g className="anim-storm-cloud">
          <path
            d="M 24 94 A 28 28 0 0 1 70 64 A 40 40 0 0 1 136 76 A 26 26 0 0 1 132 106 L 24 106 A 18 18 0 0 1 24 94 Z"
            fill="url(#thunderCloudFront)"
            stroke="rgba(148, 163, 184, 0.28)"
            strokeWidth="1"
            filter="drop-shadow(0 12px 24px rgba(0,0,0,0.55))"
          />
          {/* Internal Cloud Sheet-Lightning Illumination */}
          <ellipse
            cx="84"
            cy="88"
            rx="36"
            ry="14"
            fill="rgba(254, 240, 138, 0.45)"
            filter="blur(8px)"
            className="anim-cloud-flash"
          />
        </g>

        {/* Background Fine Rain Veil */}
        <g opacity="0.45">
          <line
            x1="56"
            y1="106"
            x2="45"
            y2="132"
            stroke="#7dd3fc"
            strokeWidth="1.6"
            strokeLinecap="round"
            className="anim-rain-streak storm-fast delay-2"
          />
          <line
            x1="118"
            y1="106"
            x2="107"
            y2="132"
            stroke="#7dd3fc"
            strokeWidth="1.6"
            strokeLinecap="round"
            className="anim-rain-streak storm-fast delay-1"
          />
        </g>

        {/* Animated Wind-Driven Optical Storm Rain Streaks with Teardrop Beads */}
        <g className="storm-rain-group">
          <g className="anim-rain-streak storm-fast delay-1">
            <line
              x1="46"
              y1="106"
              x2="34"
              y2="134"
              stroke="url(#thunderRainGrad)"
              strokeWidth="2.8"
              strokeLinecap="round"
            />
            <circle cx="34" cy="134" r="1.7" fill="#ffffff" />
          </g>
          <g className="anim-rain-streak storm-fast delay-3">
            <line
              x1="66"
              y1="108"
              x2="54"
              y2="138"
              stroke="url(#thunderRainGrad)"
              strokeWidth="3.1"
              strokeLinecap="round"
            />
            <circle cx="54" cy="138" r="1.8" fill="#ffffff" />
          </g>
          <g className="anim-rain-streak storm-fast delay-2">
            <line
              x1="108"
              y1="108"
              x2="96"
              y2="138"
              stroke="url(#thunderRainGrad)"
              strokeWidth="3.1"
              strokeLinecap="round"
            />
            <circle cx="96" cy="138" r="1.8" fill="#ffffff" />
          </g>
          <g className="anim-rain-streak storm-fast delay-4">
            <line
              x1="126"
              y1="106"
              x2="114"
              y2="134"
              stroke="url(#thunderRainGrad)"
              strokeWidth="2.7"
              strokeLinecap="round"
            />
            <circle cx="114" cy="134" r="1.6" fill="#ffffff" />
          </g>
        </g>

        {/* Puddle Ripples at Base */}
        <ellipse
          cx="50"
          cy="145"
          rx="8"
          ry="2.3"
          fill="none"
          stroke="rgba(125, 211, 252, 0.65)"
          strokeWidth="1.2"
          className="anim-splash-ring delay-3"
        />
        <ellipse
          cx="104"
          cy="145"
          rx="8"
          ry="2.3"
          fill="none"
          stroke="rgba(125, 211, 252, 0.65)"
          strokeWidth="1.2"
          className="anim-splash-ring delay-2"
        />

        {/* Secondary Branched Lightning Fork */}
        <polyline
          points="92,102 106,118 102,126 114,140"
          fill="none"
          stroke="#93c5fd"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="anim-lightning-fork"
        />

        {/* Primary High-Voltage Lightning Bolt */}
        <polygon
          points="86,86 68,114 85,114 70,148 104,110 87,110"
          fill="url(#lightningBoltGrad)"
          filter="drop-shadow(0 0 14px rgba(250, 204, 21, 0.95))"
          className="anim-lightning-strike"
        />
      </svg>
    );
  }

  // Heavy Storm Rain / Squall (Hujan Badai / Hujan Deras: 502, 503, 504, 521, 522, 531)
  if ([502, 503, 504, 521, 522, 531].includes(weatherId)) {
    return (
      <svg className="weather-art-svg" viewBox="0 0 160 160">
        <defs>
          <radialGradient id="heavyRainGlow" cx="50%" cy="50%" r="52%">
            <stop offset="0%" stopColor="rgba(56, 189, 248, 0.38)" />
            <stop offset="60%" stopColor="rgba(30, 58, 138, 0.2)" />
            <stop offset="100%" stopColor="rgba(15, 23, 42, 0)" />
          </radialGradient>
          <linearGradient id="stormRainCloudBack" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#64748b" />
            <stop offset="100%" stopColor="#334155" />
          </linearGradient>
          <linearGradient id="stormRainCloudFront" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#94a3b8" />
            <stop offset="60%" stopColor="#475569" />
            <stop offset="100%" stopColor="#1e293b" />
          </linearGradient>
          <linearGradient id="stormStreakGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(56, 189, 248, 0.05)" />
            <stop offset="60%" stopColor="rgba(125, 211, 252, 0.85)" />
            <stop offset="100%" stopColor="#ffffff" />
          </linearGradient>
        </defs>

        <circle cx="80" cy="80" r="68" fill="url(#heavyRainGlow)" />

        {/* Back Storm Cloud */}
        <g className="anim-storm-cloud-back">
          <path
            d="M 40 76 A 24 24 0 0 1 76 52 A 32 32 0 0 1 124 62 A 22 22 0 0 1 122 90 L 38 90 Z"
            fill="url(#stormRainCloudBack)"
            opacity="0.9"
          />
        </g>

        {/* Front Turbulent Cloud */}
        <g className="anim-storm-cloud">
          <path
            d="M 26 92 A 28 28 0 0 1 72 62 A 40 40 0 0 1 136 74 A 26 26 0 0 1 132 104 L 26 104 A 18 18 0 0 1 26 92 Z"
            fill="url(#stormRainCloudFront)"
            stroke="rgba(186, 230, 253, 0.25)"
            strokeWidth="1"
            filter="drop-shadow(0 12px 24px rgba(0,0,0,0.45))"
          />
        </g>

        {/* Sweeping Wind Squall Lines */}
        <path
          d="M 22 100 Q 58 96 92 102"
          fill="none"
          stroke="rgba(186, 230, 253, 0.65)"
          strokeWidth="2.2"
          strokeLinecap="round"
          className="anim-wind-squall"
        />
        <path
          d="M 64 108 Q 98 104 134 110"
          fill="none"
          stroke="rgba(125, 211, 252, 0.5)"
          strokeWidth="1.8"
          strokeLinecap="round"
          className="anim-wind-squall delay-2"
        />

        {/* Background Fine Rain Curtain */}
        <g opacity="0.42">
          <line
            x1="56"
            y1="106"
            x2="43"
            y2="136"
            stroke="#7dd3fc"
            strokeWidth="1.6"
            strokeLinecap="round"
            className="anim-rain-streak storm-fast delay-3"
          />
          <line
            x1="98"
            y1="106"
            x2="85"
            y2="136"
            stroke="#7dd3fc"
            strokeWidth="1.6"
            strokeLinecap="round"
            className="anim-rain-streak storm-fast delay-1"
          />
        </g>

        {/* Dense Diagonal Storm Rain Streaks with Leading Teardrop Beads */}
        <g>
          <g className="anim-rain-streak storm-fast delay-1">
            <line
              x1="46"
              y1="106"
              x2="32"
              y2="136"
              stroke="url(#stormStreakGrad)"
              strokeWidth="2.9"
              strokeLinecap="round"
            />
            <circle cx="32" cy="136" r="1.7" fill="#ffffff" />
          </g>
          <g className="anim-rain-streak storm-fast delay-2">
            <line
              x1="66"
              y1="104"
              x2="52"
              y2="138"
              stroke="url(#stormStreakGrad)"
              strokeWidth="3.2"
              strokeLinecap="round"
            />
            <circle cx="52" cy="138" r="1.9" fill="#ffffff" />
          </g>
          <g className="anim-rain-streak storm-fast delay-3">
            <line
              x1="88"
              y1="106"
              x2="74"
              y2="140"
              stroke="url(#stormStreakGrad)"
              strokeWidth="3.4"
              strokeLinecap="round"
            />
            <circle cx="74" cy="140" r="2" fill="#ffffff" />
          </g>
          <g className="anim-rain-streak storm-fast delay-4">
            <line
              x1="108"
              y1="104"
              x2="94"
              y2="138"
              stroke="url(#stormStreakGrad)"
              strokeWidth="3.1"
              strokeLinecap="round"
            />
            <circle cx="94" cy="138" r="1.8" fill="#ffffff" />
          </g>
          <g className="anim-rain-streak storm-fast delay-1">
            <line
              x1="126"
              y1="106"
              x2="112"
              y2="134"
              stroke="url(#stormStreakGrad)"
              strokeWidth="2.8"
              strokeLinecap="round"
            />
            <circle cx="112" cy="134" r="1.6" fill="#ffffff" />
          </g>
        </g>

        {/* Animated Puddle Splash Rings & V-Crown Droplets */}
        <g className="anim-splash-ring delay-2">
          <ellipse
            cx="52"
            cy="144"
            rx="8.5"
            ry="2.5"
            fill="none"
            stroke="rgba(125, 211, 252, 0.72)"
            strokeWidth="1.2"
          />
          <circle cx="46" cy="139" r="1.1" fill="#e0f2fe" />
          <circle cx="58" cy="139" r="1.1" fill="#e0f2fe" />
        </g>
        <g className="anim-splash-ring delay-4">
          <ellipse
            cx="94"
            cy="144"
            rx="9"
            ry="2.6"
            fill="none"
            stroke="rgba(56, 189, 248, 0.72)"
            strokeWidth="1.2"
          />
          <circle cx="88" cy="139" r="1.1" fill="#e0f2fe" />
          <circle cx="100" cy="139" r="1.1" fill="#e0f2fe" />
        </g>
      </svg>
    );
  }

  // Regular Rain / Drizzle (300 - 599, excluding 511 Freezing Rain) — Upgraded Volumetric Cloud, Optical Rain Streaks & Puddle Ripples
  if (weatherId >= 300 && weatherId < 600 && weatherId !== 511) {
    return (
      <svg className="weather-art-svg" viewBox="0 0 160 160">
        <defs>
          <radialGradient id="rainGlow" cx="50%" cy="50%" r="52%">
            <stop offset="0%" stopColor="rgba(56, 189, 248, 0.36)" />
            <stop offset="65%" stopColor="rgba(14, 165, 233, 0.12)" />
            <stop offset="100%" stopColor="rgba(56, 189, 248, 0)" />
          </radialGradient>
          <linearGradient id="rainCloudBack" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#94a3b8" />
            <stop offset="100%" stopColor="#475569" />
          </linearGradient>
          <linearGradient id="rainCloudFront" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f1f5f9" />
            <stop offset="55%" stopColor="#cbd5e1" />
            <stop offset="100%" stopColor="#64748b" />
          </linearGradient>
          <linearGradient id="rainStreakOptical" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(56, 189, 248, 0.04)" />
            <stop offset="62%" stopColor="rgba(56, 189, 248, 0.85)" />
            <stop offset="100%" stopColor="#ffffff" />
          </linearGradient>
        </defs>

        <circle cx="80" cy="80" r="68" fill="url(#rainGlow)" />

        {/* Back Rain Cloud */}
        <g className="anim-storm-cloud-back">
          <path
            d="M 42 74 A 24 24 0 0 1 78 52 A 30 30 0 0 1 124 62 A 22 22 0 0 1 122 88 L 40 88 Z"
            fill="url(#rainCloudBack)"
            opacity="0.88"
          />
        </g>

        {/* Front Volumetric Rain Cloud */}
        <g className="anim-float">
          <path
            d="M 26 90 A 28 28 0 0 1 72 60 A 40 40 0 0 1 136 72 A 26 26 0 0 1 132 102 L 26 102 A 18 18 0 0 1 26 90 Z"
            fill="url(#rainCloudFront)"
            stroke="rgba(255, 255, 255, 0.45)"
            strokeWidth="1.1"
            filter="drop-shadow(0 12px 24px rgba(0,0,0,0.38))"
          />
        </g>

        {/* Background Fine Drizzle Streaks for Depth */}
        <g opacity="0.45">
          <line
            x1="62"
            y1="104"
            x2="54"
            y2="130"
            stroke="#7dd3fc"
            strokeWidth="1.6"
            strokeLinecap="round"
            className="anim-rain-streak delay-3"
          />
          <line
            x1="90"
            y1="104"
            x2="82"
            y2="132"
            stroke="#7dd3fc"
            strokeWidth="1.6"
            strokeLinecap="round"
            className="anim-rain-streak delay-1"
          />
          <line
            x1="114"
            y1="104"
            x2="106"
            y2="130"
            stroke="#7dd3fc"
            strokeWidth="1.6"
            strokeLinecap="round"
            className="anim-rain-streak delay-2"
          />
        </g>

        {/* Foreground Optical Rain Streaks with Specular Water-Bead Tips */}
        <g>
          <g className="anim-rain-streak delay-1">
            <line
              x1="48"
              y1="106"
              x2="38"
              y2="134"
              stroke="url(#rainStreakOptical)"
              strokeWidth="2.8"
              strokeLinecap="round"
            />
            <circle cx="38" cy="134" r="1.7" fill="#ffffff" />
          </g>
          <g className="anim-rain-streak delay-2">
            <line
              x1="74"
              y1="104"
              x2="64"
              y2="136"
              stroke="url(#rainStreakOptical)"
              strokeWidth="3.2"
              strokeLinecap="round"
            />
            <circle cx="64" cy="136" r="1.9" fill="#ffffff" />
          </g>
          <g className="anim-rain-streak delay-3">
            <line
              x1="100"
              y1="106"
              x2="90"
              y2="136"
              stroke="url(#rainStreakOptical)"
              strokeWidth="3.1"
              strokeLinecap="round"
            />
            <circle cx="90" cy="136" r="1.8" fill="#ffffff" />
          </g>
          <g className="anim-rain-streak delay-4">
            <line
              x1="124"
              y1="106"
              x2="114"
              y2="134"
              stroke="url(#rainStreakOptical)"
              strokeWidth="2.7"
              strokeLinecap="round"
            />
            <circle cx="114" cy="134" r="1.6" fill="#ffffff" />
          </g>
        </g>

        {/* Animated Puddle Ripples & Micro Splash Beads */}
        <g className="anim-splash-ring delay-2">
          <ellipse
            cx="62"
            cy="143"
            rx="7.5"
            ry="2.2"
            fill="none"
            stroke="rgba(125, 211, 252, 0.65)"
            strokeWidth="1.15"
          />
          <circle cx="57" cy="139" r="1" fill="#bae6fd" />
          <circle cx="67" cy="139" r="1" fill="#bae6fd" />
        </g>
        <g className="anim-splash-ring delay-3">
          <ellipse
            cx="90"
            cy="144"
            rx="7"
            ry="2"
            fill="none"
            stroke="rgba(56, 189, 248, 0.6)"
            strokeWidth="1.1"
          />
        </g>
      </svg>
    );
  }

  // Heavy Blizzard / Snowstorm (Badai Salju Lebat / Blizzard: 602, 622)
  if (weatherId === 602 || weatherId === 622) {
    return (
      <svg className="weather-art-svg" viewBox="0 0 160 160">
        <defs>
          <radialGradient id="blizzardGlow" cx="50%" cy="50%" r="54%">
            <stop offset="0%" stopColor="rgba(186, 230, 253, 0.45)" />
            <stop offset="55%" stopColor="rgba(56, 189, 248, 0.22)" />
            <stop offset="100%" stopColor="rgba(15, 23, 42, 0)" />
          </radialGradient>
          <linearGradient id="blizzardCloudBack" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#94a3b8" />
            <stop offset="100%" stopColor="#475569" />
          </linearGradient>
          <linearGradient id="blizzardCloudFront" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f8fafc" />
            <stop offset="55%" stopColor="#cbd5e1" />
            <stop offset="100%" stopColor="#64748b" />
          </linearGradient>
          <g id="crystalFlakeBold">
            <line x1="0" y1="-6.5" x2="0" y2="6.5" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" />
            <line x1="-5.6" y1="-3.25" x2="5.6" y2="3.25" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" />
            <line x1="-5.6" y1="3.25" x2="5.6" y2="-3.25" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" />
            <circle cx="0" cy="0" r="1.6" fill="#bae6fd" />
          </g>
        </defs>

        <circle cx="80" cy="80" r="70" fill="url(#blizzardGlow)" />

        {/* Back Arctic Storm Cloud */}
        <g className="anim-storm-cloud-back">
          <path
            d="M 40 74 A 24 24 0 0 1 76 50 A 32 32 0 0 1 124 60 A 22 22 0 0 1 122 88 L 38 88 Z"
            fill="url(#blizzardCloudBack)"
            opacity="0.9"
          />
        </g>

        {/* Front Turbulent Blizzard Cloud */}
        <g className="anim-storm-cloud">
          <path
            d="M 24 90 A 28 28 0 0 1 70 60 A 40 40 0 0 1 136 72 A 26 26 0 0 1 132 102 L 24 102 A 18 18 0 0 1 24 90 Z"
            fill="url(#blizzardCloudFront)"
            stroke="rgba(224, 242, 254, 0.7)"
            strokeWidth="1.2"
            filter="drop-shadow(0 12px 24px rgba(0,0,0,0.42))"
          />
        </g>

        {/* Sweeping Whiteout Blizzard Wind Gusts */}
        <path
          d="M 18 104 Q 62 96 112 106"
          fill="none"
          stroke="rgba(224, 242, 254, 0.85)"
          strokeWidth="2.5"
          strokeLinecap="round"
          className="anim-wind-squall"
        />
        <path
          d="M 44 118 Q 90 110 140 120"
          fill="none"
          stroke="rgba(186, 230, 253, 0.7)"
          strokeWidth="2.1"
          strokeLinecap="round"
          className="anim-wind-squall delay-2"
        />
        <path
          d="M 26 132 Q 74 126 122 134"
          fill="none"
          stroke="rgba(125, 211, 252, 0.55)"
          strokeWidth="1.8"
          strokeLinecap="round"
          className="anim-wind-squall"
        />

        {/* High-Velocity Diagonal Blowing Snowflakes */}
        <g className="anim-blizzard-flake delay-1">
          <use href="#crystalFlakeBold" x="48" y="112" />
        </g>
        <g className="anim-blizzard-flake delay-2">
          <use href="#crystalFlakeBold" x="78" y="122" transform="scale(1.1)" />
        </g>
        <g className="anim-blizzard-flake delay-3">
          <use href="#crystalFlakeBold" x="108" y="114" />
        </g>
        <g className="anim-blizzard-flake delay-4">
          <use href="#crystalFlakeBold" x="62" y="134" transform="scale(0.85)" />
        </g>
        <g className="anim-blizzard-flake delay-1">
          <use href="#crystalFlakeBold" x="122" y="128" transform="scale(0.9)" />
        </g>

        {/* Swirling Snow pellets & Base Snowdrift Bank */}
        <circle cx="38" cy="126" r="2.2" fill="#ffffff" className="anim-blizzard-flake delay-3" />
        <circle cx="94" cy="136" r="2.4" fill="#e0f2fe" className="anim-blizzard-flake delay-2" />
        <path
          d="M 32 146 Q 58 139 84 144 T 130 145"
          fill="none"
          stroke="rgba(240, 249, 255, 0.78)"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  // Sleet / Freezing Rain / Ice Pellets (Hujan Es / Salju Campur: 511, 611, 612, 613, 615, 616)
  if ([511, 611, 612, 613, 615, 616].includes(weatherId)) {
    return (
      <svg className="weather-art-svg" viewBox="0 0 160 160">
        <defs>
          <radialGradient id="sleetGlow" cx="50%" cy="50%" r="52%">
            <stop offset="0%" stopColor="rgba(125, 211, 252, 0.38)" />
            <stop offset="65%" stopColor="rgba(56, 189, 248, 0.14)" />
            <stop offset="100%" stopColor="rgba(15, 23, 42, 0)" />
          </radialGradient>
          <linearGradient id="sleetCloudFront" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f1f5f9" />
            <stop offset="55%" stopColor="#cbd5e1" />
            <stop offset="100%" stopColor="#64748b" />
          </linearGradient>
          <linearGradient id="sleetStreakGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(125, 211, 252, 0.05)" />
            <stop offset="65%" stopColor="rgba(186, 230, 253, 0.85)" />
            <stop offset="100%" stopColor="#ffffff" />
          </linearGradient>
        </defs>

        <circle cx="80" cy="80" r="68" fill="url(#sleetGlow)" />

        {/* Back Winter Cloud */}
        <path
          d="M 42 74 A 24 24 0 0 1 78 52 A 30 30 0 0 1 124 62 A 22 22 0 0 1 122 88 L 40 88 Z"
          fill="#64748b"
          opacity="0.85"
        />

        {/* Front Frosted Cloud */}
        <g className="anim-float">
          <path
            d="M 26 90 A 28 28 0 0 1 72 60 A 40 40 0 0 1 136 72 A 26 26 0 0 1 132 102 L 26 102 A 18 18 0 0 1 26 90 Z"
            fill="url(#sleetCloudFront)"
            stroke="rgba(224, 242, 254, 0.55)"
            strokeWidth="1.15"
            filter="drop-shadow(0 12px 24px rgba(0,0,0,0.38))"
          />
        </g>

        {/* Freezing Rain Streaks */}
        <g className="anim-rain-streak delay-1">
          <line
            x1="48"
            y1="106"
            x2="38"
            y2="134"
            stroke="url(#sleetStreakGrad)"
            strokeWidth="2.6"
            strokeLinecap="round"
          />
        </g>
        <g className="anim-rain-streak delay-3">
          <line
            x1="96"
            y1="106"
            x2="86"
            y2="134"
            stroke="url(#sleetStreakGrad)"
            strokeWidth="2.6"
            strokeLinecap="round"
          />
        </g>

        {/* Crystalline Ice Pellets (Diamonds) & Snowflakes */}
        <g className="anim-snowflake-fall delay-2">
          <polygon
            points="66,110 70,116 66,122 62,116"
            fill="#e0f2fe"
            stroke="#38bdf8"
            strokeWidth="1"
          />
        </g>
        <g className="anim-snowflake-fall delay-4">
          <polygon
            points="114,112 118,118 114,124 110,118"
            fill="#ffffff"
            stroke="#7dd3fc"
            strokeWidth="1"
          />
        </g>
        <g className="anim-snowflake-fall delay-1">
          <circle cx="76" cy="132" r="3" fill="#ffffff" />
          <line x1="76" y1="127" x2="76" y2="137" stroke="#bae6fd" strokeWidth="1.4" strokeLinecap="round" />
          <line x1="71" y1="132" x2="81" y2="132" stroke="#bae6fd" strokeWidth="1.4" strokeLinecap="round" />
        </g>

        {/* Ice Pellet Bounce Ripples */}
        <ellipse
          cx="64"
          cy="144"
          rx="7.5"
          ry="2.2"
          fill="none"
          stroke="rgba(186, 230, 253, 0.75)"
          strokeWidth="1.2"
          className="anim-splash-ring delay-2"
        />
        <ellipse
          cx="110"
          cy="144"
          rx="7.5"
          ry="2.2"
          fill="none"
          stroke="rgba(125, 211, 252, 0.7)"
          strokeWidth="1.2"
          className="anim-splash-ring delay-4"
        />
      </svg>
    );
  }

  // Regular & Light Snow (Bersalju: 600 - 699)
  if (weatherId >= 600 && weatherId < 700) {
    return (
      <svg className="weather-art-svg" viewBox="0 0 160 160">
        <defs>
          <radialGradient id="snowGlow" cx="50%" cy="50%" r="52%">
            <stop offset="0%" stopColor="rgba(224, 242, 254, 0.42)" />
            <stop offset="60%" stopColor="rgba(125, 211, 252, 0.16)" />
            <stop offset="100%" stopColor="rgba(15, 23, 42, 0)" />
          </radialGradient>
          <linearGradient id="snowCloudBack" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#cbd5e1" />
            <stop offset="100%" stopColor="#64748b" />
          </linearGradient>
          <linearGradient id="snowCloudFront" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="65%" stopColor="#e2e8f0" />
            <stop offset="100%" stopColor="#94a3b8" />
          </linearGradient>
          <g id="crystalFlake">
            <line x1="0" y1="-6" x2="0" y2="6" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="-5.2" y1="-3" x2="5.2" y2="3" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="-5.2" y1="3" x2="5.2" y2="-3" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="0" cy="0" r="1.5" fill="#bae6fd" />
          </g>
        </defs>

        <circle cx="80" cy="80" r="68" fill="url(#snowGlow)" />

        {/* Back Winter Cloud */}
        <g className="anim-storm-cloud-back">
          <path
            d="M 42 74 A 24 24 0 0 1 78 52 A 30 30 0 0 1 124 62 A 22 22 0 0 1 122 88 L 40 88 Z"
            fill="url(#snowCloudBack)"
            opacity="0.88"
          />
        </g>

        {/* Front Frosty Volumetric Cloud */}
        <g className="anim-float">
          <path
            d="M 26 90 A 28 28 0 0 1 72 60 A 40 40 0 0 1 136 72 A 26 26 0 0 1 132 102 L 26 102 A 18 18 0 0 1 26 90 Z"
            fill="url(#snowCloudFront)"
            stroke="rgba(224, 242, 254, 0.75)"
            strokeWidth="1.2"
            filter="drop-shadow(0 12px 24px rgba(0,0,0,0.35))"
          />
        </g>

        {/* Background Powder Flakes */}
        <circle cx="44" cy="112" r="2" fill="rgba(224, 242, 254, 0.7)" className="anim-snowflake-fall delay-3" />
        <circle cx="96" cy="110" r="1.8" fill="rgba(224, 242, 254, 0.65)" className="anim-snowflake-fall delay-1" />
        <circle cx="122" cy="116" r="2.1" fill="rgba(224, 242, 254, 0.7)" className="anim-snowflake-fall delay-2" />

        {/* Foreground Rotating 6-Pointed Crystalline Snowflakes */}
        <g className="anim-snowflake-fall delay-1">
          <use href="#crystalFlake" x="54" y="118" />
        </g>
        <g className="anim-snowflake-fall delay-2">
          <use href="#crystalFlake" x="80" y="128" transform="scale(1.1)" />
        </g>
        <g className="anim-snowflake-fall delay-4">
          <use href="#crystalFlake" x="108" y="120" />
        </g>

        {/* Soft Snow Drift Cushion at Base */}
        <path
          d="M 40 145 Q 65 140 82 144 T 122 144"
          fill="none"
          stroke="rgba(224, 242, 254, 0.65)"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  // Atmosphere (Mist, Fog, Haze, Smoke, Dust: 700 - 799)
  return (
    <svg className="weather-art-svg" viewBox="0 0 160 160">
      <defs>
        <radialGradient id="fogGlow" cx="50%" cy="50%" r="52%">
          <stop offset="0%" stopColor="rgba(203, 213, 225, 0.32)" />
          <stop offset="65%" stopColor="rgba(148, 163, 184, 0.12)" />
          <stop offset="100%" stopColor="rgba(15, 23, 42, 0)" />
        </radialGradient>
        <linearGradient id="fogBandGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(203, 213, 225, 0.1)" />
          <stop offset="30%" stopColor="rgba(241, 245, 249, 0.9)" />
          <stop offset="70%" stopColor="rgba(226, 232, 240, 0.9)" />
          <stop offset="100%" stopColor="rgba(203, 213, 225, 0.1)" />
        </linearGradient>
      </defs>

      <circle cx="80" cy="80" r="68" fill="url(#fogGlow)" />

      {/* Diffused Upper Cloud Silhouette */}
      <path
        d="M 34 82 A 26 26 0 0 1 76 56 A 36 36 0 0 1 130 68 A 24 24 0 0 1 126 94 L 34 94 Z"
        fill="rgba(203, 213, 225, 0.42)"
        className="anim-float"
      />

      {/* Layered Drifting Fog Ribbons */}
      <line
        x1="30"
        y1="86"
        x2="126"
        y2="86"
        stroke="url(#fogBandGrad)"
        strokeWidth="5.5"
        strokeLinecap="round"
        className="anim-fog-band"
      />
      <line
        x1="42"
        y1="102"
        x2="136"
        y2="102"
        stroke="url(#fogBandGrad)"
        strokeWidth="6"
        strokeLinecap="round"
        className="anim-fog-band delay-2"
      />
      <line
        x1="24"
        y1="118"
        x2="118"
        y2="118"
        stroke="url(#fogBandGrad)"
        strokeWidth="5.5"
        strokeLinecap="round"
        className="anim-fog-band"
      />
      <line
        x1="46"
        y1="133"
        x2="122"
        y2="133"
        stroke="url(#fogBandGrad)"
        strokeWidth="4.5"
        strokeLinecap="round"
        opacity="0.75"
        className="anim-fog-band delay-2"
      />
    </svg>
  );
};

export const MiniWeatherIcon: React.FC<{ weatherId: number; isNight?: boolean; size?: number }> = ({
  weatherId,
  isNight = false,
  size = 28,
}) => {
  if (weatherId === 800) {
    return isNight ? <Moon size={size} color="#e0e7ff" /> : <Sun size={size} color="#fbbf24" />;
  }
  if (weatherId === 801 || weatherId === 802) {
    return isNight ? <CloudMoon size={size} color="#bae6fd" /> : <CloudSun size={size} color="#fde047" />;
  }
  if (weatherId >= 803) return <Cloud size={size} color="#cbd5e1" />;
  if (weatherId >= 200 && weatherId < 300) {
    return <CloudLightning size={size} color="#facc15" className="mini-icon-thunder" />;
  }
  if (weatherId === 602 || weatherId === 622) {
    return <Snowflake size={size} color="#e0f2fe" className="mini-icon-blizzard" />;
  }
  if ([511, 611, 612, 613, 615, 616].includes(weatherId)) {
    return <Snowflake size={size} color="#7dd3fc" className="mini-icon-sleet" />;
  }
  if (weatherId >= 600 && weatherId < 700) {
    return <Snowflake size={size} color="#bae6fd" className="mini-icon-snow" />;
  }
  if ([502, 503, 504, 521, 522, 531].includes(weatherId)) {
    return <CloudRain size={size} color="#7dd3fc" className="mini-icon-storm-rain" />;
  }
  if (weatherId >= 300 && weatherId < 600) {
    return <CloudRain size={size} color="#38bdf8" className="mini-icon-rain" />;
  }
  return <CloudFog size={size} color="#94a3b8" />;
};

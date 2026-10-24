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

  // Thunderstorm
  if (weatherId >= 200 && weatherId < 300) {
    return (
      <svg className="weather-art-svg" viewBox="0 0 160 160">
        <defs>
          <radialGradient id="stormGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(250, 204, 21, 0.4)" />
            <stop offset="100%" stopColor="rgba(250, 204, 21, 0)" />
          </radialGradient>
        </defs>
        <circle cx="80" cy="80" r="70" fill="url(#stormGlow)" />
        <g className="anim-float">
          <path
            d="M 28 88 A 30 30 0 0 1 76 60 A 42 42 0 0 1 138 72 A 30 30 0 0 1 134 104 L 26 104 A 20 20 0 0 1 28 88 Z"
            fill="#334155"
            filter="drop-shadow(0 10px 22px rgba(0,0,0,0.5))"
          />
        </g>
        <polygon
          points="86,92 70,118 88,118 74,148 104,114 88,114"
          fill="#facc15"
          filter="drop-shadow(0 0 16px rgba(250, 204, 21, 0.9))"
        />
      </svg>
    );
  }

  // Rain / Drizzle
  if (weatherId >= 300 && weatherId < 600) {
    return (
      <svg className="weather-art-svg" viewBox="0 0 160 160">
        <defs>
          <radialGradient id="rainGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(56, 189, 248, 0.35)" />
            <stop offset="100%" stopColor="rgba(56, 189, 248, 0)" />
          </radialGradient>
        </defs>
        <circle cx="80" cy="80" r="65" fill="url(#rainGlow)" />
        <g className="anim-float">
          <path
            d="M 28 86 A 30 30 0 0 1 76 58 A 42 42 0 0 1 138 70 A 30 30 0 0 1 134 102 L 26 102 A 20 20 0 0 1 28 86 Z"
            fill="#e2e8f0"
            filter="drop-shadow(0 10px 22px rgba(0,0,0,0.3))"
          />
        </g>
        <line x1="52" y1="114" x2="42" y2="136" stroke="#38bdf8" strokeWidth="3.5" strokeLinecap="round" />
        <line x1="76" y1="112" x2="66" y2="138" stroke="#38bdf8" strokeWidth="4" strokeLinecap="round" />
        <line x1="102" y1="114" x2="92" y2="136" stroke="#38bdf8" strokeWidth="3.5" strokeLinecap="round" />
        <line x1="124" y1="116" x2="114" y2="138" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" />
      </svg>
    );
  }

  // Snow
  if (weatherId >= 600 && weatherId < 700) {
    return (
      <svg className="weather-art-svg anim-float" viewBox="0 0 160 160">
        <path
          d="M 36 86 A 28 28 0 0 1 80 62 A 36 36 0 0 1 134 72 A 26 26 0 0 1 130 100 L 34 100 A 18 18 0 0 1 36 86 Z"
          fill="#f8fafc"
        />
        <circle cx="56" cy="120" r="3.5" fill="#bae6fd" />
        <circle cx="82" cy="130" r="4" fill="#ffffff" />
        <circle cx="106" cy="118" r="3.5" fill="#bae6fd" />
      </svg>
    );
  }

  // Atmosphere (Mist, Fog, Haze)
  return (
    <svg className="weather-art-svg anim-float" viewBox="0 0 160 160">
      <line x1="36" y1="65" x2="124" y2="65" stroke="#cbd5e1" strokeWidth="6" strokeLinecap="round" opacity="0.8" />
      <line x1="48" y1="85" x2="136" y2="85" stroke="#e2e8f0" strokeWidth="6" strokeLinecap="round" opacity="0.9" />
      <line x1="28" y1="105" x2="118" y2="105" stroke="#cbd5e1" strokeWidth="6" strokeLinecap="round" opacity="0.8" />
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
  if (weatherId >= 200 && weatherId < 300) return <CloudLightning size={size} color="#facc15" />;
  if (weatherId >= 300 && weatherId < 600) return <CloudRain size={size} color="#38bdf8" />;
  if (weatherId >= 600 && weatherId < 700) return <Snowflake size={size} color="#bae6fd" />;
  return <CloudFog size={size} color="#94a3b8" />;
};

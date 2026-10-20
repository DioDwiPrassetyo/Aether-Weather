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
          <radialGradient id="sunGlowNext" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="60%" stopColor="#facc15" />
            <stop offset="100%" stopColor="#f59e0b" />
          </radialGradient>
        </defs>
        <g className="anim-spin-slow">
          <circle
            cx="80"
            cy="80"
            r="42"
            fill="url(#sunGlowNext)"
            filter="drop-shadow(0 0 20px rgba(245, 158, 11, 0.6))"
          />
          <line x1="80" y1="16" x2="80" y2="28" stroke="#fef08a" strokeWidth="4.5" strokeLinecap="round" />
          <line x1="80" y1="132" x2="80" y2="144" stroke="#fef08a" strokeWidth="4.5" strokeLinecap="round" />
          <line x1="16" y1="80" x2="28" y2="80" stroke="#fef08a" strokeWidth="4.5" strokeLinecap="round" />
          <line x1="132" y1="80" x2="144" y2="80" stroke="#fef08a" strokeWidth="4.5" strokeLinecap="round" />
          <line x1="34" y1="34" x2="44" y2="44" stroke="#fef08a" strokeWidth="4" strokeLinecap="round" />
          <line x1="116" y1="116" x2="126" y2="126" stroke="#fef08a" strokeWidth="4" strokeLinecap="round" />
          <line x1="34" y1="126" x2="44" y2="116" stroke="#fef08a" strokeWidth="4" strokeLinecap="round" />
          <line x1="116" y1="44" x2="126" y2="34" stroke="#fef08a" strokeWidth="4" strokeLinecap="round" />
        </g>
      </svg>
    );
  }

  // Clear Night
  if (weatherId === 800 && isNight) {
    return (
      <svg className="weather-art-svg anim-float" viewBox="0 0 160 160">
        <path
          d="M98 42 A 46 46 0 1 0 118 116 A 52 52 0 0 1 98 42 Z"
          fill="#e0e7ff"
          filter="drop-shadow(0 0 24px rgba(165, 180, 252, 0.5))"
        />
        <circle cx="126" cy="54" r="3" fill="#fef08a" />
        <circle cx="48" cy="46" r="2.5" fill="#ffffff" />
        <circle cx="132" cy="100" r="2" fill="#ffffff" />
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

  // Overcast / Broken Clouds
  if (weatherId >= 803) {
    return (
      <svg className="weather-art-svg anim-float" viewBox="0 0 160 160">
        <path
          d="M 45 80 A 22 22 0 0 1 80 62 A 28 28 0 0 1 122 72 A 20 20 0 0 1 120 95 L 44 95 Z"
          fill="#94a3b8"
          opacity="0.75"
        />
        <path
          d="M 38 114 A 26 26 0 0 1 78 92 A 34 34 0 0 1 132 100 A 24 24 0 0 1 128 126 L 36 126 A 16 16 0 0 1 38 114 Z"
          fill="#f1f5f9"
          filter="drop-shadow(0 10px 22px rgba(0,0,0,0.3))"
        />
      </svg>
    );
  }

  // Thunderstorm
  if (weatherId >= 200 && weatherId < 300) {
    return (
      <svg className="weather-art-svg" viewBox="0 0 160 160">
        <g className="anim-float">
          <path
            d="M 36 94 A 28 28 0 0 1 80 70 A 36 36 0 0 1 134 80 A 26 26 0 0 1 130 108 L 34 108 A 18 18 0 0 1 36 94 Z"
            fill="#475569"
            filter="drop-shadow(0 8px 20px rgba(0,0,0,0.4))"
          />
        </g>
        <polygon
          points="82,98 68,122 84,122 72,148 98,118 84,118"
          fill="#facc15"
          filter="drop-shadow(0 0 14px rgba(250, 204, 21, 0.8))"
        />
      </svg>
    );
  }

  // Rain / Drizzle
  if (weatherId >= 300 && weatherId < 600) {
    return (
      <svg className="weather-art-svg" viewBox="0 0 160 160">
        <g className="anim-float">
          <path
            d="M 36 86 A 28 28 0 0 1 80 62 A 36 36 0 0 1 134 72 A 26 26 0 0 1 130 100 L 34 100 A 18 18 0 0 1 36 86 Z"
            fill="#e2e8f0"
            filter="drop-shadow(0 8px 20px rgba(0,0,0,0.25))"
          />
        </g>
        <line x1="56" y1="112" x2="48" y2="132" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" />
        <line x1="78" y1="110" x2="70" y2="134" stroke="#38bdf8" strokeWidth="3.5" strokeLinecap="round" />
        <line x1="102" y1="112" x2="94" y2="132" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" />
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

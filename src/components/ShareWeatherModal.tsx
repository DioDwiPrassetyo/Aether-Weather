'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  X,
  Download,
  Share2,
  Copy,
  Check,
  Link2,
  CloudSun,
  Wind,
  Droplets,
  Gauge,
  Leaf,
  Eye,
  Sunrise,
  MapPin,
  Clock,
  Sparkles,
  Palette,
  LayoutTemplate,
  MessageSquareQuote,
  Image as ImageIcon,
  Send,
  MessageCircle,
} from 'lucide-react';
import { CurrentWeatherResponse, AirPollutionResponse, UnitType } from '@/types/weather';
import { Language, getTranslation } from '@/utils/i18n';
import { WeatherHeroArt } from './WeatherIcons';

function getWindDirection(deg: number): string {
  const dirs = ['U', 'TL', 'T', 'TG', 'S', 'BD', 'B', 'BL'];
  return dirs[Math.round(((deg % 360) + 360) % 360 / 45) % 8];
}

interface ShareWeatherModalProps {
  isOpen: boolean;
  onClose: () => void;
  weather: CurrentWeatherResponse;
  pollution: AirPollutionResponse | null;
  unit: UnitType;
  lang?: Language;
  onShowToast: (msg: string, type?: 'info' | 'success' | 'error') => void;
}

type CardThemeId = 'celestial' | 'aurora' | 'sunset' | 'arctic';
type CardFormatId = 'landscape' | 'portrait';

interface CardThemeConfig {
  id: CardThemeId;
  name: { id: string; en: string };
  swatch: string;
  bgStops: [string, string, string, string];
  cardStops: [string, string, string];
  borderRgba: string;
  accentHex: string;
  accentSecondaryHex: string;
  pillBgRgba: string;
  pillBorderRgba: string;
  nebulaTopRgba: string;
  nebulaBottomRgba: string;
}

const CARD_THEMES: Record<CardThemeId, CardThemeConfig> = {
  celestial: {
    id: 'celestial',
    name: { id: 'Celestial Gold', en: 'Celestial Gold' },
    swatch: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 55%, #fef08a 100%)',
    bgStops: ['#070b14', '#0f172a', '#18143c', '#090e1c'],
    cardStops: ['rgba(15, 23, 42, 0.88)', 'rgba(24, 20, 60, 0.76)', 'rgba(15, 23, 42, 0.92)'],
    borderRgba: 'rgba(254, 240, 138, 0.32)',
    accentHex: '#fef08a',
    accentSecondaryHex: '#38bdf8',
    pillBgRgba: 'rgba(254, 240, 138, 0.14)',
    pillBorderRgba: 'rgba(254, 240, 138, 0.40)',
    nebulaTopRgba: 'rgba(254, 240, 138, 0.24)',
    nebulaBottomRgba: 'rgba(56, 189, 248, 0.18)',
  },
  aurora: {
    id: 'aurora',
    name: { id: 'Aurora Borealis', en: 'Aurora Borealis' },
    swatch: 'linear-gradient(135deg, #041f1e 0%, #064e3b 55%, #34d399 100%)',
    bgStops: ['#031114', '#06282a', '#0c233a', '#05131f'],
    cardStops: ['rgba(6, 34, 38, 0.86)', 'rgba(12, 45, 56, 0.76)', 'rgba(8, 25, 38, 0.92)'],
    borderRgba: 'rgba(52, 211, 153, 0.34)',
    accentHex: '#6ee7b7',
    accentSecondaryHex: '#38bdf8',
    pillBgRgba: 'rgba(52, 211, 153, 0.15)',
    pillBorderRgba: 'rgba(52, 211, 153, 0.42)',
    nebulaTopRgba: 'rgba(52, 211, 153, 0.24)',
    nebulaBottomRgba: 'rgba(56, 189, 248, 0.20)',
  },
  sunset: {
    id: 'sunset',
    name: { id: 'Crimson Dusk', en: 'Crimson Dusk' },
    swatch: 'linear-gradient(135deg, #1f0a1d 0%, #4c1d4b 55%, #fb7185 100%)',
    bgStops: ['#140816', '#2b102f', '#3b1532', '#120b24'],
    cardStops: ['rgba(38, 14, 42, 0.86)', 'rgba(56, 18, 48, 0.74)', 'rgba(22, 13, 38, 0.92)'],
    borderRgba: 'rgba(251, 146, 60, 0.34)',
    accentHex: '#fdba74',
    accentSecondaryHex: '#fb7185',
    pillBgRgba: 'rgba(251, 146, 60, 0.15)',
    pillBorderRgba: 'rgba(251, 146, 60, 0.42)',
    nebulaTopRgba: 'rgba(251, 113, 133, 0.24)',
    nebulaBottomRgba: 'rgba(245, 158, 11, 0.18)',
  },
  arctic: {
    id: 'arctic',
    name: { id: 'Arctic Crystal', en: 'Arctic Crystal' },
    swatch: 'linear-gradient(135deg, #08182b 0%, #0c3559 55%, #7dd3fc 100%)',
    bgStops: ['#05101f', '#0a223d', '#0f3156', '#07162c'],
    cardStops: ['rgba(10, 32, 58, 0.86)', 'rgba(14, 48, 82, 0.75)', 'rgba(8, 24, 46, 0.92)'],
    borderRgba: 'rgba(125, 211, 252, 0.36)',
    accentHex: '#bae6fd',
    accentSecondaryHex: '#38bdf8',
    pillBgRgba: 'rgba(56, 189, 248, 0.16)',
    pillBorderRgba: 'rgba(125, 211, 252, 0.42)',
    nebulaTopRgba: 'rgba(125, 211, 252, 0.25)',
    nebulaBottomRgba: 'rgba(186, 230, 253, 0.16)',
  },
};

// Fallback helper for browsers lacking CanvasRenderingContext2D.roundRect
function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  if (typeof ctx.roundRect === 'function') {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
  } else {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
}

// Helper to draw a 6-pointed geometric dendrite snowflake on Canvas
function drawCanvasSnowflake(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  color: string
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1.8, radius * 0.14);
  ctx.lineCap = 'round';
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI) / 3;
    const ex = Math.cos(angle) * radius;
    const ey = Math.sin(angle) * radius;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(ex, ey);
    ctx.stroke();

    // Side crystal branches
    const bDist = radius * 0.58;
    const bLen = radius * 0.34;
    const bx = Math.cos(angle) * bDist;
    const by = Math.sin(angle) * bDist;
    for (const dir of [-1, 1]) {
      const bAngle = angle + (dir * Math.PI) / 4;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(bx + Math.cos(bAngle) * bLen, by + Math.sin(bAngle) * bLen);
      ctx.stroke();
    }
  }
  ctx.restore();
}

export const ShareWeatherModal: React.FC<ShareWeatherModalProps> = ({
  isOpen,
  onClose,
  weather,
  pollution,
  unit,
  lang = 'id',
  onShowToast,
}) => {
  const t = getTranslation(lang);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<CardThemeId>('celestial');
  const [cardFormat, setCardFormat] = useState<CardFormatId>('landscape');
  const [showCoords, setShowCoords] = useState<boolean>(true);
  const [customNote, setCustomNote] = useState<string>('');
  const [isCopied, setIsCopied] = useState(false);
  const [isImageCopied, setIsImageCopied] = useState(false);
  const [isLinkCopied, setIsLinkCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const theme = CARD_THEMES[selectedTheme];
  const unitSymbol = unit === 'metric' ? '°C' : '°F';
  const speedUnit = unit === 'metric' ? 'km/j' : 'mph';
  const windDisplay =
    unit === 'metric' ? Math.round(weather.wind.speed * 3.6) : Math.round(weather.wind.speed);
  const windDir = getWindDirection(weather.wind.deg || 0);

  const condition = weather.weather[0];
  const isNight = condition.icon.endsWith('n');
  const translatedDesc =
    t.descriptions[condition.description.toLowerCase()] || condition.description;
  const aqiScore = pollution?.list?.[0]?.main?.aqi ?? 2;
  const aqiLabel = t.aqiLevels[aqiScore] || 'Baik';

  // Dew point & visibility calculation
  const tempC = unit === 'metric' ? weather.main.temp : ((weather.main.temp - 32) * 5) / 9;
  const dewPointC = Math.round(tempC - (100 - weather.main.humidity) / 5);
  const dewPointDisplay =
    unit === 'metric' ? `${dewPointC}°C` : `${Math.round((dewPointC * 9) / 5 + 32)}°F`;
  const visibilityKm = ((weather.visibility ?? 10000) / 1000).toFixed(1);

  // Format local date, time, sunrise, sunset
  const now = new Date((weather.dt + weather.timezone) * 1000);
  const dateFormatted = `${t.days[now.getUTCDay()]}, ${now.getUTCDate()} ${
    t.monthsFull[now.getUTCMonth()]
  } ${now.getUTCFullYear()}`;
  const timeFormatted = `${String(now.getUTCHours()).padStart(2, '0')}:${String(
    now.getUTCMinutes()
  ).padStart(2, '0')}`;

  const formatSunClock = (unixSec?: number) => {
    if (!unixSec) return '--:--';
    const d = new Date((unixSec + weather.timezone) * 1000);
    return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(
      2,
      '0'
    )}`;
  };
  const sunriseStr = formatSunClock(weather.sys?.sunrise);
  const sunsetStr = formatSunClock(weather.sys?.sunset);

  const coordsText = `${Math.abs(weather.coord.lat).toFixed(2)}°${
    weather.coord.lat >= 0 ? 'N' : 'S'
  }, ${Math.abs(weather.coord.lon).toFixed(2)}°${weather.coord.lon >= 0 ? 'E' : 'W'}`;

  // Smart quick caption chips based on current weather
  const quickCaptions = React.useMemo(() => {
    const id = condition.id;
    if (id >= 200 && id < 600) {
      return lang === 'id'
        ? [
            `Sedia payung & jas hujan di ${weather.name} hari ini ☔`,
            `Jalanan basah di ${weather.name}, tetap hati-hati berkendara!`,
            `Suasana hujan syahdu di ${weather.name} 🌧️`,
          ]
        : [
            `Keep an umbrella handy in ${weather.name} today ☔`,
            `Wet roads in ${weather.name}, drive safely!`,
            `Cozy rainy vibes in ${weather.name} 🌧️`,
          ];
    }
    if (id >= 600 && id < 700) {
      return lang === 'id'
        ? [
            `Suhu dingin bersalju di ${weather.name}, gunakan pakaian hangat ❄️`,
            `Waspada jalanan licin & jarak pandang pendek di ${weather.name}`,
            `Suasana musim dingin di ${weather.name} ⛄`,
          ]
        : [
            `Sub-zero snowy conditions in ${weather.name}, bundle up ❄️`,
            `Watch for icy roads & low visibility in ${weather.name}`,
            `Winter wonderland vibes in ${weather.name} ⛄`,
          ];
    }
    if (tempC >= 31) {
      return lang === 'id'
        ? [
            `Cuaca cukup terik di ${weather.name}, jangan lupa minum air! 💧`,
            `Gunakan tabir surya saat beraktivitas di luar ruang ☀️`,
            `Pantauan cuaca siang ini di ${weather.name}`,
          ]
        : [
            `Warm day in ${weather.name}, stay hydrated! 💧`,
            `Wear sunscreen for outdoor activities today ☀️`,
            `Live atmospheric check from ${weather.name}`,
          ];
    }
    return lang === 'id'
      ? [
          `Cuaca nyaman untuk beraktivitas di ${weather.name} ✨`,
          `Pantauan atmosfer langsung dari ${weather.name}`,
          `Langit bersahabat hari ini di ${weather.name} 🌤️`,
        ]
      : [
          `Great weather for outdoor plans in ${weather.name} ✨`,
          `Live atmospheric telemetry from ${weather.name}`,
          `Pleasant skies today in ${weather.name} 🌤️`,
        ];
  }, [condition.id, tempC, weather.name, lang]);

  // Summary Text
  const shareSummaryText = `🌤️ ${weather.name}, ${weather.sys.country} (${timeFormatted}):
🌡️ ${Math.round(weather.main.temp)}${unitSymbol} — ${translatedDesc}
${t.feelsLike}: ${Math.round(weather.main.feels_like)}° | Min: ${Math.round(
    weather.main.temp_min
  )}° / Max: ${Math.round(weather.main.temp_max)}°
💨 ${t.wind}: ${windDisplay} ${speedUnit} (${windDir}) | 💧 ${t.humidity}: ${
    weather.main.humidity
  }% | 🍃 AQI: ${aqiLabel}${customNote.trim() ? `\n💬 "${customNote.trim()}"` : ''}
✨ WeatherAether Real-Time Atmospheric Intelligence`;

  const getDirectUrl = () => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}${window.location.pathname}?city=${encodeURIComponent(
      weather.name
    )}`;
  };

  // Draw High-Resolution Weather Art on Canvas (supports Clear, Night, Thunder, Rain, Snow/Blizzard, Sleet, Fog, Clouds)
  const drawCanvasWeatherArt = useCallback(
    (ctx: CanvasRenderingContext2D, artCenterX: number, artCenterY: number, scale = 1) => {
      ctx.save();
      ctx.translate(artCenterX, artCenterY);
      ctx.scale(scale, scale);

      const id = condition.id;

      if (id === 800) {
        if (!isNight) {
          // Clear Day: Golden Starlight Sun with Radiating Corona
          const sunCorona = ctx.createRadialGradient(0, 0, 18, 0, 0, 130);
          sunCorona.addColorStop(0, 'rgba(254, 240, 138, 0.55)');
          sunCorona.addColorStop(0.5, 'rgba(245, 158, 11, 0.22)');
          sunCorona.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = sunCorona;
          ctx.beginPath();
          ctx.arc(0, 0, 130, 0, Math.PI * 2);
          ctx.fill();

          // 12 Starlight Rays
          ctx.strokeStyle = '#fef08a';
          ctx.lineWidth = 4.5;
          ctx.lineCap = 'round';
          for (let i = 0; i < 12; i++) {
            const angle = (i * Math.PI) / 6;
            const innerR = 72;
            const outerR = i % 2 === 0 ? 102 : 88;
            ctx.beginPath();
            ctx.moveTo(Math.cos(angle) * innerR, Math.sin(angle) * innerR);
            ctx.lineTo(Math.cos(angle) * outerR, Math.sin(angle) * outerR);
            ctx.stroke();
          }

          // Sun Core
          const sunCore = ctx.createRadialGradient(-14, -14, 0, 0, 0, 60);
          sunCore.addColorStop(0, '#ffffff');
          sunCore.addColorStop(0.35, '#fef08a');
          sunCore.addColorStop(0.85, '#f59e0b');
          sunCore.addColorStop(1, '#d97706');
          ctx.fillStyle = sunCore;
          ctx.beginPath();
          ctx.arc(0, 0, 60, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Clear Night: 3D Celestial Moon with Starlight Corona
          const moonCorona = ctx.createRadialGradient(0, 0, 28, 0, 0, 125);
          moonCorona.addColorStop(0, 'rgba(254, 240, 138, 0.38)');
          moonCorona.addColorStop(0.5, 'rgba(56, 189, 248, 0.14)');
          moonCorona.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = moonCorona;
          ctx.beginPath();
          ctx.arc(0, 0, 125, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#1e293b';
          ctx.beginPath();
          ctx.arc(0, 0, 62, 0, Math.PI * 2);
          ctx.fill();

          const moonLit = ctx.createRadialGradient(24, -15, 0, 0, 0, 62);
          moonLit.addColorStop(0, '#ffffff');
          moonLit.addColorStop(0.55, '#fef08a');
          moonLit.addColorStop(1, '#cbd5e1');
          ctx.fillStyle = moonLit;
          ctx.beginPath();
          ctx.arc(0, 0, 62, -Math.PI / 2, Math.PI / 2, false);
          ctx.bezierCurveTo(10, 42, 10, -42, 0, -62);
          ctx.fill();
        }
      } else if (id >= 200 && id < 300) {
        // Thunderstorm: Deep Storm Cloud + Multi-Branch Lightning + Rain Streaks
        const cloudGrad = ctx.createLinearGradient(0, -60, 0, 35);
        cloudGrad.addColorStop(0, '#64748b');
        cloudGrad.addColorStop(1, '#1e1b4b');
        ctx.fillStyle = cloudGrad;

        ctx.beginPath();
        ctx.arc(-35, -12, 44, 0, Math.PI * 2);
        ctx.arc(28, -26, 54, 0, Math.PI * 2);
        ctx.arc(68, 8, 36, 0, Math.PI * 2);
        ctx.arc(-64, 12, 32, 0, Math.PI * 2);
        ctx.fill();

        // Slanted Rain Drops
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.75)';
        ctx.lineWidth = 3.2;
        ctx.lineCap = 'round';
        [
          { x: -52, y: 42 },
          { x: -26, y: 50 },
          { x: 42, y: 44 },
          { x: 64, y: 52 },
        ].forEach((r) => {
          ctx.beginPath();
          ctx.moveTo(r.x, r.y);
          ctx.lineTo(r.x - 10, r.y + 26);
          ctx.stroke();
        });

        // Glowing Golden Lightning Bolt
        ctx.fillStyle = '#fef08a';
        ctx.shadowColor = '#facc15';
        ctx.shadowBlur = 22;
        ctx.beginPath();
        ctx.moveTo(14, -8);
        ctx.lineTo(-16, 34);
        ctx.lineTo(6, 34);
        ctx.lineTo(-20, 92);
        ctx.lineTo(28, 22);
        ctx.lineTo(6, 22);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
      } else if (id === 511 || (id >= 611 && id <= 616)) {
        // Sleet / Freezing Rain: Cloud + Rain Streaks + Ice Pellets
        const cloudGrad = ctx.createLinearGradient(0, -58, 0, 36);
        cloudGrad.addColorStop(0, '#94a3b8');
        cloudGrad.addColorStop(1, '#334155');
        ctx.fillStyle = cloudGrad;
        ctx.beginPath();
        ctx.arc(-32, -14, 44, 0, Math.PI * 2);
        ctx.arc(32, -28, 54, 0, Math.PI * 2);
        ctx.arc(70, 6, 36, 0, Math.PI * 2);
        ctx.arc(-62, 10, 32, 0, Math.PI * 2);
        ctx.fill();

        // Rain streaks
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3.5;
        ctx.lineCap = 'round';
        [
          { x: -45, y: 42 },
          { x: 5, y: 44 },
          { x: 52, y: 42 },
        ].forEach((r) => {
          ctx.beginPath();
          ctx.moveTo(r.x, r.y);
          ctx.lineTo(r.x - 10, r.y + 26);
          ctx.stroke();
        });

        // Ice pellets
        ctx.fillStyle = '#e0f2fe';
        [
          { x: -22, y: 62 },
          { x: 28, y: 66 },
          { x: -5, y: 80 },
        ].forEach((p) => {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 5.5, 0, Math.PI * 2);
          ctx.fill();
        });
      } else if (id >= 300 && id < 600) {
        // Rain / Drizzle: Volumetric Storm Cloud + Luminous Slanted Raindrops
        const cloudGrad = ctx.createLinearGradient(0, -60, 0, 38);
        cloudGrad.addColorStop(0, '#64748b');
        cloudGrad.addColorStop(1, '#1e293b');
        ctx.fillStyle = cloudGrad;

        ctx.beginPath();
        ctx.arc(-30, -15, 45, 0, Math.PI * 2);
        ctx.arc(34, -30, 55, 0, Math.PI * 2);
        ctx.arc(72, 5, 37, 0, Math.PI * 2);
        ctx.arc(-64, 10, 32, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        [
          { x: -48, y: 42 },
          { x: -18, y: 52 },
          { x: 14, y: 42 },
          { x: 44, y: 52 },
          { x: 68, y: 42 },
        ].forEach((r) => {
          ctx.beginPath();
          ctx.moveTo(r.x, r.y);
          ctx.lineTo(r.x - 12, r.y + 28);
          ctx.stroke();
        });
      } else if (id >= 600 && id < 700) {
        // Snow / Blizzard: Glacial Cloud + Geometric 6-Pointed Dendrite Snowflakes + Wind Swirls
        const cloudGrad = ctx.createLinearGradient(0, -60, 0, 35);
        cloudGrad.addColorStop(0, '#e2e8f0');
        cloudGrad.addColorStop(1, '#64748b');
        ctx.fillStyle = cloudGrad;

        ctx.beginPath();
        ctx.arc(-30, -15, 44, 0, Math.PI * 2);
        ctx.arc(32, -28, 54, 0, Math.PI * 2);
        ctx.arc(70, 6, 36, 0, Math.PI * 2);
        ctx.arc(-62, 10, 32, 0, Math.PI * 2);
        ctx.fill();

        // Draw 3 detailed 6-pointed dendrite snowflakes
        drawCanvasSnowflake(ctx, -38, 56, 14, '#e0f2fe');
        drawCanvasSnowflake(ctx, 8, 68, 17, '#ffffff');
        drawCanvasSnowflake(ctx, 52, 54, 13, '#bae6fd');

        // Blizzard wind streamlines for heavy snow (602 / 622)
        if (id === 602 || id === 622) {
          ctx.strokeStyle = 'rgba(186, 230, 253, 0.65)';
          ctx.lineWidth = 2.5;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(-75, 36);
          ctx.quadraticCurveTo(-20, 28, 45, 36);
          ctx.stroke();
        }
      } else if (id >= 700 && id < 800) {
        // Fog / Mist: Soft Cloud + Layered Glowing Mist Bands
        const cloudGrad = ctx.createLinearGradient(0, -55, 0, 20);
        cloudGrad.addColorStop(0, '#cbd5e1');
        cloudGrad.addColorStop(1, '#475569');
        ctx.fillStyle = cloudGrad;
        ctx.beginPath();
        ctx.arc(-28, -18, 42, 0, Math.PI * 2);
        ctx.arc(28, -28, 50, 0, Math.PI * 2);
        ctx.arc(65, 0, 34, 0, Math.PI * 2);
        ctx.fill();

        // Glowing Mist Bars
        ctx.lineCap = 'round';
        ctx.lineWidth = 6;
        [
          { x1: -68, x2: 62, y: 34, o: 0.85 },
          { x1: -52, x2: 74, y: 52, o: 0.65 },
          { x1: -60, x2: 48, y: 70, o: 0.45 },
        ].forEach((band) => {
          ctx.strokeStyle = `rgba(186, 230, 253, ${band.o})`;
          ctx.beginPath();
          ctx.moveTo(band.x1, band.y);
          ctx.lineTo(band.x2, band.y);
          ctx.stroke();
        });
      } else {
        // Clouds / Partly Cloudy
        if (!isNight) {
          ctx.fillStyle = '#fef08a';
          ctx.beginPath();
          ctx.arc(38, -38, 40, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = '#bae6fd';
          ctx.beginPath();
          ctx.arc(38, -38, 34, 0, Math.PI * 2);
          ctx.fill();
        }

        const cloudGrad = ctx.createLinearGradient(0, -50, 0, 42);
        cloudGrad.addColorStop(0, '#e2e8f0');
        cloudGrad.addColorStop(1, '#475569');
        ctx.fillStyle = cloudGrad;

        ctx.beginPath();
        ctx.arc(-34, -14, 46, 0, Math.PI * 2);
        ctx.arc(28, -30, 56, 0, Math.PI * 2);
        ctx.arc(72, 5, 38, 0, Math.PI * 2);
        ctx.arc(-68, 10, 34, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    },
    [condition.id, isNight]
  );

  // Render High-Resolution Canvas Card (supports 16:9 Landscape 1200x675 & 4:5 Portrait 1080x1350)
  const renderCanvasCard = useCallback(async (): Promise<HTMLCanvasElement | null> => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const isPortrait = cardFormat === 'portrait';
    const w = isPortrait ? 1080 : 1200;
    const h = isPortrait ? 1350 : 675;
    canvas.width = w;
    canvas.height = h;

    // 1. Deep Atmospheric Background Gradient
    const bgGrad = ctx.createLinearGradient(0, 0, w, h);
    bgGrad.addColorStop(0, theme.bgStops[0]);
    bgGrad.addColorStop(0.35, theme.bgStops[1]);
    bgGrad.addColorStop(0.7, theme.bgStops[2]);
    bgGrad.addColorStop(1, theme.bgStops[3]);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // 2. Dual Atmospheric Radial Nebula Halos
    const topNebulaX = w - 240;
    const topNebulaY = 160;
    const topNebula = ctx.createRadialGradient(topNebulaX, topNebulaY, 0, topNebulaX, topNebulaY, 360);
    topNebula.addColorStop(0, theme.nebulaTopRgba);
    topNebula.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = topNebula;
    ctx.beginPath();
    ctx.arc(topNebulaX, topNebulaY, 360, 0, Math.PI * 2);
    ctx.fill();

    const botNebulaX = 240;
    const botNebulaY = h - 160;
    const botNebula = ctx.createRadialGradient(botNebulaX, botNebulaY, 0, botNebulaX, botNebulaY, 340);
    botNebula.addColorStop(0, theme.nebulaBottomRgba);
    botNebula.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = botNebula;
    ctx.beginPath();
    ctx.arc(botNebulaX, botNebulaY, 340, 0, Math.PI * 2);
    ctx.fill();

    // 3. Celestial Starfield
    const stars = [
      { x: 0.1 * w, y: 0.12 * h, r: 1.5, o: 0.75 },
      { x: 0.24 * w, y: 0.18 * h, r: 2, o: 0.55 },
      { x: 0.42 * w, y: 0.09 * h, r: 1.3, o: 0.85 },
      { x: 0.68 * w, y: 0.11 * h, r: 2.1, o: 0.8 },
      { x: 0.88 * w, y: 0.14 * h, r: 1.6, o: 0.7 },
      { x: 0.15 * w, y: 0.78 * h, r: 1.8, o: 0.6 },
      { x: 0.82 * w, y: 0.84 * h, r: 2.2, o: 0.75 },
    ];
    stars.forEach((s) => {
      ctx.fillStyle = `rgba(255, 255, 255, ${s.o})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // 4. Main Glass Card Frame
    const pad = isPortrait ? 48 : 38;
    const cardW = w - pad * 2;
    const cardH = h - pad * 2;
    const cardRad = 30;

    const cardGrad = ctx.createLinearGradient(pad, pad, pad + cardW, pad + cardH);
    cardGrad.addColorStop(0, theme.cardStops[0]);
    cardGrad.addColorStop(0.5, theme.cardStops[1]);
    cardGrad.addColorStop(1, theme.cardStops[2]);
    ctx.fillStyle = cardGrad;
    drawRoundedRect(ctx, pad, pad, cardW, cardH, cardRad);
    ctx.fill();

    ctx.strokeStyle = theme.borderRgba;
    ctx.lineWidth = 2;
    drawRoundedRect(ctx, pad, pad, cardW, cardH, cardRad);
    ctx.stroke();

    const innerX = pad + 42;
    const innerRightX = w - pad - 42;

    // 5. Top Header Bar
    ctx.fillStyle = theme.accentHex;
    ctx.font = 'bold 23px Outfit, "Plus Jakarta Sans", sans-serif';
    ctx.fillText('✦ WEATHERAETHER', innerX, pad + 52);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.64)';
    ctx.font = '500 14px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(
      showCoords ? `${t.brandSubtitle}  •  📍 ${coordsText}` : t.brandSubtitle,
      innerX,
      pad + 78
    );

    // Date & Local Observation Clock (Top-Right)
    ctx.textAlign = 'right';
    ctx.fillStyle = theme.accentSecondaryHex;
    ctx.font = '700 17px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(`${timeFormatted}  •  ${dateFormatted}`, innerRightX, pad + 56);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.font = '600 13px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(`🌅 ${sunriseStr}   🌇 ${sunsetStr}`, innerRightX, pad + 78);
    ctx.textAlign = 'left';

    // Divider Line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(innerX, pad + 98);
    ctx.lineTo(innerRightX, pad + 98);
    ctx.stroke();

    const metricsData = [
      {
        label: t.wind,
        val: `${windDisplay} ${speedUnit}`,
        sub: `${lang === 'id' ? 'Arah' : 'Dir'} ${windDir}`,
        icon: '💨',
      },
      {
        label: t.humidity,
        val: `${weather.main.humidity}%`,
        sub: `${lang === 'id' ? 'Embun' : 'Dew'} ${dewPointDisplay}`,
        icon: '💧',
      },
      {
        label: t.airPressure,
        val: `${weather.main.pressure} hPa`,
        sub: weather.main.pressure >= 1013 ? 'Normal-Tinggi' : 'Rendah',
        icon: '🧭',
      },
      {
        label: 'AQI',
        val: aqiLabel,
        sub: `Indeks #${aqiScore}/5`,
        icon: '🍃',
      },
      {
        label: lang === 'id' ? 'Jarak Pandang' : 'Visibility',
        val: `${visibilityKm} km`,
        sub: Number(visibilityKm) >= 8 ? (lang === 'id' ? 'Jernih' : 'Clear') : 'Terbatas',
        icon: '👁️',
      },
      {
        label: lang === 'id' ? 'Matahari' : 'Sun Cycle',
        val: `${sunriseStr} / ${sunsetStr}`,
        sub: lang === 'id' ? 'Terbit & Terbenam' : 'Sunrise & Sunset',
        icon: '☀️',
      },
    ];

    if (!isPortrait) {
      // ======================================================================
      // LANDSCAPE 16:9 LAYOUT (1200 x 675)
      // ======================================================================
      // City Name
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 46px Outfit, "Plus Jakarta Sans", sans-serif';
      ctx.fillText(`${weather.name}, ${weather.sys.country}`, innerX, pad + 160);

      // Condition Pill
      const pillText = translatedDesc.toUpperCase();
      ctx.font = '700 14px "Plus Jakarta Sans", sans-serif';
      const pillW = ctx.measureText(pillText).width + 34;
      const pillH = 32;
      const pillY = pad + 178;

      ctx.fillStyle = theme.pillBgRgba;
      drawRoundedRect(ctx, innerX, pillY, pillW, pillH, 16);
      ctx.fill();
      ctx.strokeStyle = theme.pillBorderRgba;
      ctx.lineWidth = 1.2;
      drawRoundedRect(ctx, innerX, pillY, pillW, pillH, 16);
      ctx.stroke();

      ctx.fillStyle = theme.accentHex;
      ctx.fillText(pillText, innerX + 17, pillY + 21);

      // Huge Main Temperature
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 104px Outfit, "Plus Jakarta Sans", sans-serif';
      const tempNumStr = `${Math.round(weather.main.temp)}`;
      ctx.fillText(tempNumStr, innerX, pad + 318);

      const tempNumWidth = ctx.measureText(tempNumStr).width;
      ctx.fillStyle = theme.accentHex;
      ctx.font = '700 44px Outfit, "Plus Jakarta Sans", sans-serif';
      ctx.fillText(unitSymbol, innerX + 6 + tempNumWidth, pad + 264);

      // Feels Like & High/Low Range
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.font = '600 19px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(
        `${t.feelsLike} ${Math.round(weather.main.feels_like)}°   •   Max ${Math.round(
          weather.main.temp_max
        )}° / Min ${Math.round(weather.main.temp_min)}°`,
        innerX,
        pad + 356
      );

      // Optional Custom Note Banner
      if (customNote.trim()) {
        const noteStr = `"${customNote.trim().slice(0, 78)}"`;
        ctx.fillStyle = theme.accentHex;
        ctx.font = 'italic 600 16px "Plus Jakarta Sans", sans-serif';
        ctx.fillText(noteStr, innerX, pad + 388);
      }

      // Vector Weather Art on Right
      drawCanvasWeatherArt(ctx, w - pad - 185, pad + 240, 1.05);

      // 6-Capsule Telemetry Grid (3 columns x 2 rows)
      const gridTopY = pad + 412;
      const cols = 3;
      const gapX = 16;
      const gapY = 12;
      const totalGridW = cardW - 84;
      const boxW = (totalGridW - gapX * (cols - 1)) / cols;
      const boxH = 66;

      metricsData.forEach((m, idx) => {
        const col = idx % cols;
        const row = Math.floor(idx / cols);
        const bx = innerX + col * (boxW + gapX);
        const by = gridTopY + row * (boxH + gapY);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.32)';
        drawRoundedRect(ctx, bx, by, boxW, boxH, 14);
        ctx.fill();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.10)';
        ctx.lineWidth = 1;
        drawRoundedRect(ctx, bx, by, boxW, boxH, 14);
        ctx.stroke();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.62)';
        ctx.font = '700 12px "Plus Jakarta Sans", sans-serif';
        ctx.fillText(`${m.icon} ${m.label.toUpperCase()}`, bx + 14, by + 23);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 20px Outfit, "Plus Jakarta Sans", sans-serif';
        ctx.fillText(m.val, bx + 14, by + 50);

        ctx.textAlign = 'right';
        ctx.fillStyle = theme.accentSecondaryHex;
        ctx.font = '600 12px "Plus Jakarta Sans", sans-serif';
        ctx.fillText(m.sub, bx + boxW - 14, by + 49);
        ctx.textAlign = 'left';
      });

      // Verified Station Footer
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.font = '600 12px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(
        'WEATHERAETHER.APP  •  REAL-TIME ATMOSPHERIC TELEMETRY',
        innerX,
        h - pad - 14
      );
    } else {
      // ======================================================================
      // PORTRAIT 4:5 STORY LAYOUT (1080 x 1350)
      // ======================================================================
      const centerX = w / 2;

      // City Name Centered
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 58px Outfit, "Plus Jakarta Sans", sans-serif';
      ctx.fillText(`${weather.name}, ${weather.sys.country}`, centerX, pad + 185);

      // Condition Pill Centered
      const pillText = translatedDesc.toUpperCase();
      ctx.font = '700 16px "Plus Jakarta Sans", sans-serif';
      const pillW = ctx.measureText(pillText).width + 44;
      const pillH = 38;
      const pillX = centerX - pillW / 2;
      const pillY = pad + 210;

      ctx.fillStyle = theme.pillBgRgba;
      drawRoundedRect(ctx, pillX, pillY, pillW, pillH, 19);
      ctx.fill();
      ctx.strokeStyle = theme.pillBorderRgba;
      ctx.lineWidth = 1.4;
      drawRoundedRect(ctx, pillX, pillY, pillW, pillH, 19);
      ctx.stroke();

      ctx.fillStyle = theme.accentHex;
      ctx.fillText(pillText, centerX, pillY + 25);

      // Large Weather Art Centered
      drawCanvasWeatherArt(ctx, centerX, pad + 390, 1.38);

      // Giant Temperature Centered
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 140px Outfit, "Plus Jakarta Sans", sans-serif';
      ctx.fillText(`${Math.round(weather.main.temp)}${unitSymbol}`, centerX, pad + 625);

      // Feels Like & Range
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.font = '600 24px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(
        `${t.feelsLike} ${Math.round(weather.main.feels_like)}°   •   Max ${Math.round(
          weather.main.temp_max
        )}° / Min ${Math.round(weather.main.temp_min)}°`,
        centerX,
        pad + 675
      );

      // Custom Note Quote Box if present
      if (customNote.trim()) {
        ctx.fillStyle = theme.accentHex;
        ctx.font = 'italic 600 21px "Plus Jakarta Sans", sans-serif';
        ctx.fillText(`"${customNote.trim().slice(0, 75)}"`, centerX, pad + 722);
      }
      ctx.textAlign = 'left';

      // 6-Capsule Telemetry Grid (2 columns x 3 rows)
      const gridTopY = pad + 765;
      const cols = 2;
      const gapX = 20;
      const gapY = 18;
      const totalGridW = cardW - 84;
      const boxW = (totalGridW - gapX) / 2;
      const boxH = 112;

      metricsData.forEach((m, idx) => {
        const col = idx % cols;
        const row = Math.floor(idx / cols);
        const bx = innerX + col * (boxW + gapX);
        const by = gridTopY + row * (boxH + gapY);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.34)';
        drawRoundedRect(ctx, bx, by, boxW, boxH, 18);
        ctx.fill();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.lineWidth = 1.2;
        drawRoundedRect(ctx, bx, by, boxW, boxH, 18);
        ctx.stroke();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
        ctx.font = '700 15px "Plus Jakarta Sans", sans-serif';
        ctx.fillText(`${m.icon}  ${m.label.toUpperCase()}`, bx + 22, by + 36);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 30px Outfit, "Plus Jakarta Sans", sans-serif';
        ctx.fillText(m.val, bx + 22, by + 76);

        ctx.fillStyle = theme.accentSecondaryHex;
        ctx.font = '600 14px "Plus Jakarta Sans", sans-serif';
        ctx.fillText(m.sub, bx + 22, by + 98);
      });

      // Footer
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.font = '600 14px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(
        '✦ WEATHERAETHER.APP  •  REAL-TIME ATMOSPHERIC TELEMETRY ✦',
        centerX,
        h - pad - 24
      );
      ctx.textAlign = 'left';
    }

    return canvas;
  }, [
    cardFormat,
    theme,
    showCoords,
    coordsText,
    timeFormatted,
    dateFormatted,
    sunriseStr,
    sunsetStr,
    windDisplay,
    speedUnit,
    windDir,
    weather,
    dewPointDisplay,
    aqiLabel,
    aqiScore,
    visibilityKm,
    lang,
    t,
    translatedDesc,
    unitSymbol,
    customNote,
    drawCanvasWeatherArt,
  ]);

  // 1. Download PNG Image
  const handleDownloadImage = async () => {
    setIsGenerating(true);
    try {
      const canvas = await renderCanvasCard();
      if (!canvas) throw new Error('Canvas unavailable');

      canvas.toBlob((blob) => {
        if (!blob) {
          onShowToast('Gagal memproses gambar.', 'error');
          setIsGenerating(false);
          return;
        }

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `WeatherAether-${weather.name.replace(/\s+/g, '_')}-${cardFormat}-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();

        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          setIsGenerating(false);
          onShowToast(t.downloadSuccessToast, 'success');
        }, 300);
      }, 'image/png');
    } catch (err) {
      console.error(err);
      setIsGenerating(false);
      onShowToast('Gagal mengunduh gambar kartu.', 'error');
    }
  };

  // Cross-browser reliable clipboard copy helper
  const copyTextToClipboard = async (text: string): Promise<boolean> => {
    if (!text) return false;

    if (
      typeof navigator !== 'undefined' &&
      navigator.clipboard &&
      typeof navigator.clipboard.writeText === 'function'
    ) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (clipErr) {
        console.warn('navigator.clipboard.writeText failed, using execCommand fallback:', clipErr);
      }
    }

    if (typeof document !== 'undefined') {
      try {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.top = '0';
        textArea.style.left = '0';
        textArea.style.width = '2em';
        textArea.style.height = '2em';
        textArea.style.padding = '0';
        textArea.style.border = 'none';
        textArea.style.outline = 'none';
        textArea.style.boxShadow = 'none';
        textArea.style.background = 'transparent';
        textArea.style.opacity = '0.01';
        textArea.style.pointerEvents = 'none';
        textArea.setAttribute('readonly', '');

        document.body.appendChild(textArea);
        textArea.focus({ preventScroll: true });
        textArea.select();

        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        if (successful) return true;
      } catch (fallbackErr) {
        console.error('execCommand copy failed:', fallbackErr);
      }
    }

    return false;
  };

  // 2. Copy Image to Clipboard
  const handleCopyImage = async () => {
    setIsGenerating(true);
    try {
      const canvas = await renderCanvasCard();
      if (!canvas) throw new Error('Canvas unavailable');

      const createBlobPromise = () =>
        new Promise<Blob>((resolve, reject) => {
          canvas.toBlob((b) => {
            if (b) resolve(b);
            else reject(new Error('Failed to generate image blob'));
          }, 'image/png');
        });

      const hasClipboardItem =
        typeof navigator !== 'undefined' &&
        navigator.clipboard &&
        typeof navigator.clipboard.write === 'function' &&
        typeof ClipboardItem !== 'undefined';

      if (!hasClipboardItem) {
        if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
          await handleNativeShare();
          return;
        }
        await handleDownloadImage();
        onShowToast(
          lang === 'id'
            ? 'Browser tidak mendukung salin clipboard gambar langsung. Gambar kartu otomatis diunduh (PNG)!'
            : 'Browser does not support direct clipboard image copy. PNG downloaded automatically!',
          'info'
        );
        return;
      }

      let copySuccess = false;
      try {
        const item = new ClipboardItem({
          'image/png': createBlobPromise(),
        });
        await navigator.clipboard.write([item]);
        copySuccess = true;
      } catch {
        try {
          const blob = await createBlobPromise();
          const item = new ClipboardItem({
            'image/png': blob,
          });
          await navigator.clipboard.write([item]);
          copySuccess = true;
        } catch (directErr) {
          console.error('Direct blob write also failed:', directErr);
        }
      }

      setIsGenerating(false);

      if (copySuccess) {
        setIsImageCopied(true);
        onShowToast(
          lang === 'id'
            ? 'Gambar kartu cuaca berhasil disalin! Langsung tempel (Ctrl+V / Paste) di WhatsApp, Telegram, dll.'
            : 'Weather card image copied! Paste (Ctrl+V) it anywhere.',
          'success'
        );
        setTimeout(() => setIsImageCopied(false), 3000);
      } else {
        await handleDownloadImage();
      }
    } catch (err) {
      console.error('handleCopyImage error:', err);
      setIsGenerating(false);
      await handleDownloadImage();
    }
  };

  // 3. Web Share API
  const handleNativeShare = async () => {
    setIsGenerating(true);
    const directUrl = getDirectUrl();
    const hasNativeShare =
      typeof navigator !== 'undefined' && typeof navigator.share === 'function';

    if (hasNativeShare) {
      try {
        let fileToShare: File | null = null;
        if (typeof navigator.canShare === 'function') {
          try {
            const canvas = await renderCanvasCard();
            if (canvas) {
              const blob = await new Promise<Blob | null>((resolve) =>
                canvas.toBlob(resolve, 'image/png')
              );
              if (blob) {
                const file = new File(
                  [blob],
                  `WeatherAether-${weather.name.replace(/\s+/g, '_')}.png`,
                  { type: 'image/png' }
                );
                if (navigator.canShare({ files: [file] })) {
                  fileToShare = file;
                }
              }
            }
          } catch (prepErr) {
            console.warn('Canvas file preparation failed:', prepErr);
          }
        }

        if (fileToShare) {
          await navigator.share({
            title: `WeatherAether — ${weather.name}`,
            text: shareSummaryText,
            files: [fileToShare],
          });
        } else {
          await navigator.share({
            title: `WeatherAether — ${weather.name}`,
            text: shareSummaryText,
            url: directUrl || window.location.href,
          });
        }
        onShowToast(t.sharedSuccessToast, 'success');
        setIsGenerating(false);
        return;
      } catch (err: unknown) {
        const error = err as Error;
        if (error?.name === 'AbortError') {
          setIsGenerating(false);
          return;
        }
      }
    }

    const textToCopy = `${shareSummaryText}\n\n🔗 ${directUrl}`;
    const copied = await copyTextToClipboard(textToCopy);
    setIsGenerating(false);

    if (copied) {
      setIsCopied(true);
      onShowToast(t.textCopiedToast, 'success');
      setTimeout(() => setIsCopied(false), 2500);
    }
  };

  // 4. Copy Text Summary
  const handleCopyText = async () => {
    const directUrl = getDirectUrl();
    const textToCopy = `${shareSummaryText}\n\n🔗 ${directUrl}`;
    const success = await copyTextToClipboard(textToCopy);
    if (success) {
      setIsCopied(true);
      onShowToast(t.textCopiedToast, 'success');
      setTimeout(() => setIsCopied(false), 2500);
    }
  };

  // 5. Copy Direct City Link
  const handleCopyLink = async () => {
    const directUrl = getDirectUrl();
    const success = await copyTextToClipboard(directUrl);
    if (success) {
      setIsLinkCopied(true);
      onShowToast(t.linkCopiedToast, 'success');
      setTimeout(() => setIsLinkCopied(false), 2500);
    }
  };

  // 6. Direct Social Share Links
  const handleShareWhatsApp = () => {
    const directUrl = getDirectUrl();
    const msg = encodeURIComponent(`${shareSummaryText}\n\n🔗 ${directUrl}`);
    window.open(`https://api.whatsapp.com/send?text=${msg}`, '_blank', 'noopener,noreferrer');
  };

  const handleShareTelegram = () => {
    const directUrl = getDirectUrl();
    const msg = encodeURIComponent(shareSummaryText);
    window.open(
      `https://t.me/share/url?url=${encodeURIComponent(directUrl)}&text=${msg}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  const handleShareTwitter = () => {
    const directUrl = getDirectUrl();
    const text = encodeURIComponent(
      `Cuaca di ${weather.name}: ${Math.round(weather.main.temp)}${unitSymbol} (${translatedDesc})${
        customNote.trim() ? ` — "${customNote.trim()}"` : ''
      } #WeatherAether`
    );
    window.open(
      `https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(directUrl)}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="glass-card modal-container aether-card-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-modal-title"
        tabIndex={-1}
      >
        {/* Modal Header */}
        <div className="modal-header share-studio-header">
          <div className="share-studio-title-group">
            <div className="share-studio-badge-row">
              <span className="share-studio-kicker">
                <Sparkles size={12} />
                <span>WEATHERAETHER CARD STUDIO</span>
              </span>
              <span className="share-resolution-tag">
                {cardFormat === 'landscape' ? '1200×675 HD (16:9)' : '1080×1350 HD (4:5)'}
              </span>
            </div>
            <h3 className="modal-title" id="share-modal-title">
              {t.shareTitle}
            </h3>
            <span className="modal-subtitle">{t.shareSubtitle}</span>
          </div>
          <button
            className="modal-close-btn"
            onClick={onClose}
            title={t.closeShare}
            aria-label={t.closeShare}
            autoFocus
          >
            <X size={20} />
          </button>
        </div>

        {/* Hidden Canvas for High-Resolution Vector Export */}
        <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>

        {/* 1. LIVE INTERACTIVE WEATHER CARD PREVIEW (HERO SPOTLIGHT) */}
        <div
          className={`aether-rendered-card-preview theme-${selectedTheme} format-${cardFormat}`}
          style={{
            background: `linear-gradient(145deg, ${theme.cardStops[0]} 0%, ${theme.cardStops[1]} 52%, ${theme.cardStops[2]} 100%)`,
            borderColor: theme.borderRgba,
          }}
        >
          {/* Ambient Nebula Glows inside Preview */}
          <div
            className="preview-nebula-glow top-right"
            style={{
              background: `radial-gradient(circle, ${theme.nebulaTopRgba} 0%, transparent 72%)`,
            }}
          />
          <div
            className="preview-nebula-glow bottom-left"
            style={{
              background: `radial-gradient(circle, ${theme.nebulaBottomRgba} 0%, transparent 72%)`,
            }}
          />

          {/* Card Header: Brand + Coords + Local Time & Date */}
          <div className="preview-top">
            <div className="preview-brand-stack">
              <div className="preview-branding" style={{ color: theme.accentHex }}>
                <CloudSun size={17} color={theme.accentHex} />
                <span>WeatherAether</span>
              </div>
              {showCoords && (
                <span className="preview-coords-chip">
                  <MapPin size={10} />
                  <span>{coordsText}</span>
                </span>
              )}
            </div>

            <div className="preview-datetime-stack">
              <span className="preview-date" style={{ color: theme.accentSecondaryHex }}>
                <Clock size={11} style={{ display: 'inline', marginRight: 4, verticalAlign: -1 }} />
                {timeFormatted} &bull; {dateFormatted}
              </span>
              <span className="preview-sun-mini">
                🌅 {sunriseStr} &nbsp;&bull;&nbsp; 🌇 {sunsetStr}
              </span>
            </div>
          </div>

          {/* Card Center: City, Condition Pill, Giant Temp, Feels Like & Weather Hero Art */}
          <div className="preview-center">
            <div className="preview-info-col">
              <h2 className="preview-city">
                {weather.name}, {weather.sys.country}
              </h2>
              <span
                className="preview-pill"
                style={{
                  background: theme.pillBgRgba,
                  borderColor: theme.pillBorderRgba,
                  color: theme.accentHex,
                }}
              >
                {translatedDesc}
              </span>

              <div className="preview-temp">
                <span className="num">{Math.round(weather.main.temp)}</span>
                <span className="unit" style={{ color: theme.accentHex }}>
                  {unitSymbol}
                </span>
              </div>

              <div className="preview-feels-row">
                <span className="feels-tag">
                  {t.feelsLike} <strong>{Math.round(weather.main.feels_like)}°</strong>
                </span>
                <span className="range-tag" style={{ color: theme.accentSecondaryHex }}>
                  H: {Math.round(weather.main.temp_max)}° &bull; L:{' '}
                  {Math.round(weather.main.temp_min)}°
                </span>
              </div>
            </div>

            <div className="preview-art">
              <WeatherHeroArt weatherId={condition.id} isNight={isNight} />
            </div>
          </div>

          {/* Optional Custom Note Quote Banner */}
          {customNote.trim() && (
            <div
              className="preview-custom-note-banner"
              style={{
                borderColor: theme.pillBorderRgba,
                color: theme.accentHex,
              }}
            >
              <MessageSquareQuote size={14} />
              <span>&ldquo;{customNote.trim()}&rdquo;</span>
            </div>
          )}

          {/* 6-Item Telemetry Grid */}
          <div className="preview-metrics">
            <div className="p-item">
              <Wind size={14} color={theme.accentSecondaryHex} />
              <div className="p-item-text">
                <span className="p-item-label">{t.wind}</span>
                <strong className="p-item-val">
                  {windDisplay} {speedUnit} <small>({windDir})</small>
                </strong>
              </div>
            </div>

            <div className="p-item">
              <Droplets size={14} color={theme.accentSecondaryHex} />
              <div className="p-item-text">
                <span className="p-item-label">{t.humidity}</span>
                <strong className="p-item-val">
                  {weather.main.humidity}% <small>({dewPointDisplay})</small>
                </strong>
              </div>
            </div>

            <div className="p-item">
              <Gauge size={14} color={theme.accentSecondaryHex} />
              <div className="p-item-text">
                <span className="p-item-label">{t.airPressure}</span>
                <strong className="p-item-val">{weather.main.pressure} hPa</strong>
              </div>
            </div>

            <div className="p-item">
              <Leaf size={14} color={theme.accentSecondaryHex} />
              <div className="p-item-text">
                <span className="p-item-label">{ lang === 'id' ? 'Kualitas Udara' : 'Air Quality' }</span>
                <strong className="p-item-val">AQI {aqiLabel}</strong>
              </div>
            </div>

            <div className="p-item">
              <Eye size={14} color={theme.accentSecondaryHex} />
              <div className="p-item-text">
                <span className="p-item-label">{lang === 'id' ? 'Jarak Pandang' : 'Visibility'}</span>
                <strong className="p-item-val">{visibilityKm} km</strong>
              </div>
            </div>

            <div className="p-item">
              <Sunrise size={14} color={theme.accentSecondaryHex} />
              <div className="p-item-text">
                <span className="p-item-label">{lang === 'id' ? 'Siklus Surya' : 'Sun Cycle'}</span>
                <strong className="p-item-val">
                  {sunriseStr} / {sunsetStr}
                </strong>
              </div>
            </div>
          </div>

          {/* Card Footer Watermark */}
          <div className="preview-footer-bar">
            <span>✦ WEATHERAETHER.APP</span>
            <span>
              {lang === 'id'
                ? 'TELEMETRI ATMOSFER REAL-TIME'
                : 'REAL-TIME ATMOSPHERIC TELEMETRY'}
            </span>
          </div>
        </div>

        {/* 2. STUDIO CUSTOMIZATION BAR (THEME, FORMAT & CUSTOM CAPTION) */}
        <div className="share-studio-customizer">
          <div className="studio-customizer-row">
            {/* Theme Picker */}
            <div className="studio-control-group">
              <span className="studio-control-label">
                <Palette size={13} />
                <span>{lang === 'id' ? 'Tema Kartu' : 'Card Theme'}</span>
              </span>
              <div className="studio-theme-pills">
                {(Object.keys(CARD_THEMES) as CardThemeId[]).map((tKey) => {
                  const tc = CARD_THEMES[tKey];
                  const active = selectedTheme === tKey;
                  return (
                    <button
                      key={tKey}
                      type="button"
                      className={`studio-theme-btn ${active ? 'active' : ''}`}
                      onClick={() => setSelectedTheme(tKey)}
                      title={tc.name[lang]}
                    >
                      <span
                        className="theme-swatch-dot"
                        style={{ background: tc.swatch }}
                      />
                      <span>{tc.name[lang]}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Format & GPS Toggle */}
            <div className="studio-control-group">
              <span className="studio-control-label">
                <LayoutTemplate size={13} />
                <span>{lang === 'id' ? 'Rasio & Info' : 'Format & Info'}</span>
              </span>
              <div className="studio-format-pills">
                <button
                  type="button"
                  className={`studio-format-btn ${cardFormat === 'landscape' ? 'active' : ''}`}
                  onClick={() => setCardFormat('landscape')}
                >
                  <span>16:9 Landscape</span>
                </button>
                <button
                  type="button"
                  className={`studio-format-btn ${cardFormat === 'portrait' ? 'active' : ''}`}
                  onClick={() => setCardFormat('portrait')}
                >
                  <span>4:5 Story</span>
                </button>
                <button
                  type="button"
                  className={`studio-format-btn ${showCoords ? 'active' : ''}`}
                  onClick={() => setShowCoords((v) => !v)}
                  title={lang === 'id' ? 'Tampilkan Koordinat GPS' : 'Toggle GPS Coordinates'}
                >
                  <MapPin size={12} />
                  <span>GPS</span>
                </button>
              </div>
            </div>
          </div>

          {/* Custom Note / Status Input + Quick Suggestion Chips */}
          <div className="studio-caption-box">
            <div className="studio-caption-input-wrap">
              <MessageSquareQuote size={15} className="caption-icon" />
              <input
                type="text"
                maxLength={75}
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                placeholder={
                  lang === 'id'
                    ? 'Tambahkan pesan/catatan cuaca di kartu (opsional)...'
                    : 'Add a custom weather note on the card (optional)...'
                }
                className="studio-caption-input"
              />
              {customNote && (
                <button
                  type="button"
                  className="caption-clear-btn"
                  onClick={() => setCustomNote('')}
                  aria-label="Clear note"
                >
                  <X size={13} />
                </button>
              )}
            </div>
            <div className="studio-quick-captions">
              {quickCaptions.map((cap, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`quick-caption-chip ${customNote === cap ? 'active' : ''}`}
                  onClick={() => setCustomNote(customNote === cap ? '' : cap)}
                >
                  {cap}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 3. EXPORT & SHARE ACTIONS DECK */}
        <div className="aether-export-deck">
          {/* Primary Action Buttons */}
          <div className="aether-action-grid">
            <button
              className="aether-action-btn primary"
              onClick={handleDownloadImage}
              disabled={isGenerating}
              title={t.downloadImage}
              id="btn-save-weather-image"
            >
              <Download size={18} />
              <span>
                {isGenerating
                  ? lang === 'id'
                    ? 'Merender HD...'
                    : 'Rendering HD...'
                  : `${t.downloadImage} (${cardFormat === 'landscape' ? '16:9' : '4:5'})`}
              </span>
            </button>

            <button
              className="aether-action-btn secondary"
              onClick={handleCopyImage}
              disabled={isGenerating}
              title={t.copyImage}
            >
              {isImageCopied ? <Check size={17} color="#4ade80" /> : <ImageIcon size={17} />}
              <span className="btn-label-desktop">
                {isImageCopied
                  ? lang === 'id'
                    ? 'Gambar Tersalin!'
                    : 'Image Copied!'
                  : t.copyImage}
              </span>
              <span className="btn-label-mobile">
                {isImageCopied
                  ? lang === 'id'
                    ? 'Tersalin!'
                    : 'Copied!'
                  : lang === 'id'
                    ? 'Salin Gambar'
                    : 'Copy Image'}
              </span>
            </button>

            <button
              className="aether-action-btn secondary"
              onClick={handleNativeShare}
              disabled={isGenerating}
              title={t.shareToApps}
            >
              <Share2 size={17} />
              <span className="btn-label-desktop">{t.shareToApps}</span>
              <span className="btn-label-mobile">{lang === 'id' ? 'Bagikan' : 'Share'}</span>
            </button>
          </div>

          {/* Quick Channels & Link Share Row */}
          <div className="aether-channels-grid">
            <button
              className="aether-channel-button channel-wa"
              onClick={handleShareWhatsApp}
              title="Bagikan ke WhatsApp"
            >
              <MessageCircle size={15} color="#4ade80" />
              <span className="channel-label">WhatsApp</span>
            </button>

            <button
              className="aether-channel-button channel-tg"
              onClick={handleShareTelegram}
              title="Bagikan ke Telegram"
            >
              <Send size={14} color="#38bdf8" />
              <span className="channel-label">Telegram</span>
            </button>

            <button
              className="aether-channel-button channel-x"
              onClick={handleShareTwitter}
              title="Bagikan ke X / Twitter"
            >
              <span className="channel-icon">𝕏</span>
              <span className="channel-label">Post X</span>
            </button>

            <button
              className="aether-channel-button channel-url"
              onClick={handleCopyLink}
              title={t.copyLink}
            >
              {isLinkCopied ? (
                <Check size={15} color="#4ade80" />
              ) : (
                <Link2 size={15} color="#38bdf8" />
              )}
              <span className="channel-label">
                {isLinkCopied ? (lang === 'id' ? 'Tersalin!' : 'Copied!') : t.copyLink}
              </span>
            </button>

            <button
              className="aether-channel-button channel-summary"
              onClick={handleCopyText}
              title={t.copyTextInfo}
            >
              {isCopied ? <Check size={15} color="#4ade80" /> : <Copy size={15} color="#fef08a" />}
              <span className="channel-label">
                {isCopied ? (lang === 'id' ? 'Tersalin!' : 'Copied!') : t.copyTextInfo}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

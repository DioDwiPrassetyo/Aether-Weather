'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  X,
  Download,
  Share2,
  Copy,
  Check,
  Link2,
  Sparkles,
  CloudSun,
  Wind,
  Droplets,
  Gauge,
  Leaf,
  Image as ImageIcon,
} from 'lucide-react';
import { CurrentWeatherResponse, AirPollutionResponse, UnitType } from '@/types/weather';
import { Language, getTranslation } from '@/utils/i18n';
import { WeatherHeroArt } from './WeatherIcons';

interface ShareWeatherModalProps {
  isOpen: boolean;
  onClose: () => void;
  weather: CurrentWeatherResponse;
  pollution: AirPollutionResponse | null;
  unit: UnitType;
  lang?: Language;
  onShowToast: (msg: string, type?: 'info' | 'success' | 'error') => void;
}

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

  const unitSymbol = unit === 'metric' ? '°C' : '°F';
  const speedUnit = unit === 'metric' ? 'km/j' : 'mph';
  const windDisplay =
    unit === 'metric' ? Math.round(weather.wind.speed * 3.6) : Math.round(weather.wind.speed);

  const condition = weather.weather[0];
  const isNight = condition.icon.endsWith('n');
  const translatedDesc =
    t.descriptions[condition.description.toLowerCase()] || condition.description;
  const aqiScore = pollution?.list?.[0]?.main?.aqi ?? 2;
  const aqiLabel = t.aqiLevels[aqiScore] || 'Normal';

  // Format local date and time
  const now = new Date((weather.dt + weather.timezone) * 1000);
  const dateFormatted = `${t.days[now.getUTCDay()]}, ${now.getUTCDate()} ${
    t.monthsFull[now.getUTCMonth()]
  } ${now.getUTCFullYear()}`;

  // Summary Text
  const shareSummaryText = `🌤️ ${weather.name}, ${weather.sys.country} Weather:
🌡️ ${Math.round(weather.main.temp)}${unitSymbol} (${translatedDesc})
${t.feelsLike}: ${Math.round(weather.main.feels_like)}° | Min: ${Math.round(
    weather.main.temp_min
  )}° / Max: ${Math.round(weather.main.temp_max)}°
💨 ${t.wind}: ${windDisplay} ${speedUnit} | 💧 ${t.humidity}: ${weather.main.humidity}% | 🍃 AQI: ${aqiLabel}
✨ AetherWeather Real-Time Atmospheric Intelligence`;

  const getDirectUrl = () => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}${window.location.pathname}?city=${encodeURIComponent(
      weather.name
    )}`;
  };

  // Draw high-resolution 1200x675 Canvas with Celestial Astronomy Theme & Weather Art
  const renderCanvasCard = useCallback(async (): Promise<HTMLCanvasElement | null> => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // High resolution standard 16:9 for perfect social & device display
    const w = 1200;
    const h = 675;
    canvas.width = w;
    canvas.height = h;

    // 1. Cosmic Deep Space Background
    const bgGrad = ctx.createLinearGradient(0, 0, w, h);
    bgGrad.addColorStop(0, '#090d16');
    bgGrad.addColorStop(0.35, '#0f172a');
    bgGrad.addColorStop(0.7, '#18143c');
    bgGrad.addColorStop(1, '#0b1120');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // 2. Dual Atmospheric Radial Nebula Halos
    // Starlight Golden Nebula (Top-Right)
    const goldNebula = ctx.createRadialGradient(960, 150, 0, 960, 150, 320);
    goldNebula.addColorStop(0, 'rgba(254, 240, 138, 0.24)');
    goldNebula.addColorStop(0.45, 'rgba(99, 102, 241, 0.12)');
    goldNebula.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = goldNebula;
    ctx.beginPath();
    ctx.arc(960, 150, 320, 0, Math.PI * 2);
    ctx.fill();

    // Cyan Atmospheric Nebula (Bottom-Left)
    const cyanNebula = ctx.createRadialGradient(220, 520, 0, 220, 520, 280);
    cyanNebula.addColorStop(0, 'rgba(56, 189, 248, 0.18)');
    cyanNebula.addColorStop(0.6, 'rgba(14, 165, 233, 0.05)');
    cyanNebula.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = cyanNebula;
    ctx.beginPath();
    ctx.arc(220, 520, 280, 0, Math.PI * 2);
    ctx.fill();

    // 3. Scattered Celestial Stars & Sparkles
    const stars = [
      { x: 120, y: 80, r: 1.5, o: 0.8 },
      { x: 260, y: 140, r: 2, o: 0.6 },
      { x: 380, y: 60, r: 1.2, o: 0.9 },
      { x: 500, y: 110, r: 1.8, o: 0.7 },
      { x: 740, y: 70, r: 2.2, o: 0.85 },
      { x: 880, y: 90, r: 1.4, o: 0.6 },
      { x: 1080, y: 70, r: 2, o: 0.75 },
      { x: 1130, y: 180, r: 1.5, o: 0.9 },
      { x: 150, y: 480, r: 1.8, o: 0.65 },
      { x: 720, y: 560, r: 1.3, o: 0.7 },
      { x: 1040, y: 520, r: 2.4, o: 0.8 },
    ];
    stars.forEach((s) => {
      ctx.fillStyle = `rgba(254, 240, 138, ${s.o})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // 4. Main Celestial Glass Card Frame
    const pad = 42;
    const cardW = w - pad * 2;
    const cardH = h - pad * 2;
    const cardRad = 28;

    const cardGrad = ctx.createLinearGradient(pad, pad, pad + cardW, pad + cardH);
    cardGrad.addColorStop(0, 'rgba(15, 23, 42, 0.86)');
    cardGrad.addColorStop(0.5, 'rgba(24, 20, 60, 0.72)');
    cardGrad.addColorStop(1, 'rgba(15, 23, 42, 0.90)');
    ctx.fillStyle = cardGrad;
    drawRoundedRect(ctx, pad, pad, cardW, cardH, cardRad);
    ctx.fill();

    // Starlight Inset Specular Border
    ctx.strokeStyle = 'rgba(254, 240, 138, 0.30)';
    ctx.lineWidth = 1.8;
    drawRoundedRect(ctx, pad, pad, cardW, cardH, cardRad);
    ctx.stroke();

    // Top Header / Branding
    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 24px Outfit, "Plus Jakarta Sans", sans-serif';
    ctx.fillText('✦ AETHER WEATHER', pad + 40, pad + 56);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.font = '500 15px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(t.brandSubtitle, pad + 40, pad + 84);

    // Date (Top-Right)
    ctx.textAlign = 'right';
    ctx.fillStyle = '#bae6fd';
    ctx.font = '600 17px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(dateFormatted, w - pad - 40, pad + 65);
    ctx.textAlign = 'left';

    // Thin Header Divider
    ctx.strokeStyle = 'rgba(254, 240, 138, 0.16)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad + 40, pad + 104);
    ctx.lineTo(w - pad - 40, pad + 104);
    ctx.stroke();

    // 5. Left Content Column: City, Condition Pill, Temperature
    // City Name
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 50px Outfit, "Plus Jakarta Sans", sans-serif';
    const cityText = `${weather.name}, ${weather.sys.country}`;
    ctx.fillText(cityText, pad + 40, pad + 175);

    // Starlight Condition Pill
    const pillX = pad + 40;
    const pillY = pad + 198;
    const pillText = translatedDesc.toUpperCase();
    ctx.font = '700 15px "Plus Jakarta Sans", sans-serif';
    const textWidth = ctx.measureText(pillText).width;
    const pillW = textWidth + 36;
    const pillH = 36;

    ctx.fillStyle = 'rgba(254, 240, 138, 0.14)';
    drawRoundedRect(ctx, pillX, pillY, pillW, pillH, 18);
    ctx.fill();
    ctx.strokeStyle = 'rgba(254, 240, 138, 0.40)';
    ctx.lineWidth = 1.2;
    drawRoundedRect(ctx, pillX, pillY, pillW, pillH, 18);
    ctx.stroke();

    ctx.fillStyle = '#fef08a';
    ctx.fillText(pillText, pillX + 18, pillY + 23);

    // Huge Main Temperature
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 112px Outfit, "Plus Jakarta Sans", sans-serif';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
    ctx.shadowBlur = 16;
    const tempNumStr = `${Math.round(weather.main.temp)}`;
    ctx.fillText(tempNumStr, pad + 40, pad + 355);
    ctx.shadowBlur = 0;

    // Temp Unit Symbol in Gold
    const tempNumWidth = ctx.measureText(tempNumStr).width;
    ctx.fillStyle = '#fef08a';
    ctx.font = '600 48px Outfit, "Plus Jakarta Sans", sans-serif';
    ctx.fillText(unitSymbol, pad + 44 + tempNumWidth, pad + 295);

    // Feels Like & Range Info
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.font = '500 21px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(
      `${t.feelsLike} ${Math.round(weather.main.feels_like)}°   •   Max ${Math.round(
        weather.main.temp_max
      )}°   •   Min ${Math.round(weather.main.temp_min)}°`,
      pad + 40,
      pad + 400
    );

    // 6. Right Column: High-Fidelity Vector Weather Art
    const artCenterX = w - pad - 190;
    const artCenterY = pad + 250;
    const id = condition.id;

    if (id === 800) {
      if (!isNight) {
        // Clear Day: Golden Starlight Sun with Radiating Corona
        const sunCorona = ctx.createRadialGradient(
          artCenterX,
          artCenterY,
          20,
          artCenterX,
          artCenterY,
          135
        );
        sunCorona.addColorStop(0, 'rgba(254, 240, 138, 0.55)');
        sunCorona.addColorStop(0.5, 'rgba(245, 158, 11, 0.20)');
        sunCorona.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = sunCorona;
        ctx.beginPath();
        ctx.arc(artCenterX, artCenterY, 135, 0, Math.PI * 2);
        ctx.fill();

        // 8 Starlight Rays
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        for (let i = 0; i < 8; i++) {
          const angle = (i * Math.PI) / 4;
          const x1 = artCenterX + Math.cos(angle) * 75;
          const y1 = artCenterY + Math.sin(angle) * 75;
          const x2 = artCenterX + Math.cos(angle) * 105;
          const y2 = artCenterY + Math.sin(angle) * 105;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }

        // Sun Core
        const sunCore = ctx.createRadialGradient(
          artCenterX - 15,
          artCenterY - 15,
          0,
          artCenterX,
          artCenterY,
          62
        );
        sunCore.addColorStop(0, '#ffffff');
        sunCore.addColorStop(0.35, '#fef08a');
        sunCore.addColorStop(0.85, '#f59e0b');
        sunCore.addColorStop(1, '#d97706');
        ctx.fillStyle = sunCore;
        ctx.beginPath();
        ctx.arc(artCenterX, artCenterY, 62, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Clear Night: 3D Celestial Moon with Starlight Corona
        const moonCorona = ctx.createRadialGradient(
          artCenterX,
          artCenterY,
          30,
          artCenterX,
          artCenterY,
          130
        );
        moonCorona.addColorStop(0, 'rgba(254, 240, 138, 0.40)');
        moonCorona.addColorStop(0.5, 'rgba(147, 51, 234, 0.15)');
        moonCorona.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = moonCorona;
        ctx.beginPath();
        ctx.arc(artCenterX, artCenterY, 130, 0, Math.PI * 2);
        ctx.fill();

        // Base Dark Moon
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(artCenterX, artCenterY, 65, 0, Math.PI * 2);
        ctx.fill();

        // Illuminated Crescent
        const moonLit = ctx.createRadialGradient(
          artCenterX + 25,
          artCenterY - 15,
          0,
          artCenterX,
          artCenterY,
          65
        );
        moonLit.addColorStop(0, '#ffffff');
        moonLit.addColorStop(0.5, '#fef08a');
        moonLit.addColorStop(1, '#cbd5e1');
        ctx.fillStyle = moonLit;
        ctx.beginPath();
        ctx.arc(artCenterX, artCenterY, 65, -Math.PI / 2, Math.PI / 2, false);
        ctx.bezierCurveTo(
          artCenterX + 10,
          artCenterY + 45,
          artCenterX + 10,
          artCenterY - 45,
          artCenterX,
          artCenterY - 65
        );
        ctx.fill();

        // Sparkling orbital stars
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(artCenterX - 55, artCenterY - 45, 2.5, 0, Math.PI * 2);
        ctx.arc(artCenterX + 65, artCenterY + 55, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (id >= 200 && id < 300) {
      // Thunderstorm: Deep Violet Cloud + Lightning Bolt
      const cloudGrad = ctx.createLinearGradient(
        artCenterX,
        artCenterY - 60,
        artCenterX,
        artCenterY + 40
      );
      cloudGrad.addColorStop(0, '#475569');
      cloudGrad.addColorStop(1, '#1e1b4b');
      ctx.fillStyle = cloudGrad;

      ctx.beginPath();
      ctx.arc(artCenterX - 35, artCenterY - 10, 45, 0, Math.PI * 2);
      ctx.arc(artCenterX + 30, artCenterY - 25, 55, 0, Math.PI * 2);
      ctx.arc(artCenterX + 70, artCenterY + 10, 38, 0, Math.PI * 2);
      ctx.arc(artCenterX - 65, artCenterY + 15, 32, 0, Math.PI * 2);
      ctx.fill();

      // Jagged Golden Lightning Bolt
      ctx.fillStyle = '#fef08a';
      ctx.shadowColor = '#facc15';
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.moveTo(artCenterX + 15, artCenterY - 10);
      ctx.lineTo(artCenterX - 15, artCenterY + 35);
      ctx.lineTo(artCenterX + 8, artCenterY + 35);
      ctx.lineTo(artCenterX - 20, artCenterY + 95);
      ctx.lineTo(artCenterX + 30, artCenterY + 22);
      ctx.lineTo(artCenterX + 8, artCenterY + 22);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
    } else if (id >= 500 && id < 600) {
      // Rain: Volumetric Storm Cloud + Luminous Droplets
      const cloudGrad = ctx.createLinearGradient(
        artCenterX,
        artCenterY - 60,
        artCenterX,
        artCenterY + 40
      );
      cloudGrad.addColorStop(0, '#64748b');
      cloudGrad.addColorStop(1, '#1e293b');
      ctx.fillStyle = cloudGrad;

      ctx.beginPath();
      ctx.arc(artCenterX - 30, artCenterY - 15, 45, 0, Math.PI * 2);
      ctx.arc(artCenterX + 35, artCenterY - 30, 55, 0, Math.PI * 2);
      ctx.arc(artCenterX + 75, artCenterY + 5, 38, 0, Math.PI * 2);
      ctx.arc(artCenterX - 65, artCenterY + 10, 32, 0, Math.PI * 2);
      ctx.fill();

      // Glowing Rain Droplets
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      const rainCoords = [
        { x: artCenterX - 50, y: artCenterY + 45 },
        { x: artCenterX - 20, y: artCenterY + 55 },
        { x: artCenterX + 15, y: artCenterY + 45 },
        { x: artCenterX + 45, y: artCenterY + 55 },
        { x: artCenterX + 70, y: artCenterY + 45 },
      ];
      rainCoords.forEach((r) => {
        ctx.beginPath();
        ctx.moveTo(r.x, r.y);
        ctx.lineTo(r.x - 12, r.y + 30);
        ctx.stroke();
      });
    } else if (id >= 600 && id < 700) {
      // Snow: Frost Cloud + Crystalline Snowflakes
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.arc(artCenterX - 30, artCenterY - 15, 45, 0, Math.PI * 2);
      ctx.arc(artCenterX + 35, artCenterY - 30, 55, 0, Math.PI * 2);
      ctx.arc(artCenterX + 75, artCenterY + 5, 38, 0, Math.PI * 2);
      ctx.fill();

      // Crystal Snowflakes
      ctx.fillStyle = '#e0f2fe';
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText('❄', artCenterX - 40, artCenterY + 65);
      ctx.fillText('✦', artCenterX + 10, artCenterY + 80);
      ctx.fillText('❄', artCenterX + 50, artCenterY + 65);
    } else {
      // Clouds / Atmosphere
      if (!isNight) {
        // Sun behind cloud
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(artCenterX + 40, artCenterY - 40, 42, 0, Math.PI * 2);
        ctx.fill();
      }

      const cloudGrad = ctx.createLinearGradient(
        artCenterX,
        artCenterY - 50,
        artCenterX,
        artCenterY + 45
      );
      cloudGrad.addColorStop(0, '#cbd5e1');
      cloudGrad.addColorStop(1, '#475569');
      ctx.fillStyle = cloudGrad;

      ctx.beginPath();
      ctx.arc(artCenterX - 35, artCenterY - 15, 48, 0, Math.PI * 2);
      ctx.arc(artCenterX + 30, artCenterY - 32, 58, 0, Math.PI * 2);
      ctx.arc(artCenterX + 75, artCenterY + 5, 40, 0, Math.PI * 2);
      ctx.arc(artCenterX - 70, artCenterY + 10, 36, 0, Math.PI * 2);
      ctx.fill();
    }

    // 7. Bottom Metric Capsules Strip (4 Grid Items)
    const bottomY = pad + 440;
    const boxW = 250;
    const boxH = 75;
    const gap = 20;
    const startX = pad + 40;

    const metricsData = [
      { label: t.wind, val: `${windDisplay} ${speedUnit}`, icon: '💨' },
      { label: t.humidity, val: `${weather.main.humidity}%`, icon: '💧' },
      { label: t.airPressure, val: `${weather.main.pressure} hPa`, icon: '🧭' },
      { label: 'AQI', val: aqiLabel, icon: '🍃' },
    ];

    metricsData.forEach((m, idx) => {
      const bx = startX + idx * (boxW + gap);

      // Capsule Background
      const capGrad = ctx.createLinearGradient(bx, bottomY, bx, bottomY + boxH);
      capGrad.addColorStop(0, 'rgba(24, 20, 60, 0.55)');
      capGrad.addColorStop(1, 'rgba(15, 23, 42, 0.75)');
      ctx.fillStyle = capGrad;
      drawRoundedRect(ctx, bx, bottomY, boxW, boxH, 16);
      ctx.fill();

      // Starlight Inset Border
      ctx.strokeStyle = 'rgba(254, 240, 138, 0.18)';
      ctx.lineWidth = 1;
      drawRoundedRect(ctx, bx, bottomY, boxW, boxH, 16);
      ctx.stroke();

      // Icon & Label
      ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
      ctx.font = '600 14px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(`${m.icon}  ${m.label.toUpperCase()}`, bx + 18, bottomY + 30);

      // Value in White with Tabular Numerals
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px Outfit, "Plus Jakarta Sans", sans-serif';
      ctx.fillText(m.val, bx + 18, bottomY + 58);
    });

    return canvas;
  }, [
    weather,
    unitSymbol,
    speedUnit,
    windDisplay,
    condition,
    isNight,
    translatedDesc,
    aqiLabel,
    dateFormatted,
    t,
  ]);

  // 1. Download PNG Image
  const handleDownloadImage = async () => {
    setIsGenerating(true);
    try {
      const canvas = await renderCanvasCard();
      if (!canvas) throw new Error('Canvas unavailable');

      // Use Blob API for reliable cross-browser download
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
        a.download = `AetherWeather-${weather.name.replace(/\s+/g, '_')}-${Date.now()}.png`;
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

  /**
   * Cross-browser reliable clipboard copy helper.
   * Attempts modern navigator.clipboard first, with invisible textarea + execCommand('copy') fallback.
   */
  const copyTextToClipboard = async (text: string): Promise<boolean> => {
    if (!text) return false;

    // 1. Try modern async Clipboard API if available and document is active
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

    // 2. Reliable fallback: Invisible textarea + document.execCommand('copy')
    if (typeof document !== 'undefined') {
      try {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        
        // Prevent scrolling & keep within visible screen bounds
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

        // Special handling for iOS Safari
        const isIOS = navigator.userAgent.match(/ipad|ipod|iphone/i);
        if (isIOS) {
          const range = document.createRange();
          range.selectNodeContents(textArea);
          const selection = window.getSelection();
          if (selection) {
            selection.removeAllRanges();
            selection.addRange(range);
          }
          textArea.setSelectionRange(0, 999999);
        } else {
          textArea.focus({ preventScroll: true });
          textArea.select();
        }

        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        if (successful) return true;
      } catch (fallbackErr) {
        console.error('execCommand copy failed:', fallbackErr);
      }
    }

    return false;
  };

  // 2. Copy Image to Clipboard with Smart Auto-Fallback (Ctrl+V, Share Sheet, or Direct Download)
  const handleCopyImage = async () => {
    setIsGenerating(true);
    try {
      const canvas = await renderCanvasCard();
      if (!canvas) throw new Error('Canvas unavailable');

      // Helper to generate PNG Blob
      const createBlobPromise = () =>
        new Promise<Blob>((resolve, reject) => {
          canvas.toBlob((b) => {
            if (b) resolve(b);
            else reject(new Error('Failed to generate image blob'));
          }, 'image/png');
        });

      // Check if Clipboard API with ClipboardItem is supported
      const hasClipboardItem =
        typeof navigator !== 'undefined' &&
        navigator.clipboard &&
        typeof navigator.clipboard.write === 'function' &&
        typeof ClipboardItem !== 'undefined';

      if (!hasClipboardItem) {
        // Smart Auto-Fallback:
        // 1. If on mobile device with native share, open share sheet with image file!
        if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
          await handleNativeShare();
          return;
        }

        // 2. Otherwise (e.g. desktop Firefox / non-secure HTTP), automatically download PNG!
        await handleDownloadImage();
        onShowToast(
          lang === 'id'
            ? 'Browser tidak mendukung salin clipboard gambar langsung. Gambar kartu cuaca otomatis diunduh (PNG)!'
            : 'Browser does not support direct clipboard image copy. PNG image downloaded automatically!',
          'info'
        );
        return;
      }

      let copySuccess = false;

      // Method 1 (W3C standard for Chrome/Edge/Safari): Pass Promise<Blob> to ClipboardItem
      try {
        const item = new ClipboardItem({
          'image/png': createBlobPromise(),
        });
        await navigator.clipboard.write([item]);
        copySuccess = true;
      } catch (promiseErr) {
        console.warn('ClipboardItem promise write rejected, trying resolved blob:', promiseErr);
        // Method 2 (Fallback for browsers requiring resolved blob):
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
            ? 'Gambar kartu cuaca berhasil disalin! Anda bisa langsung tempel (Ctrl+V / Paste) di WhatsApp, Telegram, dll.'
            : 'Weather card image copied! You can paste (Ctrl+V) it anywhere.',
          'success'
        );
        setTimeout(() => setIsImageCopied(false), 3000);
      } else {
        // Fallback if browser rejected permission at runtime
        if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
          await handleNativeShare();
        } else {
          await handleDownloadImage();
          onShowToast(
            lang === 'id'
              ? 'Izin clipboard gambar dibatasi browser. Gambar kartu cuaca otomatis diunduh (PNG)!'
              : 'Clipboard image copy restricted by browser. PNG image downloaded automatically!',
            'info'
          );
        }
      }
    } catch (err) {
      console.error('handleCopyImage error:', err);
      setIsGenerating(false);
      await handleDownloadImage();
    }
  };

  // 3. Web Share API with image file support & graceful cross-platform fallback
  const handleNativeShare = async () => {
    setIsGenerating(true);
    const directUrl = getDirectUrl();

    // Check if Web Share API is available in current browser environment
    const hasNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

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
                  `AetherWeather-${weather.name.replace(/\s+/g, '_')}.png`,
                  { type: 'image/png' }
                );
                if (navigator.canShare({ files: [file] })) {
                  fileToShare = file;
                }
              }
            }
          } catch (prepErr) {
            console.warn('Canvas file preparation for share failed, sharing text/url instead:', prepErr);
          }
        }

        if (fileToShare) {
          await navigator.share({
            title: `AetherWeather — ${weather.name}`,
            text: `Cuaca saat ini di ${weather.name}: ${Math.round(weather.main.temp)}${unitSymbol} (${translatedDesc})`,
            files: [fileToShare],
          });
        } else {
          await navigator.share({
            title: `AetherWeather — ${weather.name}`,
            text: `Cuaca saat ini di ${weather.name}: ${Math.round(weather.main.temp)}${unitSymbol} (${translatedDesc})`,
            url: directUrl || window.location.href,
          });
        }
        onShowToast(t.sharedSuccessToast, 'success');
        setIsGenerating(false);
        return;
      } catch (err: unknown) {
        const error = err as Error;
        // User cancelled / dismissed the native share sheet
        if (error?.name === 'AbortError') {
          setIsGenerating(false);
          return;
        }
        console.warn('Native share failed or rejected, falling back to clipboard copy:', err);
      }
    }

    // Fallback: If device has no native share sheet or share failed
    const textToCopy = `${shareSummaryText}\n\n🔗 ${directUrl}`;
    const copied = await copyTextToClipboard(textToCopy);
    setIsGenerating(false);

    if (copied) {
      setIsCopied(true);
      onShowToast(
        hasNativeShare
          ? t.textCopiedToast
          : (lang === 'id'
              ? 'Menu berbagi langsung tidak didukung di browser ini. Ringkasan & tautan cuaca berhasil disalin!'
              : 'Direct sharing not supported. Weather summary & link copied to clipboard!'),
        'success'
      );
      setTimeout(() => setIsCopied(false), 2500);
    } else {
      onShowToast(lang === 'id' ? 'Gagal menyalin ringkasan cuaca.' : 'Failed to copy weather summary.', 'error');
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
    } else {
      onShowToast(lang === 'id' ? 'Gagal menyalin teks ringkasan.' : 'Failed to copy text summary.', 'error');
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
    } else {
      onShowToast(lang === 'id' ? 'Gagal menyalin tautan.' : 'Failed to copy link.', 'error');
    }
  };

  // 6. Direct Social App Share Links
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
      `Cuaca di ${weather.name}: ${Math.round(weather.main.temp)}${unitSymbol} (${translatedDesc}) #AetherWeather`
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
      >
        {/* Header */}
        <div className="modal-header">
          <div>
            <h3 className="modal-title">{t.shareTitle}</h3>
            <span className="modal-subtitle">{t.shareSubtitle}</span>
          </div>
          <button className="modal-close-btn" onClick={onClose} title={t.closeShare}>
            <X size={20} />
          </button>
        </div>

        {/* Hidden Canvas for High-Resolution Vector Export */}
        <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>

        {/* 1. Primary Download & Share Options - ALWAYS VISIBLE FIRST! */}
        <div className="aether-export-deck">
          <div className="aether-deck-header">
            <span className="aether-deck-title">
              {lang === 'id' ? '✦ OPSI UNDUH & BAGIKAN' : '✦ DOWNLOAD & SHARE OPTIONS'}
            </span>
          </div>

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
              <span>{isGenerating ? (lang === 'id' ? 'Memproses...' : 'Processing...') : t.downloadImage}</span>
            </button>

            <button
              className="aether-action-btn secondary"
              onClick={handleCopyImage}
              disabled={isGenerating}
              title={t.copyImage}
            >
              {isImageCopied ? <Check size={17} color="#4ade80" /> : <ImageIcon size={17} />}
              <span className="btn-label-desktop">
                {isImageCopied ? (lang === 'id' ? 'Gambar Tersalin!' : 'Image Copied!') : t.copyImage}
              </span>
              <span className="btn-label-mobile">
                {isImageCopied ? (lang === 'id' ? 'Tersalin!' : 'Copied!') : (lang === 'id' ? 'Salin Gambar' : 'Copy Image')}
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
              <span className="channel-icon">💬</span>
              <span className="channel-label">WhatsApp</span>
            </button>

            <button
              className="aether-channel-button channel-tg"
              onClick={handleShareTelegram}
              title="Bagikan ke Telegram"
            >
              <span className="channel-icon">✈️</span>
              <span className="channel-label">Telegram</span>
            </button>

            <button
              className="aether-channel-button channel-x"
              onClick={handleShareTwitter}
              title="Bagikan ke X / Twitter"
            >
              <span className="channel-icon">✦</span>
              <span className="channel-label">X / Twitter</span>
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
              {isCopied ? <Check size={15} color="#4ade80" /> : <Copy size={15} />}
              <span className="channel-label">
                {isCopied ? (lang === 'id' ? 'Tersalin!' : 'Copied!') : t.copyTextInfo}
              </span>
            </button>
          </div>
        </div>

        {/* 2. Visual Card Preview Header & Preview Card */}
        <div className="aether-preview-deck-header">
          <span className="aether-preview-deck-title">
            {lang === 'id' ? '✦ PRATINJAU KARTU CUACA' : '✦ LIVE CARD PREVIEW'}
          </span>
        </div>

        {/* Live Visual Card Preview (Celestial Astronomy Theme) */}
        <div className="aether-rendered-card-preview">
          <div className="preview-top">
            <div className="preview-branding">
              <CloudSun size={18} color="#fef08a" />
              <span>AetherWeather</span>
            </div>
            <span className="preview-date">{dateFormatted}</span>
          </div>

          <div className="preview-center">
            <div className="preview-info-col">
              <h2 className="preview-city">
                {weather.name}, {weather.sys.country}
              </h2>
              <span className="preview-pill">{translatedDesc}</span>
              <div className="preview-temp">
                <span className="num">{Math.round(weather.main.temp)}</span>
                <span className="unit">{unitSymbol}</span>
              </div>
              <div className="preview-feels-row">
                <span className="feels-tag">
                  {t.feelsLike} <strong>{Math.round(weather.main.feels_like)}°</strong>
                </span>
                <span className="range-tag">
                  H: {Math.round(weather.main.temp_max)}° L: {Math.round(weather.main.temp_min)}°
                </span>
              </div>
            </div>

            <div className="preview-art">
              <WeatherHeroArt
                weatherId={condition.id}
                isNight={isNight}
              />
            </div>
          </div>

          <div className="preview-metrics">
            <div className="p-item">
              <Wind size={14} color="#38bdf8" />
              <span>
                {windDisplay} {speedUnit}
              </span>
            </div>
            <div className="p-item">
              <Droplets size={14} color="#38bdf8" />
              <span>{weather.main.humidity}%</span>
            </div>
            <div className="p-item">
              <Gauge size={14} color="#38bdf8" />
              <span>{weather.main.pressure} hPa</span>
            </div>
            <div className="p-item">
              <Leaf size={14} color="#38bdf8" />
              <span>AQI {aqiLabel}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

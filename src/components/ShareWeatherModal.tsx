'use client';

import React, { useRef, useState, useEffect } from 'react';
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
  const [isLinkCopied, setIsLinkCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const unitSymbol = unit === 'metric' ? '°C' : '°F';
  const speedUnit = unit === 'metric' ? 'km/j' : 'mph';
  const windDisplay =
    unit === 'metric' ? Math.round(weather.wind.speed * 3.6) : Math.round(weather.wind.speed);

  const condition = weather.weather[0];
  const translatedDesc =
    t.descriptions[condition.description.toLowerCase()] || condition.description;
  const aqiScore = pollution?.list?.[0]?.main?.aqi ?? 2;
  const aqiLabel = t.aqiLevels[aqiScore] || 'Normal';

  // Format date
  const now = new Date((weather.dt + weather.timezone) * 1000);
  const dateFormatted = `${t.days[now.getUTCDay()]}, ${now.getUTCDate()} ${t.monthsFull[now.getUTCMonth()]} ${now.getUTCFullYear()}`;

  // Copy text summary
  const handleCopyText = async () => {
    const text = `🌤️ ${weather.name}, ${weather.sys.country} Weather:
🌡️ ${Math.round(weather.main.temp)}${unitSymbol} (${translatedDesc})
${t.feelsLike}: ${Math.round(weather.main.feels_like)}° | Min: ${Math.round(weather.main.temp_min)}° / Max: ${Math.round(weather.main.temp_max)}°
💨 ${t.wind}: ${windDisplay} ${speedUnit} | 💧 ${t.humidity}: ${weather.main.humidity}% | 🍃 AQI: ${aqiLabel}
✨ AetherWeather Real-Time Intelligence`;

    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      onShowToast(t.textCopiedToast, 'success');
      setTimeout(() => setIsCopied(false), 2500);
    } catch {
      onShowToast('Gagal menyalin teks.', 'error');
    }
  };

  // Copy Direct Link to Weather (?city=...)
  const handleCopyLink = async () => {
    if (typeof window === 'undefined') return;
    const directUrl = `${window.location.origin}${window.location.pathname}?city=${encodeURIComponent(weather.name)}`;
    try {
      await navigator.clipboard.writeText(directUrl);
      setIsLinkCopied(true);
      onShowToast(t.linkCopiedToast, 'success');
      setTimeout(() => setIsLinkCopied(false), 2500);
    } catch {
      onShowToast('Gagal menyalin tautan.', 'error');
    }
  };

  // Render high-res Canvas and download
  const handleDownloadImage = () => {
    setIsGenerating(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Canvas dimensions: 1000 x 600
    const w = 1000;
    const h = 600;
    canvas.width = w;
    canvas.height = h;

    // Background Atmospheric Gradient
    const bgGrad = ctx.createLinearGradient(0, 0, w, h);
    bgGrad.addColorStop(0, '#0c4a6e');
    bgGrad.addColorStop(0.5, '#0369a1');
    bgGrad.addColorStop(1, '#070b14');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Decorative ambient circles
    ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
    ctx.beginPath();
    ctx.arc(800, 150, 220, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(251, 191, 36, 0.1)';
    ctx.beginPath();
    ctx.arc(200, 450, 260, 0, Math.PI * 2);
    ctx.fill();

    // Glass Card Frame
    const pad = 40;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(pad, pad, w - pad * 2, h - pad * 2, 28);
    ctx.fill();
    ctx.stroke();

    // Top Header / Branding
    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText('AETHER WEATHER', pad + 35, pad + 55);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '16px sans-serif';
    ctx.fillText(t.brandSubtitle, pad + 35, pad + 82);

    // Date
    ctx.textAlign = 'right';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = '18px sans-serif';
    ctx.fillText(dateFormatted, w - pad - 35, pad + 65);
    ctx.textAlign = 'left';

    // City Name
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 54px sans-serif';
    ctx.fillText(`${weather.name}, ${weather.sys.country}`, pad + 35, pad + 180);

    // Weather Condition Pill
    ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.beginPath();
    ctx.roundRect(pad + 35, pad + 205, 220, 42, 21);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText(translatedDesc, pad + 55, pad + 233);

    // Temperature & Feels like
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 110px sans-serif';
    ctx.fillText(`${Math.round(weather.main.temp)}${unitSymbol}`, pad + 35, pad + 370);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.font = '22px sans-serif';
    ctx.fillText(
      `${t.feelsLike} ${Math.round(weather.main.feels_like)}°  •  ${t.tempHigh} ${Math.round(weather.main.temp_max)}°  •  ${t.tempLow} ${Math.round(weather.main.temp_min)}°`,
      pad + 35,
      pad + 415
    );

    // Metrics Strip at the bottom
    const bottomY = pad + 445;
    const boxW = 200;
    const boxH = 55;
    const metricsData = [
      { label: t.wind, val: `${windDisplay} ${speedUnit}` },
      { label: t.humidity, val: `${weather.main.humidity}%` },
      { label: t.airPressure, val: `${weather.main.pressure} hPa` },
      { label: 'AQI', val: aqiLabel },
    ];

    metricsData.forEach((m, idx) => {
      const bx = pad + 35 + idx * 220;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
      ctx.beginPath();
      ctx.roundRect(bx, bottomY, boxW, boxH, 14);
      ctx.fill();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.font = '14px sans-serif';
      ctx.fillText(m.label, bx + 16, bottomY + 24);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 17px sans-serif';
      ctx.fillText(m.val, bx + 16, bottomY + 46);
    });

    // Trigger PNG Download
    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `AetherWeather-${weather.name}-${Date.now()}.png`;
    a.click();
    setIsGenerating(false);
    onShowToast(t.downloadSuccessToast, 'success');
  };

  // Web Share API
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `AetherWeather — ${weather.name}`,
          text: `Cuaca saat ini di ${weather.name}: ${Math.round(weather.main.temp)}${unitSymbol} (${translatedDesc}) | Kelembapan: ${weather.main.humidity}%`,
          url: window.location.href,
        });
        onShowToast(t.sharedSuccessToast, 'success');
      } catch (err: unknown) {
        if ((err as Error)?.name !== 'AbortError') {
          handleCopyText();
        }
      }
    } else {
      handleCopyText();
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="glass-card modal-container share-modal"
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

        {/* Live Visual Card Preview */}
        <div className="share-card-preview">
          <div className="preview-top">
            <div className="preview-branding">
              <CloudSun size={18} color="#fef08a" />
              <span>AetherWeather</span>
            </div>
            <span className="preview-date">{dateFormatted}</span>
          </div>

          <div className="preview-center">
            <div>
              <h2 className="preview-city">
                {weather.name}, {weather.sys.country}
              </h2>
              <span className="preview-pill">{translatedDesc}</span>
              <div className="preview-temp">
                <span className="num">{Math.round(weather.main.temp)}</span>
                <span className="unit">{unitSymbol}</span>
              </div>
              <p className="preview-feels">
                {t.feelsLike} <strong>{Math.round(weather.main.feels_like)}°</strong> &bull; H:{' '}
                {Math.round(weather.main.temp_max)}° L: {Math.round(weather.main.temp_min)}°
              </p>
            </div>

            <div className="preview-art">
              <WeatherHeroArt
                weatherId={condition.id}
                isNight={condition.icon.endsWith('n')}
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

        {/* Hidden Canvas for High-Resolution Export */}
        <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>

        {/* Action Buttons */}
        <div className="share-actions-row">
          <button
            className="share-btn primary"
            onClick={handleDownloadImage}
            disabled={isGenerating}
          >
            <Download size={18} /> {t.downloadImage}
          </button>

          <button className="share-btn secondary" onClick={handleNativeShare}>
            <Share2 size={18} /> {t.shareToApps}
          </button>

          <button className="share-btn outline" onClick={handleCopyText}>
            {isCopied ? <Check size={18} color="#4ade80" /> : <Copy size={18} />}
            {isCopied ? 'Tersalin!' : t.copyTextInfo}
          </button>

          <button className="share-btn outline" onClick={handleCopyLink} title={t.copyLink}>
            {isLinkCopied ? <Check size={18} color="#4ade80" /> : <Link2 size={18} color="#38bdf8" />}
            {isLinkCopied ? (lang === 'id' ? 'Tautan Tersalin!' : 'Link Copied!') : t.copyLink}
          </button>
        </div>
      </div>
    </div>
  );
};

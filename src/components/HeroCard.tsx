'use client';

import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Clock,
  ArrowUp,
  ArrowDown,
  Wind,
  Droplets,
  Share2,
  WifiOff,
  CloudRain,
  CloudLightning,
  CloudRainWind,
  Snowflake,
  CloudHail,
  CloudFog,
} from 'lucide-react';
import { CurrentWeatherResponse, ForecastItem, UnitType } from '@/types/weather';
import { Language, getTranslation } from '@/utils/i18n';
import { WeatherHeroArt } from './WeatherIcons';
import { getEffectiveCityDate } from '@/utils/weatherUtils';

interface HeroCardProps {
  weather: CurrentWeatherResponse;
  hourlyItems?: ForecastItem[];
  unit: UnitType;
  lang?: Language;
  onOpenShare?: () => void;
  isOffline?: boolean;
  onPreviewWeatherChange?: (
    preview: { weatherId: number; windSpeed: number; isNight: boolean } | null
  ) => void;
}

type StormSimMode =
  | 'none'
  | 'rain'
  | 'storm-rain'
  | 'thunderstorm'
  | 'snow'
  | 'blizzard'
  | 'sleet'
  | 'fog';

export const HeroCard: React.FC<HeroCardProps> = ({
  weather,
  hourlyItems = [],
  unit,
  lang = 'id',
  onOpenShare,
  isOffline = false,
  onPreviewWeatherChange,
}) => {
  const t = getTranslation(lang);
  const [localTimeStr, setLocalTimeStr] = useState('--:--:--');
  const [localDateStr, setLocalDateStr] = useState('...');
  const [periodBadge, setPeriodBadge] = useState('Malam');
  const [scrubIndex, setScrubIndex] = useState<number>(0);
  const [stormSim, setStormSim] = useState<StormSimMode>('none');

  // Reset simulation when city changes
  useEffect(() => {
    setScrubIndex(0);
    setStormSim('none');
  }, [weather.id, weather.name]);

  // When scrubbing time machine, resolve the simulated weather item
  const isScrubbing = scrubIndex > 0 && hourlyItems.length > scrubIndex;
  const activeHourlyItem = isScrubbing ? hourlyItems[scrubIndex] : null;

  // Smooth count-up animation for main temperature
  const baseTemp = activeHourlyItem
    ? Math.round(activeHourlyItem.main.temp)
    : Math.round(weather.main.temp);
  const targetTemp =
    stormSim === 'blizzard'
      ? unit === 'metric'
        ? -9
        : 16
      : stormSim === 'snow'
        ? unit === 'metric'
          ? -2
          : 28
        : stormSim === 'sleet'
          ? unit === 'metric'
            ? 1
            : 34
          : baseTemp;
  const [displayTemp, setDisplayTemp] = useState(targetTemp);

  useEffect(() => {
    let start = displayTemp;
    const end = targetTemp;
    if (start === end) return;

    const duration = 500;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const ease = 1 - Math.pow(1 - progress, 3);
      const currentVal = Math.round(start + (end - start) * ease);
      setDisplayTemp(currentVal);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    const handle = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(handle);
  }, [targetTemp]);

  useEffect(() => {
    const updateTime = () => {
      const cityTime = getEffectiveCityDate(weather.timezone);

      const hours = String(cityTime.getUTCHours()).padStart(2, '0');
      const minutes = String(cityTime.getUTCMinutes()).padStart(2, '0');
      const seconds = String(cityTime.getUTCSeconds()).padStart(2, '0');
      setLocalTimeStr(`${hours}:${minutes}:${seconds}`);

      const h = cityTime.getUTCHours();
      let period = lang === 'id' ? 'Malam' : 'Night';
      if (h >= 5 && h < 11) period = lang === 'id' ? 'Pagi' : 'Morning';
      else if (h >= 11 && h < 15) period = lang === 'id' ? 'Siang' : 'Midday';
      else if (h >= 15 && h < 19) period = lang === 'id' ? 'Sore' : 'Evening';
      setPeriodBadge(period);

      const dayName = t.days[cityTime.getUTCDay()];
      const dateNum = cityTime.getUTCDate();
      const monthName = t.months[cityTime.getUTCMonth()];
      const yearNum = cityTime.getUTCFullYear();
      setLocalDateStr(`${dayName}, ${dateNum} ${monthName} ${yearNum}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [weather.timezone, t, lang]);

  const baseCondition = activeHourlyItem ? activeHourlyItem.weather[0] : weather.weather[0];
  const isNight = baseCondition.icon.endsWith('n');

  const effectiveWeatherId =
    stormSim === 'thunderstorm'
      ? 202
      : stormSim === 'storm-rain'
        ? 502
        : stormSim === 'rain'
          ? 501
          : stormSim === 'blizzard'
            ? 602
            : stormSim === 'snow'
              ? 601
              : stormSim === 'sleet'
                ? 611
                : stormSim === 'fog'
                  ? 741
                  : baseCondition.id;

  const baseWindSpeed = activeHourlyItem ? activeHourlyItem.wind.speed : weather.wind.speed;
  const activeWindSpeed =
    stormSim === 'blizzard'
      ? Math.max(baseWindSpeed, unit === 'metric' ? 14.2 : 32)
      : stormSim === 'thunderstorm'
        ? Math.max(baseWindSpeed, unit === 'metric' ? 11.5 : 25)
        : stormSim === 'storm-rain'
          ? Math.max(baseWindSpeed, unit === 'metric' ? 9.5 : 21)
          : stormSim === 'sleet'
            ? Math.max(baseWindSpeed, unit === 'metric' ? 6.8 : 15)
            : stormSim === 'rain'
              ? Math.max(baseWindSpeed, unit === 'metric' ? 4.2 : 9)
              : stormSim === 'snow'
                ? Math.max(baseWindSpeed, unit === 'metric' ? 3.2 : 7)
                : baseWindSpeed;

  useEffect(() => {
    if (!onPreviewWeatherChange) return;
    if (stormSim !== 'none' || isScrubbing) {
      onPreviewWeatherChange({
        weatherId: effectiveWeatherId,
        windSpeed: activeWindSpeed,
        isNight,
      });
    } else {
      onPreviewWeatherChange(null);
    }
  }, [stormSim, isScrubbing, effectiveWeatherId, activeWindSpeed, isNight, onPreviewWeatherChange]);

  const isThunderstorm = effectiveWeatherId >= 200 && effectiveWeatherId < 300;
  const isSleet = [511, 611, 612, 613, 615, 616].includes(effectiveWeatherId);
  const isStormRain =
    isThunderstorm ||
    [502, 503, 504, 521, 522, 531].includes(effectiveWeatherId) ||
    (effectiveWeatherId >= 300 &&
      effectiveWeatherId < 600 &&
      effectiveWeatherId !== 511 &&
      (unit === 'metric' ? activeWindSpeed >= 7 : activeWindSpeed >= 15));
  const isAnyRain =
    effectiveWeatherId >= 200 && effectiveWeatherId < 600 && effectiveWeatherId !== 511;
  const isBlizzard =
    effectiveWeatherId === 602 ||
    effectiveWeatherId === 622 ||
    (effectiveWeatherId >= 600 &&
      effectiveWeatherId < 700 &&
      (unit === 'metric' ? activeWindSpeed >= 9 : activeWindSpeed >= 20));
  const isAnySnow =
    effectiveWeatherId === 511 || (effectiveWeatherId >= 600 && effectiveWeatherId < 700);
  const isFog = effectiveWeatherId >= 700 && effectiveWeatherId < 800;

  const unitSymbol = unit === 'metric' ? '°C' : '°F';
  const speedUnit = unit === 'metric' ? 'km/j' : 'mph';
  const windDisplay =
    unit === 'metric' ? Math.round(activeWindSpeed * 3.6) : Math.round(activeWindSpeed);
  const activeHumidity =
    stormSim !== 'none'
      ? Math.max(
          stormSim === 'fog' ? 96 : stormSim === 'snow' || stormSim === 'blizzard' ? 84 : 88,
          weather.main.humidity
        )
      : activeHourlyItem
        ? activeHourlyItem.main.humidity
        : weather.main.humidity;
  const baseFeelsLike = activeHourlyItem
    ? Math.round(activeHourlyItem.main.feels_like)
    : Math.round(weather.main.feels_like);
  const activeFeelsLike =
    stormSim === 'blizzard'
      ? unit === 'metric'
        ? -17
        : 1
      : stormSim === 'snow'
        ? unit === 'metric'
          ? -6
          : 21
        : stormSim === 'sleet'
          ? unit === 'metric'
            ? -3
            : 27
          : baseFeelsLike;
  const displayHigh =
    stormSim === 'blizzard'
      ? unit === 'metric'
        ? -5
        : 23
      : stormSim === 'snow'
        ? unit === 'metric'
          ? 1
          : 34
        : stormSim === 'sleet'
          ? unit === 'metric'
            ? 3
            : 37
          : Math.round(weather.main.temp_max);
  const displayLow =
    stormSim === 'blizzard'
      ? unit === 'metric'
        ? -13
        : 9
      : stormSim === 'snow'
        ? unit === 'metric'
          ? -5
          : 23
        : stormSim === 'sleet'
          ? unit === 'metric'
            ? -1
            : 30
          : Math.round(weather.main.temp_min);
  const activePop =
    stormSim !== 'none'
      ? stormSim === 'fog'
        ? null
        : stormSim === 'rain' || stormSim === 'snow'
          ? 85
          : 95
      : activeHourlyItem?.pop
        ? Math.round(activeHourlyItem.pop * 100)
        : null;

  // Format the simulation hour string
  const getSimulatedHourStr = (dt: number) => {
    const d = new Date((dt + weather.timezone) * 1000);
    return `${String(d.getUTCHours()).padStart(2, '0')}:00`;
  };

  const rawDesc =
    stormSim === 'thunderstorm'
      ? 'thunderstorm with heavy rain'
      : stormSim === 'storm-rain'
        ? 'heavy intensity rain'
        : stormSim === 'rain'
          ? 'moderate rain'
          : stormSim === 'blizzard'
            ? 'heavy shower snow'
            : stormSim === 'snow'
              ? 'snow'
              : stormSim === 'sleet'
                ? 'sleet'
                : stormSim === 'fog'
                  ? 'fog'
                  : baseCondition.description.toLowerCase();

  const translatedDesc = t.descriptions[rawDesc] || baseCondition.description;

  const haloVariant = isThunderstorm
    ? 'halo-thunder'
    : isBlizzard
      ? 'halo-blizzard'
      : isAnySnow
        ? 'halo-snow'
        : isStormRain || isAnyRain
          ? 'halo-storm'
          : isNight
            ? 'halo-night'
            : 'halo-day';

  const simLabelMap: Record<StormSimMode, { id: string; en: string }> = {
    none: { id: '', en: '' },
    rain: { id: 'Hujan Sedang', en: 'Moderate Rain' },
    'storm-rain': { id: 'Hujan Badai', en: 'Storm Rain' },
    thunderstorm: { id: 'Hujan Berpetir', en: 'Thunderstorm' },
    snow: { id: 'Bersalju', en: 'Snowfall' },
    blizzard: { id: 'Badai Salju (Blizzard)', en: 'Heavy Blizzard' },
    sleet: { id: 'Hujan Es / Sleet', en: 'Sleet & Ice Pellets' },
    fog: { id: 'Kabut Tebal', en: 'Dense Fog' },
  };

  return (
    <div
      className={`glass-card hero-card ${isScrubbing || stormSim !== 'none' ? 'hero-time-machine-active' : ''} ${isAnyRain ? 'hero-rain-active' : ''} ${isStormRain ? 'hero-storm-active' : ''} ${isThunderstorm ? 'hero-thunder-active' : ''} ${isAnySnow ? 'hero-snow-active' : ''} ${isBlizzard ? 'hero-blizzard-active' : ''} ${isFog ? 'hero-fog-active' : ''}`}
    >
      {/* Atmospheric Rain, Storm & Lightning Card Backdrop */}
      {isAnyRain && (
        <div
          className={`hero-storm-backdrop ${isStormRain ? 'backdrop-heavy' : 'backdrop-regular'}`}
          aria-hidden="true"
        >
          {isThunderstorm && <div className="hero-lightning-sheet" />}
          {isStormRain && <div className="hero-squall-gust" />}
          <div className="hero-rain-curtain">
            <span className="hero-rain-line r-1" />
            <span className="hero-rain-line r-2" />
            <span className="hero-rain-line r-3" />
            <span className="hero-rain-line r-4" />
            <span className="hero-rain-line r-5" />
            <span className="hero-rain-line r-6" />
            <span className="hero-rain-line r-7" />
            <span className="hero-rain-line r-8" />
            <span className="hero-rain-line r-9" />
            <span className="hero-rain-line r-10" />
            <span className="hero-rain-line r-11" />
            <span className="hero-rain-line r-12" />
          </div>
          <div className="hero-puddle-ripples">
            <span className="puddle-ring p-1" />
            <span className="puddle-ring p-2" />
            <span className="puddle-ring p-3" />
          </div>
        </div>
      )}

      {/* Atmospheric Snow, Blizzard & Sleet Card Backdrop */}
      {isAnySnow && (
        <div
          className={`hero-snow-backdrop ${isBlizzard ? 'snow-blizzard' : isSleet ? 'snow-sleet' : 'snow-gentle'}`}
          aria-hidden="true"
        >
          <div className="hero-frost-rim" />
          {isBlizzard && <div className="hero-blizzard-gust" />}
          <div className="hero-snow-curtain">
            <span className="hero-snow-flake s-1" />
            <span className="hero-snow-flake s-2" />
            <span className="hero-snow-flake s-3" />
            <span className="hero-snow-flake s-4" />
            <span className="hero-snow-flake s-5" />
            <span className="hero-snow-flake s-6" />
            <span className="hero-snow-flake s-7" />
            <span className="hero-snow-flake s-8" />
            <span className="hero-snow-flake s-9" />
            <span className="hero-snow-flake s-10" />
            <span className="hero-snow-flake s-11" />
            <span className="hero-snow-flake s-12" />
          </div>
          <div className="hero-snow-drift" />
        </div>
      )}

      {/* Atmospheric Fog & Mist Card Backdrop */}
      {isFog && (
        <div className="hero-fog-backdrop" aria-hidden="true">
          <div className="hero-fog-veil f-1" />
          <div className="hero-fog-veil f-2" />
        </div>
      )}

      {/* 1. Top Bar: Location, 3D Toggle & Share Action */}
      <div className="hero-top">
        <div className="location-info">
          <div className="location-title-row">
            <MapPin size={20} className="location-pin-icon" />
            <h2>{weather.name}</h2>
            <span className="country-badge">{weather.sys.country || '--'}</span>
            {isOffline && (
              <span className="offline-badge" title={t.offlineNotice}>
                <WifiOff size={12} /> {t.offlineMode}
              </span>
            )}
          </div>
          <div className="local-time-row">
            <Clock size={13} className="time-clock-icon" />
            <span className="live-clock-digits">{localTimeStr}</span>
            <span className="time-divider">&bull;</span>
            <span className="local-date-text">{localDateStr}</span>
            <span className="period-pill">{periodBadge}</span>
          </div>
        </div>

        <div className="hero-top-actions">
          {onOpenShare && (
            <button
              className="hero-card-export-btn"
              onClick={onOpenShare}
              title={lang === 'id' ? 'Bagikan & Unduh Kartu Cuaca' : 'Share & Download Weather Card'}
              aria-label={lang === 'id' ? 'Bagikan & Unduh Kartu Cuaca' : 'Share & Download Weather Card'}
              id="hero-card-export-action"
            >
              <Share2 size={15} />
              <span className="hero-export-label">
                {lang === 'id' ? 'Bagikan' : 'Share'}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Time Machine / Storm Simulation Active Banner */}
      {(isScrubbing || stormSim !== 'none') && (
        <div className="tm-active-banner">
          <div className="tm-banner-left">
            <span className="tm-pulse-dot"></span>
            <span className="tm-banner-text">
              {stormSim !== 'none' ? (
                <>
                  {lang === 'id' ? 'Simulasi Atmosfer:' : 'Atmospheric Sim:'}{' '}
                  <strong>{simLabelMap[stormSim]?.[lang]}</strong>
                </>
              ) : (
                activeHourlyItem && (
                  <>
                    {lang === 'id' ? 'Simulasi Pukul' : 'Simulating'}{' '}
                    <strong>{getSimulatedHourStr(activeHourlyItem.dt)}</strong>
                    <span className="tm-banner-offset">
                      {' '}
                      (+{scrubIndex} {lang === 'id' ? 'jam lagi' : 'hrs'})
                    </span>
                  </>
                )
              )}
            </span>
            {activePop !== null && activePop > 0 && (
              <span className="tm-banner-rain-badge">{activePop}%</span>
            )}
          </div>
          <button
            type="button"
            className="tm-banner-reset-btn"
            onClick={() => {
              setScrubIndex(0);
              setStormSim('none');
            }}
            title={lang === 'id' ? 'Kembali ke waktu saat ini' : 'Reset to current time'}
          >
            ↺ {lang === 'id' ? 'Kembali ke Sekarang' : 'Reset to Now'}
          </button>
        </div>
      )}

      {/* 2. Center: Stylized Animated Hero Art + Temperature + Integrated Condition & Feels-Like */}
      <div className="hero-center">
        <div className="hero-icon-container">
          <div className={`hero-art-ambient-halo ${haloVariant}`}></div>
          <WeatherHeroArt weatherId={effectiveWeatherId} isNight={isNight} />
        </div>

        <div className="hero-temp-group">
          <div className="temp-row">
            <span className="temp-value">{displayTemp}</span>
            <span className="temp-unit">{unitSymbol}</span>
          </div>

          <div className="hero-condition-wrap">
            <span
              className={`hero-condition-pill ${
                isThunderstorm
                  ? 'pill-thunder-active'
                  : isBlizzard
                    ? 'pill-blizzard-active'
                    : isAnySnow
                      ? 'pill-snow-active'
                      : isStormRain
                        ? 'pill-storm-active'
                        : isFog
                          ? 'pill-fog-active'
                          : ''
              }`}
            >
              {isThunderstorm ? (
                <CloudLightning size={15} className="mini-icon-thunder" />
              ) : isBlizzard ? (
                <Snowflake size={15} className="mini-icon-blizzard" />
              ) : isSleet ? (
                <CloudHail size={15} className="mini-icon-sleet" />
              ) : isAnySnow ? (
                <Snowflake size={15} className="mini-icon-snow" />
              ) : isStormRain ? (
                <CloudRainWind size={15} className="mini-icon-storm-rain" />
              ) : isFog ? (
                <CloudFog size={15} />
              ) : null}
              <span>{translatedDesc}</span>
            </span>
            <span className="hero-feels-like-pill">
              {t.feelsLike} <strong>{activeFeelsLike}°</strong>
            </span>
          </div>
        </div>
      </div>

      {/* 3. Bottom Stats: 4 Equal Symmetrical Micro-Cards with Zero Truncation */}
      <div className="hero-stats-bar">
        <div className="hero-stat-card">
          <span className="hero-stat-icon-wrap stat-icon-up">
            <ArrowUp size={14} />
          </span>
          <span className="stat-val">{displayHigh}°</span>
          <span className="stat-label">{t.tempHigh}</span>
        </div>

        <div className="hero-stat-card">
          <span className="hero-stat-icon-wrap stat-icon-down">
            <ArrowDown size={14} />
          </span>
          <span className="stat-val">{displayLow}°</span>
          <span className="stat-label">{t.tempLow}</span>
        </div>

        <div className="hero-stat-card">
          <span className="hero-stat-icon-wrap stat-icon-wind">
            <Wind size={14} />
          </span>
          <span className="stat-val">
            {windDisplay} <small className="stat-unit">{speedUnit}</small>
          </span>
          <span className="stat-label">{t.wind}</span>
        </div>

        <div className="hero-stat-card">
          <span className="hero-stat-icon-wrap stat-icon-humidity">
            <Droplets size={14} />
          </span>
          <span className="stat-val">{activeHumidity}%</span>
          <span className="stat-label">{t.humidity}</span>
        </div>
      </div>

      {/* 4. Interactive 24-Hour Time Machine Scrubber Slider & Weather Simulation Presets */}
      {hourlyItems && hourlyItems.length > 1 && (
        <div className="hero-time-machine-scrubber">
          <div className="tm-scrubber-header">
            <span className="tm-scrubber-title">
              <Clock size={13} />
              <span>{lang === 'id' ? 'Simulasi & Pratinjau Cuaca' : 'Weather Sim & 24H Preview'}</span>
            </span>
            <div className="tm-storm-sim-group">
              <button
                type="button"
                className={`tm-storm-sim-btn ${stormSim === 'rain' ? 'active-storm' : ''}`}
                onClick={() =>
                  setStormSim((prev) => (prev === 'rain' ? 'none' : 'rain'))
                }
                title={
                  lang === 'id'
                    ? 'Pratinjau efek animasi Hujan'
                    : 'Preview Rain animation'
                }
              >
                <CloudRain size={12} />
                <span>{lang === 'id' ? 'Hujan' : 'Rain'}</span>
              </button>
              <button
                type="button"
                className={`tm-storm-sim-btn ${stormSim === 'storm-rain' ? 'active-storm' : ''}`}
                onClick={() =>
                  setStormSim((prev) => (prev === 'storm-rain' ? 'none' : 'storm-rain'))
                }
                title={
                  lang === 'id'
                    ? 'Pratinjau efek animasi Hujan Badai'
                    : 'Preview Storm Rain animation'
                }
              >
                <CloudRainWind size={12} />
                <span>{lang === 'id' ? 'Hujan Badai' : 'Storm Rain'}</span>
              </button>
              <button
                type="button"
                className={`tm-storm-sim-btn ${stormSim === 'thunderstorm' ? 'active-thunder' : ''}`}
                onClick={() =>
                  setStormSim((prev) => (prev === 'thunderstorm' ? 'none' : 'thunderstorm'))
                }
                title={
                  lang === 'id'
                    ? 'Pratinjau efek animasi Hujan Berpetir'
                    : 'Preview Thunderstorm animation'
                }
              >
                <CloudLightning size={12} />
                <span>{lang === 'id' ? 'Hujan Berpetir' : 'Thunderstorm'}</span>
              </button>
              <button
                type="button"
                className={`tm-storm-sim-btn ${stormSim === 'snow' ? 'active-snow' : ''}`}
                onClick={() =>
                  setStormSim((prev) => (prev === 'snow' ? 'none' : 'snow'))
                }
                title={
                  lang === 'id'
                    ? 'Pratinjau efek animasi Bersalju'
                    : 'Preview Snowfall animation'
                }
              >
                <Snowflake size={12} />
                <span>{lang === 'id' ? 'Bersalju' : 'Snow'}</span>
              </button>
              <button
                type="button"
                className={`tm-storm-sim-btn ${stormSim === 'blizzard' ? 'active-blizzard' : ''}`}
                onClick={() =>
                  setStormSim((prev) => (prev === 'blizzard' ? 'none' : 'blizzard'))
                }
                title={
                  lang === 'id'
                    ? 'Pratinjau efek animasi Badai Salju (Blizzard)'
                    : 'Preview Heavy Blizzard animation'
                }
              >
                <Wind size={12} />
                <span>{lang === 'id' ? 'Badai Salju' : 'Blizzard'}</span>
              </button>
              <button
                type="button"
                className={`tm-storm-sim-btn ${stormSim === 'sleet' ? 'active-snow' : ''}`}
                onClick={() =>
                  setStormSim((prev) => (prev === 'sleet' ? 'none' : 'sleet'))
                }
                title={
                  lang === 'id'
                    ? 'Pratinjau efek animasi Hujan Es / Salju Campur (Sleet)'
                    : 'Preview Sleet & Ice Pellets animation'
                }
              >
                <CloudHail size={12} />
                <span>{lang === 'id' ? 'Hujan Es' : 'Sleet'}</span>
              </button>
              <button
                type="button"
                className={`tm-storm-sim-btn ${stormSim === 'fog' ? 'active-fog' : ''}`}
                onClick={() =>
                  setStormSim((prev) => (prev === 'fog' ? 'none' : 'fog'))
                }
                title={
                  lang === 'id'
                    ? 'Pratinjau efek animasi Kabut Tebal (Fog)'
                    : 'Preview Dense Fog animation'
                }
              >
                <CloudFog size={12} />
                <span>{lang === 'id' ? 'Kabut' : 'Fog'}</span>
              </button>
            </div>
          </div>

          <div className="tm-scrubber-track-wrap">
            <input
              type="range"
              min="0"
              max={Math.min(23, hourlyItems.length - 1)}
              step="1"
              value={scrubIndex}
              onChange={(e) => {
                setStormSim('none');
                setScrubIndex(parseInt(e.target.value, 10));
              }}
              className="tm-slider-input"
              aria-label={lang === 'id' ? 'Penggeser Mesin Waktu Cuaca' : 'Weather Time Machine Scrubber'}
            />
            <div className="tm-scrubber-ticks">
              <span className={`tm-tick ${scrubIndex === 0 && stormSim === 'none' ? 'active' : ''}`}>
                {lang === 'id' ? 'Saat Ini' : 'Now'}
              </span>
              <span className={`tm-tick ${scrubIndex >= 4 && scrubIndex <= 8 ? 'active' : ''}`}>+6j</span>
              <span className={`tm-tick ${scrubIndex >= 10 && scrubIndex <= 14 ? 'active' : ''}`}>+12j</span>
              <span className={`tm-tick ${scrubIndex >= 16 && scrubIndex <= 20 ? 'active' : ''}`}>+18j</span>
              <span className={`tm-tick ${scrubIndex >= 21 ? 'active' : ''}`}>+24j</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


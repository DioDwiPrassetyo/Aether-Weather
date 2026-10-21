'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Search,
  ArrowRightLeft,
  Wind,
  Droplets,
  CloudRain,
  Eye,
  Gauge,
  Cloud,
  Thermometer,
  Clock,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import {
  CurrentWeatherResponse,
  AirPollutionResponse,
  UnitType,
  GeocodingResult,
} from '@/types/weather';
import { Language, getTranslation } from '@/utils/i18n';
import {
  fetchCurrentWeather,
  fetchAirPollutionData,
  searchGeocoding,
  getCardinalDirection,
} from '@/utils/weatherUtils';
import { WeatherHeroArt } from './WeatherIcons';

interface CityComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  primaryWeather: CurrentWeatherResponse;
  unit: UnitType;
  lang?: Language;
  onApplyCity: (cityName: string) => void;
}

const PRESET_CITIES = ['Tokyo', 'Singapore', 'London', 'Surabaya', 'New York', 'Paris', 'Bali'];

export const CityComparisonModal: React.FC<CityComparisonModalProps> = ({
  isOpen,
  onClose,
  primaryWeather,
  unit,
  lang = 'id',
  onApplyCity,
}) => {
  const t = getTranslation(lang);
  const [city2Query, setCity2Query] = useState('');
  const [suggestions, setSuggestions] = useState<GeocodingResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [city2Weather, setCity2Weather] = useState<CurrentWeatherResponse | null>(null);
  const [city2Pollution, setCity2Pollution] = useState<AirPollutionResponse | null>(null);
  const [city1Pollution, setCity1Pollution] = useState<AirPollutionResponse | null>(null);
  const [isLoadingCity2, setIsLoadingCity2] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch City 1 pollution on open
  useEffect(() => {
    if (isOpen && primaryWeather) {
      fetchAirPollutionData(primaryWeather.coord.lat, primaryWeather.coord.lon).then((data) => {
        setCity1Pollution(data);
      });
      // Default City 2 to Tokyo or another preset if not loaded yet
      if (!city2Weather) {
        loadCity2Data('Tokyo');
      }
    }
  }, [isOpen, primaryWeather]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const loadCity2Data = async (cityName: string) => {
    setIsLoadingCity2(true);
    setShowSuggestions(false);
    try {
      const data = await fetchCurrentWeather({ city: cityName }, unit);
      const poll = await fetchAirPollutionData(data.coord.lat, data.coord.lon);
      setCity2Weather(data);
      setCity2Pollution(poll);
      setCity2Query(data.name);
    } catch (err) {
      console.warn('Gagal memuat cuaca kota pembanding:', err);
    } finally {
      setIsLoadingCity2(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCity2Query(val);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const results = await searchGeocoding(val.trim());
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
      } catch (err) {
        console.error(err);
      }
    }, 300);
  };

  if (!isOpen) return null;

  const unitSymbol = unit === 'metric' ? '°C' : '°F';
  const speedUnit = unit === 'metric' ? 'km/j' : 'mph';

  const c1Temp = Math.round(primaryWeather.main.temp);
  const c2Temp = city2Weather ? Math.round(city2Weather.main.temp) : 0;
  const tempDiff = city2Weather ? Math.abs(c1Temp - c2Temp) : 0;

  // Comparison insight text
  let comparisonVerdict = '';
  if (city2Weather) {
    if (c1Temp > c2Temp) {
      comparisonVerdict = `${city2Weather.name} ${tempDiff}° ${t.cooler} ${t.city1Label.toLowerCase()} (${primaryWeather.name})`;
    } else if (c1Temp < c2Temp) {
      comparisonVerdict = `${city2Weather.name} ${tempDiff}° ${t.warmer} ${t.city1Label.toLowerCase()} (${primaryWeather.name})`;
    } else {
      comparisonVerdict = `${primaryWeather.name} & ${city2Weather.name} memiliki ${t.sameTemp} (${c1Temp}°)`;
    }
  }

  // Timezone difference
  const tzDiffHours = city2Weather
    ? Math.round((city2Weather.timezone - primaryWeather.timezone) / 3600)
    : 0;
  const tzText =
    tzDiffHours === 0
      ? 'Zona waktu sama'
      : `${Math.abs(tzDiffHours)} jam ${tzDiffHours > 0 ? 'lebih cepat' : 'lebih lambat'}`;

  const c1Speed =
    unit === 'metric'
      ? Math.round(primaryWeather.wind.speed * 3.6)
      : Math.round(primaryWeather.wind.speed);
  const c2Speed = city2Weather
    ? unit === 'metric'
      ? Math.round(city2Weather.wind.speed * 3.6)
      : Math.round(city2Weather.wind.speed)
    : 0;

  const c1Aqi = city1Pollution?.list?.[0]?.main?.aqi ?? 2;
  const c2Aqi = city2Pollution?.list?.[0]?.main?.aqi ?? 2;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="glass-card modal-container comparison-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div>
            <h3 className="modal-title">{t.comparisonTitle}</h3>
            <span className="modal-subtitle">{t.comparisonSubtitle}</span>
          </div>
          <button className="modal-close-btn" onClick={onClose} title={t.closeComparison}>
            <X size={20} />
          </button>
        </div>

        {/* City 2 Search & Preset Chips */}
        <div className="compare-search-row">
          <div className="compare-input-wrap">
            <Search size={16} className="search-icon-small" />
            <input
              type="text"
              value={city2Query}
              onChange={handleInputChange}
              placeholder={t.searchCity2Placeholder}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            />
            {showSuggestions && suggestions.length > 0 && (
              <div className="autocomplete-list compare-autocomplete">
                {suggestions.map((c, i) => (
                  <div
                    key={`${c.lat}-${c.lon}-${i}`}
                    className="autocomplete-item"
                    onClick={() => loadCity2Data(c.name)}
                  >
                    <span>
                      {c.name}, {c.country}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Preset comparison chips */}
          <div className="compare-presets">
            {PRESET_CITIES.map((city) => (
              <button
                key={city}
                className={`preset-chip ${city2Weather?.name.toLowerCase() === city.toLowerCase() ? 'active' : ''}`}
                onClick={() => loadCity2Data(city)}
              >
                {city}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Verdict Banner */}
        {city2Weather && (
          <div className="compare-verdict-banner">
            <Sparkles size={16} color="#facc15" />
            <span>{comparisonVerdict}</span>
            <span className="tz-badge">{tzText}</span>
          </div>
        )}

        {/* Comparison Columns */}
        <div className="compare-grid">
          {/* Column 1: Primary City */}
          <div className="compare-card primary">
            <div className="compare-card-badge">{t.city1Label}</div>
            <h4 className="compare-city-name">
              {primaryWeather.name}, {primaryWeather.sys.country}
            </h4>

            <div className="compare-temp-row">
              <WeatherHeroArt
                weatherId={primaryWeather.weather[0].id}
                isNight={primaryWeather.weather[0].icon.endsWith('n')}
              />
              <div className="compare-temp-text">
                <span className="big-temp">
                  {c1Temp}
                  {unitSymbol}
                </span>
                <span className="sub-desc">
                  {t.descriptions[primaryWeather.weather[0].description.toLowerCase()] ||
                    primaryWeather.weather[0].description}
                </span>
              </div>
            </div>

            <div className="compare-metric-list">
              <div className="c-row">
                <span>{t.feelsLike}</span>
                <strong>{Math.round(primaryWeather.main.feels_like)}°</strong>
              </div>
              <div className="c-row">
                <span>
                  {t.tempHigh} / {t.tempLow}
                </span>
                <strong>
                  {Math.round(primaryWeather.main.temp_max)}° /{' '}
                  {Math.round(primaryWeather.main.temp_min)}°
                </strong>
              </div>
              <div className="c-row">
                <span>{t.humidity}</span>
                <strong>{primaryWeather.main.humidity}%</strong>
              </div>
              <div className="c-row">
                <span>{t.wind}</span>
                <strong>
                  {c1Speed} {speedUnit} ({getCardinalDirection(primaryWeather.wind.deg)})
                </strong>
              </div>
              <div className="c-row">
                <span>AQI</span>
                <strong className={`aqi-val aqi-${c1Aqi}`}>{t.aqiLevels[c1Aqi]}</strong>
              </div>
            </div>
          </div>

          {/* Column 2: Comparison City */}
          <div className="compare-card secondary">
            <div className="compare-card-badge">{t.city2Label}</div>
            {isLoadingCity2 ? (
              <div className="compare-loading">
                <p>Memuat cuaca pembanding...</p>
              </div>
            ) : city2Weather ? (
              <>
                <h4 className="compare-city-name">
                  {city2Weather.name}, {city2Weather.sys.country}
                </h4>

                <div className="compare-temp-row">
                  <WeatherHeroArt
                    weatherId={city2Weather.weather[0].id}
                    isNight={city2Weather.weather[0].icon.endsWith('n')}
                  />
                  <div className="compare-temp-text">
                    <span className="big-temp">
                      {c2Temp}
                      {unitSymbol}
                    </span>
                    <span className="sub-desc">
                      {t.descriptions[city2Weather.weather[0].description.toLowerCase()] ||
                        city2Weather.weather[0].description}
                    </span>
                  </div>
                </div>

                <div className="compare-metric-list">
                  <div className="c-row">
                    <span>{t.feelsLike}</span>
                    <strong>{Math.round(city2Weather.main.feels_like)}°</strong>
                  </div>
                  <div className="c-row">
                    <span>
                      {t.tempHigh} / {t.tempLow}
                    </span>
                    <strong>
                      {Math.round(city2Weather.main.temp_max)}° /{' '}
                      {Math.round(city2Weather.main.temp_min)}°
                    </strong>
                  </div>
                  <div className="c-row">
                    <span>{t.humidity}</span>
                    <strong>{city2Weather.main.humidity}%</strong>
                  </div>
                  <div className="c-row">
                    <span>{t.wind}</span>
                    <strong>
                      {c2Speed} {speedUnit} ({getCardinalDirection(city2Weather.wind.deg)})
                    </strong>
                  </div>
                  <div className="c-row">
                    <span>AQI</span>
                    <strong className={`aqi-val aqi-${c2Aqi}`}>{t.aqiLevels[c2Aqi]}</strong>
                  </div>
                </div>

                <button
                  className="apply-compare-btn"
                  onClick={() => {
                    onApplyCity(city2Weather.name);
                    onClose();
                  }}
                  title="Jadikan kota ini sebagai tampilan cuaca utama"
                >
                  <ExternalLink size={14} /> Tampilkan {city2Weather.name}
                </button>
              </>
            ) : (
              <div className="compare-empty">
                <p>Cari kota pembanding di atas</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

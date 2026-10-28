'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { CloudSun } from 'lucide-react';
import {
  CurrentWeatherResponse,
  ForecastResponse,
  ForecastItem,
  AirPollutionResponse,
  UnitType,
  WeatherTheme,
  FavoriteLocation,
} from '@/types/weather';
import {
  fetchCurrentWeather,
  fetchForecastData,
  fetchHourlyForecast,
  interpolateHourlyForecast,
  fetchAirPollutionData,
  getThemeFromWeather,
} from '@/utils/weatherUtils';
import { Language, getTranslation } from '@/utils/i18n';
import { WeatherCanvas } from '@/components/WeatherCanvas';
import { Header, RecentSearchItem } from '@/components/Header';
import { QuickChips } from '@/components/QuickChips';
import { HeroCard } from '@/components/HeroCard';
import { HourlyForecast } from '@/components/HourlyForecast';
import { MetricCards } from '@/components/MetricCards';
import { FiveDayForecast } from '@/components/FiveDayForecast';
import { ExtremeWeatherAlert } from '@/components/ExtremeWeatherAlert';
import { WeatherAdvisor } from '@/components/WeatherAdvisor';
import { WeatherChart } from '@/components/WeatherChart';
import { ToastContainer, ToastMessage } from '@/components/Toast';
import { HourlyDetailModal } from '@/components/HourlyDetailModal';
import { CityComparisonModal } from '@/components/CityComparisonModal';
import { ShareWeatherModal } from '@/components/ShareWeatherModal';
import { LifestyleIndexes } from '@/components/LifestyleIndexes';
import { AstronomyCard } from '@/components/AstronomyCard';
import { AtmosphericInsightsCard } from '@/components/AtmosphericInsightsCard';
import { StickyWeatherPill } from '@/components/StickyWeatherPill';
import {
  DEFAULT_ALERT_PREFERENCES,
  isCachedWeatherSnapshot,
  matchesCachedWeather,
  parseAlertPreferences,
  WeatherAlertPreferences,
} from '@/utils/weatherRules';

// Dynamically import Leaflet WeatherMap with SSR disabled
const WeatherMap = dynamic(
  () => import('@/components/WeatherMap').then((mod) => mod.WeatherMap),
  {
    ssr: false,
    loading: () => (
      <div
        className="glass-card weather-map-card"
        style={{
          minHeight: '400px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'rgba(255, 255, 255, 0.7)',
        }}
      >
        <p>Memuat peta radar cuaca interaktif...</p>
      </div>
    ),
  }
);

const STORAGE_KEYS = {
  UNIT: 'aether_next_unit',
  LANG: 'aether_next_lang',
  FAVORITES: 'aether_next_favorites',
  RECENTS: 'aether_next_recents',
  LAST_CITY: 'aether_next_last_city',
  CACHED_WEATHER: 'aether_cached_weather_snapshot',
  ALERT_PREFERENCES: 'aether_alert_preferences',
};

export default function WeatherPage() {
  const [unit, setUnit] = useState<UnitType>('metric');
  const [lang, setLang] = useState<Language>('id');
  const [theme, setTheme] = useState<WeatherTheme>('siang');
  const [currentWeather, setCurrentWeather] = useState<CurrentWeatherResponse | null>(null);
  const [forecast, setForecast] = useState<ForecastResponse | null>(null);
  const [hourlyItems, setHourlyItems] = useState<ForecastItem[]>([]);
  const [airPollution, setAirPollution] = useState<AirPollutionResponse | null>(null);
  const [favorites, setFavorites] = useState<FavoriteLocation[]>([]);
  const [recentSearches, setRecentSearches] = useState<RecentSearchItem[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [alertPreferences, setAlertPreferences] = useState<WeatherAlertPreferences>(
    DEFAULT_ALERT_PREFERENCES
  );
  const unitRef = useRef<UnitType>('metric');
  const langRef = useRef<Language>('id');
  const requestIdRef = useRef(0);

  // Modals & Preview state
  const [selectedHourlyIndex, setSelectedHourlyIndex] = useState<number | null>(null);
  const [isComparisonOpen, setIsComparisonOpen] = useState<boolean>(false);
  const [isShareOpen, setIsShareOpen] = useState<boolean>(false);
  const [previewWeather, setPreviewWeather] = useState<{
    weatherId: number;
    windSpeed: number;
    isNight: boolean;
  } | null>(null);

  const t = getTranslation(lang);

  const addToast = useCallback((message: string, type: 'info' | 'success' | 'error' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  }, []);

  // Push to recent searches list (max 6 items, deduplicated)
  const addRecentSearch = useCallback((item: RecentSearchItem) => {
    setRecentSearches((prev) => {
      const filtered = prev.filter(
        (r) => r.name.toLowerCase() !== item.name.toLowerCase()
      );
      const updated = [item, ...filtered].slice(0, 6);
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.RECENTS, JSON.stringify(updated));
      }
      return updated;
    });
  }, []);

  const handleRemoveRecent = (name: string) => {
    setRecentSearches((prev) => {
      const updated = prev.filter((r) => r.name.toLowerCase() !== name.toLowerCase());
      localStorage.setItem(STORAGE_KEYS.RECENTS, JSON.stringify(updated));
      return updated;
    });
  };

  const handleClearRecent = () => {
    setRecentSearches([]);
    localStorage.removeItem(STORAGE_KEYS.RECENTS);
    addToast(lang === 'id' ? 'Riwayat pencarian dikosongkan.' : 'Search history cleared.', 'info');
  };

  const loadWeatherData = useCallback(
    async (
      target: { city?: string; lat?: number; lon?: number },
      selectedUnit = unitRef.current
    ) => {
      const requestId = ++requestIdRef.current;
      setIsLoading(true);
      setIsOffline(false);
      try {
        const current = await fetchCurrentWeather(target, selectedUnit);
        const [forecastRes, pollutionRes, hourlyRes] = await Promise.all([
          fetchForecastData(current.coord.lat, current.coord.lon, selectedUnit),
          fetchAirPollutionData(current.coord.lat, current.coord.lon),
          fetchHourlyForecast(current.coord.lat, current.coord.lon, selectedUnit, current),
        ]);
        if (requestId !== requestIdRef.current) return;

        setCurrentWeather(current);
        setForecast(forecastRes);
        const resolvedHourly =
          hourlyRes.length > 0
            ? hourlyRes
            : interpolateHourlyForecast(current, forecastRes.list, 24);
        setHourlyItems(resolvedHourly);
        setAirPollution(pollutionRes);

        // Always automatically adapt theme based on local time and weather conditions
        const nowUtc = Date.now() + new Date().getTimezoneOffset() * 60000;
        const cityTime = new Date(nowUtc + current.timezone * 1000);
        const localHour = cityTime.getHours();
        const isNight = current.weather[0].icon.endsWith('n');
        const autoTheme = getThemeFromWeather(current.weather[0].id, isNight, localHour);
        setTheme(autoTheme);

        if (typeof window !== 'undefined') {
          document.body.setAttribute('data-theme', autoTheme);
          localStorage.setItem(STORAGE_KEYS.LAST_CITY, current.name);

          // Deep-link synchronization: update ?city= query parameter without reloading
          try {
            const url = new URL(window.location.href);
            url.searchParams.set('city', current.name);
            window.history.replaceState({}, '', url.toString());
          } catch {}

          // Store each snapshot with enough context to avoid showing another city's data.
          localStorage.setItem(
            STORAGE_KEYS.CACHED_WEATHER,
            JSON.stringify({
              current,
              forecast: forecastRes,
              pollution: pollutionRes,
              theme: autoTheme,
              savedAt: Date.now(),
              requestedCity: target.city,
            })
          );
        }

        // Add to recent searches
        addRecentSearch({
          name: current.name,
          country: current.sys.country,
          lat: current.coord.lat,
          lon: current.coord.lon,
        });

        addToast(
          langRef.current === 'id'
            ? `Cuaca untuk ${current.name} berhasil diperbarui.`
            : `Weather for ${current.name} updated.`,
          'success'
        );
      } catch (err: unknown) {
        if (requestId !== requestIdRef.current) return;
        // Offline / Network Fallback Check
        if (typeof window !== 'undefined') {
          const cached = localStorage.getItem(STORAGE_KEYS.CACHED_WEATHER);
          if (cached) {
            try {
              const data: unknown = JSON.parse(cached);
              if (isCachedWeatherSnapshot(data) && matchesCachedWeather(data, target)) {
                setCurrentWeather(data.current);
                setForecast(data.forecast);
                setHourlyItems(interpolateHourlyForecast(data.current, data.forecast.list, 24));
                setAirPollution(data.pollution);
                setTheme(data.theme);
                document.body.setAttribute('data-theme', data.theme);
                setIsOffline(true);
                const ageMinutes = Math.max(
                  0,
                  Math.floor((Date.now() - data.savedAt) / 60000)
                );
                const ageText =
                  ageMinutes < 60
                    ? `${ageMinutes} ${langRef.current === 'id' ? 'menit' : 'minutes'}`
                    : `${Math.floor(ageMinutes / 60)} ${langRef.current === 'id' ? 'jam' : 'hours'}`;
                addToast(
                  langRef.current === 'id'
                    ? `Tidak dapat memperbarui ${data.current.name}. Menampilkan snapshot yang disimpan ${ageText} lalu.`
                    : `Could not refresh ${data.current.name}. Showing a snapshot saved ${ageText} ago.`,
                  'info'
                );
                return;
              }
            } catch (parseErr) {
              console.warn('Cached weather snapshot is invalid:', parseErr);
              localStorage.removeItem(STORAGE_KEYS.CACHED_WEATHER);
            }
          }
        }

        const errMsg = err instanceof Error ? err.message : 'Gagal memuat data cuaca.';
        addToast(errMsg, 'error');
      } finally {
        if (requestId === requestIdRef.current) setIsLoading(false);
      }
    },
    [addToast, addRecentSearch]
  );

  // Initialize from LocalStorage & Listen for Online/Offline events
  useEffect(() => {
    const storedUnit = localStorage.getItem(STORAGE_KEYS.UNIT);
    const savedUnit: UnitType = storedUnit === 'imperial' ? 'imperial' : 'metric';
    const rawLang = localStorage.getItem(STORAGE_KEYS.LANG);
    const savedLang: Language = rawLang === 'en' ? 'en' : 'id';
    let savedAlertPreferences = DEFAULT_ALERT_PREFERENCES;
    try {
      savedAlertPreferences = parseAlertPreferences(
        JSON.parse(localStorage.getItem(STORAGE_KEYS.ALERT_PREFERENCES) || 'null')
      );
    } catch (error) {
      console.warn('Saved alert preferences could not be read:', error);
    }

    let savedFavorites: FavoriteLocation[] = [];
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEYS.FAVORITES) || '[]');
      if (Array.isArray(parsed)) savedFavorites = parsed;
    } catch {}

    let savedRecents: RecentSearchItem[] = [];
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEYS.RECENTS) || '[]');
      if (Array.isArray(parsed)) savedRecents = parsed;
    } catch {}

    let initialCity = 'Jakarta';
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const queryCity = urlParams.get('city');
      if (queryCity && queryCity.trim()) {
        initialCity = queryCity.trim();
      } else {
        initialCity = localStorage.getItem(STORAGE_KEYS.LAST_CITY) || 'Jakarta';
      }
    }

    setUnit(savedUnit);
    setLang(savedLang);
    document.documentElement.lang = savedLang;
    unitRef.current = savedUnit;
    langRef.current = savedLang;
    setAlertPreferences(savedAlertPreferences);
    setFavorites(savedFavorites);
    setRecentSearches(savedRecents);

    // Initial check for offline state
    if (typeof navigator !== 'undefined') {
      setIsOffline(!navigator.onLine);
    }

    const handleOnline = () => {
      setIsOffline(false);
      addToast(
        savedLang === 'id' ? 'Koneksi internet terhubung kembali.' : 'Internet connection restored.',
        'success'
      );
    };

    const handleOffline = () => {
      setIsOffline(true);
      addToast(
        savedLang === 'id'
          ? 'Koneksi internet terputus. Mode offline aktif.'
          : 'Internet connection lost. Offline mode active.',
        'info'
      );
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    loadWeatherData({ city: initialCity }, savedUnit);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [loadWeatherData, addToast]);

  const handleUnitChange = (newUnit: UnitType) => {
    if (newUnit === unit) return;
    unitRef.current = newUnit;
    setUnit(newUnit);
    localStorage.setItem(STORAGE_KEYS.UNIT, newUnit);
    if (currentWeather) {
      loadWeatherData(
        { lat: currentWeather.coord.lat, lon: currentWeather.coord.lon },
        newUnit
      );
    }
  };

  const handleLangChange = (newLang: Language) => {
    langRef.current = newLang;
    setLang(newLang);
    document.documentElement.lang = newLang;
    localStorage.setItem(STORAGE_KEYS.LANG, newLang);
    addToast(
      newLang === 'id'
        ? 'Bahasa diubah ke Bahasa Indonesia 🇮🇩'
        : 'Language switched to English 🇬🇧',
      'info'
    );
  };

  const handleAlertPreferencesChange = (preferences: WeatherAlertPreferences) => {
    const normalized = parseAlertPreferences(preferences);
    setAlertPreferences(normalized);
    localStorage.setItem(STORAGE_KEYS.ALERT_PREFERENCES, JSON.stringify(normalized));
  };

  const handleToggleFavorite = () => {
    if (!currentWeather) return;
    const exists = favorites.some(
      (f) => f.city.toLowerCase() === currentWeather.name.toLowerCase()
    );

    let updated: FavoriteLocation[];
    if (exists) {
      updated = favorites.filter(
        (f) => f.city.toLowerCase() !== currentWeather.name.toLowerCase()
      );
      addToast(
        lang === 'id'
          ? `${currentWeather.name} dihapus dari daftar favorit.`
          : `${currentWeather.name} removed from favorites.`,
        'info'
      );
    } else {
      updated = [
        ...favorites,
        {
          city: currentWeather.name,
          country: currentWeather.sys.country,
          lat: currentWeather.coord.lat,
          lon: currentWeather.coord.lon,
        },
      ];
      addToast(
        lang === 'id'
          ? `${currentWeather.name} disimpan ke daftar favorit!`
          : `${currentWeather.name} added to favorites!`,
        'success'
      );
    }

    setFavorites(updated);
    localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(updated));
  };

  const handleRemoveFavorite = (cityName: string) => {
    const updated = favorites.filter((f) => f.city.toLowerCase() !== cityName.toLowerCase());
    setFavorites(updated);
    localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(updated));
    addToast(
      lang === 'id' ? `${cityName} dihapus dari favorit.` : `${cityName} removed from favorites.`,
      'info'
    );
  };

  const isCurrentFavorite = Boolean(
    currentWeather &&
      favorites.some((f) => f.city.toLowerCase() === currentWeather.name.toLowerCase())
  );

  const effectiveWeatherId = previewWeather
    ? previewWeather.weatherId
    : currentWeather?.weather[0]?.id;
  const effectiveWindSpeed = previewWeather
    ? previewWeather.windSpeed
    : currentWeather?.wind?.speed;
  const effectiveIsNight = previewWeather
    ? previewWeather.isNight
    : currentWeather
      ? currentWeather.weather[0].icon.endsWith('n')
      : false;
  const effectiveTheme: WeatherTheme = previewWeather
    ? getThemeFromWeather(previewWeather.weatherId, previewWeather.isNight)
    : theme;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.body.setAttribute('data-theme', effectiveTheme);
    }
  }, [effectiveTheme]);

  return (
    <>
      <WeatherCanvas
        theme={effectiveTheme}
        isNight={effectiveIsNight}
        weatherId={effectiveWeatherId}
        windSpeed={effectiveWindSpeed}
      />
      <div className="ambient-glow"></div>

      <div className="app-layout">
        {/* Navigation & Search Header */}
        <Header
          unit={unit}
          onUnitChange={handleUnitChange}
          lang={lang}
          onLangChange={handleLangChange}
          alertPreferences={alertPreferences}
          onAlertPreferencesChange={handleAlertPreferencesChange}
          onSearch={(city) => loadWeatherData({ city })}
          onCoordsSearch={(lat, lon) => loadWeatherData({ lat, lon })}
          onRefresh={() => {
            if (currentWeather) {
              loadWeatherData({
                lat: currentWeather.coord.lat,
                lon: currentWeather.coord.lon,
              });
            }
          }}
          isFavorite={isCurrentFavorite}
          onToggleFavorite={handleToggleFavorite}
          isLoading={isLoading}
          recentSearches={recentSearches}
          onSelectRecent={(item) => loadWeatherData({ lat: item.lat, lon: item.lon })}
          onRemoveRecent={handleRemoveRecent}
          onClearRecent={handleClearRecent}
          onOpenComparison={() => setIsComparisonOpen(true)}
          onOpenShare={() => setIsShareOpen(true)}
          onShowToast={addToast}
          weatherId={effectiveWeatherId}
          isNight={effectiveIsNight}
          windSpeedKmh={
            effectiveWindSpeed !== undefined
              ? unit === 'metric'
                ? effectiveWindSpeed * 3.6
                : effectiveWindSpeed * 1.609
              : 10
          }
        />

        {/* Quick Access Chips & Favorites */}
        <QuickChips
          currentCity={currentWeather?.name || ''}
          onSelectCity={(city) => loadWeatherData({ city })}
          favorites={favorites}
          onRemoveFavorite={handleRemoveFavorite}
          lang={lang}
        />

        {/* Extreme Weather Alert Banner (conditionally displayed if hazard detected) */}
        {currentWeather && (
          <ExtremeWeatherAlert
            current={currentWeather}
            pollution={airPollution}
            forecast={forecast}
            unit={unit}
            lang={lang}
            preferences={alertPreferences}
          />
        )}

        {/* Main Dashboard */}
        <main className="dashboard" id="weather-dashboard">
          {isLoading && (
            <div className="loading-skeleton">
              <div className="skeleton-spinner">
                <div className="spinner-ring"></div>
                <CloudSun size={26} color="#38bdf8" />
              </div>
              <p>{lang === 'id' ? 'Memuat telemetri cuaca...' : 'Loading atmospheric telemetry...'}</p>
            </div>
          )}

          {currentWeather && (
            <>
              {/* Left Column: Hero, Hourly Forecast & 24h Trend Chart */}
              <section className="column-left">
                <HeroCard
                  weather={currentWeather}
                  hourlyItems={hourlyItems.length > 0 ? hourlyItems : (forecast ? forecast.list : [])}
                  unit={unit}
                  lang={lang}
                  onOpenShare={() => setIsShareOpen(true)}
                  isOffline={isOffline}
                  onPreviewWeatherChange={setPreviewWeather}
                />
                {forecast && (
                  <>
                    <HourlyForecast
                      items={hourlyItems.length > 0 ? hourlyItems : forecast.list}
                      timezoneOffset={currentWeather.timezone}
                      onSelectHour={(idx) => setSelectedHourlyIndex(idx)}
                      unit={unit}
                      lang={lang}
                    />
                    <WeatherChart
                      items={hourlyItems.length > 0 ? hourlyItems : forecast.list}
                      timezoneOffset={currentWeather.timezone}
                      unit={unit}
                      lang={lang}
                    />
                    <AstronomyCard
                      sunrise={currentWeather.sys.sunrise}
                      sunset={currentWeather.sys.sunset}
                      timezone={currentWeather.timezone}
                      lang={lang}
                    />
                  </>
                )}
              </section>

              {/* Right Column: 8 Metric Highlights + Lifestyle Indexes & Smart Weather Advisor */}
              <section className="column-right">
                <MetricCards
                  current={currentWeather}
                  pollution={airPollution}
                  forecast={forecast}
                  unit={unit}
                  lang={lang}
                />
                <LifestyleIndexes
                  current={currentWeather}
                  pollution={airPollution}
                  forecast={forecast}
                  unit={unit}
                  lang={lang}
                />
                <WeatherAdvisor
                  current={currentWeather}
                  pollution={airPollution}
                  forecast={forecast}
                  unit={unit}
                  lang={lang}
                />
              </section>

              {/* Atmospheric Intelligence & 24H Optimal Windows (Full-Width) */}
              {forecast && (
                <section className="section-forecast-5day">
                  <AtmosphericInsightsCard
                    current={currentWeather}
                    hourlyItems={hourlyItems.length > 0 ? hourlyItems : forecast.list}
                    unit={unit}
                    lang={lang}
                    onSelectHour={(idx) => setSelectedHourlyIndex(idx)}
                  />
                </section>
              )}

              {/* Interactive Radar Map (Full-Width) */}
              <section className="section-forecast-5day">
                <WeatherMap
                  lat={currentWeather.coord.lat}
                  lon={currentWeather.coord.lon}
                  cityName={currentWeather.name}
                  currentTemp={Math.round(currentWeather.main.temp)}
                  unitSymbol={unit === 'metric' ? '°C' : '°F'}
                  lang={lang}
                  onLocationSelect={(lat, lon) => loadWeatherData({ lat, lon })}
                />
              </section>

              {/* 5-Day Extended Forecast */}
              {forecast && (
                <FiveDayForecast
                  items={forecast.list}
                  timezoneOffset={currentWeather ? currentWeather.timezone : 0}
                  currentTemp={currentWeather.main.temp}
                  unit={unit}
                  lang={lang}
                />
              )}
            </>
          )}
        </main>

        {/* Hourly Detail Modal */}
        {forecast && selectedHourlyIndex !== null && (
          <HourlyDetailModal
            isOpen={selectedHourlyIndex !== null}
            onClose={() => setSelectedHourlyIndex(null)}
            items={hourlyItems.length > 0 ? hourlyItems : forecast.list}
            currentIndex={selectedHourlyIndex}
            onSelectIndex={(idx) => setSelectedHourlyIndex(idx)}
            timezoneOffset={currentWeather ? currentWeather.timezone : 0}
            unit={unit}
            lang={lang}
          />
        )}

        {/* City Comparison Modal */}
        {currentWeather && isComparisonOpen && (
          <CityComparisonModal
            isOpen={isComparisonOpen}
            onClose={() => setIsComparisonOpen(false)}
            primaryWeather={currentWeather}
            unit={unit}
            lang={lang}
            onApplyCity={(cityName) => loadWeatherData({ city: cityName })}
          />
        )}

        {/* Share Weather Modal */}
        {currentWeather && isShareOpen && (
          <ShareWeatherModal
            isOpen={isShareOpen}
            onClose={() => setIsShareOpen(false)}
            weather={currentWeather}
            pollution={airPollution}
            unit={unit}
            lang={lang}
            onShowToast={addToast}
          />
        )}

        {/* Sticky Floating Weather Pill */}
        {currentWeather && (
          <StickyWeatherPill
            weather={currentWeather}
            unit={unit}
            lang={lang}
            onOpenComparison={() => setIsComparisonOpen(true)}
          />
        )}

        <ToastContainer toasts={toasts} />

        <footer className="app-footer">
          <div className="footer-content">
            <div className="footer-brand-row">
              <span className="footer-brand">✦ WeatherAether</span>
              <span className="footer-divider-dot" aria-hidden="true" />
              <span className="footer-tagline">
                {lang === 'id'
                  ? 'Stasiun Pengamatan Atmosfer Real-Time'
                  : 'Real-Time Atmospheric Observation'}
              </span>
            </div>

            <div className="footer-credit-badge">
              <span>Made with</span>
              <span className="footer-heart" role="img" aria-label="love">❤️</span>
              <span>by</span>
              <span className="footer-author">Dio</span>
            </div>

            <div className="footer-meta-row">
              <span className="footer-copyright">
                &copy; {new Date().getFullYear()} WeatherAether
              </span>
              <span className="footer-meta-divider">&bull;</span>
              <span className="footer-subtext">
                {lang === 'id'
                  ? 'Telemetri didukung oleh OpenWeatherMap, Open-Meteo & RainViewer'
                  : 'Telemetry powered by OpenWeatherMap, Open-Meteo & RainViewer'}
              </span>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

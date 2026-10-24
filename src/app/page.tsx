'use client';

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { CloudSun, WifiOff } from 'lucide-react';
import {
  CurrentWeatherResponse,
  ForecastResponse,
  AirPollutionResponse,
  UnitType,
  WeatherTheme,
  FavoriteLocation,
} from '@/types/weather';
import {
  fetchCurrentWeather,
  fetchForecastData,
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
import { StickyWeatherPill } from '@/components/StickyWeatherPill';
import { notifyWeatherUpdate } from '@/utils/notificationUtils';

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
};

export default function WeatherPage() {
  const [unit, setUnit] = useState<UnitType>('metric');
  const [lang, setLang] = useState<Language>('id');
  const [theme, setTheme] = useState<WeatherTheme>('siang');
  const [currentWeather, setCurrentWeather] = useState<CurrentWeatherResponse | null>(null);
  const [forecast, setForecast] = useState<ForecastResponse | null>(null);
  const [airPollution, setAirPollution] = useState<AirPollutionResponse | null>(null);
  const [favorites, setFavorites] = useState<FavoriteLocation[]>([]);
  const [recentSearches, setRecentSearches] = useState<RecentSearchItem[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isOffline, setIsOffline] = useState<boolean>(false);

  // Modals state
  const [selectedHourlyIndex, setSelectedHourlyIndex] = useState<number | null>(null);
  const [isComparisonOpen, setIsComparisonOpen] = useState<boolean>(false);
  const [isShareOpen, setIsShareOpen] = useState<boolean>(false);

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
    async (target: { city?: string; lat?: number; lon?: number }, selectedUnit = unit) => {
      setIsLoading(true);
      try {
        const current = await fetchCurrentWeather(target, selectedUnit);
        const [forecastRes, pollutionRes] = await Promise.all([
          fetchForecastData(current.coord.lat, current.coord.lon, selectedUnit),
          fetchAirPollutionData(current.coord.lat, current.coord.lon),
        ]);

        setCurrentWeather(current);
        setForecast(forecastRes);
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

          // Browser push notification if user opted-in
          const unitSymbol = selectedUnit === 'metric' ? '°C' : '°F';
          const conditionDesc =
            t.descriptions[current.weather[0].description.toLowerCase()] ||
            current.weather[0].description;
          notifyWeatherUpdate(
            current.name,
            Math.round(current.main.temp),
            unitSymbol,
            conditionDesc
          );

          // Cache snapshot for offline mode
          localStorage.setItem(
            STORAGE_KEYS.CACHED_WEATHER,
            JSON.stringify({
              current,
              forecast: forecastRes,
              pollution: pollutionRes,
              theme: autoTheme,
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
          lang === 'id'
            ? `Cuaca untuk ${current.name} berhasil diperbarui.`
            : `Weather for ${current.name} updated.`,
          'success'
        );
      } catch (err: unknown) {
        console.error(err);
        // Offline / Network Fallback Check
        if (typeof window !== 'undefined') {
          const cached = localStorage.getItem(STORAGE_KEYS.CACHED_WEATHER);
          if (cached) {
            try {
              const data = JSON.parse(cached);
              setCurrentWeather(data.current);
              setForecast(data.forecast);
              setAirPollution(data.pollution);
              if (data.theme) {
                setTheme(data.theme);
                document.body.setAttribute('data-theme', data.theme);
              }
              setIsOffline(true);
              addToast(
                lang === 'id'
                  ? 'Gagal terhubung ke jaringan. Menampilkan cuaca tersimpan (Offline).'
                  : 'Network unreachable. Displaying cached weather snapshot.',
                'info'
              );
              return;
            } catch (parseErr) {
              console.warn(parseErr);
            }
          }
        }

        const errMsg = err instanceof Error ? err.message : 'Gagal memuat data cuaca.';
        addToast(errMsg, 'error');
      } finally {
        setIsLoading(false);
      }
    },
    [unit, lang, addToast, addRecentSearch]
  );

  // Initialize from LocalStorage & Listen for Online/Offline events
  useEffect(() => {
    const savedUnit = (localStorage.getItem(STORAGE_KEYS.UNIT) as UnitType) || 'metric';
    const rawLang = localStorage.getItem(STORAGE_KEYS.LANG);
    const savedLang: Language = rawLang === 'en' ? 'en' : 'id';

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
    setLang(newLang);
    localStorage.setItem(STORAGE_KEYS.LANG, newLang);
    addToast(
      newLang === 'id'
        ? 'Bahasa diubah ke Bahasa Indonesia 🇮🇩'
        : 'Language switched to English 🇬🇧',
      'info'
    );
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

  return (
    <>
      <WeatherCanvas theme={theme} />
      <div className="ambient-glow"></div>

      <div className="app-layout">
        {/* Navigation & Search Header */}
        <Header
          unit={unit}
          onUnitChange={handleUnitChange}
          lang={lang}
          onLangChange={handleLangChange}
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
          />
        )}

        {/* Main Dashboard */}
        <main className="dashboard" id="weather-dashboard">
          {isLoading && (
            <div className="loading-skeleton">
              <div className="skeleton-spinner">
                <div className="spinner-ring"></div>
                <CloudSun size={26} color="#facc15" />
              </div>
              <p>{lang === 'id' ? 'Memuat data atmosfer Next.js...' : 'Loading atmospheric data...'}</p>
            </div>
          )}

          {currentWeather && (
            <>
              {/* Left Column: Hero, Hourly Forecast & 24h Trend Chart */}
              <section className="column-left">
                <HeroCard
                  weather={currentWeather}
                  unit={unit}
                  lang={lang}
                  onOpenShare={() => setIsShareOpen(true)}
                  isOffline={isOffline}
                />
                {forecast && (
                  <>
                    <HourlyForecast
                      items={forecast.list}
                      timezoneOffset={currentWeather.timezone}
                      onSelectHour={(idx) => setSelectedHourlyIndex(idx)}
                      lang={lang}
                    />
                    <WeatherChart
                      items={forecast.list}
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

              {/* Interactive Radar Map (Full-Width) */}
              <section className="section-forecast-5day">
                <WeatherMap
                  lat={currentWeather.coord.lat}
                  lon={currentWeather.coord.lon}
                  cityName={currentWeather.name}
                  currentTemp={Math.round(currentWeather.main.temp)}
                  unitSymbol={unit === 'metric' ? '°C' : '°F'}
                  onLocationSelect={(lat, lon) => loadWeatherData({ lat, lon })}
                />
              </section>

              {/* 5-Day Extended Forecast */}
              {forecast && <FiveDayForecast items={forecast.list} lang={lang} />}
            </>
          )}
        </main>

        {/* Hourly Detail Modal */}
        {forecast && selectedHourlyIndex !== null && (
          <HourlyDetailModal
            isOpen={selectedHourlyIndex !== null}
            onClose={() => setSelectedHourlyIndex(null)}
            items={forecast.list}
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
          <p className="footer-copyright">
            &copy; {new Date().getFullYear()} Aether Weather &bull; Built with ❤️ by <span className="footer-author">Dio</span>
          </p>
          <p className="footer-subtext">
            {lang === 'id'
              ? 'Data cuaca real-time akurat didukung oleh OpenWeatherMap & RainViewer'
              : 'Real-time atmospheric intelligence powered by OpenWeatherMap & RainViewer'}
          </p>
        </footer>
      </div>
    </>
  );
}

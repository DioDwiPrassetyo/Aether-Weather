'use client';

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { CloudSun } from 'lucide-react';
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
import { WeatherCanvas } from '@/components/WeatherCanvas';
import { Header } from '@/components/Header';
import { QuickChips } from '@/components/QuickChips';
import { HeroCard } from '@/components/HeroCard';
import { HourlyForecast } from '@/components/HourlyForecast';
import { MetricCards } from '@/components/MetricCards';
import { FiveDayForecast } from '@/components/FiveDayForecast';
import { ExtremeWeatherAlert } from '@/components/ExtremeWeatherAlert';
import { WeatherAdvisor } from '@/components/WeatherAdvisor';
import { WeatherChart } from '@/components/WeatherChart';
import { ToastContainer, ToastMessage } from '@/components/Toast';

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
  FAVORITES: 'aether_next_favorites',
  LAST_CITY: 'aether_next_last_city',
};

export default function WeatherPage() {
  const [unit, setUnit] = useState<UnitType>('metric');
  const [theme, setTheme] = useState<WeatherTheme>('clear-day');
  const [currentWeather, setCurrentWeather] = useState<CurrentWeatherResponse | null>(null);
  const [forecast, setForecast] = useState<ForecastResponse | null>(null);
  const [airPollution, setAirPollution] = useState<AirPollutionResponse | null>(null);
  const [favorites, setFavorites] = useState<FavoriteLocation[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const addToast = useCallback((message: string, type: 'info' | 'success' | 'error' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  }, []);

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

        const isNight = current.weather[0].icon.endsWith('n');
        const nextTheme = getThemeFromWeather(current.weather[0].id, isNight);
        setTheme(nextTheme);

        if (typeof window !== 'undefined') {
          document.body.setAttribute('data-theme', nextTheme);
          localStorage.setItem(STORAGE_KEYS.LAST_CITY, current.name);
        }

        addToast(`Cuaca untuk ${current.name} berhasil diperbarui.`, 'success');
      } catch (err: unknown) {
        console.error(err);
        const errMsg = err instanceof Error ? err.message : 'Gagal memuat data cuaca.';
        addToast(errMsg, 'error');
      } finally {
        setIsLoading(false);
      }
    },
    [unit, addToast]
  );

  // Initialize from LocalStorage
  useEffect(() => {
    const savedUnit = (localStorage.getItem(STORAGE_KEYS.UNIT) as UnitType) || 'metric';
    const savedFavorites = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.FAVORITES) || '[]'
    ) as FavoriteLocation[];
    const lastCity = localStorage.getItem(STORAGE_KEYS.LAST_CITY) || 'Jakarta';

    setUnit(savedUnit);
    setFavorites(savedFavorites);
    loadWeatherData({ city: lastCity }, savedUnit);
  }, [loadWeatherData]);

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
      addToast(`${currentWeather.name} dihapus dari daftar favorit.`, 'info');
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
      addToast(`${currentWeather.name} disimpan ke daftar favorit!`, 'success');
    }

    setFavorites(updated);
    localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(updated));
  };

  const handleRemoveFavorite = (cityName: string) => {
    const updated = favorites.filter((f) => f.city.toLowerCase() !== cityName.toLowerCase());
    setFavorites(updated);
    localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(updated));
    addToast(`${cityName} dihapus dari favorit.`, 'info');
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
        />

        {/* Quick Access Chips & Favorites */}
        <QuickChips
          currentCity={currentWeather?.name || ''}
          onSelectCity={(city) => loadWeatherData({ city })}
          favorites={favorites}
          onRemoveFavorite={handleRemoveFavorite}
        />

        {/* Extreme Weather Alert Banner (conditionally displayed if hazard detected) */}
        {currentWeather && (
          <ExtremeWeatherAlert
            current={currentWeather}
            pollution={airPollution}
            forecast={forecast}
            unit={unit}
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
              <p>Memuat data atmosfer Next.js...</p>
            </div>
          )}

          {currentWeather && (
            <>
              {/* Left Column: Hero, Hourly Forecast & 24h Trend Chart */}
              <section className="column-left">
                <HeroCard weather={currentWeather} unit={unit} />
                {forecast && (
                  <>
                    <HourlyForecast
                      items={forecast.list}
                      timezoneOffset={currentWeather.timezone}
                    />
                    <WeatherChart
                      items={forecast.list}
                      timezoneOffset={currentWeather.timezone}
                      unit={unit}
                    />
                  </>
                )}
              </section>

              {/* Right Column: 8 Metric Highlights & Smart Weather Advisor */}
              <section className="column-right">
                <MetricCards
                  current={currentWeather}
                  pollution={airPollution}
                  forecast={forecast}
                  unit={unit}
                />
                <WeatherAdvisor
                  current={currentWeather}
                  pollution={airPollution}
                  forecast={forecast}
                  unit={unit}
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
              {forecast && <FiveDayForecast items={forecast.list} />}
            </>
          )}
        </main>

        <ToastContainer toasts={toasts} />

        <footer className="app-footer">
          <p>
            &copy; {new Date().getFullYear()} Aether Weather &bull; Data cuaca real-time akurat didukung oleh OpenWeatherMap
          </p>
        </footer>
      </div>
    </>
  );
}

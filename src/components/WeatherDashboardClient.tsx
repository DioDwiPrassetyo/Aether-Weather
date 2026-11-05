'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  CloudSun,
  LayoutDashboard,
  Radar,
  Plane,
  Briefcase,
  Compass,
  MapPin,
  Share2,
  ArrowLeftRight,
  ArrowUp,
} from 'lucide-react';
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
  I18N,
} from '@/utils/weatherUtils';
import {
  Language,
  isSupportedLanguage,
  getLanguageMeta,
  getTranslation,
  countryCodeToLanguage,
  timezoneToCountryCode,
} from '@/utils/i18n';
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
import { AdvancedAtmosphericSuite } from '@/components/AdvancedAtmosphericSuite';
import { CommunityGrowthSuite } from '@/components/CommunityGrowthSuite';
import { StickyWeatherPill } from '@/components/StickyWeatherPill';
import {
  DEFAULT_ALERT_PREFERENCES,
  isCachedWeatherSnapshot,
  matchesCachedWeather,
  parseAlertPreferences,
  WeatherAlertPreferences,
} from '@/utils/weatherRules';

export type StationSection = 'overview' | 'radar' | 'operational' | 'travel' | 'explore';

interface WeatherDashboardClientProps {
  section?: StationSection;
}

// Dynamically import Leaflet WeatherMap with SSR disabled
const WeatherMap = dynamic(
  () => import('@/components/WeatherMap').then((mod) => mod.WeatherMap),
  {
    ssr: false,
    loading: () => (
      <div
        className="glass-card weather-map-card"
        style={{
          minHeight: '420px',
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
  LANG_MODE: 'aether_next_lang_mode',
  DETECTED_COUNTRY: 'aether_detected_country',
  FAVORITES: 'aether_next_favorites',
  RECENTS: 'aether_next_recents',
  LAST_CITY: 'aether_next_last_city',
  CACHED_WEATHER: 'aether_cached_weather_snapshot',
  ALERT_PREFERENCES: 'aether_alert_preferences',
};

export function WeatherDashboardClient({ section }: WeatherDashboardClientProps) {
  const pathname = usePathname();

  const activeSection: StationSection = React.useMemo(() => {
    if (section) return section;
    if (pathname?.startsWith('/radar')) return 'radar';
    if (pathname?.startsWith('/operational')) return 'operational';
    if (pathname?.startsWith('/travel')) return 'travel';
    if (pathname?.startsWith('/explore')) return 'explore';
    return 'overview';
  }, [section, pathname]);

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
      selectedUnit = unitRef.current,
      options?: { silentToast?: boolean; backgroundRefresh?: boolean }
    ) => {
      const requestId = ++requestIdRef.current;
      if (!options?.backgroundRefresh) {
        setIsLoading(true);
      }
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

        const nowUtc = Date.now() + new Date().getTimezoneOffset() * 60000;
        const cityTime = new Date(nowUtc + current.timezone * 1000);
        const localHour = cityTime.getHours();
        const isNight = current.weather[0].icon.endsWith('n');
        const autoTheme = getThemeFromWeather(current.weather[0].id, isNight, localHour);
        setTheme(autoTheme);

        if (typeof window !== 'undefined') {
          document.body.setAttribute('data-theme', autoTheme);
          localStorage.setItem(STORAGE_KEYS.LAST_CITY, current.name);

          try {
            const url = new URL(window.location.href);
            url.searchParams.set('city', current.name);
            window.history.replaceState({}, '', url.toString());
          } catch {}

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

        addRecentSearch({
          name: current.name,
          country: current.sys.country,
          lat: current.coord.lat,
          lon: current.coord.lon,
        });

        if (!options?.silentToast) {
          addToast(
            langRef.current === 'id'
              ? `Cuaca untuk ${current.name} berhasil diperbarui.`
              : `Weather for ${current.name} updated.`,
            'success'
          );
        }
      } catch (err: unknown) {
        if (requestId !== requestIdRef.current) return;
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
                return;
              }
            } catch {
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

  const applyLanguage = useCallback((nextLang: Language) => {
    langRef.current = nextLang;
    I18N.setLanguage(nextLang);
    setLang(nextLang);
    if (typeof document !== 'undefined') {
      document.documentElement.lang = nextLang;
      document.documentElement.dir = getLanguageMeta(nextLang).dir || 'ltr';
    }
  }, []);

  const detectVisitorIpLocale = useCallback(async () => {
    if (typeof window === 'undefined') return;
    try {
      let countryCode = '';
      let detectedLang: Language | null = null;

      // 1. Check Server Edge / GeoIP Endpoint (/api/geo-locale)
      try {
        const res = await fetch('/api/geo-locale', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data?.countryCode && typeof data.countryCode === 'string') {
            countryCode = data.countryCode.toUpperCase();
          }
          if (isSupportedLanguage(data?.lang)) {
            detectedLang = data.lang;
          }
        }
      } catch {}

      // 2. If server didn't resolve a country code (e.g. localhost without internet proxy), query client GeoJS directly
      if (!countryCode) {
        try {
          const clientGeoRes = await fetch('https://get.geojs.io/v1/ip/geo.json', {
            cache: 'no-store',
          });
          if (clientGeoRes.ok) {
            const clientGeo = await clientGeoRes.json();
            if (clientGeo?.country_code && typeof clientGeo.country_code === 'string') {
              countryCode = clientGeo.country_code.toUpperCase().trim();
            }
          }
        } catch {}
      }

      // 3. Fallback to Timezone -> Country Code if IP lookup is blocked by adblocker/firewall
      if (!countryCode) {
        try {
          const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
          const tzCountry = timezoneToCountryCode(tz);
          if (tzCountry) countryCode = tzCountry;
        } catch {}
      }

      if (countryCode) {
        localStorage.setItem(STORAGE_KEYS.DETECTED_COUNTRY, countryCode);
      }

      const resolvedLang = countryCode
        ? countryCodeToLanguage(countryCode, navigator.language)
        : detectedLang || countryCodeToLanguage(null, navigator.language);

      const currentMode = localStorage.getItem(STORAGE_KEYS.LANG_MODE);
      if (currentMode !== 'manual') {
        applyLanguage(resolvedLang);
        localStorage.setItem(STORAGE_KEYS.LANG, resolvedLang);
      }
    } catch {}
  }, [applyLanguage]);

  // Initialize from LocalStorage + Automatic Silent IP Country Language Detection
  useEffect(() => {
    const storedUnit = localStorage.getItem(STORAGE_KEYS.UNIT);
    const savedUnit: UnitType = storedUnit === 'imperial' ? 'imperial' : 'metric';
    const storedLangMode = localStorage.getItem(STORAGE_KEYS.LANG_MODE);
    const isManualLang = storedLangMode === 'manual';
    const rawLang = localStorage.getItem(STORAGE_KEYS.LANG);
    const cachedCountry = localStorage.getItem(STORAGE_KEYS.DETECTED_COUNTRY);

    let initialLang: Language = 'id';
    if (isManualLang && isSupportedLanguage(rawLang)) {
      initialLang = rawLang;
    } else if (cachedCountry) {
      initialLang = countryCodeToLanguage(
        cachedCountry,
        typeof navigator !== 'undefined' ? navigator.language : 'id'
      );
    } else if (isSupportedLanguage(rawLang)) {
      initialLang = rawLang;
    } else if (typeof window !== 'undefined') {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const tzCountry = timezoneToCountryCode(tz);
      initialLang = countryCodeToLanguage(tzCountry, navigator.language);
    }

    let savedAlertPreferences = DEFAULT_ALERT_PREFERENCES;
    try {
      savedAlertPreferences = parseAlertPreferences(
        JSON.parse(localStorage.getItem(STORAGE_KEYS.ALERT_PREFERENCES) || 'null')
      );
    } catch {}

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
    applyLanguage(initialLang);
    unitRef.current = savedUnit;
    setAlertPreferences(savedAlertPreferences);
    setFavorites(savedFavorites);
    setRecentSearches(savedRecents);

    // Trigger IP Geolocation Language Detection in parallel
    void detectVisitorIpLocale();

    if (typeof navigator !== 'undefined') {
      setIsOffline(!navigator.onLine);
    }

    // Instant Hydration Check: if we navigated between pages and have a recent snapshot, hydrate immediately!
    let hydratedFromCache = false;
    try {
      const rawCache = localStorage.getItem(STORAGE_KEYS.CACHED_WEATHER);
      if (rawCache) {
        const parsedCache: unknown = JSON.parse(rawCache);
        if (
          isCachedWeatherSnapshot(parsedCache) &&
          matchesCachedWeather(parsedCache, { city: initialCity })
        ) {
          setCurrentWeather(parsedCache.current);
          setForecast(parsedCache.forecast);
          setHourlyItems(
            interpolateHourlyForecast(parsedCache.current, parsedCache.forecast.list, 24)
          );
          setAirPollution(parsedCache.pollution);
          setTheme(parsedCache.theme);
          document.body.setAttribute('data-theme', parsedCache.theme);
          setIsLoading(false);
          hydratedFromCache = Date.now() - parsedCache.savedAt < 8 * 60 * 1000;
        }
      }
    } catch {}

    if (!hydratedFromCache) {
      void loadWeatherData({ city: initialCity }, savedUnit, { silentToast: true });
    } else {
      // Refresh hourly curve quietly in background without showing skeleton
      void loadWeatherData({ city: initialCity }, savedUnit, {
        silentToast: true,
        backgroundRefresh: true,
      });
    }

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [loadWeatherData, applyLanguage, detectVisitorIpLocale]);

  const handleUnitChange = (newUnit: UnitType) => {
    if (newUnit === unit) return;
    unitRef.current = newUnit;
    setUnit(newUnit);
    localStorage.setItem(STORAGE_KEYS.UNIT, newUnit);
    if (currentWeather) {
      void loadWeatherData(
        { lat: currentWeather.coord.lat, lon: currentWeather.coord.lon },
        newUnit
      );
    }
  };

  const handleLangChange = (newLang: Language) => {
    localStorage.setItem(STORAGE_KEYS.LANG_MODE, 'manual');
    localStorage.setItem(STORAGE_KEYS.LANG, newLang);
    applyLanguage(newLang);
    const meta = getLanguageMeta(newLang);
    addToast(`${meta.flag} ${meta.nativeName}`, 'info');
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

  const t = getTranslation(lang);

  const cityQuerySuffix = currentWeather?.name
    ? `?city=${encodeURIComponent(currentWeather.name)}`
    : '';

  const navItems: {
    id: StationSection;
    href: string;
    label: string;
    shortLabel: string;
    desc: string;
    icon: React.ReactNode;
  }[] = [
    {
      id: 'overview',
      href: `/${cityQuerySuffix}`,
      label: t.navOverview,
      shortLabel: t.navOverviewShort,
      desc: t.navOverviewDesc,
      icon: <LayoutDashboard size={15} />,
    },
    {
      id: 'radar',
      href: `/radar${cityQuerySuffix}`,
      label: t.navRadar,
      shortLabel: t.navRadarShort,
      desc: t.navRadarDesc,
      icon: <Radar size={15} />,
    },
    {
      id: 'operational',
      href: `/operational${cityQuerySuffix}`,
      label: t.navOperational,
      shortLabel: t.navOperationalShort,
      desc: t.navOperationalDesc,
      icon: <Plane size={15} />,
    },
    {
      id: 'travel',
      href: `/travel${cityQuerySuffix}`,
      label: t.navTravel,
      shortLabel: t.navTravelShort,
      desc: t.navTravelDesc,
      icon: <Briefcase size={15} />,
    },
    {
      id: 'explore',
      href: `/explore${cityQuerySuffix}`,
      label: t.navExplore,
      shortLabel: t.navExploreShort,
      desc: t.navExploreDesc,
      icon: <Compass size={15} />,
    },
  ];

  const activeNavMeta = navItems.find((n) => n.id === activeSection) || navItems[0];

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
          onSearch={(city) => void loadWeatherData({ city })}
          onCoordsSearch={(lat, lon) => void loadWeatherData({ lat, lon })}
          onRefresh={() => {
            if (currentWeather) {
              void loadWeatherData({
                lat: currentWeather.coord.lat,
                lon: currentWeather.coord.lon,
              });
            }
          }}
          isFavorite={isCurrentFavorite}
          onToggleFavorite={handleToggleFavorite}
          isLoading={isLoading}
          recentSearches={recentSearches}
          onSelectRecent={(item) => void loadWeatherData({ lat: item.lat, lon: item.lon })}
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

        {/* MULTI-PAGE NAVIGATION BAR (Compact 5-Tab Bar on Mobile, Pill Bar on Desktop) */}
        <nav className="glass-card station-page-nav" aria-label="Navigasi Halaman Utama">
          <div className="station-nav-links">
            {navItems.map((item) => {
              const isActive = item.id === activeSection;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`station-nav-link ${isActive ? 'active' : ''}`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <span className="station-nav-icon">{item.icon}</span>
                  <span className="station-nav-label station-nav-label-full">
                    {item.label}
                  </span>
                  <span className="station-nav-label station-nav-label-short">
                    {item.shortLabel}
                  </span>
                </Link>
              );
            })}
          </div>

          {currentWeather && (
            <div className="station-nav-city-status">
              <MapPin size={13} color="#38bdf8" />
              <span className="station-nav-city-name">
                {currentWeather.name}, {currentWeather.sys.country}
              </span>
              <strong className="station-nav-city-temp">
                {Math.round(currentWeather.main.temp)}°{unit === 'metric' ? 'C' : 'F'}
              </strong>
              <span className="station-nav-city-cond">
                {I18N.translate(currentWeather.weather[0]?.description || '', lang)}
              </span>
            </div>
          )}
        </nav>

        {/* Quick Access Chips & Favorites */}
        <QuickChips
          currentCity={currentWeather?.name || ''}
          onSelectCity={(city) => void loadWeatherData({ city })}
          favorites={favorites}
          onRemoveFavorite={handleRemoveFavorite}
          lang={lang}
        />

        {/* Extreme Weather Alert Banner (Shown on Main Overview Page) */}
        {currentWeather && activeSection === 'overview' && (
          <ExtremeWeatherAlert
            current={currentWeather}
            pollution={airPollution}
            forecast={forecast}
            unit={unit}
            lang={lang}
            preferences={alertPreferences}
          />
        )}

        {/* Contextual Sub-Page Header Banner (Shown on /radar, /operational, /travel, /explore) */}
        {currentWeather && activeSection !== 'overview' && (
          <div className="glass-card station-subpage-banner">
            <div className="subpage-banner-left">
              <div className="subpage-icon-orb">{activeNavMeta.icon}</div>
              <div className="subpage-banner-text">
                <div className="subpage-eyebrow">
                  <span>{activeNavMeta.label}</span>
                  <span>&bull;</span>
                  <span>
                    {currentWeather.name}, {currentWeather.sys.country}
                  </span>
                  <strong className="subpage-eyebrow-temp">
                    {Math.round(currentWeather.main.temp)}°{unit === 'metric' ? 'C' : 'F'}
                  </strong>
                </div>
                <h2 className="subpage-heading">{activeNavMeta.desc}</h2>
              </div>
            </div>

            <div className="subpage-banner-right">
              <button
                type="button"
                className="subpage-action-btn"
                onClick={() => setIsComparisonOpen(true)}
                title={t.compareButton}
              >
                <ArrowLeftRight size={14} />
                <span>{t.compareButton}</span>
              </button>
              <button
                type="button"
                className="subpage-action-btn primary"
                onClick={() => setIsShareOpen(true)}
                title={t.shareWeather}
              >
                <Share2 size={14} />
                <span>{t.shareWeather}</span>
              </button>
            </div>
          </div>
        )}

        {/* Main Content Area by Active Page */}
        <main
          className={activeSection === 'overview' ? 'dashboard' : 'station-single-page'}
          id="weather-dashboard"
        >
          {isLoading && !currentWeather && (
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
              {/* ===============================================================
                  PAGE 1: OVERVIEW DASHBOARD (/)
                 =============================================================== */}
              {activeSection === 'overview' && (
                <>
                  <section className="column-left">
                    <HeroCard
                      weather={currentWeather}
                      hourlyItems={
                        hourlyItems.length > 0 ? hourlyItems : forecast ? forecast.list : []
                      }
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

                  {forecast && (
                    <FiveDayForecast
                      items={forecast.list}
                      timezoneOffset={currentWeather.timezone}
                      currentTemp={currentWeather.main.temp}
                      unit={unit}
                      lang={lang}
                    />
                  )}
                </>
              )}

              {/* ===============================================================
                  PAGE 2: DOPPLER RADAR MAP & OPTIMAL WINDOWS (/radar)
                 =============================================================== */}
              {activeSection === 'radar' && (
                <div className="station-page-stack">
                  <WeatherMap
                    lat={currentWeather.coord.lat}
                    lon={currentWeather.coord.lon}
                    cityName={currentWeather.name}
                    currentTemp={Math.round(currentWeather.main.temp)}
                    unitSymbol={unit === 'metric' ? '°C' : '°F'}
                    lang={lang}
                    onLocationSelect={(lat, lon) => void loadWeatherData({ lat, lon })}
                  />

                  {forecast && (
                    <AtmosphericInsightsCard
                      current={currentWeather}
                      hourlyItems={hourlyItems.length > 0 ? hourlyItems : forecast.list}
                      unit={unit}
                      lang={lang}
                      onSelectHour={(idx) => setSelectedHourlyIndex(idx)}
                    />
                  )}
                </div>
              )}

              {/* ===============================================================
                  PAGE 3: AVIATION, MARINE TIDES & EARLY WARNING SIREN (/operational)
                 =============================================================== */}
              {activeSection === 'operational' && (
                <div className="station-page-stack">
                  <AdvancedAtmosphericSuite
                    current={currentWeather}
                    hourlyItems={
                      hourlyItems.length > 0 ? hourlyItems : forecast ? forecast.list : []
                    }
                    forecast={forecast}
                    pollution={airPollution}
                    unit={unit}
                    lang={lang}
                    initialTab="drone"
                    mode="operational"
                    onShowToast={addToast}
                  />

                  <AstronomyCard
                    sunrise={currentWeather.sys.sunrise}
                    sunset={currentWeather.sys.sunset}
                    timezone={currentWeather.timezone}
                    lang={lang}
                  />
                </div>
              )}

              {/* ===============================================================
                  PAGE 4: SMART TRAVEL & PACKING ASSISTANT (/travel)
                 =============================================================== */}
              {activeSection === 'travel' && (
                <div className="station-page-stack">
                  <AdvancedAtmosphericSuite
                    current={currentWeather}
                    hourlyItems={
                      hourlyItems.length > 0 ? hourlyItems : forecast ? forecast.list : []
                    }
                    forecast={forecast}
                    pollution={airPollution}
                    unit={unit}
                    lang={lang}
                    initialTab="travel"
                    mode="travel"
                    onShowToast={addToast}
                  />

                  <div className="station-two-col-grid">
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
                  </div>
                </div>
              )}

              {/* ===============================================================
                  PAGE 5: CLIMATE TIME MACHINE, MYSTERY CITY & WIDGET LAB (/explore)
                 =============================================================== */}
              {activeSection === 'explore' && (
                <div className="station-page-stack">
                  <CommunityGrowthSuite
                    current={currentWeather}
                    unit={unit}
                    lang={lang}
                    onSelectCity={(city) => void loadWeatherData({ city })}
                    onShowToast={addToast}
                  />
                </div>
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
            onApplyCity={(cityName) => void loadWeatherData({ city: cityName })}
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

        <footer className="app-footer" role="contentinfo">
          <div className="footer-inner">
            <div className="footer-brand-meta">
              <span className="footer-brand-name">WeatherAether</span>
              <span className="footer-dot-sep" aria-hidden="true">&bull;</span>
              <span className="footer-copyright-text">&copy; {new Date().getFullYear()} Dio</span>
            </div>

            <div className="footer-sources-line">
              <span>OpenWeatherMap</span>
              <span className="footer-dot-sep" aria-hidden="true">&bull;</span>
              <span>Open-Meteo</span>
              <span className="footer-dot-sep" aria-hidden="true">&bull;</span>
              <span>RainViewer</span>
            </div>

            <button
              type="button"
              className="footer-scroll-top-btn"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
              aria-label={lang === 'id' ? 'Kembali ke atas' : 'Back to top'}
              title={lang === 'id' ? 'Kembali ke atas' : 'Back to top'}
            >
              <span>{lang === 'id' ? 'Ke Atas' : 'Top'}</span>
              <ArrowUp size={13} />
            </button>
          </div>
        </footer>
      </div>
    </>
  );
}

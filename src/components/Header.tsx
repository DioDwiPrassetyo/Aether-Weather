'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  CloudSun,
  Search,
  X,
  MapPin,
  Bookmark,
  BookmarkCheck,
  RefreshCw,
  Globe,
  ArrowRightLeft,
  Share2,
  History,
  Trash2,
  Mic,
  MicOff,
  Bell,
  BellRing,
} from 'lucide-react';
import { GeocodingResult, UnitType } from '@/types/weather';
import { Language, getTranslation } from '@/utils/i18n';
import { searchGeocoding } from '@/utils/weatherUtils';
import {
  isNotificationSupported,
  getNotificationPermission,
  isNotificationActive,
  setNotificationActive,
  requestNotificationPermission,
  sendWeatherNotification,
} from '@/utils/notificationUtils';

export interface RecentSearchItem {
  name: string;
  country: string;
  lat: number;
  lon: number;
}

interface HeaderProps {
  unit: UnitType;
  onUnitChange: (unit: UnitType) => void;
  lang?: Language;
  onLangChange: (lang: Language) => void;
  onSearch: (city: string) => void;
  onCoordsSearch: (lat: number, lon: number) => void;
  onRefresh: () => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  isLoading: boolean;
  recentSearches?: RecentSearchItem[];
  onSelectRecent: (item: RecentSearchItem) => void;
  onRemoveRecent: (name: string) => void;
  onClearRecent: () => void;
  onOpenComparison: () => void;
  onOpenShare: () => void;
  onShowToast?: (msg: string, type?: 'info' | 'success' | 'error') => void;
}

export const Header: React.FC<HeaderProps> = ({
  unit,
  onUnitChange,
  lang = 'id',
  onLangChange,
  onSearch,
  onCoordsSearch,
  onRefresh,
  isFavorite,
  onToggleFavorite,
  isLoading,
  recentSearches = [],
  onSelectRecent,
  onRemoveRecent,
  onClearRecent,
  onOpenComparison,
  onOpenShare,
  onShowToast,
}) => {
  const currentLang = lang || 'id';
  const t = getTranslation(currentLang);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<GeocodingResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isListening, setIsListening] = useState(false);
  const [hasVoiceSupport, setHasVoiceSupport] = useState(false);
  const [notifState, setNotifState] = useState<{
    supported: boolean;
    active: boolean;
    permission: NotificationPermission;
  }>({
    supported: false,
    active: false,
    permission: 'default',
  });

  const inputRef = useRef<HTMLInputElement | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<any>(null);

  // Check speech recognition & notification support on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRec =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      setHasVoiceSupport(!!SpeechRec);

      const supported = isNotificationSupported();
      const permission = getNotificationPermission();
      const active = isNotificationActive();
      setNotifState({ supported, active, permission });
    }
  }, []);

  const handleVoiceSearch = () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      if (onShowToast) {
        onShowToast(t.voiceSearchError, 'error');
      } else {
        alert(t.voiceSearchError);
      }
      return;
    }

    if (isListening) {
      try {
        recognitionRef.current?.stop();
      } catch {}
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = currentLang === 'id' ? 'id-ID' : 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        if (onShowToast) {
          onShowToast(t.voiceSearchListening, 'info');
        }
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript;
        if (transcript) {
          const cleanedCity = transcript.replace(/[.,!?]/g, '').trim();
          setQuery(cleanedCity);
          setIsListening(false);
          onSearch(cleanedCity);
        }
      };

      recognition.onerror = (e: any) => {
        console.warn('Speech recognition error:', e);
        setIsListening(false);
        if (onShowToast) {
          onShowToast(t.voiceSearchError, 'error');
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn('Failed to start speech recognition:', err);
      setIsListening(false);
    }
  };

  const handleToggleNotifications = async () => {
    if (!notifState.supported) {
      if (onShowToast) {
        onShowToast(
          currentLang === 'id'
            ? 'Browser Anda belum mendukung Web Notifications API.'
            : 'Your browser does not support Web Notifications.',
          'error'
        );
      }
      return;
    }

    if (notifState.active) {
      setNotificationActive(false);
      setNotifState((prev) => ({ ...prev, active: false }));
      if (onShowToast) onShowToast(t.notificationsDenied, 'info');
      return;
    }

    const perm = await requestNotificationPermission();
    if (perm === 'granted') {
      setNotificationActive(true);
      setNotifState({ supported: true, active: true, permission: 'granted' });
      sendWeatherNotification('🌤️ Aether Weather', {
        body:
          currentLang === 'id'
            ? 'Notifikasi cuaca berhasil diaktifkan! Anda akan menerima peringatan cuaca otomatis.'
            : 'Weather notifications enabled! You will receive atmospheric updates.',
      });
      if (onShowToast) onShowToast(t.notificationsEnabled, 'success');
    } else {
      setNotifState((prev) => ({ ...prev, active: false, permission: perm }));
      if (onShowToast) onShowToast(t.notificationsDenied, 'error');
    }
  };

  // Keyboard shortcut '/'
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, []);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
        setIsInputFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);

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
        setSelectedIndex(-1);
      } catch (err) {
        console.error(err);
      }
    }, 300);
  };

  const handleSelectCity = (city: GeocodingResult) => {
    setQuery(city.name);
    setShowSuggestions(false);
    setIsInputFocused(false);
    onCoordsSearch(city.lat, city.lon);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' && suggestions.length > 0) {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp' && suggestions.length > 0) {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        handleSelectCity(suggestions[selectedIndex]);
      } else if (query.trim()) {
        setShowSuggestions(false);
        setIsInputFocused(false);
        onSearch(query.trim());
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setIsInputFocused(false);
    }
  };

  const handleGpsClick = () => {
    if (!navigator.geolocation) {
      alert(lang === 'id' ? 'Browser Anda tidak mendukung deteksi lokasi GPS.' : 'Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onCoordsSearch(pos.coords.latitude, pos.coords.longitude);
      },
      (err) => {
        alert(
          err.code === 1
            ? lang === 'id'
              ? 'Izin lokasi GPS ditolak.'
              : 'GPS location permission denied.'
            : lang === 'id'
            ? 'Gagal mendeteksi lokasi GPS.'
            : 'Failed to retrieve GPS location.'
        );
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const toggleLanguage = () => {
    const nextLang: Language = currentLang === 'id' ? 'en' : 'id';
    onLangChange(nextLang);
  };

  const shouldShowRecent = isInputFocused && !query.trim() && recentSearches.length > 0;

  return (
    <header className="app-header">
      {/* Brand */}
      <div className="brand">
        <div className="brand-icon">
          <CloudSun className="icon-brand" size={26} color="#fef08a" />
        </div>
        <div className="brand-text">
          <h1>
            Aether<span>Weather</span>
          </h1>
          <span className="brand-subtitle">{t.brandSubtitle}</span>
        </div>
      </div>

      {/* Search Input Container */}
      <div className="search-container" ref={containerRef}>
        <div className="search-input-wrapper">
          <Search className="search-icon" size={18} />
          <input
            ref={inputRef}
            type="text"
            id="city-input"
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              setIsInputFocused(true);
              if (suggestions.length > 0) setShowSuggestions(true);
            }}
            placeholder={t.searchPlaceholder}
            autoComplete="off"
            spellCheck="false"
          />
          {query && (
            <button
              className="clear-search-btn"
              onClick={() => {
                setQuery('');
                setShowSuggestions(false);
                inputRef.current?.focus();
              }}
              title={t.clearSearchTooltip}
            >
              <X size={16} />
            </button>
          )}
          {/* Voice Search Button */}
          <button
            type="button"
            className={`voice-search-btn ${isListening ? 'listening' : ''}`}
            onClick={handleVoiceSearch}
            title={isListening ? t.voiceSearchListening : t.voiceSearchTooltip}
            aria-label="Pencarian Suara"
          >
            {isListening ? (
              <span className="mic-wave-container">
                <Mic size={17} color="#ef4444" />
                <span className="mic-pulse-ring"></span>
              </span>
            ) : (
              <Mic size={17} />
            )}
          </button>

          <button className="gps-btn" onClick={handleGpsClick} title={t.gpsTooltip}>
            <MapPin size={18} />
            <span className="gps-pulse"></span>
          </button>
        </div>

        {/* Recent Searches Dropdown */}
        {shouldShowRecent && (
          <div className="autocomplete-list recent-searches-list">
            <div className="recent-list-header">
              <span className="recent-list-title">
                <History size={14} color="#38bdf8" /> {t.recentSearchesTitle}
              </span>
              <button className="clear-history-btn" onClick={onClearRecent} title={t.clearHistory}>
                <Trash2 size={12} /> {t.clearHistory}
              </button>
            </div>

            {recentSearches.map((item, idx) => (
              <div
                key={`${item.lat}-${item.lon}-${idx}`}
                className="autocomplete-item recent-item"
                onClick={() => {
                  setQuery(item.name);
                  setIsInputFocused(false);
                  onSelectRecent(item);
                }}
              >
                <div className="item-left">
                  <History size={15} color="#94a3b8" />
                  <span className="item-city">{item.name}</span>
                </div>
                <div className="recent-item-right">
                  <span className="item-country">{item.country}</span>
                  <button
                    className="remove-recent-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveRecent(item.name);
                    }}
                    title="Hapus item ini"
                  >
                    <X size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Autocomplete Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="autocomplete-list" style={{ display: 'flex' }}>
            {suggestions.map((city, idx) => (
              <div
                key={`${city.lat}-${city.lon}-${idx}`}
                className={`autocomplete-item ${idx === selectedIndex ? 'selected' : ''}`}
                onClick={() => handleSelectCity(city)}
              >
                <div className="item-left">
                  <MapPin size={16} color="#38bdf8" />
                  <div>
                    <span className="item-city">{city.name}</span>
                    {city.state && <span className="item-state">{city.state}</span>}
                  </div>
                </div>
                <span className="item-country">{city.country}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Header Controls */}
      <div className="header-controls">
        {/* Browser Notifications Toggle */}
        <button
          className={`control-btn notif-toggle-btn ${notifState.active ? 'active' : ''}`}
          onClick={handleToggleNotifications}
          title={notifState.active ? t.notificationsEnabled : t.notificationsTooltip}
          aria-label="Notifikasi Cuaca"
        >
          {notifState.active ? (
            <BellRing size={16} color="#38bdf8" />
          ) : (
            <Bell size={16} />
          )}
        </button>

        {/* Language Switcher (ID / EN) */}
        <button
          className="control-btn lang-toggle-btn"
          onClick={toggleLanguage}
          title={`Ganti Bahasa (Sekarang: ${currentLang.toUpperCase()})`}
        >
          <Globe size={16} color="#38bdf8" />
          <span className="lang-label">{currentLang.toUpperCase()}</span>
        </button>

        {/* City Comparison Button */}
        <button
          className="control-btn compare-nav-btn"
          onClick={onOpenComparison}
          title={t.compareButton}
        >
          <ArrowRightLeft size={16} />
          <span className="control-btn-text">{t.compareButton}</span>
        </button>

        {/* Share Button */}
        <button
          className="control-btn nav-card-export-btn"
          onClick={onOpenShare}
          title={t.shareWeather}
        >
          <Share2 size={16} />
          <span className="control-btn-text">{lang === 'id' ? 'Bagikan' : 'Share'}</span>
        </button>

        {/* Temperature Unit Toggle (°C / °F) */}
        <div className="unit-toggle" role="radiogroup" aria-label="Temperature Unit">
          <button
            className={`unit-btn ${unit === 'metric' ? 'active' : ''}`}
            onClick={() => onUnitChange('metric')}
          >
            °C
          </button>
          <button
            className={`unit-btn ${unit === 'imperial' ? 'active' : ''}`}
            onClick={() => onUnitChange('imperial')}
          >
            °F
          </button>
        </div>

        {/* Bookmark Favorite */}
        <button
          className={`control-btn ${isFavorite ? 'active' : ''}`}
          onClick={onToggleFavorite}
          title={isFavorite ? t.favoriteRemoveTooltip : t.favoriteAddTooltip}
        >
          {isFavorite ? <BookmarkCheck size={18} color="#facc15" /> : <Bookmark size={18} />}
        </button>

        {/* Refresh Weather */}
        <button
          className="control-btn"
          onClick={onRefresh}
          title={t.refreshTooltip}
        >
          <RefreshCw size={18} className={isLoading ? 'spinning' : ''} />
        </button>
      </div>
    </header>
  );
};

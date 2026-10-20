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
} from 'lucide-react';
import { GeocodingResult, UnitType } from '@/types/weather';
import { searchGeocoding } from '@/utils/weatherUtils';

interface HeaderProps {
  unit: UnitType;
  onUnitChange: (unit: UnitType) => void;
  onSearch: (city: string) => void;
  onCoordsSearch: (lat: number, lon: number) => void;
  onRefresh: () => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  isLoading: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  unit,
  onUnitChange,
  onSearch,
  onCoordsSearch,
  onRefresh,
  isFavorite,
  onToggleFavorite,
  isLoading,
}) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<GeocodingResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

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
        onSearch(query.trim());
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const handleGpsClick = () => {
    if (!navigator.geolocation) {
      alert('Browser Anda tidak mendukung deteksi lokasi GPS.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onCoordsSearch(pos.coords.latitude, pos.coords.longitude);
      },
      (err) => {
        alert(err.code === 1 ? 'Izin lokasi GPS ditolak.' : 'Gagal mendeteksi lokasi GPS.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

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
          <span className="brand-subtitle">Real-Time Weather Intelligence</span>
        </div>
      </div>

      {/* Search Input Container */}
      <div className="search-container">
        <div className="search-input-wrapper">
          <Search className="search-icon" size={18} />
          <input
            ref={inputRef}
            type="text"
            id="city-input"
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            placeholder="Cari kota atau daerah (tekan '/' untuk cari)..."
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
              title="Hapus pencarian"
            >
              <X size={16} />
            </button>
          )}
          <button className="gps-btn" onClick={handleGpsClick} title="Gunakan Lokasi Saat Ini">
            <MapPin size={18} />
            <span className="gps-pulse"></span>
          </button>
        </div>

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

      {/* Controls */}
      <div className="header-controls">
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

        <button
          className={`control-btn ${isFavorite ? 'active' : ''}`}
          onClick={onToggleFavorite}
          title={isFavorite ? 'Hapus dari Favorit' : 'Simpan ke Favorit'}
        >
          {isFavorite ? <BookmarkCheck size={18} color="#facc15" /> : <Bookmark size={18} />}
        </button>

        <button
          className="control-btn"
          onClick={onRefresh}
          title="Segarkan Data Cuaca"
        >
          <RefreshCw size={18} className={isLoading ? 'spinning' : ''} />
        </button>
      </div>
    </header>
  );
};

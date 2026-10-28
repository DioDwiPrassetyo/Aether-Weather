'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Globe2, Compass, Snowflake, Star, X } from 'lucide-react';
import { FavoriteLocation } from '@/types/weather';
import { Language, getTranslation } from '@/utils/i18n';

interface QuickChipsProps {
  currentCity: string;
  onSelectCity: (city: string) => void;
  favorites: FavoriteLocation[];
  onRemoveFavorite: (city: string) => void;
  lang?: Language;
}

type QuickCategory = 'global' | 'regional' | 'climate';

interface CityPreset {
  city: string;
  countryCode: string;
  tag?: { id: string; en: string };
}

const GLOBAL_METROPOLISES: CityPreset[] = [
  { city: 'Tokyo', countryCode: 'JP' },
  { city: 'London', countryCode: 'GB' },
  { city: 'New York', countryCode: 'US' },
  { city: 'Singapore', countryCode: 'SG' },
  { city: 'Paris', countryCode: 'FR' },
  { city: 'Dubai', countryCode: 'AE' },
  { city: 'Sydney', countryCode: 'AU' },
  { city: 'Seoul', countryCode: 'KR' },
  { city: 'Jakarta', countryCode: 'ID' },
];

const CLIMATE_ZONES: CityPreset[] = [
  { city: 'Reykjavik', countryCode: 'IS', tag: { id: 'Arktik', en: 'Arctic' } },
  { city: 'Sapporo', countryCode: 'JP', tag: { id: 'Salju', en: 'Snow' } },
  { city: 'Zermatt', countryCode: 'CH', tag: { id: 'Alpen', en: 'Alpine' } },
  { city: 'Tromsø', countryCode: 'NO', tag: { id: 'Kutub', en: 'Polar' } },
  { city: 'Cairo', countryCode: 'EG', tag: { id: 'Gurun', en: 'Arid' } },
  { city: 'Manaus', countryCode: 'BR', tag: { id: 'Tropis', en: 'Rainforest' } },
  { city: 'Wellington', countryCode: 'NZ', tag: { id: 'Berangin', en: 'Windy' } },
];

function getRegionalPresets(tz: string): {
  regionName: { id: string; en: string };
  cities: CityPreset[];
} {
  const lower = tz.toLowerCase();

  if (
    lower.includes('jakarta') ||
    lower.includes('pontianak') ||
    lower.includes('makassar') ||
    lower.includes('jayapura')
  ) {
    return {
      regionName: { id: 'Indonesia', en: 'Indonesia' },
      cities: [
        { city: 'Jakarta', countryCode: 'ID' },
        { city: 'Surabaya', countryCode: 'ID' },
        { city: 'Bandung', countryCode: 'ID' },
        { city: 'Denpasar', countryCode: 'ID' },
        { city: 'Yogyakarta', countryCode: 'ID' },
        { city: 'Semarang', countryCode: 'ID' },
        { city: 'Medan', countryCode: 'ID' },
        { city: 'Makassar', countryCode: 'ID' },
      ],
    };
  }

  if (lower.startsWith('asia/')) {
    return {
      regionName: { id: 'Asia-Pasifik', en: 'Asia-Pacific' },
      cities: [
        { city: 'Singapore', countryCode: 'SG' },
        { city: 'Tokyo', countryCode: 'JP' },
        { city: 'Seoul', countryCode: 'KR' },
        { city: 'Bangkok', countryCode: 'TH' },
        { city: 'Kuala Lumpur', countryCode: 'MY' },
        { city: 'Jakarta', countryCode: 'ID' },
        { city: 'Taipei', countryCode: 'TW' },
        { city: 'Hong Kong', countryCode: 'HK' },
      ],
    };
  }

  if (lower.startsWith('europe/')) {
    return {
      regionName: { id: 'Eropa', en: 'Europe' },
      cities: [
        { city: 'London', countryCode: 'GB' },
        { city: 'Paris', countryCode: 'FR' },
        { city: 'Berlin', countryCode: 'DE' },
        { city: 'Amsterdam', countryCode: 'NL' },
        { city: 'Madrid', countryCode: 'ES' },
        { city: 'Rome', countryCode: 'IT' },
        { city: 'Zurich', countryCode: 'CH' },
        { city: 'Stockholm', countryCode: 'SE' },
      ],
    };
  }

  if (lower.startsWith('america/')) {
    return {
      regionName: { id: 'Amerika', en: 'Americas' },
      cities: [
        { city: 'New York', countryCode: 'US' },
        { city: 'Los Angeles', countryCode: 'US' },
        { city: 'Chicago', countryCode: 'US' },
        { city: 'Toronto', countryCode: 'CA' },
        { city: 'Vancouver', countryCode: 'CA' },
        { city: 'Mexico City', countryCode: 'MX' },
        { city: 'São Paulo', countryCode: 'BR' },
        { city: 'Buenos Aires', countryCode: 'AR' },
      ],
    };
  }

  if (lower.startsWith('australia/') || lower.startsWith('pacific/')) {
    return {
      regionName: { id: 'Oseania', en: 'Oceania' },
      cities: [
        { city: 'Sydney', countryCode: 'AU' },
        { city: 'Melbourne', countryCode: 'AU' },
        { city: 'Brisbane', countryCode: 'AU' },
        { city: 'Perth', countryCode: 'AU' },
        { city: 'Auckland', countryCode: 'NZ' },
        { city: 'Wellington', countryCode: 'NZ' },
      ],
    };
  }

  return {
    regionName: { id: 'Regional', en: 'Regional' },
    cities: GLOBAL_METROPOLISES,
  };
}

export const QuickChips: React.FC<QuickChipsProps> = ({
  currentCity,
  onSelectCity,
  favorites,
  onRemoveFavorite,
  lang = 'id',
}) => {
  const t = getTranslation(lang);
  const [activeCategory, setActiveCategory] = useState<QuickCategory>('global');
  const [userTimezone, setUserTimezone] = useState<string>('Asia/Jakarta');

  useEffect(() => {
    try {
      const resolved = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (resolved) setUserTimezone(resolved);
    } catch {
      // Fallback to default
    }
  }, []);

  const regionalData = useMemo(() => getRegionalPresets(userTimezone), [userTimezone]);

  const displayedCities = useMemo(() => {
    if (activeCategory === 'regional') return regionalData.cities;
    if (activeCategory === 'climate') return CLIMATE_ZONES;
    return GLOBAL_METROPOLISES;
  }, [activeCategory, regionalData]);

  return (
    <div className="quick-bar">
      <div className="quick-chips-wrapper">
        {/* Interactive Global / Regional / Climate Zone Mode Switcher */}
        <div className="quick-mode-switcher" role="tablist" aria-label="City preset categories">
          <button
            type="button"
            className={`quick-mode-btn ${activeCategory === 'global' ? 'active' : ''}`}
            onClick={() => setActiveCategory('global')}
            title={lang === 'id' ? 'Metropolis Utama Dunia' : 'Global Metropolises'}
          >
            <Globe2 size={13} />
            <span>{lang === 'id' ? 'Kota Dunia' : 'Global'}</span>
          </button>

          <button
            type="button"
            className={`quick-mode-btn ${activeCategory === 'regional' ? 'active' : ''}`}
            onClick={() => setActiveCategory('regional')}
            title={
              lang === 'id'
                ? `Kota di wilayah ${regionalData.regionName.id}`
                : `Cities in ${regionalData.regionName.en}`
            }
          >
            <Compass size={13} />
            <span>{regionalData.regionName[lang]}</span>
          </button>

          <button
            type="button"
            className={`quick-mode-btn ${activeCategory === 'climate' ? 'active' : ''}`}
            onClick={() => setActiveCategory('climate')}
            title={
              lang === 'id'
                ? 'Eksplorasi Zona Iklim & Cuaca Ekstrem Dunia'
                : 'Explore World Climate & Extreme Weather Zones'
            }
          >
            <Snowflake size={13} />
            <span>{lang === 'id' ? 'Zona Iklim' : 'Climate Zones'}</span>
          </button>
        </div>

        <span className="quick-divider-dot" aria-hidden="true" />

        {/* City Chips List */}
        <div className="chips-list">
          {displayedCities.map((item) => {
            const isActive = currentCity.toLowerCase() === item.city.toLowerCase();
            return (
              <button
                key={item.city}
                type="button"
                className={`chip ${isActive ? 'active' : ''}`}
                onClick={() => onSelectCity(item.city)}
              >
                <span className="chip-city-name">{item.city}</span>
                {item.tag ? (
                  <span className="chip-climate-tag">{item.tag[lang]}</span>
                ) : (
                  <span className="chip-country-code">{item.countryCode}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {favorites.length > 0 && (
        <div className="favorites-wrapper">
          <span className="quick-label">
            <Star size={14} color="#facc15" /> {t.savedFavorites}:
          </span>
          <div className="chips-list">
            {favorites.map((fav) => (
              <button
                key={fav.city}
                type="button"
                className={`chip ${currentCity.toLowerCase() === fav.city.toLowerCase() ? 'active' : ''}`}
                onClick={() => onSelectCity(fav.city)}
              >
                <span>{fav.city}</span>
                <span
                  className="chip-remove-btn"
                  title={lang === 'id' ? 'Hapus' : 'Remove'}
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveFavorite(fav.city);
                  }}
                >
                  <X size={12} />
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

'use client';

import React from 'react';
import { Flame, Star, X } from 'lucide-react';
import { FavoriteLocation } from '@/types/weather';
import { Language, getTranslation } from '@/utils/i18n';

interface QuickChipsProps {
  currentCity: string;
  onSelectCity: (city: string) => void;
  favorites: FavoriteLocation[];
  onRemoveFavorite: (city: string) => void;
  lang?: Language;
}

const POPULAR_CITIES = [
  'Jakarta',
  'Surabaya',
  'Bandung',
  'Bali',
  'Tokyo',
  'Singapore',
  'London',
  'New York',
];

export const QuickChips: React.FC<QuickChipsProps> = ({
  currentCity,
  onSelectCity,
  favorites,
  onRemoveFavorite,
  lang = 'id',
}) => {
  const t = getTranslation(lang);

  return (
    <div className="quick-bar">
      <div className="quick-chips-wrapper">
        <span className="quick-label">
          <Flame size={14} color="#f59e0b" /> {t.popularCities}:
        </span>
        <div className="chips-list">
          {POPULAR_CITIES.map((city) => (
            <button
              key={city}
              className={`chip ${currentCity.toLowerCase() === city.toLowerCase() ? 'active' : ''}`}
              onClick={() => onSelectCity(city)}
            >
              {city}
            </button>
          ))}
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
                className={`chip ${currentCity.toLowerCase() === fav.city.toLowerCase() ? 'active' : ''}`}
                onClick={() => onSelectCity(fav.city)}
              >
                <span>{fav.city}</span>
                <span
                  className="chip-remove-btn"
                  title="Hapus"
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

import type {
  AirPollutionResponse,
  CurrentWeatherResponse,
  ForecastResponse,
  UnitType,
  WeatherTheme,
} from '@/types/weather';

export interface WeatherAlertPreferences {
  thunderstorm: boolean;
  heavyRain: boolean;
  extremeHeat: boolean;
  highWind: boolean;
  poorAirQuality: boolean;
  lowVisibility: boolean;
  rainProbabilityThreshold: number;
  heatThresholdC: number;
  windThresholdKmh: number;
  airQualityThreshold: number;
  visibilityThresholdM: number;
}

export interface CachedWeatherSnapshot {
  current: CurrentWeatherResponse;
  forecast: ForecastResponse;
  pollution: AirPollutionResponse | null;
  theme: WeatherTheme;
  savedAt: number;
  requestedCity?: string;
}

export const DEFAULT_ALERT_PREFERENCES: WeatherAlertPreferences = {
  thunderstorm: true,
  heavyRain: true,
  extremeHeat: true,
  highWind: true,
  poorAirQuality: true,
  lowVisibility: true,
  rainProbabilityThreshold: 80,
  heatThresholdC: 34,
  windThresholdKmh: 35,
  airQualityThreshold: 4,
  visibilityThresholdM: 2000,
};

const PREFERENCE_BOUNDS: Record<
  keyof Pick<
    WeatherAlertPreferences,
    | 'rainProbabilityThreshold'
    | 'heatThresholdC'
    | 'windThresholdKmh'
    | 'airQualityThreshold'
    | 'visibilityThresholdM'
  >,
  [number, number]
> = {
  rainProbabilityThreshold: [1, 100],
  heatThresholdC: [25, 50],
  windThresholdKmh: [10, 150],
  airQualityThreshold: [1, 5],
  visibilityThresholdM: [100, 10000],
};

export function normalizeWindSpeedToKmh(speed: number, unit: UnitType): number {
  return speed * (unit === 'metric' ? 3.6 : 1.60934);
}

export function getMaxRainProbability(forecast: ForecastResponse | null): number {
  if (!forecast?.list.length) return 0;
  return Math.round(
    Math.max(...forecast.list.slice(0, 2).map((item) => item.pop ?? 0)) * 100
  );
}

export function shouldAlertForThunderstorm(
  weatherId: number,
  preferences: WeatherAlertPreferences
): boolean {
  return preferences.thunderstorm && weatherId >= 200 && weatherId < 300;
}

export function shouldAlertForHeavyRain(
  weatherId: number,
  rainProbability: number,
  preferences: WeatherAlertPreferences
): boolean {
  return (
    preferences.heavyRain &&
    ([502, 503, 504, 522].includes(weatherId) ||
      rainProbability >= preferences.rainProbabilityThreshold)
  );
}

export function shouldAlertForExtremeHeat(
  temperatureC: number,
  feelsLikeC: number,
  preferences: WeatherAlertPreferences
): boolean {
  return (
    preferences.extremeHeat &&
    (temperatureC >= preferences.heatThresholdC ||
      feelsLikeC >= preferences.heatThresholdC + 4)
  );
}

export function shouldAlertForHighWind(
  speedKmh: number,
  gustKmh: number,
  preferences: WeatherAlertPreferences
): boolean {
  return (
    preferences.highWind &&
    (speedKmh >= preferences.windThresholdKmh ||
      gustKmh >= preferences.windThresholdKmh * 1.3)
  );
}

export function shouldAlertForPoorAirQuality(
  aqi: number,
  preferences: WeatherAlertPreferences
): boolean {
  return preferences.poorAirQuality && aqi >= preferences.airQualityThreshold;
}

export function shouldAlertForLowVisibility(
  visibilityM: number,
  preferences: WeatherAlertPreferences
): boolean {
  return preferences.lowVisibility && visibilityM <= preferences.visibilityThresholdM;
}

export function parseAlertPreferences(value: unknown): WeatherAlertPreferences {
  if (!value || typeof value !== 'object') return DEFAULT_ALERT_PREFERENCES;
  const candidate = value as Partial<WeatherAlertPreferences>;
  const preferences = { ...DEFAULT_ALERT_PREFERENCES };

  for (const key of Object.keys(DEFAULT_ALERT_PREFERENCES) as Array<
    keyof WeatherAlertPreferences
  >) {
    if (key in PREFERENCE_BOUNDS) {
      const [min, max] = PREFERENCE_BOUNDS[
        key as keyof typeof PREFERENCE_BOUNDS
      ];
      const numberValue = candidate[key];
      if (typeof numberValue === 'number' && Number.isFinite(numberValue)) {
        preferences[key] = Math.min(max, Math.max(min, numberValue)) as never;
      }
    } else if (typeof candidate[key] === 'boolean') {
      preferences[key] = candidate[key] as never;
    }
  }

  return preferences;
}

export function matchesCachedWeather(
  snapshot: CachedWeatherSnapshot,
  target: { city?: string; lat?: number; lon?: number }
): boolean {
  if (target.city) {
    const city = target.city.trim().toLocaleLowerCase();
    return (
      city === snapshot.current.name.trim().toLocaleLowerCase() ||
      city === snapshot.requestedCity?.trim().toLocaleLowerCase()
    );
  }

  if (target.lat !== undefined && target.lon !== undefined) {
    return (
      Math.abs(snapshot.current.coord.lat - target.lat) <= 0.02 &&
      Math.abs(snapshot.current.coord.lon - target.lon) <= 0.02
    );
  }

  return false;
}

export function isCachedWeatherSnapshot(value: unknown): value is CachedWeatherSnapshot {
  if (!value || typeof value !== 'object') return false;
  const snapshot = value as Partial<CachedWeatherSnapshot>;
  return (
    typeof snapshot.savedAt === 'number' &&
    Number.isFinite(snapshot.savedAt) &&
    !!snapshot.current &&
    typeof snapshot.current.name === 'string' &&
    typeof snapshot.current.coord?.lat === 'number' &&
    typeof snapshot.current.coord?.lon === 'number' &&
    !!snapshot.forecast &&
    Array.isArray(snapshot.forecast.list) &&
    (snapshot.pollution === null || !!snapshot.pollution)
  );
}

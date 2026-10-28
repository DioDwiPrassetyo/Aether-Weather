import { describe, expect, it } from 'vitest';
import type { CachedWeatherSnapshot } from './weatherRules';
import {
  DEFAULT_ALERT_PREFERENCES,
  getMaxRainProbability,
  isCachedWeatherSnapshot,
  matchesCachedWeather,
  normalizeWindSpeedToKmh,
  parseAlertPreferences,
  shouldAlertForExtremeHeat,
  shouldAlertForHeavyRain,
  shouldAlertForHighWind,
} from './weatherRules';

const snapshot = {
  savedAt: 1_798_000_000_000,
  requestedCity: 'Jakarta',
  current: {
    name: 'Jakarta',
    coord: { lat: -6.2, lon: 106.8 },
  },
  forecast: { list: [{ pop: 0.35 }, { pop: 0.8 }, { pop: 1 }] },
  pollution: null,
} as unknown as CachedWeatherSnapshot;

describe('weather rules', () => {
  it('converts metric and imperial wind speeds to km/h', () => {
    expect(normalizeWindSpeedToKmh(10, 'metric')).toBe(36);
    expect(normalizeWindSpeedToKmh(10, 'imperial')).toBeCloseTo(16.0934);
  });

  it('uses the highest near-term rain probability', () => {
    expect(getMaxRainProbability(snapshot.forecast)).toBe(80);
    expect(getMaxRainProbability(null)).toBe(0);
  });

  it('only uses cached weather for the requested city or nearby coordinates', () => {
    expect(matchesCachedWeather(snapshot, { city: 'jakarta' })).toBe(true);
    expect(matchesCachedWeather(snapshot, { city: 'Bandung' })).toBe(false);
    expect(matchesCachedWeather(snapshot, { lat: -6.2, lon: 106.8 })).toBe(true);
    expect(matchesCachedWeather(snapshot, { lat: -6.9, lon: 107.6 })).toBe(false);
  });

  it('rejects malformed snapshots', () => {
    expect(isCachedWeatherSnapshot(snapshot)).toBe(true);
    expect(isCachedWeatherSnapshot({ current: { name: 'Jakarta' } })).toBe(false);
  });

  it('clamps saved alert preferences and fills missing values with defaults', () => {
    expect(
      parseAlertPreferences({
        ...DEFAULT_ALERT_PREFERENCES,
        rainProbabilityThreshold: 150,
        highWind: false,
      })
    ).toMatchObject({
      rainProbabilityThreshold: 100,
      highWind: false,
      heatThresholdC: DEFAULT_ALERT_PREFERENCES.heatThresholdC,
    });
  });

  it('uses configurable inclusive thresholds for heat, rain, and wind indications', () => {
    expect(shouldAlertForExtremeHeat(34, 20, DEFAULT_ALERT_PREFERENCES)).toBe(true);
    expect(shouldAlertForExtremeHeat(33.9, 37.9, DEFAULT_ALERT_PREFERENCES)).toBe(false);
    expect(shouldAlertForHeavyRain(800, 80, DEFAULT_ALERT_PREFERENCES)).toBe(true);
    expect(shouldAlertForHeavyRain(800, 79, DEFAULT_ALERT_PREFERENCES)).toBe(false);
    expect(shouldAlertForHeavyRain(502, 0, DEFAULT_ALERT_PREFERENCES)).toBe(true);
    expect(shouldAlertForHighWind(35, 0, DEFAULT_ALERT_PREFERENCES)).toBe(true);
    expect(shouldAlertForHighWind(34, 45.49, DEFAULT_ALERT_PREFERENCES)).toBe(false);
  });
});

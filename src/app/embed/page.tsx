'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { fetchCurrentWeather, I18N, wmoCodeToCondition } from '@/utils/weatherUtils';
import { UnitType } from '@/types/weather';

interface WidgetWeatherState {
  city: string;
  country: string;
  temp: number;
  condition: string;
  humidity: number;
  windKmh: number;
  pressure: number;
}

function EmbedWidgetContent() {
  const searchParams = useSearchParams();
  const cityParam = (searchParams.get('city') || 'Jakarta').trim();
  const themeParam = (searchParams.get('theme') || 'dark') as 'dark' | 'gold' | 'light';
  const sizeParam = (searchParams.get('size') || 'card') as 'pill' | 'card' | 'banner';
  const unitParam: UnitType = searchParams.get('unit') === 'imperial' ? 'imperial' : 'metric';
  const langParam = searchParams.get('lang') === 'en' ? 'en' : 'id';

  const [data, setData] = useState<WidgetWeatherState | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetchCurrentWeather({ city: cityParam }, unitParam);
        if (cancelled) return;
        setData({
          city: res.name,
          country: res.sys.country,
          temp: Math.round(res.main.temp),
          condition:
            langParam === 'id'
              ? I18N.translate(res.weather[0]?.description || 'clear sky')
              : res.weather[0]?.description || 'Clear sky',
          humidity: res.main.humidity,
          windKmh: Math.round(
            unitParam === 'metric' ? res.wind.speed * 3.6 : res.wind.speed * 1.609
          ),
          pressure: res.main.pressure,
        });
      } catch {
        // Fallback to Open-Meteo geocoding + forecast so widget works even without OWM key limits
        try {
          const gRes = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityParam)}&count=1&format=json`
          );
          const gJson = await gRes.json();
          const hit = gJson?.results?.[0] || {
            name: cityParam,
            country_code: 'ID',
            latitude: -6.2088,
            longitude: 106.8456,
          };
          const tUnit = unitParam === 'imperial' ? 'fahrenheit' : 'celsius';
          const wRes = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${hit.latitude}&longitude=${hit.longitude}&current=temperature_2m,relative_humidity_2m,surface_pressure,wind_speed_10m,weather_code&temperature_unit=${tUnit}&wind_speed_unit=kmh`
          );
          const wJson = await wRes.json();
          if (cancelled) return;
          const code = Number(wJson?.current?.weather_code ?? 0);
          const condObj = wmoCodeToCondition(code, false);
          setData({
            city: hit.name || cityParam,
            country: hit.country_code || '',
            temp: Math.round(Number(wJson?.current?.temperature_2m ?? 28)),
            condition:
              langParam === 'id'
                ? I18N.translate(condObj.description)
                : condObj.description,
            humidity: Math.round(Number(wJson?.current?.relative_humidity_2m ?? 70)),
            windKmh: Math.round(Number(wJson?.current?.wind_speed_10m ?? 12)),
            pressure: Math.round(Number(wJson?.current?.surface_pressure ?? 1013)),
          });
        } catch {
          if (cancelled) return;
          setData({
            city: cityParam,
            country: '',
            temp: 28,
            condition: langParam === 'id' ? 'Cerah Berawan' : 'Partly Cloudy',
            humidity: 70,
            windKmh: 12,
            pressure: 1012,
          });
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [cityParam, unitParam, langParam]);

  const bgStyle =
    themeParam === 'gold'
      ? 'linear-gradient(135deg, #161208 0%, #29200b 100%)'
      : themeParam === 'light'
        ? 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)'
        : 'linear-gradient(135deg, #090f1d 0%, #0f172a 100%)';

  const textColor = themeParam === 'light' ? '#0f172a' : '#f8fafc';
  const subColor = themeParam === 'light' ? '#475569' : '#94a3b8';
  const accentColor =
    themeParam === 'gold' ? '#facc15' : themeParam === 'light' ? '#0284c7' : '#38bdf8';

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        boxSizing: 'border-box',
        padding: sizeParam === 'pill' ? '12px 18px' : '18px 22px',
        background: bgStyle,
        color: textColor,
        fontFamily: 'var(--font-body), sans-serif',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        borderRadius: '18px',
        border:
          themeParam === 'light'
            ? '1px solid rgba(2, 132, 199, 0.25)'
            : '1px solid rgba(148, 163, 184, 0.22)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
        }}
      >
        <div>
          <div style={{ fontSize: sizeParam === 'pill' ? 16 : 20, fontWeight: 800 }}>
            {data ? `${data.city}${data.country ? `, ${data.country}` : ''}` : cityParam}
          </div>
          <div style={{ fontSize: 12, color: accentColor, fontWeight: 600 }}>
            {data ? data.condition : '...'}
          </div>
        </div>

        <div
          style={{
            fontSize: sizeParam === 'pill' ? 28 : 38,
            fontWeight: 900,
            lineHeight: 1,
          }}
        >
          {data ? `${data.temp}°${unitParam === 'metric' ? 'C' : 'F'}` : '--°'}
        </div>
      </div>

      {sizeParam !== 'pill' && data && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            fontSize: 12,
            color: subColor,
            padding: '8px 12px',
            borderRadius: '10px',
            background:
              themeParam === 'light'
                ? 'rgba(255, 255, 255, 0.7)'
                : 'rgba(255, 255, 255, 0.05)',
          }}
        >
          <span>💧 {data.humidity}%</span>
          <span>💨 {data.windKmh} km/h</span>
          <span>🧭 {data.pressure} hPa</span>
        </div>
      )}

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: 11,
          color: subColor,
        }}
      >
        <a
          href={`/?city=${encodeURIComponent(data?.city || cityParam)}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: accentColor,
            textDecoration: 'none',
            fontWeight: 700,
          }}
        >
          ✦ WeatherAether Live
        </a>
        <span>Real-Time Telemetry</span>
      </div>
    </div>
  );
}

export default function EmbedWidgetPage() {
  return (
    <Suspense fallback={<div style={{ padding: 16, color: '#94a3b8' }}>Loading widget...</div>}>
      <EmbedWidgetContent />
    </Suspense>
  );
}


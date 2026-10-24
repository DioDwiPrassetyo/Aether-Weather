'use client';

import React from 'react';
import {
  Car,
  Footprints,
  ThermometerSnowflake,
  Bug,
  ShieldCheck,
  AlertTriangle,
  Info,
} from 'lucide-react';
import {
  CurrentWeatherResponse,
  AirPollutionResponse,
  ForecastResponse,
  UnitType,
} from '@/types/weather';
import { Language, getTranslation } from '@/utils/i18n';

interface LifestyleIndexesProps {
  current: CurrentWeatherResponse;
  pollution: AirPollutionResponse | null;
  forecast: ForecastResponse | null;
  unit: UnitType;
  lang?: Language;
}

export const LifestyleIndexes: React.FC<LifestyleIndexesProps> = ({
  current,
  pollution,
  forecast,
  unit,
  lang = 'id',
}) => {
  const t = getTranslation(lang);

  const tempC =
    unit === 'metric' ? current.main.temp : ((current.main.temp - 32) * 5) / 9;
  const weatherId = current.weather[0]?.id || 800;
  const nextPoP = forecast?.list?.[0]?.pop ? Math.round(forecast.list[0].pop * 100) : 0;
  const aqiScore = pollution?.list?.[0]?.main?.aqi ?? 2;
  const windKmh = current.wind.speed * (unit === 'metric' ? 3.6 : 1.60934);

  // 1. Driving Safety
  let drivingStatus: 'optimal' | 'caution' | 'hazard' = 'optimal';
  let drivingLabel = t.drivingOptimal;
  let drivingNote =
    lang === 'id'
      ? 'Kondisi aspal kering, jarak pandang jernih, dan angin tenang.'
      : 'Dry pavement, clear visibility, and calm atmospheric winds.';

  if (current.visibility <= 2500) {
    drivingStatus = 'hazard';
    drivingLabel = t.drivingHazard;
    drivingNote =
      lang === 'id'
        ? `Jarak pandang hanya ${(current.visibility / 1000).toFixed(1)} km. Nyalakan lampu kabut.`
        : `Visibility reduced to ${(current.visibility / 1000).toFixed(1)} km. Low beams advised.`;
  } else if (weatherId >= 200 && weatherId < 600) {
    drivingStatus = 'caution';
    drivingLabel = t.drivingCaution;
    drivingNote =
      lang === 'id'
        ? 'Permukaan jalanan basah tergenang air hujan. Kurangi kecepatan.'
        : 'Wet road surfaces. Reduce speed and maintain greater braking distance.';
  } else if (windKmh >= 35) {
    drivingStatus = 'caution';
    drivingLabel = lang === 'id' ? 'Angin Samping Kencang' : 'Strong Crosswinds';
    drivingNote =
      lang === 'id'
        ? 'Waspadai hembusan angin samping pada jembatan dan jalan layang.'
        : 'Be mindful of lateral wind gusts on elevated highways and bridges.';
  }

  // 2. Running & Cardio Comfort Score (0 to 100)
  let runScore = 100;
  // Penalty for temp outside 15-23°C
  if (tempC > 24) runScore -= Math.min(45, (tempC - 24) * 4.5);
  else if (tempC < 14) runScore -= Math.min(35, (14 - tempC) * 3);

  // Penalty for humidity
  if (current.main.humidity > 75) runScore -= 15;
  // Penalty for AQI
  if (aqiScore >= 4) runScore -= 30;
  else if (aqiScore === 3) runScore -= 12;
  // Penalty for rain
  if (weatherId >= 200 && weatherId < 600) runScore -= 35;
  else if (nextPoP >= 60) runScore -= 15;

  runScore = Math.max(10, Math.min(100, Math.round(runScore)));

  let runLabel = t.runningOptimal;
  if (runScore >= 80) runLabel = t.runningOptimal;
  else if (runScore >= 60) runLabel = t.runningGood;
  else if (runScore >= 40) runLabel = t.runningFair;
  else runLabel = t.runningAvoid;

  // 3. Flu & Barometric Sensitivity
  const pressure = current.main.pressure;
  const isFluHigh = pressure < 1005 || tempC < 16;
  const fluLabel = isFluHigh ? t.fluHigh : t.fluLow;

  // 4. Mosquito Activity
  const isMosquitoHigh = tempC >= 23 && tempC <= 33 && current.main.humidity >= 68;
  const mosquitoLabel = isMosquitoHigh ? t.mosquitoHigh : t.mosquitoLow;

  return (
    <div className="glass-card lifestyle-hub-card">
      <div className="card-header">
        <div className="card-title">
          <Footprints size={20} color="#38bdf8" />
          <div>
            <h3>{t.lifestyleTitle}</h3>
            <span className="badge-sub">{t.lifestyleSubtitle}</span>
          </div>
        </div>
      </div>

      <div className="lifestyle-grid">
        {/* Item 1: Driving Safety */}
        <div className={`lifestyle-item status-${drivingStatus}`}>
          <div className="lifestyle-item-header">
            <span className="lifestyle-cat">
              <Car size={16} color="#38bdf8" /> {t.drivingSafety}
            </span>
            <span className={`lifestyle-pill-status pill-${drivingStatus}`}>
              {drivingStatus === 'hazard' ? (
                <AlertTriangle size={12} />
              ) : (
                <ShieldCheck size={12} />
              )}
              {drivingStatus === 'optimal'
                ? (lang === 'id' ? 'OPTIMAL' : 'OPTIMAL')
                : drivingStatus === 'caution'
                ? (lang === 'id' ? 'WASPADA' : 'CAUTION')
                : (lang === 'id' ? 'BAHAYA' : 'HAZARD')}
            </span>
          </div>
          <h4 className="lifestyle-heading">{drivingLabel}</h4>
          <p className="lifestyle-desc">{drivingNote}</p>
        </div>

        {/* Item 2: Running Comfort Score */}
        <div className={`lifestyle-item ${runScore >= 75 ? 'status-optimal' : runScore >= 50 ? 'status-caution' : 'status-hazard'}`}>
          <div className="lifestyle-item-header">
            <span className="lifestyle-cat">
              <Footprints size={16} color="#f59e0b" /> {t.runningScore}
            </span>
            <span className="running-score-badge">
              <strong>{runScore}</strong> / 100
            </span>
          </div>
          <div className="running-score-track">
            <div
              className="running-score-fill"
              style={{
                width: `${runScore}%`,
                background:
                  runScore >= 75
                    ? '#4ade80'
                    : runScore >= 50
                    ? '#facc15'
                    : '#f87171',
              }}
            ></div>
          </div>
          <h4 className="lifestyle-heading">{runLabel}</h4>
          <p className="lifestyle-desc">
            {lang === 'id'
              ? `Kombinasi suhu ${Math.round(current.main.temp)}°, kelembapan ${current.main.humidity}%, dan indeks AQI.`
              : `Based on current temp ${Math.round(current.main.temp)}°, humidity ${current.main.humidity}%, and air quality.`}
          </p>
        </div>

        {/* Item 3: Flu Sensitivity */}
        <div className={`lifestyle-item ${isFluHigh ? 'status-caution' : 'status-optimal'}`}>
          <div className="lifestyle-item-header">
            <span className="lifestyle-cat">
              <ThermometerSnowflake size={16} color="#c084fc" /> {t.fluRisk}
            </span>
            <span className={`lifestyle-pill-status ${isFluHigh ? 'pill-caution' : 'pill-optimal'}`}>
              {pressure}&nbsp;hPa
            </span>
          </div>
          <h4 className="lifestyle-heading">{fluLabel}</h4>
          <p className="lifestyle-desc">
            {isFluHigh
              ? lang === 'id'
                ? 'Penurunan tekanan udara & suhu dingin memicu sensitivitas sinus.'
                : 'Barometric fluctuations & cooler air may trigger nasal congestion.'
              : lang === 'id'
                ? 'Tekanan barometrik stabil, relatif aman dari migrain/nyeri sendi.'
                : 'Stable barometric conditions, minimal weather-induced aches.'}
          </p>
        </div>

        {/* Item 4: Mosquito Activity */}
        <div className={`lifestyle-item ${isMosquitoHigh ? 'status-caution' : 'status-optimal'}`}>
          <div className="lifestyle-item-header">
            <span className="lifestyle-cat">
              <Bug size={16} color="#fb923c" /> {t.mosquitoActivity}
            </span>
            <span className={`lifestyle-pill-status ${isMosquitoHigh ? 'pill-caution' : 'pill-optimal'}`}>
              {isMosquitoHigh
                ? (lang === 'id' ? 'WASPADAI' : 'ELEVATED')
                : (lang === 'id' ? 'RENDAH' : 'LOW')}
            </span>
          </div>
          <h4 className="lifestyle-heading">{mosquitoLabel}</h4>
          <p className="lifestyle-desc">
            {isMosquitoHigh
              ? lang === 'id'
                ? 'Kelembapan tinggi & suhu hangat mendukung perkembangbiakan nyamuk.'
                : 'High humidity & tropical temperatures increase insect presence.'
              : lang === 'id'
                ? 'Kondisi atmosfer tidak mendukung aktivitas nyamuk berlebih.'
                : 'Atmospheric conditions suppress mosquito swarming.'}
          </p>
        </div>
      </div>
    </div>
  );
};

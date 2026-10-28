'use client';

import React from 'react';
import {
  Car,
  Footprints,
  ThermometerSnowflake,
  Bug,
  ShieldCheck,
  AlertTriangle,
  Shirt,
  Flame,
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
  const feelsLikeC =
    unit === 'metric' ? current.main.feels_like : ((current.main.feels_like - 32) * 5) / 9;
  const weatherId = current.weather[0]?.id || 800;
  const nextPoP = forecast?.list?.[0]?.pop ? Math.round(forecast.list[0].pop * 100) : 0;
  const max12hPoP = Math.round(
    Math.max(
      nextPoP / 100,
      ...(forecast?.list?.slice(0, 4).map((it) => it.pop || 0) || [0])
    ) * 100
  );
  const aqiScore = pollution?.list?.[0]?.main?.aqi ?? 2;
  const windKmh = current.wind.speed * (unit === 'metric' ? 3.6 : 1.60934);

  // 1. Driving Safety
  let drivingStatus: 'optimal' | 'caution' | 'hazard' = 'optimal';
  let drivingLabel = t.drivingOptimal;
  let drivingNote =
    lang === 'id'
      ? 'Kondisi aspal kering, jarak pandang jernih, dan angin tenang.'
      : 'Dry pavement, clear visibility, and calm atmospheric winds.';

  if (current.visibility <= 2500 || (weatherId >= 200 && weatherId < 300)) {
    drivingStatus = 'hazard';
    drivingLabel = t.drivingHazard;
    drivingNote =
      lang === 'id'
        ? `Waspada genangan & jarak pandang ${(current.visibility / 1000).toFixed(1)} km. Jaga jarak pengereman 2× lipat.`
        : `Visibility ${(current.visibility / 1000).toFixed(1)} km or storm activity. Double braking distance.`;
  } else if (weatherId >= 300 && weatherId < 600) {
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

  // 2. Running & Cardio Comfort Score (0 to 100) + Best Slot Finder
  let runScore = 100;
  if (tempC > 24) runScore -= Math.min(45, (tempC - 24) * 4.5);
  else if (tempC < 14) runScore -= Math.min(35, (14 - tempC) * 3);
  if (current.main.humidity > 75) runScore -= 15;
  if (aqiScore >= 4) runScore -= 30;
  else if (aqiScore === 3) runScore -= 12;
  if (weatherId >= 200 && weatherId < 600) runScore -= 35;
  else if (nextPoP >= 60) runScore -= 15;
  runScore = Math.max(10, Math.min(100, Math.round(runScore)));

  let runLabel = t.runningOptimal;
  if (runScore >= 80) runLabel = t.runningOptimal;
  else if (runScore >= 60) runLabel = t.runningGood;
  else if (runScore >= 40) runLabel = t.runningFair;
  else runLabel = t.runningAvoid;

  // Find best upcoming outdoor hour from forecast
  let bestOutdoorTimeStr = '';
  if (forecast?.list && forecast.list.length > 0) {
    let bestSlot = forecast.list[0];
    let bestSlotScore = -Infinity;
    for (const slot of forecast.list.slice(0, 8)) {
      const d = new Date((slot.dt + current.timezone) * 1000);
      const hr = d.getUTCHours();
      if (hr < 5 || hr > 20) continue; // daytime/evening hours
      const slotTempC = unit === 'metric' ? slot.main.temp : ((slot.main.temp - 32) * 5) / 9;
      const sScore =
        100 -
        Math.abs(slotTempC - 22) * 4 -
        (slot.pop || 0) * 65 -
        Math.max(0, slot.main.humidity - 70) * 0.5;
      if (sScore > bestSlotScore) {
        bestSlotScore = sScore;
        bestSlot = slot;
      }
    }
    const bd = new Date((bestSlot.dt + current.timezone) * 1000);
    bestOutdoorTimeStr = `${String(bd.getUTCHours()).padStart(2, '0')}:00`;
  }

  // 3. Laundry & Car Wash Drying Index (0 to 100)
  let dryingScore = 100;
  if (weatherId >= 200 && weatherId < 600) dryingScore -= 70;
  dryingScore -= max12hPoP * 0.55;
  if (current.main.humidity > 65) dryingScore -= (current.main.humidity - 65) * 1.1;
  if (current.clouds.all > 70) dryingScore -= 12;
  if (tempC >= 27 && windKmh >= 10 && weatherId >= 800) dryingScore += 12;
  dryingScore = Math.max(5, Math.min(100, Math.round(dryingScore)));

  const dryingStatus: 'optimal' | 'caution' | 'hazard' =
    dryingScore >= 70 ? 'optimal' : dryingScore >= 42 ? 'caution' : 'hazard';
  const dryingHeading =
    dryingScore >= 70
      ? lang === 'id'
        ? 'Cepat Kering & Aman'
        : 'Fast Drying & Clear'
      : dryingScore >= 42
        ? lang === 'id'
          ? 'Pengeringan Lambat / Teduh'
          : 'Slow Drying / Overcast'
        : lang === 'id'
          ? 'Hindari Jemur Luar Ruang'
          : 'Avoid Outdoor Drying';

  // 4. Thermal Stress & Heat Index
  const thermalStatus: 'optimal' | 'caution' | 'hazard' =
    feelsLikeC >= 36 ? 'hazard' : feelsLikeC >= 31 || feelsLikeC <= 12 ? 'caution' : 'optimal';
  const thermalHeading =
    feelsLikeC >= 36
      ? lang === 'id'
        ? 'Stres Panas Tinggi (Waspada)'
        : 'High Heat Stress'
      : feelsLikeC >= 31
        ? lang === 'id'
          ? 'Hangat & Lembap Tropis'
          : 'Warm Tropical Muggy'
        : feelsLikeC <= 14
          ? lang === 'id'
            ? 'Sejuk Dingin Berangin'
            : 'Chilly & Brisk'
          : lang === 'id'
            ? 'Zona Nyaman Termal'
            : 'Optimal Thermal Zone';

  // 5. Flu & Barometric Sensitivity
  const pressure = current.main.pressure;
  const isFluHigh = pressure < 1005 || tempC < 16;
  const fluLabel = isFluHigh ? t.fluHigh : t.fluLow;

  // 6. Mosquito Activity
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
                ? 'OPTIMAL'
                : drivingStatus === 'caution'
                  ? lang === 'id'
                    ? 'WASPADA'
                    : 'CAUTION'
                  : lang === 'id'
                    ? 'BAHAYA'
                    : 'HAZARD'}
            </span>
          </div>
          <h4 className="lifestyle-heading">{drivingLabel}</h4>
          <p className="lifestyle-desc">{drivingNote}</p>
        </div>

        {/* Item 2: Running Comfort Score */}
        <div
          className={`lifestyle-item ${runScore >= 75 ? 'status-optimal' : runScore >= 50 ? 'status-caution' : 'status-hazard'}`}
        >
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
                  runScore >= 75 ? '#4ade80' : runScore >= 50 ? '#facc15' : '#f87171',
              }}
            ></div>
          </div>
          <h4 className="lifestyle-heading">{runLabel}</h4>
          <p className="lifestyle-desc">
            {bestOutdoorTimeStr
              ? lang === 'id'
                ? `Jendela olahraga terbaik sekitar pukul ${bestOutdoorTimeStr} (AQI ${aqiScore}/5).`
                : `Optimal outdoor window around ${bestOutdoorTimeStr} (AQI ${aqiScore}/5).`
              : lang === 'id'
                ? `Kombinasi suhu ${Math.round(current.main.temp)}°, kelembapan ${current.main.humidity}%, dan AQI.`
                : `Based on temp ${Math.round(current.main.temp)}°, humidity ${current.main.humidity}%, and AQI.`}
          </p>
        </div>

        {/* Item 3: Laundry & Car Wash Index */}
        <div className={`lifestyle-item status-${dryingStatus}`}>
          <div className="lifestyle-item-header">
            <span className="lifestyle-cat">
              <Shirt size={16} color="#34d399" />{' '}
              {lang === 'id' ? 'Jemuran & Cuci Mobil' : 'Laundry & Car Wash'}
            </span>
            <span className="running-score-badge">
              <strong>{dryingScore}</strong> / 100
            </span>
          </div>
          <div className="running-score-track">
            <div
              className="running-score-fill"
              style={{
                width: `${dryingScore}%`,
                background:
                  dryingScore >= 70
                    ? '#4ade80'
                    : dryingScore >= 42
                      ? '#facc15'
                      : '#f87171',
              }}
            ></div>
          </div>
          <h4 className="lifestyle-heading">{dryingHeading}</h4>
          <p className="lifestyle-desc">
            {lang === 'id'
              ? `Peluang hujan 12j maks ${max12hPoP}% dengan kecepatan angin pengering ${Math.round(windKmh)} km/j.`
              : `12h max rain risk ${max12hPoP}% with ${Math.round(windKmh)} km/h drying breeze.`}
          </p>
        </div>

        {/* Item 4: Thermal Comfort & Heat Stress */}
        <div className={`lifestyle-item status-${thermalStatus}`}>
          <div className="lifestyle-item-header">
            <span className="lifestyle-cat">
              <Flame size={16} color="#f87171" />{' '}
              {lang === 'id' ? 'Indeks Termal & Hidrasi' : 'Thermal & Hydration'}
            </span>
            <span className={`lifestyle-pill-status pill-${thermalStatus}`}>
              {lang === 'id' ? 'Terasa' : 'Feels'} {Math.round(current.main.feels_like)}°
            </span>
          </div>
          <h4 className="lifestyle-heading">{thermalHeading}</h4>
          <p className="lifestyle-desc">
            {feelsLikeC >= 32
              ? lang === 'id'
                ? 'Penguapan keringat melambat akibat kelembapan. Tingkatkan asupan air +350 ml/jam.'
                : 'High humidity slows sweat evaporation. Increase water intake by +350 ml/hr.'
              : lang === 'id'
                ? 'Keseimbangan pelepasan panas tubuh stabil untuk aktivitas luar ruang.'
                : 'Balanced body heat dissipation for normal outdoor activity.'}
          </p>
        </div>

        {/* Item 5: Flu Sensitivity */}
        <div className={`lifestyle-item ${isFluHigh ? 'status-caution' : 'status-optimal'}`}>
          <div className="lifestyle-item-header">
            <span className="lifestyle-cat">
              <ThermometerSnowflake size={16} color="#c084fc" /> {t.fluRisk}
            </span>
            <span
              className={`lifestyle-pill-status ${isFluHigh ? 'pill-caution' : 'pill-optimal'}`}
            >
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

        {/* Item 6: Mosquito Activity */}
        <div
          className={`lifestyle-item ${isMosquitoHigh ? 'status-caution' : 'status-optimal'}`}
        >
          <div className="lifestyle-item-header">
            <span className="lifestyle-cat">
              <Bug size={16} color="#fb923c" /> {t.mosquitoActivity}
            </span>
            <span
              className={`lifestyle-pill-status ${isMosquitoHigh ? 'pill-caution' : 'pill-optimal'}`}
            >
              {isMosquitoHigh
                ? lang === 'id'
                  ? 'WASPADAI'
                  : 'ELEVATED'
                : lang === 'id'
                  ? 'RENDAH'
                  : 'LOW'}
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

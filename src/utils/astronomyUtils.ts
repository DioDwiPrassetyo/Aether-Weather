export type MoonPhaseKey =
  | 'new_moon'
  | 'waxing_crescent'
  | 'first_quarter'
  | 'waxing_gibbous'
  | 'full_moon'
  | 'waning_gibbous'
  | 'last_quarter'
  | 'waning_crescent';

export interface MoonPhaseInfo {
  key: MoonPhaseKey;
  phaseNormalized: number; // 0 to 1
  ageDays: number; // 0 to 29.53
  illuminationPct: number; // 0 to 100
  emoji: string;
  isWaxing: boolean;
  elongationDeg: number; // 0 to 180
  phaseAngleDeg: number; // 0 to 360
  nextFullMoonDays: number;
  nextNewMoonDays: number;
  lunarDistanceKm: number;
  distanceStatus: 'perigee' | 'normal' | 'apogee';
  tidalState: 'spring' | 'moderate' | 'neap';
  tidalStrengthPct: number;
  stargazingQuality: 'excellent' | 'good' | 'bright';
}

export interface GoldenHourInfo {
  isGoldenHourNow: boolean;
  isBlueHourNow: boolean;
  activePeriodName?: string;
  morningGoldenStart: string;
  morningGoldenEnd: string;
  eveningGoldenStart: string;
  eveningGoldenEnd: string;
  morningBlueStart: string;
  morningBlueEnd: string;
  eveningBlueStart: string;
  eveningBlueEnd: string;
  moonriseTime: string;
  moonsetTime: string;
  solarDayProgressPct: number;
}

// Synodic lunar month in seconds
const SYNODIC_MONTH_SEC = 29.53058867 * 86400;
// Reference new moon: Jan 6, 2000 at 18:14 UTC
const KNOWN_NEW_MOON_UTC = 947182440;

/**
 * Calculates current lunar phase and illumination percentage from UTC timestamp
 */
export function getMoonPhase(timestampSec = Math.floor(Date.now() / 1000)): MoonPhaseInfo {
  const diff = timestampSec - KNOWN_NEW_MOON_UTC;
  let phaseNormalized = (diff / SYNODIC_MONTH_SEC) % 1;
  if (phaseNormalized < 0) phaseNormalized += 1;

  const ageDays = phaseNormalized * 29.53058867;
  // Illumination calculation based on phase angle
  const illuminationPct = Math.round(
    ((1 - Math.cos(phaseNormalized * 2 * Math.PI)) / 2) * 100
  );

  let key: MoonPhaseKey = 'new_moon';
  let emoji = '🌑';

  if (phaseNormalized < 0.03 || phaseNormalized >= 0.97) {
    key = 'new_moon';
    emoji = '🌑';
  } else if (phaseNormalized < 0.22) {
    key = 'waxing_crescent';
    emoji = '🌒';
  } else if (phaseNormalized < 0.28) {
    key = 'first_quarter';
    emoji = '🌓';
  } else if (phaseNormalized < 0.47) {
    key = 'waxing_gibbous';
    emoji = '🌔';
  } else if (phaseNormalized < 0.53) {
    key = 'full_moon';
    emoji = '🌕';
  } else if (phaseNormalized < 0.72) {
    key = 'waning_gibbous';
    emoji = '🌖';
  } else if (phaseNormalized < 0.78) {
    key = 'last_quarter';
    emoji = '🌗';
  } else {
    key = 'waning_crescent';
    emoji = '🌘';
  }

  // Next full moon (phase = 0.5)
  const daysToFull =
    phaseNormalized <= 0.5
      ? (0.5 - phaseNormalized) * 29.53058867
      : (1.5 - phaseNormalized) * 29.53058867;
  const nextFullMoonDays = Math.max(1, Math.round(daysToFull));

  // Next new moon (phase = 1.0)
  const daysToNew = (1 - phaseNormalized) * 29.53058867;
  const nextNewMoonDays = Math.max(1, Math.round(daysToNew));

  // Lunar distance approximation based on anomalistic month (27.55455 days)
  const ANOMALISTIC_MONTH_SEC = 27.55454988 * 86400;
  const anomPhase = ((timestampSec - KNOWN_NEW_MOON_UTC) / ANOMALISTIC_MONTH_SEC) % 1;
  const lunarDistanceKm = Math.round(384400 - 21000 * Math.cos(anomPhase * 2 * Math.PI));

  let distanceStatus: 'perigee' | 'normal' | 'apogee' = 'normal';
  if (lunarDistanceKm <= 368500) distanceStatus = 'perigee';
  else if (lunarDistanceKm >= 400000) distanceStatus = 'apogee';

  const isWaxing = phaseNormalized <= 0.5;
  const phaseAngleDeg = Math.round(phaseNormalized * 360);
  const elongationDeg = Math.round(
    (phaseNormalized <= 0.5 ? phaseNormalized * 2 : (1 - phaseNormalized) * 2) * 180
  );

  // Gravitational Tidal Strength (peaks at New Moon 0.0 and Full Moon 0.5 => Spring Tide / Pasang Purnama)
  const syzygyAlignment = Math.abs(Math.cos(phaseNormalized * 2 * Math.PI)); // 1 at new/full, 0 at quarters
  const tidalStrengthPct = Math.round(52 + syzygyAlignment * 48);
  let tidalState: 'spring' | 'moderate' | 'neap' = 'moderate';
  if (syzygyAlignment >= 0.78) tidalState = 'spring';
  else if (syzygyAlignment <= 0.32) tidalState = 'neap';

  // Stargazing condition based on lunar wash
  let stargazingQuality: 'excellent' | 'good' | 'bright' = 'good';
  if (illuminationPct < 30) stargazingQuality = 'excellent';
  else if (illuminationPct >= 65) stargazingQuality = 'bright';

  return {
    key,
    phaseNormalized,
    ageDays: Math.round(ageDays * 10) / 10,
    illuminationPct,
    emoji,
    isWaxing,
    elongationDeg,
    phaseAngleDeg,
    nextFullMoonDays,
    nextNewMoonDays,
    lunarDistanceKm,
    distanceStatus,
    tidalState,
    tidalStrengthPct,
    stargazingQuality,
  };
}

/**
 * Formats seconds timestamp to HH:mm in city's local timezone
 */
function formatLocalTime(ts: number, timezoneOffsetSec: number): string {
  const d = new Date((ts + timezoneOffsetSec) * 1000);
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
}

/**
 * Calculates Golden Hour and Blue Hour windows from sunrise and sunset
 */
export function getGoldenHourInfo(
  sunriseSec: number,
  sunsetSec: number,
  timezoneOffsetSec: number,
  currentSec = Math.floor(Date.now() / 1000)
): GoldenHourInfo {
  // Morning Blue Hour: sunrise - 30m to sunrise
  const mBlueStart = sunriseSec - 1800;
  const mBlueEnd = sunriseSec;

  // Morning Golden Hour: sunrise to sunrise + 60m
  const mGoldenStart = sunriseSec;
  const mGoldenEnd = sunriseSec + 3600;

  // Evening Golden Hour: sunset - 60m to sunset
  const eGoldenStart = sunsetSec - 3600;
  const eGoldenEnd = sunsetSec;

  // Evening Blue Hour: sunset to sunset + 30m
  const eBlueStart = sunsetSec;
  const eBlueEnd = sunsetSec + 1800;

  const isMorningGolden = currentSec >= mGoldenStart && currentSec <= mGoldenEnd;
  const isEveningGolden = currentSec >= eGoldenStart && currentSec <= eGoldenEnd;
  const isGoldenHourNow = isMorningGolden || isEveningGolden;

  const isMorningBlue = currentSec >= mBlueStart && currentSec <= mBlueEnd;
  const isEveningBlue = currentSec >= eBlueStart && currentSec <= eBlueEnd;
  const isBlueHourNow = isMorningBlue || isEveningBlue;

  let activePeriodName: string | undefined = undefined;
  if (isMorningGolden) activePeriodName = 'Golden Hour Pagi';
  else if (isEveningGolden) activePeriodName = 'Golden Hour Sore';
  else if (isMorningBlue) activePeriodName = 'Blue Hour Fajar';
  else if (isEveningBlue) activePeriodName = 'Blue Hour Senja';

  // Estimate Moonrise & Moonset based on sunrise/sunset and lunar phase offset
  const moonData = getMoonPhase(currentSec);
  const phaseLagSec = Math.round(moonData.phaseNormalized * 86400);
  const estMoonriseSec = sunriseSec + phaseLagSec;
  const estMoonsetSec = sunsetSec + phaseLagSec;

  // Calculate 24h local day progress (0% at 00:00, 100% at 24:00)
  const localDate = new Date((currentSec + timezoneOffsetSec) * 1000);
  const secondsIntoDay =
    localDate.getUTCHours() * 3600 +
    localDate.getUTCMinutes() * 60 +
    localDate.getUTCSeconds();
  const solarDayProgressPct = Math.max(0, Math.min(100, (secondsIntoDay / 86400) * 100));

  return {
    isGoldenHourNow,
    isBlueHourNow,
    activePeriodName,
    morningGoldenStart: formatLocalTime(mGoldenStart, timezoneOffsetSec),
    morningGoldenEnd: formatLocalTime(mGoldenEnd, timezoneOffsetSec),
    eveningGoldenStart: formatLocalTime(eGoldenStart, timezoneOffsetSec),
    eveningGoldenEnd: formatLocalTime(eGoldenEnd, timezoneOffsetSec),
    morningBlueStart: formatLocalTime(mBlueStart, timezoneOffsetSec),
    morningBlueEnd: formatLocalTime(mBlueEnd, timezoneOffsetSec),
    eveningBlueStart: formatLocalTime(eBlueStart, timezoneOffsetSec),
    eveningBlueEnd: formatLocalTime(eBlueEnd, timezoneOffsetSec),
    moonriseTime: formatLocalTime(estMoonriseSec, timezoneOffsetSec),
    moonsetTime: formatLocalTime(estMoonsetSec, timezoneOffsetSec),
    solarDayProgressPct,
  };
}

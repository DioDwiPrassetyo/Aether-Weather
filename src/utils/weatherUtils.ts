import {
  CurrentWeatherResponse,
  ForecastResponse,
  AirPollutionResponse,
  GeocodingResult,
  UnitType,
  WeatherTheme,
  TimeOfDay,
} from '@/types/weather';

export const API_KEY =
  process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY || 'dcaeefb2330ad28a6d30a6c6515088ec';
export const BASE_URL = 'https://api.openweathermap.org/data/2.5';
export const GEO_URL = 'https://api.openweathermap.org/geo/1.0';

export const I18N = {
  descriptions: {
    'clear sky': 'Cerah Bersih',
    'few clouds': 'Cerah Berawan Tipis',
    'scattered clouds': 'Awan Tersebar',
    'broken clouds': 'Berawan Sebagian',
    'overcast clouds': 'Mendung Tebal',
    'light rain': 'Hujan Ringan',
    'moderate rain': 'Hujan Sedang',
    'heavy intensity rain': 'Hujan Lebat',
    'very heavy rain': 'Hujan Sangat Deras',
    'extreme rain': 'Hujan Ekstrem',
    'freezing rain': 'Hujan Beku',
    'light intensity shower rain': 'Gerimis Ringan',
    'shower rain': 'Hujan Guyur',
    'heavy intensity shower rain': 'Hujan Deras Guyur',
    'thunderstorm with light rain': 'Badai Petir & Hujan Ringan',
    'thunderstorm with rain': 'Badai Petir & Hujan',
    'thunderstorm with heavy rain': 'Badai Petir & Hujan Lebat',
    'light thunderstorm': 'Badai Petir Ringan',
    'thunderstorm': 'Badai Petir',
    'heavy thunderstorm': 'Badai Petir Kuat',
    'light snow': 'Salju Ringan',
    'snow': 'Salju',
    'heavy snow': 'Salju Lebat',
    'mist': 'Berkabut Tipis (Mist)',
    'smoke': 'Berasap',
    'haze': 'Kabut Udara (Haze)',
    'fog': 'Kabut Tebal (Fog)',
    'sand': 'Badai Pasir',
    'dust': 'Berdebu',
  } as Record<string, string>,

  translate(desc: string): string {
    if (!desc) return '--';
    const lower = desc.toLowerCase().trim();
    return this.descriptions[lower] || desc;
  },

  days: ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'],
  months: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'],
};

export async function fetchCurrentWeather(
  target: { city?: string; lat?: number; lon?: number },
  unit: UnitType
): Promise<CurrentWeatherResponse> {
  let url = '';
  if (target.city) {
    url = `${BASE_URL}/weather?q=${encodeURIComponent(target.city)}&appid=${API_KEY}&units=${unit}`;
  } else if (target.lat !== undefined && target.lon !== undefined) {
    url = `${BASE_URL}/weather?lat=${target.lat}&lon=${target.lon}&appid=${API_KEY}&units=${unit}`;
  } else {
    throw new Error('Parameter pencarian cuaca tidak valid.');
  }

  const res = await fetch(url);
  if (!res.ok) {
    if (res.status === 404) {
      throw new Error(`Kota "${target.city || ''}" tidak ditemukan.`);
    }
    throw new Error(`Gagal memuat cuaca: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchForecastData(
  lat: number,
  lon: number,
  unit: UnitType
): Promise<ForecastResponse> {
  const url = `${BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=${unit}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Gagal memuat data prakiraan.');
  return res.json();
}

export async function fetchAirPollutionData(
  lat: number,
  lon: number
): Promise<AirPollutionResponse | null> {
  const url = `${BASE_URL}/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`;
  try {
    const res = await fetch(url);
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn('Air pollution API warning:', err);
  }
  return null;
}

export async function searchGeocoding(query: string): Promise<GeocodingResult[]> {
  if (!query || query.length < 2) return [];
  const url = `${GEO_URL}/direct?q=${encodeURIComponent(query)}&limit=5&appid=${API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  return res.json();
}

export function getTimeOfDay(localHour: number): TimeOfDay {
  if (localHour >= 5 && localHour < 11) return 'pagi';
  if (localHour >= 11 && localHour < 15) return 'siang';
  if (localHour >= 15 && localHour < 19) return 'sore';
  return 'malam';
}

export function getThemeFromWeather(
  weatherId: number,
  isNight: boolean,
  localHour?: number
): WeatherTheme {
  if (weatherId >= 200 && weatherId < 300) return 'thunderstorm';
  if (weatherId >= 300 && weatherId < 600) return 'rain';
  if (weatherId >= 600 && weatherId < 700) return 'snow';
  if (weatherId >= 700 && weatherId < 800) return 'mist';

  if (localHour !== undefined) {
    return getTimeOfDay(localHour);
  }

  return isNight ? 'malam' : 'siang';
}

export function getCardinalDirection(angle: number | undefined): string {
  if (angle === undefined || angle === null) return 'U';
  const directions = ['U', 'TL', 'T', 'TG', 'S', 'BD', 'B', 'BL'];
  const index = Math.round(((angle %= 360) < 0 ? angle + 360 : angle) / 45) % 8;
  return directions[index];
}

export function getBeaufortScale(mps: number | undefined): string {
  if (!mps) return 'Tenang';
  if (mps < 0.5) return 'Tenang';
  if (mps < 1.5) return 'Tenang Sekali';
  if (mps < 3.3) return 'Semilir Ringan';
  if (mps < 5.5) return 'Semilir Lembut';
  if (mps < 8.0) return 'Angin Sedang';
  if (mps < 10.8) return 'Angin Segar';
  if (mps < 13.9) return 'Angin Kuat';
  return 'Angin Sangat Kencang';
}

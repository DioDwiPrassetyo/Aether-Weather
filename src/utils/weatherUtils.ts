import {
  CurrentWeatherResponse,
  ForecastResponse,
  ForecastItem,
  AirPollutionResponse,
  GeocodingResult,
  UnitType,
  WeatherTheme,
  TimeOfDay,
} from '@/types/weather';

export const API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY?.trim() || '';
export const MAP_API_KEY =
  process.env.NEXT_PUBLIC_OPENWEATHER_MAP_API_KEY?.trim() || API_KEY;
export const BASE_URL =
  process.env.NEXT_PUBLIC_OPENWEATHER_BASE_URL?.trim() ||
  'https://api.openweathermap.org/data/2.5';
export const GEO_URL =
  process.env.NEXT_PUBLIC_OPENWEATHER_GEO_URL?.trim() ||
  'https://api.openweathermap.org/geo/1.0';

export function getApiKey(): string {
  const key = API_KEY;
  if (!key) {
    throw new Error('Missing NEXT_PUBLIC_OPENWEATHER_API_KEY. Add it to your .env.local file.');
  }
  return key;
}

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
    'ragged thunderstorm': 'Badai Petir Tidak Beraturan',
    'light snow': 'Bersalju Ringan',
    'snow': 'Bersalju',
    'heavy snow': 'Badai Salju Lebat',
    'sleet': 'Hujan Es / Salju Campur',
    'light shower sleet': 'Gerimis Salju Es',
    'shower sleet': 'Hujan Salju Es',
    'light rain and snow': 'Hujan Campur Salju Ringan',
    'rain and snow': 'Hujan Campur Salju',
    'light shower snow': 'Hujan Salju Ringan',
    'shower snow': 'Hujan Salju Guyur',
    'heavy shower snow': 'Badai Salju Deras (Blizzard)',
    'mist': 'Berkabut Tipis (Mist)',
    'smoke': 'Berasap',
    'haze': 'Kabut Udara (Haze)',
    'sand/dust whirls': 'Pusaran Debu / Pasir',
    'fog': 'Kabut Tebal (Fog)',
    'sand': 'Badai Pasir',
    'dust': 'Berdebu',
    'volcanic ash': 'Abu Vulkanik',
    'squalls': 'Badai Angin Kencang (Squall)',
    'tornado': 'Angin Puting Beliung / Tornado',
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
  unit: UnitType,
  signal?: AbortSignal
): Promise<CurrentWeatherResponse> {
  const apiKey = getApiKey();
  let url = '';
  if (target.city) {
    url = `${BASE_URL}/weather?q=${encodeURIComponent(target.city)}&appid=${apiKey}&units=${unit}`;
  } else if (target.lat !== undefined && target.lon !== undefined) {
    url = `${BASE_URL}/weather?lat=${target.lat}&lon=${target.lon}&appid=${apiKey}&units=${unit}`;
  } else {
    throw new Error('Parameter pencarian cuaca tidak valid.');
  }

  const res = await fetch(url, { signal });
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
  unit: UnitType,
  signal?: AbortSignal
): Promise<ForecastResponse> {
  const apiKey = getApiKey();
  const url = `${BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=${unit}`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error('Gagal memuat data prakiraan.');
  return res.json();
}

export function wmoCodeToCondition(
  code: number,
  isNight: boolean
): { id: number; main: string; description: string; icon: string } {
  const suffix = isNight ? 'n' : 'd';
  switch (code) {
    case 0:
      return { id: 800, main: 'Clear', description: 'clear sky', icon: `01${suffix}` };
    case 1:
      return { id: 801, main: 'Clouds', description: 'few clouds', icon: `02${suffix}` };
    case 2:
      return { id: 802, main: 'Clouds', description: 'scattered clouds', icon: `03${suffix}` };
    case 3:
      return { id: 804, main: 'Clouds', description: 'overcast clouds', icon: `04${suffix}` };
    case 45:
    case 48:
      return { id: 741, main: 'Fog', description: 'fog', icon: `50${suffix}` };
    case 51:
    case 53:
    case 55:
      return { id: 300, main: 'Drizzle', description: 'light intensity drizzle', icon: `09${suffix}` };
    case 56:
    case 57:
      return { id: 311, main: 'Drizzle', description: 'drizzle', icon: `09${suffix}` };
    case 61:
      return { id: 500, main: 'Rain', description: 'light rain', icon: `10${suffix}` };
    case 63:
      return { id: 501, main: 'Rain', description: 'moderate rain', icon: `10${suffix}` };
    case 65:
      return { id: 502, main: 'Rain', description: 'heavy intensity rain', icon: `10${suffix}` };
    case 66:
    case 67:
      return { id: 511, main: 'Rain', description: 'freezing rain', icon: `13${suffix}` };
    case 71:
      return { id: 600, main: 'Snow', description: 'light snow', icon: `13${suffix}` };
    case 73:
      return { id: 601, main: 'Snow', description: 'snow', icon: `13${suffix}` };
    case 75:
      return { id: 602, main: 'Snow', description: 'heavy snow', icon: `13${suffix}` };
    case 77:
      return { id: 611, main: 'Snow', description: 'sleet', icon: `13${suffix}` };
    case 80:
      return { id: 520, main: 'Rain', description: 'light intensity shower rain', icon: `09${suffix}` };
    case 81:
      return { id: 521, main: 'Rain', description: 'shower rain', icon: `09${suffix}` };
    case 82:
      return { id: 522, main: 'Rain', description: 'heavy intensity shower rain', icon: `09${suffix}` };
    case 85:
      return { id: 620, main: 'Snow', description: 'light shower snow', icon: `13${suffix}` };
    case 86:
      return { id: 622, main: 'Snow', description: 'heavy shower snow', icon: `13${suffix}` };
    case 95:
      return { id: 211, main: 'Thunderstorm', description: 'thunderstorm', icon: `11${suffix}` };
    case 96:
    case 99:
      return { id: 202, main: 'Thunderstorm', description: 'thunderstorm with heavy rain', icon: `11${suffix}` };
    default:
      return { id: 800, main: 'Clear', description: 'clear sky', icon: `01${suffix}` };
  }
}

export function getEffectiveNowEpoch(timezoneOffset = 0): number {
  return Math.floor(Date.now() / 1000);
}

export function getEffectiveCityDate(timezoneOffset = 0): Date {
  const cityEpochMs = Date.now() + timezoneOffset * 1000;
  return new Date(cityEpochMs);
}

export function interpolateHourlyForecast(
  current: CurrentWeatherResponse,
  owmList: ForecastItem[],
  count: number = 24
): ForecastItem[] {
  const effectiveNow = getEffectiveNowEpoch(current.timezone);
  const currentAnchor: ForecastItem = {
    dt: effectiveNow,
    main: {
      temp: current.main.temp,
      feels_like: current.main.feels_like,
      temp_min: current.main.temp_min,
      temp_max: current.main.temp_max,
      pressure: current.main.pressure,
      humidity: current.main.humidity,
    },
    weather: current.weather,
    clouds: current.clouds,
    wind: current.wind,
    visibility: current.visibility,
    pop: owmList[0]?.pop || 0,
    sys: { pod: current.weather[0]?.icon?.endsWith('n') ? 'n' : 'd' },
    dt_txt: new Date(effectiveNow * 1000).toISOString().replace('T', ' ').substring(0, 19),
  };

  const anchors = [currentAnchor, ...owmList];
  const results: ForecastItem[] = [];
  const startHourEpoch = Math.floor(effectiveNow / 3600) * 3600;

  for (let i = 0; i < count; i++) {
    const targetDt = startHourEpoch + i * 3600;

    let left = anchors[0];
    let right = anchors[anchors.length - 1];

    for (let a = 0; a < anchors.length - 1; a++) {
      if (targetDt >= anchors[a].dt && targetDt <= anchors[a + 1].dt) {
        left = anchors[a];
        right = anchors[a + 1];
        break;
      }
      if (targetDt < anchors[0].dt) {
        left = anchors[0];
        right = anchors[0];
        break;
      }
    }

    const span = Math.max(1, right.dt - left.dt);
    const fraction = Math.max(0, Math.min(1, (targetDt - left.dt) / span));
    const ease = fraction * fraction * (3 - 2 * fraction);

    const temp = Number((left.main.temp * (1 - ease) + right.main.temp * ease).toFixed(1));
    const feels_like = Number((left.main.feels_like * (1 - ease) + right.main.feels_like * ease).toFixed(1));
    const humidity = Math.round(left.main.humidity * (1 - ease) + right.main.humidity * ease);
    const pressure = Math.round(left.main.pressure * (1 - ease) + right.main.pressure * ease);
    const pop = Number((left.pop * (1 - ease) + right.pop * ease).toFixed(2));
    const windSpeed = Number((left.wind.speed * (1 - ease) + right.wind.speed * ease).toFixed(2));

    const angleDiff = ((right.wind.deg - left.wind.deg + 540) % 360) - 180;
    const windDeg = Math.round((left.wind.deg + angleDiff * ease + 360) % 360);

    const chosenWeather = fraction < 0.5 ? left.weather[0] : right.weather[0];

    const cityTime = new Date((targetDt + current.timezone) * 1000);
    const localHour = cityTime.getUTCHours();
    const isNight = localHour < 6 || localHour >= 18;
    const pod = isNight ? 'n' : 'd';
    const iconBase = chosenWeather?.icon ? chosenWeather.icon.slice(0, 2) : '01';

    const itemDate = new Date(targetDt * 1000);
    const dt_txt = itemDate.toISOString().replace('T', ' ').substring(0, 19);

    results.push({
      dt: targetDt,
      main: {
        temp,
        feels_like,
        temp_min: temp,
        temp_max: temp,
        pressure,
        humidity,
      },
      weather: [
        {
          id: chosenWeather?.id || 800,
          main: chosenWeather?.main || 'Clear',
          description: chosenWeather?.description || 'clear sky',
          icon: `${iconBase}${pod}`,
        },
      ],
      clouds: {
        all: Math.round(left.clouds.all * (1 - ease) + right.clouds.all * ease),
      },
      wind: {
        speed: windSpeed,
        deg: windDeg,
      },
      visibility: Math.round(left.visibility * (1 - ease) + right.visibility * ease),
      pop,
      sys: { pod },
      dt_txt,
    });
  }

  return results;
}

export async function fetchHourlyForecast(
  lat: number,
  lon: number,
  unit: UnitType,
  current?: CurrentWeatherResponse,
  owmList?: ForecastItem[],
  signal?: AbortSignal
): Promise<ForecastItem[]> {
  try {
    const tempParam = unit === 'imperial' ? 'fahrenheit' : 'celsius';
    const windParam = unit === 'imperial' ? 'mph' : 'ms';
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,apparent_temperature,precipitation_probability,precipitation,weather_code,wind_speed_10m,wind_direction_10m,relative_humidity_2m,surface_pressure,cloud_cover&forecast_hours=72&timezone=GMT&temperature_unit=${tempParam}&wind_speed_unit=${windParam}`;

    const res = await fetch(url, { signal });
    if (!res.ok) throw new Error(`Open-Meteo returned HTTP ${res.status}`);
    const data = await res.json();

    const hourly = data.hourly;
    if (!hourly || !Array.isArray(hourly.time) || hourly.time.length === 0) {
      throw new Error('Invalid Open-Meteo hourly payload');
    }

    const tzOffset = current?.timezone ?? 0;
    const nowEpoch = getEffectiveNowEpoch(tzOffset);
    const timesSec = hourly.time.map((t: string) => Math.floor(new Date(t + 'Z').getTime() / 1000));

    let startIdx = timesSec.findIndex((sec: number) => sec >= nowEpoch - 1800);
    if (startIdx < 0) startIdx = 0;

    const count = Math.min(24, hourly.time.length - startIdx);
    const results: ForecastItem[] = [];

    for (let i = 0; i < count; i++) {
      const idx = startIdx + i;
      const dt = timesSec[idx];
      const temp = Number(hourly.temperature_2m[idx] ?? 25);
      const feels_like = Number(hourly.apparent_temperature[idx] ?? temp);
      const popPercent = Number(hourly.precipitation_probability[idx] ?? 0);
      const rainMm = Number(hourly.precipitation[idx] ?? 0);
      const wmoCode = Number(hourly.weather_code[idx] ?? 0);
      const windSpeed = Number(hourly.wind_speed_10m[idx] ?? 0);
      const windDeg = Number(hourly.wind_direction_10m[idx] ?? 0);
      const humidity = Number(hourly.relative_humidity_2m[idx] ?? 70);
      const pressure = Number(hourly.surface_pressure[idx] ?? 1013);
      const clouds = Number(hourly.cloud_cover[idx] ?? 0);

      const localDate = new Date((dt + tzOffset) * 1000);
      const localHour = localDate.getUTCHours();
      const isNight = localHour < 6 || localHour >= 18;
      const cond = wmoCodeToCondition(wmoCode, isNight);

      results.push({
        dt,
        main: {
          temp,
          feels_like,
          temp_min: temp,
          temp_max: temp,
          pressure,
          humidity,
        },
        weather: [cond],
        clouds: { all: clouds },
        wind: {
          speed: windSpeed,
          deg: windDeg,
        },
        visibility: 10000,
        pop: Number((popPercent / 100).toFixed(2)),
        rain: { '1h': rainMm },
        sys: { pod: isNight ? 'n' : 'd' },
        dt_txt: new Date(dt * 1000).toISOString().replace('T', ' ').substring(0, 19),
      });
    }

    if (results.length >= 12) {
      return results;
    }
  } catch (err) {
    console.warn('Open-Meteo hourly fetch error, using interpolation fallback:', err);
  }

  // Fallback to high-quality cubic interpolation from OWM
  if (current && owmList && owmList.length > 0) {
    return interpolateHourlyForecast(current, owmList, 24);
  }

  return [];
}

export async function fetchAirPollutionData(
  lat: number,
  lon: number,
  signal?: AbortSignal
): Promise<AirPollutionResponse | null> {
  const apiKey = API_KEY;
  if (!apiKey) return null;
  const url = `${BASE_URL}/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`;
  try {
    const res = await fetch(url, { signal });
    if (signal?.aborted) throw new DOMException('Request aborted.', 'AbortError');
    if (res.ok) return await res.json();
    console.warn(`Air pollution API returned HTTP ${res.status}.`);
  } catch (err) {
    if (signal?.aborted) throw err;
    console.warn('Air pollution API warning:', err);
  }
  return null;
}

export async function searchGeocoding(
  query: string,
  signal?: AbortSignal
): Promise<GeocodingResult[]> {
  if (!query || query.length < 2) return [];
  const apiKey = getApiKey();
  const url = `${GEO_URL}/direct?q=${encodeURIComponent(query)}&limit=5&appid=${apiKey}`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Gagal mencari lokasi: ${res.statusText}`);
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

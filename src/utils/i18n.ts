export type Language =
  | 'id'
  | 'en'
  | 'ms'
  | 'ja'
  | 'ko'
  | 'zh'
  | 'es'
  | 'fr'
  | 'de'
  | 'ar'
  | 'pt'
  | 'ru';

export interface LanguageMeta {
  code: Language;
  label: string;
  nativeName: string;
  flag: string;
  speechLang: string;
  dir?: 'ltr' | 'rtl';
}

export const SUPPORTED_LANGUAGES: LanguageMeta[] = [
  { code: 'id', label: 'Indonesian', nativeName: 'Bahasa Indonesia', flag: '🇮🇩', speechLang: 'id-ID' },
  { code: 'en', label: 'English', nativeName: 'English', flag: '🇬🇧', speechLang: 'en-US' },
  { code: 'ms', label: 'Malay', nativeName: 'Bahasa Melayu', flag: '🇲🇾', speechLang: 'ms-MY' },
  { code: 'ja', label: 'Japanese', nativeName: '日本語', flag: '🇯🇵', speechLang: 'ja-JP' },
  { code: 'ko', label: 'Korean', nativeName: '한국어', flag: '🇰🇷', speechLang: 'ko-KR' },
  { code: 'zh', label: 'Chinese', nativeName: '中文', flag: '🇨🇳', speechLang: 'zh-CN' },
  { code: 'es', label: 'Spanish', nativeName: 'Español', flag: '🇪🇸', speechLang: 'es-ES' },
  { code: 'fr', label: 'French', nativeName: 'Français', flag: '🇫🇷', speechLang: 'fr-FR' },
  { code: 'de', label: 'German', nativeName: 'Deutsch', flag: '🇩🇪', speechLang: 'de-DE' },
  { code: 'ar', label: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', speechLang: 'ar-SA', dir: 'rtl' },
  { code: 'pt', label: 'Portuguese', nativeName: 'Português', flag: '🇧🇷', speechLang: 'pt-BR' },
  { code: 'ru', label: 'Russian', nativeName: 'Русский', flag: '🇷🇺', speechLang: 'ru-RU' },
];

export function isSupportedLanguage(val: unknown): val is Language {
  return (
    typeof val === 'string' &&
    SUPPORTED_LANGUAGES.some((item) => item.code === val)
  );
}

export function getLanguageMeta(lang: Language): LanguageMeta {
  return SUPPORTED_LANGUAGES.find((item) => item.code === lang) || SUPPORTED_LANGUAGES[0];
}

const COUNTRY_TO_LANG: Record<string, Language> = {
  // Indonesian
  ID: 'id',
  // Malay
  MY: 'ms',
  BN: 'ms',
  // Japanese
  JP: 'ja',
  // Korean
  KR: 'ko',
  // Chinese
  CN: 'zh',
  TW: 'zh',
  HK: 'zh',
  MO: 'zh',
  // Spanish
  ES: 'es',
  MX: 'es',
  AR: 'es',
  CO: 'es',
  CL: 'es',
  PE: 'es',
  VE: 'es',
  EC: 'es',
  GT: 'es',
  CU: 'es',
  BO: 'es',
  DO: 'es',
  HN: 'es',
  PY: 'es',
  SV: 'es',
  NI: 'es',
  CR: 'es',
  PA: 'es',
  UY: 'es',
  PR: 'es',
  // French
  FR: 'fr',
  MC: 'fr',
  SN: 'fr',
  CI: 'fr',
  CM: 'fr',
  CD: 'fr',
  DZ: 'fr',
  MA: 'fr',
  TN: 'fr',
  // German
  DE: 'de',
  AT: 'de',
  LI: 'de',
  // Arabic
  SA: 'ar',
  AE: 'ar',
  QA: 'ar',
  KW: 'ar',
  BH: 'ar',
  OM: 'ar',
  EG: 'ar',
  JO: 'ar',
  LB: 'ar',
  IQ: 'ar',
  SY: 'ar',
  YE: 'ar',
  LY: 'ar',
  SD: 'ar',
  // Portuguese
  BR: 'pt',
  PT: 'pt',
  AO: 'pt',
  MZ: 'pt',
  // Russian
  RU: 'ru',
  BY: 'ru',
  KZ: 'ru',
  KG: 'ru',
  UZ: 'ru',
  TJ: 'ru',
};

export function countryCodeToLanguage(
  countryCode?: string | null,
  acceptLanguage?: string | null
): Language {
  if (countryCode) {
    const upper = countryCode.trim().toUpperCase();
    if (COUNTRY_TO_LANG[upper]) {
      return COUNTRY_TO_LANG[upper];
    }
    // English-speaking or international countries default to 'en' unless acceptLanguage specifies a supported language
    if (['US', 'GB', 'AU', 'CA', 'NZ', 'IE', 'SG', 'PH', 'IN', 'ZA'].includes(upper)) {
      return 'en';
    }
  }

  if (acceptLanguage) {
    const primary = acceptLanguage.split(',')[0]?.trim()?.toLowerCase() || '';
    const prefix = primary.split('-')[0];
    if (isSupportedLanguage(prefix)) {
      return prefix;
    }
  }

  return 'en';
}

export function timezoneToCountryCode(tz?: string): string | null {
  if (!tz) return null;
  const lower = tz.toLowerCase();
  if (
    lower.includes('jakarta') ||
    lower.includes('makassar') ||
    lower.includes('jayapura') ||
    lower.includes('pontianak')
  ) {
    return 'ID';
  }
  if (lower.includes('kuala_lumpur') || lower.includes('kuching') || lower.includes('brunei')) {
    return 'MY';
  }
  if (lower.includes('tokyo')) return 'JP';
  if (lower.includes('seoul')) return 'KR';
  if (
    lower.includes('shanghai') ||
    lower.includes('chongqing') ||
    lower.includes('taipei') ||
    lower.includes('hong_kong')
  ) {
    return 'CN';
  }
  if (
    lower.includes('madrid') ||
    lower.includes('mexico') ||
    lower.includes('buenos_aires') ||
    lower.includes('bogota') ||
    lower.includes('lima') ||
    lower.includes('santiago')
  ) {
    return 'ES';
  }
  if (lower.includes('paris')) return 'FR';
  if (lower.includes('berlin') || lower.includes('vienna') || lower.includes('zurich')) return 'DE';
  if (
    lower.includes('riyadh') ||
    lower.includes('dubai') ||
    lower.includes('cairo') ||
    lower.includes('baghdad') ||
    lower.includes('qatar')
  ) {
    return 'SA';
  }
  if (lower.includes('sao_paulo') || lower.includes('lisbon')) return 'BR';
  if (lower.includes('moscow') || lower.includes('almaty') || lower.includes('minsk')) return 'RU';
  return null;
}

export interface Translations {
  // App Header & Branding
  brandSubtitle: string;
  searchPlaceholder: string;
  gpsTooltip: string;
  clearSearchTooltip: string;
  refreshTooltip: string;
  favoriteAddTooltip: string;
  favoriteRemoveTooltip: string;
  compareButton: string;
  recentSearchesTitle: string;
  clearHistory: string;
  noRecentSearches: string;
  voiceSearchTooltip: string;
  voiceSearchListening: string;
  voiceSearchError: string;
  notificationsTooltip: string;
  notificationsEnabled: string;
  notificationsDenied: string;

  // Multi-Page Navigation
  navOverview: string;
  navOverviewShort: string;
  navOverviewDesc: string;
  navRadar: string;
  navRadarShort: string;
  navRadarDesc: string;
  navOperational: string;
  navOperationalShort: string;
  navOperationalDesc: string;
  navTravel: string;
  navTravelShort: string;
  navTravelDesc: string;
  navExplore: string;
  navExploreShort: string;
  navExploreDesc: string;
  autoDetectIpLabel: string;

  // Quick Chips & Theme
  popularCities: string;
  savedFavorites: string;
  timeTheme: string;
  themeAuto: string;
  themePagi: string;
  themeSiang: string;
  themeSore: string;
  themeMalam: string;

  // Hero Card
  feelsLike: string;
  tempHigh: string;
  tempLow: string;
  wind: string;
  humidity: string;
  shareWeather: string;
  offlineMode: string;
  offlineNotice: string;

  // Hourly Forecast
  hourlyTitle: string;
  hourlySubtitle: string;
  now: string;
  clickForDetails: string;

  // 24h Trend Chart
  chartTitle: string;
  chartSubtitle: string;
  tempTrend: string;
  rainChance: string;
  chartTempMode: string;
  chartRainMode: string;
  chartWindMode: string;
  chartPeak: string;
  chartLowest: string;
  chartAverage: string;
  chartFeelsLike: string;

  // Metric Cards
  metricsTitle: string;
  windAndDirection: string;
  gustSpeed: string;
  humidityAndDew: string;
  dewPoint: string;
  dewComfortDry: string;
  dewComfortNormal: string;
  dewComfortHumid: string;
  airQualityIndex: string;
  aqiLevels: Record<number, string>;
  pollutants: string;
  sunCycle: string;
  sunrise: string;
  sunset: string;
  daytime: string;
  nighttime: string;
  visibility: string;
  visibilityClear: string;
  visibilityGood: string;
  visibilityModerate: string;
  visibilityPoor: string;
  airPressure: string;
  pressureStable: string;
  pressureRising: string;
  pressureFalling: string;
  cloudCover: string;
  precipitationChance: string;

  // Astronomy / Moon Phase Card
  astronomyTitle: string;
  moonPhase: string;
  moonIllumination: string;
  moonAge: string;
  moonPhases: Record<string, string>;
  goldenHour: string;
  morningGoldenHour: string;
  eveningGoldenHour: string;
  blueHour: string;
  morningBlueHour: string;
  eveningBlueHour: string;
  goldenHourActive: string;
  goldenHourUpcoming: string;
  astronomyTip: string;
  nextFullMoon: string;
  nextNewMoon: string;
  lunarDistance: string;
  stargazingRating: string;
  stargazingExcellent: string;
  stargazingGood: string;
  stargazingBright: string;
  lunarCycleOverview: string;

  // Radar Map
  radarTitle: string;
  radarSubtitle: string;
  radarPlay: string;
  radarPause: string;
  radarFullscreen: string;
  radarExitFullscreen: string;
  radarTimeline: string;

  // Lifestyle Indexes Hub
  lifestyleTitle: string;
  lifestyleSubtitle: string;
  drivingSafety: string;
  drivingOptimal: string;
  drivingCaution: string;
  drivingHazard: string;
  runningScore: string;
  runningOptimal: string;
  runningGood: string;
  runningFair: string;
  runningAvoid: string;
  fluRisk: string;
  fluLow: string;
  fluHigh: string;
  mosquitoActivity: string;
  mosquitoLow: string;
  mosquitoHigh: string;

  // Weather Advisor
  advisorTitle: string;
  outfitSuggestion: string;
  umbrellaSuggestion: string;
  outdoorSports: string;
  sunscreenProtection: string;
  airHealth: string;
  commuteRoadSafety: string;

  // Extreme Hazard Alert
  hazardAlertTitle: string;
  hazardSafeTitle: string;
  hazardSafeDesc: string;

  // 5-Day Forecast
  extendedForecastTitle: string;
  today: string;

  // City Comparison Modal
  comparisonTitle: string;
  comparisonSubtitle: string;
  city1Label: string;
  city2Label: string;
  searchCity2Placeholder: string;
  temperatureDiff: string;
  warmer: string;
  cooler: string;
  sameTemp: string;
  timeDifference: string;
  higherPoP: string;
  lowerPoP: string;
  betterAqi: string;
  worseAqi: string;
  closeComparison: string;
  swapCities: string;

  // Share Weather Modal
  shareTitle: string;
  shareSubtitle: string;
  downloadImage: string;
  shareToApps: string;
  copyImage: string;
  copyTextInfo: string;
  copyLink: string;
  shareWhatsApp: string;
  shareTelegram: string;
  shareTwitter: string;
  imageCopiedToast: string;
  linkCopiedToast: string;
  textCopiedToast: string;
  downloadSuccessToast: string;
  sharedSuccessToast: string;
  closeShare: string;

  // Hourly Detail Modal
  hourlyDetailTitle: string;
  hourlyDetailSubtitle: string;
  prevHour: string;
  nextHour: string;
  precipitationVolume: string;
  closeHourlyDetail: string;

  // Sticky Bar
  scrollToTop: string;

  // Days and Months
  days: string[];
  months: string[];
  monthsFull: string[];

  // Weather conditions dictionary
  descriptions: Record<string, string>;
}

const ID_TRANSLATIONS: Translations = {
  brandSubtitle: 'Intelijen Cuaca Real-Time',
  searchPlaceholder: "Cari kota atau daerah (tekan '/' untuk cari)...",
  gpsTooltip: 'Gunakan Lokasi Saat Ini',
  clearSearchTooltip: 'Hapus pencarian',
  refreshTooltip: 'Segarkan Data Cuaca',
  favoriteAddTooltip: 'Simpan ke Favorit',
  favoriteRemoveTooltip: 'Hapus dari Favorit',
  compareButton: 'Bandingkan',
  recentSearchesTitle: 'Riwayat Pencarian',
  clearHistory: 'Hapus Riwayat',
  noRecentSearches: 'Belum ada riwayat pencarian',
  voiceSearchTooltip: 'Cari dengan Suara',
  voiceSearchListening: 'Mendengarkan suara...',
  voiceSearchError: 'Tidak dapat mengenali suara.',
  notificationsTooltip: 'Aktifkan Notifikasi Cuaca',
  notificationsEnabled: 'Notifikasi peringatan cuaca aktif.',
  notificationsDenied: 'Izin notifikasi ditolak oleh browser.',

  navOverview: 'Beranda',
  navOverviewShort: 'Beranda',
  navOverviewDesc: 'Cuaca Saat Ini, Grafik 24 Jam & Prakiraan 5 Hari',
  navRadar: 'Peta & Radar',
  navRadarShort: 'Radar',
  navRadarDesc: 'Doppler Presipitasi Live, Nowcast +30m & Jendela Aktivitas',
  navOperational: 'Aviasi & Laut',
  navOperationalShort: 'Aviasi',
  navOperationalDesc: 'Indeks Terbang Drone (UAV), Pasang Surut Laut & Sirine Dini',
  navTravel: 'Perjalanan',
  navTravelShort: 'Travel',
  navTravelDesc: 'Asisten Checklist Koper, Jendela Keberangkatan & Gaya Hidup',
  navExplore: 'Lab & Kuis',
  navExploreShort: 'Eksplor',
  navExploreDesc: 'Mesin Waktu Iklim 50 Tahun, Kuis Kota Misteri & Widget Embed',
  autoDetectIpLabel: 'Deteksi Otomatis IP Negara',

  popularCities: 'Kota Populer',
  savedFavorites: 'Kota Favorit',
  timeTheme: 'Tema Waktu',
  themeAuto: 'Otomatis',
  themePagi: 'Pagi',
  themeSiang: 'Siang',
  themeSore: 'Sore',
  themeMalam: 'Malam',

  feelsLike: 'Terasa seperti',
  tempHigh: 'Tertinggi',
  tempLow: 'Terendah',
  wind: 'Angin',
  humidity: 'Kelembapan',
  shareWeather: 'Bagikan Cuaca',
  offlineMode: 'Mode Offline',
  offlineNotice: 'Menampilkan data cuaca yang tersimpan di perangkat.',

  hourlyTitle: 'Prakiraan Tiap Jam',
  hourlySubtitle: 'Pergerakan cuaca 24 jam ke depan',
  now: 'Sekarang',
  clickForDetails: 'Klik untuk detail lengkap',

  chartTitle: 'Tren Temperatur 24 Jam',
  chartSubtitle: 'Geser kursor atau sentuh grafik untuk melihat rincian',
  tempTrend: 'Suhu Udara',
  rainChance: 'Peluang Hujan',
  chartTempMode: 'Suhu & Sensasi',
  chartRainMode: 'Peluang Hujan',
  chartWindMode: 'Kecepatan Angin',
  chartPeak: 'Puncak',
  chartLowest: 'Terendah',
  chartAverage: 'Rata-rata',
  chartFeelsLike: 'Terasa',

  metricsTitle: 'Sorotan Kondisi Atmosfer',
  windAndDirection: 'Angin & Arah',
  gustSpeed: 'Hembusan',
  humidityAndDew: 'Kelembapan & Titik Embun',
  dewPoint: 'Titik Embun',
  dewComfortDry: 'Kering & Nyaman',
  dewComfortNormal: 'Cukup Nyaman',
  dewComfortHumid: 'Lembap & Gerah',
  airQualityIndex: 'Indeks Kualitas Udara (AQI)',
  aqiLevels: {
    1: 'Sangat Baik',
    2: 'Baik / Sedang',
    3: 'Cukup Bersih',
    4: 'Kurang Sehat',
    5: 'Sangat Berbahaya',
  },
  pollutants: 'Polutan Utama',
  sunCycle: 'Siklus Surya',
  sunrise: 'Terbit',
  sunset: 'Terbenam',
  daytime: 'Siang Hari',
  nighttime: 'Malam Hari',
  visibility: 'Jarak Pandang',
  visibilityClear: 'Jernih',
  visibilityGood: 'Baik',
  visibilityModerate: 'Berkabut',
  visibilityPoor: 'Terbatas',
  airPressure: 'Tekanan Udara',
  pressureStable: 'Barometrik Stabil',
  pressureRising: 'Tekanan Naik',
  pressureFalling: 'Tekanan Turun',
  cloudCover: 'Tutupan Awan',
  precipitationChance: 'Peluang Hujan',

  astronomyTitle: 'Astronomi & Fase Bulan',
  moonPhase: 'Fase Bulan Saat Ini',
  moonIllumination: 'Iluminasi Cahaya',
  moonAge: 'Umur Bulan',
  moonPhases: {
    new_moon: 'Bulan Baru (New Moon)',
    waxing_crescent: 'Sabit Awal (Waxing Crescent)',
    first_quarter: 'Kuartal Pertama (First Quarter)',
    waxing_gibbous: 'Cembung Awal (Waxing Gibbous)',
    full_moon: 'Bulan Purnama (Full Moon)',
    waning_gibbous: 'Cembung Akhir (Waning Gibbous)',
    last_quarter: 'Kuartal Akhir (Last Quarter)',
    waning_crescent: 'Sabit Akhir (Waning Crescent)',
  },
  goldenHour: 'Jam Emas & Fotografi',
  morningGoldenHour: 'Golden Hour Pagi',
  eveningGoldenHour: 'Golden Hour Sore',
  blueHour: 'Blue Hour (Senja/Fajar)',
  morningBlueHour: 'Blue Hour Fajar',
  eveningBlueHour: 'Blue Hour Senja',
  goldenHourActive: 'Sedang Berlangsung Sekarang ✨',
  goldenHourUpcoming: 'Berikutnya',
  astronomyTip: 'Waktu terbaik untuk foto lanskap dengan rona cahaya alami.',
  nextFullMoon: 'Purnama Berikutnya',
  nextNewMoon: 'Bulan Baru Berikutnya',
  lunarDistance: 'Jarak ke Bumi',
  stargazingRating: 'Kondisi Pengamatan Langit',
  stargazingExcellent: 'Sangat Optimal (Langit Gelap)',
  stargazingGood: 'Cukup Baik untuk Teropong',
  stargazingBright: 'Terang oleh Cahaya Bulan',
  lunarCycleOverview: 'Siklus 8 Fase Bulan',

  radarTitle: 'Peta Radar Cuaca Interaktif (Live HD)',
  radarSubtitle: 'Animasi pergerakan awan hujan 2 jam terakhir',
  radarPlay: 'Putar Animasi Radar',
  radarPause: 'Jeda Radar',
  radarFullscreen: 'Layar Penuh',
  radarExitFullscreen: 'Tutup Layar Penuh',
  radarTimeline: 'Riwayat Radar (2 Jam Terakhir)',

  lifestyleTitle: 'Indeks Gaya Hidup & Keselamatan',
  lifestyleSubtitle: 'Panduan harian berdasarkan analitik cuaca presisi',
  drivingSafety: 'Keselamatan Mengemudi',
  drivingOptimal: 'Jalanan Kering & Aman',
  drivingCaution: 'Jalanan Basah (Hati-hati Licin)',
  drivingHazard: 'Bahaya Kabut & Jarak Pandang Rendah',
  runningScore: 'Kenyamanan Lari & Joging',
  runningOptimal: 'Kondisi Sangat Nyaman',
  runningGood: 'Cukup Nyaman',
  runningFair: 'Suhu Agak Berat',
  runningAvoid: 'Sebaiknya Tunda Lari Outdoor',
  fluRisk: 'Sensitivitas Flu & Radang',
  fluLow: 'Risiko Rendah',
  fluHigh: 'Waspada Fluktuasi Tekanan Barometrik',
  mosquitoActivity: 'Aktivitas Nyamuk',
  mosquitoLow: 'Aktivitas Rendah',
  mosquitoHigh: 'Meningkat (Lembap & Hangat)',

  advisorTitle: 'Rekomendasi Cerdas Aktivitas',
  outfitSuggestion: 'Pakaian & Busana',
  umbrellaSuggestion: 'Payung & Hujan',
  outdoorSports: 'Aktivitas Luar',
  sunscreenProtection: 'Perlindungan UV',
  airHealth: 'Kesehatan Udara',
  commuteRoadSafety: 'Kondisi Jalan',

  hazardAlertTitle: 'Peringatan Dini Cuaca & Bahaya',
  hazardSafeTitle: 'Kondisi Atmosfer Terpantau Aman',
  hazardSafeDesc: 'Tidak ada ancaman cuaca buruk atau badai ekstrem dalam pantauan satelit.',

  extendedForecastTitle: 'Prakiraan Cuaca 5 Hari',
  today: 'Hari ini',

  comparisonTitle: 'Perbandingan Cuaca Antar Kota',
  comparisonSubtitle: 'Bandingkan perbedaan cuaca, suhu, dan kualitas udara',
  city1Label: 'Kota 1 (Tujuan Utama)',
  city2Label: 'Kota 2 (Pembanding)',
  searchCity2Placeholder: 'Cari kota pembanding (contoh: Tokyo, Surabaya, London)...',
  temperatureDiff: 'Perbedaan Suhu',
  warmer: 'lebih hangat',
  cooler: 'lebih sejuk',
  sameTemp: 'suhu identik',
  timeDifference: 'Selisih Waktu',
  higherPoP: 'Peluang hujan lebih tinggi',
  lowerPoP: 'Peluang hujan lebih rendah',
  betterAqi: 'Kualitas udara lebih baik',
  worseAqi: 'Kualitas udara lebih tercemar',
  closeComparison: 'Tutup Perbandingan',
  swapCities: 'Tukar Posisi Kota',

  shareTitle: 'Bagikan Kartu Cuaca',
  shareSubtitle: 'Unduh kartu cuaca atau bagikan ke media sosial',
  downloadImage: 'Unduh Gambar (PNG)',
  shareToApps: 'Bagikan ke Aplikasi',
  copyImage: 'Salin Gambar',
  copyTextInfo: 'Salin Teks',
  copyLink: 'Salin Tautan',
  shareWhatsApp: 'WhatsApp',
  shareTelegram: 'Telegram',
  shareTwitter: 'X / Twitter',
  imageCopiedToast: 'Gambar kartu cuaca berhasil disalin ke clipboard!',
  linkCopiedToast: 'Tautan cuaca kota berhasil disalin!',
  textCopiedToast: 'Info ringkasan cuaca berhasil disalin ke clipboard!',
  downloadSuccessToast: 'Kartu cuaca berhasil diunduh.',
  sharedSuccessToast: 'Berhasil membuka dialog berbagi.',
  closeShare: 'Tutup',

  hourlyDetailTitle: 'Rincian Cuaca Per Jam',
  hourlyDetailSubtitle: 'Kondisi atmosfer spesifik untuk waktu yang dipilih',
  prevHour: 'Jam Sebelumnya',
  nextHour: 'Jam Berikutnya',
  precipitationVolume: 'Volume Hujan',
  closeHourlyDetail: 'Tutup Detail',

  scrollToTop: 'Ke Atas',

  days: ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'],
  months: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'],
  monthsFull: [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
  ],

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
  },
};

const EN_TRANSLATIONS: Translations = {
  brandSubtitle: 'Real-Time Weather Intelligence',
  searchPlaceholder: "Search city or area (press '/' to search)...",
  gpsTooltip: 'Use Current Location',
  clearSearchTooltip: 'Clear search',
  refreshTooltip: 'Refresh Weather Data',
  favoriteAddTooltip: 'Save to Favorites',
  favoriteRemoveTooltip: 'Remove from Favorites',
  compareButton: 'Compare',
  recentSearchesTitle: 'Recent Searches',
  clearHistory: 'Clear History',
  noRecentSearches: 'No recent searches yet',
  voiceSearchTooltip: 'Voice Search',
  voiceSearchListening: 'Listening for city name...',
  voiceSearchError: 'Could not recognize voice.',
  notificationsTooltip: 'Enable Weather Alerts',
  notificationsEnabled: 'Weather alert notifications are active.',
  notificationsDenied: 'Notifications permission denied by browser.',

  navOverview: 'Overview',
  navOverviewShort: 'Home',
  navOverviewDesc: 'Current Weather, 24h Curve & 5-Day Forecast',
  navRadar: 'Radar Map',
  navRadarShort: 'Radar',
  navRadarDesc: 'Doppler Live Precipitation, Nowcast & Optimal Windows',
  navOperational: 'Aviation & Marine',
  navOperationalShort: 'Flight',
  navOperationalDesc: 'UAV Drone Safety, Harmonic Tides & Early Warning Siren',
  navTravel: 'Smart Travel',
  navTravelShort: 'Travel',
  navTravelDesc: 'Smart Packing Checklist, Departure Window & Lifestyle',
  navExplore: 'Climate Lab',
  navExploreShort: 'Lab',
  navExploreDesc: '50-Year Time Machine, Mystery City Trivia & Embed Studio',
  autoDetectIpLabel: 'Auto-Detect by Visitor IP',

  popularCities: 'Popular Cities',
  savedFavorites: 'Favorite Cities',
  timeTheme: 'Time Theme',
  themeAuto: 'Auto',
  themePagi: 'Morning',
  themeSiang: 'Day',
  themeSore: 'Evening',
  themeMalam: 'Night',

  feelsLike: 'Feels like',
  tempHigh: 'High',
  tempLow: 'Low',
  wind: 'Wind',
  humidity: 'Humidity',
  shareWeather: 'Share Weather',
  offlineMode: 'Offline Mode',
  offlineNotice: 'Displaying cached weather data from your device.',

  hourlyTitle: 'Hourly Forecast',
  hourlySubtitle: 'Atmospheric conditions over the next 24 hours',
  now: 'Now',
  clickForDetails: 'Click for detailed breakdown',

  chartTitle: '24-Hour Temperature Trend',
  chartSubtitle: 'Hover or touch along the curve to inspect hour-by-hour metrics',
  tempTrend: 'Temperature',
  rainChance: 'Precipitation Chance',
  chartTempMode: 'Temp & Feels',
  chartRainMode: 'Rain Chance',
  chartWindMode: 'Wind Speed',
  chartPeak: 'Peak',
  chartLowest: 'Lowest',
  chartAverage: 'Average',
  chartFeelsLike: 'Feels like',

  metricsTitle: 'Atmospheric Highlights',
  windAndDirection: 'Wind & Direction',
  gustSpeed: 'Gusts',
  humidityAndDew: 'Humidity & Dew Point',
  dewPoint: 'Dew Point',
  dewComfortDry: 'Dry & Comfortable',
  dewComfortNormal: 'Pleasantly Normal',
  dewComfortHumid: 'Humid & Muggy',
  airQualityIndex: 'Air Quality Index (AQI)',
  aqiLevels: {
    1: 'Very Good',
    2: 'Fair',
    3: 'Moderate',
    4: 'Unhealthy',
    5: 'Very Hazardous',
  },
  pollutants: 'Main Pollutants',
  sunCycle: 'Solar Cycle',
  sunrise: 'Sunrise',
  sunset: 'Sunset',
  daytime: 'Daytime',
  nighttime: 'Nighttime',
  visibility: 'Visibility',
  visibilityClear: 'Clear',
  visibilityGood: 'Good',
  visibilityModerate: 'Hazy',
  visibilityPoor: 'Limited',
  airPressure: 'Air Pressure',
  pressureStable: 'Stable',
  pressureRising: 'Rising',
  pressureFalling: 'Falling',
  cloudCover: 'Cloud Cover',
  precipitationChance: 'Rain Chance',

  astronomyTitle: 'Astronomy & Moon Phase',
  moonPhase: 'Current Moon Phase',
  moonIllumination: 'Illumination',
  moonAge: 'Lunar Age',
  moonPhases: {
    new_moon: 'New Moon',
    waxing_crescent: 'Waxing Crescent',
    first_quarter: 'First Quarter',
    waxing_gibbous: 'Waxing Gibbous',
    full_moon: 'Full Moon',
    waning_gibbous: 'Waning Gibbous',
    last_quarter: 'Last Quarter',
    waning_crescent: 'Waning Crescent',
  },
  goldenHour: 'Golden Hour & Photography',
  morningGoldenHour: 'Morning Golden Hour',
  eveningGoldenHour: 'Evening Golden Hour',
  blueHour: 'Blue Hour (Dawn/Dusk)',
  morningBlueHour: 'Morning Blue Hour',
  eveningBlueHour: 'Evening Blue Hour',
  goldenHourActive: 'Currently Happening Now ✨',
  goldenHourUpcoming: 'Next up',
  astronomyTip: 'Ideal time for photography with soft, warm natural lighting.',
  nextFullMoon: 'Next Full Moon',
  nextNewMoon: 'Next New Moon',
  lunarDistance: 'Lunar Distance',
  stargazingRating: 'Stargazing Quality',
  stargazingExcellent: 'Excellent Dark Sky (Ideal)',
  stargazingGood: 'Good for Telescope',
  stargazingBright: 'Bright Moonlight Wash',
  lunarCycleOverview: '8-Phase Lunar Cycle',

  radarTitle: 'Interactive Weather Radar (Live HD)',
  radarSubtitle: 'Precipitation cloud movement over the past 2 hours',
  radarPlay: 'Play Radar Animation',
  radarPause: 'Pause Radar',
  radarFullscreen: 'Fullscreen Mode',
  radarExitFullscreen: 'Exit Fullscreen',
  radarTimeline: 'Radar History (Past 2 Hours)',

  lifestyleTitle: 'Lifestyle & Safety Indexes',
  lifestyleSubtitle: 'Daily insights based on precise atmospheric calculations',
  drivingSafety: 'Driving Safety',
  drivingOptimal: 'Dry & Clear Pavements',
  drivingCaution: 'Wet Pavements (Caution: Slippery)',
  drivingHazard: 'Fog Hazard & Low Visibility',
  runningScore: 'Running & Cardio',
  runningOptimal: 'Optimal Comfort Conditions',
  runningGood: 'Good for Exercise',
  runningFair: 'Fair / Mildly Warm',
  runningAvoid: 'Postpone Outdoor Run',
  fluRisk: 'Flu & Cold Sensitivity',
  fluLow: 'Low Environmental Risk',
  fluHigh: 'Watch for Sudden Barometric Swings',
  mosquitoActivity: 'Mosquito Activity',
  mosquitoLow: 'Low Activity',
  mosquitoHigh: 'Elevated (Warm & Humid)',

  advisorTitle: 'Smart Activity Advisor',
  outfitSuggestion: 'Outfit & Clothing',
  umbrellaSuggestion: 'Umbrella & Rain',
  outdoorSports: 'Outdoor Activity',
  sunscreenProtection: 'Sun & UV Shield',
  airHealth: 'Air & Respiration',
  commuteRoadSafety: 'Road & Commute',

  hazardAlertTitle: 'Severe Weather Alert',
  hazardSafeTitle: 'Atmospheric Conditions Normal',
  hazardSafeDesc: 'No severe weather warnings or extreme storms detected in satellite feeds.',

  extendedForecastTitle: '5-Day Extended Forecast',
  today: 'Today',

  comparisonTitle: 'City Weather Comparison',
  comparisonSubtitle: 'Compare weather, temperatures, and air quality side-by-side',
  city1Label: 'City 1 (Primary)',
  city2Label: 'City 2 (Comparison)',
  searchCity2Placeholder: 'Search city to compare (e.g., Tokyo, New York, London)...',
  temperatureDiff: 'Temperature Diff',
  warmer: 'warmer',
  cooler: 'cooler',
  sameTemp: 'identical temperature',
  timeDifference: 'Timezone Difference',
  higherPoP: 'Higher chance of rain',
  lowerPoP: 'Lower chance of rain',
  betterAqi: 'Cleaner air quality',
  worseAqi: 'More polluted air',
  closeComparison: 'Close Comparison',
  swapCities: 'Swap Cities',

  shareTitle: 'Share Weather Snapshot',
  shareSubtitle: 'Download weather card or share to social media',
  downloadImage: 'Download Image (PNG)',
  shareToApps: 'Share via Apps',
  copyImage: 'Copy Image',
  copyTextInfo: 'Copy Text',
  copyLink: 'Copy Link',
  shareWhatsApp: 'WhatsApp',
  shareTelegram: 'Telegram',
  shareTwitter: 'X / Twitter',
  imageCopiedToast: 'Weather card image copied to clipboard!',
  linkCopiedToast: 'Weather shareable link copied!',
  textCopiedToast: 'Weather summary copied to clipboard!',
  downloadSuccessToast: 'Weather card image downloaded.',
  sharedSuccessToast: 'Native share dialog launched.',
  closeShare: 'Close',

  hourlyDetailTitle: 'Hourly Weather Details',
  hourlyDetailSubtitle: 'Specific atmospheric conditions for selected time',
  prevHour: 'Previous Hour',
  nextHour: 'Next Hour',
  precipitationVolume: 'Rain Volume',
  closeHourlyDetail: 'Close Details',

  scrollToTop: 'Back to Top',

  days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  monthsFull: [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ],

  descriptions: {
    'clear sky': 'Clear Sky',
    'few clouds': 'Few Clouds',
    'scattered clouds': 'Scattered Clouds',
    'broken clouds': 'Broken Clouds',
    'overcast clouds': 'Overcast',
    'light rain': 'Light Rain',
    'moderate rain': 'Moderate Rain',
    'heavy intensity rain': 'Heavy Rain',
    'very heavy rain': 'Very Heavy Rain',
    'extreme rain': 'Extreme Rain',
    'freezing rain': 'Freezing Rain',
    'light intensity shower rain': 'Light Showers',
    'shower rain': 'Showers',
    'heavy intensity shower rain': 'Heavy Showers',
    'thunderstorm with light rain': 'Thunderstorm with Light Rain',
    'thunderstorm with rain': 'Thunderstorm with Rain',
    'thunderstorm with heavy rain': 'Thunderstorm with Heavy Rain',
    'light thunderstorm': 'Light Thunderstorm',
    'thunderstorm': 'Thunderstorm',
    'heavy thunderstorm': 'Severe Thunderstorm',
    'ragged thunderstorm': 'Ragged Thunderstorm',
    'light snow': 'Light Snow',
    'snow': 'Snowing',
    'heavy snow': 'Heavy Snow / Blizzard',
    'sleet': 'Sleet / Ice Pellets',
    'light shower sleet': 'Light Sleet Showers',
    'shower sleet': 'Sleet Showers',
    'light rain and snow': 'Light Rain and Snow',
    'rain and snow': 'Rain and Snow',
    'light shower snow': 'Light Snow Showers',
    'shower snow': 'Snow Showers',
    'heavy shower snow': 'Heavy Blizzard Squall',
    'mist': 'Mist',
    'smoke': 'Smoke',
    'haze': 'Haze',
    'sand/dust whirls': 'Sand / Dust Whirls',
    'fog': 'Dense Fog',
    'sand': 'Sandstorm',
    'dust': 'Dust',
    'volcanic ash': 'Volcanic Ash',
    'squalls': 'Wind Squalls',
    'tornado': 'Tornado',
  },
};

function createLocaleDictionary(overrides: Partial<Translations>): Translations {
  return {
    ...EN_TRANSLATIONS,
    ...overrides,
    aqiLevels: overrides.aqiLevels || EN_TRANSLATIONS.aqiLevels,
    moonPhases: overrides.moonPhases || EN_TRANSLATIONS.moonPhases,
    descriptions: {
      ...EN_TRANSLATIONS.descriptions,
      ...(overrides.descriptions || {}),
    },
  };
}

export const DICTIONARIES: Record<Language, Translations> = {
  id: ID_TRANSLATIONS,
  en: EN_TRANSLATIONS,

  ms: createLocaleDictionary({
    ...ID_TRANSLATIONS,
    brandSubtitle: 'Perisikan Cuaca Masa Nyata',
    searchPlaceholder: "Cari bandar atau kawasan (tekan '/' untuk cari)...",
    navOverview: 'Utama',
    navOverviewShort: 'Utama',
    navRadar: 'Peta & Radar',
    navOperational: 'Penerbangan & Laut',
    navTravel: 'Kembara Pintar',
    navExplore: 'Makmal Iklim',
    autoDetectIpLabel: 'Kesan Automatik IP Negara',
    feelsLike: 'Terasa seperti',
    wind: 'Angin',
    humidity: 'Kelembapan',
    shareWeather: 'Kongsi Cuaca',
    hourlyTitle: 'Ramalan Setiap Jam',
    extendedForecastTitle: 'Ramalan Cuaca 5 Hari',
    today: 'Hari ini',
  }),

  ja: createLocaleDictionary({
    brandSubtitle: 'リアルタイム気象インテリジェンス',
    searchPlaceholder: "都市や地域を検索 ('/' キーで検索)...",
    gpsTooltip: '現在地を使用',
    refreshTooltip: '気象データを更新',
    compareButton: '都市比較',
    navOverview: 'ホーム',
    navOverviewShort: 'ホーム',
    navOverviewDesc: '現在の天気・24時間推移・5日間予報',
    navRadar: '雨雲レーダー',
    navRadarShort: 'レーダー',
    navRadarDesc: 'ライブ降水ドップラー・ナウキャスト・最適時間帯',
    navOperational: '航空・海洋・警報',
    navOperationalShort: '航空・海',
    navOperationalDesc: 'ドローン飛行安全指数・潮汐グラフ・早期警報サイレン',
    navTravel: 'スマート旅行',
    navTravelShort: '旅行',
    navTravelDesc: '持ち物チェックリスト・最適出発時間・生活指数',
    navExplore: '気候ラボ・クイズ',
    navExploreShort: 'ラボ',
    navExploreDesc: '50年気候タイムマシン・都市当てクイズ・ウィジェット作成',
    autoDetectIpLabel: 'IPから自動検出',
    popularCities: '世界の主要都市',
    savedFavorites: 'お気に入り都市',
    feelsLike: '体感温度',
    tempHigh: '最高',
    tempLow: '最低',
    wind: '風速',
    humidity: '湿度',
    shareWeather: '天気を共有',
    hourlyTitle: '時間別の天気予報',
    hourlySubtitle: '今後24時間の大気推移',
    now: '現在',
    chartTitle: '24時間 気温・降水トレンド',
    metricsTitle: '大気テレメトリ詳細',
    windAndDirection: '風速・風向',
    humidityAndDew: '湿度・露点温度',
    airQualityIndex: '空気質指数 (AQI)',
    sunCycle: '日の出・日の入り',
    sunrise: '日の出',
    sunset: '日の入り',
    visibility: '視程距離',
    airPressure: '気圧',
    astronomyTitle: '天文・月齢フェーズ',
    radarTitle: 'インタラクティブ気象レーダー (Live HD)',
    lifestyleTitle: 'ライフスタイル・安全指数',
    advisorTitle: 'スマート行動アドバイザー',
    extendedForecastTitle: '5日間天気予報',
    today: '今日',
    shareTitle: '天気カードを共有',
    downloadImage: '画像を保存 (PNG)',
    days: ['日曜日', '月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日'],
    months: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
    monthsFull: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
    descriptions: {
      'clear sky': '快晴',
      'few clouds': '晴れ（薄雲）',
      'scattered clouds': '雲が点在',
      'broken clouds': '曇り時々晴れ',
      'overcast clouds': '本曇り',
      'light rain': '小雨',
      'moderate rain': '雨',
      'heavy intensity rain': '大雨',
      'thunderstorm': '雷雨',
      'snow': '雪',
      'mist': '靄（もや）',
      'fog': '濃霧',
    },
  }),

  ko: createLocaleDictionary({
    brandSubtitle: '실시간 기상 인텔리전스',
    searchPlaceholder: "도시 또는 지역 검색 ('/' 키로 검색)...",
    gpsTooltip: '현재 위치 사용',
    refreshTooltip: '날씨 새로고침',
    compareButton: '도시 비교',
    navOverview: '홈 요약',
    navOverviewShort: '홈',
    navOverviewDesc: '현재 날씨, 24시간 그래프 및 5일 예보',
    navRadar: '레이더 지도',
    navRadarShort: '레이더',
    navRadarDesc: '실시간 강수 도플러 레이더 및 활동 최적 시간',
    navOperational: '항공·해양·경보',
    navOperationalShort: '항공·해양',
    navOperationalDesc: '드론 비행 안전 지수, 조석 그래프 및 조기 경보 사이렌',
    navTravel: '스마트 여행',
    navTravelShort: '여행',
    navTravelDesc: '맞춤형 짐 싸기 체크리스트 및 생활 지수',
    navExplore: '기후 랩·퀴즈',
    navExploreShort: '탐험',
    navExploreDesc: '50년 기후 타임머신, 미스터리 도시 퀴즈 및 위젯 스튜디오',
    autoDetectIpLabel: '방문자 IP 자동 감지',
    popularCities: '주요 글로벌 도시',
    savedFavorites: '즐겨찾는 도시',
    feelsLike: '체감 온도',
    tempHigh: '최고',
    tempLow: '최저',
    wind: '바람',
    humidity: '습도',
    shareWeather: '날씨 공유',
    hourlyTitle: '시간별 예보',
    hourlySubtitle: '향후 24시간 기상 변화',
    now: '지금',
    chartTitle: '24시간 기온 및 강수 추이',
    metricsTitle: '주요 대기 지표',
    windAndDirection: '풍속 및 풍향',
    humidityAndDew: '습도 및 이슬점',
    airQualityIndex: '대기질 지수 (AQI)',
    sunCycle: '일출 및 일몰',
    sunrise: '일출',
    sunset: '일몰',
    visibility: '가시거리',
    airPressure: '기압',
    astronomyTitle: '천문 및 달의 위상',
    radarTitle: '실시간 기상 레이더 (Live HD)',
    lifestyleTitle: '생활 및 안전 지수',
    advisorTitle: '스마트 활동 가이드',
    extendedForecastTitle: '5일 주간 예보',
    today: '오늘',
    shareTitle: '날씨 카드 공유',
    downloadImage: '이미지 다운로드 (PNG)',
    days: ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'],
    months: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
    monthsFull: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
    descriptions: {
      'clear sky': '맑음',
      'few clouds': '구름 조금',
      'scattered clouds': '구름 많음',
      'broken clouds': '대체로 흐림',
      'overcast clouds': '흐림',
      'light rain': '약한 비',
      'moderate rain': '비',
      'heavy intensity rain': '강한 비',
      'thunderstorm': '뇌우 (천둥번개)',
      'snow': '눈',
      'mist': '박무 (옅은 안개)',
      'fog': '안개',
    },
  }),

  zh: createLocaleDictionary({
    brandSubtitle: '实时气象智能监测系统',
    searchPlaceholder: "搜索城市或地区 (按 '/' 键快速搜索)...",
    gpsTooltip: '使用当前位置',
    refreshTooltip: '刷新天气数据',
    compareButton: '城市对比',
    navOverview: '气象概览',
    navOverviewShort: '概览',
    navOverviewDesc: '实时天气、24小时趋势曲线与5天预报',
    navRadar: '雷达与地图',
    navRadarShort: '雷达',
    navRadarDesc: '实时降水多普勒雷达、临近预报与最佳活动窗口',
    navOperational: '航空·海洋·警报',
    navOperationalShort: '航拍·海浪',
    navOperationalDesc: '无人机飞行安全指数、24小时潮汐图与预警警报器',
    navTravel: '智能出行',
    navTravelShort: '出行',
    navTravelDesc: '智能行李清单、最佳出发窗口与生活安全指数',
    navExplore: '气候实验室',
    navExploreShort: '探索',
    navExploreDesc: '50年气候时光机、神秘城市猜谜与免费嵌入小组件',
    autoDetectIpLabel: '根据访客IP自动检测',
    popularCities: '全球热门城市',
    savedFavorites: '收藏城市',
    feelsLike: '体感温度',
    tempHigh: '最高',
    tempLow: '最低',
    wind: '风速',
    humidity: '湿度',
    shareWeather: '分享天气',
    hourlyTitle: '逐小时预报',
    hourlySubtitle: '未来24小时大气演变',
    now: '现在',
    chartTitle: '24小时温度与降水趋势',
    metricsTitle: '大气核心指标',
    windAndDirection: '风速与风向',
    humidityAndDew: '湿度与露点',
    airQualityIndex: '空气质量指数 (AQI)',
    sunCycle: '日出与日落',
    sunrise: '日出',
    sunset: '日落',
    visibility: '能见度',
    airPressure: '大气压强',
    astronomyTitle: '天文与月相周期',
    radarTitle: '实时交互气象雷达 (Live HD)',
    lifestyleTitle: '生活与安全指数',
    advisorTitle: '智能出行建议',
    extendedForecastTitle: '未来5天天气预报',
    today: '今天',
    shareTitle: '分享天气卡片',
    downloadImage: '下载高清图片 (PNG)',
    days: ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'],
    months: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
    monthsFull: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'],
    descriptions: {
      'clear sky': '晴朗无云',
      'few clouds': '晴间少云',
      'scattered clouds': '多云间晴',
      'broken clouds': '多云',
      'overcast clouds': '阴天',
      'light rain': '小雨',
      'moderate rain': '中雨',
      'heavy intensity rain': '大雨',
      'thunderstorm': '雷暴',
      'snow': '降雪',
      'mist': '薄雾',
      'fog': '浓雾',
    },
  }),

  es: createLocaleDictionary({
    brandSubtitle: 'Inteligencia Meteorológica en Tiempo Real',
    searchPlaceholder: "Buscar ciudad o región (presiona '/' para buscar)...",
    gpsTooltip: 'Usar ubicación actual',
    refreshTooltip: 'Actualizar datos',
    compareButton: 'Comparar',
    navOverview: 'Resumen',
    navOverviewShort: 'Inicio',
    navOverviewDesc: 'Clima actual, curva de 24h y pronóstico de 5 días',
    navRadar: 'Mapa y Radar',
    navRadarShort: 'Radar',
    navRadarDesc: 'Radar Doppler de precipitación en vivo y ventanas óptimas',
    navOperational: 'Aviación y Mar',
    navOperationalShort: 'Aviación',
    navOperationalDesc: 'Seguridad de vuelo para drones, mareas y sirena de alerta',
    navTravel: 'Viaje Inteligente',
    navTravelShort: 'Viajes',
    navTravelDesc: 'Asistente de equipaje, ventana de salida e índices de vida',
    navExplore: 'Lab y Trivia',
    navExploreShort: 'Explorar',
    navExploreDesc: 'Máquina del tiempo climático de 50 años, juego y widgets',
    autoDetectIpLabel: 'Detectar idioma por IP',
    popularCities: 'Ciudades Globales',
    savedFavorites: 'Ciudades Favoritas',
    feelsLike: 'Sensación de',
    tempHigh: 'Máx',
    tempLow: 'Mín',
    wind: 'Viento',
    humidity: 'Humedad',
    shareWeather: 'Compartir Clima',
    hourlyTitle: 'Pronóstico por Hora',
    hourlySubtitle: 'Evolución atmosférica en las próximas 24 horas',
    now: 'Ahora',
    chartTitle: 'Tendencia de Temperatura 24h',
    metricsTitle: 'Aspectos Atmosféricos Destacados',
    windAndDirection: 'Viento y Dirección',
    humidityAndDew: 'Humedad y Punto de Rocío',
    airQualityIndex: 'Calidad del Aire (AQI)',
    sunCycle: 'Ciclo Solar',
    sunrise: 'Amanecer',
    sunset: 'Atardecer',
    visibility: 'Visibilidad',
    airPressure: 'Presión Atmosférica',
    astronomyTitle: 'Astronomía y Fase Lunar',
    radarTitle: 'Radar Meteorológico Interactivo (HD)',
    lifestyleTitle: 'Índices de Estilo de Vida y Seguridad',
    advisorTitle: 'Asesor Inteligente de Actividades',
    extendedForecastTitle: 'Pronóstico Extendido de 5 Días',
    today: 'Hoy',
    shareTitle: 'Compartir Tarjeta del Clima',
    downloadImage: 'Descargar Imagen (PNG)',
    days: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
    months: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
    monthsFull: [
      'Enero',
      'Febrero',
      'Marzo',
      'Abril',
      'Mayo',
      'Junio',
      'Julio',
      'Agosto',
      'Septiembre',
      'Octubre',
      'Noviembre',
      'Diciembre',
    ],
    descriptions: {
      'clear sky': 'Cielo Despejado',
      'few clouds': 'Pocas Nubes',
      'scattered clouds': 'Nubes Dispersas',
      'broken clouds': 'Parcialmente Nublado',
      'overcast clouds': 'Nublado',
      'light rain': 'Lluvia Ligera',
      'moderate rain': 'Lluvia Moderada',
      'heavy intensity rain': 'Lluvia Fuerte',
      'thunderstorm': 'Tormenta Eléctrica',
      'snow': 'Nieve',
      'mist': 'Neblina',
      'fog': 'Niebla Espesa',
    },
  }),

  fr: createLocaleDictionary({
    brandSubtitle: 'Intelligence Météorologique en Temps Réel',
    searchPlaceholder: "Rechercher une ville (appuyez sur '/' pour chercher)...",
    gpsTooltip: 'Utiliser ma position',
    refreshTooltip: 'Actualiser la météo',
    compareButton: 'Comparer',
    navOverview: 'Accueil',
    navOverviewShort: 'Accueil',
    navOverviewDesc: 'Météo actuelle, courbe 24h et prévisions sur 5 jours',
    navRadar: 'Carte & Radar',
    navRadarShort: 'Radar',
    navRadarDesc: 'Radar Doppler des précipitations en direct et créneaux optimaux',
    navOperational: 'Aviation & Mer',
    navOperationalShort: 'Aviation',
    navOperationalDesc: 'Sécurité de vol drone, marées harmoniques et sirène d’alerte',
    navTravel: 'Voyage Intelligent',
    navTravelShort: 'Voyage',
    navTravelDesc: 'Checklist bagages intelligente et indices de vie',
    navExplore: 'Labo Climat',
    navExploreShort: 'Labo',
    navExploreDesc: 'Machine à remonter le temps 50 ans, quiz et studio widget',
    autoDetectIpLabel: 'Détection auto par IP',
    popularCities: 'Villes Mondiales',
    savedFavorites: 'Villes Favorites',
    feelsLike: 'Ressenti',
    tempHigh: 'Max',
    tempLow: 'Min',
    wind: 'Vent',
    humidity: 'Humidité',
    shareWeather: 'Partager la météo',
    hourlyTitle: 'Prévisions par Heure',
    hourlySubtitle: 'Conditions atmosphériques sur les prochaines 24 heures',
    now: 'Maintenant',
    chartTitle: 'Tendance des Températures 24h',
    metricsTitle: 'Points Clés Atmosphériques',
    windAndDirection: 'Vent & Direction',
    humidityAndDew: 'Humidité & Point de Rosée',
    airQualityIndex: 'Qualité de l’Air (IQA)',
    sunCycle: 'Cycle Solaire',
    sunrise: 'Lever',
    sunset: 'Coucher',
    visibility: 'Visibilité',
    airPressure: 'Pression Atmosphérique',
    astronomyTitle: 'Astronomie & Phase Lunaire',
    radarTitle: 'Radar Météo Interactif (Live HD)',
    lifestyleTitle: 'Indices de Vie & Sécurité',
    advisorTitle: 'Conseiller d’Activités Intelligent',
    extendedForecastTitle: 'Prévisions sur 5 Jours',
    today: 'Aujourd’hui',
    shareTitle: 'Partager la Carte Météo',
    downloadImage: 'Télécharger l’image (PNG)',
    days: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
    months: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'],
    monthsFull: [
      'Janvier',
      'Février',
      'Mars',
      'Avril',
      'Mai',
      'Juin',
      'Juillet',
      'Août',
      'Septembre',
      'Octobre',
      'Novembre',
      'Décembre',
    ],
    descriptions: {
      'clear sky': 'Ciel Dégagé',
      'few clouds': 'Quelques Nuages',
      'scattered clouds': 'Nuages Épars',
      'broken clouds': 'Très Nuageux',
      'overcast clouds': 'Couvert',
      'light rain': 'Pluie Légère',
      'moderate rain': 'Pluie Modérée',
      'heavy intensity rain': 'Forte Pluie',
      'thunderstorm': 'Orage',
      'snow': 'Neige',
      'mist': 'Brume',
      'fog': 'Brouillard',
    },
  }),

  de: createLocaleDictionary({
    brandSubtitle: 'Echtzeit-Wetterintelligenz & Telemetrie',
    searchPlaceholder: "Stadt oder Region suchen ('/' zum Suchen)...",
    gpsTooltip: 'Aktuellen Standort nutzen',
    refreshTooltip: 'Wetterdaten aktualisieren',
    compareButton: 'Vergleichen',
    navOverview: 'Übersicht',
    navOverviewShort: 'Start',
    navOverviewDesc: 'Aktuelles Wetter, 24h-Kurve & 5-Tage-Prognose',
    navRadar: 'Radar & Karte',
    navRadarShort: 'Radar',
    navRadarDesc: 'Live-Doppler-Niederschlagsradar & optimale Zeitfenster',
    navOperational: 'Luftfahrt & See',
    navOperationalShort: 'Avionik',
    navOperationalDesc: 'Drohnen-Flugsicherheit, Gezeiten & Frühwarnsirene',
    navTravel: 'Smart Travel',
    navTravelShort: 'Reise',
    navTravelDesc: 'Smarte Packliste, Abreisefenster & Lifestyle-Indizes',
    navExplore: 'Klimalabor',
    navExploreShort: 'Labor',
    navExploreDesc: '50-Jahre-Klimazeitmaschine, Städte-Quiz & Widget-Studio',
    autoDetectIpLabel: 'Automatisch per IP erkennen',
    popularCities: 'Weltmetropolen',
    savedFavorites: 'Favoriten',
    feelsLike: 'Gefühlt wie',
    tempHigh: 'Max',
    tempLow: 'Min',
    wind: 'Wind',
    humidity: 'Luftfeuchte',
    shareWeather: 'Wetter teilen',
    hourlyTitle: 'Stündliche Vorhersage',
    hourlySubtitle: 'Atmosphärischer Verlauf der nächsten 24 Stunden',
    now: 'Jetzt',
    chartTitle: '24-Stunden-Temperaturtrend',
    metricsTitle: 'Atmosphärische Messwerte',
    windAndDirection: 'Wind & Richtung',
    humidityAndDew: 'Feuchte & Taupunkt',
    airQualityIndex: 'Luftqualitätsindex (AQI)',
    sunCycle: 'Sonnenzyklus',
    sunrise: 'Aufgang',
    sunset: 'Untergang',
    visibility: 'Sichtweite',
    airPressure: 'Luftdruck',
    astronomyTitle: 'Astronomie & Mondphase',
    radarTitle: 'Interaktives Wetterradar (Live HD)',
    lifestyleTitle: 'Lifestyle- & Sicherheitsindizes',
    advisorTitle: 'Smarter Aktivitätsberater',
    extendedForecastTitle: '5-Tage-Wettertrend',
    today: 'Heute',
    shareTitle: 'Wetterkarte teilen',
    downloadImage: 'Bild herunterladen (PNG)',
    days: ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'],
    months: ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'],
    monthsFull: [
      'Januar',
      'Februar',
      'März',
      'April',
      'Mai',
      'Juni',
      'Juli',
      'August',
      'September',
      'Oktober',
      'November',
      'Dezember',
    ],
    descriptions: {
      'clear sky': 'Klarer Himmel',
      'few clouds': 'Leicht bewölkt',
      'scattered clouds': 'Aufgelockert bewölkt',
      'broken clouds': 'Stark bewölkt',
      'overcast clouds': 'Bedeckt',
      'light rain': 'Leichter Regen',
      'moderate rain': 'Mäßiger Regen',
      'heavy intensity rain': 'Starkregen',
      'thunderstorm': 'Gewitter',
      'snow': 'Schneefall',
      'mist': 'Dunst',
      'fog': 'Nebel',
    },
  }),

  ar: createLocaleDictionary({
    brandSubtitle: 'ذكاء الطقس والغلاف الجوي في الوقت الفعلي',
    searchPlaceholder: "ابحث عن مدينة أو منطقة (اضغط '/' للبحث)...",
    gpsTooltip: 'استخدام الموقع الحالي',
    refreshTooltip: 'تحديث بيانات الطقس',
    compareButton: 'مقارنة المدن',
    navOverview: 'الرئيسية',
    navOverviewShort: 'الرئيسية',
    navOverviewDesc: 'الطقس الحالي، منحنى 24 ساعة وتوقعات 5 أيام',
    navRadar: 'الرادار والخريطة',
    navRadarShort: 'الرادار',
    navRadarDesc: 'رادار هطول الأمطار المباشر وأفضل أوقات النشاط',
    navOperational: 'الطيران والبحار',
    navOperationalShort: 'الطيران',
    navOperationalDesc: 'سلامة طيران الدرون، المد والجزر وصافرة الإنذار المبكر',
    navTravel: 'السفر الذكي',
    navTravelShort: 'السفر',
    navTravelDesc: 'قائمة أمتعة السفر الذكية ومؤشرات نمط الحياة',
    navExplore: 'مختبر المناخ',
    navExploreShort: 'استكشاف',
    navExploreDesc: 'آلة الزمن المناخية لـ 50 عاماً ولعبة المدينة الغامضة',
    autoDetectIpLabel: 'كشف تلقائي حسب IP الدولة',
    popularCities: 'مدن عالمية',
    savedFavorites: 'المدن المفضلة',
    feelsLike: 'الشعور الفعلي',
    tempHigh: 'العظمى',
    tempLow: 'الصغرى',
    wind: 'الرياح',
    humidity: 'الرطوبة',
    shareWeather: 'مشاركة الطقس',
    hourlyTitle: 'توقعات كل ساعة',
    hourlySubtitle: 'حالة الغلاف الجوي خلال الـ 24 ساعة القادمة',
    now: 'الآن',
    chartTitle: 'اتجاه درجات الحرارة خلال 24 ساعة',
    metricsTitle: 'أبرز مؤشرات الغلاف الجوي',
    windAndDirection: 'الرياح والاتجاه',
    humidityAndDew: 'الرطوبة ونقطة الندى',
    airQualityIndex: 'مؤشر جودة الهواء (AQI)',
    sunCycle: 'دورة الشمس',
    sunrise: 'الشروق',
    sunset: 'الغروب',
    visibility: 'مدى الرؤية',
    airPressure: 'الضغط الجوي',
    astronomyTitle: 'الفلك وأطوار القمر',
    radarTitle: 'رادار الطقس التفاعلي المباشر',
    lifestyleTitle: 'مؤشرات نمط الحياة والسلامة',
    advisorTitle: 'مستشار الأنشطة الذكي',
    extendedForecastTitle: 'توقعات الطقس لـ 5 أيام',
    today: 'اليوم',
    shareTitle: 'مشاركة بطاقة الطقس',
    downloadImage: 'تحميل الصورة (PNG)',
    days: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'],
    months: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
    monthsFull: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
    descriptions: {
      'clear sky': 'سماء صافية',
      'few clouds': 'غيوم قليلة',
      'scattered clouds': 'غيوم متفرقة',
      'broken clouds': 'غائم جزئياً',
      'overcast clouds': 'غائم كلياً',
      'light rain': 'أمطار خفيفة',
      'moderate rain': 'أمطار متوسطة',
      'heavy intensity rain': 'أمطار غزيرة',
      'thunderstorm': 'عاصفة رعدية',
      'snow': 'ثلوج',
      'mist': 'ضباب خفيف',
      'fog': 'ضباب كثيف',
    },
  }),

  pt: createLocaleDictionary({
    brandSubtitle: 'Inteligência Meteorológica em Tempo Real',
    searchPlaceholder: "Buscar cidade ou região (pressione '/' para buscar)...",
    gpsTooltip: 'Usar localização atual',
    refreshTooltip: 'Atualizar dados',
    compareButton: 'Comparar',
    navOverview: 'Visão Geral',
    navOverviewShort: 'Início',
    navOverviewDesc: 'Clima atual, curva de 24h e previsão de 5 dias',
    navRadar: 'Mapa e Radar',
    navRadarShort: 'Radar',
    navRadarDesc: 'Radar Doppler de precipitação ao vivo e janelas ideais',
    navOperational: 'Aviação e Mar',
    navOperationalShort: 'Aviação',
    navOperationalDesc: 'Segurança de voo de drones, marés e sirene de alerta',
    navTravel: 'Viagem Inteligente',
    navTravelShort: 'Viagem',
    navTravelDesc: 'Checklist inteligente de bagagem e índices de estilo de vida',
    navExplore: 'Lab Climático',
    navExploreShort: 'Explorar',
    navExploreDesc: 'Máquina do tempo de 50 anos, quiz e estúdio de widgets',
    autoDetectIpLabel: 'Detectar idioma por IP',
    popularCities: 'Cidades Globais',
    savedFavorites: 'Cidades Favoritas',
    feelsLike: 'Sensação de',
    tempHigh: 'Máx',
    tempLow: 'Mín',
    wind: 'Vento',
    humidity: 'Umidade',
    shareWeather: 'Compartilhar Clima',
    hourlyTitle: 'Previsão por Hora',
    hourlySubtitle: 'Condições atmosféricas nas próximas 24 horas',
    now: 'Agora',
    chartTitle: 'Tendência de Temperatura 24h',
    metricsTitle: 'Destaques Atmosféricos',
    windAndDirection: 'Vento e Direção',
    humidityAndDew: 'Umidade e Ponto de Orvalho',
    airQualityIndex: 'Qualidade do Ar (IQA)',
    sunCycle: 'Ciclo Solar',
    sunrise: 'Nascer do Sol',
    sunset: 'Pôr do Sol',
    visibility: 'Visibilidade',
    airPressure: 'Pressão Atmosférica',
    astronomyTitle: 'Astronomia e Fase da Lua',
    radarTitle: 'Radar Meteorológico Interativo (HD)',
    lifestyleTitle: 'Índices de Estilo de Vida e Segurança',
    advisorTitle: 'Consultor Inteligente de Atividades',
    extendedForecastTitle: 'Previsão para 5 Dias',
    today: 'Hoje',
    shareTitle: 'Compartilhar Cartão do Clima',
    downloadImage: 'Baixar Imagem (PNG)',
    days: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'],
    months: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
    monthsFull: [
      'Janeiro',
      'Fevereiro',
      'Março',
      'Abril',
      'Maio',
      'Junho',
      'Julho',
      'Agosto',
      'Setembro',
      'Outubro',
      'Novembro',
      'Dezembro',
    ],
    descriptions: {
      'clear sky': 'Céu Limpo',
      'few clouds': 'Poucas Nuvens',
      'scattered clouds': 'Nuvens Dispersas',
      'broken clouds': 'Parcialmente Nublado',
      'overcast clouds': 'Encoberto',
      'light rain': 'Chuva Fraca',
      'moderate rain': 'Chuva Moderada',
      'heavy intensity rain': 'Chuva Forte',
      'thunderstorm': 'Tempestade',
      'snow': 'Neve',
      'mist': 'Neblina',
      'fog': 'Nevoeiro',
    },
  }),

  ru: createLocaleDictionary({
    brandSubtitle: 'Метеорологическая разведка в реальном времени',
    searchPlaceholder: "Поиск города или региона (нажмите '/' для поиска)...",
    gpsTooltip: 'Моё местоположение',
    refreshTooltip: 'Обновить погоду',
    compareButton: 'Сравнить',
    navOverview: 'Обзор',
    navOverviewShort: 'Главная',
    navOverviewDesc: 'Текущая погода, график на 24ч и прогноз на 5 дней',
    navRadar: 'Радар и Карта',
    navRadarShort: 'Радар',
    navRadarDesc: 'Доплеровский радар осадков и оптимальные окна активности',
    navOperational: 'Авиация и Море',
    navOperationalShort: 'Авиация',
    navOperationalDesc: 'Индекс полётов БПЛА, график приливов и сирена оповещения',
    navTravel: 'Путешествия',
    navTravelShort: 'Поездки',
    navTravelDesc: 'Умный чек-лист багажа, окно выезда и индексы комфорта',
    navExplore: 'Климат-Лаб',
    navExploreShort: 'Лаб',
    navExploreDesc: 'Машина времени климата (50 лет), викторина и виджеты',
    autoDetectIpLabel: 'Автоопределение по IP',
    popularCities: 'Мировые столицы',
    savedFavorites: 'Избранные города',
    feelsLike: 'Ощущается как',
    tempHigh: 'Макс',
    tempLow: 'Мин',
    wind: 'Ветер',
    humidity: 'Влажность',
    shareWeather: 'Поделиться',
    hourlyTitle: 'Почасовой прогноз',
    hourlySubtitle: 'Динамика атмосферы на ближайшие 24 часа',
    now: 'Сейчас',
    chartTitle: 'Тренд температуры на 24 часа',
    metricsTitle: 'Атмосферные показатели',
    windAndDirection: 'Ветер и направление',
    humidityAndDew: 'Влажность и точка росы',
    airQualityIndex: 'Качество воздуха (AQI)',
    sunCycle: 'Солнечный цикл',
    sunrise: 'Восход',
    sunset: 'Закат',
    visibility: 'Видимость',
    airPressure: 'Давление',
    astronomyTitle: 'Астрономия и фазы Луны',
    radarTitle: 'Интерактивный метеорадар (Live HD)',
    lifestyleTitle: 'Индексы образа жизни и безопасности',
    advisorTitle: 'Умный советник активности',
    extendedForecastTitle: 'Прогноз на 5 дней',
    today: 'Сегодня',
    shareTitle: 'Поделиться карточкой погоды',
    downloadImage: 'Скачать PNG',
    days: ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'],
    months: ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'],
    monthsFull: [
      'Январь',
      'Февраль',
      'Март',
      'Апрель',
      'Май',
      'Июнь',
      'Июль',
      'Август',
      'Сентябрь',
      'Октябрь',
      'Ноябрь',
      'Декабрь',
    ],
    descriptions: {
      'clear sky': 'Ясное небо',
      'few clouds': 'Малооблачно',
      'scattered clouds': 'Переменная облачность',
      'broken clouds': 'Облачно с прояснениями',
      'overcast clouds': 'Пасмурно',
      'light rain': 'Небольшой дождь',
      'moderate rain': 'Умеренный дождь',
      'heavy intensity rain': 'Сильный ливень',
      'thunderstorm': 'Гроза',
      'snow': 'Снег',
      'mist': 'Дымка',
      'fog': 'Туман',
    },
  }),
};

export function getTranslation(lang: Language): Translations {
  return DICTIONARIES[lang] || DICTIONARIES.en;
}

export type Language = 'id' | 'en';

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

export const DICTIONARIES: Record<Language, Translations> = {
  id: {
    brandSubtitle: 'Real-Time Weather Intelligence',
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
    notificationsEnabled: 'Notifikasi cuaca berhasil diaktifkan!',
    notificationsDenied: 'Izin notifikasi ditolak oleh browser.',

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
    visibilityClear: 'Sangat Jernih',
    visibilityGood: 'Pandangan Baik',
    visibilityModerate: 'Agak Berkabut',
    visibilityPoor: 'Jarak Pandang Terbatas',
    airPressure: 'Tekanan Udara',
    pressureStable: 'Barometrik Stabil',
    pressureRising: 'Tekanan Meningkat (Cerah)',
    pressureFalling: 'Tekanan Turun (Potensi Hujan)',
    cloudCover: 'Tutupan Awan',
    precipitationChance: 'Peluang Presipitasi',

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
      'light snow': 'Salju Ringan',
      'snow': 'Salju',
      'heavy snow': 'Salju Lebat',
      'mist': 'Berkabut Tipis (Mist)',
      'smoke': 'Berasap',
      'haze': 'Kabut Udara (Haze)',
      'fog': 'Kabut Tebal (Fog)',
      'sand': 'Badai Pasir',
      'dust': 'Berdebu',
    },
  },

  en: {
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
    notificationsEnabled: 'Weather notifications enabled!',
    notificationsDenied: 'Notifications permission denied by browser.',

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
    visibilityClear: 'Crystal Clear',
    visibilityGood: 'Good Visibility',
    visibilityModerate: 'Moderate Haze',
    visibilityPoor: 'Limited Visibility',
    airPressure: 'Air Pressure',
    pressureStable: 'Barometrically Stable',
    pressureRising: 'Rising Pressure (Fair Weather)',
    pressureFalling: 'Falling Pressure (Rain Potential)',
    cloudCover: 'Cloud Cover',
    precipitationChance: 'Precipitation Probability',

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
      'light snow': 'Light Snow',
      'snow': 'Snow',
      'heavy snow': 'Heavy Snow',
      'mist': 'Mist',
      'smoke': 'Smoke',
      'haze': 'Haze',
      'fog': 'Dense Fog',
      'sand': 'Sandstorm',
      'dust': 'Dust',
    },
  },
};

export function getTranslation(lang: Language): Translations {
  return DICTIONARIES[lang] || DICTIONARIES.id;
}

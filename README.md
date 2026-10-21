# 🌤️ AetherWeather — Real-Time Weather Intelligence & Live Radar

[![Next.js](https://img.shields.io/badge/Next.js-16.4.2-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61dafb?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-7.0-3178c6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Leaflet](https://img.shields.io/badge/Leaflet-1.9.4-199900?style=for-the-badge&logo=leaflet)](https://leafletjs.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

**AetherWeather** adalah aplikasi cuaca modern dengan estetika **Glassmorphism**, pencahayaan atmosferik dinamis, animasi latar cuaca (*canvas particle system*), kurva temperatur interaktif 24 jam, dan **peta radar hujan satelit live** global tanpa batasan API key.

Dibuat dengan arsitektur ganda: **Next.js 16 App Router (React 19 + TypeScript)** untuk performa modern, serta versi mandiri **Vanilla HTML/CSS/JavaScript** di direktori `main/`.

---

## ✨ Fitur Unggulan (Key Features)

- 🎨 **Modern Glassmorphic UI & Dynamic Theming**:
  - Tema adaptif yang berubah otomatis sesuai kondisi cuaca dan waktu (Siang, Malam, Berawan, Hujan, Badai Petir, Salju, Kabut).
  - Background animasi partikel Canvas dinamis (tetesan hujan, kilatan petir, salju melayang, kerlipan bintang).

- 📱 **100% Responsif di Semua Perangkat**:
  - Dioptimalkan secara presisi untuk segala ukuran layar: Smartphone (iPhone, Galaxy Fold, Android), Tablet (Portrait & Landscape), hingga Layar Desktop Ultra-Wide.
  - Zero-overflow: Seluruh grid, kapsul per jam, dan kartu statistik menyesuaikan diri secara mulus tanpa terpotong.

- 🗺️ **Peta Radar Cuaca Interaktif (Live Doppler Radar)**:
  - Didukung oleh **Leaflet** dan **RainViewer API** (100% bebas API Key dan tanpa error kuota).
  - Overlay radar hujan satelit *real-time* dengan animasi pergerakan awan presipitasi.
  - Pilihan gaya peta: *🌙 Gelap (Dark Mode)*, *🛰️ Citra Satelit*, dan *🗺️ OpenStreetMap Jalanan*.
  - Klik lokasi mana saja di peta dunia untuk langsung memuat data cuaca titik tersebut.

- 📈 **Kurva Interaktif Suhu 24 Jam (Interactive Trend Curve)**:
  - Grafik SVG mulus dengan deteksi sentuh (*touch scrub*) dan hover kursor mouse.
  - Menampilkan titik temperatur per jam, peluang presipitasi (*POP*), dan pill info melayang interaktif.

- ⏱️ **Prakiraan Tiap Jam (Hourly Carousel)**:
  - Menampilkan prediksi cuaca 24 jam ke depan dalam bentuk kapsul horizontal geser (*touch scroll*).

- 📅 **Prakiraan 5 Hari ke Depan (5-Day Extended Forecast)**:
  - Tampilan ala Apple Weather dengan bilah rentang suhu relatif mingguan (*temperature range gradient bar*).

- 📊 **8 Kartu Sorotan Atmosfer Lengkap (Atmospheric Metrics)**:
  1. **Angin & Arah**: Dilengkapi kompas dinamis yang berputar sesuai derajat angin dan kecepatan hembusan (*gust*).
  2. **Kelembapan & Titik Embun**: Bilah progres persentase kelembapan udara.
  3. **Indeks Kualitas Udara (AQI)**: Skala 5 tingkat dengan konsentrasi polutan PM2.5, PM10, dan O₃.
  4. **Siklus Surya**: Busur animasi posisi matahari (*Sunrise & Sunset tracker*).
  5. **Jarak Pandang (Visibility)**: Jarak pandang horizontal dalam kilometer beserta status kejernihan.
  6. **Tekanan Udara (Pressure)**: Pengukuran hPa dengan status stabilitas barometrik.
  7. **Tutupan Awan (Cloud Cover)**: Persentase kepekatan awan di langit.
  8. **Peluang Hujan (Rain Chance / POP)**: Persentase probabilitas presipitasi.
  9. **Fase Bulan & Astronomi**: Visualisasi piringan bulan dinamis (New Moon s.d. Full Moon), umur bulan dalam hari, persentase iluminasi, serta pelacak waktu *Golden Hour* & *Blue Hour* untuk fotografi.

- 🌓 **Astronomi & Golden Hour Tracker**:
  - Algoritma perhitungan fase bulan astronomis (umur bulan, iluminasi, bayangan terminator dinamis SVG).
  - Jadwal *Golden Hour Pagi*, *Golden Hour Sore*, dan *Blue Hour* dengan indikator status aktif real-time.

- 📲 **Progressive Web App (PWA) & Offline Mode**:
  - Dilengkapi `manifest.json`, icon maskable, dan Service Worker (`sw.js`).
  - Dapat diinstal langsung ke Homescreen Smartphone (Android/iOS) atau Desktop layaknya aplikasi native.
  - Caching otomatis di `localStorage`: jika internet terputus atau mode pesawat aktif, aplikasi otomatis beralih ke *Mode Offline* dan menampilkan snapshot cuaca terakhir tanpa error.

- ⚖️ **Perbandingan Cuaca Multi-Kota (City Comparison Tool)**:
  - Bandingkan 2 kota berdampingan (*side-by-side*) secara instan dengan pencarian autocomplete atau preset kota global (Tokyo, Singapore, London, New York, dll.).
  - Analisis selisih temperatur (°C), selisih zona waktu, perbandingan kualitas udara (AQI), kelembapan, dan arah angin.

- 🌐 **Dukungan Multi-Bahasa (Bilingual: ID 🇮🇩 ⟷ EN 🇬🇧)**:
  - Pengalih bahasa instan di header navigasi. Seluruh antarmuka, deskripsi cuaca, kalender, advisor aktivitas, hingga modal diterjemahkan secara otomatis.

- 📸 **Bagikan Kartu Cuaca (Weather Snapshot & Social Share)**:
  - Generator grafis kartu cuaca high-res (2x Retina) berbasis HTML5 Canvas.
  - Unduh langsung sebagai gambar PNG untuk status/cerita atau bagikan langsung via Web Share API ke WhatsApp, Instagram, Telegram, dan Twitter.
  - Salin ringkasan teks cuaca ke clipboard dengan satu klik.

- 🕒 **Riwayat Pencarian Terakhir (Recent Searches)**:
  - Menyimpan otomatis kota-kota yang baru saja dicari.
  - Muncul dalam dropdown saat input pencarian difokuskan untuk navigasi cepat, lengkap dengan tombol hapus riwayat.

- 🔍 **Prakiraan Per Jam Interaktif (Interactive Hourly Breakdown)**:
  - Setiap kapsul jam dapat diklik untuk membuka modal rincian atmosfer spesifik jam tersebut (kecepatan hembusan angin, tekanan udara, kelembapan, titik embun, dan tutupan awan) dengan tombol navigasi jam berikutnya/sebelumnya.

- 🧠 **Smart Weather Advisor & Hazard Alerts**:
  - Rekomendasi busana, aktivitas luar ruangan, kondisi berkendara, dan perlindungan UV.
  - Banner peringatan dini cuaca ekstrem otomatis saat mendeteksi badai petir, polusi tinggi, atau angin kencang.

- 🔍 **Pencarian Cerdas & Favorit**:
  - Pencarian kota global dengan fitur *autocomplete* dan tombol pintas keyboard `/`.
  - Tombol GPS untuk mendeteksi cuaca di lokasi terkini pengguna secara instan.
  - Tombol Bookmark untuk menyimpan kota favorit ke `localStorage`.
  - Quick chips untuk akses cepat ke kota-kota populer (Jakarta, Surabaya, Bandung, Bali, Tokyo, dll.).
  - Toggle satuan temperatur (°C / °F) instan tanpa reload halaman.

---

## 🛠️ Tech Stack & Library

| Komponen | Teknologi |
| :--- | :--- |
| **Framework** | [Next.js 16.4 (App Router & Turbopack)](https://nextjs.org/) |
| **Library UI** | [React 19](https://react.dev/) & [TypeScript](https://www.typescriptlang.org/) |
| **Styling** | Vanilla CSS3 (Custom Glassmorphism Design System, CSS Grid, Flexbox, Clamp Typography) |
| **Ikon** | [Lucide React](https://lucide.dev/) / Lucide Icons |
| **Peta & Radar** | [Leaflet.js](https://leafletjs.com/), [OpenStreetMap](https://www.openstreetmap.org/), [RainViewer API](https://www.rainviewer.com/api.html) |
| **Data Cuaca** | [OpenWeatherMap API](https://openweathermap.org/) (Current Weather, 5-Day/3-Hour Forecast, Air Pollution) |

---

## 📁 Struktur Direktori

```text
Weather App/
├── main/                       # Versi Standalone (Zero-build Static Web)
│   ├── index.html              # Struktur HTML semantik
│   ├── style.css               # Styling Glassmorphism & Media Queries
│   └── script.js               # Logika cuaca, Canvas animasi, & manipulasi DOM
├── src/                        # Versi Next.js 16 (App Router)
│   ├── app/
│   │   ├── globals.css         # Design system & responsive tokens
│   │   ├── layout.tsx          # Root layout & Next.js Viewport metadata
│   │   └── page.tsx            # Halaman utama cuaca
│   ├── components/             # Komponen React modular
│   │   ├── AstronomyCard.tsx   # Visualisasi siklus bulan & Golden Hour
│   │   ├── CityComparisonModal.tsx # Modal komparasi cuaca 2 kota
│   │   ├── ExtremeWeatherAlert.tsx
│   │   ├── FiveDayForecast.tsx
│   │   ├── Header.tsx          # Pencarian, riwayat recent, & bilingual toggle
│   │   ├── HeroCard.tsx        # Cuaca utama, jam lokal, offline badge, share
│   │   ├── HourlyDetailModal.tsx   # Modal rincian atmosfer per jam
│   │   ├── HourlyForecast.tsx  # Kapsul cuaca 24 jam interaktif
│   │   ├── MetricCards.tsx     # 8 Highlight metrik + Kartu astronomi
│   │   ├── PwaRegister.tsx     # Registrasi Service Worker PWA
│   │   ├── QuickChips.tsx
│   │   ├── ShareWeatherModal.tsx   # Generator kartu cuaca Canvas PNG & Web Share
│   │   ├── Toast.tsx
│   │   ├── WeatherAdvisor.tsx
│   │   ├── WeatherCanvas.tsx
│   │   ├── WeatherChart.tsx
│   │   ├── WeatherIcons.tsx
│   │   └── WeatherMap.tsx      # Komponen radar peta Leaflet (Client-only SSR disabled)
│   ├── types/
│   │   └── weather.ts          # Definisi TypeScript OpenWeatherMap & state
│   └── utils/
│       ├── astronomyUtils.ts   # Kalkulator fase bulan & waktu fotografi
│       ├── i18n.ts             # Kamus terjemahan bilingual ID & EN
│       └── weatherUtils.ts     # Fetcher API, geocoding, & translasi cuaca
├── .env.example                # Panduan konfigurasi environment variables
├── .gitignore                  # File pengabaian git (node_modules, .next, dll)
├── LICENSE                     # Lisensi MIT
├── next.config.ts              # Konfigurasi Next.js
├── package.json                # Dependensi & script proyek
├── tsconfig.json               # Konfigurasi TypeScript
└── README.md                   # Dokumentasi proyek
```

---

## 🚀 Memulai (Getting Started)

### Prasyarat
- [Node.js](https://nodejs.org/) versi `18.18.0` atau yang lebih baru.
- npm, yarn, atau pnpm.

### 1. Kloning Repositori
```bash
git clone https://github.com/USERNAME/weather-app.git
cd weather-app
```

### 2. Instalasi Dependensi
```bash
npm install
```

### 3. Konfigurasi Environment Variables (Opsional)
Salin file `.env.example` menjadi `.env.local`:
```bash
cp .env.example .env.local
```
*(Catatan: Aplikasi sudah memiliki fallback API key aktif bawaan, tetapi Anda dapat memasukkan API Key pribadi dari [OpenWeatherMap](https://openweathermap.org/api) jika diinginkan)*:
```env
NEXT_PUBLIC_OPENWEATHER_API_KEY=your_openweathermap_api_key_here
```

### 4. Menjalankan Server Pengembangan (Dev Mode)
```bash
npm run dev
```
Buka browser di [http://localhost:3000](http://localhost:3000) untuk melihat aplikasi Next.js.

*(Atau jika ingin menjalankan versi standalone tanpa Node.js, Anda dapat langsung membuka file `main/index.html` menggunakan browser atau ekstensi Live Server di VS Code)*.

### 5. Membangun untuk Produksi (Production Build)
```bash
npm run build
npm run start
```

---

## 🌐 Panduan Deploy ke GitHub & Vercel

### 📤 Mengunggah ke GitHub
Jalankan perintah berikut di terminal komputer Anda:
```bash
# 1. Inisialisasi Git (jika belum)
git init

# 2. Tambahkan semua file yang belum di-ignore
git add .

# 3. Buat commit pertama
git commit -m "feat: initial commit - AetherWeather full responsive app"

# 4. Ubah branch utama menjadi main
git branch -M main

# 5. Hubungkan ke repositori GitHub Anda (ganti URL dengan repositori Anda)
git remote add origin https://github.com/USERNAME/weather-app.git

# 6. Push kode ke GitHub
git push -u origin main
```

### ⚡ Deploy Gratis ke Vercel (Rekomendasi untuk Next.js)
1. Buka [Vercel](https://vercel.com/) dan login menggunakan akun GitHub Anda.
2. Klik tombol **"Add New..."** -> **"Project"**.
3. Pilih repositori `weather-app` yang baru saja Anda push ke GitHub.
4. Pada bagian *Environment Variables*, tambahkan:
   - Key: `NEXT_PUBLIC_OPENWEATHER_API_KEY`
   - Value: API key OpenWeatherMap Anda.
5. Klik **"Deploy"**. Dalam hitungan detik aplikasi cuaca Anda akan live di internet dengan URL gratis `https://weather-app-xxx.vercel.app`!

---

## 📄 Lisensi (License)

Proyek ini dilisensikan di bawah lisensi **MIT** — silakan gunakan, pelajari, dan modifikasi secara bebas untuk kebutuhan edukasi maupun portofolio pribadi Anda. Lihat file [LICENSE](LICENSE) untuk rincian lengkap.

---

<p align="center">
  Dibuat dengan ❤️ &bull; Data cuaca real-time didukung oleh <a href="https://openweathermap.org/">OpenWeatherMap</a> & radar satelit oleh <a href="https://www.rainviewer.com/">RainViewer</a>.
</p>

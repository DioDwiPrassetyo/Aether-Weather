/**
 * AETHER WEATHER — CORE CONTROLLER
 * Architecture: ES6+ Modular State Management, Dynamic Canvas Engine, OpenWeatherMap API v2.5
 */

(() => {
    'use strict';

    // =========================================================================
    // CONFIGURATION & STATE
    // =========================================================================
    const CONFIG = {
        API_KEY: 'dcaeefb2330ad28a6d30a6c6515088ec',
        BASE_URL: 'https://api.openweathermap.org/data/2.5',
        GEO_URL: 'https://api.openweathermap.org/geo/1.0',
        DEFAULT_CITY: 'Jakarta',
        STORAGE_KEYS: {
            UNIT: 'aether_weather_unit',
            FAVORITES: 'aether_weather_favorites',
            LAST_CITY: 'aether_weather_last_city'
        }
    };

    const state = {
        unit: localStorage.getItem(CONFIG.STORAGE_KEYS.UNIT) || 'metric', // 'metric' (°C) or 'imperial' (°F)
        currentCity: null,
        currentCoords: null,
        currentWeatherData: null,
        forecastData: null,
        airPollutionData: null,
        timezoneOffset: 0,
        clockInterval: null,
        favorites: JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.FAVORITES) || '[]'),
        activeAutocompleteIndex: -1,
        debounceTimer: null
    };

    // =========================================================================
    // DOM ELEMENT REFERENCES
    // =========================================================================
    const DOM = {
        body: document.body,
        cityInput: document.getElementById('city-input'),
        clearSearchBtn: document.getElementById('clear-search-btn'),
        gpsBtn: document.getElementById('gps-btn'),
        autocompleteList: document.getElementById('autocomplete-list'),
        btnCelsius: document.getElementById('btn-celsius'),
        btnFahrenheit: document.getElementById('btn-fahrenheit'),
        favoriteBtn: document.getElementById('favorite-btn'),
        favoriteIcon: document.getElementById('favorite-icon'),
        refreshBtn: document.getElementById('refresh-btn'),
        refreshIcon: document.getElementById('refresh-icon'),
        popularChips: document.getElementById('popular-chips'),
        favoritesWrapper: document.getElementById('favorites-wrapper'),
        favoritesChips: document.getElementById('favorites-chips'),
        loadingSkeleton: document.getElementById('loading-skeleton'),
        toastContainer: document.getElementById('toast-container'),
        canvas: document.getElementById('weather-canvas'),
        
        // Hero Card
        cityName: document.getElementById('city-name'),
        countryBadge: document.getElementById('country-badge'),
        clockText: document.getElementById('clock-text'),
        dateText: document.getElementById('date-text'),
        conditionHeadline: document.getElementById('condition-headline'),
        weatherArt: document.getElementById('weather-art'),
        currentTemp: document.getElementById('current-temp'),
        displayUnit: document.getElementById('display-unit'),
        feelsLikeTemp: document.getElementById('feels-like-temp'),
        tempMax: document.getElementById('temp-max'),
        tempMin: document.getElementById('temp-min'),
        heroWind: document.getElementById('hero-wind'),
        heroHumidity: document.getElementById('hero-humidity'),
        
        // Hourly
        hourlyTrack: document.getElementById('hourly-forecast-track'),
        
        // Metric Highlights
        windSpeed: document.getElementById('wind-speed'),
        windUnit: document.getElementById('wind-unit'),
        windScaleBadge: document.getElementById('wind-scale-badge'),
        compassArrow: document.getElementById('compass-arrow'),
        windDirectionText: document.getElementById('wind-direction-text'),
        windGustText: document.getElementById('wind-gust-text'),
        
        humidityVal: document.getElementById('humidity-val'),
        humidityBadge: document.getElementById('humidity-badge'),
        humidityProgress: document.getElementById('humidity-progress'),
        dewPointText: document.getElementById('dew-point-text'),
        
        aqiBadge: document.getElementById('aqi-badge'),
        aqiScore: document.getElementById('aqi-score'),
        aqiIndicator: document.getElementById('aqi-indicator'),
        pm25Val: document.getElementById('pm25-val'),
        pm10Val: document.getElementById('pm10-val'),
        o3Val: document.getElementById('o3-val'),
        
        daylightBadge: document.getElementById('daylight-badge'),
        sunDot: document.getElementById('sun-dot'),
        sunriseTime: document.getElementById('sunrise-time'),
        sunsetTime: document.getElementById('sunset-time'),
        
        visibilityVal: document.getElementById('visibility-val'),
        visibilityUnit: document.getElementById('visibility-unit'),
        visibilityBadge: document.getElementById('visibility-badge'),
        visibilityDesc: document.getElementById('visibility-desc'),
        
        pressureVal: document.getElementById('pressure-val'),
        pressureBadge: document.getElementById('pressure-badge'),
        pressureDesc: document.getElementById('pressure-desc'),
        
        cloudVal: document.getElementById('cloud-val'),
        cloudBadge: document.getElementById('cloud-badge'),
        cloudProgress: document.getElementById('cloud-progress'),
        cloudDesc: document.getElementById('cloud-desc'),
        
        rainChanceVal: document.getElementById('rain-chance-val'),
        rainChanceBadge: document.getElementById('rain-chance-badge'),
        rainProgress: document.getElementById('rain-progress'),
        rainChanceDesc: document.getElementById('rain-chance-desc'),
        
        // 5-Day
        forecast5dayList: document.getElementById('forecast-5day-list')
    };

    // =========================================================================
    // DYNAMIC WEATHER CANVAS SYSTEM (Rain, Thunder, Snow, Sun, Stars)
    // =========================================================================
    const CanvasFX = {
        ctx: null,
        width: 0,
        height: 0,
        particles: [],
        animationId: null,
        currentType: 'clear-day',

        init() {
            if (!DOM.canvas) return;
            this.ctx = DOM.canvas.getContext('2d');
            this.resize();
            window.addEventListener('resize', () => this.resize());
            this.setEffect('clear-day');
            this.loop();
        },

        resize() {
            this.width = DOM.canvas.width = window.innerWidth;
            this.height = DOM.canvas.height = window.innerHeight;
        },

        setEffect(theme) {
            this.currentType = theme;
            this.particles = [];
            const count = this.width < 768 ? 40 : 90;

            if (theme === 'rain' || theme === 'thunderstorm') {
                for (let i = 0; i < (theme === 'thunderstorm' ? 140 : 90); i++) {
                    this.particles.push({
                        x: Math.random() * this.width,
                        y: Math.random() * this.height,
                        length: 14 + Math.random() * 16,
                        speed: 12 + Math.random() * 8,
                        opacity: 0.2 + Math.random() * 0.4
                    });
                }
            } else if (theme === 'snow') {
                for (let i = 0; i < count; i++) {
                    this.particles.push({
                        x: Math.random() * this.width,
                        y: Math.random() * this.height,
                        radius: 1.5 + Math.random() * 2.5,
                        speed: 1 + Math.random() * 1.5,
                        sway: Math.random() * 2,
                        swaySpeed: 0.02 + Math.random() * 0.02,
                        opacity: 0.3 + Math.random() * 0.6
                    });
                }
            } else if (theme === 'clear-night' || theme === 'clouds-night') {
                for (let i = 0; i < count; i++) {
                    this.particles.push({
                        x: Math.random() * this.width,
                        y: Math.random() * this.height,
                        radius: 0.8 + Math.random() * 1.8,
                        alpha: Math.random(),
                        alphaSpeed: 0.01 + Math.random() * 0.02
                    });
                }
            } else {
                // Clear Day / Clouds Day: gentle golden ambient motes
                for (let i = 0; i < 35; i++) {
                    this.particles.push({
                        x: Math.random() * this.width,
                        y: Math.random() * this.height,
                        radius: 1 + Math.random() * 2,
                        speedY: -0.2 - Math.random() * 0.4,
                        speedX: (Math.random() - 0.5) * 0.3,
                        alpha: 0.1 + Math.random() * 0.3
                    });
                }
            }
        },

        loop() {
            this.ctx.clearRect(0, 0, this.width, this.height);

            if (this.currentType === 'rain' || this.currentType === 'thunderstorm') {
                this.ctx.strokeStyle = 'rgba(186, 230, 253, 0.45)';
                this.ctx.lineWidth = 1.2;
                this.ctx.lineCap = 'round';
                this.ctx.beginPath();
                for (const p of this.particles) {
                    this.ctx.moveTo(p.x, p.y);
                    this.ctx.lineTo(p.x - 3, p.y + p.length);
                    p.y += p.speed;
                    p.x -= 1.5;
                    if (p.y > this.height) {
                        p.y = -20;
                        p.x = Math.random() * this.width;
                    }
                }
                this.ctx.stroke();

                // Occasional lightning flash for thunderstorm
                if (this.currentType === 'thunderstorm' && Math.random() < 0.007) {
                    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
                    this.ctx.fillRect(0, 0, this.width, this.height);
                }
            } else if (this.currentType === 'snow') {
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
                for (const p of this.particles) {
                    this.ctx.beginPath();
                    this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                    this.ctx.fill();
                    p.y += p.speed;
                    p.x += Math.sin(p.y * p.swaySpeed) * 0.6;
                    if (p.y > this.height) {
                        p.y = -5;
                        p.x = Math.random() * this.width;
                    }
                }
            } else if (this.currentType === 'clear-night' || this.currentType === 'clouds-night') {
                for (const p of this.particles) {
                    p.alpha += p.alphaSpeed;
                    if (p.alpha > 1 || p.alpha < 0.2) p.alphaSpeed = -p.alphaSpeed;
                    this.ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0.1, p.alpha)})`;
                    this.ctx.beginPath();
                    this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                    this.ctx.fill();
                }
            } else {
                // Clear day ambient floaters
                this.ctx.fillStyle = 'rgba(254, 240, 138, 0.25)';
                for (const p of this.particles) {
                    this.ctx.beginPath();
                    this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                    this.ctx.fill();
                    p.y += p.speedY;
                    p.x += p.speedX;
                    if (p.y < 0) {
                        p.y = this.height + 5;
                        p.x = Math.random() * this.width;
                    }
                }
            }

            this.animationId = requestAnimationFrame(() => this.loop());
        }
    };

    // =========================================================================
    // SVG ART ICONS GENERATOR (Custom Modern Vector Graphics)
    // =========================================================================
    const WeatherArt = {
        getHeroSvg(code, isNight) {
            // Sunny / Clear Day
            if (code === 800 && !isNight) {
                return `
                <svg class="weather-art-svg" viewBox="0 0 160 160">
                    <defs>
                        <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stop-color="#fef08a" />
                            <stop offset="60%" stop-color="#facc15" />
                            <stop offset="100%" stop-color="#f59e0b" />
                        </radialGradient>
                    </defs>
                    <g class="anim-spin-slow">
                        <circle cx="80" cy="80" r="42" fill="url(#sunGlow)" filter="drop-shadow(0 0 20px rgba(245, 158, 11, 0.6))" />
                        <!-- Sun Rays -->
                        <line x1="80" y1="16" x2="80" y2="28" stroke="#fef08a" stroke-width="4.5" stroke-linecap="round" />
                        <line x1="80" y1="132" x2="80" y2="144" stroke="#fef08a" stroke-width="4.5" stroke-linecap="round" />
                        <line x1="16" y1="80" x2="28" y2="80" stroke="#fef08a" stroke-width="4.5" stroke-linecap="round" />
                        <line x1="132" y1="80" x2="144" y2="80" stroke="#fef08a" stroke-width="4.5" stroke-linecap="round" />
                        <line x1="34" y1="34" x2="44" y2="44" stroke="#fef08a" stroke-width="4" stroke-linecap="round" />
                        <line x1="116" y1="116" x2="126" y2="126" stroke="#fef08a" stroke-width="4" stroke-linecap="round" />
                        <line x1="34" y1="126" x2="44" y2="116" stroke="#fef08a" stroke-width="4" stroke-linecap="round" />
                        <line x1="116" y1="44" x2="126" y2="34" stroke="#fef08a" stroke-width="4" stroke-linecap="round" />
                    </g>
                </svg>`;
            }

            // Clear Night (Moon & Stars)
            if (code === 800 && isNight) {
                return `
                <svg class="weather-art-svg anim-float" viewBox="0 0 160 160">
                    <path d="M98 42 A 46 46 0 1 0 118 116 A 52 52 0 0 1 98 42 Z" fill="#e0e7ff" filter="drop-shadow(0 0 24px rgba(165, 180, 252, 0.5))" />
                    <circle cx="126" cy="54" r="3" fill="#fef08a" />
                    <circle cx="48" cy="46" r="2.5" fill="#ffffff" />
                    <circle cx="132" cy="100" r="2" fill="#ffffff" />
                </svg>`;
            }

            // Few Clouds (Sun + Cloud or Moon + Cloud)
            if (code === 801 || code === 802) {
                return `
                <svg class="weather-art-svg" viewBox="0 0 160 160">
                    <circle cx="${isNight ? '62' : '65'}" cy="58" r="30" fill="${isNight ? '#e0e7ff' : '#fbbf24'}" filter="drop-shadow(0 0 16px ${isNight ? 'rgba(165,180,252,0.5)' : 'rgba(251,191,36,0.6)'})" />
                    <g class="anim-float">
                        <path d="M 52 115 A 24 24 0 0 1 88 94 A 32 32 0 0 1 136 102 A 22 22 0 0 1 132 125 L 50 125 A 14 14 0 0 1 52 115 Z" fill="#f8fafc" filter="drop-shadow(0 8px 18px rgba(0,0,0,0.25))" />
                    </g>
                </svg>`;
            }

            // Broken / Overcast Clouds
            if (code >= 803) {
                return `
                <svg class="weather-art-svg anim-float" viewBox="0 0 160 160">
                    <!-- Back Cloud -->
                    <path d="M 45 80 A 22 22 0 0 1 80 62 A 28 28 0 0 1 122 72 A 20 20 0 0 1 120 95 L 44 95 Z" fill="#94a3b8" opacity="0.75" />
                    <!-- Front Cloud -->
                    <path d="M 38 114 A 26 26 0 0 1 78 92 A 34 34 0 0 1 132 100 A 24 24 0 0 1 128 126 L 36 126 A 16 16 0 0 1 38 114 Z" fill="#f1f5f9" filter="drop-shadow(0 10px 22px rgba(0,0,0,0.3))" />
                </svg>`;
            }

            // Thunderstorm
            if (code >= 200 && code < 300) {
                return `
                <svg class="weather-art-svg" viewBox="0 0 160 160">
                    <g class="anim-float">
                        <path d="M 36 94 A 28 28 0 0 1 80 70 A 36 36 0 0 1 134 80 A 26 26 0 0 1 130 108 L 34 108 A 18 18 0 0 1 36 94 Z" fill="#475569" filter="drop-shadow(0 8px 20px rgba(0,0,0,0.4))" />
                    </g>
                    <!-- Lightning Bolt -->
                    <polygon points="82,98 68,122 84,122 72,148 98,118 84,118" fill="#facc15" filter="drop-shadow(0 0 14px rgba(250, 204, 21, 0.8))" />
                </svg>`;
            }

            // Rain & Drizzle
            if ((code >= 300 && code < 600)) {
                return `
                <svg class="weather-art-svg" viewBox="0 0 160 160">
                    <g class="anim-float">
                        <path d="M 36 86 A 28 28 0 0 1 80 62 A 36 36 0 0 1 134 72 A 26 26 0 0 1 130 100 L 34 100 A 18 18 0 0 1 36 86 Z" fill="#e2e8f0" filter="drop-shadow(0 8px 20px rgba(0,0,0,0.25))" />
                    </g>
                    <!-- Raindrops -->
                    <line x1="56" y1="112" x2="48" y2="132" stroke="#38bdf8" stroke-width="3" stroke-linecap="round" />
                    <line x1="78" y1="110" x2="70" y2="134" stroke="#38bdf8" stroke-width="3.5" stroke-linecap="round" />
                    <line x1="102" y1="112" x2="94" y2="132" stroke="#38bdf8" stroke-width="3" stroke-linecap="round" />
                </svg>`;
            }

            // Snow
            if (code >= 600 && code < 700) {
                return `
                <svg class="weather-art-svg anim-float" viewBox="0 0 160 160">
                    <path d="M 36 86 A 28 28 0 0 1 80 62 A 36 36 0 0 1 134 72 A 26 26 0 0 1 130 100 L 34 100 A 18 18 0 0 1 36 86 Z" fill="#f8fafc" />
                    <circle cx="56" cy="120" r="3.5" fill="#bae6fd" />
                    <circle cx="82" cy="130" r="4" fill="#ffffff" />
                    <circle cx="106" cy="118" r="3.5" fill="#bae6fd" />
                </svg>`;
            }

            // Atmosphere (Mist, Fog, Smoke, Haze)
            return `
            <svg class="weather-art-svg anim-float" viewBox="0 0 160 160">
                <line x1="36" y1="65" x2="124" y2="65" stroke="#cbd5e1" stroke-width="6" stroke-linecap="round" opacity="0.8" />
                <line x1="48" y1="85" x2="136" y2="85" stroke="#e2e8f0" stroke-width="6" stroke-linecap="round" opacity="0.9" />
                <line x1="28" y1="105" x2="118" y2="105" stroke="#cbd5e1" stroke-width="6" stroke-linecap="round" opacity="0.8" />
            </svg>`;
        },

        getMiniIcon(code, isNight = false) {
            if (code === 800) {
                return isNight ? '<i data-lucide="moon"></i>' : '<i data-lucide="sun"></i>';
            }
            if (code === 801 || code === 802) {
                return isNight ? '<i data-lucide="cloud-moon"></i>' : '<i data-lucide="cloud-sun"></i>';
            }
            if (code >= 803) return '<i data-lucide="cloud"></i>';
            if (code >= 200 && code < 300) return '<i data-lucide="cloud-lightning"></i>';
            if (code >= 300 && code < 600) return '<i data-lucide="cloud-rain"></i>';
            if (code >= 600 && code < 700) return '<i data-lucide="snowflake"></i>';
            return '<i data-lucide="cloud-fog"></i>';
        }
    };

    // =========================================================================
    // WEATHER TRANSLATION & HELPERS (Indonesian / English Polish)
    // =========================================================================
    const I18N = {
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
            'dust': 'Berdebu'
        },

        translate(desc) {
            if (!desc) return '--';
            const lower = desc.toLowerCase().trim();
            return this.descriptions[lower] || desc;
        },

        days: ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'],
        months: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
    };

    // =========================================================================
    // API SERVICE
    // =========================================================================
    const ApiService = {
        async fetchByCity(city) {
            const url = `${CONFIG.BASE_URL}/weather?q=${encodeURIComponent(city)}&appid=${CONFIG.API_KEY}&units=${state.unit}`;
            const res = await fetch(url);
            if (!res.ok) {
                if (res.status === 404) throw new Error(`Kota "${city}" tidak ditemukan. Coba periksa ejaan nama kota.`);
                throw new Error(`Gagal memuat cuaca: ${res.statusText}`);
            }
            return res.json();
        },

        async fetchByCoords(lat, lon) {
            const url = `${CONFIG.BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${CONFIG.API_KEY}&units=${state.unit}`;
            const res = await fetch(url);
            if (!res.ok) throw new Error(`Gagal memuat cuaca koordinat: ${res.statusText}`);
            return res.json();
        },

        async fetchForecast(lat, lon) {
            const url = `${CONFIG.BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${CONFIG.API_KEY}&units=${state.unit}`;
            const res = await fetch(url);
            if (!res.ok) throw new Error(`Gagal memuat data prakiraan.`);
            return res.json();
        },

        async fetchAirPollution(lat, lon) {
            const url = `${CONFIG.BASE_URL}/air_pollution?lat=${lat}&lon=${lon}&appid=${CONFIG.API_KEY}`;
            try {
                const res = await fetch(url);
                if (res.ok) return await res.json();
            } catch (err) {
                console.warn('Air pollution API warning:', err);
            }
            return null;
        },

        async searchDirectGeo(query) {
            if (!query || query.length < 2) return [];
            const url = `${CONFIG.GEO_URL}/direct?q=${encodeURIComponent(query)}&limit=5&appid=${CONFIG.API_KEY}`;
            const res = await fetch(url);
            if (!res.ok) return [];
            return res.json();
        }
    };

    // =========================================================================
    // UI TOAST SYSTEM
    // =========================================================================
    function showToast(message, type = 'info', duration = 3800) {
        if (!DOM.toastContainer) return;
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        let iconName = 'info';
        if (type === 'error') iconName = 'alert-circle';
        if (type === 'success') iconName = 'check-circle';

        toast.innerHTML = `<i data-lucide="${iconName}"></i> <span>${message}</span>`;
        DOM.toastContainer.appendChild(toast);
        lucide.createIcons({ root: toast });

        setTimeout(() => {
            toast.classList.add('hiding');
            setTimeout(() => toast.remove(), 350);
        }, duration);
    }

    // =========================================================================
    // THEME & ATMOSPHERE UPDATER
    // =========================================================================
    function updateTheme(weatherCode, isNight) {
        let theme = 'clear-day';

        if (weatherCode >= 200 && weatherCode < 300) {
            theme = 'thunderstorm';
        } else if (weatherCode >= 300 && weatherCode < 600) {
            theme = 'rain';
        } else if (weatherCode >= 600 && weatherCode < 700) {
            theme = 'snow';
        } else if (weatherCode >= 700 && weatherCode < 800) {
            theme = 'mist';
        } else if (weatherCode === 800) {
            theme = isNight ? 'clear-night' : 'clear-day';
        } else if (weatherCode > 800) {
            theme = isNight ? 'clouds-night' : 'clouds-day';
        }

        DOM.body.setAttribute('data-theme', theme);
        CanvasFX.setEffect(theme);
    }

    // =========================================================================
    // LOCAL TIME CLOCK TICKER
    // =========================================================================
    function startLocalClock(timezoneSeconds) {
        if (state.clockInterval) clearInterval(state.clockInterval);
        state.timezoneOffset = timezoneSeconds;

        const updateTime = () => {
            // Target city time: current UTC timestamp + timezone offset
            const nowUtc = Date.now() + (new Date().getTimezoneOffset() * 60000);
            const cityTime = new Date(nowUtc + (timezoneSeconds * 1000));

            const hours = String(cityTime.getHours()).padStart(2, '0');
            const minutes = String(cityTime.getMinutes()).padStart(2, '0');
            const seconds = String(cityTime.getSeconds()).padStart(2, '0');

            DOM.clockText.textContent = `${hours}:${minutes}:${seconds}`;

            const dayName = I18N.days[cityTime.getDay()];
            const dateNum = cityTime.getDate();
            const monthName = I18N.months[cityTime.getMonth()];
            const yearNum = cityTime.getFullYear();

            DOM.dateText.textContent = `${dayName}, ${dateNum} ${monthName} ${yearNum}`;
        };

        updateTime();
        state.clockInterval = setInterval(updateTime, 1000);
    }

    // =========================================================================
    // WEATHER RENDER ENGINE
    // =========================================================================
    function renderWeather(current, forecast, airPollution) {
        state.currentWeatherData = current;
        state.forecastData = forecast;
        state.airPollutionData = airPollution;
        state.currentCity = current.name;
        state.currentCoords = { lat: current.coord.lat, lon: current.coord.lon };

        // Save last visited city
        localStorage.setItem(CONFIG.STORAGE_KEYS.LAST_CITY, current.name);

        const weather = current.weather[0];
        const isNight = weather.icon.endsWith('n');
        const unitSymbol = state.unit === 'metric' ? '°C' : '°F';
        const speedUnit = state.unit === 'metric' ? 'km/j' : 'mph';

        // 1. Dynamic Theme & Background
        updateTheme(weather.id, isNight);

        // 2. Local Time Clock
        startLocalClock(current.timezone);

        // 3. Hero Card Details
        DOM.cityName.textContent = current.name;
        DOM.countryBadge.textContent = current.sys.country || '--';
        DOM.conditionHeadline.textContent = I18N.translate(weather.description);
        DOM.weatherArt.innerHTML = WeatherArt.getHeroSvg(weather.id, isNight);

        const currentTempRound = Math.round(current.main.temp);
        const feelsLikeRound = Math.round(current.main.feels_like);
        DOM.currentTemp.textContent = currentTempRound;
        DOM.displayUnit.textContent = unitSymbol;
        DOM.feelsLikeTemp.textContent = `${feelsLikeRound}°`;

        DOM.tempMax.textContent = `${Math.round(current.main.temp_max)}°`;
        DOM.tempMin.textContent = `${Math.round(current.main.temp_min)}°`;

        const speedDisplay = state.unit === 'metric' 
            ? Math.round(current.wind.speed * 3.6) // m/s to km/h
            : Math.round(current.wind.speed);
        DOM.heroWind.textContent = `${speedDisplay} ${speedUnit}`;
        DOM.heroHumidity.textContent = `${current.main.humidity}%`;

        // 4. Metric Highlights: Wind & Compass
        DOM.windSpeed.textContent = speedDisplay;
        DOM.windUnit.textContent = speedUnit;
        DOM.windDirectionText.textContent = `Arah: ${getCardinalDirection(current.wind.deg)} (${current.wind.deg || 0}°)`;
        
        if (current.wind.gust) {
            const gustDisplay = state.unit === 'metric' ? Math.round(current.wind.gust * 3.6) : Math.round(current.wind.gust);
            DOM.windGustText.textContent = `Hembusan: ${gustDisplay} ${speedUnit}`;
        } else {
            DOM.windGustText.textContent = `Hembusan stabil`;
        }

        // Rotate Compass needle
        if (DOM.compassArrow) {
            DOM.compassArrow.style.transform = `rotate(${current.wind.deg || 0}deg)`;
        }
        DOM.windScaleBadge.textContent = getBeaufortScale(current.wind.speed);

        // 5. Metric Highlights: Humidity & Dew Point
        DOM.humidityVal.textContent = current.main.humidity;
        DOM.humidityProgress.style.width = `${current.main.humidity}%`;
        const dewPoint = Math.round(current.main.temp - ((100 - current.main.humidity) / 5));
        DOM.dewPointText.textContent = `Titik Embun: ${dewPoint}${unitSymbol}`;
        
        if (current.main.humidity < 40) DOM.humidityBadge.textContent = 'Kering';
        else if (current.main.humidity <= 65) DOM.humidityBadge.textContent = 'Nyaman';
        else DOM.humidityBadge.textContent = 'Lembap';

        // 6. Metric Highlights: Air Quality Index (AQI)
        renderAirQuality(airPollution);

        // 7. Metric Highlights: Sun Cycle (Sunrise & Sunset)
        renderSunCycle(current.sys.sunrise, current.sys.sunset, current.timezone);

        // 8. Metric Highlights: Visibility
        const visKm = (current.visibility / 1000).toFixed(1);
        const visDisplay = state.unit === 'metric' ? visKm : (current.visibility * 0.000621371).toFixed(1);
        DOM.visibilityVal.textContent = visDisplay;
        DOM.visibilityUnit.textContent = state.unit === 'metric' ? 'km' : 'mi';
        if (current.visibility >= 9000) {
            DOM.visibilityBadge.textContent = 'Sempurna';
            DOM.visibilityDesc.textContent = 'Jarak pandang sangat jernih tanpa halangan.';
        } else if (current.visibility >= 5000) {
            DOM.visibilityBadge.textContent = 'Baik';
            DOM.visibilityDesc.textContent = 'Jarak pandang memadai untuk aktivitas luar.';
        } else {
            DOM.visibilityBadge.textContent = 'Terbatas';
            DOM.visibilityDesc.textContent = 'Waspada kabut atau partikel udara tebal.';
        }

        // 9. Metric Highlights: Atmospheric Pressure
        DOM.pressureVal.textContent = current.main.pressure;
        if (current.main.pressure > 1013) {
            DOM.pressureBadge.textContent = 'Tinggi';
            DOM.pressureDesc.textContent = 'Tekanan tinggi, cuaca cenderung cerah.';
        } else if (current.main.pressure >= 1005) {
            DOM.pressureBadge.textContent = 'Normal';
            DOM.pressureDesc.textContent = 'Tekanan stabil pada standar laut.';
        } else {
            DOM.pressureBadge.textContent = 'Rendah';
            DOM.pressureDesc.textContent = 'Tekanan rendah, potensi awan mendung/hujan.';
        }

        // 10. Metric Highlights: Cloud Cover
        DOM.cloudVal.textContent = current.clouds.all;
        DOM.cloudProgress.style.width = `${current.clouds.all}%`;
        if (current.clouds.all <= 20) DOM.cloudBadge.textContent = 'Cerah';
        else if (current.clouds.all <= 60) DOM.cloudBadge.textContent = 'Sebagian';
        else DOM.cloudBadge.textContent = 'Rapat';

        // 11. Metric Highlights: Rain Chance (PoP from forecast)
        if (forecast && forecast.list && forecast.list.length > 0) {
            const nextPoP = Math.round((forecast.list[0].pop || 0) * 100);
            DOM.rainChanceVal.textContent = nextPoP;
            DOM.rainProgress.style.width = `${nextPoP}%`;
            if (nextPoP >= 60) {
                DOM.rainChanceBadge.textContent = 'Tinggi';
                DOM.rainChanceDesc.textContent = 'Kemungkinan besar akan turun presipitasi.';
            } else if (nextPoP >= 30) {
                DOM.rainChanceBadge.textContent = 'Sedang';
                DOM.rainChanceDesc.textContent = 'Potensi hujan ringan atau gerimis sesaat.';
            } else {
                DOM.rainChanceBadge.textContent = 'Rendah';
                DOM.rainChanceDesc.textContent = 'Peluang presipitasi sangat minim.';
            }
        }

        // 12. Render Hourly Forecast Track
        if (forecast && forecast.list) {
            renderHourlyForecast(forecast.list, current.timezone);
            render5DayForecast(forecast.list);
        }

        // 13. Update Favorite Bookmark Button State
        updateFavoriteButtonState();

        // Re-initialize Lucide Icons across all dynamically injected DOM
        lucide.createIcons();
    }

    // =========================================================================
    // AIR QUALITY RENDERER
    // =========================================================================
    function renderAirQuality(data) {
        if (!data || !data.list || !data.list.length) {
            DOM.aqiBadge.textContent = 'N/A';
            DOM.aqiScore.textContent = '-';
            DOM.pm25Val.textContent = '--';
            DOM.pm10Val.textContent = '--';
            DOM.o3Val.textContent = '--';
            return;
        }

        const aqi = data.list[0].main.aqi; // 1 to 5
        const comps = data.list[0].components;

        DOM.aqiScore.textContent = aqi;
        DOM.pm25Val.textContent = `${comps.pm2_5.toFixed(1)} µg/m³`;
        DOM.pm10Val.textContent = `${comps.pm10.toFixed(1)} µg/m³`;
        DOM.o3Val.textContent = `${comps.o3.toFixed(1)} µg/m³`;

        const aqiConfig = {
            1: { label: 'Sangat Baik', class: 'aqi-good' },
            2: { label: 'Baik / Fair', class: 'aqi-fair' },
            3: { label: 'Sedang', class: 'aqi-moderate' },
            4: { label: 'Buruk', class: 'aqi-poor' },
            5: { label: 'Sangat Buruk', class: 'aqi-very-poor' }
        };

        const currentAqi = aqiConfig[aqi] || { label: 'Moderat', class: 'aqi-moderate' };
        DOM.aqiBadge.textContent = currentAqi.label;
        DOM.aqiBadge.className = `aqi-badge-status ${currentAqi.class}`;
    }

    // =========================================================================
    // SUN CYCLE & SOLAR ARC SIMULATOR
    // =========================================================================
    function renderSunCycle(sunriseTimestamp, sunsetTimestamp, timezoneOffset) {
        const formatTime = (ts) => {
            const date = new Date((ts + timezoneOffset) * 1000);
            const h = String(date.getUTCHours()).padStart(2, '0');
            const m = String(date.getUTCMinutes()).padStart(2, '0');
            return `${h}:${m}`;
        };

        DOM.sunriseTime.textContent = formatTime(sunriseTimestamp);
        DOM.sunsetTime.textContent = formatTime(sunsetTimestamp);

        // Calculate current progress along arc
        const currentUtc = Math.floor(Date.now() / 1000);
        const iconStr = data.weather[0]?.icon || '';
        const isNight = iconStr.endsWith('n');
        const isDaytime = isNight ? false : iconStr.endsWith('d') ? true : (currentUtc >= sunriseTimestamp && currentUtc < sunsetTimestamp);

        const totalDaySec = Math.max(1, sunsetTimestamp - sunriseTimestamp);
        const elapsedDaySec = currentUtc - sunriseTimestamp;
        const progress = isDaytime ? Math.max(0, Math.min(1, elapsedDaySec / totalDaySec)) : (currentUtc >= sunsetTimestamp ? 1 : 0);

        DOM.daylightBadge.textContent = isDaytime ? 'Siang Hari' : 'Malam Hari';

        // Calculate SVG circle position on Arc: Center at (80, 75), radius 70, angle from Math.PI to 0
        const angle = Math.PI - (progress * Math.PI);
        const dotX = 80 + 70 * Math.cos(angle);
        const dotY = 75 - 70 * Math.sin(angle);

        if (DOM.sunDot) {
            DOM.sunDot.setAttribute('cx', dotX.toFixed(1));
            DOM.sunDot.setAttribute('cy', dotY.toFixed(1));
            DOM.sunDot.style.opacity = isDaytime ? '1' : '0.35';
        }
    }

    // =========================================================================
    // HOURLY FORECAST CAROUSEL RENDERER
    // =========================================================================
    function renderHourlyForecast(forecastList, timezoneOffset) {
        DOM.hourlyTrack.innerHTML = '';
        const nextSlots = forecastList.slice(0, 10); // Next 24-30 hours

        nextSlots.forEach((item, index) => {
            // Local hour of slot
            const date = new Date((item.dt + timezoneOffset) * 1000);
            const hour = date.getUTCHours();
            const timeLabel = index === 0 ? 'Sekarang' : `${String(hour).padStart(2, '0')}:00`;
            const temp = Math.round(item.main.temp);
            const weather = item.weather[0];
            const isNight = weather.icon.endsWith('n');
            const pop = Math.round((item.pop || 0) * 100);

            const capsule = document.createElement('div');
            capsule.className = `hourly-capsule ${index === 0 ? 'active-now' : ''}`;
            capsule.innerHTML = `
                <span class="hourly-time">${timeLabel}</span>
                <div class="hourly-icon-wrap">
                    ${WeatherArt.getMiniIcon(weather.id, isNight)}
                </div>
                ${pop > 10 ? `<span class="hourly-pop"><i data-lucide="droplet" style="width:10px;height:10px;"></i>${pop}%</span>` : '<span style="height:14px;"></span>'}
                <span class="hourly-temp">${temp}°</span>
            `;

            DOM.hourlyTrack.appendChild(capsule);
        });
    }

    // =========================================================================
    // 5-DAY FORECAST WITH APPLE WEATHER STYLE RANGE BAR
    // =========================================================================
    function render5DayForecast(forecastList) {
        DOM.forecast5dayList.innerHTML = '';

        // Group forecast items by calendar date
        const dailyGroups = {};
        forecastList.forEach(item => {
            const dateStr = item.dt_txt.split(' ')[0];
            if (!dailyGroups[dateStr]) dailyGroups[dateStr] = [];
            dailyGroups[dateStr].push(item);
        });

        const dayKeys = Object.keys(dailyGroups).slice(0, 5);

        // Find absolute min and max of the entire 5 days for relative progress bar
        let weekMin = Infinity;
        let weekMax = -Infinity;

        const processedDays = dayKeys.map((dateStr, idx) => {
            const items = dailyGroups[dateStr];
            let min = Infinity;
            let max = -Infinity;
            let maxPop = 0;
            const weatherCount = {};

            items.forEach(it => {
                if (it.main.temp_min < min) min = it.main.temp_min;
                if (it.main.temp_max > max) max = it.main.temp_max;
                if (it.pop > maxPop) maxPop = it.pop;
                const id = it.weather[0].id;
                weatherCount[id] = (weatherCount[id] || 0) + 1;
            });

            // Dominant weather id
            let dominantId = 800;
            let maxCount = 0;
            for (const [wId, cnt] of Object.entries(weatherCount)) {
                if (cnt > maxCount) {
                    maxCount = cnt;
                    dominantId = Number(wId);
                }
            }

            const representativeItem = items.find(it => it.weather[0].id === dominantId) || items[0];

            min = Math.round(min);
            max = Math.round(max);
            if (min < weekMin) weekMin = min;
            if (max > weekMax) weekMax = max;

            const dateObj = new Date(dateStr + 'T00:00:00');
            const dayLabel = idx === 0 ? 'Hari Ini' : idx === 1 ? 'Besok' : I18N.days[dateObj.getDay()];
            const dateFormatted = `${dateObj.getDate()} ${I18N.months[dateObj.getMonth()]}`;

            return {
                dayLabel,
                dateFormatted,
                min,
                max,
                pop: Math.round(maxPop * 100),
                weather: representativeItem.weather[0]
            };
        });

        const tempRangeSpan = Math.max(1, weekMax - weekMin);

        processedDays.forEach(day => {
            const leftPercent = Math.max(0, ((day.min - weekMin) / tempRangeSpan) * 100);
            const widthPercent = Math.max(8, ((day.max - day.min) / tempRangeSpan) * 100);

            const row = document.createElement('div');
            row.className = 'forecast-row';
            row.innerHTML = `
                <div class="row-col-day">
                    <span class="row-day-name">${day.dayLabel}</span>
                    <span class="row-date">${day.dateFormatted}</span>
                </div>
                <div class="row-icon-wrap">
                    ${WeatherArt.getMiniIcon(day.weather.id, false)}
                </div>
                <div class="row-desc">
                    ${I18N.translate(day.weather.description)}
                    ${day.pop > 15 ? `<span class="row-pop-badge"><i data-lucide="droplet" style="width:11px;height:11px;"></i>${day.pop}%</span>` : ''}
                </div>
                <div class="row-temp-bar-container">
                    <span class="temp-min-label">${day.min}°</span>
                    <div class="temp-bar-track">
                        <div class="temp-bar-fill" style="left: ${leftPercent}%; width: ${widthPercent}%;"></div>
                    </div>
                    <span class="temp-max-label">${day.max}°</span>
                </div>
            `;
            DOM.forecast5dayList.appendChild(row);
        });
    }

    // =========================================================================
    // AUTOCOMPLETE & SEARCH CONTROLLER
    // =========================================================================
    async function handleSearchInput(e) {
        const val = e.target.value.trim();
        DOM.clearSearchBtn.style.display = val ? 'flex' : 'none';

        if (state.debounceTimer) clearTimeout(state.debounceTimer);

        if (val.length < 2) {
            closeAutocomplete();
            return;
        }

        state.debounceTimer = setTimeout(async () => {
            try {
                const results = await ApiService.searchDirectGeo(val);
                renderAutocomplete(results);
            } catch (err) {
                console.error('Autocomplete error:', err);
            }
        }, 320);
    }

    function renderAutocomplete(cities) {
        if (!cities || !cities.length) {
            closeAutocomplete();
            return;
        }

        DOM.autocompleteList.innerHTML = '';
        state.activeAutocompleteIndex = -1;

        cities.forEach((city, index) => {
            const item = document.createElement('div');
            item.className = 'autocomplete-item';
            item.dataset.index = index;
            item.dataset.city = city.name;
            item.dataset.lat = city.lat;
            item.dataset.lon = city.lon;

            item.innerHTML = `
                <div class="item-left">
                    <i data-lucide="map-pin"></i>
                    <div>
                        <span class="item-city">${city.name}</span>
                        ${city.state ? `<span class="item-state">${city.state}</span>` : ''}
                    </div>
                </div>
                <span class="item-country">${city.country}</span>
            `;

            item.addEventListener('click', () => {
                fetchAndDisplayWeather({ lat: city.lat, lon: city.lon });
                DOM.cityInput.value = city.name;
                closeAutocomplete();
            });

            DOM.autocompleteList.appendChild(item);
        });

        DOM.autocompleteList.style.display = 'flex';
        lucide.createIcons({ root: DOM.autocompleteList });
    }

    function closeAutocomplete() {
        DOM.autocompleteList.style.display = 'none';
        DOM.autocompleteList.innerHTML = '';
        state.activeAutocompleteIndex = -1;
    }

    function handleSearchKeydown(e) {
        const items = DOM.autocompleteList.querySelectorAll('.autocomplete-item');

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (items.length > 0) {
                state.activeAutocompleteIndex = (state.activeAutocompleteIndex + 1) % items.length;
                updateAutocompleteSelection(items);
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (items.length > 0) {
                state.activeAutocompleteIndex = (state.activeAutocompleteIndex - 1 + items.length) % items.length;
                updateAutocompleteSelection(items);
            }
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (state.activeAutocompleteIndex >= 0 && items[state.activeAutocompleteIndex]) {
                items[state.activeAutocompleteIndex].click();
            } else if (DOM.cityInput.value.trim()) {
                fetchAndDisplayWeather({ city: DOM.cityInput.value.trim() });
                closeAutocomplete();
            }
        } else if (e.key === 'Escape') {
            closeAutocomplete();
        }
    }

    function updateAutocompleteSelection(items) {
        items.forEach((it, idx) => {
            if (idx === state.activeAutocompleteIndex) {
                it.classList.add('selected');
                it.scrollIntoView({ block: 'nearest' });
            } else {
                it.classList.remove('selected');
            }
        });
    }

    // =========================================================================
    // MAIN FETCH & ORCHESTRATION PIPELINE
    // =========================================================================
    async function fetchAndDisplayWeather(queryTarget) {
        setLoading(true);

        try {
            let current;
            if (queryTarget.city) {
                current = await ApiService.fetchByCity(queryTarget.city);
            } else if (queryTarget.lat !== undefined && queryTarget.lon !== undefined) {
                current = await ApiService.fetchByCoords(queryTarget.lat, queryTarget.lon);
            } else {
                throw new Error('Target pencarian tidak valid.');
            }

            const [forecast, airPollution] = await Promise.all([
                ApiService.fetchForecast(current.coord.lat, current.coord.lon),
                ApiService.fetchAirPollution(current.coord.lat, current.coord.lon)
            ]);

            renderWeather(current, forecast, airPollution);
            showToast(`Cuaca untuk ${current.name} berhasil diperbarui.`, 'success', 2800);
        } catch (error) {
            console.error('Fetch Weather Error:', error);
            showToast(error.message || 'Gagal memuat data cuaca.', 'error');
        } finally {
            setLoading(false);
        }
    }

    function setLoading(isLoading) {
        if (!DOM.loadingSkeleton) return;
        DOM.loadingSkeleton.style.display = isLoading ? 'flex' : 'none';
        if (DOM.refreshIcon) {
            if (isLoading) DOM.refreshIcon.classList.add('spinning');
            else DOM.refreshIcon.classList.remove('spinning');
        }
    }

    // =========================================================================
    // GEOLOCATION (GPS)
    // =========================================================================
    function getUserLocation() {
        if (!navigator.geolocation) {
            showToast('Browser Anda tidak mendukung deteksi lokasi GPS.', 'error');
            return;
        }

        showToast('Mendeteksi posisi Anda saat ini...', 'info', 2000);
        setLoading(true);

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                fetchAndDisplayWeather({
                    lat: pos.coords.latitude,
                    lon: pos.coords.longitude
                });
            },
            (err) => {
                setLoading(false);
                let msg = 'Gagal mengakses izin lokasi GPS.';
                if (err.code === err.PERMISSION_DENIED) msg = 'Izin lokasi GPS ditolak oleh pengguna.';
                showToast(msg, 'error');
            },
            { timeout: 10000, enableHighAccuracy: true }
        );
    }

    // =========================================================================
    // FAVORITES SYSTEM
    // =========================================================================
    function toggleFavorite() {
        if (!state.currentCity) return;

        const index = state.favorites.findIndex(f => f.city.toLowerCase() === state.currentCity.toLowerCase());
        if (index >= 0) {
            state.favorites.splice(index, 1);
            showToast(`${state.currentCity} dihapus dari daftar favorit.`, 'info');
        } else {
            state.favorites.push({
                city: state.currentCity,
                country: state.currentWeatherData ? state.currentWeatherData.sys.country : ''
            });
            showToast(`${state.currentCity} disimpan ke daftar favorit!`, 'success');
        }

        localStorage.setItem(CONFIG.STORAGE_KEYS.FAVORITES, JSON.stringify(state.favorites));
        updateFavoriteButtonState();
        renderFavoritesChips();
    }

    function updateFavoriteButtonState() {
        if (!state.currentCity || !DOM.favoriteBtn) return;
        const isFav = state.favorites.some(f => f.city.toLowerCase() === state.currentCity.toLowerCase());
        if (isFav) {
            DOM.favoriteBtn.classList.add('active');
            DOM.favoriteBtn.title = 'Hapus dari Favorit';
            if (DOM.favoriteIcon) DOM.favoriteIcon.setAttribute('data-lucide', 'bookmark-check');
        } else {
            DOM.favoriteBtn.classList.remove('active');
            DOM.favoriteBtn.title = 'Simpan ke Favorit';
            if (DOM.favoriteIcon) DOM.favoriteIcon.setAttribute('data-lucide', 'bookmark');
        }
        lucide.createIcons({ root: DOM.favoriteBtn });
    }

    function renderFavoritesChips() {
        if (!DOM.favoritesWrapper || !DOM.favoritesChips) return;

        if (!state.favorites.length) {
            DOM.favoritesWrapper.style.display = 'none';
            return;
        }

        DOM.favoritesWrapper.style.display = 'flex';
        DOM.favoritesChips.innerHTML = '';

        state.favorites.forEach(fav => {
            const chip = document.createElement('button');
            chip.className = `chip ${state.currentCity && state.currentCity.toLowerCase() === fav.city.toLowerCase() ? 'active' : ''}`;
            chip.innerHTML = `
                <span>${fav.city}</span>
                <span class="chip-remove-btn" title="Hapus"><i data-lucide="x" style="width:12px;height:12px;"></i></span>
            `;

            chip.querySelector('span:first-child').addEventListener('click', () => {
                fetchAndDisplayWeather({ city: fav.city });
            });

            chip.querySelector('.chip-remove-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                state.favorites = state.favorites.filter(f => f.city.toLowerCase() !== fav.city.toLowerCase());
                localStorage.setItem(CONFIG.STORAGE_KEYS.FAVORITES, JSON.stringify(state.favorites));
                updateFavoriteButtonState();
                renderFavoritesChips();
            });

            DOM.favoritesChips.appendChild(chip);
        });

        lucide.createIcons({ root: DOM.favoritesChips });
    }

    // =========================================================================
    // TEMPERATURE UNIT TOGGLE (°C / °F)
    // =========================================================================
    function setUnit(newUnit) {
        if (state.unit === newUnit) return;
        state.unit = newUnit;
        localStorage.setItem(CONFIG.STORAGE_KEYS.UNIT, newUnit);

        DOM.btnCelsius.classList.toggle('active', newUnit === 'metric');
        DOM.btnFahrenheit.classList.toggle('active', newUnit === 'imperial');

        if (state.currentCity) {
            if (state.currentCoords) {
                fetchAndDisplayWeather(state.currentCoords);
            } else {
                fetchAndDisplayWeather({ city: state.currentCity });
            }
        }
    }

    // =========================================================================
    // UTILITY CALCULATIONS
    // =========================================================================
    function getCardinalDirection(angle) {
        if (angle === undefined || angle === null) return 'U';
        const directions = ['U', 'TL', 'T', 'TG', 'S', 'BD', 'B', 'BL'];
        const index = Math.round(((angle %= 360) < 0 ? angle + 360 : angle) / 45) % 8;
        return directions[index];
    }

    function getBeaufortScale(mps) {
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

    // =========================================================================
    // EVENT LISTENERS INITIALIZATION
    // =========================================================================
    function setupEventListeners() {
        // Search Input & Autocomplete
        DOM.cityInput.addEventListener('input', handleSearchInput);
        DOM.cityInput.addEventListener('keydown', handleSearchKeydown);

        DOM.clearSearchBtn.addEventListener('click', () => {
            DOM.cityInput.value = '';
            DOM.clearSearchBtn.style.display = 'none';
            closeAutocomplete();
            DOM.cityInput.focus();
        });

        // Click outside closes autocomplete
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-container')) {
                closeAutocomplete();
            }
        });

        // Global hotkey '/' to search
        document.addEventListener('keydown', (e) => {
            if (e.key === '/' && document.activeElement !== DOM.cityInput) {
                e.preventDefault();
                DOM.cityInput.focus();
                DOM.cityInput.select();
            }
        });

        // GPS Button
        DOM.gpsBtn.addEventListener('click', getUserLocation);

        // Unit Switchers
        DOM.btnCelsius.addEventListener('click', () => setUnit('metric'));
        DOM.btnFahrenheit.addEventListener('click', () => setUnit('imperial'));

        // Favorite Button
        DOM.favoriteBtn.addEventListener('click', toggleFavorite);

        // Refresh Button
        DOM.refreshBtn.addEventListener('click', () => {
            if (state.currentCoords) {
                fetchAndDisplayWeather(state.currentCoords);
            } else if (state.currentCity) {
                fetchAndDisplayWeather({ city: state.currentCity });
            }
        });

        // Popular City Chips
        if (DOM.popularChips) {
            DOM.popularChips.querySelectorAll('.chip').forEach(chip => {
                chip.addEventListener('click', () => {
                    const cityName = chip.dataset.city;
                    DOM.cityInput.value = cityName;
                    DOM.clearSearchBtn.style.display = 'flex';
                    fetchAndDisplayWeather({ city: cityName });
                });
            });
        }
    }

    // =========================================================================
    // APPLICATION ENTRY POINT
    // =========================================================================
    function init() {
        lucide.createIcons();
        CanvasFX.init();
        setupEventListeners();

        // Sync initial unit toggle state
        DOM.btnCelsius.classList.toggle('active', state.unit === 'metric');
        DOM.btnFahrenheit.classList.toggle('active', state.unit === 'imperial');

        renderFavoritesChips();

        // Load last visited city, or default to Jakarta
        const initialCity = localStorage.getItem(CONFIG.STORAGE_KEYS.LAST_CITY) || CONFIG.DEFAULT_CITY;
        DOM.cityInput.value = initialCity;
        DOM.clearSearchBtn.style.display = 'flex';
        fetchAndDisplayWeather({ city: initialCity });
    }

    // Start on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
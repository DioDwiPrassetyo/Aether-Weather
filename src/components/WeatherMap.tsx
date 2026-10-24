'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  MapPin,
  CloudRain,
  Cloud,
  Thermometer,
  Wind,
  RotateCw,
  Radio,
  Play,
  Pause,
  Maximize2,
  Minimize2,
  Clock,
} from 'lucide-react';
import { API_KEY as DEFAULT_API_KEY } from '@/utils/weatherUtils';
import { Language, getTranslation } from '@/utils/i18n';
import 'leaflet/dist/leaflet.css';

interface WeatherMapProps {
  lat: number;
  lon: number;
  cityName: string;
  currentTemp: number;
  unitSymbol: string;
  onLocationSelect: (lat: number, lon: number) => void;
  lang?: Language;
}

type WeatherLayerType = 'rainviewer' | 'clouds' | 'temp' | 'wind';
type BaseMapStyle = 'dark' | 'osm' | 'satellite';

interface RadarFrame {
  time: number;
  path: string;
}

export const WeatherMap: React.FC<WeatherMapProps> = ({
  lat,
  lon,
  cityName,
  currentTemp,
  unitSymbol,
  onLocationSelect,
  lang = 'id',
}) => {
  const t = getTranslation(lang);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const baseLayerRef = useRef<any>(null);
  const weatherLayerRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const leafletModuleRef = useRef<any>(null);

  const [activeWeatherLayer, setActiveWeatherLayer] = useState<WeatherLayerType>('rainviewer');
  const [baseMapStyle, setBaseMapStyle] = useState<BaseMapStyle>('dark');
  const [rainViewerTileUrl, setRainViewerTileUrl] = useState<string>('');
  const [radarTimestamp, setRadarTimestamp] = useState<string>('');
  const [isLoadingRadar, setIsLoadingRadar] = useState<boolean>(false);

  // Radar Animation Loop & Fullscreen State
  const [radarFrames, setRadarFrames] = useState<RadarFrame[]>([]);
  const [radarHost, setRadarHost] = useState<string>('https://tilecache.rainviewer.com');
  const [currentFrameIndex, setCurrentFrameIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Fetch RainViewer radar metadata (100% Free, No API Key needed)
  const fetchRainViewerRadar = async () => {
    setIsLoadingRadar(true);
    try {
      const res = await fetch('https://api.rainviewer.com/public/weather-maps.json');
      const data = await res.json();
      const host = data.host || 'https://tilecache.rainviewer.com';
      setRadarHost(host);

      const past = data?.radar?.past || [];
      if (past.length > 0) {
        setRadarFrames(past);
        const latestIdx = past.length - 1;
        setCurrentFrameIndex(latestIdx);
        const latest = past[latestIdx];
        const url = `${host}${latest.path}/256/{z}/{x}/{y}/2/1_1.png`;
        setRainViewerTileUrl(url);

        const d = new Date(latest.time * 1000);
        setRadarTimestamp(
          `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
        );
      }
    } catch (err) {
      console.warn('RainViewer fetch error:', err);
    } finally {
      setIsLoadingRadar(false);
    }
  };

  useEffect(() => {
    fetchRainViewerRadar();
  }, []);

  // Radar Animation Playback
  useEffect(() => {
    if (!isPlaying || radarFrames.length === 0 || activeWeatherLayer !== 'rainviewer') return;

    const interval = setInterval(() => {
      setCurrentFrameIndex((prev) => {
        const next = (prev + 1) % radarFrames.length;
        const frame = radarFrames[next];
        const url = `${radarHost}${frame.path}/256/{z}/{x}/{y}/2/1_1.png`;
        setRainViewerTileUrl(url);

        const d = new Date(frame.time * 1000);
        setRadarTimestamp(
          `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
        );
        return next;
      });
    }, 750);

    return () => clearInterval(interval);
  }, [isPlaying, radarFrames, radarHost, activeWeatherLayer]);

  // Handle manual frame change from slider
  const handleFrameChange = (idx: number) => {
    if (!radarFrames[idx]) return;
    setCurrentFrameIndex(idx);
    const frame = radarFrames[idx];
    const url = `${radarHost}${frame.path}/256/{z}/{x}/{y}/2/1_1.png`;
    setRainViewerTileUrl(url);
    const d = new Date(frame.time * 1000);
    setRadarTimestamp(
      `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
    );
  };

  // Toggle Fullscreen Mode
  const toggleFullscreen = () => {
    setIsFullscreen((prev) => {
      const next = !prev;
      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.invalidateSize();
          if (next) {
            mapRef.current.scrollWheelZoom?.enable();
          } else {
            mapRef.current.scrollWheelZoom?.disable();
          }
        }
      }, 200);
      return next;
    });
  };

  // 1. Initialize Map Instance Once on Mount
  useEffect(() => {
    let isMounted = true;

    import('leaflet').then((L) => {
      if (!isMounted || !mapContainerRef.current) return;
      leafletModuleRef.current = L;

      // Prevent duplicate initialization
      if (mapRef.current) return;

      if ((mapContainerRef.current as any)._leaflet_id) {
        (mapContainerRef.current as any)._leaflet_id = null;
      }

      const map = L.map(mapContainerRef.current, {
        center: [lat, lon],
        zoom: 8,
        minZoom: 3,
        maxZoom: 18,
        zoomControl: false,
        scrollWheelZoom: false,
      });

      L.control.zoom({ position: 'topright' }).addTo(map);

      map.on('click', (e: any) => {
        onLocationSelect(e.latlng.lat, e.latlng.lng);
      });

      mapRef.current = map;

      const initialUrl =
        baseMapStyle === 'satellite'
          ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
          : 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png';
      const initialAttr =
        baseMapStyle === 'satellite' ? '&copy; Esri, Maxar' : '&copy; OpenStreetMap contributors';

      const base = L.tileLayer(initialUrl, {
        attribution: initialAttr,
        maxZoom: 18,
        zIndex: 1,
        className: 'base-map-tiles',
      }).addTo(map);
      baseLayerRef.current = base;

      // Custom Location Pin Marker
      const customIcon = L.divIcon({
        className: 'custom-map-marker',
        html: `
          <div class="map-marker-pin">
            <div class="marker-pulse"></div>
            <div class="marker-dot"></div>
            <div class="marker-pill">${cityName} ${currentTemp}${unitSymbol}</div>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      const marker = L.marker([lat, lon], { icon: customIcon }).addTo(map);
      markerRef.current = marker;

      // Fix container dimensions
      setTimeout(() => {
        if (mapRef.current && (mapRef.current as any)._panes) {
          mapRef.current.invalidateSize();
        }
      }, 200);
    });

    return () => {
      isMounted = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // 2. Update Map Position & Marker When Lat / Lon Changes
  useEffect(() => {
    const map = mapRef.current;
    const L = leafletModuleRef.current;
    if (!map || !(map as any)._panes || !L) return;

    map.flyTo([lat, lon], map.getZoom(), { duration: 0.8 });

    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lon]);
      const customIcon = L.divIcon({
        className: 'custom-map-marker',
        html: `
          <div class="map-marker-pin">
            <div class="marker-pulse"></div>
            <div class="marker-dot"></div>
            <div class="marker-pill">${cityName} ${currentTemp}${unitSymbol}</div>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });
      markerRef.current.setIcon(customIcon);
    }
  }, [lat, lon, cityName, currentTemp, unitSymbol]);

  // 3. Update Base Map Style
  useEffect(() => {
    const map = mapRef.current;
    const L = leafletModuleRef.current;
    if (!map || !(map as any)._panes || !L) return;

    if (baseLayerRef.current) {
      map.removeLayer(baseLayerRef.current);
      baseLayerRef.current = null;
    }

    const url =
      baseMapStyle === 'satellite'
        ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
        : 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png';
    const attribution =
      baseMapStyle === 'satellite' ? '&copy; Esri, Maxar' : '&copy; OpenStreetMap contributors';

    const base = L.tileLayer(url, {
      attribution,
      maxZoom: 18,
      zIndex: 1,
      className: 'base-map-tiles',
    }).addTo(map);
    baseLayerRef.current = base;
  }, [baseMapStyle]);

  // 4. Update Weather Overlay Layer
  useEffect(() => {
    const map = mapRef.current;
    const L = leafletModuleRef.current;
    if (!map || !(map as any)._panes || !L) return;

    if (weatherLayerRef.current) {
      map.removeLayer(weatherLayerRef.current);
      weatherLayerRef.current = null;
    }

    let url = '';
    let opacity = 0.85;

    if (activeWeatherLayer === 'rainviewer' && rainViewerTileUrl) {
      url = rainViewerTileUrl;
      opacity = 0.85;
    } else if (activeWeatherLayer === 'clouds') {
      url = `https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=${DEFAULT_API_KEY}`;
      opacity = 0.65;
    } else if (activeWeatherLayer === 'temp') {
      url = `https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=${DEFAULT_API_KEY}`;
      opacity = 0.65;
    } else if (activeWeatherLayer === 'wind') {
      url = `https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid=${DEFAULT_API_KEY}`;
      opacity = 0.65;
    }

    if (url) {
      const overlay = L.tileLayer(url, {
        opacity,
        maxZoom: 18,
        maxNativeZoom: activeWeatherLayer === 'rainviewer' ? 7 : 18,
        zIndex: 10,
      }).addTo(map);
      weatherLayerRef.current = overlay;
    }
  }, [activeWeatherLayer, rainViewerTileUrl]);

  return (
    <div className={`glass-card weather-map-card ${isFullscreen ? 'map-fullscreen-mode' : ''}`}>
      <div className="card-header">
        <div className="card-title">
          <MapPin size={20} color="#38bdf8" />
          <div>
            <h3>{t.radarTitle}</h3>
            <span className="badge-sub">{t.radarSubtitle}</span>
          </div>
        </div>

        {/* Controls: Weather Layers & Base Map Style & Fullscreen */}
        <div className="map-layer-switcher">
          <button
            className={`map-layer-btn ${activeWeatherLayer === 'rainviewer' ? 'active' : ''}`}
            onClick={() => setActiveWeatherLayer('rainviewer')}
            title="Radar Hujan Satelit Real-Time"
          >
            <CloudRain size={14} /> Radar Hujan
          </button>
          <button
            className={`map-layer-btn ${activeWeatherLayer === 'clouds' ? 'active' : ''}`}
            onClick={() => setActiveWeatherLayer('clouds')}
            title="Radar Tutupan Awan"
          >
            <Cloud size={14} /> {lang === 'id' ? 'Awan' : 'Clouds'}
          </button>
          <button
            className={`map-layer-btn ${activeWeatherLayer === 'temp' ? 'active' : ''}`}
            onClick={() => setActiveWeatherLayer('temp')}
            title="Heatmap Suhu Permukaan"
          >
            <Thermometer size={14} /> {lang === 'id' ? 'Suhu' : 'Temp'}
          </button>
          <button
            className={`map-layer-btn ${activeWeatherLayer === 'wind' ? 'active' : ''}`}
            onClick={() => setActiveWeatherLayer('wind')}
            title="Peta Kecepatan Angin"
          >
            <Wind size={14} /> {lang === 'id' ? 'Angin' : 'Wind'}
          </button>

          {/* Base Map Style Group */}
          <div className="map-style-group">
            <button
              className={`map-layer-btn ${baseMapStyle === 'dark' ? 'active' : ''}`}
              onClick={() => setBaseMapStyle('dark')}
              title="Gaya Peta Gelap Modern"
            >
              🌙 {lang === 'id' ? 'Gelap' : 'Dark'}
            </button>
            <button
              className={`map-layer-btn ${baseMapStyle === 'satellite' ? 'active' : ''}`}
              onClick={() => setBaseMapStyle('satellite')}
              title="Gaya Peta Satelit Asli"
            >
              🛰️ Satelit
            </button>
            <button
              className={`map-layer-btn ${baseMapStyle === 'osm' ? 'active' : ''}`}
              onClick={() => setBaseMapStyle('osm')}
              title="Gaya Peta Jalanan Berwarna"
            >
              🗺️ {lang === 'id' ? 'Jalan' : 'Street'}
            </button>
          </div>

          {/* Live Indicator */}
          <div className="map-status-pill" title="Koneksi Satelit Radar Aktif">
            <Radio size={12} color="#4ade80" className="radar-live-pulse" />
            <span>Live {radarTimestamp && `(${radarTimestamp})`}</span>
          </div>

          {/* Fullscreen Toggle */}
          <button
            className="map-layer-btn fullscreen-btn"
            onClick={toggleFullscreen}
            title={isFullscreen ? t.radarExitFullscreen : t.radarFullscreen}
          >
            {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>

          {/* Refresh Button */}
          <button
            className="map-layer-btn"
            onClick={fetchRainViewerRadar}
            title="Segarkan Radar Peta"
          >
            <RotateCw size={14} className={isLoadingRadar ? 'spinning' : ''} />
          </button>
        </div>
      </div>

      {/* Radar Timeline Player Bar (Active when RainViewer layer is selected) */}
      {activeWeatherLayer === 'rainviewer' && radarFrames.length > 0 && (
        <div className="radar-playback-bar">
          <button
            className={`radar-play-btn ${isPlaying ? 'playing' : ''}`}
            onClick={() => setIsPlaying(!isPlaying)}
            title={isPlaying ? t.radarPause : t.radarPlay}
          >
            {isPlaying ? <Pause size={14} /> : <Play size={14} />}
            <span>{isPlaying ? t.radarPause : t.radarPlay}</span>
          </button>

          <div className="radar-slider-container">
            <span className="timeline-label">
              <Clock size={12} /> {radarTimestamp}
            </span>
            <input
              type="range"
              min="0"
              max={radarFrames.length - 1}
              value={currentFrameIndex}
              onChange={(e) => handleFrameChange(Number(e.target.value))}
              className="radar-timeline-slider"
              title={t.radarTimeline}
            />
            <span className="timeline-counter">
              {currentFrameIndex + 1}/{radarFrames.length}
            </span>
          </div>
        </div>
      )}

      {/* Map Container Wrap with Dark Styling */}
      <div className="map-container-wrap">
        <div
          ref={mapContainerRef}
          className={`leaflet-map-element ${
            baseMapStyle === 'dark' ? 'map-theme-dark' : ''
          }`}
        />

        {/* Radar Color Scale Legend */}
        <div className="map-radar-legend">
          <span className="legend-title">{lang === 'id' ? 'Intensitas Radar:' : 'Radar Intensity:'}</span>
          <div className="legend-scale">
            <span className="legend-color-step" style={{ background: '#00e400' }}></span>
            <span className="legend-label">{lang === 'id' ? 'Gerimis' : 'Light'}</span>
            <span className="legend-color-step" style={{ background: '#ffff00' }}></span>
            <span className="legend-label">{lang === 'id' ? 'Sedang' : 'Moderate'}</span>
            <span className="legend-color-step" style={{ background: '#ff7e00' }}></span>
            <span className="legend-label">{lang === 'id' ? 'Lebat' : 'Heavy'}</span>
            <span className="legend-color-step" style={{ background: '#ff0000' }}></span>
            <span className="legend-label">{lang === 'id' ? 'Deras' : 'Intense'}</span>
            <span className="legend-color-step" style={{ background: '#99004c' }}></span>
            <span className="legend-label">{lang === 'id' ? 'Badai' : 'Severe'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

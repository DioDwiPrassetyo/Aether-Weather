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
  LocateFixed,
  SkipBack,
  SkipForward,
  Layers,
  Moon,
  Globe,
  Map as MapIcon,
  Sliders,
  Compass,
} from 'lucide-react';
import { MAP_API_KEY } from '@/utils/weatherUtils';
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
  isNowcast?: boolean;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return entities[character];
  });
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
  const [radarError, setRadarError] = useState<string>('');

  // Radar Animation Loop, Speed, Opacity & Fullscreen State
  const [radarFrames, setRadarFrames] = useState<RadarFrame[]>([]);
  const [latestPastIndex, setLatestPastIndex] = useState<number>(0);
  const [radarHost, setRadarHost] = useState<string>('https://tilecache.rainviewer.com');
  const [currentFrameIndex, setCurrentFrameIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<1 | 2>(1);
  const [layerOpacity, setLayerOpacity] = useState<number>(0.85);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Format relative offset (e.g., "LIVE", "-30m", "+20m")
  const getRelativeFrameLabel = (frame?: RadarFrame, idx?: number) => {
    if (!frame) return 'LIVE';
    if (idx === latestPastIndex) return lang === 'id' ? 'SEKARANG' : 'LIVE';
    const refTime = radarFrames[latestPastIndex]?.time || Math.floor(Date.now() / 1000);
    const diffMin = Math.round((frame.time - refTime) / 60);
    if (diffMin === 0) return lang === 'id' ? 'SEKARANG' : 'LIVE';
    return diffMin > 0 ? `+${diffMin}m` : `${diffMin}m`;
  };

  // Fetch RainViewer radar metadata (Past 2h + Nowcast +30m)
  const fetchRainViewerRadar = async () => {
    setIsLoadingRadar(true);
    setRadarError('');
    try {
      const res = await fetch('https://api.rainviewer.com/public/weather-maps.json');
      if (!res.ok) throw new Error(`Radar metadata request failed (${res.status}).`);
      const data = await res.json();
      const host = data.host || 'https://tilecache.rainviewer.com';
      setRadarHost(host);

      const past: RadarFrame[] = (data?.radar?.past || []).map((f: RadarFrame) => ({
        ...f,
        isNowcast: false,
      }));
      const nowcast: RadarFrame[] = (data?.radar?.nowcast || []).map((f: RadarFrame) => ({
        ...f,
        isNowcast: true,
      }));
      const combined = [...past, ...nowcast];

      if (combined.length > 0) {
        setRadarFrames(combined);
        const liveIdx = past.length > 0 ? past.length - 1 : combined.length - 1;
        setLatestPastIndex(liveIdx);
        setCurrentFrameIndex(liveIdx);

        const latest = combined[liveIdx];
        const url = `${host}${latest.path}/256/{z}/{x}/{y}/2/1_1.png`;
        setRainViewerTileUrl(url);

        const d = new Date(latest.time * 1000);
        setRadarTimestamp(
          `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
        );
      } else {
        setRadarError(
          lang === 'id' ? 'Data radar belum tersedia.' : 'Radar data is not available.'
        );
      }
    } catch (err) {
      console.warn('RainViewer fetch error:', err);
      setRadarError(
        lang === 'id' ? 'Radar gagal diperbarui.' : 'Could not refresh radar data.'
      );
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

    const intervalMs = playbackSpeed === 2 ? 420 : 780;
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
    }, intervalMs);

    return () => clearInterval(interval);
  }, [isPlaying, radarFrames, radarHost, activeWeatherLayer, playbackSpeed]);

  // Handle manual frame change from slider or step buttons
  const handleFrameChange = (idx: number) => {
    if (radarFrames.length === 0) return;
    const boundedIdx = (idx + radarFrames.length) % radarFrames.length;
    const frame = radarFrames[boundedIdx];
    if (!frame) return;
    setCurrentFrameIndex(boundedIdx);
    const url = `${radarHost}${frame.path}/256/{z}/{x}/{y}/2/1_1.png`;
    setRainViewerTileUrl(url);
    const d = new Date(frame.time * 1000);
    setRadarTimestamp(
      `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
    );
  };

  // Recenter map to active city
  const handleRecenter = () => {
    if (mapRef.current) {
      mapRef.current.flyTo([lat, lon], 8, { duration: 0.75 });
    }
  };

  // Cycle overlay opacity (65% -> 85% -> 100%)
  const handleCycleOpacity = () => {
    setLayerOpacity((prev) => {
      const next = prev === 0.85 ? 1 : prev === 1 ? 0.6 : 0.85;
      if (weatherLayerRef.current && typeof weatherLayerRef.current.setOpacity === 'function') {
        weatherLayerRef.current.setOpacity(next);
      }
      return next;
    });
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
          : baseMapStyle === 'dark'
            ? 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png'
            : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      const initialAttr =
        baseMapStyle === 'satellite'
          ? '&copy; Esri, Maxar'
          : baseMapStyle === 'dark'
            ? '&copy; OpenStreetMap contributors, HOT style'
            : '&copy; OpenStreetMap contributors';

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
            <div class="marker-pill">${escapeHtml(cityName)} ${currentTemp}${unitSymbol}</div>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      const marker = L.marker([lat, lon], { icon: customIcon }).addTo(map);
      markerRef.current = marker;

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
            <div class="marker-pill">${escapeHtml(cityName)} ${currentTemp}${unitSymbol}</div>
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
        : baseMapStyle === 'dark'
          ? 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png'
          : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    const attribution =
      baseMapStyle === 'satellite'
        ? '&copy; Esri, Maxar'
        : baseMapStyle === 'dark'
          ? '&copy; OpenStreetMap contributors, HOT style'
          : '&copy; OpenStreetMap contributors';

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
    if (activeWeatherLayer === 'rainviewer' && rainViewerTileUrl) {
      url = rainViewerTileUrl;
    } else if (activeWeatherLayer === 'clouds' && MAP_API_KEY) {
      url = `https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=${MAP_API_KEY}`;
    } else if (activeWeatherLayer === 'temp' && MAP_API_KEY) {
      url = `https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=${MAP_API_KEY}`;
    } else if (activeWeatherLayer === 'wind' && MAP_API_KEY) {
      url = `https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid=${MAP_API_KEY}`;
    }

    if (url) {
      const overlay = L.tileLayer(url, {
        opacity: layerOpacity,
        maxZoom: 18,
        maxNativeZoom: activeWeatherLayer === 'rainviewer' ? 7 : 18,
        zIndex: 10,
      }).addTo(map);
      weatherLayerRef.current = overlay;
    }
  }, [activeWeatherLayer, rainViewerTileUrl, layerOpacity]);

  const currentFrame = radarFrames[currentFrameIndex];
  const isNowcastFrame = Boolean(currentFrame?.isNowcast);
  const relativeLabel = getRelativeFrameLabel(currentFrame, currentFrameIndex);
  const coordsFormatted = `${Math.abs(lat).toFixed(2)}°${lat >= 0 ? 'N' : 'S'}, ${Math.abs(
    lon
  ).toFixed(2)}°${lon >= 0 ? 'E' : 'W'}`;

  return (
    <div className={`glass-card weather-map-card ${isFullscreen ? 'map-fullscreen-mode' : ''}`}>
      {/* 1. Top Console Header: Title + Status Badge + Utility Actions */}
      <div className="card-header radar-console-header">
        <div className="card-title">
          <div className="radar-header-icon-box">
            <Radio size={20} color="#38bdf8" className="radar-live-pulse" />
          </div>
          <div>
            <div className="radar-title-row">
              <h3>{t.radarTitle}</h3>
              <span
                className={`radar-live-badge ${isNowcastFrame ? 'badge-nowcast' : 'badge-live'}`}
              >
                <span className="live-dot" />
                <span>
                  {isNowcastFrame
                    ? lang === 'id'
                      ? `NOWCAST (${relativeLabel})`
                      : `NOWCAST (${relativeLabel})`
                    : lang === 'id'
                      ? `DOPPLER LIVE ${radarTimestamp ? `• ${radarTimestamp}` : ''}`
                      : `LIVE DOPPLER ${radarTimestamp ? `• ${radarTimestamp}` : ''}`}
                </span>
              </span>
            </div>
            <span className="badge-sub">{t.radarSubtitle}</span>
          </div>
        </div>

        {/* Right Quick Utility Actions */}
        <div className="radar-utility-actions">
          <button
            type="button"
            className="radar-util-btn"
            onClick={handleRecenter}
            title={lang === 'id' ? `Pusatkan ke ${cityName}` : `Recenter on ${cityName}`}
          >
            <LocateFixed size={14} />
            <span className="util-btn-label">{lang === 'id' ? 'Pusatkan' : 'Recenter'}</span>
          </button>

          <button
            type="button"
            className="radar-util-btn"
            onClick={handleCycleOpacity}
            title={lang === 'id' ? 'Ubah opasitas layer radar' : 'Cycle radar layer opacity'}
          >
            <Sliders size={14} />
            <span className="util-btn-label">{Math.round(layerOpacity * 100)}%</span>
          </button>

          <button
            type="button"
            className="radar-util-btn"
            onClick={fetchRainViewerRadar}
            title={lang === 'id' ? 'Segarkan data radar' : 'Refresh radar data'}
            disabled={isLoadingRadar}
          >
            <RotateCw size={14} className={isLoadingRadar ? 'spinning' : ''} />
          </button>

          <button
            type="button"
            className="radar-util-btn fullscreen-toggle"
            onClick={toggleFullscreen}
            title={isFullscreen ? t.radarExitFullscreen : t.radarFullscreen}
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            <span className="util-btn-label">
              {isFullscreen
                ? lang === 'id'
                  ? 'Kecilkan'
                  : 'Exit'
                : lang === 'id'
                  ? 'Layar Penuh'
                  : 'Fullscreen'}
            </span>
          </button>
        </div>
      </div>

      {/* 2. Organized Dual Control Deck: Weather Layers (Left) & Base Map Style (Right) */}
      <div className="radar-control-deck">
        {/* Weather Layer Selector */}
        <div className="radar-deck-group">
          <span className="deck-group-label">
            <Layers size={12} />
            <span>{lang === 'id' ? 'Layer Atmosfer' : 'Weather Layer'}</span>
          </span>
          <div className="map-layer-switcher">
            <button
              type="button"
              className={`map-layer-btn ${activeWeatherLayer === 'rainviewer' ? 'active' : ''}`}
              onClick={() => setActiveWeatherLayer('rainviewer')}
              aria-pressed={activeWeatherLayer === 'rainviewer'}
            >
              <CloudRain size={14} />
              <span>{lang === 'id' ? 'Radar Hujan' : 'Rain Radar'}</span>
            </button>
            <button
              type="button"
              className={`map-layer-btn ${activeWeatherLayer === 'clouds' ? 'active' : ''}`}
              onClick={() => setActiveWeatherLayer('clouds')}
              disabled={!MAP_API_KEY}
              aria-pressed={activeWeatherLayer === 'clouds'}
            >
              <Cloud size={14} />
              <span>{lang === 'id' ? 'Awan' : 'Clouds'}</span>
            </button>
            <button
              type="button"
              className={`map-layer-btn ${activeWeatherLayer === 'temp' ? 'active' : ''}`}
              onClick={() => setActiveWeatherLayer('temp')}
              disabled={!MAP_API_KEY}
              aria-pressed={activeWeatherLayer === 'temp'}
            >
              <Thermometer size={14} />
              <span>{lang === 'id' ? 'Suhu Termal' : 'Thermal'}</span>
            </button>
            <button
              type="button"
              className={`map-layer-btn ${activeWeatherLayer === 'wind' ? 'active' : ''}`}
              onClick={() => setActiveWeatherLayer('wind')}
              disabled={!MAP_API_KEY}
              aria-pressed={activeWeatherLayer === 'wind'}
            >
              <Wind size={14} />
              <span>{lang === 'id' ? 'Kecepatan Angin' : 'Wind Speed'}</span>
            </button>
          </div>
        </div>

        {/* Base Map Style Selector */}
        <div className="radar-deck-group">
          <span className="deck-group-label">
            <Compass size={12} />
            <span>{lang === 'id' ? 'Mode Peta Dasar' : 'Base Map'}</span>
          </span>
          <div className="map-style-group">
            <button
              type="button"
              className={`map-layer-btn ${baseMapStyle === 'dark' ? 'active' : ''}`}
              onClick={() => setBaseMapStyle('dark')}
              aria-pressed={baseMapStyle === 'dark'}
            >
              <Moon size={13} />
              <span>{lang === 'id' ? 'Gelap' : 'Dark'}</span>
            </button>
            <button
              type="button"
              className={`map-layer-btn ${baseMapStyle === 'satellite' ? 'active' : ''}`}
              onClick={() => setBaseMapStyle('satellite')}
              aria-pressed={baseMapStyle === 'satellite'}
            >
              <Globe size={13} />
              <span>{lang === 'id' ? 'Satelit' : 'Satellite'}</span>
            </button>
            <button
              type="button"
              className={`map-layer-btn ${baseMapStyle === 'osm' ? 'active' : ''}`}
              onClick={() => setBaseMapStyle('osm')}
              aria-pressed={baseMapStyle === 'osm'}
            >
              <MapIcon size={13} />
              <span>{lang === 'id' ? 'Topografi' : 'Street'}</span>
            </button>
          </div>
        </div>
      </div>

      {radarError && (
        <p className="radar-error-message" role="status">
          {radarError}
        </p>
      )}

      {/* 3. Upgraded Doppler Timeline Player Bar (Past + Nowcast Forecast) */}
      {activeWeatherLayer === 'rainviewer' && radarFrames.length > 0 && (
        <div className="radar-playback-bar">
          <div className="radar-transport-controls">
            <button
              type="button"
              className="radar-step-btn"
              onClick={() => {
                setIsPlaying(false);
                handleFrameChange(currentFrameIndex - 1);
              }}
              title={lang === 'id' ? 'Frame sebelumnya' : 'Previous frame'}
            >
              <SkipBack size={13} />
            </button>

            <button
              type="button"
              className={`radar-play-btn ${isPlaying ? 'playing' : ''}`}
              onClick={() => setIsPlaying(!isPlaying)}
              title={isPlaying ? t.radarPause : t.radarPlay}
            >
              {isPlaying ? <Pause size={14} /> : <Play size={14} />}
              <span>{isPlaying ? t.radarPause : t.radarPlay}</span>
            </button>

            <button
              type="button"
              className="radar-step-btn"
              onClick={() => {
                setIsPlaying(false);
                handleFrameChange(currentFrameIndex + 1);
              }}
              title={lang === 'id' ? 'Frame berikutnya' : 'Next frame'}
            >
              <SkipForward size={13} />
            </button>

            <button
              type="button"
              className="radar-speed-btn"
              onClick={() => setPlaybackSpeed((s) => (s === 1 ? 2 : 1))}
              title={lang === 'id' ? 'Kecepatan pemutaran animasi' : 'Playback speed'}
            >
              {playbackSpeed}x
            </button>
          </div>

          <div className="radar-slider-container">
            <div className="radar-scrubber-meta">
              <span className={`timeline-label ${isNowcastFrame ? 'nowcast-active' : ''}`}>
                <Clock size={12} />
                <strong>{radarTimestamp}</strong>
                <span className="timeline-rel-tag">{relativeLabel}</span>
              </span>
              <span className="timeline-counter">
                {isNowcastFrame
                  ? lang === 'id'
                    ? 'Prakiraan Pergerakan Awan Hujan (Nowcast)'
                    : 'Radar Nowcast Projection'
                  : lang === 'id'
                    ? 'Observasi Doppler 2 Jam Terakhir'
                    : 'Past 2H Doppler Observation'}{' '}
                &bull; {currentFrameIndex + 1}/{radarFrames.length}
              </span>
            </div>

            <div className="radar-slider-track-wrap">
              <input
                type="range"
                min="0"
                max={radarFrames.length - 1}
                value={currentFrameIndex}
                onChange={(e) => {
                  setIsPlaying(false);
                  handleFrameChange(Number(e.target.value));
                }}
                className="radar-timeline-slider"
                title={t.radarTimeline}
              />
            </div>
          </div>
        </div>
      )}

      {/* 4. Map Container with Floating Telemetry HUD & Dynamic Layer Legend */}
      <div className="map-container-wrap">
        <div
          ref={mapContainerRef}
          className={`leaflet-map-element ${baseMapStyle === 'dark' ? 'map-theme-dark' : ''}`}
        />

        {/* Top-Left Floating Station Coordinate & Click Hint HUD */}
        <div className="map-floating-hud">
          <div className="hud-station-pill">
            <MapPin size={13} color="#38bdf8" />
            <span className="hud-station-city">{cityName}</span>
            <span className="hud-station-coords">{coordsFormatted}</span>
          </div>
          <span className="hud-click-hint">
            {lang === 'id'
              ? 'Klik titik mana pun di peta untuk cek cuaca lokasi tersebut'
              : 'Click anywhere on the map to inspect weather at that coordinate'}
          </span>
        </div>

        {/* Bottom-Left Dynamic Layer Scale Legend */}
        <div className="map-radar-legend">
          {activeWeatherLayer === 'rainviewer' && (
            <>
              <span className="legend-title">
                {lang === 'id' ? 'Intensitas Presipitasi (dBZ):' : 'Precipitation (dBZ):'}
              </span>
              <div className="legend-scale">
                <span className="legend-item">
                  <span className="legend-color-step" style={{ background: '#38bdf8' }} />
                  <span className="legend-label">{lang === 'id' ? 'Gerimis' : 'Light'}</span>
                </span>
                <span className="legend-item">
                  <span className="legend-color-step" style={{ background: '#22c55e' }} />
                  <span className="legend-label">{lang === 'id' ? 'Sedang' : 'Moderate'}</span>
                </span>
                <span className="legend-item">
                  <span className="legend-color-step" style={{ background: '#eab308' }} />
                  <span className="legend-label">{lang === 'id' ? 'Lebat' : 'Heavy'}</span>
                </span>
                <span className="legend-item">
                  <span className="legend-color-step" style={{ background: '#ef4444' }} />
                  <span className="legend-label">{lang === 'id' ? 'Deras' : 'Intense'}</span>
                </span>
                <span className="legend-item">
                  <span className="legend-color-step" style={{ background: '#a855f7' }} />
                  <span className="legend-label">{lang === 'id' ? 'Badai / Es' : 'Storm / Hail'}</span>
                </span>
              </div>
            </>
          )}

          {activeWeatherLayer === 'temp' && (
            <>
              <span className="legend-title">
                {lang === 'id' ? 'Skala Suhu Permukaan:' : 'Surface Temp Scale:'}
              </span>
              <div className="legend-scale">
                <span className="legend-item">
                  <span className="legend-color-step" style={{ background: '#3b82f6' }} />
                  <span className="legend-label">&lt; 0°C</span>
                </span>
                <span className="legend-item">
                  <span className="legend-color-step" style={{ background: '#06b6d4' }} />
                  <span className="legend-label">10°C</span>
                </span>
                <span className="legend-item">
                  <span className="legend-color-step" style={{ background: '#22c55e' }} />
                  <span className="legend-label">20°C</span>
                </span>
                <span className="legend-item">
                  <span className="legend-color-step" style={{ background: '#f59e0b' }} />
                  <span className="legend-label">30°C</span>
                </span>
                <span className="legend-item">
                  <span className="legend-color-step" style={{ background: '#ef4444' }} />
                  <span className="legend-label">&gt; 36°C</span>
                </span>
              </div>
            </>
          )}

          {activeWeatherLayer === 'clouds' && (
            <>
              <span className="legend-title">
                {lang === 'id' ? 'Kerapatan Awan (%):' : 'Cloud Cover (%):'}
              </span>
              <div className="legend-scale">
                <span className="legend-item">
                  <span className="legend-color-step" style={{ background: 'rgba(255,255,255,0.2)' }} />
                  <span className="legend-label">10–30%</span>
                </span>
                <span className="legend-item">
                  <span className="legend-color-step" style={{ background: 'rgba(255,255,255,0.55)' }} />
                  <span className="legend-label">50–75%</span>
                </span>
                <span className="legend-item">
                  <span className="legend-color-step" style={{ background: '#ffffff' }} />
                  <span className="legend-label">90–100% ({lang === 'id' ? 'Pekat' : 'Dense'})</span>
                </span>
              </div>
            </>
          )}

          {activeWeatherLayer === 'wind' && (
            <>
              <span className="legend-title">
                {lang === 'id' ? 'Kecepatan Angin:' : 'Wind Velocity:'}
              </span>
              <div className="legend-scale">
                <span className="legend-item">
                  <span className="legend-color-step" style={{ background: '#38bdf8' }} />
                  <span className="legend-label">{lang === 'id' ? 'Tenang' : 'Calm'}</span>
                </span>
                <span className="legend-item">
                  <span className="legend-color-step" style={{ background: '#34d399' }} />
                  <span className="legend-label">20 km/j</span>
                </span>
                <span className="legend-item">
                  <span className="legend-color-step" style={{ background: '#f59e0b' }} />
                  <span className="legend-label">45 km/j</span>
                </span>
                <span className="legend-item">
                  <span className="legend-color-step" style={{ background: '#ef4444' }} />
                  <span className="legend-label">&gt; 75 km/j</span>
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
